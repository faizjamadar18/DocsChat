from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str


class UserInDB(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
