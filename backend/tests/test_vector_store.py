import pytest
from unittest.mock import patch, MagicMock
from app.services.vector_store import query_documents, add_documents, delete_source_vectors, get_collection_count

@pytest.fixture
def mock_qdrant_client():
    with patch("app.services.vector_store._qdrant_client") as mock_client:
        yield mock_client

@pytest.fixture
def mock_embedding_service():
    with patch("app.services.vector_store.generate_single_embedding") as mock_gen_single:
        with patch("app.services.vector_store.generate_embeddings") as mock_gen:
            mock_gen_single.return_value = [0.1] * 3072
            mock_gen.return_value = [[0.1] * 3072]
            yield {"single": mock_gen_single, "batch": mock_gen}

class DummyChunk:
    def __init__(self, page_content, metadata):
        self.page_content = page_content
        self.metadata = metadata

def test_query_documents_success(mock_qdrant_client, mock_embedding_service):
    # Setup mock query response
    mock_point = MagicMock()
    mock_point.payload = {"page_content": "test content", "source_id": "test_src"}
    mock_point.score = 0.95
    
    mock_response = MagicMock()
    mock_response.points = [mock_point]
    mock_qdrant_client.query_points.return_value = mock_response

    # Execute
    results = query_documents("user1", "test query", top_k=1)

    # Verify
    assert len(results) == 1
    assert results[0]["document"] == "test content"
    assert results[0]["similarity_score"] == 0.95
    mock_qdrant_client.query_points.assert_called_once()
    
def test_query_documents_no_client():
    # If client is None, should return empty list
    with patch("app.services.vector_store._qdrant_client", None):
        results = query_documents("user1", "test query", top_k=1)
        assert results == []

def test_add_documents_success(mock_qdrant_client, mock_embedding_service):
    chunks = [DummyChunk("page 1", {"page": 1})]
    count = add_documents("user1", chunks, "source1")
    
    assert count == 1
    mock_qdrant_client.upsert.assert_called_once()

def test_delete_source_vectors(mock_qdrant_client):
    result = delete_source_vectors("user1", "source1")
    assert result == 1
    mock_qdrant_client.delete.assert_called_once()
