"""Short-lived session tokens for Vapi server tool calls.

Why: Vapi's servers call our /api/voice/tool-call directly — they cannot
send the user's login JWT. So the browser first asks our backend (with login)
for a 10-minute token bound to (user_id, workspace_id). That token travels
in the tool server URL query string. The tool endpoint verifies it and only
then searches that one workspace. No token -> no data, ever.
"""
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import get_settings


def create_session_token(user_id: str, workspace_id: str, expires_minutes: int = 10) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": user_id,
        "ws": workspace_id,
        "purpose": "voice-tool",
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_session_token(token: str | None) -> dict | None:
    if not token:
        return None
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
    if payload.get("purpose") != "voice-tool":
        return None
    user_id = payload.get("sub")
    workspace_id = payload.get("ws")
    if not user_id or not workspace_id:
        return None
    return {"user_id": user_id, "workspace_id": workspace_id}
