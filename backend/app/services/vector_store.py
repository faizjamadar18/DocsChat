import logging
import uuid
from typing import Optional
from qdrant_client import QdrantClient, models
from app.config import get_settings
from app.services.embedding_service import generate_embeddings, generate_single_embedding

logger = logging.getLogger(__name__)
settings = get_settings()

COLLECTION_NAME = "docschat_shared_collection_v2"

# Initialize Qdrant Client
try:
    _qdrant_client = QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
    )
    logger.info("QdrantClient initialized successfully.")
except Exception as e:
    logger.error("Failed to initialize QdrantClient: %s", e)
    _qdrant_client = None


def _ensure_collection_exists():
    """Ensure the shared Qdrant collection exists and has appropriate payload indexes."""
    if not _qdrant_client:
        return
    try:
        if not _qdrant_client.collection_exists(COLLECTION_NAME):
            logger.info("Creating Qdrant collection: %s", COLLECTION_NAME)
            _qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=3072,  # The current embedding model outputs 3072 dimensions
                    distance=models.Distance.COSINE,
                ),
            )

        # Ensure payload indexes exist for user_id, workspace_id, and source_id
        for field in ["user_id", "workspace_id", "source_id"]:
            try:
                _qdrant_client.create_payload_index(
                    collection_name=COLLECTION_NAME,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
            except Exception:
                pass
    except Exception as e:
        logger.error("Error ensuring collection exists: %s", e)


def get_or_create_collection(user_id: str):
    """Legacy method name to maintain compatibility."""
    _ensure_collection_exists()
    return None


def add_documents(
    user_id: str,
    chunks: list,
    source_id: str,
    workspace_id: Optional[str] = None,
):
    """Add document chunks to the Qdrant store tagged with user_id and workspace_id."""
    _ensure_collection_exists()
    if not _qdrant_client:
        return 0

    points = []
    texts = [chunk.page_content for chunk in chunks]
    embeddings = generate_embeddings(texts)

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        doc_id = str(uuid.uuid4())

        metadata = {}
        if hasattr(chunk, "metadata") and chunk.metadata:
            for key, value in chunk.metadata.items():
                if isinstance(value, (str, int, float, bool)):
                    metadata[key] = value

        metadata["source_id"] = source_id
        metadata["user_id"] = user_id
        if workspace_id:
            metadata["workspace_id"] = workspace_id
        metadata["chunk_index"] = i
        metadata["page_content"] = chunk.page_content

        points.append(
            models.PointStruct(
                id=doc_id,
                vector=embedding,
                payload=metadata,
            )
        )

    if points:
        batch_size = 500
        for start in range(0, len(points), batch_size):
            end = start + batch_size
            _qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                points=points[start:end],
            )

    return len(points)


def query_workspace_documents(
    user_id: str,
    workspace_id: str,
    query: str,
    scope_ids: list[str] | None = None,
    top_k: int = 5,
) -> list[dict]:
    """
    Unified query isolated by user_id and workspace_id.
    Optionally filters by scope_ids (@-mentions).
    """
    _ensure_collection_exists()
    if not _qdrant_client:
        return []

    query_embedding = generate_single_embedding(query)

    must_conditions = [
        models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)),
        models.FieldCondition(key="workspace_id", match=models.MatchValue(value=workspace_id)),
    ]

    if scope_ids:
        must_conditions.append(
            models.FieldCondition(
                key="source_id",
                match=models.MatchAny(any=scope_ids),
            )
        )

    search_result = _qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter=models.Filter(must=must_conditions),
        limit=top_k,
        with_payload=True,
    )

    retrieved = []
    for i, point in enumerate(search_result.points):
        retrieved.append({
            "document": point.payload.get("page_content", ""),
            "metadata": point.payload,
            "similarity_score": point.score,
            "rank": i + 1,
        })

    return retrieved


def query_documents(
    user_id: str,
    query: str,
    top_k: int = 5,
    workspace_id: Optional[str] = None,
) -> list[dict]:
    """Query documents, filtering by workspace_id if provided or falling back to user_id."""
    if workspace_id:
        return query_workspace_documents(user_id=user_id, workspace_id=workspace_id, query=query, top_k=top_k)

    _ensure_collection_exists()
    if not _qdrant_client:
        return []

    query_embedding = generate_single_embedding(query)

    search_result = _qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="user_id",
                    match=models.MatchValue(value=user_id),
                )
            ]
        ),
        limit=top_k,
        with_payload=True,
    )

    retrieved = []
    for i, point in enumerate(search_result.points):
        retrieved.append({
            "document": point.payload.get("page_content", ""),
            "metadata": point.payload,
            "similarity_score": point.score,
            "rank": i + 1,
        })

    return retrieved


def delete_source_vectors(user_id: str, source_id: str):
    """Delete all vectors belonging to a specific source for a user."""
    _ensure_collection_exists()
    if not _qdrant_client:
        return 0

    try:
        _qdrant_client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="user_id",
                            match=models.MatchValue(value=user_id),
                        ),
                        models.FieldCondition(
                            key="source_id",
                            match=models.MatchValue(value=source_id),
                        ),
                    ]
                )
            ),
        )
        return 1
    except Exception as e:
        logger.warning("Failed to delete vectors for source %s: %s", source_id, e)
    return 0


def delete_workspace_vectors(user_id: str, workspace_id: str):
    """Delete all vectors belonging to a specific workspace for a user."""
    _ensure_collection_exists()
    if not _qdrant_client:
        return 0

    try:
        _qdrant_client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="user_id",
                            match=models.MatchValue(value=user_id),
                        ),
                        models.FieldCondition(
                            key="workspace_id",
                            match=models.MatchValue(value=workspace_id),
                        ),
                    ]
                )
            ),
        )
        return 1
    except Exception as e:
        logger.warning("Failed to delete vectors for workspace %s: %s", workspace_id, e)
    return 0


def set_user_vectors_workspace(user_id: str, workspace_id: str):
    """Backfill workspace_id into points for a given user that lack workspace_id."""
    _ensure_collection_exists()
    if not _qdrant_client:
        return

    try:
        _qdrant_client.set_payload(
            collection_name=COLLECTION_NAME,
            payload={"workspace_id": workspace_id},
            points=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_id",
                        match=models.MatchValue(value=user_id),
                    )
                ]
            ),
        )
    except Exception as e:
        logger.warning("Failed to set workspace_id on vectors for user %s: %s", user_id, e)


def get_collection_count(user_id: str, workspace_id: Optional[str] = None) -> int:
    """Get the number of vectors for a user and optional workspace."""
    _ensure_collection_exists()
    if not _qdrant_client:
        return 0

    must = [models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id))]
    if workspace_id:
        must.append(models.FieldCondition(key="workspace_id", match=models.MatchValue(value=workspace_id)))

    try:
        count_result = _qdrant_client.count(
            collection_name=COLLECTION_NAME,
            count_filter=models.Filter(must=must),
        )
        return count_result.count
    except Exception as e:
        logger.warning("Failed to get collection count: %s", e)
        return 0
