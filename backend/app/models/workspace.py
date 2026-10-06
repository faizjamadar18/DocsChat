from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class WorkspaceCreate(BaseModel):
    name: str = Field(..., description="Name of the workspace")
    description: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkspaceResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceResponse]
    total: int
