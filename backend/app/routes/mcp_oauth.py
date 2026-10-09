"""OAuth 2.1 endpoints for the MCP sign-in flow Claude uses.

Implements what Claude's custom-connector docs require:
- RFC 9728 protected-resource metadata (pointer on 401s)
- Authorization-server metadata (RFC 8414): DCR + PKCE
- Dynamic Client Registration: POST /oauth/register
- Authorization endpoint: GET /oauth/authorize (redirects
  to the frontend approve page for logged-in approval)
- Token endpoint: POST /oauth/token (code + refresh)
- Approve helper: POST /api/mcp/oauth/approve (JWT)
- Server info: GET /api/mcp/info (JWT)

Claude's fixed callback to allowlist on our side:
    https://claude.ai/api/mcp/auth_callback
plus loopback http://localhost/callback and
http://127.0.0.1/callback (port-agnostic) for Code.
"""
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Query,
    Request,
    status,
)
from fastapi.responses import JSONResponse, RedirectResponse

import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.config import get_settings
from app.middleware.auth_middleware import get_current_user
from app.models.mcp import (
    OAuthApproveRequest,
    OAuthApproveResponse,
    McpInfoResponse,
)
from app.services.auth_service import create_access_token
from app.services.mcp_providers import get_providers
from app.services.mcp_oauth import (
    auth_code_expiry,
    hash_token,
    new_client_id,
    new_code,
    new_refresh_token,
    utcnow,
    verify_pkce,
)

settings = get_settings()
router = APIRouter(tags=["MCP OAuth"])

MCP_PROTOCOL_VERSION = "2025-11-25"
MCP_SCOPE = "workspace:read"


def _require_db():
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not ready",
        )


def _public_base(request: Request) -> str:
    """Public origin of this backend (config wins)."""
    for candidate in (settings.MCP_SERVER_URL, settings.MCP_ISSUER_URL):
        if candidate and candidate.strip():
            return candidate.strip().rstrip("/")
    return str(request.base_url).rstrip("/")


def _mcp_resource_url(request: Request) -> str:
    base = _public_base(request)
    if base.endswith("/mcp"):
        return base
    return f"{base}/mcp"


def _issuer_url(request: Request) -> str:
    if settings.MCP_ISSUER_URL and settings.MCP_ISSUER_URL.strip():
        return settings.MCP_ISSUER_URL.strip().rstrip("/")
    base = _public_base(request)
    return base[:-4] if base.endswith("/mcp") else base


def _endpoints(request: Request) -> dict:
    issuer = _issuer_url(request)
    return {
        "issuer": issuer,
        "authorization_endpoint": f"{issuer}/oauth/authorize",
        "token_endpoint": f"{issuer}/oauth/token",
        "registration_endpoint": f"{issuer}/oauth/register",
    }


def _oauth_error(
    error: str, description: str, status_code: int = 400
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": error, "error_description": description},
    )


# ---------------------------------------------------------------------------
# Discovery metadata
# ---------------------------------------------------------------------------

async def _protected_resource_doc(request: Request) -> dict:
    resource = _mcp_resource_url(request)
    return {
        "resource": resource,
        "resource_name": "DocsChat",
        "authorization_servers": [_issuer_url(request)],
        "scopes_supported": [MCP_SCOPE],
        "bearer_methods_supported": ["header"],
    }


@router.get("/.well-known/oauth-protected-resource/mcp")
async def protected_resource_mcp(request: Request):
    """Discovery doc matching the exact MCP server URL."""
    return await _protected_resource_doc(request)


@router.get("/.well-known/oauth-protected-resource")
async def protected_resource_root(request: Request):
    """Fallback doc (probed when no 401 pointer exists)."""
    return await _protected_resource_doc(request)


async def _auth_server_doc(request: Request) -> dict:
    eps = _endpoints(request)
    return {
        "issuer": eps["issuer"],
        "authorization_endpoint": eps["authorization_endpoint"],
        "token_endpoint": eps["token_endpoint"],
        "registration_endpoint": eps["registration_endpoint"],
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "code_challenge_methods_supported": ["S256"],
        # Public client (PKCE, no secret) + CIMD support for Claude.
        "token_endpoint_auth_methods_supported": ["none"],
        "client_id_metadata_document_supported": True,
        "scopes_supported": [MCP_SCOPE, "offline_access"],
    }


@router.get("/.well-known/oauth-authorization-server")
async def auth_server_metadata(request: Request):
    return await _auth_server_doc(request)


@router.get("/.well-known/openid-configuration")
async def openid_configuration(request: Request):
    return await _auth_server_doc(request)


# ---------------------------------------------------------------------------
# Dynamic Client Registration (RFC 7591)
# ---------------------------------------------------------------------------

@router.post("/oauth/register")
async def oauth_register(request: Request):
    """Register Claude as a public PKCE client (no secret)."""
    _require_db()
    try:
        body = await request.json()
    except Exception:
        body = {}
    redirect_uris = body.get("redirect_uris") or []
    if not isinstance(redirect_uris, list) or not redirect_uris:
        return _oauth_error(
            "invalid_client_metadata", "redirect_uris is required"
        )
    for uri in redirect_uris:
        if not isinstance(uri, str):
            return _oauth_error("invalid_client_metadata", "Bad redirect_uri")
        low = uri.lower()
        is_https = low.startswith("https://")
        is_loopback = low.startswith(
            "http://localhost"
        ) or low.startswith("http://127.0.0.1")
        if not (is_https or is_loopback):
            return _oauth_error(
                "invalid_client_metadata",
                "redirect_uri must be https or loopback",
            )

    client_id = new_client_id()
    try:
        await database.oauth_clients_collection.update_one(
            {"client_id": client_id},
            {
                "$set": {
                    "client_id": client_id,
                    "client_name": str(
                        body.get("client_name") or "Claude"
                    )[:100],
                    "redirect_uris": redirect_uris,
                    "created_at": utcnow(),
                }
            },
            upsert=True,
        )
    except Exception:
        return _oauth_error(
            "server_error", "Could not store OAuth client", 500
        )

    eps = _endpoints(request)
    return JSONResponse(
        status_code=201,
        content={
            "client_id": client_id,
            "client_name": str(
                body.get("client_name") or "Claude"
            )[:100],
            "redirect_uris": redirect_uris,
            "token_endpoint_auth_method": "none",
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
            "scope": MCP_SCOPE,
            "registration_client_uri": (
                f"{eps['issuer']}/oauth/register/{client_id}"
            ),
        },
    )


# ---------------------------------------------------------------------------
# Authorization endpoint -> frontend approve page
# ---------------------------------------------------------------------------

@router.get("/oauth/authorize")
async def oauth_authorize(
    request: Request,
    response_type: str = Query(...),
    client_id: str = Query(...),
    redirect_uri: str = Query(...),
    scope: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    code_challenge: Optional[str] = Query(None),
    code_challenge_method: Optional[str] = Query("S256"),
    resource: Optional[str] = Query(None),
):
    """Validate, then hand the user to the frontend to approve.

    The browser holds no session cookie (JWT is in
    localStorage), so this endpoint never renders login UI —
    the approve page creates the code and bounces back.
    """
    _require_db()
    if response_type != "code":
        return RedirectResponse(
            f"{redirect_uri}?error=unsupported_response_type"
            + (f"&state={state}" if state else ""),
            status_code=302,
        )
    if not code_challenge:
        return RedirectResponse(
            f"{redirect_uri}?error=invalid_request"
            f"&error_description=PKCE+required"
            + (f"&state={state}" if state else ""),
            status_code=302,
        )
    client = await database.oauth_clients_collection.find_one(
        {"client_id": client_id}
    )
    if not client or redirect_uri not in (
        client.get("redirect_uris") or []
    ):
        return _oauth_error(
            "invalid_request", "Unknown client or redirect_uri"
        )

    frontend = (settings.FRONTEND_URL or "").rstrip("/")
    frontend = frontend or "http://localhost:3000"
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope or MCP_SCOPE,
        "state": state or "",
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method or "S256",
        "resource": resource or "",
    }
    return RedirectResponse(
        f"{frontend}/mcp/authorize?{urlencode(params)}",
        status_code=302,
    )


@router.post(
    "/api/mcp/oauth/approve", response_model=OAuthApproveResponse
)
async def oauth_approve(
    body: OAuthApproveRequest,
    current_user: dict = Depends(get_current_user),
):
    """Approved user -> mint a single-use authorization code."""
    _require_db()
    client = await database.oauth_clients_collection.find_one(
        {"client_id": body.client_id}
    )
    if not client or body.redirect_uri not in (
        client.get("redirect_uris") or []
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown client or redirect_uri",
        )
    if not body.code_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PKCE code_challenge required",
        )

    workspace_id = body.workspace_id or current_user.get("active_workspace_id")
    code = new_code()
    await database.oauth_codes_collection.insert_one(
        {
            "code": code,
            "user_id": current_user["id"],
            "email": current_user.get("email", ""),
            "workspace_id": workspace_id,
            "client_id": body.client_id,
            "redirect_uri": body.redirect_uri,
            "scope": body.scope or MCP_SCOPE,
            "code_challenge": body.code_challenge,
            "code_challenge_method": body.code_challenge_method or "S256",
            "expires_at": auth_code_expiry(),
            "created_at": utcnow(),
        }
    )
    sep = "&" if "?" in body.redirect_uri else "?"
    redirect_url = f"{body.redirect_uri}{sep}code={code}"
    if body.state:
        redirect_url += f"&state={body.state}"
    return OAuthApproveResponse(redirect_url=redirect_url)


# ---------------------------------------------------------------------------
# Token endpoint (form-urlencoded)
# ---------------------------------------------------------------------------

@router.post("/oauth/token")
async def oauth_token(
    request: Request,
    grant_type: str = Form(...),
    code: Optional[str] = Form(None),
    redirect_uri: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    code_verifier: Optional[str] = Form(None),
    refresh_token: Optional[str] = Form(None),
    scope: Optional[str] = Form(None),
):
    """Exchange a code for tokens, or rotate one. RFC errors."""
    _require_db()

    if grant_type == "authorization_code":
        missing = (
            not code
            or not redirect_uri
            or not client_id
            or not code_verifier
        )
        if missing:
            return _oauth_error(
                "invalid_request", "Missing code exchange fields"
            )
        stored = await database.oauth_codes_collection.find_one(
            {"code": code}
        )
        if not stored:
            return _oauth_error(
                "invalid_grant", "Authorization code not found"
            )
        # Single use.
        await database.oauth_codes_collection.delete_one({"code": code})
        exp = stored.get("expires_at")
        if exp:
            if isinstance(exp, str):
                try:
                    exp = datetime.fromisoformat(exp)
                except ValueError:
                    exp = None
            aware_exp = exp
            if aware_exp is not None and aware_exp.tzinfo is None:
                aware_exp = aware_exp.replace(tzinfo=timezone.utc)
            if aware_exp is not None and aware_exp < utcnow():
                return _oauth_error(
                    "invalid_grant", "Authorization code expired"
                )
        if stored.get("client_id") != client_id or stored.get(
            "redirect_uri"
        ) != redirect_uri:
            return _oauth_error(
                "invalid_grant", "Code was issued to another client"
            )
        if not verify_pkce(
            code_verifier,
            stored.get("code_challenge", ""),
            stored.get("code_challenge_method") or "S256",
        ):
            return _oauth_error("invalid_grant", "PKCE verification failed")

        user_id = stored["user_id"]
        email = stored.get("email", "")
        access = create_access_token(user_id, email)
        refresh = new_refresh_token()
        await database.oauth_tokens_collection.insert_one(
            {
                "token_hash": hash_token(refresh),
                "user_id": user_id,
                "email": email,
                "workspace_id": stored.get("workspace_id"),
                "client_id": client_id,
                "scope": stored.get("scope") or MCP_SCOPE,
                "created_at": utcnow(),
                "revoked": False,
            }
        )
        return {
            "access_token": access,
            "token_type": "Bearer",
            "expires_in": 86400,
            "refresh_token": refresh,
            "scope": stored.get("scope") or MCP_SCOPE,
        }

    if grant_type == "refresh_token":
        if not refresh_token:
            return _oauth_error(
                "invalid_request", "Missing refresh_token"
            )
        stored = await database.oauth_tokens_collection.find_one(
            {
                "token_hash": hash_token(refresh_token),
                "revoked": False,
            }
        )
        if not stored:
            return _oauth_error(
                "invalid_grant", "Refresh token no longer valid"
            )
        # Rotate: revoke the old one, issue a fresh pair.
        await database.oauth_tokens_collection.update_one(
            {"token_hash": hash_token(refresh_token)},
            {"$set": {"revoked": True, "revoked_at": utcnow()}},
        )
        access = create_access_token(
            stored["user_id"], stored.get("email", "")
        )
        new_refresh = new_refresh_token()
        await database.oauth_tokens_collection.insert_one(
            {
                "token_hash": hash_token(new_refresh),
                "user_id": stored["user_id"],
                "email": stored.get("email", ""),
                "workspace_id": stored.get("workspace_id"),
                "client_id": stored.get("client_id"),
                "scope": stored.get("scope") or MCP_SCOPE,
                "created_at": utcnow(),
                "revoked": False,
            }
        )
        return {
            "access_token": access,
            "token_type": "Bearer",
            "expires_in": 86400,
            "refresh_token": new_refresh,
            "scope": stored.get("scope") or MCP_SCOPE,
        }

    return _oauth_error(
        "unsupported_grant_type",
        "Only authorization_code/refresh_token",
    )


# ---------------------------------------------------------------------------
# Server info for the frontend tab
# ---------------------------------------------------------------------------

@router.get("/api/mcp/info", response_model=McpInfoResponse)
async def mcp_info(
    request: Request, current_user: dict = Depends(get_current_user)
):
    """Server URL for the frontend tab copy button."""
    return McpInfoResponse(
        server_url=_mcp_resource_url(request),
        issuer=_issuer_url(request),
        workspace_id=current_user.get("active_workspace_id"),
    )


# ---------------------------------------------------------------------------
# Provider catalog for the tab (public: display copy only, no secrets)
# ---------------------------------------------------------------------------

@router.get("/api/mcp/providers")
async def mcp_providers():
    """Full provider catalog: copy, steps and status per AI app."""
    return {"providers": get_providers()}
