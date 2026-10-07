"""Per-user Vapi public-key storage with encryption at rest.

Security model (matches plan):
- We NEVER ask for or store Vapi private keys (sk_...). Only public keys (pk_...).
- Public keys are still encrypted with Fernet before MongoDB storage.
- The Fernet key is derived from JWT_SECRET (server-only), never shipped to clients.
- Status endpoints never return the raw key; a separate owner-only endpoint
  returns it once for Web SDK init in the browser (public keys are designed
  to live in client code by Vapi, locked further by Allowed Origins).
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


def validate_public_key(raw: str | None) -> bool:
    """Accept Vapi public keys, reject private keys and junk."""
    if not raw or not isinstance(raw, str):
        return False
    key = raw.strip()
    if not key or " " in key or "\n" in key:
        return False
    lowered = key.lower()
    # Private keys must never be stored — refuse loudly so UI shows guidance.
    if lowered.startswith("sk-") or lowered.startswith("sk_"):
        return False
    # Vapi public keys use pk_ / pk- prefixes (older keys may be UUIDs).
    if lowered.startswith("pk_") or lowered.startswith("pk-"):
        return len(key) >= 10
    # Allow long UUID-style keys but nothing short/generic like "random".
    if len(key) >= 20 and "-" in key:
        return True
    return False


def encrypt_key(raw: str) -> str:
    return _fernet().encrypt(raw.strip().encode("utf-8")).decode("utf-8")


def decrypt_key(enc: str) -> str:
    try:
        return _fernet().decrypt(enc.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, AttributeError) as exc:
        raise ValueError("Stored key cannot be decrypted") from exc


def masked_hint(raw_or_enc: str | None, *, encrypted: bool = False) -> str:
    """Return a non-revealing hint like '•••••••• (Key is Set) ••ab12'."""
    try:
        raw = decrypt_key(raw_or_enc) if encrypted and raw_or_enc else (raw_or_enc or "")
    except ValueError:
        return ""
    if not raw:
        return ""
    tail = raw.strip()[-4:]
    return f"•••••••••••••••• (Key is Set) ••{tail}"
