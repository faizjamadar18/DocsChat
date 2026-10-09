"""Minimal OAuth 2.1 helpers for the MCP sign-in flow Claude uses.

Implements only what Claude needs (per
https://claude.com/docs/connectors/building/authentication):
- Dynamic Client Registration (DCR): POST /oauth/register
- Authorization code flow with PKCE S256: GET /oauth/authorize -> code
- Token exchange + refresh rotation: POST /oauth/token (form-urlencoded)

Access tokens are the app's existing JWTs (auth_service.create_access_token),
so the MCP endpoint verifies them with the same decode_access_token path.
Refresh tokens are random strings; only their SHA-256 hash is stored.
"""
import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

AUTH_CODE_TTL = timedelta(minutes=10)


def new_client_id() -> str:
    return f"mcpcli_{secrets.token_urlsafe(24)}"


def new_code() -> str:
    return f"mcpcode_{secrets.token_urlsafe(32)}"


def new_refresh_token() -> str:
    return f"mcpref_{secrets.token_urlsafe(40)}"


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def s256_challenge(verifier: str) -> str:
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def verify_pkce(verifier: str, challenge: str, method: str = "S256") -> bool:
    """Verify a PKCE code_verifier against the stored code_challenge."""
    if not verifier or not challenge:
        return False
    if method == "plain":
        return secrets.compare_digest(verifier, challenge)
    expected = s256_challenge(verifier)
    return secrets.compare_digest(expected, challenge)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def auth_code_expiry() -> datetime:
    return utcnow() + AUTH_CODE_TTL
