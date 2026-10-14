"""Team MCP contract (TDD — written before implementation).

- resolve_workspace: member ok, stranger 404, bad id 400.
- search_workspace_for_user: member searches shared corpus, stranger blocked.
- fetch_document_for_user: member fetches shared doc, stranger 404,
  doc from another workspace 404.
- Personal keys stay per-user (covered in test_mcp.py).
"""
import pytest
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from fastapi import HTTPException

OWNER_ID = str(ObjectId())
MEMBER_ID = str(ObjectId())
STRANGER_ID = str(ObjectId())
WS_ID = str(ObjectId())
SRC_ID = str(ObjectId())


def _ws_doc():
    return {"_id": ObjectId(WS_ID), "owner_id": OWNER_ID, "name": "Design HQ",
            "members": [{"user_id": OWNER_ID, "role": "owner"},
                        {"user_id": MEMBER_ID, "role": "viewer"}]}


@pytest.mark.asyncio
async def test_resolve_workspace_member_ok_stranger_404_bad_id_400():
    from app.services.mcp_auth import resolve_workspace
    with patch("app.database.workspaces_collection") as mock_ws, \
         patch("app.database.users_collection") as mock_users, \
         patch("app.database.check_db"):
        mock_ws.find_one = AsyncMock(return_value=_ws_doc())
        assert await resolve_workspace(MEMBER_ID, WS_ID) == WS_ID
        assert await resolve_workspace(OWNER_ID, WS_ID) == WS_ID
        with pytest.raises(HTTPException) as exc:
            await resolve_workspace(STRANGER_ID, WS_ID)
        assert exc.value.status_code == 404
        with pytest.raises(HTTPException) as exc2:
            await resolve_workspace(MEMBER_ID, "nope")
        assert exc2.value.status_code == 400


@pytest.mark.asyncio
async def test_mcp_search_member_shared_stranger_blocked():
    from app.services.mcp_server import search_workspace_for_user
    with patch("app.database.workspaces_collection") as mock_ws, \
         patch("app.database.check_db"), \
         patch("app.services.mcp_server.check_db"), \
         patch("app.services.mcp_server.retrieve_workspace_knowledge",
               new=AsyncMock(return_value=("ctx", [
                   {"source_id": SRC_ID, "filename": "owner.pdf", "page": 1,
                    "snippet": "abc", "similarity_score": 0.9}]))):
        mock_ws.find_one = AsyncMock(return_value=_ws_doc())
        passages = await search_workspace_for_user(MEMBER_ID, WS_ID, "roadmap")
        assert len(passages) == 1
        assert passages[0]["source_id"] == SRC_ID
        with pytest.raises(HTTPException) as exc:
            await search_workspace_for_user(STRANGER_ID, WS_ID, "roadmap")
        assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_mcp_fetch_member_ok_other_workspace_404():
    from app.services.mcp_server import fetch_document_for_user
    doc = {"_id": ObjectId(SRC_ID), "workspace_id": WS_ID,
           "user_id": OWNER_ID, "title": "Roadmap", "content_text": "text here"}
    with patch("app.database.workspaces_collection") as mock_ws, \
         patch("app.database.documents_collection") as mock_docs, \
         patch("app.database.sources_collection") as mock_src, \
         patch("app.database.check_db"), \
         patch("app.services.mcp_server.check_db"):
        mock_ws.find_one = AsyncMock(return_value=_ws_doc())
        mock_docs.find_one = AsyncMock(return_value=doc)
        got = await fetch_document_for_user(MEMBER_ID, WS_ID, SRC_ID)
        assert got["source_name"] == "Roadmap"
        assert "text here" in got["text"]
        # doc lives in WS_ID but caller asks via OTHER_WS they belong to?
        # stranger blocked:
        mock_docs.find_one = AsyncMock(return_value=doc)
        with pytest.raises(HTTPException) as exc:
            await fetch_document_for_user(STRANGER_ID, WS_ID, SRC_ID)
        assert exc.value.status_code == 404
        # doc from another workspace not visible via this workspace:
        mock_docs.find_one = AsyncMock(return_value=None)
        mock_src.find_one = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc2:
            await fetch_document_for_user(MEMBER_ID, WS_ID, SRC_ID)
        assert exc2.value.status_code == 404
