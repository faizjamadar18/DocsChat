import pytest
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from app.services.rag_service import get_workspace_catalog, ask_question

USER_ID = str(ObjectId())
WORKSPACE_ID = str(ObjectId())


@pytest.mark.asyncio
async def test_get_workspace_catalog():
    mock_docs = [
        {"title": "Project Roadmap"},
        {"title": "Technical Spec"},
    ]
    mock_sources = [
        {"filename": "Engineering_Resume.pdf", "page_count": 2},
        {"filename": "Company_Financials.pdf", "page_count": 15},
    ]

    mock_doc_cursor = AsyncMock()
    mock_doc_cursor.__aiter__.return_value = mock_docs

    mock_source_cursor = AsyncMock()
    mock_source_cursor.__aiter__.return_value = mock_sources

    with patch("app.database.documents_collection") as mock_documents_col, \
         patch("app.database.sources_collection") as mock_sources_col:
        mock_documents_col.find.return_value = mock_doc_cursor
        mock_sources_col.find.return_value = mock_source_cursor

        catalog_summary, doc_count, asset_count = await get_workspace_catalog(USER_ID, WORKSPACE_ID)

        assert doc_count == 2
        assert asset_count == 2
        assert "Project Roadmap" in catalog_summary
        assert "Technical Spec" in catalog_summary
        assert "Engineering_Resume.pdf" in catalog_summary
        assert "Company_Financials.pdf" in catalog_summary


@pytest.mark.asyncio
async def test_ask_question_injects_catalog_into_prompt():
    with patch("app.services.rag_service.get_workspace_catalog", new_callable=AsyncMock) as mock_get_catalog, \
         patch("app.services.rag_service.retrieve_for_query", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.services.rag_service.stream_response") as mock_stream:

        mock_get_catalog.return_value = (
            "- Studio Documents (2 total): DocA, DocB\n- Uploaded Assets (1 total): Resume.pdf",
            2,
            1,
        )
        mock_retrieve.return_value = (None, [])

        async def fake_stream(prompt, model):
            yield "You have 2 documents and 1 asset."

        mock_stream.side_effect = fake_stream

        tokens = []
        async for token in ask_question(
            user_id=USER_ID,
            query="How many assets and docs do I have in my workspace?",
            workspace_id=WORKSPACE_ID,
        ):
            tokens.append(token)

        assert len(tokens) == 1
        assert "You have 2 documents and 1 asset." in tokens[0]

        # Verify prompt format
        mock_stream.assert_called_once()
        called_prompt = mock_stream.call_args[0][0]
        assert "Workspace Inventory Catalog:" in called_prompt
        assert "DocA, DocB" in called_prompt
        assert "Resume.pdf" in called_prompt
