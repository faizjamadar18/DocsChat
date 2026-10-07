import json
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.models.chat import ChatRequest, ChatMessage, ChatHistoryResponse
from app.middleware.auth_middleware import get_current_user
from app.services.rag_service import ask_question, retrieve_for_query

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    workspace_id: Optional[str] = None,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Get chat history for current user and workspace, ordered by time."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    filter_query: dict = {"user_id": current_user["id"]}
    if target_ws:
        filter_query["workspace_id"] = target_ws

    cursor = database.messages_collection.find(filter_query).sort("created_at", 1)

    messages = []
    async for doc in cursor:
        messages.append(ChatMessage(
            id=str(doc["_id"]),
            workspace_id=doc.get("workspace_id"),
            role=doc["role"],
            content=doc["content"],
            model_used=doc.get("model_used") or "groq",
            sources=doc.get("sources"),
            scope_ids=doc.get("scope_ids"),
            attached_name=doc.get("attached_name"),
            created_at=doc["created_at"],
        ))

    return ChatHistoryResponse(messages=messages, total=len(messages))


@router.post("/ask")
async def ask(
    request: ChatRequest,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """
    Ask a question using the RAG pipeline. Streams the response via SSE.
    Enforces Groq Llama 3.3 70B exclusively.
    """
    user_id = current_user["id"]
    target_workspace_id = request.workspace_id or x_workspace_id or current_user.get("active_workspace_id")

    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    # Enforce Groq model
    enforced_model = "groq"

    # Retrieve context and citations scoped to workspace (and scope_ids if provided)
    context, citations = await retrieve_for_query(
        user_id=user_id,
        query=request.query,
        workspace_id=target_workspace_id,
        scope_ids=request.scope_ids,
    )

    # Save user message to MongoDB
    user_msg = {
        "user_id": user_id,
        "workspace_id": target_workspace_id,
        "role": "user",
        "content": request.query,
        "model_used": None,
        "scope_ids": request.scope_ids,
        "attached_name": request.attached_name,
        "created_at": datetime.now(timezone.utc),
    }
    await database.messages_collection.insert_one(user_msg)

    # Stream the response via SSE
    async def event_stream():
        full_response = ""
        try:
            async for token in ask_question(
                user_id=user_id,
                query=request.query,
                model=enforced_model,
                context=context,
                workspace_id=target_workspace_id,
            ):
                full_response += token
                data = json.dumps({"token": token, "done": False})
                yield f"data: {data}\n\n"

            has_read_document = bool(request.scope_ids or (citations and len(citations) > 0))
            has_searched_workspace = bool(not request.scope_ids or (citations and len(citations) > 0))

            data = json.dumps({
                "token": "",
                "done": True,
                "sources": citations,
                "has_read_document": has_read_document,
                "has_searched_workspace": has_searched_workspace,
            })
            yield f"data: {data}\n\n"

            assistant_msg = {
                "user_id": user_id,
                "workspace_id": target_workspace_id,
                "role": "assistant",
                "content": full_response,
                "model_used": enforced_model,
                "sources": citations,
                "scope_ids": request.scope_ids,
                "attached_name": request.attached_name,
                "created_at": datetime.now(timezone.utc),
            }
            await database.messages_collection.insert_one(assistant_msg)

        except Exception as e:
            error_data = json.dumps({"error": str(e), "done": True})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/clear", status_code=status.HTTP_200_OK)
async def clear_chat(
    workspace_id: Optional[str] = None,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Clear chat history for the current user and active workspace."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    filter_query: dict = {"user_id": current_user["id"]}
    if target_ws:
        filter_query["workspace_id"] = target_ws

    result = await database.messages_collection.delete_many(filter_query)
    return {"message": "Chat history cleared", "deleted_count": result.deleted_count}
