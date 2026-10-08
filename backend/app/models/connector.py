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
