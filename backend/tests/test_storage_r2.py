"""R2 storage switch — highest breakage-risk paths only.

Contract:
- Upload stores r2_key when R2 is on, falls back to local disk when off.
- Download redirects to R2 presigned URL when r2_key exists, else serves local file.
- Delete purges R2 object (best-effort) + vectors + Mongo doc.
"""
import io
from bson import ObjectId
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone

from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)

USER_ID = str(ObjectId())
USER_EMAIL = "r2user@example.com"
USER_TOKEN = create_access_token(USER_ID, USER_EMAIL)
WORKSPACE_ID = str(ObjectId())
SOURCE_ID = str(ObjectId())


def _auth_headers():
    return {"Authorization": f"Bearer {USER_TOKEN}"}


def _mock_user(mock_users):
    mock_users.find_one = AsyncMock(return_value={
        "_id": ObjectId(USER_ID),
        "email": USER_EMAIL,
        "username": "R2 User",
        "active_workspace_id": WORKSPACE_ID,
    })


def _mock_workspace_member(mock_workspaces, role="owner"):
    mock_workspaces.find_one = AsyncMock(return_value={
        "_id": ObjectId(WORKSPACE_ID),
        "owner_id": USER_ID,
        "name": "HQ",
        "members": [{"user_id": USER_ID, "email": USER_EMAIL, "role": role}],
    })


def test_storage_is_disabled_without_config():
    from app.services import storage as storage_svc
    with patch.object(storage_svc.settings, "R2_ENDPOINT", ""), \
         patch.object(storage_svc.settings, "R2_ACCESS_KEY_ID", ""), \
         patch.object(storage_svc.settings, "R2_SECRET_ACCESS_KEY", ""), \
         patch.object(storage_svc.settings, "R2_BUCKET", ""):
        assert storage_svc.is_r2_enabled() is False
        assert storage_svc.get_r2_client() is None


def test_storage_key_format():
    from app.services import storage as storage_svc
    key = storage_svc.build_r2_key(USER_ID, SOURCE_ID, "my doc.pdf")
    assert key.startswith(f"{USER_ID}/{SOURCE_ID}_")
    assert key.endswith(".pdf")
    assert " " not in key


def test_upload_uses_r2_when_enabled():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.workspaces_collection") as mock_workspaces, \
         patch("app.routes.sources.check_db"), \
         patch("app.services.storage.is_r2_enabled", return_value=True), \
         patch("app.services.storage.upload_file_bytes", return_value=f"{USER_ID}/{SOURCE_ID}_a.pdf") as mock_upload, \
         patch("app.routes.sources.process_source_file") as mock_process:
        _mock_user(mock_users)
        _mock_workspace_member(mock_workspaces)
        mock_sources.insert_one = AsyncMock(return_value=type("R", (), {"inserted_id": ObjectId(SOURCE_ID)})())

        pdf_bytes = b"%PDF-1.4 fake-id-for-r2-test"
        response = client.post(
            "/api/sources/upload",
            files={"file": ("hello.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
            headers=_auth_headers(),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "processing"
        assert mock_upload.called
        assert mock_process.called


def test_download_redirects_to_r2_when_key_exists():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.workspaces_collection") as mock_workspaces, \
         patch("app.routes.sources.check_db"), \
         patch("app.services.storage.get_presigned_download_url", return_value="https://r2.example/presigned"):
        _mock_user(mock_users)
        _mock_workspace_member(mock_workspaces)
        mock_sources.find_one = AsyncMock(return_value={
            "_id": ObjectId(SOURCE_ID),
            "user_id": USER_ID,
            "workspace_id": WORKSPACE_ID,
            "filename": "hello.pdf",
            "file_size": 100,
            "status": "ready",
            "r2_key": f"{USER_ID}/{SOURCE_ID}_hello.pdf",
            "storage": "r2",
        })
        response = client.get(
            f"/api/sources/{SOURCE_ID}/download",
            headers=_auth_headers(),
            follow_redirects=False,
        )
        assert response.status_code in (302, 307)
        assert "r2.example" in response.headers.get("location", "")


def test_download_falls_back_to_local_file(tmp_path):
    local_file = tmp_path / "hello.pdf"
    local_file.write_bytes(b"%PDF-1.4 local-fallback")
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.workspaces_collection") as mock_workspaces, \
         patch("app.routes.sources.check_db"):
        _mock_user(mock_users)
        _mock_workspace_member(mock_workspaces)
        mock_sources.find_one = AsyncMock(return_value={
            "_id": ObjectId(SOURCE_ID),
            "user_id": USER_ID,
            "workspace_id": WORKSPACE_ID,
            "filename": "hello.pdf",
            "file_size": 100,
            "status": "ready",
            "file_path": str(local_file),
        })
        response = client.get(
            f"/api/sources/{SOURCE_ID}/download",
            headers=_auth_headers(),
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"


def test_delete_purges_r2_object():
    with patch("app.database.users_collection") as mock_users, \
         patch("app.database.sources_collection") as mock_sources, \
         patch("app.database.workspaces_collection") as mock_workspaces, \
         patch("app.routes.sources.check_db"), \
         patch("app.services.storage.delete_file", return_value=True) as mock_delete, \
         patch("app.services.vector_store.delete_source_vectors", return_value=1):
        _mock_user(mock_users)
        _mock_workspace_member(mock_workspaces)
        mock_sources.find_one = AsyncMock(return_value={
            "_id": ObjectId(SOURCE_ID),
            "user_id": USER_ID,
            "workspace_id": WORKSPACE_ID,
            "filename": "hello.pdf",
            "r2_key": f"{USER_ID}/{SOURCE_ID}_hello.pdf",
            "storage": "r2",
        })
        mock_sources.delete_one = AsyncMock(return_value=type("R", (), {"deleted_count": 1})())
        response = client.delete(
            f"/api/sources/{SOURCE_ID}",
            headers=_auth_headers(),
        )
        assert response.status_code == 200
        assert mock_delete.called
