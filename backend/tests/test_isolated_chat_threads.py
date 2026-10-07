import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "faiz@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())


@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.messages_collection") as mock_messages, \
         patch("app.database.chat_threads_collection") as mock_threads:
        with patch("app.routes.chat.check_db"):
            mock_users.find_one = AsyncMock(return_value={
                "_id": ObjectId(USER_ID),
                "email": USER_EMAIL,
                "username": "Faiz",
                "active_workspace_id": WORKSPACE_ID,
            })
            yield {"users": mock_users, "messages": mock_messages, "threads": mock_threads}


def test_list_threads_filters_by_mode(mock_db):
    """Ensure GET /api/chat/threads?mode=assets only queries mode=assets threads."""
    now = datetime.now(timezone.utc)
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = [
        {
            "_id": ObjectId(),
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "title": "Analysis of Contract PDF",
            "mode": "assets",
            "attached_scope": {"id": "src_1", "title": "Contract.pdf", "type": "asset"},
            "created_at": now,
            "updated_at": now,
        }
    ]
    mock_db["threads"].find.return_value.sort.return_value = mock_cursor

    response = client.get(
        f"/api/chat/threads?workspace_id={WORKSPACE_ID}&mode=assets",
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["threads"][0]["mode"] == "assets"
    assert data["threads"][0]["attached_scope"]["title"] == "Contract.pdf"

    # Verify find() query called with mode filter
    find_args = mock_db["threads"].find.call_args[0][0]
    assert find_args["mode"] == "assets"


def test_list_threads_universal_excludes_assets_and_studio(mock_db):
    """Ensure GET /api/chat/threads?mode=universal matches universal or legacy threads."""
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = []
    mock_db["threads"].find.return_value.sort.return_value = mock_cursor

    response = client.get(
        f"/api/chat/threads?workspace_id={WORKSPACE_ID}&mode=universal",
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )
    assert response.status_code == 200
    find_args = mock_db["threads"].find.call_args[0][0]
    assert "$or" in find_args
    assert {"mode": "universal"} in find_args["$or"]


def test_ask_creates_thread_with_mode_and_attached_scope(mock_db):
    """Ensure ask_question saves mode and attached_scope on auto-created thread."""
    new_thread_id = ObjectId()
    mock_db["threads"].find_one = AsyncMock(return_value=None)
    mock_db["threads"].insert_one = AsyncMock(return_value=AsyncMock(inserted_id=new_thread_id))
    mock_db["messages"].insert_one = AsyncMock()

    async def mock_tokens(*args, **kwargs):
        yield "Asset analysis token"

    with patch("app.routes.chat.retrieve_for_query", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.routes.chat.ask_question", side_effect=mock_tokens):
        mock_retrieve.return_value = ("Document content snippet", [])

        response = client.post(
            "/api/chat/ask",
            json={
                "query": "Summarize this PDF",
                "workspace_id": WORKSPACE_ID,
                "mode": "assets",
                "require_scope": True,
                "scope_ids": ["source_pdf_1"],
                "attached_name": "Quarterly_Report.pdf",
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"}
        )
        assert response.status_code == 200

        # Verify insert_one call arguments on chat_threads_collection
        inserted_thread = mock_db["threads"].insert_one.call_args[0][0]
        assert inserted_thread["mode"] == "assets"
        assert inserted_thread["attached_scope"]["id"] == "source_pdf_1"
        assert inserted_thread["attached_scope"]["title"] == "Quarterly_Report.pdf"
        assert inserted_thread["attached_scope"]["type"] == "asset"
