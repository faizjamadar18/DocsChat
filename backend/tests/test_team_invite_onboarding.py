"""Invite onboarding contract (TDD — written before implementation).

Letter-never-lost + no-double-room rules for brand-new users arriving
via an invite link:
- POST /api/auth/google accepts optional invite_token. Valid pending
  invite matching the Google email -> NO personal workspace provisioned,
  active_workspace_id None, is_new_user True.
- Invalid/expired/mismatched invite_token -> ignored silently, normal
  solo provision (existing behavior unchanged).
- PATCH /api/auth/onboarding accepts optional invite_token. Valid invite
  for the caller -> marks onboarding complete WITHOUT requiring or
  renaming a personal workspace, active stays None.
- Invalid invite_token -> normal rename path (existing tests unchanged).
- Abandoned invite path stays safe: next login with no active workspace
  provisions a solo room via the existing fallback.
"""
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth_middleware import get_current_user

client = TestClient(app)

NEW_EMAIL = "invited@example.com"
WS_ID = str(ObjectId())
INVITE_TOKEN = "invite-onboarding-token-1"


def _pending_invite(email=NEW_EMAIL):
    return {
        "_id": ObjectId(),
        "workspace_id": WS_ID,
        "email": email,
        "role": "viewer",
        "token": INVITE_TOKEN,
        "status": "pending",
        "invited_by": str(ObjectId()),
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
    }


def _google_ok(email=NEW_EMAIL, name="Invited User"):
    return {"email": email, "name": name, "picture": None, "sub": "google-x"}


# --- google login with invite_token ------------------------------------------

def test_google_login_new_user_with_valid_invite_skips_personal_room():
    with patch("app.routes.auth.id_token.verify_oauth2_token",
               return_value=_google_ok()), \
         patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.workspace_invites_collection") as mi, \
         patch("app.routes.auth.check_db"):
        mu.find_one = AsyncMock(return_value=None)
        ins = AsyncMock()
        ins.inserted_id = ObjectId()
        mu.insert_one = AsyncMock(return_value=ins)
        mu.update_one = AsyncMock()
        mw.insert_one = AsyncMock()
        mi.find_one = AsyncMock(return_value=_pending_invite())
        resp = client.post("/api/auth/google",
                           json={"credential": "c", "invite_token": INVITE_TOKEN})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        # No onboarding detour: completed at signup, straight to Join page.
        assert data["is_new_user"] is False
        assert data["user"]["onboarding_completed"] is True
        assert data["user"]["active_workspace_id"] is None
        mw.insert_one.assert_not_called()


def test_google_login_invite_mismatch_or_expired_falls_back_to_solo():
    with patch("app.routes.auth.id_token.verify_oauth2_token",
               return_value=_google_ok(email="other@example.com")), \
         patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.workspace_invites_collection") as mi, \
         patch("app.routes.auth.check_db"):
        mu.find_one = AsyncMock(return_value=None)
        ins = AsyncMock()
        ins.inserted_id = ObjectId()
        mu.insert_one = AsyncMock(return_value=ins)
        mu.update_one = AsyncMock()
        ws_ins = AsyncMock()
        ws_ins.inserted_id = ObjectId()
        mw.insert_one = AsyncMock(return_value=ws_ins)
        # invite is for NEW_EMAIL but Google email differs -> ignored
        mi.find_one = AsyncMock(return_value=_pending_invite())
        resp = client.post("/api/auth/google",
                           json={"credential": "c", "invite_token": INVITE_TOKEN})
        assert resp.status_code == 200, resp.text
        assert resp.json()["user"]["active_workspace_id"] == str(ws_ins.inserted_id)
        mw.insert_one.assert_called_once()


def test_google_login_bogus_invite_token_falls_back_to_solo():
    with patch("app.routes.auth.id_token.verify_oauth2_token",
               return_value=_google_ok()), \
         patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.workspace_invites_collection") as mi, \
         patch("app.routes.auth.check_db"):
        mu.find_one = AsyncMock(return_value=None)
        ins = AsyncMock()
        ins.inserted_id = ObjectId()
        mu.insert_one = AsyncMock(return_value=ins)
        mu.update_one = AsyncMock()
        ws_ins = AsyncMock()
        ws_ins.inserted_id = ObjectId()
        mw.insert_one = AsyncMock(return_value=ws_ins)
        mi.find_one = AsyncMock(return_value=None)
        resp = client.post("/api/auth/google",
                           json={"credential": "c", "invite_token": "nope"})
        assert resp.status_code == 200, resp.text
        mw.insert_one.assert_called_once()


# --- onboarding with invite_token --------------------------------------------

def _override_user(uid):
    async def _dep():
        return {"id": uid, "username": "Invited", "email": NEW_EMAIL,
                "auth_provider": "google", "picture": None,
                "active_workspace_id": None, "onboarding_completed": False,
                "created_at": "2024-01-01T00:00:00Z"}
    return _dep


def test_onboarding_with_valid_invite_completes_roomless():
    uid = str(ObjectId())
    app.dependency_overrides[get_current_user] = _override_user(uid)
    try:
        with patch("app.routes.auth.check_db"), \
             patch("app.database.workspaces_collection") as mw, \
             patch("app.database.users_collection") as mu, \
             patch("app.database.workspace_invites_collection") as mi:
            mi.find_one = AsyncMock(return_value=_pending_invite())
            mw.update_one = AsyncMock()
            mw.insert_one = AsyncMock()
            mu.update_one = AsyncMock()
            resp = client.patch("/api/auth/onboarding",
                                json={"invite_token": INVITE_TOKEN})
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["onboarding_completed"] is True
            assert data["active_workspace_id"] is None
            # no personal room renamed or created
            mw.update_one.assert_not_called()
            mw.insert_one.assert_not_called()
            mu.update_one.assert_called_once()
            assert mu.update_one.call_args[0][1]["$set"]["onboarding_completed"] is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_onboarding_roomless_without_token_provisions_solo_room():
    # Expired-link safety net: room-less user with no valid invite gets a
    # solo room instead of a 404 that would strand onboarding incomplete.
    uid = str(ObjectId())
    app.dependency_overrides[get_current_user] = _override_user(uid)
    try:
        with patch("app.routes.auth.check_db"), \
             patch("app.database.workspaces_collection") as mw, \
             patch("app.database.users_collection") as mu, \
             patch("app.database.workspace_invites_collection") as mi:
            mi.find_one = AsyncMock(return_value=None)
            mw.find_one = AsyncMock(return_value=None)
            ins = AsyncMock()
            ins.inserted_id = ObjectId()
            mw.insert_one = AsyncMock(return_value=ins)
            mu.update_one = AsyncMock()
            resp = client.patch("/api/auth/onboarding",
                                json={"workspace_name": "Solo"})
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["onboarding_completed"] is True
            assert data["active_workspace_id"] == str(ins.inserted_id)
            mw.insert_one.assert_called_once()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_onboarding_with_bogus_invite_uses_normal_path():
    uid = str(ObjectId())
    ws_id = str(ObjectId())
    app.dependency_overrides[get_current_user] = _override_user(uid)
    try:
        with patch("app.routes.auth.check_db"), \
             patch("app.database.workspaces_collection") as mw, \
             patch("app.database.users_collection") as mu, \
             patch("app.database.workspace_invites_collection") as mi:
            mi.find_one = AsyncMock(return_value=None)
            mock_ws = {"_id": ObjectId(ws_id), "owner_id": uid,
                       "name": "HQ", "slug": "hq"}
            mw.find_one = AsyncMock(side_effect=[mock_ws, None])
            mw.update_one = AsyncMock()
            mu.update_one = AsyncMock()
            resp = client.patch("/api/auth/onboarding",
                                json={"workspace_name": "Acme",
                                      "invite_token": "bogus"})
            assert resp.status_code == 200, resp.text
            assert resp.json()["active_workspace_id"] == ws_id
            mw.update_one.assert_called_once()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
