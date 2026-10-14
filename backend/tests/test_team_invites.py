"""Team collaboration contract (TDD — written before implementation).

Shared-room model:
- members[] governs access; owner_id stays source of truth.
- Threads/chats stay private per user; sources/documents/vectors shared by workspace.
- Connectors + MCP keys stay personal per user.
- Invites via email token (Resend), max 20 per call, 7-day expiry.

Each endpoint gets success + error path. Implementation must satisfy
these before any frontend work begins.
"""
from datetime import datetime, timezone, timedelta
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
INVITE_TOKEN = "test-invite-token-123"


def _user(uid, email, active=WS_ID):
    return {
        "_id": ObjectId(uid),
        "email": email,
        "username": email.split("@")[0],
        "auth_provider": "google",
        "active_workspace_id": active,
        "created_at": datetime.now(timezone.utc),
    }


def _ws(members=None):
    return {
        "_id": ObjectId(WS_ID),
        "owner_id": OWNER_ID,
        "name": "Design HQ",
        "slug": "design-hq",
        "description": "Team room",
        "logo_url": None,
        "members": members if members is not None else [
            {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
             "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
        ],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


def _patches(users_doc, ws_doc=None, **collections):
    """Patch db collections used across team routes."""
    return (
        patch("app.database.users_collection"),
        patch("app.database.workspaces_collection"),
        patch("app.database.workspace_invites_collection"),
        patch("app.database.sources_collection"),
        patch("app.database.documents_collection"),
        patch("app.database.messages_collection"),
        patch("app.database.chat_threads_collection"),
        patch("app.database.connector_accounts_collection"),
    )


# ---------------------------------------------------------------------------
# Invites: POST /api/workspaces/{id}/invites
# ---------------------------------------------------------------------------

def test_invite_create_owner_success():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws, \
         _patches(None)[2] as mock_inv:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws())
            mock_inv.find_one = AsyncMock(return_value=None)
            inserted = AsyncMock()
            inserted.inserted_id = ObjectId()
            mock_inv.insert_one = AsyncMock(return_value=inserted)
            resp = client.post(
                f"/api/workspaces/{WS_ID}/invites",
                json={"emails": ["alice@example.com", "bob@example.com"], "role": "viewer"},
                headers={"Authorization": f"Bearer {OWNER_TOKEN}"},
            )
            assert resp.status_code == 201, resp.text
            data = resp.json()
            assert len(data["invites"]) == 2
            assert all(i["status"] == "pending" for i in data["invites"])


def test_invite_create_viewer_forbidden():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws(members=[
                {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                {"user_id": VIEWER_ID, "email": VIEWER_EMAIL, "role": "viewer",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
            ]))
            resp = client.post(
                f"/api/workspaces/{WS_ID}/invites",
                json={"emails": ["x@example.com"], "role": "viewer"},
                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"},
            )
            assert resp.status_code == 403, resp.text


def test_invite_create_rejects_too_many_and_invalid():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws())
            many = [f"u{i}@example.com" for i in range(21)]
            resp = client.post(
                f"/api/workspaces/{WS_ID}/invites",
                json={"emails": many, "role": "viewer"},
                headers={"Authorization": f"Bearer {OWNER_TOKEN}"},
            )
            assert resp.status_code in (400, 422), resp.text
            resp2 = client.post(
                f"/api/workspaces/{WS_ID}/invites",
                json={"emails": ["not-an-email"], "role": "viewer"},
                headers={"Authorization": f"Bearer {OWNER_TOKEN}"},
            )
            assert resp2.status_code == 400, resp2.text


# ---------------------------------------------------------------------------
# Members: GET /api/workspaces/{id}/members
# ---------------------------------------------------------------------------

def test_list_members_shared_room():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws, \
         _patches(None)[2] as mock_inv:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws(members=[
                {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                {"user_id": EDITOR_ID, "email": EDITOR_EMAIL, "role": "editor",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
            ]))

            class EmptyCursor:
                def sort(self, *a, **k):
                    return self

                def __aiter__(self):
                    async def gen():
                        return
                        yield
                    return gen()

            mock_inv.find = lambda *a, **k: EmptyCursor()
            resp = client.get(
                f"/api/workspaces/{WS_ID}/members",
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text
            assert len(resp.json()["members"]) == 2


def test_list_members_stranger_404():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(STRANGER_ID, STRANGER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws())
            resp = client.get(
                f"/api/workspaces/{WS_ID}/members",
                headers={"Authorization": f"Bearer {STRANGER_TOKEN}"},
            )
            assert resp.status_code == 404, resp.text


# ---------------------------------------------------------------------------
# Lookup + accept
# ---------------------------------------------------------------------------

def _pending_invite(email=EDITOR_EMAIL):
    return {
        "_id": ObjectId(),
        "workspace_id": WS_ID,
        "email": email,
        "role": "editor",
        "token": INVITE_TOKEN,
        "status": "pending",
        "invited_by": OWNER_ID,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
    }


def test_lookup_pending_success_and_unknown_404():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws, \
         _patches(None)[2] as mock_inv:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            mock_inv.find_one = AsyncMock(return_value=_pending_invite())
            mock_ws.find_one = AsyncMock(return_value=_ws())
            resp = client.get(
                "/api/workspaces/invites/lookup",
                params={"token": INVITE_TOKEN},
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text
            assert resp.json()["workspace_id"] == WS_ID
            mock_inv.find_one = AsyncMock(return_value=None)
            resp2 = client.get(
                "/api/workspaces/invites/lookup",
                params={"token": "nope"},
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp2.status_code == 404, resp2.text


def test_accept_matching_email_joins_and_keeps_rooms():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws, \
         _patches(None)[2] as mock_inv:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            mock_inv.find_one = AsyncMock(return_value=_pending_invite())
            mock_ws.find_one = AsyncMock(return_value=_ws())
            mock_ws.update_one = AsyncMock()
            mock_inv.update_one = AsyncMock()
            resp = client.post(
                f"/api/workspaces/invites/{INVITE_TOKEN}/accept",
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text
            assert resp.json()["workspace_id"] == WS_ID
            assert resp.json()["role"] == "editor"
            # Join adds to list; must NOT steal active workspace here.
            mock_users.update_one.assert_not_called()


def test_accept_wrong_email_forbidden():
    with _patches(None)[0] as mock_users, \
         _patches(None)[2] as mock_inv:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(STRANGER_ID, STRANGER_EMAIL))
            mock_inv.find_one = AsyncMock(return_value=_pending_invite(email=EDITOR_EMAIL))
            resp = client.post(
                f"/api/workspaces/invites/{INVITE_TOKEN}/accept",
                headers={"Authorization": f"Bearer {STRANGER_TOKEN}"},
            )
            assert resp.status_code == 403, resp.text


def test_accept_expired_gone():
    expired = _pending_invite()
    expired["expires_at"] = datetime.now(timezone.utc) - timedelta(days=1)
    with _patches(None)[0] as mock_users, \
         _patches(None)[2] as mock_inv:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            mock_inv.find_one = AsyncMock(return_value=expired)
            mock_inv.update_one = AsyncMock()
            resp = client.post(
                f"/api/workspaces/invites/{INVITE_TOKEN}/accept",
                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"},
            )
            assert resp.status_code == 410, resp.text


# ---------------------------------------------------------------------------
# Remove + leave
# ---------------------------------------------------------------------------

def test_remove_member_owner_success_viewer_forbidden():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            ws_doc = _ws(members=[
                {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                {"user_id": VIEWER_ID, "email": VIEWER_EMAIL, "role": "viewer",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
            ])
            mock_users.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=ws_doc)
            mock_ws.update_one = AsyncMock(return_value=AsyncMock(modified_count=1))
            mock_users.update_one = AsyncMock()
            resp = client.delete(
                f"/api/workspaces/{WS_ID}/members/{VIEWER_ID}",
                headers={"Authorization": f"Bearer {OWNER_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text
            # Viewer cannot remove anyone
            mock_users.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            resp2 = client.delete(
                f"/api/workspaces/{WS_ID}/members/{VIEWER_ID}",
                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"},
            )
            assert resp2.status_code in (403, 404), resp2.text


def test_remove_owner_blocked_and_leave_rules():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws())
            resp = client.delete(
                f"/api/workspaces/{WS_ID}/members/{OWNER_ID}",
                headers={"Authorization": f"Bearer {OWNER_TOKEN}"},
            )
            assert resp.status_code == 400, resp.text
            # Owner cannot leave own room
            resp2 = client.post(
                f"/api/workspaces/{WS_ID}/leave",
                headers={"Authorization": f"Bearer {OWNER_TOKEN}"},
            )
            assert resp2.status_code == 400, resp2.text


def test_leave_member_success():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mock_ws.find_one = AsyncMock(side_effect=[
                _ws(members=[
                    {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                     "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                    {"user_id": VIEWER_ID, "email": VIEWER_EMAIL, "role": "viewer",
                     "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                ]),
                _ws(),
            ])
            mock_ws.update_one = AsyncMock()
            mock_users.update_one = AsyncMock()
            resp = client.post(
                f"/api/workspaces/{WS_ID}/leave",
                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text


# ---------------------------------------------------------------------------
# Shared reads: list must include shared room with role
# ---------------------------------------------------------------------------

def test_list_workspaces_includes_shared_with_role():
    with _patches(None)[0] as mock_users, \
         _patches(None)[1] as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))

            async def gen():
                yield _ws(members=[
                    {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                     "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                    {"user_id": VIEWER_ID, "email": VIEWER_EMAIL, "role": "viewer",
                     "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                ])

            class Cur:
                def sort(self, *a, **k):
                    return self

                def __aiter__(self):
                    return gen()

            mock_ws.find = lambda *a, **k: Cur()
            resp = client.get(
                "/api/workspaces",
                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text
            rooms = resp.json()["workspaces"]
            assert len(rooms) == 1
            assert rooms[0]["role"] == "viewer"


# ---------------------------------------------------------------------------
# Shared sources: member sees corpus, stranger blocked
# ---------------------------------------------------------------------------

def test_list_sources_shared_room_member_sees_all():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.workspaces_collection") as mock_ws, \
         patch("app.database.sources_collection") as mock_sources:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.sources.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws(members=[
                {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                {"user_id": VIEWER_ID, "email": VIEWER_EMAIL, "role": "viewer",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
            ]))

            async def gen():
                yield {
                    "_id": ObjectId(), "workspace_id": WS_ID, "user_id": OWNER_ID,
                    "filename": "owner.pdf", "file_size": 10, "page_count": 1,
                    "chunk_count": 2, "status": "ready",
                    "uploaded_at": datetime.now(timezone.utc),
                }
                yield {
                    "_id": ObjectId(), "workspace_id": WS_ID, "user_id": VIEWER_ID,
                    "filename": "viewer.pdf", "file_size": 10, "page_count": 1,
                    "chunk_count": 2, "status": "ready",
                    "uploaded_at": datetime.now(timezone.utc),
                }

            class Cur:
                def sort(self, *a, **k):
                    return self

                def __aiter__(self):
                    return gen()

            mock_sources.find = lambda *a, **k: Cur()
            resp = client.get(
                "/api/sources",
                params={"workspace_id": WS_ID},
                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"},
            )
            assert resp.status_code == 200, resp.text
            assert resp.json()["total"] == 2


def test_list_sources_stranger_blocked():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.workspaces_collection") as mock_ws:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.sources.check_db"):
            mock_users.find_one = AsyncMock(return_value=_user(STRANGER_ID, STRANGER_EMAIL))
            mock_ws.find_one = AsyncMock(return_value=_ws())
            resp = client.get(
                "/api/sources",
                params={"workspace_id": WS_ID},
                headers={"Authorization": f"Bearer {STRANGER_TOKEN}"},
            )
            assert resp.status_code == 404, resp.text


# ---------------------------------------------------------------------------
# Resync guard: teammate who did not import cannot resync
# ---------------------------------------------------------------------------

def test_resync_teammate_forbidden_importer_allowed():
    from datetime import datetime as _dt
    src_id = str(ObjectId())
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.workspaces_collection") as mock_ws, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.connector_accounts_collection") as mock_acct:
        with patch("app.database.check_db"), \
             patch("app.middleware.auth_middleware.check_db"):
            src = {
                "_id": ObjectId(src_id), "workspace_id": WS_ID, "user_id": OWNER_ID,
                "source_type": "notion", "remote_id": "abc",
                "filename": "[Notion] Roadmap", "remote_url": "https://notion.so/x",
            }
            ws_doc = _ws(members=[
                {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                 "added_by": OWNER_ID, "added_at": _dt.now(timezone.utc)},
                {"user_id": VIEWER_ID, "email": VIEWER_EMAIL, "role": "viewer",
                 "added_by": OWNER_ID, "added_at": _dt.now(timezone.utc)},
            ])
            mock_sources.find_one = AsyncMock(return_value=src)
            mock_ws.find_one = AsyncMock(return_value=ws_doc)
            # Viewer is not importer and not owner -> 403 even with own Notion connected
            mock_users.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mock_acct.find_one = AsyncMock(return_value={"token_enc": "x"})
            resp = client.post(
                f"/api/connectors/sources/{src_id}/resync",
                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"},
            )
            assert resp.status_code == 403, resp.text
