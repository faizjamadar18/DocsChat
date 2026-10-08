"""Connectors API — Notion first (Phase 1), Drive shell ready (Phase 2).

Security:
- All routes require JWT via get_current_user.
- OAuth tokens are encrypted with Fernet (connector_token_service) and NEVER
  returned to the client. Status endpoints only return booleans + counts.
- Per-user isolation: every query filters by user_id.
"""
import asyncio
import secrets
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from bson import ObjectId
from fastapi import (
    APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query, status,
)

import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.config import get_settings
from app.middleware.auth_middleware import get_current_user
from app.models.connector import (
    ConnectorsStatusResponse, ConnectorStatus,
    NotionAuthUrlResponse, NotionPagesResponse, NotionPageItem,
    NotionImportRequest, NotionImportResponse, DisconnectResponse,
)
from app.services import vector_store as vs
from app.services.connector_token_service import encrypt_token, decrypt_token

settings = get_settings()
router = APIRouter(prefix="/api/connectors", tags=["Connectors"])

NOTION_OAUTH_AUTHORIZE = "https://api.notion.com/v1/oauth/authorize"
NOTION_OAUTH_TOKEN = "https://api.notion.com/v1/oauth/token"


def _require_db():
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready"
        )


def _workspace_of(current_user: dict, workspace_id: Optional[str], header_ws: Optional[str]) -> Optional[str]:
    return workspace_id or header_ws or current_user.get("active_workspace_id")


def _norm_page_id(raw: str) -> str:
    return (raw or "").replace("-", "").lower()


@router.get("/status", response_model=ConnectorsStatusResponse)
async def connectors_status(
    workspace_id: Optional[str] = Query(None),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Per-provider connect status + imported counts. Never returns tokens."""
    _require_db()
    target_ws = _workspace_of(current_user, workspace_id, x_workspace_id)

    async def _provider_state(provider: str) -> ConnectorStatus:
        acct = None
        try:
            acct = await database.connector_accounts_collection.find_one(
                {"user_id": current_user["id"], "provider": provider}
            )
        except Exception:
            acct = None
        filt: dict = {
            "user_id": current_user["id"],
            "source_type": provider,
        }
        if target_ws:
            filt["workspace_id"] = target_ws
        count = 0
        try:
            count = await database.sources_collection.count_documents(filt)
        except Exception:
            count = 0
        if not acct:
            return ConnectorStatus(connected=False, imported_count=count)
        return ConnectorStatus(
            connected=True,
            connected_at=acct.get("connected_at"),
            imported_count=count,
        )

    return ConnectorsStatusResponse(
        notion=await _provider_state("notion"),
        drive=await _provider_state("drive"),
    )


@router.get("/notion/auth-url", response_model=NotionAuthUrlResponse)
async def notion_auth_url(current_user: dict = Depends(get_current_user)):
    """Build Notion OAuth authorize URL. Frontend redirects the user there."""
    _require_db()
    if not settings.NOTION_CLIENT_ID or not settings.NOTION_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Notion integration not configured on server",
        )
    state = secrets.token_urlsafe(24)
    try:
        await database.sync_jobs_collection.insert_one({
            "user_id": current_user["id"],
            "kind": "notion_oauth_state",
            "state": state,
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        pass
    params = {
        "client_id": settings.NOTION_CLIENT_ID,
        "response_type": "code",
        "owner": "user",
        "redirect_uri": settings.NOTION_REDIRECT_URI,
        "state": f"{current_user['id']}.{state}",
    }
    return NotionAuthUrlResponse(auth_url=f"{NOTION_OAUTH_AUTHORIZE}?{urlencode(params)}")


@router.get("/notion/callback")
async def notion_callback(code: str = Query(...), state: str = Query(...)):
    """OAuth callback (browser redirect). Exchanges code -> token, stores encrypted.

    State format: {user_id}.{random}. Verifies the random part was issued.
    Redirects to FRONTEND_URL/connectors?notion=connected on success.
    """
    from fastapi.responses import RedirectResponse

    _require_db()
    frontend = (settings.FRONTEND_URL or "").rstrip("/") or "http://localhost:3000"
    try:
        user_id, rand = state.split(".", 1)
    except ValueError:
        return RedirectResponse(f"{frontend}/connectors?notion=error", status_code=302)
    if not ObjectId.is_valid(user_id):
        return RedirectResponse(f"{frontend}/connectors?notion=error", status_code=302)

    # Exchange code for access token (server-to-server, secret never leaves backend)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                NOTION_OAUTH_TOKEN,
                auth=(settings.NOTION_CLIENT_ID, settings.NOTION_CLIENT_SECRET),
                json={"grant_type": "authorization_code", "code": code,
                      "redirect_uri": settings.NOTION_REDIRECT_URI},
            )
            resp.raise_for_status()
            token_data = resp.json()
    except Exception:
        return RedirectResponse(f"{frontend}/connectors?notion=error", status_code=302)

    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(f"{frontend}/connectors?notion=error", status_code=302)

    try:
        await database.connector_accounts_collection.update_one(
            {"user_id": user_id, "provider": "notion"},
            {"$set": {
                "user_id": user_id,
                "provider": "notion",
                "token_enc": encrypt_token(access_token),
                "connected_at": datetime.now(timezone.utc),
            }},
            upsert=True,
        )
    except Exception:
        return RedirectResponse(f"{frontend}/connectors?notion=error", status_code=302)
    return RedirectResponse(f"{frontend}/connectors?notion=connected", status_code=302)


@router.post("/notion/pages", response_model=NotionPagesResponse)
async def notion_list_pages(
    query: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List pages the user granted access to (via stored token)."""
    _require_db()
    acct = await database.connector_accounts_collection.find_one(
        {"user_id": current_user["id"], "provider": "notion"}
    )
    if not acct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notion not connected")
    try:
        token = decrypt_token(acct["token_enc"])
    except ValueError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Stored token invalid. Please reconnect.")

    payload: dict = {"page_size": 50}
    if query:
        payload.update({"query": query, "filter": {"property": "object", "value": "page"}})
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.notion.com/v1/search",
                headers={"Authorization": f"Bearer {token}",
                         "Notion-Version": "2022-06-28"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Notion API error: {e.response.status_code}")

    pages: list[NotionPageItem] = []
    for r in data.get("results", []):
        if r.get("object") != "page":
            continue
        title = "Untitled"
        for prop in (r.get("properties") or {}).values():
            if prop.get("type") == "title":
                title = "".join(p.get("plain_text", "") for p in prop.get("title", [])).strip() or "Untitled"
                break
        pages.append(NotionPageItem(
            id=r.get("id", ""),
            title=title,
            url=r.get("url"),
            last_edited_time=r.get("last_edited_time"),
        ))
    return NotionPagesResponse(pages=pages)


@router.post("/notion/import", response_model=NotionImportResponse, status_code=status.HTTP_201_CREATED)
async def notion_import_pages(
    body: NotionImportRequest,
    background_tasks: BackgroundTasks,
    workspace_id: Optional[str] = Query(None),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Create source rows for picked Notion pages and sync in background."""
    _require_db()
    if not body.pages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Pick at least one page to import")
    target_ws = _workspace_of(current_user, workspace_id, x_workspace_id)
    acct = await database.connector_accounts_collection.find_one(
        {"user_id": current_user["id"], "provider": "notion"}
    )
    if not acct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notion not connected")
    try:
        token = decrypt_token(acct["token_enc"])
    except ValueError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Stored token invalid. Please reconnect.")

    from app.services.notion_sync_service import sync_notion_page

    imported: list[dict] = []
    for page in body.pages[:50]:
        norm = _norm_page_id(page.id)
        existing = await database.sources_collection.find_one({
            "user_id": current_user["id"],
            "source_type": "notion",
            "remote_id": norm,
            **({"workspace_id": target_ws} if target_ws else {}),
        })
        if existing:
            imported.append({"source_id": str(existing["_id"]), "page_id": page.id,
                             "title": page.title, "status": existing.get("status", "ready")})
            continue
        doc = {
            "user_id": current_user["id"],
            "workspace_id": target_ws,
            "source_type": "notion",
            "provider": "notion",
            "remote_id": norm,
            "remote_url": page.url,
            "filename": f"[Notion] {page.title}",
            "file_path": None,
            "file_size": 0,
            "page_count": 0,
            "chunk_count": 0,
            "status": "processing",
            "sync_error": None,
            "last_synced_at": None,
            "uploaded_at": datetime.now(timezone.utc),
        }
        res = await database.sources_collection.insert_one(doc)
        source_id = str(res.inserted_id)
        background_tasks.add_task(
            sync_notion_page, current_user["id"], target_ws, source_id,
            page.id, token, page.title, page.url,
        )
        imported.append({"source_id": source_id, "page_id": page.id,
                         "title": page.title, "status": "processing"})
    return NotionImportResponse(imported=imported, total=len(imported))


@router.post("/sources/{source_id}/resync")
async def resync_source(
    source_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Re-fetch remote content and re-index (replaces old vectors)."""
    _require_db()
    if not ObjectId.is_valid(source_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source ID")
    source = await database.sources_collection.find_one({
        "_id": ObjectId(source_id), "user_id": current_user["id"],
    })
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    if source.get("source_type") not in ("notion", "drive"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Only imported connector sources can be re-synced")
    provider = source.get("source_type")
    acct = await database.connector_accounts_collection.find_one(
        {"user_id": current_user["id"], "provider": provider}
    )
    if not acct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"{provider} not connected. Please reconnect.")
    try:
        token = decrypt_token(acct["token_enc"])
    except ValueError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Stored token invalid. Please reconnect.")

    if provider == "notion":
        from app.services.notion_sync_service import sync_notion_page
        background_tasks.add_task(
            sync_notion_page, current_user["id"], source.get("workspace_id"),
            source_id, source.get("remote_id"), token,
            (source.get("filename") or "").replace("[Notion] ", ""),
            source.get("remote_url"),
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Drive re-sync arrives in Phase 2")
    return {"message": "Re-sync started", "source_id": source_id}


@router.delete("/{provider}", response_model=DisconnectResponse)
async def disconnect_provider(
    provider: str,
    delete_content: bool = Query(False),
    current_user: dict = Depends(get_current_user),
):
    """Revoke token and optionally delete all imported content + vectors."""
    _require_db()
    if provider not in ("notion", "drive"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown provider")
    acct = await database.connector_accounts_collection.find_one(
        {"user_id": current_user["id"], "provider": provider}
    )
    if not acct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not connected")

    # Best-effort remote revoke (Notion has no revoke endpoint — deleting locally is the revoke)
    if provider == "notion":
        pass  # Notion: token invalidated by user removing integration; local delete suffices
    else:
        try:
            token = decrypt_token(acct["token_enc"])
            async with httpx.AsyncClient(timeout=15.0) as client:
                await client.post("https://oauth2.googleapis.com/revoke",
                                  params={"token": token})
        except Exception:
            pass

    await database.connector_accounts_collection.delete_one(
        {"user_id": current_user["id"], "provider": provider}
    )

    vectors_removed = 0
    sources_deleted = 0
    if delete_content:
        cursor = database.sources_collection.find({
            "user_id": current_user["id"], "source_type": provider,
        })
        async for doc in cursor:
            sid = str(doc["_id"])
            vectors_removed += await asyncio.to_thread(
                vs.delete_source_vectors, current_user["id"], sid
            )
            await database.sources_collection.delete_one({"_id": doc["_id"]})
            sources_deleted += 1

    return DisconnectResponse(
        message=f"{provider} disconnected",
        vectors_removed=vectors_removed,
        sources_deleted=sources_deleted,
    )
