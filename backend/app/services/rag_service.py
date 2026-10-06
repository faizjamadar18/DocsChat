import os
import asyncio
from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import get_settings
from app.services import vector_store as vs
from app.services.llm_service import stream_response
import app.database as database
from bson import ObjectId
from typing import AsyncGenerator, Optional

settings = get_settings()

NO_DOCUMENTS_MESSAGE = (
    "I don't have any documents to reference in this workspace. Please upload some PDFs or create documents in Studio first, "
    "then ask me questions about them."
)

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

SYSTEM_PROMPT = """You are a helpful research assistant. Answer the user's question 
based ONLY on the provided context from their uploaded documents and workspace notes. 
If the context doesn't contain enough information to answer, say so clearly.
Do not make up information or use knowledge outside the provided context.
Provide clear, well-structured answers with proper formatting.

Context from documents:
{context}

User's question: {query}"""


def _load_and_chunk_pdf(file_path: str) -> tuple[list, int]:
    """
    Load a PDF and split it into chunks.
    Returns (chunks, page_count).
    """
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    page_count = len(pages)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = text_splitter.split_documents(pages)

    return chunks, page_count


async def process_pdf(
    user_id: str,
    source_id: str,
    file_path: str,
    workspace_id: Optional[str] = None,
):
    """
    Full PDF processing pipeline: load → chunk → embed → store.
    Updates source status in MongoDB as it progresses.
    Tags vectors with workspace_id in Qdrant.
    """
    try:
        chunks, page_count = await asyncio.to_thread(_load_and_chunk_pdf, file_path)

        chunk_count = await asyncio.to_thread(
            vs.add_documents,
            user_id,
            chunks,
            source_id,
            workspace_id,
        )

        update_fields = {
            "status": "ready",
            "page_count": page_count,
            "chunk_count": chunk_count,
        }
        if workspace_id:
            update_fields["workspace_id"] = workspace_id

        await database.sources_collection.update_one(
            {"_id": ObjectId(source_id)},
            {"$set": update_fields}
        )
        print(f"[OK] Processed PDF: {file_path} -> {page_count} pages, {chunk_count} chunks")

    except Exception as e:
        await database.sources_collection.update_one(
            {"_id": ObjectId(source_id)},
            {"$set": {"status": "error"}}
        )
        print(f"[ERR] Error processing PDF {file_path}: {e}")
        raise


async def _resolve_citations(
    user_id: str,
    results: list[dict],
    workspace_id: Optional[str] = None,
) -> list[dict]:
    """Resolve source_id metadata into citation objects with filenames/titles."""
    seen: set[tuple[str, int | None]] = set()
    citations: list[dict] = []

    for doc in results:
        metadata = doc.get("metadata", {})
        source_id = metadata.get("source_id")
        if not source_id:
            continue

        page = metadata.get("page")
        page_num = int(page) + 1 if isinstance(page, int) else None
        dedupe_key = (source_id, page_num)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)

        filename = "Unknown source"
        if ObjectId.is_valid(source_id) and database.sources_collection is not None:
            source = await database.sources_collection.find_one({"_id": ObjectId(source_id)})
            if source:
                filename = source.get("filename", "Unknown source")
            elif database.documents_collection is not None:
                studio_doc = await database.documents_collection.find_one({"_id": ObjectId(source_id)})
                if studio_doc:
                    filename = studio_doc.get("title", "Untitled Document")

        snippet = doc["document"][:200].strip()
        if len(doc["document"]) > 200:
            snippet += "..."

        citations.append({
            "source_id": source_id,
            "filename": filename,
            "page": page_num,
            "snippet": snippet,
            "similarity_score": round(doc.get("similarity_score", 0), 3),
        })

    return citations


async def retrieve_workspace_knowledge(
    user_id: str,
    workspace_id: str,
    query: str,
    scope_ids: list[str] | None = None,
    top_k: int = 5,
) -> tuple[str | None, list[dict]]:
    """
    Unified retrieval logic shared by both Text Agent and Voice Agent.
    Strictly isolates by user_id and workspace_id.
    Filters by scope_ids if @-mentions were provided.
    """
    results = await asyncio.to_thread(
        vs.query_workspace_documents,
        user_id=user_id,
        workspace_id=workspace_id,
        query=query,
        scope_ids=scope_ids,
        top_k=top_k,
    )
    if not results:
        return None, []

    context = "\n\n---\n\n".join([doc["document"] for doc in results])
    citations = await _resolve_citations(user_id, results, workspace_id)
    return context, citations


async def retrieve_for_query(
    user_id: str,
    query: str,
    top_k: int = 5,
    workspace_id: Optional[str] = None,
    scope_ids: list[str] | None = None,
) -> tuple[str | None, list[dict]]:
    """
    Retrieve relevant chunks and build context + citations for a query.
    If workspace_id is provided, delegates to retrieve_workspace_knowledge.
    """
    if workspace_id:
        return await retrieve_workspace_knowledge(
            user_id=user_id,
            workspace_id=workspace_id,
            query=query,
            scope_ids=scope_ids,
            top_k=top_k,
        )

    results = await asyncio.to_thread(vs.query_documents, user_id, query, top_k)
    if not results:
        return None, []

    context = "\n\n---\n\n".join([doc["document"] for doc in results])
    citations = await _resolve_citations(user_id, results)
    return context, citations


async def ask_question(
    user_id: str,
    query: str,
    model: str = "groq",
    context: str | None = None,
    workspace_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Full RAG pipeline: retrieve relevant chunks → build prompt → stream LLM response using Groq.
    Yields tokens as they come for SSE streaming.
    """
    if context is None:
        context, _ = await retrieve_for_query(user_id, query, workspace_id=workspace_id)

    if not context:
        yield NO_DOCUMENTS_MESSAGE
        return

    prompt = SYSTEM_PROMPT.format(context=context, query=query)

    async for token in stream_response(prompt, model="groq"):
        yield token
