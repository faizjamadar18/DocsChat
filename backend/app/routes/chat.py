import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from bson import ObjectId
import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.models.chat import ChatRequest, ChatMessage, ChatHistoryResponse
from app.middleware.auth_middleware import get_current_user
from app.services.rag_service import ask_question

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """Get the full chat history for the current user, ordered by time."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    cursor = database.messages_collection.find(
        {"user_id": current_user["id"]}
    ).sort("created_at", 1)

    messages = []
    async for doc in cursor:
        messages.append(ChatMessage(
            id=str(doc["_id"]),
            role=doc["role"],
            content=doc["content"],
            model_used=doc.get("model_used"),
            sources=doc.get("sources"),
            created_at=doc["created_at"],
        ))

    return ChatHistoryResponse(messages=messages, total=len(messages))


VALID_MODELS = {"gemini", "groq"}


@router.post("/ask")
async def ask(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Ask a question using the RAG pipeline. Streams the response via SSE.
    Both the user message and assistant response are saved to MongoDB.
    """
    if request.model not in VALID_MODELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid model. Choose one of: {', '.join(sorted(VALID_MODELS))}",
        )

    user_id = current_user["id"]
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    # Retrieve context and citations once before streaming
    from app.services.rag_service import retrieve_for_query
    context, citations = await retrieve_for_query(user_id, request.query)

    # Save user message to MongoDB
    user_msg = {
        "user_id": user_id,
        "role": "user",
        "content": request.query,
        "model_used": None,
        "created_at": datetime.now(timezone.utc),
    }
    await database.messages_collection.insert_one(user_msg)

    # Stream the response via SSE
    async def event_stream():
        full_response = ""
        try:
            async for token in ask_question(
                user_id, request.query, request.model, context=context
            ):
                full_response += token
                data = json.dumps({"token": token, "done": False})
                yield f"data: {data}\n\n"

            data = json.dumps({"token": "", "done": True, "sources": citations})
            yield f"data: {data}\n\n"

            assistant_msg = {
                "user_id": user_id,
                "role": "assistant",
                "content": full_response,
                "model_used": request.model,
                "sources": citations,
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
async def clear_chat(current_user: dict = Depends(get_current_user)):
    """Clear all chat history for the current user."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    result = await database.messages_collection.delete_many({"user_id": current_user["id"]})
    return {"message": "Chat history cleared", "deleted_count": result.deleted_count}
