import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app

client = TestClient(app)

from app.routes.workspaces import get_workspace_or_404

def test_ask_query_persona():
    app.dependency_overrides[get_workspace_or_404] = lambda: {"_id": "ws_123", "user_id": "user123"}
    
    with patch("app.routes.chat.ask_question") as mock_ask:
        async def mock_generator(*args, **kwargs):
            assert kwargs.get("persona") == "ora"
            yield b"hello"
            
        mock_ask.side_effect = mock_generator
        
        with patch("app.routes.chat.check_db"):
            with patch("app.routes.chat.database") as mock_db:
                mock_db.messages_collection.insert_one = AsyncMock()
                with patch("app.services.rag_service.retrieve_for_query", new_callable=AsyncMock, return_value=("ctx", [])):
                    resp = client.post(
                        "/api/workspaces/ws_123/chat/ask",
                        json={"query": "test", "persona": "ora", "workspace_id": "ws_123"}
                    )
                    assert resp.status_code == 200

    app.dependency_overrides = {}
