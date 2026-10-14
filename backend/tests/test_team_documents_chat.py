"""Team Studio-docs + chat contract (TDD — written before implementation).

- Studio documents shared by workspace_id: any member lists/gets all.
- Create/update: owner+editor only, viewer 403.
- Delete: owner any, editor own uploads, viewer 403.
- Chat ask: any member 200 on shared corpus; stranger 404.
- Threads/messages stay private per user (user_id + workspace_id).
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
DOC_ID = str(ObjectId())


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


def _members(*roles):
    ids = { "owner": (OWNER_ID, OWNER_EMAIL), "editor": (EDITOR_ID, EDITOR_EMAIL),
            "viewer": (VIEWER_ID, VIEWER_EMAIL) }
    return [{"user_id": ids[r][0], "email": ids[r][1], "role": r,
             "added_by": OWNER_ID, "added_at": datetime.now(timezone.utc)} for r in roles]


def _doc(owner=OWNER_ID):
    now = datetime.now(timezone.utc)
    return {"_id": ObjectId(DOC_ID), "workspace_id": WS_ID, "user_id": owner,
            "title": "Roadmap", "content_json": {}, "content_text": "hello",
            "created_at": now, "updated_at": now}


# --- list shared -----------------------------------------------------------

def test_list_documents_member_sees_all_uploaders():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.documents_collection") as md:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.documents.check_db"):
            mu.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner", "viewer")))

            async def gen():
                d1 = _doc(owner=OWNER_ID)
                yield d1
                d2 = _doc(owner=EDITOR_ID)
                d2["_id"] = ObjectId()
                yield d2

            class Cur:
                def sort(self, *a, **k):
                    return self

                def __aiter__(self):
                    return gen()

            md.find = lambda *a, **k: Cur()
            resp = client.get("/api/documents", params={"workspace_id": WS_ID},
                              headers={"Authorization": f"Bearer {VIEWER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            assert resp.json()["total"] == 2


def test_list_documents_stranger_blocked():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.documents.check_db"):
            mu.find_one = AsyncMock(return_value=_user(STRANGER_ID, STRANGER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner")))
            resp = client.get("/api/documents", params={"workspace_id": WS_ID},
                              headers={"Authorization": f"Bearer {STRANGER_TOKEN}"})
            assert resp.status_code == 404, resp.text


# --- create / update guards -------------------------------------------------

def test_create_document_viewer_forbidden_editor_ok():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.documents_collection") as md:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.documents.check_db"):
            mu.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner", "viewer")))
            resp = client.post("/api/documents", json={"title": "X"},
                               params={"workspace_id": WS_ID},
                               headers={"Authorization": f"Bearer {VIEWER_TOKEN}"})
            assert resp.status_code == 403, resp.text
            mu.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner", "editor")))
            ins = AsyncMock()
            ins.inserted_id = ObjectId()
            md.insert_one = AsyncMock(return_value=ins)
            resp2 = client.post("/api/documents", json={"title": "Y"},
                                params={"workspace_id": WS_ID},
                                headers={"Authorization": f"Bearer {EDITOR_TOKEN}"})
            assert resp2.status_code == 201, resp2.text


def test_update_document_viewer_forbidden():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.documents_collection") as md:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.documents.check_db"):
            mu.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner", "viewer")))
            md.find_one = AsyncMock(return_value=_doc())
            resp = client.patch(f"/api/documents/{DOC_ID}", json={"title": "Z"},
                                headers={"Authorization": f"Bearer {VIEWER_TOKEN}"})
            assert resp.status_code == 403, resp.text


# --- delete guards ----------------------------------------------------------

def test_delete_document_owner_any_editor_own_viewer_never():
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.documents_collection") as md:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.routes.documents.check_db"), \
             patch("app.services.vector_store.delete_source_vectors", return_value=1):
            # owner deletes editor's doc -> ok
            mu.find_one = AsyncMock(return_value=_user(OWNER_ID, OWNER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner", "editor")))
            md.find_one = AsyncMock(return_value=_doc(owner=EDITOR_ID))
            md.delete_one = AsyncMock()
            resp = client.delete(f"/api/documents/{DOC_ID}",
                                 headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            # editor deletes owner's doc -> forbidden (not uploader)
            mu.find_one = AsyncMock(return_value=_user(EDITOR_ID, EDITOR_EMAIL))
            md.find_one = AsyncMock(return_value=_doc(owner=OWNER_ID))
            resp2 = client.delete(f"/api/documents/{DOC_ID}",
                                  headers={"Authorization": f"Bearer {EDITOR_TOKEN}"})
            assert resp2.status_code == 403, resp2.text
            # viewer deletes own-seeming doc -> forbidden (viewers never delete)
            mu.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner", "viewer")))
            md.find_one = AsyncMock(return_value=_doc(owner=VIEWER_ID))
            resp3 = client.delete(f"/api/documents/{DOC_ID}",
                                  headers={"Authorization": f"Bearer {VIEWER_TOKEN}"})
            assert resp3.status_code == 403, resp3.text


# --- chat threads stay private ------------------------------------------------

def test_chat_threads_scoped_to_caller_and_workspace():
    # Ask-guard (member 200 / stranger 404) is covered at the access-helper
    # level; this endpoint test pins thread privacy: threads always carry
    # user_id + workspace_id of the caller.
    with patch("app.database.users_collection") as mu, \
         patch("app.database.workspaces_collection") as mw, \
         patch("app.database.chat_threads_collection") as mt:
        with patch("app.middleware.auth_middleware.check_db"), \
             patch("app.database.check_db"):
            mu.find_one = AsyncMock(return_value=_user(VIEWER_ID, VIEWER_EMAIL))
            mw.find_one = AsyncMock(return_value=_ws(_members("owner", "viewer")))

            async def gen():
                return
                yield

            class Cur:
                def sort(self, *a, **k):
                    return self

                def __aiter__(self):
                    return gen()

            # threads list must be scoped to caller: mock asserts filter
            seen = {}

            def fake_find(filt, *a, **k):
                seen.update(filt)
                return Cur()

            mt.find = fake_find
            resp = client.get("/api/chat/threads",
                              params={"workspace_id": WS_ID},
                              headers={"Authorization": f"Bearer {VIEWER_TOKEN}"})
            assert resp.status_code == 200, resp.text
            assert seen.get("user_id") == VIEWER_ID
            assert seen.get("workspace_id") == WS_ID
