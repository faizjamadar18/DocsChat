"""Google Drive sync: download/export picked files -> reuse RAG pipeline.

Scope is drive.file only (non-sensitive): backend can only open files the user
picked in the Google Picker. Refresh tokens are encrypted at rest; only a
short-lived access token is ever handed to the browser for the Picker.
"""
import logging
import os
import tempfile
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from bson import ObjectId

import app.database as database
from app.config import get_settings
from app.services.connector_token_service import encrypt_token, decrypt_token
from app.services.rag_service import process_document_content, process_pdf

logger = logging.getLogger(__name__)
settings = get_settings()

DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file"
MAX_BYTES = 20 * 1024 * 1024  # same cap as PDF uploads

# Google-native mime -> export mime (plain text for RAG)
EXPORT_MAP = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}

TEXT_MIMES = {
    "text/plain", "text/markdown", "text/csv", "text/html",
    "application/json", "application/javascript", "application/typescript",
}


async def get_fresh_access_token(user_id: str) -> str:
    """Return a valid Drive access token, refreshing server-side if needed."""
    acct = await database.connector_accounts_collection.find_one(
        {"user_id": user_id, "provider": "drive"}
    )
    if not acct or not acct.get("refresh_enc"):
        raise ValueError("Drive not connected")

    expires_at = acct.get("token_expires_at")
    now = datetime.now(timezone.utc)
    if expires_at and getattr(expires_at, "tzinfo", None) is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if acct.get("access_enc") and expires_at and expires_at > now + timedelta(minutes=2):
        try:
            return decrypt_token(acct["access_enc"])
        except ValueError:
            pass

    # Refresh
    try:
        refresh = decrypt_token(acct["refresh_enc"])
    except ValueError as exc:
        raise ValueError("Stored Drive token invalid. Please reconnect.") from exc

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": settings.GOOGLE_DRIVE_CLIENT_ID,
            "client_secret": settings.GOOGLE_DRIVE_CLIENT_SECRET,
            "refresh_token": refresh,
            "grant_type": "refresh_token",
        })
        resp.raise_for_status()
        data = resp.json()

    new_access = data["access_token"]
    new_expiry = now + timedelta(seconds=int(data.get("expires_in", 3600)))
    await database.connector_accounts_collection.update_one(
        {"user_id": user_id, "provider": "drive"},
        {"$set": {"access_enc": encrypt_token(new_access), "token_expires_at": new_expiry}},
    )
    return new_access


def _log_drive_error(step: str, file_id: str, e: httpx.HTTPStatusError) -> None:
    """Log the full Drive error body server-side (never shown to the client)."""
    try:
        body = e.response.text[:500]
    except Exception:
        body = "<unreadable>"
    logger.error(
        "[ERR] Drive API %s failed for file %s: HTTP %s body=%s",
        step, file_id, e.response.status_code, body,
    )


def _friendly_drive_error(e: httpx.HTTPStatusError, file_id: str) -> ValueError:
    """Turn Drive's raw HTTP error into a message a normal user understands."""
    code = e.response.status_code
    try:
        detail = (e.response.json().get("error") or {}).get("message", "")
    except Exception:
        detail = ""
    if code == 404:
        return ValueError(
            "Google can't find this file (it may be in a shared drive, trashed, "
            "or no longer shared with you). Try picking it again from Drive."
        )
    if code in (401, 403):
        if "abuse" in detail.lower() or "virus" in detail.lower():
            return ValueError("Google blocked this download (flagged file). Try another file.")
        return ValueError(
            "Google refused access to this file. Disconnect and connect Drive again, "
            "then pick the file fresh from the picker."
        )
    return ValueError(f"Google Drive error ({code}): {detail[:200]}".strip())


async def _download_file(access_token: str, file_id: str, mime_type: Optional[str]) -> tuple[str, bytes, str]:
    """Return (filename_hint, content_bytes, kind) where kind is text|pdf."""
    headers = {"Authorization": f"Bearer {access_token}"}
    # supportsAllDrives: files in shared drives 404 without this flag.
    drive_params = {"supportsAllDrives": "true"}
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        step = "metadata"
        try:
            if mime_type in EXPORT_MAP:
                step = "export"
                resp = await client.get(
                    f"https://www.googleapis.com/drive/v3/files/{file_id}/export",
                    headers=headers,
                    params={**drive_params, "mimeType": EXPORT_MAP[mime_type]},
                )
                resp.raise_for_status()
                return "", resp.content, "text"
            # Regular file: metadata first (size guard + shortcut resolution), then content
            meta = await client.get(
                f"https://www.googleapis.com/drive/v3/files/{file_id}",
                headers=headers,
                params={**drive_params, "fields": "id,name,mimeType,size,shortcutDetails"},
            )
            meta.raise_for_status()
            info = meta.json()
            # Shortcuts picked in the UI point elsewhere — follow them.
            if info.get("mimeType") == "application/vnd.google-apps.shortcut":
                target = (info.get("shortcutDetails") or {}).get("targetId")
                if not target:
                    raise ValueError("This is a Drive shortcut with no target. Open the original file and pick it.")
                step = "shortcut-target-metadata"
                meta = await client.get(
                    f"https://www.googleapis.com/drive/v3/files/{target}",
                    headers=headers,
                    params={**drive_params, "fields": "id,name,mimeType,size"},
                )
                meta.raise_for_status()
                info = meta.json()
                file_id = target
            size = int(info.get("size") or 0)
            if size > MAX_BYTES:
                raise ValueError(f"File exceeds 20MB limit ({size // (1024*1024)}MB)")
            actual_mime = info.get("mimeType") or mime_type or ""
            step = "download-media"
            resp = await client.get(
                f"https://www.googleapis.com/drive/v3/files/{file_id}",
                headers=headers,
                # acknowledgeAbuse: lets Drive serve files flagged by its virus scan.
                params={**drive_params, "alt": "media", "acknowledgeAbuse": "true"},
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            _log_drive_error(step, file_id, e)
            raise _friendly_drive_error(e, file_id) from e
        kind = "pdf" if actual_mime == "application/pdf" else "text"
        if kind == "text" and actual_mime not in TEXT_MIMES and not actual_mime.startswith("text/"):
            raise ValueError(f"Unsupported file type for Q&A: {actual_mime}")
        return info.get("name", ""), resp.content, kind


async def sync_drive_file(
    user_id: str,
    workspace_id: Optional[str],
    source_id: str,
    file_id: str,
    file_name: str,
    mime_type: Optional[str] = None,
) -> int:
    """Download a Drive file and index it via the shared RAG pipeline."""
    from app.services.sync_db import set_source_fields

    await set_source_fields(source_id, {"status": "syncing", "sync_error": None})

    try:
        access_token = await get_fresh_access_token(user_id)
        meta_name, content, kind = await _download_file(access_token, file_id, mime_type)
        final_name = file_name or meta_name or "Untitled"
        remote_url = f"https://drive.google.com/file/d/{file_id}/view"

        if kind == "pdf":
            fd, tmp_path = tempfile.mkstemp(suffix=".pdf")
            try:
                with os.fdopen(fd, "wb") as f:
                    f.write(content)
                await process_pdf(user_id, source_id, tmp_path, workspace_id)
                source = await database.sources_collection.find_one({"_id": ObjectId(source_id)})
                chunk_count = (source or {}).get("chunk_count", 0)
            finally:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
        else:
            text = content.decode("utf-8", errors="replace")
            full_text = f"# {final_name}\n\nSource: Google Drive\nURL: {remote_url}\n\n{text}"
            chunk_count = await process_document_content(
                user_id, source_id, final_name, full_text, workspace_id
            )

        if chunk_count == 0:
            # Downloaded fine, but no readable text (e.g. scanned-image PDF).
            # Never report these as ready — Ora would have nothing to cite.
            raise ValueError(
                "No readable text found in this file "
                "(it may be a scanned image — try a text PDF or a Google Doc instead)."
            )

        await set_source_fields(source_id, {
            "status": "ready",
            "chunk_count": chunk_count,
            "filename": f"[Drive] {final_name}",
            "file_size": len(content),
            "remote_url": remote_url,
            "last_synced_at": datetime.now(timezone.utc),
            "sync_error": None,
        })
        logger.info("[OK] Synced Drive file %s -> %d chunks", file_id, chunk_count)
        return chunk_count
    except Exception as e:
        logger.error("[ERR] Drive sync failed for file %s: %s", file_id, e)
        await set_source_fields(source_id, {"status": "error", "sync_error": str(e)[:500]})
        raise
