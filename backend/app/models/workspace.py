from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.document import DocumentResponse
from app.models.source import SourceResponse


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=2, max_length=50, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    logo_url: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = Field(None, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    logo_url: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceResponse]
    active_workspace_id: Optional[str] = None


class WorkspaceActivateResponse(BaseModel):
    message: str
    active_workspace_id: str


class WorkspaceDashboardResponse(BaseModel):
    recent_documents: list[DocumentResponse]
    recent_assets: list[SourceResponse]
