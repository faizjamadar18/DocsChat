from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
import app.database as database
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user account."""
    print("Password length:", len(user_data.password))
    print("Password:", repr(user_data.password))
    existing = await database.users_collection.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc),
    }

    result = await database.users_collection.insert_one(user_doc)

    return UserResponse(
        id=str(result.inserted_id),
        username=user_doc["username"],
        email=user_doc["email"],
        created_at=user_doc["created_at"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login and receive a JWT access token."""
    user = await database.users_collection.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["email"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            username=user["username"],
            email=user["email"],
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
        created_at=current_user["created_at"],
    )
