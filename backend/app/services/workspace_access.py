"""Central workspace access helper for team collaboration.

Shared-room model:
- members[] on workspace governs access. owner_id stays source of truth.
- Backward compat: owner_id match == owner even if members[] missing.
- Threads/chats stay private per user. Sources/documents/vectors shared by workspace.
- Connectors + MCP keys stay personal per user.
"""
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import HTTPException, status

import app.database as database


VALID_ROLES = ("owner", "editor", "viewer")


def role_of(workspace: dict | None, user_id: str) -> Optional[str]:
    if not workspace or not user_id:
        return None
    if str(workspace.get("owner_id")) == str(user_id):
        return "owner"
    for m in workspace.get("members") or []:
        if str(m.get("user_id")) == str(user_id):
            r = str(m.get("role") or "viewer")
            return r if r in VALID_ROLES else "viewer"
    return None


async def get_workspace_with_access(workspace_id: str, user_id: str) -> tuple[dict, str]:
    """Fetch workspace and caller role. 400 bad id, 404 no access."""
    if not ObjectId.is_valid(workspace_id or ""):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")
    try:
        from app.database import check_db
        check_db()
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    ws = await database.workspaces_collection.find_one({"_id": ObjectId(workspace_id)})
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    role = role_of(ws, user_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws, role


def require_role(role: Optional[str], allowed: tuple[str, ...], detail: str = "Not allowed"):
    if role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN if role else status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


def member_entry(user_id: str, email: Optional[str], role: str, added_by: str) -> dict:
    return {
        "user_id": str(user_id),
        "email": email,
        "role": role,
        "added_by": str(added_by),
        "added_at": datetime.now(timezone.utc),
    }
