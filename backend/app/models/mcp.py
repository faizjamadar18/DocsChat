"""MCP Server models — personal API keys + OAuth approve/info payloads."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class McpKeyCreate(BaseModel):
    name: str = Field(default="Claude", max_length=50)
    workspace_id: Optional[str] = None


class McpKeyPublic(BaseModel):
    id: str
    name: str
    workspace_id: Optional[str] = None
    key_prefix: str
    created_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    revoked: bool = False


class McpKeyCreated(BaseModel):
    id: str
    name: str
    workspace_id: Optional[str] = None
    key_prefix: str
    api_key: str
    created_at: Optional[datetime] = None


class McpKeyListResponse(BaseModel):
    keys: list[McpKeyPublic]


class OAuthApproveRequest(BaseModel):
    client_id: str
    redirect_uri: str
    scope: Optional[str] = ""
    state: Optional[str] = ""
    code_challenge: str
    code_challenge_method: Optional[str] = "S256"
    resource: Optional[str] = None
    workspace_id: Optional[str] = None


class OAuthApproveResponse(BaseModel):
    redirect_url: str


class McpInfoResponse(BaseModel):
    server_url: str
    issuer: str
    workspace_id: Optional[str] = None
