import os
import asyncio
from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import get_settings
from app.services import vector_store as vs
from app.services.llm_service import stream_response
import app.database as database
from bson import ObjectId
from typing import AsyncGenerator

settings = get_settings()

NO_DOCUMENTS_MESSAGE = (
    "I don't have any documents to reference. Please upload some PDFs first, "
    "then ask me questions about them."
)

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

SYSTEM_PROMPT = """You are a helpful research assistant. Answer the user's question 
based ONLY on the provided context from their uploaded documents. 
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


async def process_pdf(user_id: str, source_id: str, file_path: str):
    """
    Full PDF processing pipeline: load → chunk → embed → store.
    Updates source status in MongoDB as it progresses.
    Runs in a background thread since PDF loading and embedding are CPU-bound.
    """
    try:
        # Run CPU-bound work in a thread
        chunks, page_count = await asyncio.to_thread(_load_and_chunk_pdf, file_path)

        # Store embeddings in vector store (also CPU-bound)
        chunk_count = await asyncio.to_thread(vs.add_documents, user_id, chunks, source_id)

        # Update source status to ready
        await database.sources_collection.update_one(
            {"_id": ObjectId(source_id)},
            {"$set": {
                "status": "ready",
                "page_count": page_count,
                "chunk_count": chunk_count,
            }}
        )
        print(f"[OK] Processed PDF: {file_path} -> {page_count} pages, {chunk_count} chunks")

    except Exception as e:
        # Update source status to error
        await database.sources_collection.update_one(
            {"_id": ObjectId(source_id)},
            {"$set": {"status": "error"}}
        )
        print(f"[ERR] Error processing PDF {file_path}: {e}")
        raise


async def _resolve_citations(user_id: str, results: list[dict]) -> list[dict]:
    """Resolve source_id metadata into citation objects with filenames."""
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

        source = await database.sources_collection.find_one({
            "_id": ObjectId(source_id),
            "user_id": user_id,
        })
        filename = source["filename"] if source else "Unknown source"
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


async def retrieve_for_query(
    user_id: str,
    query: str,
    top_k: int = 5,
) -> tuple[str | None, list[dict]]:
    """
    Retrieve relevant chunks and build context + citations for a query.
    Returns (context_string, citations). context is None when no documents exist.
    """
    results = await asyncio.to_thread(vs.query_documents, user_id, query, top_k)

    if not results:
        return None, []

    context = "\n\n---\n\n".join([doc["document"] for doc in results])
    citations = await _resolve_citations(user_id, results)
    return context, citations


async def ask_question(
    user_id: str,
    query: str,
    model: str = "gemini",
    context: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Full RAG pipeline: retrieve relevant chunks → build prompt → stream LLM response.
    Yields tokens as they come for SSE streaming.
    If context is provided, skips retrieval (used when route already retrieved).
    """
    if context is None:
        context, _ = await retrieve_for_query(user_id, query)

    if not context:
        yield NO_DOCUMENTS_MESSAGE
        return

    prompt = SYSTEM_PROMPT.format(context=context, query=query)

    async for token in stream_response(prompt, model):
        yield token
