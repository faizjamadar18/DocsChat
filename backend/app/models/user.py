from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID Token")


class UserInDB(BaseModel):
    id: str
    username: str
    email: str
    auth_provider: str = "google"
    picture: Optional[str] = None
    active_workspace_id: Optional[str] = None
    onboarding_completed: bool = False
    preferences: Optional[Dict[str, Any]] = None
    created_at: datetime


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    auth_provider: str = "google"
    picture: Optional[str] = None
    active_workspace_id: Optional[str] = None
    onboarding_completed: bool = False
    preferences: Optional[Dict[str, Any]] = None
    created_at: datetime


class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = Field(None, max_length=100)
    picture: Optional[str] = Field(None, max_length=5_000_000)
    preferences: Optional[Dict[str, Any]] = None


class OnboardingRequest(BaseModel):
    workspace_name: str = Field(..., min_length=1, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool = False
    user: UserResponse
