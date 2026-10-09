"""Personal API keys for the MCP server — create / list / revoke.

All routes use the app's existing JWT login (get_current_user), so only the
logged-in user can manage their own keys. Keys are scoped per user (and
optionally per workspace) and never leak the raw secret after creation.
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.middleware.auth_middleware import get_current_user
from app.models.mcp import (
    McpKeyCreate,
    McpKeyCreated,
    McpKeyListResponse,
    McpKeyPublic,
)
from app.services.mcp_key_service import generate_raw_key, hash_key, key_prefix

router = APIRouter(prefix="/api/mcp-keys", tags=["MCP Keys"])


def _require_db():
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready"
        )


def _to_public(doc: dict) -> McpKeyPublic:
    return McpKeyPublic(
        id=str(doc["_id"]),
        name=doc.get("name", "Claude"),
        workspace_id=doc.get("workspace_id"),
        key_prefix=doc.get("key_prefix", ""),
        created_at=doc.get("created_at"),
        last_used_at=doc.get("last_used_at"),
        revoked=bool(doc.get("revoked", False)),
    )


@router.post("", response_model=McpKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_key(body: McpKeyCreate, current_user: dict = Depends(get_current_user)):
    """Create a personal key. The raw key is returned exactly once."""
    _require_db()
    if body.workspace_id and not ObjectId.is_valid(body.workspace_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID"
        )

    raw = generate_raw_key()
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": current_user["id"],
        "workspace_id": body.workspace_id,
        "name": (body.name or "Claude").strip() or "Claude",
        "key_hash": hash_key(raw),
        "key_prefix": key_prefix(raw),
        "created_at": now,
        "last_used_at": None,
        "revoked": False,
    }
    res = await database.mcp_keys_collection.insert_one(doc)
    return McpKeyCreated(
        id=str(res.inserted_id),
        name=doc["name"],
        workspace_id=doc["workspace_id"],
        key_prefix=doc["key_prefix"],
        api_key=raw,
        created_at=now,
    )


@router.get("", response_model=McpKeyListResponse)
async def list_keys(current_user: dict = Depends(get_current_user)):
    """List my keys (public fields only — never hashes or raw secrets)."""
    _require_db()
    cursor = (
        database.mcp_keys_collection.find({"user_id": current_user["id"]})
        .sort("created_at", -1)
    )
    docs = await cursor.to_list(100)
    return McpKeyListResponse(keys=[_to_public(d) for d in docs])


@router.delete("/{key_id}")
async def revoke_key(
    key_id: str,
    permanent: bool = Query(False),
    current_user: dict = Depends(get_current_user),
):
    """Revoke one of my keys, or permanently delete it with ?permanent=true.

    Revoking keeps a tombstone (the key stops working immediately but stays
    listed as revoked). Permanent delete removes the record entirely.
    """
    _require_db()
    if not ObjectId.is_valid(key_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key ID"
        )
    if permanent:
        res = await database.mcp_keys_collection.delete_one(
            {"_id": ObjectId(key_id), "user_id": current_user["id"]}
        )
        if res.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Key not found"
            )
        return {"message": "Key permanently deleted", "id": key_id}
    res = await database.mcp_keys_collection.update_one(
        {"_id": ObjectId(key_id), "user_id": current_user["id"]},
        {"$set": {"revoked": True, "revoked_at": datetime.now(timezone.utc)}},
    )
    if res.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Key not found"
        )
    return {"message": "Key revoked", "id": key_id}
