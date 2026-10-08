"""TDD tests for Ora Voice (Phase 7 revised).

Covers:
- per-user Vapi public key validation + encrypted storage (never returns raw key in status)
- short-lived voice session token for Vapi server tool calls (no user JWT from Vapi)
- tool-call webhook: always HTTP 200 with results/error, workspace isolation, truncation
- separate voice logs (not mixed with text chat threads)
"""
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone


def _make_client():
    from app.main import app
    return TestClient(app)


def _override_app():
    from app.main import fastapi_app
    return fastapi_app


def _auth_override(user_id=None, workspace_id=None):
    return {
        "id": user_id or str(ObjectId()),
        "username": "Test User",
        "email": "test@example.com",
        "auth_provider": "google",
        "picture": None,
        "active_workspace_id": workspace_id or str(ObjectId()),
        "created_at": datetime.now(timezone.utc),
    }


def test_key_validation_rejects_bad_keys():
    from app.services import vapi_key_service as svc
    assert svc.validate_public_key("") is False
    assert svc.validate_public_key("sk-secret-should-fail") is False
    assert svc.validate_public_key("random") is False
    assert svc.validate_public_key("pk-test-abc123") is True


def test_key_encrypt_decrypt_roundtrip():
    from app.services import vapi_key_service as svc
    raw = "pk-test-abc123XYZ"
    enc = svc.encrypt_key(raw)
    assert enc != raw
    assert "pk-test" not in enc
    assert svc.decrypt_key(enc) == raw


def test_key_status_no_key_returns_false():
    client = _make_client()
    from app.middleware.auth_middleware import get_current_user
    target = _override_app()
    target.dependency_overrides[get_current_user] = lambda: _auth_override()
    try:
        with patch("app.database.users_collection") as mock_users:
            mock_users.find_one = AsyncMock(return_value={"_id": ObjectId(), "email": "t@e.com"})
            resp = client.get("/api/voice/key-status")
            assert resp.status_code == 200
            assert resp.json()["has_key"] is False
    finally:
        target.dependency_overrides.clear()


def test_save_key_rejects_private_key():
    client = _make_client()
    from app.middleware.auth_middleware import get_current_user
    target = _override_app()
    target.dependency_overrides[get_current_user] = lambda: _auth_override()
    try:
        resp = client.put("/api/voice/key", json={"public_key": "sk-private-xyz"})
        assert resp.status_code == 400
    finally:
        target.dependency_overrides.clear()


def test_tool_call_requires_session_token():
    client = _make_client()
    payload = {"message": {"type": "tool-calls", "toolCallList": [
        {"id": "c0", "type": "function",
         "function": {"name": "search_workspace_knowledge",
                      "arguments": {"query": "sales?"}}}
    ]}}
    with patch("app.routes.voice.retrieve_workspace_knowledge",
               new=AsyncMock(return_value=("ctx", []))) as mock_retrieve:
        resp = client.post("/api/voice/tool-call", json=payload)
        # Per Vapi spec: always HTTP 200, leak nothing without a valid token.
        assert resp.status_code == 200
        assert "error" in resp.json()["results"][0]
        mock_retrieve.assert_not_called()


def test_tool_call_returns_short_voice_answer():
    client = _make_client()
    from app.services import voice_session_service as sess
    token = sess.create_session_token("user123", "ws123")

    long_context = "Sales grew 20 percent in March. " * 200
    with patch("app.routes.voice.retrieve_workspace_knowledge",
               new=AsyncMock(return_value=(long_context, []))):
        payload = {
            "message": {
                "type": "tool-calls",
                "toolCallList": [
                    {"id": "call_1", "type": "function",
                     "function": {"name": "search_workspace_knowledge",
                                 "arguments": {"query": "sales?"}}}
                ],
            }
        }
        resp = client.post(f"/api/voice/tool-call?token={token}", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert len(data["results"]) == 1
        assert data["results"][0]["toolCallId"] == "call_1"
        # Cost saver: spoken answer must be short (no full dump)
        assert len(data["results"][0]["result"]) <= 1500


def test_tool_call_greeting_skips_retrieval():
    client = _make_client()
    from app.services import voice_session_service as sess
    token = sess.create_session_token("user123", "ws123")
    with patch("app.routes.voice.retrieve_workspace_knowledge",
               new=AsyncMock()) as mock_retrieve:
        payload = {
            "message": {
                "type": "tool-calls",
                "toolCallList": [
                    {"id": "c2", "type": "function",
                     "function": {"name": "search_workspace_knowledge",
                                 "arguments": {"query": "hi"}}}
                ],
            }
        }
        resp = client.post(f"/api/voice/tool-call?token={token}", json=payload)
        assert resp.status_code == 200
        mock_retrieve.assert_not_called()


def test_tool_call_inventory_answered_from_catalog():
    client = _make_client()
    from app.services import voice_session_service as sess
    token = sess.create_session_token("user123", "ws123")
    catalog = ("- Studio Documents (2 total): Plan, Notes\n"
               "- Uploaded Assets (3 total): a.pdf, b.pdf, c.pdf", 2, 3)
    with patch("app.routes.voice.get_workspace_catalog",
               new=AsyncMock(return_value=catalog)), \
         patch("app.routes.voice.retrieve_workspace_knowledge",
               new=AsyncMock()) as mock_retrieve:
        payload = {
            "message": {
                "type": "tool-calls",
                "toolCallList": [
                    {"id": "c3", "type": "function",
                     "function": {"name": "search_workspace_knowledge",
                                 "arguments": {"query": "how many documents and assets do I have?"}}}
                ],
            }
        }
        resp = client.post(f"/api/voice/tool-call?token={token}", json=payload)
        assert resp.status_code == 200
        result = resp.json()["results"][0]["result"]
        assert "2" in result and "3" in result
        mock_retrieve.assert_not_called()


def test_bootstrap_returns_key_and_token_in_one_call():
    client = _make_client()
    from app.middleware.auth_middleware import get_current_user
    from app.services import vapi_key_service as svc
    target = _override_app()
    me = _auth_override()
    target.dependency_overrides[get_current_user] = lambda: me
    try:
        with patch("app.routes.voice.check_db", return_value=None), \
             patch("app.routes.voice._workspace_owned_by", new=AsyncMock(return_value=True)), \
             patch("app.database.users_collection") as mock_users:
            mock_users.find_one = AsyncMock(return_value={
                "_id": ObjectId(me["id"]),
                "vapi_public_key_enc": svc.encrypt_key("pk-test-bootstrap123"),
            })
            resp = client.post("/api/voice/bootstrap", json={"workspace_id": me["active_workspace_id"]})
            assert resp.status_code == 200
            data = resp.json()
            assert data["has_key"] is True
            assert data["public_key"] == "pk-test-bootstrap123"
            assert data["token"]
    finally:
        target.dependency_overrides.clear()


def test_bootstrap_no_key_costs_nothing():
    client = _make_client()
    from app.middleware.auth_middleware import get_current_user
    target = _override_app()
    me = _auth_override()
    target.dependency_overrides[get_current_user] = lambda: me
    try:
        with patch("app.routes.voice.check_db", return_value=None), \
             patch("app.routes.voice._workspace_owned_by", new=AsyncMock(return_value=True)), \
             patch("app.database.users_collection") as mock_users:
            mock_users.find_one = AsyncMock(return_value={"_id": ObjectId(me["id"])})
            resp = client.post("/api/voice/bootstrap", json={"workspace_id": me["active_workspace_id"]})
            assert resp.status_code == 200
            assert resp.json()["has_key"] is False
    finally:
        target.dependency_overrides.clear()


def test_voice_logs_are_separate_from_chat():
    client = _make_client()
    from app.middleware.auth_middleware import get_current_user
    target = _override_app()
    me = _auth_override()
    target.dependency_overrides[get_current_user] = lambda: me
    try:
        with patch("app.database.voice_logs_collection") as mock_logs, \
             patch("app.routes.voice._workspace_owned_by", new=AsyncMock(return_value=True)), \
             patch("app.routes.voice.check_db", return_value=None):
            mock_logs.insert_one = AsyncMock(return_value=type("R", (), {"inserted_id": ObjectId()})())
            resp = client.post("/api/voice/logs", json={
                "workspace_id": "ws123",
                "user_text": "Summarize report",
                "ora_text": "Sales grew 20 percent.",
                "duration_seconds": 34,
            })
            assert resp.status_code == 200
            assert mock_logs.insert_one.called
            saved = mock_logs.insert_one.call_args[0][0]
            # Must be tagged as voice-only, never as text thread
            assert saved["channel"] == "voice"
            assert saved["user_id"] == me["id"]
    finally:
        target.dependency_overrides.clear()
