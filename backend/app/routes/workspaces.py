from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
import app.database as database
from app.database import check_db, slugify
from app.models.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceListResponse,
    WorkspaceActivateResponse,
    WorkspaceDashboardResponse,
)
from app.middleware.auth_middleware import get_current_user
from app.models.document import DocumentResponse
from app.models.source import SourceResponse
from app.services import vector_store as vs

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new workspace for the current user."""
    check_db()
    user_id = current_user["id"]

    base_slug = data.slug or slugify(data.name)
    slug = base_slug
    count = 1
    while await database.workspaces_collection.find_one({"owner_id": user_id, "slug": slug}):
        count += 1
        slug = f"{base_slug}-{count}"

    now = datetime.now(timezone.utc)
    ws_doc = {
        "owner_id": user_id,
        "name": data.name,
        "slug": slug,
        "description": data.description,
        "logo_url": data.logo_url,
        "created_at": now,
        "updated_at": now,
    }

    result = await database.workspaces_collection.insert_one(ws_doc)
    workspace_id = str(result.inserted_id)

    # If user has no active workspace, activate this one
    if not current_user.get("active_workspace_id"):
        await database.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"active_workspace_id": workspace_id}}
        )

    return WorkspaceResponse(
        id=workspace_id,
        owner_id=user_id,
        name=ws_doc["name"],
        slug=ws_doc["slug"],
        description=ws_doc["description"],
        logo_url=ws_doc["logo_url"],
        created_at=ws_doc["created_at"],
        updated_at=ws_doc["updated_at"],
    )


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(current_user: dict = Depends(get_current_user)):
    """List all workspaces owned by current user."""
    check_db()
    user_id = current_user["id"]

    cursor = database.workspaces_collection.find({"owner_id": user_id}).sort("created_at", 1)
    workspaces = []
    async for doc in cursor:
        workspaces.append(WorkspaceResponse(
            id=str(doc["_id"]),
            owner_id=str(doc["owner_id"]),
            name=doc["name"],
            slug=doc["slug"],
            description=doc.get("description"),
            logo_url=doc.get("logo_url"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        ))

    return WorkspaceListResponse(
        workspaces=workspaces,
        active_workspace_id=current_user.get("active_workspace_id"),
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Get workspace details by ID."""
    check_db()
    if not ObjectId.is_valid(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")

    workspace = await database.workspaces_collection.find_one({
        "_id": ObjectId(workspace_id),
        "owner_id": current_user["id"],
    })
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    return WorkspaceResponse(
        id=str(workspace["_id"]),
        owner_id=str(workspace["owner_id"]),
        name=workspace["name"],
        slug=workspace["slug"],
        description=workspace.get("description"),
        logo_url=workspace.get("logo_url"),
        created_at=workspace["created_at"],
        updated_at=workspace["updated_at"],
    )


@router.get("/{workspace_id}/dashboard", response_model=WorkspaceDashboardResponse)
async def get_workspace_dashboard(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Get dashboard data for a workspace (recent docs and assets)."""
    check_db()
    if not ObjectId.is_valid(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")

    workspace = await database.workspaces_collection.find_one({
        "_id": ObjectId(workspace_id),
        "owner_id": current_user["id"],
    })
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # Fetch 3 most recently updated documents
    docs_cursor = database.documents_collection.find(
        {"workspace_id": workspace_id}
    ).sort("updated_at", -1).limit(3)
    
    recent_documents = []
    async for doc in docs_cursor:
        recent_documents.append(DocumentResponse(
            id=str(doc["_id"]),
            workspace_id=doc["workspace_id"],
            user_id=doc["user_id"],
            title=doc.get("title", "Untitled Document"),
            content_json=doc.get("content_json"),
            content_text=doc.get("content_text", ""),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        ))

    # Fetch 3 most recently uploaded assets
    sources_cursor = database.sources_collection.find(
        {"workspace_id": workspace_id}
    ).sort("uploaded_at", -1).limit(3)

    recent_assets = []
    async for source in sources_cursor:
        recent_assets.append(SourceResponse(
            id=str(source["_id"]),
            workspace_id=source.get("workspace_id"),
            filename=source["filename"],
            file_size=source["file_size"],
            page_count=source["page_count"],
            chunk_count=source["chunk_count"],
            status=source["status"],
            uploaded_at=source["uploaded_at"],
        ))

    return WorkspaceDashboardResponse(
        recent_documents=recent_documents,
        recent_assets=recent_assets,
    )


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    data: WorkspaceUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update workspace attributes."""
    check_db()
    if not ObjectId.is_valid(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")

    workspace = await database.workspaces_collection.find_one({
        "_id": ObjectId(workspace_id),
        "owner_id": current_user["id"],
    })
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.description is not None:
        updates["description"] = data.description
    if data.logo_url is not None:
        updates["logo_url"] = data.logo_url
    if data.slug is not None:
        slug = slugify(data.slug)
        existing = await database.workspaces_collection.find_one({
            "owner_id": current_user["id"],
            "slug": slug,
            "_id": {"$ne": ObjectId(workspace_id)},
        })
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already in use")
        updates["slug"] = slug

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await database.workspaces_collection.update_one(
            {"_id": ObjectId(workspace_id)},
            {"$set": updates}
        )
        workspace.update(updates)

    return WorkspaceResponse(
        id=str(workspace["_id"]),
        owner_id=str(workspace["owner_id"]),
        name=workspace["name"],
        slug=workspace["slug"],
        description=workspace.get("description"),
        logo_url=workspace.get("logo_url"),
        created_at=workspace["created_at"],
        updated_at=workspace["updated_at"],
    )


@router.post("/{workspace_id}/activate", response_model=WorkspaceActivateResponse)
async def activate_workspace(
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Switch user's currently active workspace."""
    check_db()
    if not ObjectId.is_valid(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")

    workspace = await database.workspaces_collection.find_one({
        "_id": ObjectId(workspace_id),
        "owner_id": current_user["id"],
    })
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    await database.users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"active_workspace_id": workspace_id}}
    )

    return WorkspaceActivateResponse(
        message=f"Active workspace switched to '{workspace['name']}'",
        active_workspace_id=workspace_id,
    )


@router.delete("/{workspace_id}", status_code=status.HTTP_200_OK)
async def delete_workspace(
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete workspace with cascading wipe of documents, sources, messages, and Qdrant vectors.
    If deleted workspace was active, switches to next workspace or creates a fresh one.
    """
    check_db()
    if not ObjectId.is_valid(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")

    user_id = current_user["id"]
    workspace = await database.workspaces_collection.find_one({
        "_id": ObjectId(workspace_id),
        "owner_id": user_id,
    })
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # Cascading delete in MongoDB
    if database.documents_collection is not None:
        await database.documents_collection.delete_many({"workspace_id": workspace_id})
    if database.sources_collection is not None:
        await database.sources_collection.delete_many({"workspace_id": workspace_id})
    if database.messages_collection is not None:
        await database.messages_collection.delete_many({"workspace_id": workspace_id})

    # Delete workspace document
    await database.workspaces_collection.delete_one({"_id": ObjectId(workspace_id)})

    # Cascading delete in Qdrant
    try:
        vs.delete_workspace_vectors(user_id=user_id, workspace_id=workspace_id)
    except Exception:
        pass

    # If this was active workspace, switch to next or provision fresh
    next_active_id = None
    remaining = await database.workspaces_collection.find_one({"owner_id": user_id})
    if remaining:
        next_active_id = str(remaining["_id"])
    else:
        # Provision fresh default workspace
        now = datetime.now(timezone.utc)
        fresh_ws = {
            "owner_id": user_id,
            "name": f"{current_user.get('username') or 'My'} HQ",
            "slug": slugify(current_user.get("username") or "my-hq"),
            "description": "Default workspace",
            "logo_url": None,
            "created_at": now,
            "updated_at": now,
        }
        res = await database.workspaces_collection.insert_one(fresh_ws)
        next_active_id = str(res.inserted_id)

    await database.users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"active_workspace_id": next_active_id}}
    )

    return {"message": "Workspace deleted successfully", "active_workspace_id": next_active_id}
