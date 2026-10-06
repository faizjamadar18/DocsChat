from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ChatRequest(BaseModel):
    query: str
    model: Optional[str] = "groq"
    workspace_id: Optional[str] = None


class Citation(BaseModel):
    source_id: str
    filename: str
    page: Optional[int] = None
    snippet: str
    similarity_score: float


class ChatMessage(BaseModel):
    id: str
    workspace_id: Optional[str] = None
    role: str  # "user" | "assistant"
    content: str
    model_used: Optional[str] = None
    sources: Optional[list[Citation]] = None
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessage]
    total: int
