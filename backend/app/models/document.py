from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class DocumentCreate(BaseModel):
    title: str = Field(..., description="Title of the document")
    content: str = Field(..., description="Rich text content (JSON or HTML)")
    plain_text: str = Field(..., description="Plain text for indexing")

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    plain_text: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    title: str
    content: str
    plain_text: str
    created_at: datetime
    updated_at: datetime

class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
