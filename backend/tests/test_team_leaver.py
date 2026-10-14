"""Stranded-leaver contract (TDD — written before implementation).

- leave/remove with no remaining rooms -> active None, never a fake room,
  onboarding_completed untouched.
- leave/remove shreds ONLY the departing user's threads + messages in that
  workspace; other members' content untouched.
- remove_member by owner behaves the same for the removed user.
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
LEAVER_ID = str(ObjectId())
LEAVER_EMAIL = "leaver@example.com"
LEAVER_TOKEN = create_access_token(LEAVER_ID, LEAVER_EMAIL)
WS_ID = str(ObjectId())


def _user(uid, email, active=WS_ID):
    return {"_id": ObjectId(uid), "email": email,
            "username": email.split("@")[0], "auth_provider": "google",
            "active_workspace_id": active, "onboarding_completed": True,
            "created_at": datetime.now(timezone.utc)}


def _ws(members):
    return {"_id": ObjectId(WS_ID), "owner_id": OWNER_ID, "name": "HQ",
            "slug": "hq", "members": members,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)}


def _both():
    now = datetime.now(timezone.utc)
    return [
        {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
         "added_by": OWNER_ID, "added_at": now},
        {"user_id": LEAVER_ID, "email": LEAVER_EMAIL, "role": "viewer",
         "added_by": OWNER_ID, "added_at": now},
    ]


def test_leave_last_room_shreds_own_chats_and_clears_active():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.chat_threads_collection") as mt, \
         patch("app.database.messages_collection") as mm:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.database.check_db"):
            mu.find_one = AsyncMock(return_value=_user(LEAVER_ID, LEAVER_EMAIL))
            mw.find_one = AsyncMock(side_effect=[_ws(_both()), None])
            mw.update_one = AsyncMock()
            mt.delete_many = AsyncMock()
            mm.delete_many = AsyncMock()
            mu.update_one = AsyncMock()
            resp = client.post(f"/api/workspaces/{WS_ID}/leave",
                               headers={"Authorization": f"Bearer {LEAVER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            assert resp.json()["active_workspace_id"] is None
            # own threads + messages in this room shredded...
            mt.delete_many.assert_called_once_with(
                {"workspace_id": WS_ID, "user_id": LEAVER_ID})
            mm.delete_many.assert_called_once_with(
                {"workspace_id": WS_ID, "user_id": LEAVER_ID})
            # ...and onboarding flag never touched
            for c in mu.update_one.call_args_list:
                assert "onboarding_completed" not in str(c)


def test_remove_member_shreds_their_chats_keeps_others():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.chat_threads_collection") as mt, \
         patch("app.database.messages_collection") as mm:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.database.check_db"):
            mu.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mw.find_one = AsyncMock(side_effect=[_ws(_both()), None])
            mw.update_one = AsyncMock(return_value=AsyncMock(modified_count=1))
            mt.delete_many = AsyncMock()
            mm.delete_many = AsyncMock()
            mu.update_one = AsyncMock()
            resp = client.delete(f"/api/workspaces/{WS_ID}/members/{LEAVER_ID}",
                                 headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            mt.delete_many.assert_called_once_with(
                {"workspace_id": WS_ID, "user_id": LEAVER_ID})
            mm.delete_many.assert_called_once_with(
                {"workspace_id": WS_ID, "user_id": LEAVER_ID})
            for c in mu.update_one.call_args_list:
                assert "onboarding_completed" not in str(c)
