import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from app.main import app
from app.middleware.auth_middleware import get_current_user

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


def test_google_login_new_user_returns_is_new_user_true(mock_google_auth, mock_db):
    mock_google_auth.return_value = {
        "email": "newbie@example.com",
        "name": "Newbie User",
        "picture": "https://example.com/pic.png",
        "sub": "google-new",
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
    assert data["is_new_user"] is True
    assert data["user"]["onboarding_completed"] is False
    assert data["user"]["active_workspace_id"] == str(new_ws_id)

    # New user doc must be created with onboarding_completed=False
    created_doc = mock_db["users"].insert_one.call_args[0][0]
    assert created_doc["onboarding_completed"] is False


def test_google_login_existing_completed_user_skips_onboarding(mock_google_auth, mock_db):
    existing_ws_id = str(ObjectId())
    mock_google_auth.return_value = {
        "email": "old@example.com",
        "name": "Old User",
        "picture": "https://example.com/pic.png",
        "sub": "google-old",
    }

    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(),
        "email": "old@example.com",
        "username": "Old User",
        "auth_provider": "google",
        "active_workspace_id": existing_ws_id,
        "onboarding_completed": True,
        "created_at": "2023-01-01T00:00:00Z",
    })
    mock_db["users"].update_one = AsyncMock()

    response = client.post("/api/auth/google", json={"credential": "valid_token"})

    assert response.status_code == 200
    data = response.json()
    assert data["is_new_user"] is False
    assert data["user"]["onboarding_completed"] is True
    assert data["user"]["active_workspace_id"] == existing_ws_id


def test_google_login_legacy_user_without_flag_treated_as_completed(mock_google_auth, mock_db):
    """Old users created before onboarding must NOT be forced into onboarding."""
    existing_ws_id = str(ObjectId())
    mock_google_auth.return_value = {
        "email": "legacy@example.com",
        "name": "Legacy User",
        "picture": None,
        "sub": "google-legacy",
    }

    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(),
        "email": "legacy@example.com",
        "username": "Legacy User",
        "auth_provider": "google",
        "active_workspace_id": existing_ws_id,
        "created_at": "2023-01-01T00:00:00Z",
    })
    mock_db["users"].update_one = AsyncMock()

    response = client.post("/api/auth/google", json={"credential": "valid_token"})

    assert response.status_code == 200
    data = response.json()
    assert data["is_new_user"] is False
    assert data["user"]["onboarding_completed"] is True


def test_google_login_incomplete_user_returns_is_new_user_true(mock_google_auth, mock_db):
    existing_ws_id = str(ObjectId())
    mock_google_auth.return_value = {
        "email": "half@example.com",
        "name": "Half User",
        "picture": None,
        "sub": "google-half",
    }

    mock_db["users"].find_one = AsyncMock(return_value={
        "_id": ObjectId(),
        "email": "half@example.com",
        "username": "Half User",
        "auth_provider": "google",
        "active_workspace_id": existing_ws_id,
        "onboarding_completed": False,
        "created_at": "2023-01-01T00:00:00Z",
    })
    mock_db["users"].update_one = AsyncMock()

    response = client.post("/api/auth/google", json={"credential": "valid_token"})

    assert response.status_code == 200
    data = response.json()
    assert data["is_new_user"] is True
    assert data["user"]["onboarding_completed"] is False


def _override_user(user_id="user123", ws_id="ws123", completed=False):
    async def _dep():
        return {
            "id": user_id,
            "username": "Test User",
            "email": "test@example.com",
            "auth_provider": "google",
            "picture": None,
            "active_workspace_id": ws_id,
            "onboarding_completed": completed,
            "created_at": "2023-01-01T00:00:00Z",
        }
    return _dep


def test_onboarding_renames_workspace_and_completes():
    user_id = str(ObjectId())
    ws_id = str(ObjectId())
    app.dependency_overrides[get_current_user] = _override_user(user_id, ws_id)
    try:
        with patch("app.routes.auth.check_db"), \
             patch("app.database.workspaces_collection") as mock_ws, \
             patch("app.database.users_collection") as mock_users:
            mock_ws.find_one = AsyncMock(return_value={
                "_id": ObjectId(ws_id),
                "owner_id": user_id,
                "name": "Test HQ",
                "slug": "test-hq",
                "description": "Default workspace",
                "logo_url": None,
            })
            # No slug clash on second find_one call
            mock_ws.find_one.side_effect = [
                {
                    "_id": ObjectId(ws_id),
                    "owner_id": user_id,
                    "name": "Test HQ",
                    "slug": "test-hq",
                    "description": "Default workspace",
                    "logo_url": None,
                },
                None,
            ]
            mock_ws.update_one = AsyncMock()
            mock_users.update_one = AsyncMock()

            response = client.patch(
                "/api/auth/onboarding",
                json={"workspace_name": "Acme Studio"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["onboarding_completed"] is True
            assert data["active_workspace_id"] == ws_id

            # Workspace rename persisted
            ws_update = mock_ws.update_one.call_args[0]
            assert ws_update[0] == {"_id": ObjectId(ws_id)}
            assert ws_update[1]["$set"]["name"] == "Acme Studio"

            # User marked completed
            user_update = mock_users.update_one.call_args[0]
            assert user_update[1]["$set"]["onboarding_completed"] is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_onboarding_rejects_empty_name():
    app.dependency_overrides[get_current_user] = _override_user()
    try:
        with patch("app.routes.auth.check_db"):
            response = client.patch("/api/auth/onboarding", json={"workspace_name": "  "})
            assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_onboarding_requires_auth():
    app.dependency_overrides.pop(get_current_user, None)
    response = client.patch("/api/auth/onboarding", json={"workspace_name": "Acme"})
    assert response.status_code in (401, 403)


def test_auth_me_includes_onboarding_completed():
    app.dependency_overrides[get_current_user] = _override_user(completed=True)
    try:
        response = client.get("/api/auth/me")
        assert response.status_code == 200
        assert response.json()["onboarding_completed"] is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)
