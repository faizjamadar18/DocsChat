"""DocsChat MCP tools: workspace search + document fetch.

Two layers:
1. Pure functions (search/fetch below) — the real logic.
   They take an explicit user_id and reuse the existing
   retrieval pipeline, so MCP answers are grounded exactly
   like Ora's, with source name + page/location.
2. Official MCP SDK registry (guarded import) — the same
   functions registered as SDK tools for `mcp dev` and
   Inspector. Without the SDK the FastAPI route keeps
   working on its own.

Per-call isolation: every function filters by
(user_id, workspace_id). No path reads another user's
documents or vectors.
"""
import asyncio
from typing import Optional

from fastapi import HTTPException, status
from bson import ObjectId

import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.services.rag_service import retrieve_workspace_knowledge
from app.services import vector_store as vs

PASSAGE_CHARS = 1200
FETCH_CHARS = 9000
FETCH_TOP_K = 20

WORKSPACE_SEARCH_DESC = (
    "Search the user's DocsChat workspace (uploaded PDFs, "
    "Studio documents, and connected sources like Notion, "
    "Google Drive, GitHub). "
    "Returns matching passages with source name, page, "
    "and source_id. "
    "Use this for any question about the user's documents. "
    "Call document_fetch with a source_id for full text."
)
DOCUMENT_FETCH_DESC = (
    "Fetch the full text of one workspace document by source_id "
    "(a source_id returned by workspace_search). "
    "Returns the source name and its content, truncated to a safe size."
)


def _require_db():
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not ready",
        )


async def search_workspace_for_user(
    user_id: str,
    workspace_id: str,
    query: str,
    top_k: int = 5,
) -> list[dict]:
    """Search one workspace. Passages carry source + page."""
    _require_db()
    query = (query or "").strip()
    if not query:
        raise ValueError("query must not be empty")
    top_k = max(1, min(int(top_k or 5), 10))

    _, citations = await retrieve_workspace_knowledge(
        user_id=user_id,
        workspace_id=workspace_id,
        query=query,
        top_k=top_k,
    )
    passages: list[dict] = []
    for c in citations or []:
        snippet = str(c.get("snippet") or "")[:PASSAGE_CHARS]
        passages.append(
            {
                "text": snippet,
                "source_name": c.get("filename") or "Unknown source",
                "page": c.get("page"),
                "source_id": c.get("source_id"),
                "score": c.get("similarity_score"),
            }
        )
    return passages


async def fetch_document_for_user(
    user_id: str,
    workspace_id: str,
    source_id: str,
) -> dict:
    """Fetch one owned document. 400 bad id, 404 missing."""
    _require_db()
    if not ObjectId.is_valid(source_id or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source ID",
        )

    # Studio document first (full text lives in MongoDB).
    studio_doc = None
    try:
        studio_doc = await database.documents_collection.find_one(
            {"_id": ObjectId(source_id), "user_id": user_id}
        )
    except Exception:
        studio_doc = None
    if studio_doc:
        text = str(studio_doc.get("content_text") or "")
        truncated = len(text) > FETCH_CHARS
        return {
            "source_id": source_id,
            "source_name": studio_doc.get("title") or "Untitled Document",
            "kind": "document",
            "text": text[:FETCH_CHARS],
            "truncated": truncated,
        }

    # Uploaded / connector source (content lives as chunks in Qdrant).
    source = None
    try:
        source = await database.sources_collection.find_one(
            {"_id": ObjectId(source_id), "user_id": user_id}
        )
    except Exception:
        source = None
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    chunks = await asyncio.to_thread(
        vs.query_workspace_documents,
        user_id=user_id,
        workspace_id=workspace_id,
        query=source.get("filename") or "document content",
        scope_ids=[source_id],
        top_k=FETCH_TOP_K,
    )
    parts: list[str] = []
    for ch in chunks or []:
        meta = ch.get("metadata", {})
        page = meta.get("page")
        label = f"[page {int(page) + 1}] " if isinstance(page, int) else ""
        parts.append(f"{label}{ch.get('document', '')}")
    text = "\n\n---\n\n".join(parts)
    truncated = len(text) > FETCH_CHARS
    return {
        "source_id": source_id,
        "source_name": source.get("filename") or "Unknown source",
        "kind": source.get("source_type") or "file",
        "page_count": source.get("page_count", 0),
        "text": text[:FETCH_CHARS],
        "truncated": truncated,
    }


# Official MCP SDK registry (guarded). Transport via FastAPI.
# ----------------------------------------------------------

try:  # pragma: no cover - SDK presence varies by environment
    from mcp.server.fastmcp import FastMCP as _FastMCP
    from mcp.server.auth.middleware.auth_context import (
        get_access_token as _sdk_get_access_token,
    )
except Exception:  # SDK missing: registry is a passthrough
    _FastMCP = None
    _sdk_get_access_token = None

if _FastMCP is not None:
    mcp = _FastMCP("DocsChat", stateless_http=True)

    def _sdk_caller() -> tuple[str, Optional[str]]:
        get_token = _sdk_get_access_token
        token = get_token() if get_token else None
        if token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )
        claims = getattr(token, "claims", None) or {}
        subject = (
            getattr(token, "subject", None)
            or getattr(token, "sub", None)
            or claims.get("sub")
        )
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token identity",
            )
        extra = getattr(token, "extra", None) or {}
        token_ws = (
            extra.get("workspace_id")
            if isinstance(extra, dict)
            else None
        )
        return str(subject), token_ws

    @mcp.tool(description=WORKSPACE_SEARCH_DESC)
    async def workspace_search(
        query: str,
        top_k: int = 5,
        workspace_id: Optional[str] = None,
    ) -> list[dict]:
        """Search the workspace, return grounded passages."""
        user_id, token_ws = _sdk_caller()
        target_ws = workspace_id or token_ws
        if not target_ws:
            user = await database.users_collection.find_one(
                {"_id": ObjectId(user_id)}
            )
            target_ws = (user or {}).get("active_workspace_id")
        if not target_ws:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No workspace found. Create one first.",
            )
        return await search_workspace_for_user(
            user_id, target_ws, query, top_k
        )

    @mcp.tool(description=DOCUMENT_FETCH_DESC)
    async def document_fetch(
        source_id: str, workspace_id: Optional[str] = None
    ) -> dict:
        """Fetch one workspace document by source_id."""
        user_id, token_ws = _sdk_caller()
        target_ws = workspace_id or token_ws
        if not target_ws:
            user = await database.users_collection.find_one(
                {"_id": ObjectId(user_id)}
            )
            target_ws = (user or {}).get("active_workspace_id")
        if not target_ws:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No workspace found. Create one first.",
            )
        return await fetch_document_for_user(
            user_id, target_ws, source_id
        )
else:

    class _NoMCP:
        def tool(self, *args, **kwargs):
            def deco(fn):
                return fn

            return deco

    mcp = _NoMCP()  # type: ignore
