import os
import logging
import chromadb
import uuid
from app.config import get_settings
from app.services.embedding_service import generate_embeddings, generate_single_embedding

logger = logging.getLogger(__name__)

settings = get_settings()

if settings.CHROMA_PERSISTENT:
    _VECTOR_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "vector_data")
    os.makedirs(_VECTOR_DATA_DIR, exist_ok=True)
    _chroma_client = chromadb.PersistentClient(path=_VECTOR_DATA_DIR)
    logger.info("ChromaDB: persistent mode (%s)", _VECTOR_DATA_DIR)
else:
    _chroma_client = chromadb.Client()
    logger.info("ChromaDB: in-memory mode (data lost on restart)")


def _get_collection_name(user_id: str) -> str:
    """Each user gets their own ChromaDB collection for data isolation."""
    return f"user_{user_id}"


def get_or_create_collection(user_id: str):
    """Get or create a ChromaDB collection for a user."""
    collection_name = _get_collection_name(user_id)
    collection = _chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"description": f"Vector store for user {user_id}"}
    )
    return collection


def add_documents(user_id: str, chunks: list, source_id: str):
    """
    Add document chunks to a user's vector store.

    Args:
        user_id: The user who owns this data
        chunks: List of LangChain Document objects (with page_content and metadata)
        source_id: The source (PDF) ID for filtering/deletion later
    """
    collection = get_or_create_collection(user_id)

    ids = []
    documents = []
    metadatas = []
    embeddings_list = []

    # Extract texts for batch embedding
    texts = [chunk.page_content for chunk in chunks]

    # Generate all embeddings in one batch (much faster than one-by-one)
    embeddings = generate_embeddings(texts)

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        doc_id = f"chunk_{uuid.uuid4()}"
        ids.append(doc_id)
        documents.append(chunk.page_content)

        # Store metadata with source_id for targeted deletion
        metadata = {}
        if hasattr(chunk, "metadata") and chunk.metadata:
            # Only keep serializable metadata fields
            for key, value in chunk.metadata.items():
                if isinstance(value, (str, int, float, bool)):
                    metadata[key] = value
        metadata["source_id"] = source_id
        metadata["chunk_index"] = i
        metadatas.append(metadata)

        embeddings_list.append(embedding.tolist())

    # Batch add — fixed from notebook bug where add was inside the loop
    if ids:
        # ChromaDB has a batch limit, add in chunks of 500
        batch_size = 500
        for start in range(0, len(ids), batch_size):
            end = start + batch_size
            collection.add(
                ids=ids[start:end],
                documents=documents[start:end],
                metadatas=metadatas[start:end],
                embeddings=embeddings_list[start:end],
            )

    return len(ids)


def query_documents(user_id: str, query: str, top_k: int = 5) -> list[dict]:
    """
    Query a user's vector store with a text query.
    Returns list of dicts with document content, metadata, and similarity score.
    """
    collection = get_or_create_collection(user_id)

    if collection.count() == 0:
        return []

    # Generate query embedding
    query_embedding = generate_single_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=min(top_k, collection.count()),
    )

    retrieved = []
    if results["documents"] and results["documents"][0]:
        for i, (doc, metadata, distance) in enumerate(
            zip(results["documents"][0], results["metadatas"][0], results["distances"][0])
        ):
            similarity = 1 - distance
            retrieved.append({
                "document": doc,
                "metadata": metadata,
                "similarity_score": similarity,
                "rank": i + 1,
            })

    return retrieved


def delete_source_vectors(user_id: str, source_id: str):
    """Delete all vectors belonging to a specific source from a user's collection."""
    collection = get_or_create_collection(user_id)

    try:
        # Get all document IDs with this source_id
        results = collection.get(
            where={"source_id": source_id}
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])
            return len(results["ids"])
    except Exception as e:
        logger.warning("Failed to delete vectors for source %s: %s", source_id, e)
    return 0


def get_collection_count(user_id: str) -> int:
    """Get the number of vectors in a user's collection."""
    collection = get_or_create_collection(user_id)
    return collection.count()
