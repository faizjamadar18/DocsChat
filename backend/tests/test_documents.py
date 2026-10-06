import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.routes.workspaces import get_workspace_or_404

client = TestClient(app)

@pytest.fixture
def mock_db():
    with patch("app.routes.documents.documents_collection") as mock_docs:
        yield mock_docs

def test_create_document(mock_db):
    mock_insert = AsyncMock()
    mock_insert.inserted_id = "5f5b5c90b8f1c34a1a63c631"
    mock_db.insert_one = AsyncMock(return_value=mock_insert)

    with patch("app.routes.documents.index_document", new_callable=AsyncMock):
        app.dependency_overrides[get_workspace_or_404] = lambda: {"_id": "ws_123", "user_id": "user123"}
        resp = client.post(
            "/api/workspaces/ws_123/documents",
            json={"title": "Doc 1", "content": "hello", "plain_text": "hello"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Doc 1"
        app.dependency_overrides = {}

def test_update_document(mock_db):
    now = "2023-01-01T00:00:00Z"
    mock_db.find_one = AsyncMock(return_value={
        "_id": "5f5b5c90b8f1c34a1a63c631", 
        "workspace_id": "ws_123",
        "user_id": "user123",
        "title": "Old Doc",
        "content": "old",
        "plain_text": "old",
        "content_hash": "hash",
        "created_at": now,
        "updated_at": now
    })
    mock_db.update_one = AsyncMock()

    with patch("app.routes.documents.index_document", new_callable=AsyncMock):
        app.dependency_overrides[get_workspace_or_404] = lambda: {"_id": "ws_123", "user_id": "user123"}
        resp = client.put(
            "/api/workspaces/ws_123/documents/5f5b5c90b8f1c34a1a63c631",
            json={"title": "Updated Doc", "plain_text": "updated text"}
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Doc"
        app.dependency_overrides = {}
