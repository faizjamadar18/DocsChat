"""MCP Server tests (TDD — written before implementation).

Covers Phase 1 (Claude):
- Personal API key create / list / revoke with per-user isolation.
- workspace_search returns passages with source + page.
- document_fetch returns one document, 404/400 cases.
- OAuth discovery metadata shape required by Claude.
- DCR register + PKCE authorize-code exchange.
- /mcp requires auth (401 without token).
"""
import hashlib
import json
from unittest.mock import patch, AsyncMock

from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "mcpuser@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())
OTHER_USER_ID = str(ObjectId())
SOURCE_ID = str(ObjectId())
DOC_ID = str(ObjectId())


def _user_doc(user_id=USER_ID, workspace_id=WORKSPACE_ID):
    return {
        "_id": ObjectId(user_id),
        "email": USER_EMAIL,
        "username": "McpUser",
        "auth_provider": "google",
        "active_workspace_id": workspace_id,
        "created_at": "2024-01-01T00:00:00Z",
    }


def _auth_headers(token=USER_TOKEN):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Personal API keys
# ---------------------------------------------------------------------------

def test_mcp_key_create_returns_raw_once_and_list_hides_secret():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.mcp_keys_collection") as mock_keys, \
         patch("app.routes.mcp_keys.check_db"), \
         patch("app.middleware.auth_middleware.check_db"):
        mock_users.find_one = AsyncMock(return_value=_user_doc())

        inserted_id = ObjectId()

        async def _insert(doc):
            assert doc["user_id"] == USER_ID
            # Only a hash is stored, never the raw key.
            assert "key_hash" in doc
            assert "key_prefix" in doc
            assert "key_raw" not in doc
            assert doc.get("revoked") is False
            m = AsyncMock()
            m.inserted_id = inserted_id
            return m

        mock_keys.insert_one = AsyncMock(side_effect=_insert)
        resp = client.post(
            "/api/mcp-keys",
            json={"name": "Claude", "workspace_id": WORKSPACE_ID},
            headers=_auth_headers(),
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["api_key"].startswith("dsk_")
        assert data["id"] == str(inserted_id)

        # List must not leak hashes or raw keys.
        class _FakeCursor:
            def sort(self, *a, **k):
                return self

            async def to_list(self, *a, **k):
                return [{
                    "_id": inserted_id,
                    "user_id": USER_ID,
                    "workspace_id": WORKSPACE_ID,
                    "name": "Claude",
                    "key_prefix": "dsk_abc",
                    "created_at": "2024-01-01T00:00:00Z",
                    "revoked": False,
                }]

        mock_keys.find = lambda *a, **k: _FakeCursor()
        resp = client.get("/api/mcp-keys", headers=_auth_headers())
        assert resp.status_code == 200, resp.text
        items = resp.json()["keys"]
        assert len(items) == 1
        assert items[0]["name"] == "Claude"
        assert "api_key" not in items[0]
        assert "key_hash" not in items[0]


def test_mcp_key_revoke_and_other_user_cannot_revoke():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.mcp_keys_collection") as mock_keys, \
         patch("app.routes.mcp_keys.check_db"), \
         patch("app.middleware.auth_middleware.check_db"):
        mock_users.find_one = AsyncMock(return_value=_user_doc())
        key_url = f"/api/mcp-keys/{str(ObjectId())}"
        mock_keys.update_one = AsyncMock(
            return_value=AsyncMock(matched_count=1)
        )
        resp = client.delete(key_url, headers=_auth_headers())
        assert resp.status_code == 200, resp.text
        # update is scoped to the caller's user_id.
        filt = mock_keys.update_one.call_args[0][0]
        assert filt["user_id"] == USER_ID

        mock_keys.update_one = AsyncMock(
            return_value=AsyncMock(matched_count=0)
        )
        resp = client.delete(key_url, headers=_auth_headers())
        assert resp.status_code == 404


def test_mcp_keys_require_login():
    resp = client.get("/api/mcp-keys")
    assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Tool logic (per-user isolation)
# ---------------------------------------------------------------------------

def test_workspace_search_returns_passages_with_source_and_location():
    from app.services import mcp_server as mcp_svc
    import asyncio as _aio

    citations = [
        {
            "source_id": SOURCE_ID,
            "filename": "Leave Policy.pdf",
            "page": 3,
            "snippet": "Sick leaves: 12 per year",
            "similarity_score": 0.91,
        },
    ]
    with patch.object(
        mcp_svc, "retrieve_workspace_knowledge",
        new=AsyncMock(return_value=("Sick leaves: 12 per year", citations)),
    ), patch.object(mcp_svc, "check_db", return_value=None):
        passages = _aio.new_event_loop().run_until_complete(
            mcp_svc.search_workspace_for_user(
                USER_ID, WORKSPACE_ID, "sick leaves", top_k=5
            )
        )
    assert len(passages) == 1
    p = passages[0]
    assert p["source_name"] == "Leave Policy.pdf"
    assert p["page"] == 3
    assert p["source_id"] == SOURCE_ID
    assert "Sick leaves" in p["text"]


def test_workspace_search_empty_query_rejected():
    from app.services import mcp_server as mcp_svc
    import asyncio as _aio
    try:
        with patch.object(mcp_svc, "check_db", return_value=None):
            _aio.new_event_loop().run_until_complete(
                mcp_svc.search_workspace_for_user(
                    USER_ID, WORKSPACE_ID, "  ", top_k=5
                )
            )
    except ValueError:
        return
    raise AssertionError("empty query must raise ValueError")


def test_document_fetch_studio_doc_and_pdf_source():
    from app.services import mcp_server as mcp_svc
    import asyncio as _aio
    loop = _aio.new_event_loop()

    studio_id = str(ObjectId())
    with patch("app.services.mcp_server.check_db"), \
         patch("app.database.documents_collection") as mock_docs, \
         patch("app.database.sources_collection") as mock_sources:
        mock_docs.find_one = AsyncMock(return_value={
            "_id": ObjectId(studio_id),
            "user_id": USER_ID,
            "workspace_id": WORKSPACE_ID,
            "title": "My Notes",
            "content_text": "Hello world " * 100,
        })
        mock_sources.find_one = AsyncMock(return_value=None)
        doc = loop.run_until_complete(
            mcp_svc.fetch_document_for_user(USER_ID, WORKSPACE_ID, studio_id)
        )
        assert doc["source_name"] == "My Notes"
        assert "Hello world" in doc["text"]

    pdf_id = str(ObjectId())
    with patch("app.services.mcp_server.check_db"), \
         patch("app.database.documents_collection") as mock_docs, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.services.mcp_server.vs") as mock_vs:
        mock_docs.find_one = AsyncMock(return_value=None)
        mock_sources.find_one = AsyncMock(return_value={
            "_id": ObjectId(pdf_id),
            "user_id": USER_ID,
            "workspace_id": WORKSPACE_ID,
            "filename": "Policy.pdf",
            "page_count": 10,
            "status": "ready",
        })
        mock_vs.query_workspace_documents = lambda **k: [{
            "document": "chunk one text",
            "metadata": {"source_id": pdf_id, "page": 0},
            "similarity_score": 0.9,
            "rank": 1,
        }]
        doc = loop.run_until_complete(
            mcp_svc.fetch_document_for_user(USER_ID, WORKSPACE_ID, pdf_id)
        )
        assert doc["source_name"] == "Policy.pdf"
        assert "chunk one" in doc["text"]


def test_document_fetch_other_user_doc_is_404():
    from app.services import mcp_server as mcp_svc
    from fastapi import HTTPException
    import asyncio as _aio
    loop = _aio.new_event_loop()
    with patch("app.services.mcp_server.check_db"), \
         patch("app.database.documents_collection") as mock_docs, \
         patch("app.database.sources_collection") as mock_sources:
        mock_docs.find_one = AsyncMock(return_value=None)
        mock_sources.find_one = AsyncMock(return_value=None)
        try:
            loop.run_until_complete(
                mcp_svc.fetch_document_for_user(
                    USER_ID, WORKSPACE_ID, str(ObjectId())
                )
            )
        except HTTPException as e:
            assert e.status_code == 404
            return
        raise AssertionError("other-user doc must 404")


def test_document_fetch_invalid_id_is_400():
    from app.services import mcp_server as mcp_svc
    from fastapi import HTTPException
    import asyncio as _aio
    try:
        with patch.object(mcp_svc, "check_db", return_value=None):
            _aio.new_event_loop().run_until_complete(
                mcp_svc.fetch_document_for_user(
                    USER_ID, WORKSPACE_ID, "not-an-id"
                )
            )
    except HTTPException as e:
        assert e.status_code == 400
        return
    raise AssertionError("invalid id must 400")


# ---------------------------------------------------------------------------
# OAuth discovery + DCR (what Claude's sign-in flow needs)
# ---------------------------------------------------------------------------

def test_oauth_protected_resource_metadata_shape():
    resp = client.get("/.well-known/oauth-protected-resource/mcp")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["resource"].endswith("/mcp")
    assert isinstance(data["authorization_servers"], list)
    assert len(data["authorization_servers"]) >= 1
    assert "scopes_supported" in data or "bearer_methods_supported" in data


def test_oauth_authorization_server_metadata_shape():
    resp = client.get("/.well-known/oauth-authorization-server")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "issuer" in data
    assert "registration_endpoint" in data
    assert "token_endpoint" in data
    assert "S256" in str(data.get("code_challenge_methods_supported", "S256"))
    assert data.get("client_id_metadata_document_supported") is True


def test_oauth_dcr_register_and_pkce_helpers():
    from app.services import mcp_oauth as oauth_svc
    import base64
    import hashlib as _hl
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    challenge = base64.urlsafe_b64encode(
        _hl.sha256(verifier.encode()).digest()
    ).decode().rstrip("=")
    assert oauth_svc.verify_pkce(verifier, challenge) is True
    assert oauth_svc.verify_pkce("wrong", challenge) is False


def test_mcp_endpoint_requires_auth():
    # No token at all -> 401 (Claude uses this 401 to start sign-in).
    resp = client.post("/mcp", json={
        "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {},
    })
    assert resp.status_code == 401


def test_mcp_key_permanent_delete_removes_record():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.mcp_keys_collection") as mock_keys, \
         patch("app.routes.mcp_keys.check_db"), \
         patch("app.middleware.auth_middleware.check_db"):
        mock_users.find_one = AsyncMock(return_value=_user_doc())
        key_url = f"/api/mcp-keys/{str(ObjectId())}?permanent=true"
        mock_keys.delete_one = AsyncMock(
            return_value=AsyncMock(deleted_count=1)
        )
        resp = client.delete(key_url, headers=_auth_headers())
        assert resp.status_code == 200, resp.text
        assert "permanently" in resp.json()["message"].lower()
        filt = mock_keys.delete_one.call_args[0][0]
        assert filt["user_id"] == USER_ID

        mock_keys.delete_one = AsyncMock(
            return_value=AsyncMock(deleted_count=0)
        )
        resp = client.delete(key_url, headers=_auth_headers())
        assert resp.status_code == 404


def test_mcp_personal_key_hashing_roundtrip():
    from app.services import mcp_key_service as key_svc
    raw = key_svc.generate_raw_key()
    assert raw.startswith("dsk_")
    hashed = key_svc.hash_key(raw)
    assert hashed == hashlib.sha256(raw.encode()).hexdigest()
    assert key_svc.key_prefix(raw).startswith("dsk_")


# ---------------------------------------------------------------------------
# Provider registry (Grok phase: single source of truth for the tab)
# ---------------------------------------------------------------------------

def test_mcp_providers_lists_all_with_required_fields():
    resp = client.get("/api/mcp/providers")
    assert resp.status_code == 200, resp.text
    providers = resp.json()["providers"]
    ids = [p["id"] for p in providers]
    for expected in ("claude", "grok", "chatgpt", "cursor",
                     "perplexity", "mistral", "gemini",
                     "copilot", "manus"):
        assert expected in ids
    by_id = {p["id"]: p for p in providers}
    assert by_id["grok"]["status"] == "ready"
    assert by_id["claude"]["status"] == "ready"
    assert by_id["grok"]["requires_key"] is True
    assert by_id["chatgpt"]["status"] == "ready"
    assert by_id["chatgpt"]["requires_key"] is True
    assert len(by_id["chatgpt"]["steps"]) >= 5
    for p in providers:
        for field in ("id", "name", "tagline", "about",
                      "needs", "steps", "status",
                      "auth_note", "requires_key",
                      "docs_url", "redirect_uris", "auth_modes"):
            assert field in p, (p.get("id"), field)
        assert isinstance(p["needs"], list)
        assert isinstance(p["steps"], list)
        assert isinstance(p["redirect_uris"], list)
        assert isinstance(p["auth_modes"], list) and len(p["auth_modes"]) >= 1
        assert isinstance(p["docs_url"], str)
        assert p["status"] in ("ready", "soon")
        # Public endpoint: no secret material may ever leak.
        blob = json.dumps(p)
        assert "dsk_" not in blob
        assert "key_hash" not in blob
        assert "refresh_token" not in blob


def _grok_key_doc(user_id=USER_ID, workspace_id=WORKSPACE_ID):
    from app.services import mcp_key_service as key_svc
    return key_svc, {
        "_id": ObjectId(),
        "user_id": user_id,
        "workspace_id": workspace_id,
        "name": "Grok",
        "key_prefix": "dsk_grok",
        "revoked": False,
    }


def test_mcp_grok_initialize_and_tools_list():
    """Grok handshake: initialize + tools/list over a personal key."""
    key_svc, key_doc = _grok_key_doc()
    presented = "dsk_grok-test-key-abc"
    with patch("app.services.mcp_auth.check_db"), \
         patch("app.database.mcp_keys_collection") as mock_keys:
        async def _find_one(filt):
            assert filt.get("revoked") is False
            assert filt.get("key_hash") == key_svc.hash_key(presented)
            return key_doc

        mock_keys.find_one = AsyncMock(side_effect=_find_one)
        headers = {"Authorization": f"Bearer {presented}"}

        resp = client.post("/mcp", headers=headers, json={
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {},
        })
        assert resp.status_code == 200, resp.text
        result = resp.json()["result"]
        assert "protocolVersion" in result
        assert result["serverInfo"]["name"] == "docschat"

        resp = client.post("/mcp", headers=headers, json={
            "jsonrpc": "2.0", "id": 2, "method": "tools/list",
            "params": {},
        })
        assert resp.status_code == 200, resp.text
        names = [t["name"] for t in resp.json()["result"]["tools"]]
        assert "workspace_search" in names
        assert "document_fetch" in names


def test_mcp_grok_workspace_search_is_scoped_to_key_owner():
    """tools/call through Grok's key reaches only that key's user."""
    key_svc, key_doc = _grok_key_doc(user_id=OTHER_USER_ID)
    presented = "dsk_grok-other-user-key"
    passages = [{
        "text": "Sick leaves: 12 per year",
        "source_name": "Leave Policy.pdf",
        "page": 3,
        "source_id": SOURCE_ID,
        "score": 0.91,
    }]
    with patch("app.services.mcp_auth.check_db"), \
         patch("app.database.mcp_keys_collection") as mock_keys, \
         patch("app.routes.mcp.search_workspace_for_user",
               new=AsyncMock(return_value=passages)) as mock_search:
        mock_keys.find_one = AsyncMock(return_value=key_doc)
        resp = client.post("/mcp", headers={
            "Authorization": f"Bearer {presented}",
        }, json={
            "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": {"name": "workspace_search",
                       "arguments": {"query": "sick leaves"}},
        })
        assert resp.status_code == 200, resp.text
        mock_search.assert_called_once()
        # The call ran as the KEY's owner, never anyone else.
        assert mock_search.call_args[0][0] == OTHER_USER_ID
        assert mock_search.call_args[0][1] == WORKSPACE_ID
        text = resp.json()["result"]["content"][0]["text"]
        assert json.loads(text)["passages"][0]["source_name"] == \
            "Leave Policy.pdf"


def test_mcp_grok_unknown_tool_and_bad_key():
    key_svc, key_doc = _grok_key_doc()
    presented = "dsk_grok-test-key-abc"
    with patch("app.services.mcp_auth.check_db"), \
         patch("app.database.mcp_keys_collection") as mock_keys:
        mock_keys.find_one = AsyncMock(return_value=key_doc)
        resp = client.post("/mcp", headers={
            "Authorization": f"Bearer {presented}",
        }, json={
            "jsonrpc": "2.0", "id": 4, "method": "tools/call",
            "params": {"name": "no_such_tool", "arguments": {}},
        })
        assert resp.status_code == 200, resp.text
        assert resp.json()["error"]["code"] == -32602

    with patch("app.services.mcp_auth.check_db"), \
         patch("app.database.mcp_keys_collection") as mock_keys:
        mock_keys.find_one = AsyncMock(return_value=None)
        resp = client.post("/mcp", headers={
            "Authorization": "Bearer dsk_wrong-key",
        }, json={
            "jsonrpc": "2.0", "id": 5, "method": "tools/list",
            "params": {},
        })
        assert resp.status_code == 401
        assert "resource_metadata" in \
            resp.headers.get("WWW-Authenticate", "")


# ---------------------------------------------------------------------------
# ChatGPT (Developer Mode custom app: DCR + PKCE + read-only tools)
# ---------------------------------------------------------------------------

CHATGPT_CALLBACK = "https://chatgpt.com/connector/oauth/conn_abc123"


def _chatgpt_cimd_doc():
    """ChatGPT's real CIMD shape (fetched 2026-10-14).

    Plural offers ["none", "private_key_jwt"], legacy singular prefers
    private_key_jwt — intersection with our ["none"] must resolve.
    """
    return {
        "client_id": "https://chatgpt.com/oauth/QuZ3GH02PS9a/client.json",
        "client_uri": "https://chatgpt.com/",
        "redirect_uris": [
            "https://chatgpt.com/connector/oauth/QuZ3GH02PS9a"
        ],
        "token_endpoint_auth_method": "private_key_jwt",
        "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "client_name": "ChatGPT",
        "token_endpoint_auth_signing_alg": "RS256",
        "jwks_uri": "https://chatgpt.com/oauth/jwks.json",
    }


def _resolve_with_cimd(doc, redirect_uri):
    """Run _resolve_client with a stubbed CIMD fetch (no network)."""
    import asyncio
    from app.routes import mcp_oauth as oauth_routes

    class _Resp:
        def raise_for_status(self):
            pass

        def json(self):
            return doc

    class _Http:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def get(self, *args, **kwargs):
            return _Resp()

    with patch("app.routes.mcp_oauth.httpx.AsyncClient",
               return_value=_Http()), \
         patch("app.database.oauth_clients_collection") as mock_clients:
        mock_clients.find_one = AsyncMock(return_value=None)
        mock_clients.update_one = AsyncMock(
            return_value=AsyncMock(upserted_id=ObjectId())
        )
        return asyncio.run(
            oauth_routes._resolve_client(doc["client_id"], redirect_uri)
        )


def test_mcp_cimd_chatgpt_doc_resolves_via_intersection():
    """ChatGPT's real doc resolves to shared method 'none'."""
    doc = _chatgpt_cimd_doc()
    resolved = _resolve_with_cimd(doc, doc["redirect_uris"][0])
    assert resolved is not None
    assert resolved["token_auth_method"] == "none"
    assert resolved["client_name"] == "ChatGPT"


def test_mcp_cimd_legacy_singular_none_still_resolves():
    """Claude-style docs with only singular 'none' keep working."""
    doc = {
        "client_id": "https://client.example.com/meta.json",
        "redirect_uris": ["https://client.example.com/cb"],
        "token_endpoint_auth_method": "none",
    }
    resolved = _resolve_with_cimd(
        doc, "https://client.example.com/cb"
    )
    assert resolved is not None
    assert resolved["token_auth_method"] == "none"


def test_mcp_cimd_secret_only_doc_is_rejected():
    """A doc offering only methods we lack must not resolve."""
    doc = {
        "client_id": "https://client.example.com/meta.json",
        "redirect_uris": ["https://client.example.com/cb"],
        "token_endpoint_auth_methods_supported": ["client_secret_basic"],
        "grant_types": ["authorization_code"],
        "response_types": ["code"],
    }
    resolved = _resolve_with_cimd(
        doc, "https://client.example.com/cb"
    )
    assert resolved is None


def test_mcp_cimd_wrong_redirect_is_rejected():
    """A callback outside the doc's allowlist must not resolve."""
    doc = _chatgpt_cimd_doc()
    resolved = _resolve_with_cimd(
        doc, "https://evil.example.com/cb"
    )
    assert resolved is None


def test_mcp_chatgpt_dcr_register_with_connector_callback():
    """ChatGPT registers its per-connector callback URI via DCR."""
    with patch("app.routes.mcp_oauth.check_db"), \
         patch("app.database.oauth_clients_collection") as mock_clients:
        mock_clients.update_one = AsyncMock(
            return_value=AsyncMock(upserted_id=ObjectId())
        )
        resp = client.post("/oauth/register", json={
            "redirect_uris": [CHATGPT_CALLBACK],
            "client_name": "ChatGPT",
        })
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["token_endpoint_auth_method"] == "none"
        assert "authorization_code" in data["grant_types"]
        stored = mock_clients.update_one.call_args[0][1]["$set"]
        assert CHATGPT_CALLBACK in stored["redirect_uris"]


def test_mcp_chatgpt_oauth_flow_reaches_tools_list():
    """ChatGPT flow: approve -> code exchange -> tools/list (read-only)."""
    import base64
    import hashlib as _hl
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    challenge = base64.urlsafe_b64encode(
        _hl.sha256(verifier.encode()).digest()
    ).decode().rstrip("=")
    client_id = "mcpcli_chatgpt-test"
    client_doc = {"client_id": client_id,
                  "redirect_uris": [CHATGPT_CALLBACK]}

    with patch("app.routes.mcp_oauth.check_db"), \
         patch("app.middleware.auth_middleware.check_db"), \
         patch("app.database.users_collection") as mock_users, \
         patch("app.database.oauth_clients_collection") as mock_clients, \
         patch("app.database.oauth_codes_collection") as mock_codes, \
         patch("app.database.oauth_tokens_collection") as mock_tokens:
        mock_users.find_one = AsyncMock(return_value=_user_doc())
        mock_clients.find_one = AsyncMock(return_value=client_doc)
        mock_codes.insert_one = AsyncMock(
            return_value=AsyncMock(inserted_id=ObjectId())
        )

        resp = client.post(
            "/api/mcp/oauth/approve",
            headers=_auth_headers(),
            json={
                "client_id": client_id,
                "redirect_uri": CHATGPT_CALLBACK,
                "code_challenge": challenge,
                "workspace_id": WORKSPACE_ID,
            },
        )
        assert resp.status_code == 200, resp.text
        issued = resp.json()["redirect_url"].split("code=")[1].split("&")[0]
        assert issued.startswith("mcpcode_")

        mock_codes.find_one = AsyncMock(return_value={
            "code": issued,
            "user_id": USER_ID,
            "email": USER_EMAIL,
            "workspace_id": WORKSPACE_ID,
            "client_id": client_id,
            "redirect_uri": CHATGPT_CALLBACK,
            "scope": "workspace:read",
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        })
        mock_codes.delete_one = AsyncMock(
            return_value=AsyncMock(deleted_count=1)
        )
        mock_tokens.insert_one = AsyncMock(
            return_value=AsyncMock(inserted_id=ObjectId())
        )
        resp = client.post("/oauth/token", data={
            "grant_type": "authorization_code",
            "code": issued,
            "redirect_uri": CHATGPT_CALLBACK,
            "client_id": client_id,
            "code_verifier": verifier,
        })
        assert resp.status_code == 200, resp.text
        access = resp.json()["access_token"]
        assert resp.json()["token_type"] == "Bearer"

        resp = client.post("/mcp", headers={
            "Authorization": f"Bearer {access}",
        }, json={
            "jsonrpc": "2.0", "id": 10, "method": "tools/list",
            "params": {},
        })
        assert resp.status_code == 200, resp.text
        tools = {t["name"]: t for t in resp.json()["result"]["tools"]}
        for name in ("workspace_search", "document_fetch"):
            assert tools[name]["annotations"]["readOnlyHint"] is True
