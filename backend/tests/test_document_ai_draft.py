import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "ai_draft_user@example.com"
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
        "title": "Draft Doc",
        "content_json": {"type": "doc"},
        "content_text": "Existing intro.",
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
            "username": "DraftUser",
            "active_workspace_id": WORKSPACE_ID,
        })
        mock_workspaces.find_one = AsyncMock(return_value=_owner_workspace())
        mock_documents.find_one = AsyncMock(return_value=_doc())
        mock_documents.update_one = AsyncMock()
        yield {
            "users": mock_users,
            "documents": mock_documents,
            "workspaces": mock_workspaces,
        }


def _auth_headers():
    return {"Authorization": f"Bearer {USER_TOKEN}"}


def test_ai_draft_success_append(mock_db):
    with patch(
        "app.routes.documents.generate_response",
        new=AsyncMock(return_value="## AI\n\nArtificial intelligence is great."),
    ) as mock_llm:
        response = client.post(
            f"/api/documents/{DOC_ID}/ai-draft",
            json={"prompt": "Write a professional article on Artificial Intelligence", "mode": "append"},
            headers=_auth_headers(),
        )

    assert response.status_code == 200
    data = response.json()
    assert "Artificial intelligence" in data["markdown"]
    assert data["mode"] == "append"
    mock_llm.assert_awaited_once()
    # Draft preview must not auto-save and must not touch RAG indexing:
    # no document update may happen here. Keep commits via PUT later.
    mock_db["documents"].update_one.assert_not_called()


def test_ai_draft_success_replace_with_excerpt(mock_db):
    with patch(
        "app.routes.documents.generate_response",
        new=AsyncMock(return_value="## Rewritten\n\nNew body."),
    ):
        response = client.post(
            f"/api/documents/{DOC_ID}/ai-draft",
            json={
                "prompt": "Rewrite this as a report",
                "mode": "replace",
                "existing_excerpt": "Existing intro.",
            },
            headers=_auth_headers(),
        )

    assert response.status_code == 200
    assert response.json()["mode"] == "replace"
    mock_db["documents"].update_one.assert_not_called()


def test_ai_draft_empty_prompt_rejected(mock_db):
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-draft",
        json={"prompt": "   ", "mode": "append"},
        headers=_auth_headers(),
    )
    assert response.status_code in (400, 422)


def test_ai_draft_prompt_too_long_rejected(mock_db):
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-draft",
        json={"prompt": "x" * 2001, "mode": "append"},
        headers=_auth_headers(),
    )
    assert response.status_code == 422


def test_ai_draft_invalid_mode_rejected(mock_db):
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-draft",
        json={"prompt": "Write something", "mode": "explode"},
        headers=_auth_headers(),
    )
    assert response.status_code == 422


def test_ai_draft_invalid_id(mock_db):
    response = client.post(
        "/api/documents/not-an-id/ai-draft",
        json={"prompt": "Write something"},
        headers=_auth_headers(),
    )
    assert response.status_code == 400


def test_ai_draft_not_found(mock_db):
    mock_db["documents"].find_one = AsyncMock(return_value=None)
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-draft",
        json={"prompt": "Write something"},
        headers=_auth_headers(),
    )
    assert response.status_code == 404


def test_ai_draft_viewer_forbidden(mock_db):
    mock_db["workspaces"].find_one = AsyncMock(return_value=_viewer_workspace())
    response = client.post(
        f"/api/documents/{DOC_ID}/ai-draft",
        json={"prompt": "Write something"},
        headers=_auth_headers(),
    )
    assert response.status_code == 403


def test_ai_draft_llm_failure_returns_502(mock_db):
    with patch(
        "app.routes.documents.generate_response",
        new=AsyncMock(side_effect=RuntimeError("groq down")),
    ):
        response = client.post(
            f"/api/documents/{DOC_ID}/ai-draft",
            json={"prompt": "Write something"},
            headers=_auth_headers(),
        )
    assert response.status_code == 502


def test_ai_draft_empty_llm_output_returns_502(mock_db):
    with patch(
        "app.routes.documents.generate_response",
        new=AsyncMock(return_value="   "),
    ):
        response = client.post(
            f"/api/documents/{DOC_ID}/ai-draft",
            json={"prompt": "Write something"},
            headers=_auth_headers(),
        )
    assert response.status_code == 502
