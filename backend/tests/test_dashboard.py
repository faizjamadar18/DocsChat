import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_1_ID = str(ObjectId())
USER_1_EMAIL = "user1@example.com"
USER_1_TOKEN = create_access_token(USER_1_ID, USER_1_EMAIL)

WORKSPACE_1_ID = str(ObjectId())

@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.workspaces_collection") as mock_workspaces, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.documents_collection") as mock_docs:
        with patch("app.database.check_db"):
            yield {
                "users": mock_users,
                "workspaces": mock_workspaces,
                "sources": mock_sources,
                "documents": mock_docs,
            }

def test_get_dashboard(mock_db):
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

    async def mock_docs_cursor():
        for i in range(3):
            yield {
                "_id": ObjectId(),
                "workspace_id": WORKSPACE_1_ID,
                "user_id": USER_1_ID,
                "title": f"Doc {i}",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }

    class MockDocsCursor:
        def sort(self, *args, **kwargs):
            return self
        def limit(self, *args, **kwargs):
            return self
        def __aiter__(self):
            return mock_docs_cursor()

    mock_db["documents"].find = lambda *args, **kwargs: MockDocsCursor()

    async def mock_sources_cursor():
        for i in range(3):
            yield {
                "_id": ObjectId(),
                "workspace_id": WORKSPACE_1_ID,
                "filename": f"Asset {i}.pdf",
                "file_size": 1024,
                "page_count": 5,
                "chunk_count": 20,
                "status": "ready",
                "uploaded_at": datetime.now(timezone.utc),
            }

    class MockSourcesCursor:
        def sort(self, *args, **kwargs):
            return self
        def limit(self, *args, **kwargs):
            return self
        def __aiter__(self):
            return mock_sources_cursor()

    mock_db["sources"].find = lambda *args, **kwargs: MockSourcesCursor()

    response = client.get(
        f"/api/workspaces/{WORKSPACE_1_ID}/dashboard",
        headers={"Authorization": f"Bearer {USER_1_TOKEN}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "recent_documents" in data
    assert "recent_assets" in data
    assert len(data["recent_documents"]) == 3
    assert len(data["recent_assets"]) == 3
