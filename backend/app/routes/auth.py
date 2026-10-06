from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import app.database as database
from app.database import check_db
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

    if not user:
        # Create new user
        user_doc = {
            "email": email,
            "username": username,
            "picture": picture,
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc),
        }
        result = await database.users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        user = user_doc
    else:
        # Existing user, we can optionally update picture/name here
        user_id = str(user["_id"])
        update_doc = {"$set": {"auth_provider": "google"}}
        if picture and not user.get("picture"):
            update_doc["$set"]["picture"] = picture
        
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
        created_at=current_user["created_at"],
    )
