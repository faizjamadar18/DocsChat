"""Personal API keys for the MCP server (e.g. Claude custom header, Grok auth field).

Security model (same as connector tokens):
- The raw key (`dsk_...`) is shown ONCE at creation and never stored.
- Only a SHA-256 hash is stored in `mcp_keys`. Verification hashes the presented key.
- Every key belongs to one user and optionally one workspace.
- Revoked keys are kept as tombstones (revoked=True) and never authenticate.
"""
import hashlib
import secrets

KEY_PREFIX = "dsk_"


def generate_raw_key() -> str:
    """Generate a new raw personal key. Returned to the user exactly once."""
    return f"{KEY_PREFIX}{secrets.token_urlsafe(32)}"


def hash_key(raw: str) -> str:
    """SHA-256 hex digest used for storage and lookup."""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def key_prefix(raw: str) -> str:
    """Non-secret prefix shown in the UI so users can tell keys apart."""
    return (raw or "")[:11]
