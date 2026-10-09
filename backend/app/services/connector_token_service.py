"""Per-user connector OAuth token storage with encryption at rest.

Same security model as vapi_key_service:
- Tokens are encrypted with Fernet derived from JWT_SECRET (server-only).
- Never returned to the client. Status endpoints only return booleans.
- Per-user isolation enforced by user_id in every query.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings


def _fernet() -> Fernet:
    settings = get_settings()
    digest = hashlib.sha256(settings.JWT_SECRET.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_token(raw: str) -> str:
    if not raw or not raw.strip():
        raise ValueError("Empty token cannot be encrypted")
    return _fernet().encrypt(raw.strip().encode("utf-8")).decode("utf-8")


def decrypt_token(enc: str) -> str:
    try:
        return _fernet().decrypt(enc.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, AttributeError) as exc:
        raise ValueError("Stored connector token cannot be decrypted") from exc
