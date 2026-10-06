from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID Token")


class UserInDB(BaseModel):
    id: str
    username: str
    email: str
    auth_provider: str = "google"
    picture: Optional[str] = None
    created_at: datetime


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    auth_provider: str = "google"
    picture: Optional[str] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
