import os
import asyncio
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, Header, Query, status
from fastapi.responses import FileResponse, RedirectResponse
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.models.source import SourceResponse, SourceListResponse
from app.middleware.auth_middleware import get_current_user
from app.services.workspace_access import get_workspace_with_access, require_role
from app.services.rag_service import process_pdf, UPLOADS_DIR
from app.services import vector_store as vs
from app.services import storage as storage_svc
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/sources", tags=["Sources"])


@router.get("", response_model=SourceListResponse)
async def list_sources(
    workspace_id: Optional[str] = Query(None),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """List shared sources for a workspace (all members see same corpus)."""
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

    cursor = database.sources_collection.find(filter_query).sort("uploaded_at", -1)
    sources = []
    async for doc in cursor:
        uploaded_at = doc.get("uploaded_at")
        if uploaded_at and uploaded_at.tzinfo is None:
            uploaded_at = uploaded_at.replace(tzinfo=timezone.utc)
        last_synced = doc.get("last_synced_at")
        if last_synced and getattr(last_synced, "tzinfo", None) is None:
            last_synced = last_synced.replace(tzinfo=timezone.utc)
        source_type = doc.get("source_type")
        if not source_type or source_type == "pdf":
            fn = doc.get("filename", "").lower()
            if fn.startswith("[github]") or "github.com" in fn:
                source_type = "github"
            elif fn.startswith("[drive]") or fn.startswith("[google drive]") or fn.startswith("[googledrive]"):
                source_type = "drive"
            elif fn.startswith("[notion]"):
                source_type = "notion"
            elif fn.startswith("[slack]"):
                source_type = "slack"
            else:
                source_type = doc.get("source_type", "pdf")

        sources.append(SourceResponse(
            id=str(doc["_id"]),
            workspace_id=doc.get("workspace_id"),
            filename=doc["filename"],
            file_size=doc["file_size"],
            page_count=doc.get("page_count", 0),
            chunk_count=doc.get("chunk_count", 0),
            status=doc["status"],
            uploaded_at=uploaded_at,
            source_type=source_type,
            remote_id=doc.get("remote_id"),
            remote_url=doc.get("remote_url"),
            last_synced_at=last_synced,
            sync_error=doc.get("sync_error"),
        ))

    return SourceListResponse(sources=sources, total=len(sources))


@router.post("/upload", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    workspace_id: Optional[str] = Query(None),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a PDF file. Scoped to the current user's active workspace.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )

    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    if target_ws:
        _ws, _role = await get_workspace_with_access(target_ws, current_user["id"])
        require_role(_role, ("owner", "editor"), "Viewers cannot upload. Ask the owner for editor access.")

    # Pre-generate source_id so the R2 key is stable before Mongo insert.
    source_id = str(ObjectId())
    r2_key: Optional[str] = None
    storage_mode = "local"
    file_path: Optional[str] = None

    if storage_svc.is_r2_enabled():
        try:
            candidate = storage_svc.build_r2_key(current_user["id"], source_id, file.filename or "file.pdf")
            storage_svc.upload_pdf_bytes(content, candidate)
            r2_key = candidate
            storage_mode = "r2"
        except Exception as e:
            print(f"[WARN] R2 upload failed, falling back to local disk: {e}")
            r2_key = None
            storage_mode = "local"

    if storage_mode == "local":
        user_upload_dir = os.path.join(UPLOADS_DIR, current_user["id"])
        os.makedirs(user_upload_dir, exist_ok=True)

        safe_filename = f"{source_id}_{file.filename}"
        file_path = os.path.join(user_upload_dir, safe_filename)

        with open(file_path, "wb") as f:
            f.write(content)

    source_doc = {
        "user_id": current_user["id"],
        "workspace_id": target_ws,
        "source_type": "pdf",
        "filename": file.filename,
        "file_path": file_path,
        "r2_key": r2_key,
        "storage": storage_mode,
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
    result = await database.sources_collection.insert_one(
        {**source_doc, "_id": ObjectId(source_id)}
    )
    source_id = str(result.inserted_id)

    background_tasks.add_task(
        process_pdf,
        current_user["id"],
        source_id,
        file_path or r2_key or "",
        target_ws,
        r2_key,
    )

    return SourceResponse(
        id=source_id,
        workspace_id=target_ws,
        filename=file.filename,
        file_size=len(content),
        page_count=0,
        chunk_count=0,
        status="processing",
        uploaded_at=source_doc["uploaded_at"],
        source_type="pdf",
    )


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(source_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific source's details (shared room)."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(source_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source ID")

    source = await database.sources_collection.find_one({
        "_id": ObjectId(source_id),
    })

    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    if source.get("workspace_id"):
        await get_workspace_with_access(source["workspace_id"], current_user["id"])
    elif str(source.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    uploaded_at = source.get("uploaded_at")
    if uploaded_at and uploaded_at.tzinfo is None:
        uploaded_at = uploaded_at.replace(tzinfo=timezone.utc)

    last_synced = source.get("last_synced_at")
    if last_synced and getattr(last_synced, "tzinfo", None) is None:
        last_synced = last_synced.replace(tzinfo=timezone.utc)

    return SourceResponse(
        id=str(source["_id"]),
        workspace_id=source.get("workspace_id"),
        filename=source["filename"],
        file_size=source["file_size"],
        page_count=source.get("page_count", 0),
        chunk_count=source.get("chunk_count", 0),
        status=source["status"],
        uploaded_at=uploaded_at,
        source_type=source.get("source_type", "pdf"),
        remote_id=source.get("remote_id"),
        remote_url=source.get("remote_url"),
        last_synced_at=last_synced,
        sync_error=source.get("sync_error"),
    )


@router.get("/{source_id}/download")
async def download_source(source_id: str, current_user: dict = Depends(get_current_user)):
    """Download a source PDF file (shared room). R2 first, local fallback."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(source_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source ID")

    source = await database.sources_collection.find_one({
        "_id": ObjectId(source_id),
    })

    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    if source.get("workspace_id"):
        await get_workspace_with_access(source["workspace_id"], current_user["id"])
    elif str(source.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    r2_key = source.get("r2_key")
    if r2_key and source.get("storage") == "r2":
        url = storage_svc.get_presigned_download_url(r2_key, source.get("filename", "document.pdf"))
        if url:
            return RedirectResponse(url=url, status_code=302)

    file_path = source.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")

    return FileResponse(
        path=file_path,
        filename=source.get("filename", "document.pdf"),
        media_type="application/pdf",
    )


@router.delete("/{source_id}", status_code=status.HTTP_200_OK)
async def delete_source(source_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a source: owner can delete any, editor only own uploads, viewer none."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")

    if not ObjectId.is_valid(source_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source ID")

    source = await database.sources_collection.find_one({
        "_id": ObjectId(source_id),
    })

    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    ws_id = source.get("workspace_id")
    if ws_id:
        _ws, _role = await get_workspace_with_access(ws_id, current_user["id"])
        is_uploader = str(source.get("user_id")) == current_user["id"]
        if _role == "owner":
            pass
        elif _role == "editor" and is_uploader:
            pass
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner or uploader can delete")
    elif str(source.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    deleted_vectors = await asyncio.to_thread(
        vs.delete_source_vectors, current_user["id"], source_id
    )

    if source.get("r2_key"):
        storage_svc.delete_pdf(source.get("r2_key"))

    if source.get("file_path") and os.path.exists(source["file_path"]):
        try:
            os.remove(source["file_path"])
        except Exception:
            pass

    await database.sources_collection.delete_one({"_id": ObjectId(source_id)})

    return {"message": "Source deleted", "vectors_removed": deleted_vectors}
