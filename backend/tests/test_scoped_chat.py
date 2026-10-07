import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "user@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())
DOC_ID = str(ObjectId())


@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.messages_collection") as mock_messages, \
         patch("app.database.chat_threads_collection") as mock_threads:
        with patch("app.routes.chat.check_db"):
            mock_users.find_one = AsyncMock(return_value={
                "_id": ObjectId(USER_ID),
                "email": USER_EMAIL,
                "username": "TestUser",
                "active_workspace_id": WORKSPACE_ID,
            })
            mock_threads.find_one = AsyncMock(return_value=None)
            mock_threads.insert_one = AsyncMock(return_value=AsyncMock(inserted_id=ObjectId()))
            mock_messages.insert_one = AsyncMock()
            yield {"users": mock_users, "messages": mock_messages, "threads": mock_threads}


def test_require_scope_without_attachments_returns_attachment_message(mock_db):
    """When require_scope is True and no scope_ids provided, should inform user to attach a document without searching workspace."""
    response = client.post(
        "/api/chat/ask",
        json={
            "query": "What is in this file?",
            "workspace_id": WORKSPACE_ID,
            "require_scope": True,
            "scope_ids": [],
        },
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )
    assert response.status_code == 200
    text = response.text
    assert "attach" in text.lower() or "no document" in text.lower()


def test_require_scope_with_attached_pdf(mock_db):
    """When require_scope is True with scope_ids, retrieves strictly for that scope."""
    citations = [
        {
            "source_id": DOC_ID,
            "filename": "Report.pdf",
            "page": 1,
            "snippet": "Revenue grew by 20%",
            "similarity_score": 0.92,
        }
    ]

    async def mock_tokens(*args, **kwargs):
        yield "Revenue grew by 20% according to Report.pdf"

    with patch("app.routes.chat.retrieve_for_query", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.routes.chat.ask_question", side_effect=mock_tokens):
        mock_retrieve.return_value = ("Revenue grew by 20%", citations)

        response = client.post(
            "/api/chat/ask",
            json={
                "query": "What was the revenue growth?",
                "workspace_id": WORKSPACE_ID,
                "require_scope": True,
                "scope_ids": [DOC_ID],
                "attached_name": "Report.pdf",
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"}
        )
        assert response.status_code == 200
        mock_retrieve.assert_called_once()
        call_kwargs = mock_retrieve.call_args.kwargs
        assert call_kwargs.get("scope_ids") == [DOC_ID]
        assert "Report.pdf" in response.text
