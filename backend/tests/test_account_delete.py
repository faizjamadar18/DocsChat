from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import re
from bson import ObjectId
from app.main import app
from app.middleware.auth_middleware import get_current_user

client = TestClient(app)


def _override_user(user_id="user123"):
    async def _dep():
        return {
            "id": user_id,
            "username": "Doomed User",
            "email": "doomed@example.com",
            "auth_provider": "google",
            "picture": None,
            "active_workspace_id": "ws123",
            "onboarding_completed": True,
            "created_at": "2023-01-01T00:00:00Z",
        }
    return _dep


def _mock_collections():
    """Mock every collection the delete endpoint touches."""
    names = [
        "users_collection", "workspaces_collection", "documents_collection",
        "sources_collection", "messages_collection", "chat_threads_collection",
        "voice_logs_collection", "connector_accounts_collection",
        "sync_jobs_collection", "mcp_keys_collection", "oauth_tokens_collection",
    ]
    patches = {n: patch(f"app.database.{n}") for n in names}
    mocked = {n: p.start() for n, p in patches.items()}
    for m in mocked.values():
        m.delete_many = AsyncMock(return_value=None)
        m.delete_one = AsyncMock(return_value=None)
    return patches, mocked


def test_delete_account_requires_auth():
    app.dependency_overrides.pop(get_current_user, None)
    response = client.delete("/api/auth/account")
    assert response.status_code in (401, 403)


def test_delete_account_wipes_only_own_data():
    user_id = str(ObjectId())
    app.dependency_overrides[get_current_user] = _override_user(user_id)
    try:
        patches, mocked = _mock_collections()
        try:
            # Workspaces cursor yields two owned workspaces
            ws1, ws2 = str(ObjectId()), str(ObjectId())

            class FakeCursor:
                def __init__(self, docs):
                    self._docs = docs

                def __aiter__(self):
                    async def _gen():
                        for d in self._docs:
                            yield d
                    return _gen()

            from unittest.mock import MagicMock

            mocked["workspaces_collection"].find = MagicMock(
                side_effect=lambda *a, **k: FakeCursor(
                    [{"_id": ObjectId(ws1)}, {"_id": ObjectId(ws2)}]
                )
            )

            with patch("app.routes.auth.check_db"), \
                 patch("app.routes.auth.vs") as mock_vs:
                from unittest.mock import MagicMock

                mock_vs.delete_workspace_vectors = MagicMock(return_value=1)

                response = client.delete("/api/auth/account")

                assert response.status_code == 200
                assert "deleted" in response.json()["message"].lower()

                # Every destructive filter must be scoped to this user only:
                # either directly by user_id, or by workspace ids that were
                # themselves fetched through an owner-scoped query.
                ws_find_filter = str(mocked["workspaces_collection"].find.call_args)
                assert user_id in ws_find_filter
                owned_ids = {ws1, ws2}

                for name in [
                    "documents_collection", "sources_collection", "messages_collection",
                    "chat_threads_collection", "voice_logs_collection",
                    "connector_accounts_collection", "sync_jobs_collection",
                    "mcp_keys_collection", "oauth_tokens_collection",
                ]:
                    for call in mocked[name].delete_many.call_args_list:
                        filt = str(call)
                        if "workspace_id" in filt:
                            ids_in_filter = set(re.findall(r"[0-9a-f]{24}", filt))
                            assert ids_in_filter == owned_ids, (
                                f"{name} wipes workspaces not owned by user: {filt}"
                            )
                        else:
                            assert user_id in filt, f"{name} filter not scoped to user"

                ws_filter = str(mocked["workspaces_collection"].delete_many.call_args)
                assert user_id in ws_filter

                # User doc itself deleted by _id
                user_filter = mocked["users_collection"].delete_one.call_args[0][0]
                assert user_filter == {"_id": ObjectId(user_id)}

                # Vectors wiped per workspace, never a blanket delete
                assert mock_vs.delete_workspace_vectors.call_count == 2
        finally:
            for p in patches.values():
                p.stop()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_delete_account_survives_vector_failure():
    user_id = str(ObjectId())
    app.dependency_overrides[get_current_user] = _override_user(user_id)
    try:
        patches, mocked = _mock_collections()
        try:
            class FakeCursor:
                def __aiter__(self):
                    async def _gen():
                        yield {"_id": ObjectId()}
                    return _gen()

            mocked["workspaces_collection"].find = lambda *a, **k: FakeCursor()

            def _boom(*a, **k):
                raise RuntimeError("qdrant down")

            with patch("app.routes.auth.check_db"), \
                 patch("app.routes.auth.vs") as mock_vs:
                mock_vs.delete_workspace_vectors = _boom

                response = client.delete("/api/auth/account")

                # Mongo wipe must still succeed even if vectors fail
                assert response.status_code == 200
                mocked["users_collection"].delete_one.assert_called_once()
        finally:
            for p in patches.values():
                p.stop()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
