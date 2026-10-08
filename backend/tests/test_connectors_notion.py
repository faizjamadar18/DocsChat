"""TDD tests for Connectors — Notion first (Phase 1).

Contract under test:
- GET /api/connectors/status -> per-provider connection status (auth required)
- GET /api/connectors/notion/auth-url -> Notion OAuth URL with state (auth required)
- POST /api/connectors/notion/import -> creates source rows + schedules sync (auth required)
- POST /api/connectors/sources/{id}/resync -> re-sync imported item (owner only)
- DELETE /api/connectors/notion -> revoke + optional delete content
"""
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId

from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "notion-user@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())


def _mock_user(mock_users):
    mock_users.find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "username": "Notion User",
        "email": USER_EMAIL,
        "active_workspace_id": WORKSPACE_ID,
    })


def test_status_requires_auth():
    response = client.get("/api/connectors/status")
    assert response.status_code in (401, 403)


def test_status_returns_providers():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.connector_accounts_collection", create=True) as mock_accounts, \
         patch("app.database.sources_collection", create=True) as mock_sources, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        mock_accounts.find_one = AsyncMock(return_value=None)
        mock_sources.count_documents = AsyncMock(return_value=0)

        response = client.get(
            "/api/connectors/status",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "notion" in data
        assert "drive" in data
        assert "connected" in data["notion"]


def test_notion_auth_url_contains_notion_and_state():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sync_jobs_collection", create=True) as mock_jobs, \
         patch("app.routes.connectors.check_db"), \
         patch("app.routes.connectors.settings") as mock_settings:
        _mock_user(mock_users)
        mock_settings.NOTION_CLIENT_ID = "test-client-id"
        mock_settings.NOTION_REDIRECT_URI = "http://localhost:8000/api/connectors/notion/callback"
        mock_jobs.insert_one = AsyncMock(return_value=None)
        response = client.get(
            "/api/connectors/notion/auth-url",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        assert "api.notion.com" in data["auth_url"] or "notion.com" in data["auth_url"]


def test_notion_import_requires_pages():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        response = client.post(
            "/api/connectors/notion/import",
            json={"pages": []},
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code in (400, 422)


def test_disconnect_not_connected_returns_404_or_ok():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.connector_accounts_collection", create=True) as mock_accounts, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        mock_accounts.find_one = AsyncMock(return_value=None)
        mock_accounts.delete_one = AsyncMock(return_value=None)
        response = client.request(
            "DELETE",
            "/api/connectors/notion",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code in (200, 404)


# ---------------------------------------------------------------------------
# Google Drive (Phase 2)
# ---------------------------------------------------------------------------

def test_drive_auth_url_uses_file_scope_only():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sync_jobs_collection", create=True) as mock_jobs, \
         patch("app.routes.connectors.check_db"), \
         patch("app.routes.connectors.settings") as mock_settings:
        _mock_user(mock_users)
        mock_settings.GOOGLE_DRIVE_CLIENT_ID = "test-drive-client-id"
        mock_settings.GOOGLE_DRIVE_REDIRECT_URI = "http://localhost:8000/api/connectors/drive/callback"
        mock_jobs.insert_one = AsyncMock(return_value=None)
        response = client.get(
            "/api/connectors/drive/auth-url",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code == 200
        data = response.json()
        url = data["auth_url"]
        assert "accounts.google.com" in url
        assert "drive.file" in url
        # Must never request broad/restricted scopes
        assert "drive.readonly" not in url.replace("drive.file", "")
        assert "scope=" in url


def test_drive_picker_token_404_when_not_connected():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.connector_accounts_collection", create=True) as mock_accounts, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        mock_accounts.find_one = AsyncMock(return_value=None)
        response = client.get(
            "/api/connectors/drive/picker-token",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code == 404


def test_drive_import_requires_files():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        response = client.post(
            "/api/connectors/drive/import",
            json={"files": []},
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code in (400, 422)


# ---------------------------------------------------------------------------
# GitHub (Phase 3)
# ---------------------------------------------------------------------------

def test_status_includes_github():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.connector_accounts_collection", create=True) as mock_accounts, \
         patch("app.database.sources_collection", create=True) as mock_sources, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        mock_accounts.find_one = AsyncMock(return_value=None)
        mock_sources.count_documents = AsyncMock(return_value=0)
        response = client.get(
            "/api/connectors/status",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "github" in data
        assert "connected" in data["github"]


def test_github_auth_url_points_to_github():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sync_jobs_collection", create=True) as mock_jobs, \
         patch("app.routes.connectors.check_db"), \
         patch("app.routes.connectors.settings") as mock_settings:
        _mock_user(mock_users)
        mock_settings.GITHUB_APP_CLIENT_ID = "Iv1.testid"
        mock_settings.GITHUB_APP_REDIRECT_URI = "http://localhost:8000/api/connectors/github/callback"
        mock_jobs.insert_one = AsyncMock(return_value=None)
        response = client.get(
            "/api/connectors/github/auth-url",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code == 200
        assert "github.com/login/oauth" in response.json()["auth_url"]


def test_github_import_requires_repos():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        response = client.post(
            "/api/connectors/github/import",
            json={"repos": []},
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code in (400, 422)


def test_github_repos_404_when_not_connected():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.connector_accounts_collection", create=True) as mock_accounts, \
         patch("app.routes.connectors.check_db"):
        _mock_user(mock_users)
        mock_accounts.find_one = AsyncMock(return_value=None)
        response = client.get(
            "/api/connectors/github/repos",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
        )
        assert response.status_code == 404


class _EmptyCursor:
    def sort(self, *a, **k):
        return self

    def __aiter__(self):
        async def gen():
            if False:
                yield {}
        return gen()
