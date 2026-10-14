"""Stale-active-room contract (TDD — written before implementation).

Leaving/deleting must never strand a pointer at a room the caller can no
longer open:
- leave with no remaining rooms -> active explicitly cleared to None
  (today the update is skipped, leaving a dead pointer -> dashboard 404).
- delete_workspace repoints every affected member (not just the deleter):
  member with another room -> that room; member with none -> None.
- remove_member already clears; onboarding flag untouched everywhere.
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
MEMBER_ID = str(ObjectId())
MEMBER_EMAIL = "member@example.com"
MEMBER_TOKEN = create_access_token(MEMBER_ID, MEMBER_EMAIL)
WS_ID = str(ObjectId())
OTHER_WS = str(ObjectId())


def _user(uid, email, active=WS_ID):
    return {"_id": ObjectId(uid), "email": email,
            "username": email.split("@")[0], "auth_provider": "google",
            "active_workspace_id": active, "onboarding_completed": True,
            "created_at": datetime.now(timezone.utc)}


def _ws(ws_id=WS_ID, members=None):
    return {"_id": ObjectId(ws_id), "owner_id": OWNER_ID, "name": "HQ",
            "slug": "hq", "members": members if members is not None else [
                {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
                {"user_id": MEMBER_ID, "email": MEMBER_EMAIL, "role": "viewer",
                 "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
            ],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)}


def test_leave_last_room_clears_active_to_none():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.chat_threads_collection") as mt, \
         patch("app.database.messages_collection") as mm:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.database.check_db"):
            mu.find_one = AsyncMock(return_value=_user(MEMBER_ID, MEMBER_EMAIL))
            mw.find_one = AsyncMock(side_effect=[_ws(), None])
            mw.update_one = AsyncMock()
            mt.delete_many = AsyncMock()
            mm.delete_many = AsyncMock()
            mu.update_one = AsyncMock()
            resp = client.post(f"/api/workspaces/{WS_ID}/leave",
                               headers={"Authorization": f"Bearer {MEMBER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            assert resp.json()["active_workspace_id"] is None
            # Pointer explicitly cleared — never left aiming at the old room.
            mu.update_one.assert_called_once()
            filt, update = mu.update_one.call_args[0]
            assert filt == {"_id": ObjectId(MEMBER_ID), "active_workspace_id": WS_ID}
            assert update == {"$set": {"active_workspace_id": None}}


def test_delete_repoints_affected_members():
    other = _ws(ws_id=OTHER_WS, members=[
        {"user_id": MEMBER_ID, "email": MEMBER_EMAIL, "role": "viewer",
         "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)},
    ])
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.documents_collection") as md, \
         patch("app.database.sources_collection") as ms, \
         patch("app.database.messages_collection") as mm, \
         patch("app.database.chat_threads_collection") as mt, \
         patch("app.database.workspace_invites_collection") as mi:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.database.check_db"), \
             patch("app.services.vector_store.delete_workspace_vectors",
                   return_value=1):
            mu.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mw.find_one = AsyncMock(side_effect=[
                _ws(),    # access check
                other,    # deleter's next room
                other,    # member's next room
            ])
            mw.delete_one = AsyncMock()
            md.delete_many = AsyncMock()
            ms.delete_many = AsyncMock()
            mm.delete_many = AsyncMock()
            mt.delete_many = AsyncMock()
            mi.delete_many = AsyncMock()
            mu.update_one = AsyncMock()
            resp = client.delete(f"/api/workspaces/{WS_ID}",
                                 headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            # Deleter -> other room; affected member -> their next room too.
            sets = [c[0][1]["$set"].get("active_workspace_id")
                    for c in mu.update_one.call_args_list]
            assert str(other["_id"]) in sets
            member_updates = [
                c for c in mu.update_one.call_args_list
                if c[0][0].get("_id") == ObjectId(MEMBER_ID)]
            assert len(member_updates) == 1
            assert member_updates[0][0][1]["$set"]["active_workspace_id"] == str(other["_id"])


def test_delete_member_with_no_other_room_cleared_to_none():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.documents_collection") as md, \
         patch("app.database.sources_collection") as ms, \
         patch("app.database.messages_collection") as mm, \
         patch("app.database.chat_threads_collection") as mt, \
         patch("app.database.workspace_invites_collection") as mi:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.database.check_db"), \
             patch("app.services.vector_store.delete_workspace_vectors",
                   return_value=1):
            mu.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mw.find_one = AsyncMock(side_effect=[
                _ws(),    # access check
                None,     # deleter has no remaining room -> fresh provision
                None,     # member has no remaining room either
            ])
            mw.delete_one = AsyncMock()
            md.delete_many = AsyncMock()
            ms.delete_many = AsyncMock()
            mm.delete_many = AsyncMock()
            mt.delete_many = AsyncMock()
            mi.delete_many = AsyncMock()
            fresh = AsyncMock()
            fresh.inserted_id = ObjectId()
            mw.insert_one = AsyncMock(return_value=fresh)
            mu.update_one = AsyncMock()
            resp = client.delete(f"/api/workspaces/{WS_ID}",
                                 headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            member_updates = [
                c for c in mu.update_one.call_args_list
                if c[0][0].get("_id") == ObjectId(MEMBER_ID)]
            assert len(member_updates) == 1
            assert member_updates[0][0][1]["$set"]["active_workspace_id"] is None
