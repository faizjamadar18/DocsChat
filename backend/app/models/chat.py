from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ChatRequest(BaseModel):
    query: str
    model: Optional[str] = "groq"
    workspace_id: Optional[str] = None
    scope_ids: Optional[list[str]] = None
    attached_name: Optional[str] = None
    thread_id: Optional[str] = None
    require_scope: Optional[bool] = False
    mode: Optional[str] = "universal"


class Citation(BaseModel):
    source_id: str
    filename: str
    page: Optional[int] = None
    snippet: str
    similarity_score: float


class ChatMessage(BaseModel):
    id: str
    thread_id: Optional[str] = None
    workspace_id: Optional[str] = None
    role: str  # "user" | "assistant"
    content: str
    model_used: Optional[str] = None
    sources: Optional[list[Citation]] = None
    scope_ids: Optional[list[str]] = None
    attached_name: Optional[str] = None
    created_at: datetime


class ChatThreadUpdate(BaseModel):
    title: str


class ChatThreadResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    title: str
    mode: Optional[str] = "universal"
    attached_scope: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessage]
    total: int
    thread: Optional[ChatThreadResponse] = None


class ChatThreadCreate(BaseModel):
    workspace_id: Optional[str] = None
    title: Optional[str] = "New Conversation"
    mode: Optional[str] = "universal"
    attached_scope: Optional[dict] = None


class ChatThreadListResponse(BaseModel):
    threads: list[ChatThreadResponse]
    total: int
