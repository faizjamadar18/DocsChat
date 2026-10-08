from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ConnectorStatus(BaseModel):
    connected: bool
    email_or_account: Optional[str] = None
    connected_at: Optional[datetime] = None
    imported_count: int = 0


class ConnectorsStatusResponse(BaseModel):
    notion: ConnectorStatus
    drive: ConnectorStatus
    github: ConnectorStatus


class NotionAuthUrlResponse(BaseModel):
    auth_url: str


class NotionPageItem(BaseModel):
    id: str = Field(..., description="Notion page id (dashed or plain)")
    title: str = "Untitled"
    url: Optional[str] = None
    last_edited_time: Optional[str] = None


class NotionPagesResponse(BaseModel):
    pages: list[NotionPageItem]


class NotionImportRequest(BaseModel):
    pages: list[NotionPageItem] = Field(..., min_length=1, max_length=50)


class NotionImportResponse(BaseModel):
    imported: list[dict]
    total: int


class DisconnectResponse(BaseModel):
    message: str
    vectors_removed: int = 0
    sources_deleted: int = 0


class DriveAuthUrlResponse(BaseModel):
    auth_url: str


class DrivePickerTokenResponse(BaseModel):
    access_token: str


class DriveFileItem(BaseModel):
    id: str = Field(..., description="Drive fileId from Picker")
    name: str = "Untitled"
    mimeType: Optional[str] = None


class DriveImportRequest(BaseModel):
    files: list[DriveFileItem] = Field(..., min_length=1, max_length=50)


class DriveImportResponse(BaseModel):
    imported: list[dict]
    total: int


class GitHubAuthUrlResponse(BaseModel):
    auth_url: str


class GitHubRepoItem(BaseModel):
    id: str = Field(..., description="owner/repo, e.g. octocat/hello-world")
    name: str = "Untitled"
    url: Optional[str] = None
    private: bool = False
    default_branch: Optional[str] = None


class GitHubReposResponse(BaseModel):
    repos: list[GitHubRepoItem]


class GitHubImportRequest(BaseModel):
    repos: list[GitHubRepoItem] = Field(..., min_length=1, max_length=10)


class GitHubImportResponse(BaseModel):
    imported: list[dict]
    total: int
