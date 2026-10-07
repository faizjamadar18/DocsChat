import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token
import app.database as database

client = TestClient(app)

USER_1_ID = str(ObjectId())
USER_1_EMAIL = "user1@example.com"
USER_1_TOKEN = create_access_token(USER_1_ID, USER_1_EMAIL)

USER_2_ID = str(ObjectId())
USER_2_EMAIL = "user2@example.com"
USER_2_TOKEN = create_access_token(USER_2_ID, USER_2_EMAIL)

WORKSPACE_1_ID = str(ObjectId())
WORKSPACE_2_ID = str(ObjectId())

@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.workspaces_collection") as mock_workspaces, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.messages_collection") as mock_messages, \
         patch("app.database.documents_collection") as mock_docs:
        with patch("app.database.check_db"):
            yield {
                "users": mock_users,
                "workspaces": mock_workspaces,
                "sources": mock_sources,
                "messages": mock_messages,
                "documents": mock_docs,
            }

def test_create_workspace(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_1_ID),
        "email": USER_1_EMAIL,
        "username": "User One",
        "active_workspace_id": WORKSPACE_1_ID,
        "created_at": datetime.now(timezone.utc),
    })
    
    mock_db["workspaces"].find_one = AsyncMock(return_value=None)
    mock_insert = AsyncMock()
    mock_insert.inserted_id = ObjectId(WORKSPACE_1_ID)
    mock_db["workspaces"].insert_one = AsyncMock(return_value=mock_insert)
    mock_db["users"].update_one = AsyncMock()

    response = client.post(
        "/api/workspaces",
        json={"name": "New Workspace", "slug": "new-workspace", "description": "My test workspace"},
        headers={"Authorization": f"Bearer {USER_1_TOKEN}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Workspace"
    assert data["slug"] == "new-workspace"
    assert data["owner_id"] == USER_1_ID

def test_list_workspaces(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_1_ID),
        "email": USER_1_EMAIL,
        "username": "User One",
        "active_workspace_id": WORKSPACE_1_ID,
        "created_at": datetime.now(timezone.utc),
    })

    async def mock_cursor():
        yield {
            "_id": ObjectId(WORKSPACE_1_ID),
            "owner_id": USER_1_ID,
            "name": "User One HQ",
            "slug": "user-one-hq",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

    class MockCursor:
        def sort(self, *args, **kwargs):
            return self
        def __aiter__(self):
            return mock_cursor()

    mock_db["workspaces"].find = lambda *args, **kwargs: MockCursor()

    response = client.get(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {USER_1_TOKEN}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["workspaces"]) == 1
    assert data["workspaces"][0]["name"] == "User One HQ"

def test_get_workspace_by_id(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_1_ID),
        "email": USER_1_EMAIL,
        "username": "User One",
        "active_workspace_id": WORKSPACE_1_ID,
        "created_at": datetime.now(timezone.utc),
    })

    mock_db["workspaces"].find_one = AsyncMock(return_value={
        "_id": ObjectId(WORKSPACE_1_ID),
        "owner_id": USER_1_ID,
        "name": "User One HQ",
        "slug": "user-one-hq",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })

    response = client.get(
        f"/api/workspaces/{WORKSPACE_1_ID}",
        headers={"Authorization": f"Bearer {USER_1_TOKEN}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == WORKSPACE_1_ID
    assert data["name"] == "User One HQ"

def test_cannot_access_foreign_workspace(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_2_ID),
        "email": USER_2_EMAIL,
        "username": "User Two",
        "active_workspace_id": WORKSPACE_2_ID,
        "created_at": datetime.now(timezone.utc),
    })

    # Workspace belongs to USER_1, not USER_2
    mock_db["workspaces"].find_one = AsyncMock(return_value=None)

    response = client.get(
        f"/api/workspaces/{WORKSPACE_1_ID}",
        headers={"Authorization": f"Bearer {USER_2_TOKEN}"}
    )

    assert response.status_code == 404

def test_activate_workspace(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_1_ID),
        "email": USER_1_EMAIL,
        "username": "User One",
        "active_workspace_id": WORKSPACE_1_ID,
        "created_at": datetime.now(timezone.utc),
    })

    mock_db["workspaces"].find_one = AsyncMock(return_value={
        "_id": ObjectId(WORKSPACE_2_ID),
        "owner_id": USER_1_ID,
        "name": "Second Workspace",
        "slug": "second-workspace",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    mock_db["users"].update_one = AsyncMock()

    response = client.post(
        f"/api/workspaces/{WORKSPACE_2_ID}/activate",
        headers={"Authorization": f"Bearer {USER_1_TOKEN}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["active_workspace_id"] == WORKSPACE_2_ID
    mock_db["users"].update_one.assert_called_once()

def test_delete_workspace_cascades(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_1_ID),
        "email": USER_1_EMAIL,
        "username": "User One",
        "active_workspace_id": WORKSPACE_1_ID,
    })

    # First find_one returns workspace to delete; next returns second workspace as active
    mock_db["workspaces"].find_one = AsyncMock(side_effect=[
        {
            "_id": ObjectId(WORKSPACE_1_ID),
            "owner_id": USER_1_ID,
            "name": "To Delete",
            "slug": "to-delete",
        },
        {
            "_id": ObjectId(WORKSPACE_2_ID),
            "owner_id": USER_1_ID,
            "name": "Remaining Workspace",
            "slug": "remaining",
        }
    ])
    mock_db["workspaces"].delete_one = AsyncMock()
    mock_db["documents"].delete_many = AsyncMock()
    mock_db["sources"].delete_many = AsyncMock()
    mock_db["messages"].delete_many = AsyncMock()
    mock_db["users"].update_one = AsyncMock()

    with patch("app.services.vector_store.delete_workspace_vectors") as mock_delete_vecs:
        response = client.delete(
            f"/api/workspaces/{WORKSPACE_1_ID}",
            headers={"Authorization": f"Bearer {USER_1_TOKEN}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["active_workspace_id"] == WORKSPACE_2_ID
        mock_db["documents"].delete_many.assert_called_once_with({"workspace_id": WORKSPACE_1_ID})
        mock_db["sources"].delete_many.assert_called_once_with({"workspace_id": WORKSPACE_1_ID})
        mock_db["messages"].delete_many.assert_called_once_with({"workspace_id": WORKSPACE_1_ID})
        mock_db["workspaces"].delete_one.assert_called_once_with({"_id": ObjectId(WORKSPACE_1_ID)})
        mock_delete_vecs.assert_called_once_with(user_id=USER_1_ID, workspace_id=WORKSPACE_1_ID)

@pytest.mark.asyncio
async def test_migration_hook(mock_db):
    mock_user = {
        "_id": ObjectId(USER_1_ID),
        "email": "legacy@example.com",
        "username": "Legacy User",
    }
    
    async def mock_user_cursor():
        yield mock_user

    mock_db["users"].find = lambda *args, **kwargs: mock_user_cursor()
    mock_db["workspaces"].find_one = AsyncMock(return_value=None)
    
    inserted_ws = AsyncMock()
    inserted_ws.inserted_id = ObjectId(WORKSPACE_1_ID)
    mock_db["workspaces"].insert_one = AsyncMock(return_value=inserted_ws)
    mock_db["users"].update_one = AsyncMock()
    mock_db["sources"].update_many = AsyncMock()
    mock_db["messages"].update_many = AsyncMock()

    with patch("app.services.vector_store.set_user_vectors_workspace") as mock_set_vecs:
        await database.run_migrations()

        mock_db["workspaces"].insert_one.assert_called_once()
        mock_db["users"].update_one.assert_called_once()
        mock_db["sources"].update_many.assert_called()
        mock_db["messages"].update_many.assert_called()
        mock_set_vecs.assert_called_once_with(USER_1_ID, WORKSPACE_1_ID)
