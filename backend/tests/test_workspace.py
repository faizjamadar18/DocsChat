import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_db():
    with patch("app.routes.workspaces.workspaces_collection") as mock_ws:
        with patch("app.routes.auth.check_db"):
            yield mock_ws

def test_create_workspace(mock_db):
    mock_insert = AsyncMock()
    mock_insert.inserted_id = "test_workspace_id"
    mock_db.insert_one = AsyncMock(return_value=mock_insert)

    # Mock user auth dependency
    with patch("app.routes.workspaces.get_current_user", return_value={"id": "user123", "email": "test@test.com", "username": "Test"}):
        # We need to mock get_current_user in auth.py as well or override the dependency
        pass
