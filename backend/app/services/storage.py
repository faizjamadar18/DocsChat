"""Cloudflare R2 object storage — S3-compatible API.

Verified against live docs:
- S3 compatibility page (updated Oct 14, 2026): endpoint
  https://<ACCOUNT_ID>.r2.cloudflarestorage.com, region must be "auto".
  PutObject / GetObject / DeleteObject / HeadObject are implemented.
  ACL and Tagging headers are NOT implemented — never send them.
- boto3 example page (updated Jun 8, 2026): boto3.client(...) +
  upload_fileobj / get_object / delete_object / generate_presigned_url.

Local fallback: when R2 env vars are missing, all helpers return
None/False so callers keep using the local uploads/ folder.
Nothing crashes in local dev or in tests without R2.
"""
import io
import logging
import re
from typing import Optional

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

PRESIGNED_EXPIRES_SECONDS = 3600


def is_r2_enabled() -> bool:
    """True only when all four R2 settings are present."""
    return bool(
        settings.R2_ENDPOINT
        and settings.R2_ACCESS_KEY_ID
        and settings.R2_SECRET_ACCESS_KEY
        and settings.R2_BUCKET
    )


def get_r2_client():
    """Build a boto3 S3 client for R2, or None when disabled/missing."""
    if not is_r2_enabled():
        return None
    try:
        import boto3
    except ImportError:
        logger.warning("boto3 not installed, R2 disabled")
        return None
    return boto3.client(
        service_name="s3",
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def build_r2_key(user_id: str, source_id: str, filename: str) -> str:
    """Build a safe object key like user_id/source_id_filename.ext."""
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", filename or "file")
    safe = safe[-120:] or "file"
    return f"{user_id}/{source_id}_{safe}"


def upload_file_bytes(content: bytes, key: str, content_type: str = "application/octet-stream") -> str:
    """Upload file bytes to R2. Returns key. Raises on failure."""
    client = get_r2_client()
    if client is None:
        raise RuntimeError("R2 is not configured")
    client.upload_fileobj(
        io.BytesIO(content),
        settings.R2_BUCKET,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    return key


def download_file_bytes(key: str) -> bytes:
    """Download R2 object bytes (used by the AI parser). Raises on failure."""
    client = get_r2_client()
    if client is None:
        raise RuntimeError("R2 is not configured")
    response = client.get_object(Bucket=settings.R2_BUCKET, Key=key)
    return response["Body"].read()


def get_presigned_download_url(key: str, filename: Optional[str] = None) -> Optional[str]:
    """1-hour download link for a private object. None when R2 is off."""
    client = get_r2_client()
    if client is None:
        return None
    params: dict = {"Bucket": settings.R2_BUCKET, "Key": key}
    if filename:
        params["ResponseContentDisposition"] = f'attachment; filename="{filename}"'
    try:
        return client.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=PRESIGNED_EXPIRES_SECONDS,
        )
    except Exception as e:
        logger.warning("Failed to presign R2 URL for %s: %s", key, e)
        return None


def delete_file(key: str) -> bool:
    """Delete one R2 object. False when disabled or on error (never raises)."""
    client = get_r2_client()
    if client is None or not key:
        return False
    try:
        client.delete_object(Bucket=settings.R2_BUCKET, Key=key)
        return True
    except Exception as e:
        logger.warning("Failed to delete R2 object %s: %s", key, e)
        return False
