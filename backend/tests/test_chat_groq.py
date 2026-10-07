import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "test@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())

@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.messages_collection") as mock_messages, \
         patch("app.database.chat_threads_collection") as mock_threads:
        with patch("app.routes.chat.check_db"):
            mock_threads.find_one = AsyncMock(return_value=None)
            mock_threads.insert_one = AsyncMock(return_value=AsyncMock(inserted_id=ObjectId()))
            yield {"users": mock_users, "messages": mock_messages, "threads": mock_threads}

def test_chat_ask_accepts_gemini_and_routes_to_groq(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "Test User",
        "active_workspace_id": WORKSPACE_ID,
    })
    mock_db["messages"].insert_one = AsyncMock()

    async def mock_tokens(*args, **kwargs):
        yield "Hello "
        yield "from Groq"

    with patch("app.routes.chat.retrieve_for_query", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.routes.chat.ask_question", side_effect=mock_tokens) as mock_ask:
        mock_retrieve.return_value = ("Context", [])

        # Send request with legacy model="gemini"
        response = client.post(
            "/api/chat/ask",
            json={"query": "Hello", "model": "gemini"},
            headers={"Authorization": f"Bearer {USER_TOKEN}"}
        )

        assert response.status_code == 200
        # Check that ask_question was called with model='groq'
        mock_ask.assert_called_once()
        called_args = mock_ask.call_args
        assert "groq" in (called_args.kwargs.get("model") or called_args.args[2])
