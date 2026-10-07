import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_google_auth():
    with patch("app.routes.auth.id_token.verify_oauth2_token") as mock_verify:
        yield mock_verify

@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.workspaces_collection") as mock_workspaces:
        with patch("app.routes.auth.check_db"):
            yield {"users": mock_users, "workspaces": mock_workspaces}

def test_google_login_new_user_provisions_workspace(mock_google_auth, mock_db):
    mock_google_auth.return_value = {
        "email": "test@example.com",
        "name": "Test User",
        "picture": "https://example.com/pic.png",
        "sub": "google123"
    }
    
    mock_db["users"].find_one = AsyncMock(return_value=None)
    
    new_user_id = ObjectId()
    mock_user_insert = AsyncMock()
    mock_user_insert.inserted_id = new_user_id
    mock_db["users"].insert_one = AsyncMock(return_value=mock_user_insert)
    
    new_ws_id = ObjectId()
    mock_ws_insert = AsyncMock()
    mock_ws_insert.inserted_id = new_ws_id
    mock_db["workspaces"].insert_one = AsyncMock(return_value=mock_ws_insert)
    
    mock_db["users"].update_one = AsyncMock()
    
    response = client.post("/api/auth/google", json={"credential": "valid_token"})
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["username"] == "Test User"
    assert data["user"]["active_workspace_id"] == str(new_ws_id)
    
    mock_db["users"].insert_one.assert_called_once()
    mock_db["workspaces"].insert_one.assert_called_once()
    mock_db["users"].update_one.assert_called_once()

def test_google_login_existing_user(mock_google_auth, mock_db):
    mock_google_auth.return_value = {
        "email": "existing@example.com",
        "name": "Existing User",
        "picture": "https://example.com/pic.png",
        "sub": "google456"
    }
    
    existing_ws_id = str(ObjectId())
    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(),
        "email": "existing@example.com",
        "username": "Old Name",
        "auth_provider": "google",
        "active_workspace_id": existing_ws_id,
        "created_at": "2023-01-01T00:00:00Z"
    })
    
    mock_db["users"].update_one = AsyncMock()
    
    response = client.post("/api/auth/google", json={"credential": "valid_token"})
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "existing@example.com"
    assert data["user"]["active_workspace_id"] == existing_ws_id
    
    mock_db["users"].insert_one.assert_not_called()
