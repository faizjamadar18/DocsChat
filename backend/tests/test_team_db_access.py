"""Team DB + access-helper contract (TDD — written before implementation).

Slice 1 of Option A strict granular TDD. Covers ONLY:
- workspace members backfill shape in run_migrations
- workspace_access.role_of / require_role / member_entry
- workspace_access.get_workspace_with_access (400/404/success)

No invites API, no sources guard, no resync guard here — those get
their own test-first slices. Do NOT implement app code until this
contract is approved.
"""
import pytest
from datetime import datetime
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from fastapi import HTTPException

OWNER_ID = str(ObjectId())
OWNER_EMAIL = "owner@example.com"
MEMBER_ID = str(ObjectId())
STRANGER_ID = str(ObjectId())


def _ws(owner_id=OWNER_ID, members=None):
    return {
        "_id": ObjectId(),
        "owner_id": owner_id,
        "name": "Design HQ",
        "slug": "design-hq",
        "members": members,
    }


# ---------------------------------------------------------------------------
# role_of: pure function, sync
# ---------------------------------------------------------------------------

def test_role_of_owner_via_owner_id_even_without_members():
    from app.services.workspace_access import role_of
    assert role_of(_ws(members=None), OWNER_ID) == "owner"
    assert role_of(_ws(members=[]), OWNER_ID) == "owner"


def test_role_of_member_editor_viewer():
    from app.services.workspace_access import role_of
    ws = _ws(members=[
        {"user_id": OWNER_ID, "email": OWNER_EMAIL, "role": "owner"},
        {"user_id": MEMBER_ID, "email": "m@example.com", "role": "editor"},
    ])
    assert role_of(ws, MEMBER_ID) == "editor"
    ws["members"][1]["role"] = "viewer"
    assert role_of(ws, MEMBER_ID) == "viewer"


def test_role_of_stranger_none_and_bad_role_defaults_viewer():
    from app.services.workspace_access import role_of
    ws = _ws(members=[{"user_id": MEMBER_ID, "role": "superadmin"}])
    assert role_of(ws, MEMBER_ID) == "viewer"
    assert role_of(ws, STRANGER_ID) is None
    assert role_of({}, OWNER_ID) is None
    assert role_of(None, OWNER_ID) is None


def test_require_role_allows_and_blocks():
    from app.services.workspace_access import require_role
    require_role("owner", ("owner",))
    require_role("editor", ("owner", "editor"))
    with pytest.raises(HTTPException) as exc:
        require_role("viewer", ("owner", "editor"))
    assert exc.value.status_code == 403
    with pytest.raises(HTTPException) as exc2:
        require_role(None, ("owner",))
    assert exc2.value.status_code == 404


def test_member_entry_shape():
    from app.services.workspace_access import member_entry
    m = member_entry(MEMBER_ID, "m@example.com", "editor", OWNER_ID)
    assert m["user_id"] == MEMBER_ID
    assert m["email"] == "m@example.com"
    assert m["role"] == "editor"
    assert m["added_by"] == OWNER_ID
    assert isinstance(m["added_at"], datetime)


# ---------------------------------------------------------------------------
# get_workspace_with_access: async, mocked db
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_workspace_bad_id_400():
    from app.services.workspace_access import get_workspace_with_access
    with pytest.raises(HTTPException) as exc:
        await get_workspace_with_access("not-an-id", OWNER_ID)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_get_workspace_missing_404():
    from app.services.workspace_access import get_workspace_with_access
    with patch("app.database.workspaces_collection") as mock_ws, \
         patch("app.database.check_db"):
        mock_ws.find_one = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc:
            await get_workspace_with_access(str(ObjectId()), OWNER_ID)
        assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_get_workspace_stranger_404_owner_and_member_success():
    from app.services.workspace_access import get_workspace_with_access
    ws_id = str(ObjectId())
    ws_doc = {
        "_id": ObjectId(ws_id),
        "owner_id": OWNER_ID,
        "name": "Design HQ",
        "members": [
            {"user_id": OWNER_ID, "role": "owner"},
            {"user_id": MEMBER_ID, "role": "viewer"},
        ],
    }
    with patch("app.database.workspaces_collection") as mock_ws, \
         patch("app.database.check_db"):
        mock_ws.find_one = AsyncMock(return_value=ws_doc)
        _ws, role = await get_workspace_with_access(ws_id, OWNER_ID)
        assert role == "owner"
        _ws2, role2 = await get_workspace_with_access(ws_id, MEMBER_ID)
        assert role2 == "viewer"
        with pytest.raises(HTTPException) as exc:
            await get_workspace_with_access(ws_id, STRANGER_ID)
        assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Migration: workspaces without members get owner backfilled
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_migration_backfills_owner_member():
    import app.database as database
    ws_id = ObjectId()
    ws_doc = {
        "_id": ws_id,
        "owner_id": OWNER_ID,
        "name": "Legacy Room",
        "slug": "legacy-room",
        "created_at": datetime.now(),
    }

    async def memberless_cursor():
        yield ws_doc

    updated = {}

    async def fake_update_one(filt, update):
        updated["filter"] = filt
        updated["update"] = update
        m = AsyncMock()
        m.matched_count = 1
        return m

    with patch.object(database, "workspaces_collection") as mock_ws, \
         patch.object(database, "users_collection") as mock_users:
        mock_users.find_one = AsyncMock(return_value=None)
        mock_ws.find.side_effect = [
            _empty_cursor(),   # legacy owner_id/slug pass: none
            _cursor_of([ws_doc]),  # members backfill pass
        ]
        mock_ws.find_one = AsyncMock(return_value=None)
        mock_ws.update_one = AsyncMock(side_effect=fake_update_one)
        mock_users.update_many = AsyncMock()
        mock_users.find = lambda *a, **k: _empty_cursor()

        await database.run_migrations()

        assert updated["filter"] == {"_id": ws_id}
        members = updated["update"]["$set"]["members"]
        assert len(members) == 1
        assert members[0]["user_id"] == OWNER_ID
        assert members[0]["role"] == "owner"


def _empty_cursor():
    class Cur:
        def __aiter__(self):
            async def gen():
                return
                yield
            return gen()
    return Cur()


def _cursor_of(docs):
    class Cur:
        def __aiter__(self):
            async def gen():
                for d in docs:
                    yield d
            return gen()
    return Cur()
