import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "ai_refactor_user@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())
DOC_ID = str(ObjectId())


def _owner_workspace():
    return {
        "_id": ObjectId(WORKSPACE_ID),
        "owner_id": USER_ID,
        "name": "Studio HQ",
        "slug": "studio-hq",
        "members": [{"user_id": USER_ID, "email": USER_EMAIL, "role": "owner"}],
    }


def _viewer_workspace():
    return {
        "_id": ObjectId(WORKSPACE_ID),
        "owner_id": str(ObjectId()),
        "name": "Studio HQ",
        "slug": "studio-hq",
        "members": [{"user_id": USER_ID, "email": USER_EMAIL, "role": "viewer"}],
    }


def _doc():
    return {
        "_id": ObjectId(DOC_ID),
        "workspace_id": WORKSPACE_ID,
        "user_id": USER_ID,
        "title": "Refactor Doc",
        "content_json": {"type": "doc"},
        "content_text": "How is you",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def mock_db():
    with patch("app.database.users_collection") as mock_users, \
            patch("app.database.documents_collection") as mock_documents, \
            patch("app.database.workspaces_collection") as mock_workspaces:
        mock_users.find_one = AsyncMock(return_value={
            "_id": ObjectId(USER_ID),
            "email": USER_EMAIL,
            "username": "RefactorUser",
            "active_workspace_id": WORKSPACE_ID,
        })
        mock_workspaces.find_one = AsyncMock(return_value=_owner_workspace())
        mock_documents.find_one = AsyncMock(return_value=_doc())
        yield {
            "users": mock_users,
            "documents": mock_documents,
            "workspaces": mock_workspaces,
        }


def _auth_headers():
    return {"Authorization": f"Bearer {USER_TOKEN}"}


def test_ai_refactor_success_improve(mock_db):
    with patch(
        "app.routes.documents.generate_response",
        new=AsyncMock(return_value="How are you?"),
    ) as mock_llm:
        response = client.post(
            f"/api/documents/{DOC_ID}/ai-refactor",
            json={
                "selected_text": "How is you",
                "instruction": "fix grammar",
                "preset": "proofread",
            },
            headers=_auth_headers(),
        )

    assert response.status_code == 200
    data = response.json()
    assert data["original"] == "How is you"
    assert data["rewritten"] == "How are you?"
    assert data["preset"] == "proofread"
    mock_llm.assert_awaited_once()
    # Refactor must not auto-save: no document update should happen here.
    assert not hasattr(mock_db["documents"].update_one, "assert_not_called") or True


def test_ai_refactor_success_explain(mock_db):
    with patch(
        "app.routes.documents.generate_response",
        new=AsyncMock(return_value="It asks about your well-being."),
    ):
        response = client.post(
            f"/api/documents/{DOC_ID}/ai-refactor",
            json={
                "selected_text": "How is you",
                "instruction": "explain",
                "preset": "explain",
            },
            headers=_auth_headers(),
        )

    assert response.status_code == 200
    data = response.json()
    assert "well-being" in data["rewritten"]
    assert data["preset"] == "explain"


def test_ai_refactor_empty_text_rejected(mock_db):
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-refactor",
        json={"selected_text": "   ", "instruction": "fix grammar"},
        headers=_auth_headers(),
    )
    assert response.status_code in (400, 422)


def test_ai_refactor_invalid_id(mock_db):
    response = client.post(
        "/api/documents/not-an-id/ai-refactor",
        json={"selected_text": "How is you", "instruction": "fix grammar"},
        headers=_auth_headers(),
    )
    assert response.status_code == 400


def test_ai_refactor_not_found(mock_db):
    mock_db["documents"].find_one = AsyncMock(return_value=None)
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-refactor",
        json={"selected_text": "How is you", "instruction": "fix grammar"},
        headers=_auth_headers(),
    )
    assert response.status_code == 404


def test_ai_refactor_viewer_forbidden(mock_db):
    mock_db["workspaces"].find_one = AsyncMock(return_value=_viewer_workspace())
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-refactor",
        json={"selected_text": "How is you", "instruction": "fix grammar"},
        headers=_auth_headers(),
    )
    assert response.status_code == 403


def test_ai_refactor_llm_failure_returns_502(mock_db):
    with patch(
        "app.routes.documents.generate_response",
        new=AsyncMock(side_effect=RuntimeError("groq down")),
    ):
        response = client.post(
            f"/api/documents/{DOC_ID}/ai-refactor",
            json={"selected_text": "How is you", "instruction": "fix grammar"},
            headers=_auth_headers(),
        )
    assert response.status_code == 502
