from fastapi import Depends, HTTPException, Header, status
from bson import ObjectId
from typing import Optional
import app.database as database
from app.database import check_db
from app.middleware.auth_middleware import get_current_user


async def get_current_workspace(
    workspace_id: Optional[str] = None,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Hybrid workspace resolver:
    1. Checks explicit workspace_id argument (from path/query)
    2. Checks X-Workspace-Id header
    3. Falls back to current_user['active_workspace_id']
    """
    check_db()
    
    target_id = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    
    if not target_id:
        # Check if user owns any workspace
        existing = await database.workspaces_collection.find_one({"owner_id": current_user["id"]})
        if existing:
            target_id = str(existing["_id"])
            # Update user's active workspace
            await database.users_collection.update_one(
                {"_id": ObjectId(current_user["id"])},
                {"$set": {"active_workspace_id": target_id}}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active workspace found for user. Please create or select a workspace.",
            )

    if not ObjectId.is_valid(target_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workspace ID format",
        )

    workspace = await database.workspaces_collection.find_one({
        "_id": ObjectId(target_id),
        "owner_id": current_user["id"],
    })

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or unauthorized",
        )

    return {
        "id": str(workspace["_id"]),
        "owner_id": str(workspace["owner_id"]),
        "name": workspace["name"],
        "slug": workspace["slug"],
        "logo_url": workspace.get("logo_url"),
        "description": workspace.get("description"),
    }
