from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SourceResponse(BaseModel):
    id: str
    workspace_id: Optional[str] = None
    filename: str
    file_size: int
    page_count: int
    chunk_count: int
    status: str  # "processing" | "ready" | "error" | "syncing"
    uploaded_at: datetime
    source_type: Optional[str] = None  # "pdf" | "notion" | "drive" | None (legacy = pdf)
    remote_id: Optional[str] = None  # Notion page_id (normalized) / Drive fileId
    remote_url: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    sync_error: Optional[str] = None


class SourceListResponse(BaseModel):
    sources: list[SourceResponse]
    total: int
