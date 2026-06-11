import os
import asyncio
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, status
from datetime import datetime, timezone
from bson import ObjectId
import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.models.source import SourceResponse, SourceListResponse
from app.middleware.auth_middleware import get_current_user
from app.services.rag_service import process_pdf, UPLOADS_DIR
from app.services import vector_store as vs
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/sources", tags=["Sources"])


@router.get("", response_model=SourceListResponse)
async def list_sources(current_user: dict = Depends(get_current_user)):
    """List all uploaded PDF sources for the current user."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    cursor = database.sources_collection.find({"user_id": current_user["id"]}).sort("uploaded_at", -1)
    sources = []
    async for doc in cursor:
        sources.append(SourceResponse(
            id=str(doc["_id"]),
            filename=doc["filename"],
            file_size=doc["file_size"],
            page_count=doc.get("page_count", 0),
            chunk_count=doc.get("chunk_count", 0),
            status=doc["status"],
            uploaded_at=doc["uploaded_at"],
        ))

    return SourceListResponse(sources=sources, total=len(sources))


@router.post("/upload", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a PDF file. The file is saved to disk and a background task
    processes it through the RAG pipeline (chunk → embed → store).
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    # Validate file size
    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )

    # Create user-specific upload directory
    user_upload_dir = os.path.join(UPLOADS_DIR, current_user["id"])
    os.makedirs(user_upload_dir, exist_ok=True)

    # Save file with unique name to avoid collisions
    safe_filename = f"{ObjectId()}_{file.filename}"
    file_path = os.path.join(user_upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Create source record in MongoDB with "processing" status
    source_doc = {
        "user_id": current_user["id"],
        "filename": file.filename,
        "file_path": file_path,
        "file_size": len(content),
        "page_count": 0,
        "chunk_count": 0,
        "status": "processing",
        "uploaded_at": datetime.now(timezone.utc),
    }

    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    result = await database.sources_collection.insert_one(source_doc)
    source_id = str(result.inserted_id)

    # Process PDF in the background (non-blocking)
    background_tasks.add_task(process_pdf, current_user["id"], source_id, file_path)

    return SourceResponse(
        id=source_id,
        filename=file.filename,
        file_size=len(content),
        page_count=0,
        chunk_count=0,
        status="processing",
        uploaded_at=source_doc["uploaded_at"],
    )


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(source_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific source's details (useful for polling processing status)."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    source = await database.sources_collection.find_one({
        "_id": ObjectId(source_id),
        "user_id": current_user["id"],
    })

    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    return SourceResponse(
        id=str(source["_id"]),
        filename=source["filename"],
        file_size=source["file_size"],
        page_count=source.get("page_count", 0),
        chunk_count=source.get("chunk_count", 0),
        status=source["status"],
        uploaded_at=source["uploaded_at"],
    )


@router.delete("/{source_id}", status_code=status.HTTP_200_OK)
async def delete_source(source_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a source: remove vectors from ChromaDB, file from disk, and record from MongoDB."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    source = await database.sources_collection.find_one({
        "_id": ObjectId(source_id),
        "user_id": current_user["id"],
    })

    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    # Delete vectors from ChromaDB
    deleted_vectors = await asyncio.to_thread(
        vs.delete_source_vectors, current_user["id"], source_id
    )

    # Delete file from disk
    if os.path.exists(source["file_path"]):
        os.remove(source["file_path"])

    # Delete from MongoDB
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    await database.sources_collection.delete_one({"_id": ObjectId(source_id)})

    return {"message": "Source deleted", "vectors_removed": deleted_vectors}
