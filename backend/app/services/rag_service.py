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

SYSTEM_PROMPT = """You are Ora, an intelligent workspace AI assistant.
Answer the user's question clearly, accurately, and helpfully based on the workspace catalog and document context provided below.

Guidelines:
1. WORKSPACE INVENTORY & CATALOG QUESTIONS:
   If the user asks questions about what documents, assets, or files exist in the workspace, their count, total numbers, or list of names (e.g. "How many assets and docs do I have?", "List my files", "What documents are in my workspace?"), answer directly and accurately using the Workspace Inventory Catalog.
2. CONTENT QUESTIONS:
   If the user asks about specific information, skills, project details, or facts inside documents, answer based on the Context from documents provided below.
3. CONVERSATIONAL & HELP:
   If the user greets you or asks general workspace questions, be polite, professional, and clear.

Workspace Inventory Catalog:
{workspace_catalog}

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


async def get_workspace_catalog(user_id: str, workspace_id: Optional[str] = None) -> tuple[str, int, int]:
    """
    Fetch the catalog/manifest of all documents and uploaded assets in the workspace.
    Returns (formatted_summary_str, doc_count, asset_count).
    """
    if database.documents_collection is None or database.sources_collection is None:
        return "Workspace catalog is currently unavailable.", 0, 0

    doc_filter: dict = {"user_id": user_id}
    source_filter: dict = {"user_id": user_id, "status": "ready"}
    if workspace_id:
        doc_filter["workspace_id"] = workspace_id
        source_filter["workspace_id"] = workspace_id

    # Fetch Studio documents
    doc_titles = []
    try:
        doc_cursor = database.documents_collection.find(doc_filter, {"title": 1})
        async for d in doc_cursor:
            title = d.get("title") or "Untitled Document"
            doc_titles.append(title)
    except Exception:
        pass

    # Fetch Uploaded Assets (sources)
    asset_names = []
    try:
        source_cursor = database.sources_collection.find(source_filter, {"filename": 1, "page_count": 1})
        async for s in source_cursor:
            name = s.get("filename") or "Untitled Asset"
            pages = s.get("page_count")
            if pages:
                asset_names.append(f"{name} ({pages} pages)")
            else:
                asset_names.append(name)
    except Exception:
        pass

    doc_count = len(doc_titles)
    asset_count = len(asset_names)

    catalog_lines = [
        f"- Studio Documents ({doc_count} total): {', '.join(doc_titles) if doc_titles else 'None'}",
        f"- Uploaded Assets ({asset_count} total): {', '.join(asset_names) if asset_names else 'None'}",
    ]
    catalog_summary = "\n".join(catalog_lines)
    return catalog_summary, doc_count, asset_count


async def ask_question(
    user_id: str,
    query: str,
    model: str = "groq",
    context: str | None = None,
    workspace_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Full RAG pipeline: retrieve relevant chunks → build prompt with workspace catalog → stream LLM response using Groq.
    Yields tokens as they come for SSE streaming.
    """
    catalog_summary, doc_count, asset_count = await get_workspace_catalog(user_id, workspace_id)

    if context is None:
        context, _ = await retrieve_for_query(user_id, query, workspace_id=workspace_id)

    # Only show NO_DOCUMENTS_MESSAGE if there are truly no documents/assets AND no context
    if not context and (doc_count == 0 and asset_count == 0):
        yield NO_DOCUMENTS_MESSAGE
        return

    effective_context = context if context else "No specific document text chunks matched this search query."
    prompt = SYSTEM_PROMPT.format(
        workspace_catalog=catalog_summary,
        context=effective_context,
        query=query,
    )

    async for token in stream_response(prompt, model="groq"):
        yield token


async def process_document_content(
    user_id: str,
    document_id: str,
    title: str,
    content_text: str,
    workspace_id: Optional[str] = None,
) -> int:
    """
    Split studio document text into chunks and index into Qdrant.
    Replaces existing vectors for this document_id.
    """
    try:
        # First delete existing vectors for this document
        await asyncio.to_thread(vs.delete_source_vectors, user_id, document_id)
        if not content_text or not content_text.strip():
            return 0

        from langchain_core.documents import Document
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
        texts = text_splitter.split_text(content_text)
        chunks = [
            Document(
                page_content=t,
                metadata={
                    "source_id": document_id,
                    "source_type": "document",
                    "title": title,
                }
            )
            for t in texts
        ]
        chunk_count = await asyncio.to_thread(
            vs.add_documents,
            user_id,
            chunks,
            document_id,
            workspace_id,
        )
        print(f"[OK] Indexed Studio doc {title} ({document_id}) -> {chunk_count} chunks in Qdrant")
        return chunk_count
    except Exception as e:
        print(f"[ERR] Error indexing document {document_id}: {e}")
        return 0
