from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
import app.database as database
from app.database import check_db, slugify
from app.models.user import GoogleAuthRequest, UserResponse, TokenResponse, OnboardingRequest, ProfileUpdateRequest
from app.services.auth_service import create_access_token
from app.middleware.auth_middleware import get_current_user
from app.services import vector_store as vs
from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleAuthRequest):
    """Login or Register with Google OAuth"""
    try:
        idinfo = id_token.verify_oauth2_token(
            request.credential, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )

    email = idinfo.get("email")
    username = idinfo.get("name")
    picture = idinfo.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must have an email",
        )

    try:
        check_db()
    except database.DatabaseNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    user = await database.users_collection.find_one({"email": email})
    now = datetime.now(timezone.utc)

    if not user:
        # Create new user
        user_doc = {
            "email": email,
            "username": username,
            "picture": picture,
            "auth_provider": "google",
            "active_workspace_id": None,
            "onboarding_completed": False,
            "created_at": now,
        }
        result = await database.users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)

        # Auto-provision default workspace
        base_slug = slugify(username or "my-hq")
        ws_doc = {
            "owner_id": user_id,
            "name": f"{username or 'My'} HQ",
            "slug": base_slug,
            "description": "Default workspace",
            "logo_url": None,
            "created_at": now,
            "updated_at": now,
        }
        ws_result = await database.workspaces_collection.insert_one(ws_doc)
        active_ws_id = str(ws_result.inserted_id)

        await database.users_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"active_workspace_id": active_ws_id}}
        )
        user = user_doc
        user["active_workspace_id"] = active_ws_id
        user["onboarding_completed"] = False
        is_new_user = True
    else:
        # Existing user
        user_id = str(user["_id"])
        active_ws_id = user.get("active_workspace_id")

        # Legacy users created before onboarding default to completed
        # so they are never forced into the onboarding flow.
        onboarding_completed = user.get("onboarding_completed", True)

        update_doc = {"$set": {"auth_provider": "google"}}
        if picture and not user.get("picture"):
            update_doc["$set"]["picture"] = picture

        # If user has no active workspace, check or provision one
        if not active_ws_id:
            existing_ws = await database.workspaces_collection.find_one({"owner_id": user_id})
            if existing_ws:
                active_ws_id = str(existing_ws["_id"])
            else:
                ws_doc = {
                    "owner_id": user_id,
                    "name": f"{user.get('username') or username or 'My'} HQ",
                    "slug": slugify(user.get("username") or username or "my-hq"),
                    "description": "Default workspace",
                    "logo_url": None,
                    "created_at": now,
                    "updated_at": now,
                }
                ws_result = await database.workspaces_collection.insert_one(ws_doc)
                active_ws_id = str(ws_result.inserted_id)

            update_doc["$set"]["active_workspace_id"] = active_ws_id
            user["active_workspace_id"] = active_ws_id

        await database.users_collection.update_one({"_id": user["_id"]}, update_doc)
        user["auth_provider"] = "google"
        if picture and not user.get("picture"):
            user["picture"] = picture
        is_new_user = not onboarding_completed
        user["onboarding_completed"] = onboarding_completed

    token = create_access_token(user_id, email)

    return TokenResponse(
        access_token=token,
        is_new_user=is_new_user,
        user=UserResponse(
            id=user_id,
            username=user.get("username", username),
            email=email,
            auth_provider="google",
            picture=user.get("picture"),
            active_workspace_id=user.get("active_workspace_id") or active_ws_id,
            onboarding_completed=user.get("onboarding_completed", False),
            created_at=user["created_at"],
        ),
    )


@router.patch("/onboarding", response_model=UserResponse)
async def complete_onboarding(
    data: OnboardingRequest,
    current_user: dict = Depends(get_current_user),
):
    """Rename the auto-provisioned workspace and mark onboarding complete.

    Only for first-time users. Old users go straight home and can
    rename later in Settings.
    """
    try:
        check_db()
    except database.DatabaseNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    user_id = current_user["id"]
    workspace_name = data.workspace_name.strip()
    if not workspace_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Workspace name must not be empty",
        )

    active_ws_id = current_user.get("active_workspace_id")
    workspace = None
    if active_ws_id and ObjectId.is_valid(active_ws_id):
        workspace = await database.workspaces_collection.find_one({
            "_id": ObjectId(active_ws_id),
            "owner_id": user_id,
        })
    if not workspace:
        workspace = await database.workspaces_collection.find_one({"owner_id": user_id})
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    workspace_id = workspace["_id"]
    base_slug = slugify(workspace_name)
    slug = base_slug
    count = 1
    while await database.workspaces_collection.find_one({
        "_id": {"$ne": workspace_id},
        "owner_id": user_id,
        "slug": slug,
    }):
        count += 1
        slug = f"{base_slug}-{count}"

    now = datetime.now(timezone.utc)
    await database.workspaces_collection.update_one(
        {"_id": workspace_id},
        {"$set": {"name": workspace_name, "slug": slug, "updated_at": now}},
    )
    await database.users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"active_workspace_id": str(workspace_id), "onboarding_completed": True}},
    )

    return UserResponse(
        id=user_id,
        username=current_user["username"],
        email=current_user["email"],
        auth_provider=current_user.get("auth_provider", "google"),
        picture=current_user.get("picture"),
        active_workspace_id=str(workspace_id),
        onboarding_completed=True,
        created_at=current_user["created_at"],
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        auth_provider=current_user.get("auth_provider", "google"),
        picture=current_user.get("picture"),
        active_workspace_id=current_user.get("active_workspace_id"),
        onboarding_completed=current_user.get("onboarding_completed", True),
        preferences=current_user.get("preferences"),
        created_at=current_user["created_at"],
    )


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update current user profile (name, avatar picture, preferences)."""
    try:
        check_db()
    except database.DatabaseNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    user_id = current_user["id"]
    updates = {}
    if data.username is not None:
        cleaned_name = data.username.strip()
        if cleaned_name:
            updates["username"] = cleaned_name
    if data.picture is not None:
        updates["picture"] = data.picture if data.picture.strip() else None
    if data.preferences is not None:
        existing_prefs = current_user.get("preferences") or {}
        existing_prefs.update(data.preferences)
        updates["preferences"] = existing_prefs

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await database.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates}
        )
        current_user.update(updates)

    return UserResponse(
        id=user_id,
        username=current_user.get("username", "User"),
        email=current_user["email"],
        auth_provider=current_user.get("auth_provider", "google"),
        picture=current_user.get("picture"),
        active_workspace_id=current_user.get("active_workspace_id"),
        onboarding_completed=current_user.get("onboarding_completed", True),
        preferences=current_user.get("preferences"),
        created_at=current_user["created_at"],
    )


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Permanently delete the current user's account and all their data.

    Wipes every workspace they own plus all documents, sources, messages,
    threads, voice logs, connectors, sync jobs, MCP keys, and OAuth tokens
    scoped to them, then removes the user itself. Never touches other users.
    """
    try:
        check_db()
    except database.DatabaseNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    user_id = current_user["id"]

    # Collect owned workspace ids first so workspace-scoped rows are covered
    # even for legacy records that only carry workspace_id.
    workspace_ids: list[str] = []
    if database.workspaces_collection is not None:
        cursor = database.workspaces_collection.find({"owner_id": user_id})
        async for ws in cursor:
            workspace_ids.append(str(ws["_id"]))

    # Qdrant vectors per workspace; a vector failure must not block the wipe.
    for ws_id in workspace_ids:
        try:
            vs.delete_workspace_vectors(user_id=user_id, workspace_id=ws_id)
        except Exception:
            pass

    async def _wipe(collection, *filters: dict):
        if collection is None:
            return
        for f in filters:
            await collection.delete_many(f)

    if workspace_ids:
        ws_filter = {"workspace_id": {"$in": workspace_ids}}
        await _wipe(database.documents_collection, ws_filter)
        await _wipe(database.sources_collection, ws_filter)
        await _wipe(database.messages_collection, ws_filter)
        await _wipe(database.chat_threads_collection, ws_filter)
        await _wipe(database.voice_logs_collection, ws_filter)

    await _wipe(database.documents_collection, {"user_id": user_id})
    await _wipe(database.sources_collection, {"user_id": user_id})
    await _wipe(database.messages_collection, {"user_id": user_id})
    await _wipe(database.chat_threads_collection, {"user_id": user_id})
    await _wipe(database.voice_logs_collection, {"user_id": user_id})
    await _wipe(database.connector_accounts_collection, {"user_id": user_id})
    await _wipe(database.sync_jobs_collection, {"user_id": user_id})
    await _wipe(database.mcp_keys_collection, {"user_id": user_id})
    await _wipe(database.oauth_tokens_collection, {"user_id": user_id})
    await _wipe(database.workspaces_collection, {"owner_id": user_id})

    if database.users_collection is not None:
        await database.users_collection.delete_one({"_id": ObjectId(user_id)})

    return {"message": "Account deleted successfully"}
