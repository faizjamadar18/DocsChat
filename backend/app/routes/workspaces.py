from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime
from bson import ObjectId

from app.models.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, WorkspaceListResponse
from app.models.user import UserResponse
from app.routes.auth import get_current_user
from app.database import workspaces_collection, sources_collection, messages_collection
from app.services.vector_store import delete_workspace_vectors

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

async def get_workspace_or_404(workspace_id: str, current_user: UserResponse = Depends(get_current_user)) -> dict:
    if not ObjectId.is_valid(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")
    
    workspace = await workspaces_collection.find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if workspace["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    return workspace

@router.post("", response_model=WorkspaceResponse)
async def create_workspace(workspace_in: WorkspaceCreate, current_user: UserResponse = Depends(get_current_user)):
    now = datetime.utcnow()
    workspace_doc = {
        "user_id": current_user.id,
        "name": workspace_in.name,
        "description": workspace_in.description,
        "created_at": now,
        "updated_at": now,
    }
    
    result = await workspaces_collection.insert_one(workspace_doc)
    workspace_doc["id"] = str(result.inserted_id)
    return WorkspaceResponse(**workspace_doc)

@router.get("", response_model=WorkspaceListResponse)
async def get_workspaces(current_user: UserResponse = Depends(get_current_user)):
    cursor = workspaces_collection.find({"user_id": current_user.id}).sort("created_at", -1)
    workspaces = await cursor.to_list(length=100)
    
    response_workspaces = []
    for doc in workspaces:
        doc["id"] = str(doc["_id"])
        response_workspaces.append(WorkspaceResponse(**doc))
        
    return WorkspaceListResponse(workspaces=response_workspaces, total=len(response_workspaces))

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace: dict = Depends(get_workspace_or_404)):
    workspace["id"] = str(workspace["_id"])
    return WorkspaceResponse(**workspace)

@router.delete("/{workspace_id}")
async def delete_workspace(workspace: dict = Depends(get_workspace_or_404)):
    workspace_id_str = str(workspace["_id"])
    
    # 1. Delete Qdrant points
    try:
        await delete_workspace_vectors(workspace_id_str)
    except Exception as e:
        print(f"Failed to delete qdrant vectors for workspace {workspace_id_str}: {e}")

    # 2. Delete sources and messages from Mongo
    await sources_collection.delete_many({"workspace_id": workspace_id_str})
    await messages_collection.delete_many({"workspace_id": workspace_id_str})
    
    # 3. Delete workspace itself
    await workspaces_collection.delete_one({"_id": workspace["_id"]})
    
    return {"status": "deleted"}
