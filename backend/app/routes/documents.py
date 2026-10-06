from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
import hashlib

from app.models.document import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentListResponse
from app.routes.workspaces import get_workspace_or_404
from app.database import documents_collection
from app.services.vector_store import add_documents, delete_source_vectors
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LangchainDocument
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/workspaces/{workspace_id}/documents", tags=["Documents"])

def _chunk_text(text: str) -> list[LangchainDocument]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    return text_splitter.create_documents([text])

async def index_document(user_id: str, workspace_id: str, document_id: str, plain_text: str):
    """Chunk and embed document text, store in Qdrant with source_type=document."""
    chunks = _chunk_text(plain_text)
    
    # Delete old vectors first
    await delete_source_vectors(user_id, workspace_id, document_id)
    
    # Add new vectors
    add_documents(user_id, workspace_id, chunks, document_id, "document")
    # The payload in add_documents will contain source_id = document_id. We also need to add source_type.
    # Wait, add_documents doesn't take source_type. I'll modify add_documents to take source_type.


@router.post("", response_model=DocumentResponse)
async def create_document(
    background_tasks: BackgroundTasks,
    doc_in: DocumentCreate, 
    workspace: dict = Depends(get_workspace_or_404)
):
    now = datetime.now(timezone.utc)
    doc_dict = {
        "workspace_id": str(workspace["_id"]),
        "user_id": str(workspace["user_id"]),
        "title": doc_in.title,
        "content": doc_in.content,
        "plain_text": doc_in.plain_text,
        "content_hash": hashlib.sha256(doc_in.plain_text.encode()).hexdigest(),
        "created_at": now,
        "updated_at": now,
    }
    
    result = await documents_collection.insert_one(doc_dict)
    doc_id = str(result.inserted_id)
    doc_dict["id"] = doc_id
    
    background_tasks.add_task(index_document, str(workspace["user_id"]), str(workspace["_id"]), doc_id, doc_in.plain_text)
    
    return DocumentResponse(**doc_dict)


@router.get("", response_model=DocumentListResponse)
async def list_documents(workspace: dict = Depends(get_workspace_or_404)):
    cursor = documents_collection.find({"workspace_id": str(workspace["_id"])}).sort("updated_at", -1)
    documents = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        documents.append(DocumentResponse(**doc))
    return DocumentListResponse(documents=documents, total=len(documents))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, workspace: dict = Depends(get_workspace_or_404)):
    doc = await documents_collection.find_one({
        "_id": ObjectId(document_id),
        "workspace_id": str(workspace["_id"])
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    doc["id"] = str(doc["_id"])
    return DocumentResponse(**doc)


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    doc_in: DocumentUpdate,
    background_tasks: BackgroundTasks,
    workspace: dict = Depends(get_workspace_or_404)
):
    doc = await documents_collection.find_one({
        "_id": ObjectId(document_id),
        "workspace_id": str(workspace["_id"])
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    update_data = {"updated_at": datetime.now(timezone.utc)}
    if doc_in.title is not None:
        update_data["title"] = doc_in.title
    if doc_in.content is not None:
        update_data["content"] = doc_in.content
    
    needs_reindex = False
    if doc_in.plain_text is not None:
        new_hash = hashlib.sha256(doc_in.plain_text.encode()).hexdigest()
        if new_hash != doc.get("content_hash"):
            update_data["plain_text"] = doc_in.plain_text
            update_data["content_hash"] = new_hash
            needs_reindex = True
            
    await documents_collection.update_one({"_id": ObjectId(document_id)}, {"$set": update_data})
    
    doc.update(update_data)
    doc["id"] = str(doc["_id"])
    
    if needs_reindex:
        background_tasks.add_task(index_document, str(workspace["user_id"]), str(workspace["_id"]), document_id, doc_in.plain_text)
        
    return DocumentResponse(**doc)


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    workspace: dict = Depends(get_workspace_or_404)
):
    doc = await documents_collection.find_one({
        "_id": ObjectId(document_id),
        "workspace_id": str(workspace["_id"])
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    await documents_collection.delete_one({"_id": ObjectId(document_id)})
    
    background_tasks.add_task(delete_source_vectors, str(workspace["user_id"]), str(workspace["_id"]), document_id)
    
    return {"status": "deleted"}
