"""Team connector-import contract (TDD — written before implementation).

- Import into shared room: editor 201 with OWN connected account,
  viewer 403, stranger 404.
- Status endpoint never leaks tokens (no token_enc/refresh_enc/access_enc).
- Resync teammate guard is covered in test_team_invites.py.
"""
from datetime import datetime, timezone
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

OWNER_ID = str(ObjectId())
OWNER_EMAIL = "owner@example.com"
OWNER_TOKEN = create_access_token(OWNER_ID, OWNER_EMAIL)
EDITOR_ID = str(ObjectId())
EDITOR_EMAIL = "editor@example.com"
EDITOR_TOKEN = create_access_token(EDITOR_ID, EDITOR_EMAIL)
VIEWER_ID = str(ObjectId())
VIEWER_EMAIL = "viewer@example.com"
VIEWER_TOKEN = create_access_token(VIEWER_ID, VIEWER_EMAIL)
STRANGER_ID = str(ObjectId())
STRANGER_EMAIL = "stranger@example.com"
STRANGER_TOKEN = create_access_token(STRANGER_ID, STRANGER_EMAIL)
WS_ID = str(ObjectId())


def _user(uid, email):
    return {"_id": ObjectId(uid), "email": email,
            "username": email.split("@")[0], "auth_provider": "google",
            "active_workspace_id": WS_ID,
            "created_at": datetime.now(timezone.utc)}


def _ws(members):
    return {"_id": ObjectId(WS_ID), "owner_id": OWNER_ID, "name": "Design HQ",
            "slug": "design-hq", "members": members,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)}


def _all_members():
    now = datetime.now(timezone.utc)
    return [
        {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
         "added_by": OWNER_ID, "added_at": now},
        {"user_id": EDITOR_ID, "email": EDITOR_EMAIL, "role": "editor",
         "added_by": OWNER_ID, "added_at": now},
        {"user_id": VIEWER_ID, "email": VIEWER_EMAIL, "role": "viewer",
         "added_by": OWNER_ID, "added_at": now},
    ]


def test_drive_import_editor_ok_viewer_forbidden():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.connector_accounts_collection") as ma, \
         patch("app.database.sources_collection") as ms, \
         patch("app.services.drive_sync_service.sync_drive_file",
               new=AsyncMock()):
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.connectors.check_db"):
            mw.find_one = AsyncMock(return_value=_ws(_all_members()))
            ma.find_one = AsyncMock(return_value={"refresh_enc": "x"})
            ms.find_one = AsyncMock(return_value=None)
            ins = AsyncMock()
            ins.inserted_id = ObjectId()
            ms.insert_one = AsyncMock(return_value=ins)
            # editor with own connected account -> 201
            mu.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            resp = client.post(
                "/api/connectors/drive/import",
                params={"workspace_id": WS_ID},
                json={"files": [{"id": "f1", "name": "doc.pdf",
                                  "mimeType": "application/pdf"}]},
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp.status_code == 201, resp.text
            assert resp.json()["total"] == 1
            # viewer -> 403 even with connected account
            mu.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            resp2 = client.post(
                "/api/connectors/drive/import",
                params={"workspace_id": WS_ID},
                json={"files": [{"id": "f2", "name": "x.pdf",
                                  "mimeType": "application/pdf"}]},
                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"},
            )
            assert resp2.status_code == 403, resp2.text


def test_import_stranger_blocked_and_unconnected_404():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.connector_accounts_collection") as ma:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.connectors.check_db"):
            mu.find_one = AsyncMock(return_value=_user(STRANGER_ID, STRANGER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_all_members()))
            resp = client.post(
                "/api/connectors/drive/import",
                params={"workspace_id": WS_ID},
                json={"files": [{"id": "f9", "name": "s.pdf",
                                  "mimeType": "application/pdf"}]},
                headers={"Authorization": f"Bearer {STRANGER_TOKEN}"},
            )
            assert resp.status_code == 404, resp.text
            # editor without connected drive -> 404
            mu.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            ma.find_one = AsyncMock(return_value=None)
            resp2 = client.post(
                "/api/connectors/drive/import",
                params={"workspace_id": WS_ID},
                json={"files": [{"id": "f9", "name": "s.pdf",
                                  "mimeType": "application/pdf"}]},
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp2.status_code == 404, resp2.text


def test_status_never_leaks_tokens():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.connector_accounts_collection") as ma, \
         patch("app.database.sources_collection") as ms:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.connectors.check_db"):
            mu.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            ma.find_one = AsyncMock(return_value={
                "user_id": EDITOR_ID, "provider": "notion",
                "token_enc": "SECRET-TOKEN-MUST-NOT-LEAK",
                "connected_at": datetime.now(timezone.utc),
            })
            ms.count_documents = AsyncMock(return_value=1)
            resp = client.get(
                "/api/connectors/status",
                params={"workspace_id": WS_ID},
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text
            body = resp.text
            assert "SECRET-TOKEN-MUST-NOT-LEAK" not in body
            assert "token_enc" not in body
            assert "refresh_enc" not in body
            assert "access_enc" not in body
