"""Remote MCP endpoint (Streamable HTTP, stateless JSON mode).

Speaks MCP JSON-RPC over plain HTTPS POST, served by FastAPI so it shares the
app's lifespan, CORS, and error handling:
- POST /mcp and POST /api/mcp (same handler; /api/* keeps local-dev Next
  rewrites working, /mcp is the canonical public URL for Claude/Grok)
- Methods: initialize, notifications/initialized, tools/list, tools/call
  with two read-only tools: workspace_search + document_fetch
- Auth: every request needs `Authorization: Bearer <token>` (OAuth JWT from
  the sign-in flow, or a personal `dsk_...` key). Missing/invalid tokens get
  HTTP 401 with a WWW-Authenticate resource_metadata pointer, which is the
  exact handshake Claude uses to discover the OAuth server and start sign-in.
"""
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.services.mcp_auth import resolve_mcp_token, resolve_workspace
from app.services.mcp_server import (
    DOCUMENT_FETCH_DESC,
    WORKSPACE_SEARCH_DESC,
    fetch_document_for_user,
    search_workspace_for_user,
)

settings = get_settings()
router = APIRouter(tags=["MCP Server"])

MCP_PROTOCOL_VERSION = "2025-11-25"


def _unauthorized(request: Request) -> JSONResponse:
    base = (settings.MCP_ISSUER_URL or settings.MCP_SERVER_URL or "").strip().rstrip("/")
    if not base:
        base = str(request.base_url).rstrip("/")
    metadata_url = f"{base}/.well-known/oauth-protected-resource/mcp"
    return JSONResponse(
        status_code=401,
        content={"error": "invalid_token", "error_description": "Authentication required"},
        headers={
            "WWW-Authenticate": (
                'Bearer error="invalid_token", '
                'error_description="Authentication required", '
                f'resource_metadata="{metadata_url}"'
            )
        },
    )


def _rpc_result(rpc_id, result: dict) -> JSONResponse:
    return JSONResponse(
        {"jsonrpc": "2.0", "id": rpc_id, "result": result},
        headers={"Content-Type": "application/json"},
    )


def _rpc_error(rpc_id, code: int, message: str, data=None) -> JSONResponse:
    err: dict = {"code": code, "message": message}
    if data is not None:
        err["data"] = data
    return JSONResponse({"jsonrpc": "2.0", "id": rpc_id, "error": err})


def _tools_list() -> dict:
    return {
        "tools": [
            {
                "name": "workspace_search",
                "description": WORKSPACE_SEARCH_DESC,
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Question or keywords to search in the workspace",
                        },
                        "top_k": {
                            "type": "integer",
                            "description": "How many passages to return (1-10, default 5)",
                            "default": 5,
                        },
                        "workspace_id": {
                            "type": "string",
                            "description": "Optional workspace id (defaults to the key's workspace)",
                        },
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "document_fetch",
                "description": DOCUMENT_FETCH_DESC,
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "source_id": {
                            "type": "string",
                            "description": "source_id from a workspace_search result",
                        },
                        "workspace_id": {
                            "type": "string",
                            "description": "Optional workspace id (defaults to the key's workspace)",
                        },
                    },
                    "required": ["source_id"],
                },
            },
        ]
    }


async def _handle_mcp_request(request: Request, authorization: Optional[str]) -> JSONResponse:
    # 1. Authenticate -> exactly one user.
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        return _unauthorized(request)
    try:
        identity = await resolve_mcp_token(token)
    except HTTPException as exc:
        if exc.status_code == 401:
            return _unauthorized(request)
        raise

    # 2. Parse JSON-RPC.
    try:
        body = await request.json()
    except Exception:
        return _rpc_error(None, -32700, "Parse error")
    if not isinstance(body, dict):
        return _rpc_error(None, -32600, "Invalid Request")
    method = body.get("method")
    params = body.get("params") or {}
    rpc_id = body.get("id")

    # Notifications (no id) get an empty 202 in stateless mode.
    if rpc_id is None:
        return JSONResponse(status_code=202, content={})

    try:
        if method == "initialize":
            return _rpc_result(
                rpc_id,
                {
                    "protocolVersion": MCP_PROTOCOL_VERSION,
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "docschat", "version": "1.0.0"},
                },
            )
        if method == "tools/list":
            return _rpc_result(rpc_id, _tools_list())
        if method == "tools/call":
            name = params.get("name")
            args = params.get("arguments") or {}
            if name == "workspace_search":
                query = (args.get("query") or "").strip()
                if not query:
                    return _rpc_error(rpc_id, -32602, "query is required")
                top_k = args.get("top_k") or 5
                workspace_id = await resolve_workspace(
                    identity["user_id"],
                    args.get("workspace_id"),
                    identity.get("workspace_id"),
                )
                passages = await search_workspace_for_user(
                    identity["user_id"], workspace_id, query, int(top_k)
                )
                import json as _json

                return _rpc_result(
                    rpc_id,
                    {
                        "content": [
                            {
                                "type": "text",
                                "text": _json.dumps(
                                    {"passages": passages, "workspace_id": workspace_id}
                                ),
                            }
                        ]
                    },
                )
            if name == "document_fetch":
                source_id = args.get("source_id")
                if not source_id:
                    return _rpc_error(rpc_id, -32602, "source_id is required")
                workspace_id = await resolve_workspace(
                    identity["user_id"],
                    args.get("workspace_id"),
                    identity.get("workspace_id"),
                )
                doc = await fetch_document_for_user(
                    identity["user_id"], workspace_id, source_id
                )
                import json as _json

                return _rpc_result(
                    rpc_id,
                    {
                        "content": [
                            {"type": "text", "text": _json.dumps(doc)}
                        ]
                    },
                )
            return _rpc_error(rpc_id, -32602, f"Unknown tool: {name}")
        return _rpc_error(rpc_id, -32601, f"Method not found: {method}")
    except HTTPException as exc:
        return _rpc_error(rpc_id, -32000, exc.detail or "Tool error")
    except ValueError as exc:
        return _rpc_error(rpc_id, -32602, str(exc) or "Invalid params")


@router.post("/mcp")
async def mcp_endpoint(request: Request, authorization: Optional[str] = Header(None)):
    return await _handle_mcp_request(request, authorization)


@router.post("/api/mcp")
async def mcp_endpoint_aliased(request: Request, authorization: Optional[str] = Header(None)):
    """Same handler under /api/* so local-dev Next rewrites reach it."""
    return await _handle_mcp_request(request, authorization)


@router.get("/mcp")
async def mcp_get(request: Request, authorization: Optional[str] = Header(None)):
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        return _unauthorized(request)
    try:
        identity = await resolve_mcp_token(token)
    except HTTPException as exc:
        if exc.status_code == 401:
            return _unauthorized(request)
        raise
    return {"name": "docschat", "transport": "streamable-http", "user_id": identity["user_id"]}


@router.delete("/mcp")
async def mcp_delete():
    # Stateless mode keeps no sessions; confirm there is nothing to close.
    return JSONResponse(status_code=405, content={"error": "stateless server: no session"})
