"""Resolve an MCP bearer token to exactly one user.

Accepted tokens (checked in order):
1. App JWT access token (OAuth sign-in flow).
2. Personal API key (`dsk_...`, hash in `mcp_keys`).

Anything else -> 401. Callers always get a single
user_id back, used for the same user_id/workspace_id
filters as the rest of the app, so one user's key can
never reach another user's vectors or documents.
"""
from fastapi import HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId

import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.services.auth_service import decode_access_token
from app.services.mcp_key_service import hash_key


async def resolve_mcp_token(token: str) -> dict:
    """Map a bearer token to its user and workspace."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )
    token = token.strip()

    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not ready",
        )

    # 1. App JWT (OAuth flow).
    payload = decode_access_token(token)
    if payload and payload.get("sub"):
        try:
            user = await database.users_collection.find_one(
                {"_id": ObjectId(payload["sub"])}
            )
        except InvalidId:
            user = None
        if user:
            return {
                "user_id": str(user["_id"]),
                "email": user.get("email", ""),
                "workspace_id": user.get(
                    "active_workspace_id"
                ),
                "method": "oauth",
                "key_id": None,
            }

    # 2. Personal API key.
    try:
        key_doc = await database.mcp_keys_collection.find_one(
            {"key_hash": hash_key(token), "revoked": False}
        )
    except Exception:
        key_doc = None
    if key_doc:
        return {
            "user_id": key_doc["user_id"],
            "email": "",
            "workspace_id": key_doc.get("workspace_id"),
            "method": "api_key",
            "key_id": str(key_doc["_id"]),
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )


async def resolve_workspace(
    user_id: str,
    requested: str | None = None,
    fallback: str | None = None,
) -> str:
    """Pick the workspace for an MCP call, checking ownership.

    A named workspace must be a valid id owned by the user.
    Otherwise the key's workspace (or the user's active one)
    is used. Raises 400 when none can be determined.
    """
    if requested:
        if not ObjectId.is_valid(requested):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid workspace ID",
            )
        ws = await database.workspaces_collection.find_one(
            {"_id": ObjectId(requested), "owner_id": user_id}
        )
        if not ws:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )
        return requested

    if fallback:
        return fallback

    user = await database.users_collection.find_one(
        {"_id": ObjectId(user_id)}
    )
    active = (user or {}).get("active_workspace_id")
    if not active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No workspace found. Create one first.",
        )
    return active
