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
)
from app.middleware.auth_middleware import get_current_user
from app.services.rag_service import process_document_content
from app.services import vector_store as vs

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
    """List documents for the active or specified workspace, with optional title search."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    filter_query: dict = {"user_id": current_user["id"]}
    if target_ws:
        filter_query["workspace_id"] = target_ws

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
    """Get single document by ID."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
        "user_id": current_user["id"],
    })
    if not doc:
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
    """Update document title, content_json, and/or content_text with auto-indexing."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
        "user_id": current_user["id"],
    })
    if not doc:
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
    """Delete a document from MongoDB and purge its vector chunks from Qdrant."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
        "user_id": current_user["id"],
    })
    if not doc:
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
    """Explicitly trigger re-indexing of a Studio document to Qdrant."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")

    doc = await database.documents_collection.find_one({
        "_id": ObjectId(document_id),
        "user_id": current_user["id"],
    })
    if not doc:
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
