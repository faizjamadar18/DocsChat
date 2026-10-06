import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_google_auth():
    with patch("app.routes.auth.id_token.verify_oauth2_token") as mock_verify:
        yield mock_verify

@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users:
        # Avoid the check_db exception in tests
        with patch("app.routes.auth.check_db"):
            yield mock_users

def test_google_login_new_user(mock_google_auth, mock_db):
    mock_google_auth.return_value = {
        "email": "test@example.com",
        "name": "Test User",
        "picture": "https://example.com/pic.png",
        "sub": "google123"
    }
    
    # Mock find_one to return None (new user)
    mock_db.find_one = AsyncMock(return_value=None)
    
    # Mock insert_one
    mock_insert_result = AsyncMock()
    mock_insert_result.inserted_id = "new_mongo_id"
    mock_db.insert_one = AsyncMock(return_value=mock_insert_result)
    
    response = client.post("/api/auth/google", json={"credential": "valid_token"})
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["username"] == "Test User"
    
    mock_db.insert_one.assert_called_once()

def test_google_login_existing_user(mock_google_auth, mock_db):
    mock_google_auth.return_value = {
        "email": "existing@example.com",
        "name": "Existing User",
        "picture": "https://example.com/pic.png",
        "sub": "google456"
    }
    
    # Mock find_one to return existing user
    mock_db.find_one = AsyncMock(return_value={
        "_id": "existing_id",
        "email": "existing@example.com",
        "username": "Old Name", # The username in DB might differ
        "auth_provider": "google",
        "created_at": "2023-01-01T00:00:00Z"
    })
    
    # Mock update_one
    mock_db.update_one = AsyncMock()
    
    response = client.post("/api/auth/google", json={"credential": "valid_token"})
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "existing@example.com"
    
    # Make sure we didn't insert a new user
    mock_db.insert_one.assert_not_called()
