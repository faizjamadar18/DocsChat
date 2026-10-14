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
    role: Optional[str] = None
    member_count: Optional[int] = None


class WorkspaceMember(BaseModel):
    user_id: str
    email: Optional[str] = None
    role: str = "viewer"
    added_by: Optional[str] = None
    added_at: Optional[datetime] = None


class WorkspaceMembersResponse(BaseModel):
    members: list[WorkspaceMember]
    invites: list["WorkspaceInvitePublic"] = []


class WorkspaceInviteCreate(BaseModel):
    emails: list[str] = Field(..., min_length=1, max_length=20)
    role: str = Field("viewer", pattern=r"^(editor|viewer)$")


class WorkspaceInvitePublic(BaseModel):
    id: str
    email: str
    role: str = "viewer"
    status: str = "pending"
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class WorkspaceInviteCreated(BaseModel):
    invites: list[WorkspaceInvitePublic]
    links: dict[str, str] = {}


class WorkspaceInviteAcceptResponse(BaseModel):
    message: str
    workspace_id: str
    role: str


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceResponse]
    active_workspace_id: Optional[str] = None


class WorkspaceActivateResponse(BaseModel):
    message: str
    active_workspace_id: str


class WorkspaceDashboardResponse(BaseModel):
    recent_documents: list[DocumentResponse]
    recent_assets: list[SourceResponse]
