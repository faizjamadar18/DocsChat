from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import app.database as database
from app.database import check_db, slugify
from app.models.user import GoogleAuthRequest, UserResponse, TokenResponse
from app.services.auth_service import create_access_token
from app.middleware.auth_middleware import get_current_user
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
    else:
        # Existing user
        user_id = str(user["_id"])
        active_ws_id = user.get("active_workspace_id")

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

    token = create_access_token(user_id, email)

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            username=user.get("username", username),
            email=email,
            auth_provider="google",
            picture=user.get("picture"),
            active_workspace_id=user.get("active_workspace_id") or active_ws_id,
            created_at=user["created_at"],
        ),
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
        created_at=current_user["created_at"],
    )
