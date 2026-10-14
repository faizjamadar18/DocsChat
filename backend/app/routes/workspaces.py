import secrets
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
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
    WorkspaceMembersResponse,
    WorkspaceMember,
    WorkspaceInviteCreate,
    WorkspaceInvitePublic,
    WorkspaceInviteCreated,
    WorkspaceInviteAcceptResponse,
)
from app.middleware.auth_middleware import get_current_user
from app.models.document import DocumentResponse
from app.models.source import SourceResponse
from app.services import vector_store as vs
from app.services.workspace_access import (
    get_workspace_with_access,
    require_role,
    role_of,
    member_entry,
)
from app.services.invite_service import build_invite_link, invite_expiry, send_invite_email

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


def _to_response(doc: dict, role: str | None = None) -> WorkspaceResponse:
    members = doc.get("members") or []
    return WorkspaceResponse(
        id=str(doc["_id"]),
        owner_id=str(doc["owner_id"]),
        name=doc["name"],
        slug=doc["slug"],
        description=doc.get("description"),
        logo_url=doc.get("logo_url"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        role=role,
        member_count=len(members) if members else 1,
    )


def _invite_to_public(doc: dict) -> WorkspaceInvitePublic:
    return WorkspaceInvitePublic(
        id=str(doc["_id"]),
        email=doc["email"],
        role=doc.get("role", "viewer"),
        status=doc.get("status", "pending"),
        expires_at=doc.get("expires_at"),
        created_at=doc.get("created_at"),
    )


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
        "members": [member_entry(user_id, current_user.get("email"), "owner", user_id)],
        "created_at": now,
        "updated_at": now,
    }

    result = await database.workspaces_collection.insert_one(ws_doc)
    workspace_id = str(result.inserted_id)

    if not current_user.get("active_workspace_id"):
        await database.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"active_workspace_id": workspace_id}}
        )

    ws_doc["_id"] = result.inserted_id
    return _to_response(ws_doc, role="owner")


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(current_user: dict = Depends(get_current_user)):
    """List owned + shared workspaces with caller role."""
    check_db()
    user_id = current_user["id"]

    cursor = database.workspaces_collection.find({
        "$or": [
            {"owner_id": user_id},
            {"members.user_id": user_id},
        ]
    }).sort("created_at", 1)
    workspaces = []
    seen: set[str] = set()
    async for doc in cursor:
        wid = str(doc["_id"])
        if wid in seen:
            continue
        seen.add(wid)
        workspaces.append(_to_response(doc, role=role_of(doc, user_id) or "viewer"))

    return WorkspaceListResponse(
        workspaces=workspaces,
        active_workspace_id=current_user.get("active_workspace_id"),
    )


# NOTE: /invites/* static routes must precede /{workspace_id} or FastAPI
# would match "invites" as a workspace id.

@router.get("/invites/lookup")
async def lookup_invite(token: str, current_user: dict = Depends(get_current_user)):
    """Preview for /join/{token} page: workspace name + role + membership state."""
    check_db()
    inv = await database.workspace_invites_collection.find_one({"token": token})
    if not inv or inv.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found or expired")
    exp = inv.get("expires_at")
    if exp:
        aware = exp if getattr(exp, "tzinfo", None) else exp.replace(tzinfo=timezone.utc)
        if aware < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite expired")
    ws = await database.workspaces_collection.find_one({"_id": ObjectId(inv["workspace_id"])}) \
        if ObjectId.is_valid(inv["workspace_id"]) else None
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace no longer exists")
    already = role_of(ws, current_user["id"])
    email_ok = (current_user.get("email") or "").lower() == (inv.get("email") or "").lower()
    return {
        "workspace_id": str(ws["_id"]),
        "workspace_name": ws.get("name"),
        "role": inv.get("role", "viewer"),
        "invited_email": inv.get("email"),
        "email_ok": email_ok,
        "already_member": bool(already),
        "signed_in_as": current_user.get("email"),
    }


@router.post("/invites/{token}/accept", response_model=WorkspaceInviteAcceptResponse)
async def accept_invite(token: str, current_user: dict = Depends(get_current_user)):
    """Accept invite. Email must match. Adds to room, keeps own rooms."""
    check_db()
    inv = await database.workspace_invites_collection.find_one({"token": token, "status": "pending"})
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found or expired")
    exp = inv.get("expires_at")
    if exp:
        aware = exp if getattr(exp, "tzinfo", None) else exp.replace(tzinfo=timezone.utc)
        if aware < datetime.now(timezone.utc):
            await database.workspace_invites_collection.update_one(
                {"_id": inv["_id"]}, {"$set": {"status": "expired"}}
            )
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite expired")
    if (current_user.get("email") or "").lower() != (inv.get("email") or "").lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This invite is for {inv.get('email')}. Please sign in with that email.",
        )
    ws_id = inv["workspace_id"]
    if not ObjectId.is_valid(ws_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace no longer exists")
    ws = await database.workspaces_collection.find_one({"_id": ObjectId(ws_id)})
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace no longer exists")
    existing_role = role_of(ws, current_user["id"])
    if existing_role:
        await database.workspace_invites_collection.update_one(
            {"_id": inv["_id"]}, {"$set": {"status": "accepted"}}
        )
        return WorkspaceInviteAcceptResponse(
            message=f"Already a member of '{ws['name']}'", workspace_id=ws_id, role=existing_role
        )
    await database.workspaces_collection.update_one(
        {"_id": ObjectId(ws_id)},
        {"$push": {"members": member_entry(current_user["id"], current_user.get("email"), inv.get("role", "viewer"), inv.get("invited_by", ""))},
         "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    await database.workspace_invites_collection.update_one(
        {"_id": inv["_id"]}, {"$set": {"status": "accepted"}}
    )
    return WorkspaceInviteAcceptResponse(
        message=f"Joined '{ws['name']}'", workspace_id=ws_id, role=inv.get("role", "viewer")
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Get workspace details by ID (owner or member)."""
    ws, role = await get_workspace_with_access(workspace_id, current_user["id"])
    return _to_response(ws, role=role)


@router.get("/{workspace_id}/dashboard", response_model=WorkspaceDashboardResponse)
async def get_workspace_dashboard(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Get dashboard data for a workspace (shared recent docs and assets)."""
    check_db()
    ws, _role = await get_workspace_with_access(workspace_id, current_user["id"])
    _ = ws

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

    sources_cursor = database.sources_collection.find(
        {"workspace_id": workspace_id}
    ).sort("uploaded_at", -1).limit(3)

    recent_assets = []
    async for source in sources_cursor:
        uploaded_at = source.get("uploaded_at")
        if uploaded_at and uploaded_at.tzinfo is None:
            uploaded_at = uploaded_at.replace(tzinfo=timezone.utc)
        source_type = source.get("source_type")
        if not source_type or source_type == "pdf":
            fn = source.get("filename", "").lower()
            if fn.startswith("[github]") or "github.com" in fn:
                source_type = "github"
            elif fn.startswith("[drive]") or fn.startswith("[google drive]") or fn.startswith("[googledrive]"):
                source_type = "drive"
            elif fn.startswith("[notion]"):
                source_type = "notion"
            elif fn.startswith("[slack]"):
                source_type = "slack"
            else:
                source_type = source.get("source_type", "pdf")

        recent_assets.append(SourceResponse(
            id=str(source["_id"]),
            workspace_id=source.get("workspace_id"),
            filename=source["filename"],
            file_size=source["file_size"],
            page_count=source["page_count"],
            chunk_count=source["chunk_count"],
            status=source["status"],
            uploaded_at=uploaded_at,
            source_type=source_type,
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
    """Update workspace attributes (owner only in V1)."""
    check_db()
    ws, role = await get_workspace_with_access(workspace_id, current_user["id"])
    require_role(role, ("owner",), "Only the workspace owner can edit settings")

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
            "owner_id": ws["owner_id"],
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
        ws.update(updates)

    return _to_response(ws, role=role)


@router.post("/{workspace_id}/activate", response_model=WorkspaceActivateResponse)
async def activate_workspace(
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Switch user's currently active workspace (owned or shared)."""
    ws, _role = await get_workspace_with_access(workspace_id, current_user["id"])

    await database.users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"active_workspace_id": workspace_id}}
    )

    return WorkspaceActivateResponse(
        message=f"Active workspace switched to '{ws['name']}'",
        active_workspace_id=workspace_id,
    )


@router.delete("/{workspace_id}", status_code=status.HTTP_200_OK)
async def delete_workspace(
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete workspace with cascading wipe. Owner only."""
    check_db()
    user_id = current_user["id"]
    ws, role = await get_workspace_with_access(workspace_id, user_id)
    require_role(role, ("owner",), "Only the workspace owner can delete it")
    _ = ws

    if database.documents_collection is not None:
        await database.documents_collection.delete_many({"workspace_id": workspace_id})
    if database.sources_collection is not None:
        await database.sources_collection.delete_many({"workspace_id": workspace_id})
    if database.messages_collection is not None:
        await database.messages_collection.delete_many({"workspace_id": workspace_id})
    if database.chat_threads_collection is not None:
        await database.chat_threads_collection.delete_many({"workspace_id": workspace_id})
    if database.workspace_invites_collection is not None:
        await database.workspace_invites_collection.delete_many({"workspace_id": workspace_id})

    await database.workspaces_collection.delete_one({"_id": ObjectId(workspace_id)})

    try:
        vs.delete_workspace_vectors(user_id=user_id, workspace_id=workspace_id)
    except Exception:
        pass

    next_active_id = None
    remaining = await database.workspaces_collection.find_one({
        "$or": [{"owner_id": user_id}, {"members.user_id": user_id}]
    })
    if remaining:
        next_active_id = str(remaining["_id"])
    else:
        now = datetime.now(timezone.utc)
        fresh_ws = {
            "owner_id": user_id,
            "name": f"{current_user.get('username') or 'My'} HQ",
            "slug": slugify(current_user.get("username") or "my-hq"),
            "description": "Default workspace",
            "logo_url": None,
            "members": [member_entry(user_id, current_user.get("email"), "owner", user_id)],
            "created_at": now,
            "updated_at": now,
        }
        res = await database.workspaces_collection.insert_one(fresh_ws)
        next_active_id = str(res.inserted_id)

    await database.users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"active_workspace_id": next_active_id}}
    )

    # Repoint every other affected member (not just the deleter): anyone
    # whose active room was just deleted moves to their next room or None.
    for m in (ws.get("members") or []):
        mid = str(m.get("user_id"))
        if mid == user_id or not ObjectId.is_valid(mid):
            continue
        nxt = await database.workspaces_collection.find_one({
            "$or": [{"owner_id": mid}, {"members.user_id": mid}]
        })
        await database.users_collection.update_one(
            {"_id": ObjectId(mid), "active_workspace_id": workspace_id},
            {"$set": {"active_workspace_id": str(nxt["_id"]) if nxt else None}},
        )

    return {"message": "Workspace deleted successfully", "active_workspace_id": next_active_id}


@router.get("/{workspace_id}/members", response_model=WorkspaceMembersResponse)
async def list_members(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """List members + pending invites. Any member can view."""
    check_db()
    ws, _role = await get_workspace_with_access(workspace_id, current_user["id"])
    members = [
        WorkspaceMember(
            user_id=str(m.get("user_id")),
            email=m.get("email"),
            role=m.get("role", "viewer"),
            added_by=m.get("added_by"),
            added_at=m.get("added_at"),
        )
        for m in (ws.get("members") or [])
    ]
    invites: list[WorkspaceInvitePublic] = []
    if database.workspace_invites_collection is not None:
        cursor = database.workspace_invites_collection.find(
            {"workspace_id": workspace_id, "status": "pending"}
        ).sort("created_at", -1)
        async for inv in cursor:
            invites.append(_invite_to_public(inv))
    return WorkspaceMembersResponse(members=members, invites=invites)


@router.post("/{workspace_id}/invites", response_model=WorkspaceInviteCreated, status_code=status.HTTP_201_CREATED)
async def create_invites(
    workspace_id: str,
    body: WorkspaceInviteCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Invite teammates by email. Owner only in V1. Max 20 per call."""
    check_db()
    ws, role = await get_workspace_with_access(workspace_id, current_user["id"])
    require_role(role, ("owner",), "Only the workspace owner can invite members")

    if body.role not in ("editor", "viewer"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be editor or viewer")

    emails = sorted({e.strip().lower() for e in body.emails if e and "@" in e})
    if not emails:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Add at least one valid email")
    if len(emails) > 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Max 20 emails per invite")

    existing_member_emails = {(m.get("email") or "").lower() for m in (ws.get("members") or [])}

    created: list[WorkspaceInvitePublic] = []
    links: dict[str, str] = {}
    for email in emails:
        if email in existing_member_emails or email == (current_user.get("email") or "").lower():
            continue
        existing = await database.workspace_invites_collection.find_one(
            {"workspace_id": workspace_id, "email": email, "status": "pending"}
        )
        if existing:
            created.append(_invite_to_public(existing))
            links[email] = build_invite_link(existing["token"])
            continue
        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        doc = {
            "workspace_id": workspace_id,
            "email": email,
            "role": body.role,
            "token": token,
            "status": "pending",
            "invited_by": current_user["id"],
            "inviter_email": current_user.get("email"),
            "created_at": now,
            "expires_at": invite_expiry(),
        }
        res = await database.workspace_invites_collection.insert_one(doc)
        doc["_id"] = res.inserted_id
        created.append(_invite_to_public(doc))
        link = build_invite_link(token)
        links[email] = link
        background_tasks.add_task(
            send_invite_email, email, ws.get("name", "workspace"),
            current_user.get("email", "a teammate"), link,
        )

    return WorkspaceInviteCreated(invites=created, links=links)


@router.delete("/{workspace_id}/invites/{invite_id}")
async def revoke_invite(
    workspace_id: str,
    invite_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Revoke a pending invite. Owner only."""
    check_db()
    _ws, role = await get_workspace_with_access(workspace_id, current_user["id"])
    require_role(role, ("owner",), "Only the workspace owner can revoke invites")
    if not ObjectId.is_valid(invite_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite ID")
    res = await database.workspace_invites_collection.update_one(
        {"_id": ObjectId(invite_id), "workspace_id": workspace_id, "status": "pending"},
        {"$set": {"status": "revoked"}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    return {"message": "Invite revoked", "id": invite_id}


@router.delete("/{workspace_id}/members/{member_user_id}")
async def remove_member(
    workspace_id: str,
    member_user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove a member. Owner only, cannot remove self/owner. Uploads stay;
    the removed user's private chats in this room are shredded."""
    check_db()
    ws, role = await get_workspace_with_access(workspace_id, current_user["id"])
    require_role(role, ("owner",), "Only the workspace owner can remove members")
    if member_user_id == current_user["id"] or member_user_id == str(ws.get("owner_id")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot be removed")
    res = await database.workspaces_collection.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$pull": {"members": {"user_id": member_user_id}}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    # Shred the removed user's private chats in this room only. Other
    # members' threads and messages are untouched. Onboarding is untouched.
    if database.chat_threads_collection is not None:
        await database.chat_threads_collection.delete_many(
            {"workspace_id": workspace_id, "user_id": member_user_id})
    if database.messages_collection is not None:
        await database.messages_collection.delete_many(
            {"workspace_id": workspace_id, "user_id": member_user_id})
    if res.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    other = await database.workspaces_collection.find_one({
        "$or": [{"owner_id": member_user_id}, {"members.user_id": member_user_id}]
    })
    await database.users_collection.update_one(
        {"_id": ObjectId(member_user_id), "active_workspace_id": workspace_id},
        {"$set": {"active_workspace_id": str(other["_id"]) if other else None}},
    )
    return {"message": "Member removed", "workspace_id": workspace_id, "user_id": member_user_id}


@router.post("/{workspace_id}/leave")
async def leave_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Leave a shared workspace. Owner cannot leave (delete instead)."""
    check_db()
    ws, role = await get_workspace_with_access(workspace_id, current_user["id"])
    if role == "owner":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot leave. Delete the workspace instead.")
    await database.workspaces_collection.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$pull": {"members": {"user_id": current_user["id"]}}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    # Shred the leaver's private chats in this room only. Uploads stay for
    # the team; onboarding is untouched.
    if database.chat_threads_collection is not None:
        await database.chat_threads_collection.delete_many(
            {"workspace_id": workspace_id, "user_id": current_user["id"]})
    if database.messages_collection is not None:
        await database.messages_collection.delete_many(
            {"workspace_id": workspace_id, "user_id": current_user["id"]})
    other = await database.workspaces_collection.find_one({
        "$or": [{"owner_id": current_user["id"]}, {"members.user_id": current_user["id"]}]
    })
    next_id = str(other["_id"]) if other else None
    # Always repoint — never leave a dead pointer at the room just left.
    await database.users_collection.update_one(
        {"_id": ObjectId(current_user["id"]), "active_workspace_id": workspace_id},
        {"$set": {"active_workspace_id": next_id}}
    )
    return {"message": f"Left '{ws.get('name')}'", "active_workspace_id": next_id}
