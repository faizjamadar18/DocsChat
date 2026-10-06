import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "user@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_1 = str(ObjectId())
WORKSPACE_2 = str(ObjectId())

@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.workspaces_collection") as mock_workspaces:
        with patch("app.routes.sources.check_db"):
            yield {"users": mock_users, "sources": mock_sources, "workspaces": mock_workspaces}

def test_list_sources_scoped_to_active_workspace(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "User",
        "active_workspace_id": WORKSPACE_1,
    })

    async def mock_cursor():
        yield {
            "_id": ObjectId(),
            "user_id": USER_ID,
            "workspace_id": WORKSPACE_1,
            "filename": "doc1.pdf",
            "file_size": 1024,
            "page_count": 1,
            "chunk_count": 2,
            "status": "ready",
            "uploaded_at": datetime.now(timezone.utc),
        }

    class MockCursor:
        def sort(self, *args, **kwargs):
            return self
        def __aiter__(self):
            return mock_cursor()
    
    captured_query = {}
    def mock_db_find(query):
        captured_query.update(query)
        return MockCursor()

    mock_db["sources"].find = mock_db_find

    # Call with header X-Workspace-Id
    response = client.get(
        "/api/sources",
        headers={
            "Authorization": f"Bearer {USER_TOKEN}",
            "X-Workspace-Id": WORKSPACE_1,
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["sources"]) == 1
    assert data["sources"][0]["filename"] == "doc1.pdf"
    assert captured_query.get("workspace_id") == WORKSPACE_1

def test_list_sources_falls_back_to_user_active_workspace(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "User",
        "active_workspace_id": WORKSPACE_1,
    })

    async def mock_cursor():
        if False:
            yield {}

    class MockCursor:
        def sort(self, *args, **kwargs):
            return self
        def __aiter__(self):
            return mock_cursor()
    
    captured_query = {}
    def mock_db_find(query):
        captured_query.update(query)
        return MockCursor()

    mock_db["sources"].find = mock_db_find

    # Call without header, falls back to active_workspace_id
    response = client.get(
        "/api/sources",
        headers={"Authorization": f"Bearer {USER_TOKEN}"}
    )

    assert response.status_code == 200
    assert captured_query.get("workspace_id") == WORKSPACE_1
