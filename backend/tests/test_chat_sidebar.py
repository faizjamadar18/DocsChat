import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "shreyas@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())
DOC_ID = str(ObjectId())


@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.messages_collection") as mock_messages:
        with patch("app.routes.chat.check_db"):
            yield {"users": mock_users, "messages": mock_messages}


def test_chat_ask_with_scope_ids(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "Shreyas",
        "active_workspace_id": WORKSPACE_ID,
    })
    mock_db["messages"].insert_one = AsyncMock()

    async def mock_tokens(*args, **kwargs):
        yield "CapsAI\n"
        yield "Avento"

    citations = [
        {
            "source_id": DOC_ID,
            "filename": "Shreyas Sihasane Frontend.pdf",
            "page": 1,
            "snippet": "Projects: CapsAI, Avento",
            "similarity_score": 0.95,
        }
    ]

    with patch("app.routes.chat.retrieve_for_query", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.routes.chat.ask_question", side_effect=mock_tokens):
        mock_retrieve.return_value = ("Context snippet", citations)

        response = client.post(
            "/api/chat/ask",
            json={
                "query": "list projects mentioned in resume",
                "workspace_id": WORKSPACE_ID,
                "scope_ids": [DOC_ID],
                "attached_name": "Shreyas Sihasane Frontend.pdf",
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"}
        )

        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

        # Verify retrieve_for_query received scope_ids
        mock_retrieve.assert_called_once()
        call_kwargs = mock_retrieve.call_args.kwargs
        assert call_kwargs.get("scope_ids") == [DOC_ID]
        assert call_kwargs.get("workspace_id") == WORKSPACE_ID

        # Verify messages inserted into MongoDB included scope_ids and attached_name
        assert mock_db["messages"].insert_one.call_count == 2
        first_insert = mock_db["messages"].insert_one.call_args_list[0].args[0]
        assert first_insert["role"] == "user"
        assert first_insert["content"] == "list projects mentioned in resume"
        assert first_insert.get("scope_ids") == [DOC_ID]
        assert first_insert.get("attached_name") == "Shreyas Sihasane Frontend.pdf"


def test_chat_ask_workspace_wide_without_scope(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "Shreyas",
        "active_workspace_id": WORKSPACE_ID,
    })
    mock_db["messages"].insert_one = AsyncMock()

    async def mock_tokens(*args, **kwargs):
        yield "Workspace answer"

    with patch("app.routes.chat.retrieve_for_query", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.routes.chat.ask_question", side_effect=mock_tokens):
        mock_retrieve.return_value = ("General context", [])

        response = client.post(
            "/api/chat/ask",
            json={
                "query": "Tell me about this workspace",
                "workspace_id": WORKSPACE_ID,
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"}
        )

        assert response.status_code == 200
        mock_retrieve.assert_called_once()
        call_kwargs = mock_retrieve.call_args.kwargs
        assert call_kwargs.get("scope_ids") is None


def test_clear_chat_history(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "Shreyas",
        "active_workspace_id": WORKSPACE_ID,
    })
    mock_db["messages"].delete_many = AsyncMock(return_value=type("obj", (), {"deleted_count": 5})())

    response = client.delete(
        f"/api/chat/clear?workspace_id={WORKSPACE_ID}",
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )

    assert response.status_code == 200
    mock_db["messages"].delete_many.assert_called_once()
    filter_args = mock_db["messages"].delete_many.call_args.args[0]
    assert filter_args["user_id"] == USER_ID
    assert filter_args["workspace_id"] == WORKSPACE_ID
