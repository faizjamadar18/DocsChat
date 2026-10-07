import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "shreyas@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())
THREAD_ID = str(ObjectId())


@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.messages_collection") as mock_messages, \
         patch("app.database.chat_threads_collection") as mock_threads:
        with patch("app.routes.chat.check_db"):
            mock_users.find_one = AsyncMock(return_value={
                "_id": ObjectId(USER_ID),
                "email": USER_EMAIL,
                "username": "Shreyas",
                "active_workspace_id": WORKSPACE_ID,
            })
            yield {"users": mock_users, "messages": mock_messages, "threads": mock_threads}


def test_list_threads(mock_db):
    now = datetime.now(timezone.utc)
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = [
        {
            "_id": ObjectId(THREAD_ID),
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "title": "Universal Search Discussion",
            "created_at": now,
            "updated_at": now,
        }
    ]
    mock_db["threads"].find.return_value.sort.return_value = mock_cursor

    response = client.get(
        f"/api/chat/threads?workspace_id={WORKSPACE_ID}",
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["threads"][0]["title"] == "Universal Search Discussion"
    assert data["threads"][0]["id"] == THREAD_ID


def test_create_thread(mock_db):
    new_id = ObjectId()
    mock_db["threads"].insert_one = AsyncMock(return_value=AsyncMock(inserted_id=new_id))

    response = client.post(
        "/api/chat/threads",
        json={"workspace_id": WORKSPACE_ID, "title": "My New Thread"},
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == str(new_id)
    assert data["title"] == "My New Thread"
    assert data["workspace_id"] == WORKSPACE_ID


def test_get_thread_messages(mock_db):
    mock_db["threads"].find_one = AsyncMock(return_value={
        "_id": ObjectId(THREAD_ID),
        "user_id": USER_ID,
        "workspace_id": WORKSPACE_ID,
        "title": "Thread 1",
    })

    now = datetime.now(timezone.utc)
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = [
        {
            "_id": ObjectId(),
            "thread_id": THREAD_ID,
            "workspace_id": WORKSPACE_ID,
            "role": "user",
            "content": "Hello Playground",
            "created_at": now,
        },
        {
            "_id": ObjectId(),
            "thread_id": THREAD_ID,
            "workspace_id": WORKSPACE_ID,
            "role": "assistant",
            "content": "Hello! How can I help across your workspace?",
            "created_at": now,
        }
    ]
    mock_db["messages"].find.return_value.sort.return_value = mock_cursor

    response = client.get(
        f"/api/chat/threads/{THREAD_ID}/messages",
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["messages"][0]["content"] == "Hello Playground"
    assert data["messages"][1]["content"] == "Hello! How can I help across your workspace?"


def test_delete_thread(mock_db):
    mock_db["threads"].find_one = AsyncMock(return_value={
        "_id": ObjectId(THREAD_ID),
        "user_id": USER_ID,
    })
    mock_db["threads"].delete_one = AsyncMock()
    mock_db["messages"].delete_many = AsyncMock()

    response = client.delete(
        f"/api/chat/threads/{THREAD_ID}",
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )
    assert response.status_code == 200
    assert response.json()["id"] == THREAD_ID
    mock_db["threads"].delete_one.assert_called_once()
    mock_db["messages"].delete_many.assert_called_once_with({"thread_id": THREAD_ID})


def test_ask_with_auto_created_thread(mock_db):
    new_thread_id = ObjectId()
    mock_db["threads"].find_one = AsyncMock(return_value=None)
    mock_db["threads"].insert_one = AsyncMock(return_value=AsyncMock(inserted_id=new_thread_id))
    mock_db["messages"].insert_one = AsyncMock()

    async def mock_tokens(*args, **kwargs):
        yield "Response token"

    with patch("app.routes.chat.retrieve_for_query", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.routes.chat.ask_question", side_effect=mock_tokens):
        mock_retrieve.return_value = ("Context snippet", [])

        response = client.post(
            "/api/chat/ask",
            json={
                "query": "What is the workspace strategy?",
                "workspace_id": WORKSPACE_ID,
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"}
        )
        assert response.status_code == 200
        text = response.text
        assert "thread_info" in text
        assert str(new_thread_id) in text
        assert "Response token" in text
