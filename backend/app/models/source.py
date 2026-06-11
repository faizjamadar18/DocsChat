from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SourceResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    chunk_count: int
    status: str  # "processing" | "ready" | "error"
    uploaded_at: datetime


class SourceListResponse(BaseModel):
    sources: list[SourceResponse]
    total: int
