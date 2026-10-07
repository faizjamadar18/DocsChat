import json
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.models.chat import (
    ChatRequest,
    ChatMessage,
    ChatHistoryResponse,
    ChatThreadResponse,
    ChatThreadListResponse,
    ChatThreadCreate,
    ChatThreadUpdate,
)
from app.middleware.auth_middleware import get_current_user
from app.services.rag_service import ask_question, retrieve_for_query

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.get("/threads", response_model=ChatThreadListResponse)
async def list_threads(
    workspace_id: Optional[str] = None,
    mode: Optional[str] = None,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """List chat threads for the current user and active workspace, optionally filtered by mode."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    filter_query: dict = {"user_id": current_user["id"]}
    if target_ws:
        filter_query["workspace_id"] = target_ws

    if mode == "universal":
        filter_query["$or"] = [{"mode": "universal"}, {"mode": {"$exists": False}}]
    elif mode:
        filter_query["mode"] = mode

    cursor = database.chat_threads_collection.find(filter_query).sort("updated_at", -1)

    threads = []
    async for doc in cursor:
        threads.append(ChatThreadResponse(
            id=str(doc["_id"]),
            workspace_id=doc.get("workspace_id", ""),
            user_id=doc.get("user_id", ""),
            title=doc.get("title", "New Conversation"),
            mode=doc.get("mode", "universal"),
            attached_scope=doc.get("attached_scope"),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        ))

    return ChatThreadListResponse(threads=threads, total=len(threads))


@router.post("/threads", response_model=ChatThreadResponse, status_code=status.HTTP_201_CREATED)
async def create_thread(
    request: ChatThreadCreate,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Create a new chat thread for the active workspace."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = request.workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    if not target_ws:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="workspace_id is required")

    now = datetime.now(timezone.utc)
    title = (request.title or "New Conversation").strip()
    thread_mode = request.mode or "universal"
    new_thread = {
        "user_id": current_user["id"],
        "workspace_id": target_ws,
        "title": title,
        "mode": thread_mode,
        "attached_scope": request.attached_scope,
        "created_at": now,
        "updated_at": now,
    }
    result = await database.chat_threads_collection.insert_one(new_thread)

    return ChatThreadResponse(
        id=str(result.inserted_id),
        workspace_id=target_ws,
        user_id=current_user["id"],
        title=title,
        mode=thread_mode,
        attached_scope=request.attached_scope,
        created_at=now,
        updated_at=now,
    )


@router.get("/threads/{thread_id}/messages", response_model=ChatHistoryResponse)
async def get_thread_messages(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get all messages for a specific chat thread."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid thread ID")

    thread = await database.chat_threads_collection.find_one({
        "_id": ObjectId(thread_id),
        "user_id": current_user["id"],
    })
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

    cursor = database.messages_collection.find({"thread_id": thread_id}).sort("created_at", 1)
    messages = []
    async for doc in cursor:
        messages.append(ChatMessage(
            id=str(doc["_id"]),
            thread_id=doc.get("thread_id"),
            workspace_id=doc.get("workspace_id"),
            role=doc["role"],
            content=doc["content"],
            model_used=doc.get("model_used") or "groq",
            sources=doc.get("sources"),
            scope_ids=doc.get("scope_ids"),
            attached_name=doc.get("attached_name"),
            created_at=doc["created_at"],
        ))

    thread_info = ChatThreadResponse(
        id=str(thread["_id"]),
        workspace_id=thread.get("workspace_id", ""),
        user_id=thread.get("user_id", ""),
        title=thread.get("title", "New Conversation"),
        mode=thread.get("mode", "universal"),
        attached_scope=thread.get("attached_scope"),
        created_at=thread.get("created_at", datetime.now(timezone.utc)),
        updated_at=thread.get("updated_at", datetime.now(timezone.utc)),
    )

    return ChatHistoryResponse(messages=messages, total=len(messages), thread=thread_info)


@router.patch("/threads/{thread_id}", response_model=ChatThreadResponse)
async def update_thread(
    thread_id: str,
    request: ChatThreadUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Rename or update a chat thread."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid thread ID")

    now = datetime.now(timezone.utc)
    res = await database.chat_threads_collection.find_one_and_update(
        {"_id": ObjectId(thread_id), "user_id": current_user["id"]},
        {"$set": {"title": request.title.strip(), "updated_at": now}},
        return_document=True,
    )
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

    return ChatThreadResponse(
        id=str(res["_id"]),
        workspace_id=res["workspace_id"],
        user_id=res["user_id"],
        title=res["title"],
        mode=res.get("mode", "universal"),
        attached_scope=res.get("attached_scope"),
        created_at=res["created_at"],
        updated_at=res["updated_at"],
    )


@router.delete("/threads/{thread_id}", status_code=status.HTTP_200_OK)
async def delete_thread(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a chat thread and all its messages."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid thread ID")

    thread = await database.chat_threads_collection.find_one({
        "_id": ObjectId(thread_id),
        "user_id": current_user["id"],
    })
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

    await database.chat_threads_collection.delete_one({"_id": ObjectId(thread_id)})
    await database.messages_collection.delete_many({"thread_id": thread_id})
    return {"message": "Thread deleted successfully", "id": thread_id}


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    workspace_id: Optional[str] = None,
    thread_id: Optional[str] = None,
    mode: Optional[str] = None,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Get chat history for current user and workspace (or specific thread), ordered by time.
    Supports optional mode filter for strict conversation isolation across
    universal / assets / studio pipelines. When mode is provided without a
    thread_id, only messages belonging to threads of that mode are returned.
    """
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    filter_query: dict = {"user_id": current_user["id"]}
    if thread_id:
        filter_query["thread_id"] = thread_id
    elif target_ws:
        filter_query["workspace_id"] = target_ws

    if mode and not thread_id and database.chat_threads_collection is not None:
        # Resolve thread IDs belonging to the requested mode, then scope
        # messages to those threads for strict isolation.
        thread_filter: dict = {"user_id": current_user["id"]}
        if target_ws:
            thread_filter["workspace_id"] = target_ws
        if mode == "universal":
            thread_filter["$or"] = [{"mode": "universal"}, {"mode": {"$exists": False}}]
        else:
            thread_filter["mode"] = mode
        mode_thread_ids: list[str] = []
        mode_cursor = database.chat_threads_collection.find(thread_filter, {"_id": 1})
        async for tdoc in mode_cursor:
            mode_thread_ids.append(str(tdoc["_id"]))
        if not mode_thread_ids:
            return ChatHistoryResponse(messages=[], total=0)
        # Include legacy messages without thread_id only for universal mode
        if mode == "universal":
            filter_query["$or"] = [
                {"thread_id": {"$in": mode_thread_ids}},
                {"thread_id": {"$exists": False}},
                {"thread_id": None},
            ]
        else:
            filter_query["thread_id"] = {"$in": mode_thread_ids}

    cursor = database.messages_collection.find(filter_query).sort("created_at", 1)

    messages = []
    async for doc in cursor:
        messages.append(ChatMessage(
            id=str(doc["_id"]),
            thread_id=doc.get("thread_id"),
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
    Associates question and response with a thread (auto-creates thread if needed).
    """
    user_id = current_user["id"]
    target_workspace_id = request.workspace_id or x_workspace_id or current_user.get("active_workspace_id")

    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    # Resolve or create thread
    active_thread_id = request.thread_id
    created_new_thread = False
    thread_title = ""
    thread_mode = request.mode or "universal"
    attached_scope = None
    if request.attached_name and request.scope_ids and len(request.scope_ids) > 0:
        attached_scope = {
            "id": request.scope_ids[0],
            "title": request.attached_name,
            "type": "asset" if thread_mode == "assets" else "document",
        }

    now = datetime.now(timezone.utc)
    if database.chat_threads_collection is not None:
        if active_thread_id and ObjectId.is_valid(active_thread_id):
            existing_thread = await database.chat_threads_collection.find_one({
                "_id": ObjectId(active_thread_id),
                "user_id": user_id,
            })
            if existing_thread:
                thread_title = existing_thread.get("title", "Conversation")
                thread_mode = existing_thread.get("mode", thread_mode)
                if not attached_scope:
                    attached_scope = existing_thread.get("attached_scope")
            else:
                active_thread_id = None

        if not active_thread_id:
            # Auto-create thread titled from first query
            trimmed_title = request.query.strip().split("\n")[0][:45]
            thread_title = trimmed_title if len(trimmed_title) <= 45 else trimmed_title + "..."
            if not thread_title:
                thread_title = "New Conversation"

            new_thread_doc = {
                "user_id": user_id,
                "workspace_id": target_workspace_id,
                "title": thread_title,
                "mode": thread_mode,
                "attached_scope": attached_scope,
                "created_at": now,
                "updated_at": now,
            }
            ins_res = await database.chat_threads_collection.insert_one(new_thread_doc)
            active_thread_id = str(ins_res.inserted_id)
            created_new_thread = True
        else:
            # Update thread updated_at and attached_scope if missing
            update_fields: dict = {"updated_at": now}
            if attached_scope:
                update_fields["attached_scope"] = attached_scope
            await database.chat_threads_collection.update_one(
                {"_id": ObjectId(active_thread_id)},
                {"$set": update_fields}
            )

    # Enforce Groq model
    enforced_model = "groq"

    # Guardrail: If client requires explicit attachment and none was provided
    if request.require_scope and not request.scope_ids:
        user_msg = {
            "user_id": user_id,
            "workspace_id": target_workspace_id,
            "thread_id": active_thread_id,
            "role": "user",
            "content": request.query,
            "model_used": None,
            "scope_ids": [],
            "attached_name": None,
            "created_at": datetime.now(timezone.utc),
        }
        if database.messages_collection is not None:
            await database.messages_collection.insert_one(user_msg)

        async def unattached_stream():
            init_event = {
                "type": "thread_info",
                "thread_id": active_thread_id,
                "thread_title": thread_title,
                "mode": thread_mode,
                "attached_scope": attached_scope,
                "is_new": created_new_thread,
            }
            yield f"data: {json.dumps(init_event)}\n\n"
            msg = "Please attach or select a document to ask questions about it."
            yield f"data: {json.dumps({'token': msg, 'done': False})}\n\n"
            yield f"data: {json.dumps({'token': '', 'done': True, 'sources': [], 'has_read_document': False, 'has_searched_workspace': False, 'thread_id': active_thread_id})}\n\n"

            assistant_msg = {
                "user_id": user_id,
                "workspace_id": target_workspace_id,
                "thread_id": active_thread_id,
                "role": "assistant",
                "content": msg,
                "model_used": "groq",
                "sources": [],
                "scope_ids": [],
                "attached_name": None,
                "created_at": datetime.now(timezone.utc),
            }
            if database.messages_collection is not None:
                await database.messages_collection.insert_one(assistant_msg)

        return StreamingResponse(
            unattached_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

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
        "thread_id": active_thread_id,
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
            # First send thread information event so the frontend knows the active thread ID
            init_event = {
                "type": "thread_info",
                "thread_id": active_thread_id,
                "thread_title": thread_title,
                "mode": thread_mode,
                "attached_scope": attached_scope,
                "is_new": created_new_thread,
            }
            yield f"data: {json.dumps(init_event)}\n\n"

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
                "thread_id": active_thread_id,
            })
            yield f"data: {data}\n\n"

            assistant_msg = {
                "user_id": user_id,
                "workspace_id": target_workspace_id,
                "thread_id": active_thread_id,
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
            error_data = json.dumps({"error": str(e), "done": True, "thread_id": active_thread_id})
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
    thread_id: Optional[str] = None,
    mode: Optional[str] = None,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Clear chat history for the current user and active workspace (or specific thread).
    Supports optional mode so clearing one pipeline never wipes the others."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    filter_query: dict = {"user_id": current_user["id"]}
    if thread_id:
        filter_query["thread_id"] = thread_id
    else:
        target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
        if target_ws:
            filter_query["workspace_id"] = target_ws
        if mode and database.chat_threads_collection is not None:
            thread_filter: dict = {"user_id": current_user["id"]}
            if target_ws:
                thread_filter["workspace_id"] = target_ws
            if mode == "universal":
                thread_filter["$or"] = [{"mode": "universal"}, {"mode": {"$exists": False}}]
            else:
                thread_filter["mode"] = mode
            mode_thread_ids: list[str] = []
            mode_cursor = database.chat_threads_collection.find(thread_filter, {"_id": 1})
            async for tdoc in mode_cursor:
                mode_thread_ids.append(str(tdoc["_id"]))
            if not mode_thread_ids:
                return {"message": "Chat history cleared", "deleted_count": 0}
            if mode == "universal":
                filter_query["$or"] = [
                    {"thread_id": {"$in": mode_thread_ids}},
                    {"thread_id": {"$exists": False}},
                    {"thread_id": None},
                ]
            else:
                filter_query["thread_id"] = {"$in": mode_thread_ids}

    result = await database.messages_collection.delete_many(filter_query)
    return {"message": "Chat history cleared", "deleted_count": result.deleted_count}

