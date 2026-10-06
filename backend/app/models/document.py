from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class DocumentCreate(BaseModel):
    title: str = Field(default="Untitled Document", max_length=200)
    content_json: Optional[dict[str, Any]] = None
    content_text: Optional[str] = ""


class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content_json: Optional[dict[str, Any]] = None
    content_text: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    title: str
    content_json: Optional[dict[str, Any]] = None
    content_text: Optional[str] = ""
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
