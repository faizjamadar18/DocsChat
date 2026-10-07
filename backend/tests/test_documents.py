import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "studio_user@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())
DOC_ID = str(ObjectId())


@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.documents_collection") as mock_documents, \
         patch("app.database.workspaces_collection") as mock_workspaces:
        with patch("app.routes.documents.check_db") if hasattr(app, "routes") else patch("app.database.check_db"):
            yield {
                "users": mock_users,
                "documents": mock_documents,
                "workspaces": mock_workspaces,
            }


def test_create_document(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "StudioUser",
        "active_workspace_id": WORKSPACE_ID,
    })

    inserted_id = ObjectId()
    mock_db["documents"].insert_one = AsyncMock(return_value=MagicMock(inserted_id=inserted_id))

    response = client.post(
        "/api/documents",
        json={"title": "Test Document", "content_text": "Hello world", "content_json": {"type": "doc"}},
        headers={"Authorization": f"Bearer {USER_TOKEN}", "X-Workspace-Id": WORKSPACE_ID},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == str(inserted_id)
    assert data["title"] == "Test Document"
    assert data["workspace_id"] == WORKSPACE_ID
    assert data["content_text"] == "Hello world"


def test_list_documents(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "StudioUser",
        "active_workspace_id": WORKSPACE_ID,
    })

    async def mock_cursor():
        yield {
            "_id": ObjectId(DOC_ID),
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "title": "Existing Doc",
            "content_json": {},
            "content_text": "Sample text",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

    class MockCursor:
        def sort(self, *args, **kwargs):
            return self
        def __aiter__(self):
            return mock_cursor()

    mock_db["documents"].find = MagicMock(return_value=MockCursor())

    response = client.get(
        f"/api/documents?workspace_id={WORKSPACE_ID}",
        headers={"Authorization": f"Bearer {USER_TOKEN}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["documents"]) == 1
    assert data["documents"][0]["id"] == DOC_ID
    assert data["documents"][0]["title"] == "Existing Doc"


def test_get_document_by_id(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "StudioUser",
        "active_workspace_id": WORKSPACE_ID,
    })

    mock_db["documents"].find_one = AsyncMock(return_value={
        "_id": ObjectId(DOC_ID),
        "workspace_id": WORKSPACE_ID,
        "user_id": USER_ID,
        "title": "Specific Doc",
        "content_json": {"type": "doc"},
        "content_text": "Detailed content",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })

    response = client.get(
        f"/api/documents/{DOC_ID}",
        headers={"Authorization": f"Bearer {USER_TOKEN}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == DOC_ID
    assert data["title"] == "Specific Doc"
    assert data["content_text"] == "Detailed content"


def test_update_document(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "StudioUser",
        "active_workspace_id": WORKSPACE_ID,
    })

    mock_db["documents"].find_one = AsyncMock(return_value={
        "_id": ObjectId(DOC_ID),
        "workspace_id": WORKSPACE_ID,
        "user_id": USER_ID,
        "title": "Original Title",
        "content_json": {},
        "content_text": "Original text",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })

    mock_db["documents"].update_one = AsyncMock()

    response = client.put(
        f"/api/documents/{DOC_ID}",
        json={"title": "Updated Title", "content_text": "New text content"},
        headers={"Authorization": f"Bearer {USER_TOKEN}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["content_text"] == "New text content"


def test_delete_document(mock_db):
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "StudioUser",
        "active_workspace_id": WORKSPACE_ID,
    })

    mock_db["documents"].find_one = AsyncMock(return_value={
        "_id": ObjectId(DOC_ID),
        "workspace_id": WORKSPACE_ID,
        "user_id": USER_ID,
        "title": "To Delete",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })

    mock_db["documents"].delete_one = AsyncMock()

    with patch("app.services.vector_store.delete_source_vectors") as mock_delete_vec:
        response = client.delete(
            f"/api/documents/{DOC_ID}",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )

        assert response.status_code == 200
        mock_delete_vec.assert_called_once_with(user_id=USER_ID, source_id=DOC_ID)
