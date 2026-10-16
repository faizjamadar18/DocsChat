from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Header, Query, status
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.models.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    AiRefactorRequest,
    AiRefactorResponse,
    AiDraftRequest,
    AiDraftResponse,
)
from app.middleware.auth_middleware import get_current_user
from app.services.llm_service import generate_response
from app.services.rag_service import process_document_content
from app.services import vector_store as vs
from app.services.workspace_access import get_workspace_with_access, require_role

router = APIRouter(prefix="/api/documents", tags=["Documents"])


def _doc_to_response(doc: dict) -> DocumentResponse:
    created_at = doc.get("created_at")
    if created_at and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    updated_at = doc.get("updated_at")
    if updated_at and updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)

    return DocumentResponse(
        id=str(doc["_id"]),
        workspace_id=str(doc.get("workspace_id", "")),
        user_id=str(doc.get("user_id", "")),
        title=doc.get("title", "Untitled Document"),
        content_json=doc.get("content_json"),
        content_text=doc.get("content_text", ""),
        created_at=created_at or datetime.now(timezone.utc),
        updated_at=updated_at or datetime.now(timezone.utc),
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    data: DocumentCreate,
    background_tasks: BackgroundTasks,
    workspace_id: Optional[str] = Query(None),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Create a new document in the active or specified workspace."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    if not target_ws:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active workspace found")
    _ws, _role = await get_workspace_with_access(target_ws, current_user["id"])
    require_role(_role, ("owner", "editor"), "Viewers cannot create documents.")

    now = datetime.now(timezone.utc)
    doc_dict = {
        "workspace_id": target_ws,
        "user_id": current_user["id"],
        "title": data.title or "Untitled Document",
        "content_json": data.content_json if data.content_json is not None else {},
        "content_text": data.content_text or "",
        "created_at": now,
        "updated_at": now,
    }

    result = await database.documents_collection.insert_one(doc_dict)
    doc_id = str(result.inserted_id)
    doc_dict["_id"] = result.inserted_id

    # Index in background if content_text is provided
    if data.content_text and data.content_text.strip():
        background_tasks.add_task(
            process_document_content,
            user_id=current_user["id"],
            document_id=doc_id,
            title=doc_dict["title"],
            content_text=data.content_text,
            workspace_id=target_ws,
        )

    return _doc_to_response(doc_dict)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    search: Optional[str] = Query(None),
    workspace_id: Optional[str] = Query(None),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """List documents for a shared workspace (all members see same)."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    if target_ws:
        await get_workspace_with_access(target_ws, current_user["id"])
        filter_query: dict = {"workspace_id": target_ws}
    else:
        filter_query = {"user_id": current_user["id"]}

    if search and search.strip():
        import re
        filter_query["title"] = {"$regex": re.escape(search.strip()), "$options": "i"}

    cursor = database.documents_collection.find(filter_query).sort("updated_at", -1)
    documents = []
    async for doc in cursor:
        documents.append(_doc_to_response(doc))

    return DocumentListResponse(documents=documents, total=len(documents))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get single document by ID (shared room)."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.get("workspace_id"):
        await get_workspace_with_access(doc["workspace_id"], current_user["id"])
    elif str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return _doc_to_response(doc)


@router.put("/{document_id}", response_model=DocumentResponse)
@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    data: DocumentUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Update document (owner+editor)."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.get("workspace_id"):
        _ws, _role = await get_workspace_with_access(doc["workspace_id"], current_user["id"])
        require_role(_role, ("owner", "editor"), "Viewers cannot edit documents")
    elif str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    now = datetime.now(timezone.utc)
    updates: dict = {"updated_at": now}

    if data.title is not None:
        updates["title"] = data.title
    if data.content_json is not None:
        updates["content_json"] = data.content_json
    if data.content_text is not None:
        updates["content_text"] = data.content_text

    await database.documents_collection.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": updates},
    )

    doc.update(updates)

    # Re-index to Qdrant in background if content_text or title was updated
    new_text = updates.get("content_text", doc.get("content_text", ""))
    new_title = updates.get("title", doc.get("title", "Untitled Document"))
    ws_id = doc.get("workspace_id")

    background_tasks.add_task(
        process_document_content,
        user_id=current_user["id"],
        document_id=document_id,
        title=new_title,
        content_text=new_text,
        workspace_id=ws_id,
    )

    return _doc_to_response(doc)


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a document (owner any, editor own uploads). Vectors purged workspace-wide."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.get("workspace_id"):
        _ws, _role = await get_workspace_with_access(doc["workspace_id"], current_user["id"])
        is_own = str(doc.get("user_id")) == current_user["id"]
        if _role == "owner":
            pass
        elif _role == "editor" and is_own:
            pass
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner or creator can delete")
    elif str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await database.documents_collection.delete_one({"_id": ObjectId(document_id)})

    # Purge vectors from Qdrant
    try:
        vs.delete_source_vectors(user_id=current_user["id"], source_id=document_id)
    except Exception as e:
        print(f"Warning: Failed to purge vectors for document {document_id}: {e}")

    return {"message": "Document deleted successfully", "id": document_id}


@router.post("/{document_id}/index")
async def reindex_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Explicitly trigger re-indexing (shared room, editor+)."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.get("workspace_id"):
        _ws, _role = await get_workspace_with_access(doc["workspace_id"], current_user["id"])
        require_role(_role, ("owner", "editor"), "Viewers cannot reindex")
    elif str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    background_tasks.add_task(
        process_document_content,
        user_id=current_user["id"],
        document_id=document_id,
        title=doc.get("title", "Untitled Document"),
        content_text=doc.get("content_text", ""),
        workspace_id=doc.get("workspace_id"),
    )

    return {"message": "Document indexing initiated", "id": document_id}


_ALLOWED_PRESETS = ("improve", "proofread", "explain")


def _build_refactor_prompt(selected_text: str, instruction: str, preset: Optional[str]) -> str:
    clean_preset = (preset or "").strip().lower()
    if clean_preset == "explain":
        return (
            "Explain the following text in 1-3 short sentences. "
            "Be clear and simple. Return only the explanation, no quotes.\n\n"
            f'Text: "{selected_text}"'
        )
    if clean_preset == "improve":
        return (
            "Improve the writing of the following text. Keep the same meaning. "
            "Return only the improved text, no quotes, no explanation.\n\n"
            f'Text: "{selected_text}"\nInstruction: {instruction}'
        )
    if clean_preset == "proofread":
        return (
            "Fix spelling and grammar in the following text. Keep the same meaning. "
            "Return only the corrected text, no quotes, no explanation.\n\n"
            f'Text: "{selected_text}"\nInstruction: {instruction}'
        )
    return (
        "Rewrite the following text exactly as instructed. "
        "Return only the rewritten text, no quotes, no explanation.\n\n"
        f'Text: "{selected_text}"\nInstruction: {instruction}'
    )


def _clean_llm_text(text: str, fallback: str) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        return fallback
    # Strip markdown code fences if the model wraps the answer.
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        # Drop opening fence and optional language tag line.
        if len(lines) >= 2:
            cleaned = "\n".join(lines[1:])
        if cleaned.rstrip().endswith("```"):
            cleaned = cleaned.rstrip()[: -3]
        cleaned = cleaned.strip()
    # Strip a single surrounding quote pair.
    if len(cleaned) >= 2 and (
        (cleaned.startswith('"') and cleaned.endswith('"'))
        or (cleaned.startswith("'") and cleaned.endswith("'"))
    ):
        cleaned = cleaned[1:-1].strip()
    return cleaned or fallback


@router.post("/{document_id}/ai-refactor", response_model=AiRefactorResponse)
async def ai_refactor_document(
    document_id: str,
    data: AiRefactorRequest,
    current_user: dict = Depends(get_current_user),
):
    """Rewrite or explain selected text without saving. Preview only."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    selected = (data.selected_text or "").strip()
    instruction = (data.instruction or "").strip()
    preset = (data.preset or "").strip().lower() or None
    if not selected:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected text is empty")
    if not instruction:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instruction is empty")
    if preset and preset not in _ALLOWED_PRESETS:
        preset = None

    doc = await database.documents_collection.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.get("workspace_id"):
        _ws, _role = await get_workspace_with_access(doc["workspace_id"], current_user["id"])
        require_role(_role, ("owner", "editor"), "Viewers cannot use AI refactor")
    elif str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    prompt = _build_refactor_prompt(selected, instruction, preset)
    try:
        raw = await generate_response(prompt)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI refactor failed: {exc}",
        )

    rewritten = _clean_llm_text(str(raw), fallback=selected)
    return AiRefactorResponse(original=selected, rewritten=rewritten, preset=preset)


def _build_draft_prompt(prompt: str, excerpt: Optional[str]) -> str:
    base = (
        "You are writing directly into a Notion-style document editor. "
        "Write the requested content as structured Markdown with proper "
        "headings (##), short paragraphs, and bullet lists where helpful. "
        "Return ONLY the document markdown: no code fences, no quotes, "
        "no preamble like 'Here is your article'."
    )
    if excerpt and excerpt.strip():
        base += (
            "\n\nCurrent document excerpt for tone context "
            "(do not repeat it verbatim unless asked):\n"
            f"{excerpt.strip()[:2000]}"
        )
    return base + f"\n\nRequest: {prompt.strip()}"


@router.post("/{document_id}/ai-draft", response_model=AiDraftResponse)
async def ai_draft_document(
    document_id: str,
    data: AiDraftRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a full-document draft as Markdown without saving. Preview only.

    Nothing is written to MongoDB or Qdrant here by design: the frontend
    reveals the draft progressively and only a user-confirmed Keep triggers
    the normal PUT save path (which then indexes once via the existing flow).
    """
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    prompt = (data.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prompt is empty")
    mode = data.mode or "append"

    doc = await database.documents_collection.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.get("workspace_id"):
        _ws, _role = await get_workspace_with_access(doc["workspace_id"], current_user["id"])
        require_role(_role, ("owner", "editor"), "Viewers cannot use AI draft")
    elif str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    llm_prompt = _build_draft_prompt(prompt, data.existing_excerpt)
    try:
        raw = await generate_response(llm_prompt)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI draft failed: {exc}",
        )

    markdown = _clean_llm_text(str(raw), fallback="")
    if not markdown.strip():
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI returned an empty draft")

    return AiDraftResponse(markdown=markdown, mode=mode)
