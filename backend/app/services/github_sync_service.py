"""GitHub sync: fetch a repo's docs subset -> reuse RAG pipeline.

Guardrails (protect the free vector database):
- Docs subset ONLY: README at root + markdown under docs/ (whole code ignored).
- Caps: max 50 files, 1MB per file, 20MB total per repo, 10 repos per user.
- One source per repo (not per file) so the Sources table stays clean.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx

import app.database as database
from app.config import get_settings
from app.services.connector_token_service import encrypt_token, decrypt_token
from app.services.rag_service import process_document_content

logger = logging.getLogger(__name__)
settings = get_settings()

API_BASE = "https://api.github.com"
MAX_FILES = 50
MAX_FILE_BYTES = 1 * 1024 * 1024
MAX_TOTAL_BYTES = 20 * 1024 * 1024
MAX_REPOS_PER_USER = 10


def _doc_paths(tree: list[dict]) -> list[str]:
    """Pick the storybooks: root README + markdown under docs/. Everything else ignored."""
    picked: list[str] = []
    for node in tree:
        if node.get("type") != "blob":
            continue
        path = (node.get("path") or "")
        low = path.lower()
        if "/" not in path and (low == "readme.md" or low.startswith("readme.")):
            picked.append(path)
        elif low.startswith("docs/") and low.endswith(".md"):
            picked.append(path)
        if len(picked) >= MAX_FILES:
            break
    # README first so it opens the story.
    picked.sort(key=lambda p: (0 if "/" not in p else 1, p))
    return picked


async def get_fresh_access_token(user_id: str) -> str:
    """Return a valid GitHub user token, refreshing server-side if needed."""
    acct = await database.connector_accounts_collection.find_one(
        {"user_id": user_id, "provider": "github"}
    )
    if not acct or not acct.get("refresh_enc"):
        raise ValueError("GitHub not connected")

    expires_at = acct.get("token_expires_at")
    now = datetime.now(timezone.utc)
    if expires_at and getattr(expires_at, "tzinfo", None) is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if acct.get("access_enc") and expires_at and expires_at > now + timedelta(minutes=2):
        try:
            return decrypt_token(acct["access_enc"])
        except ValueError:
            pass

    try:
        refresh = decrypt_token(acct["refresh_enc"])
    except ValueError as exc:
        raise ValueError("Stored GitHub token invalid. Please reconnect.") from exc

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_APP_CLIENT_ID,
                "client_secret": settings.GITHUB_APP_CLIENT_SECRET,
                "refresh_token": refresh,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    new_access = data["access_token"]
    new_expiry = now + timedelta(seconds=int(data.get("expires_in", 28800)))
    update: dict = {"access_enc": encrypt_token(new_access), "token_expires_at": new_expiry}
    if data.get("refresh_token"):
        update["refresh_enc"] = encrypt_token(data["refresh_token"])
    await database.connector_accounts_collection.update_one(
        {"user_id": user_id, "provider": "github"}, {"$set": update}
    )
    return new_access


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def list_user_repos(token: str) -> list[dict]:
    """Repos the user shared with the app (respects their install choice)."""
    repos: list[dict] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        page = 1
        while len(repos) < 100:
            resp = await client.get(
                f"{API_BASE}/user/repos",
                headers=_headers(token),
                params={"per_page": 100, "page": page, "affiliation": "owner,collaborator,organization_member"},
            )
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            repos.extend(batch)
            if len(batch) < 100:
                break
            page += 1
    return repos[:100]


async def sync_github_repo(
    user_id: str,
    workspace_id: Optional[str],
    source_id: str,
    full_name: str,  # "owner/repo"
    repo_url: Optional[str] = None,
) -> int:
    """Fetch README + docs/*.md of one repo and index via the shared RAG pipeline."""
    from app.services.sync_db import set_source_fields

    await set_source_fields(source_id, {"status": "syncing", "sync_error": None})

    try:
        token = await get_fresh_access_token(user_id)
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            # Default branch + full tree in 2 calls (cheap on rate limits).
            repo_resp = await client.get(f"{API_BASE}/repos/{full_name}", headers=_headers(token))
            repo_resp.raise_for_status()
            repo = repo_resp.json()
            branch = repo.get("default_branch") or "main"

            tree_resp = await client.get(
                f"{API_BASE}/repos/{full_name}/git/trees/{branch}",
                headers=_headers(token),
                params={"recursive": "1"},
            )
            tree_resp.raise_for_status()
            tree = tree_resp.json()
            if tree.get("truncated"):
                logger.warning("[WARN] Tree truncated for %s; using partial file list", full_name)

            paths = _doc_paths(tree.get("tree", []))
            if not paths:
                raise ValueError("No README or docs/*.md found in this repo — nothing to learn from.")

            parts: list[str] = []
            total = 0
            for path in paths:
                blob = await client.get(
                    f"{API_BASE}/repos/{full_name}/contents/{path}",
                    headers={**_headers(token), "Accept": "application/vnd.github.raw"},
                    params={"ref": branch},
                )
                blob.raise_for_status()
                content = blob.content
                if len(content) > MAX_FILE_BYTES:
                    continue
                if total + len(content) > MAX_TOTAL_BYTES:
                    break
                total += len(content)
                try:
                    text = content.decode("utf-8", errors="replace")
                except Exception:
                    continue
                parts.append(f"\n\n## File: {path}\n\n{text}")

        final_url = repo_url or f"https://github.com/{full_name}"
        full_text = (
            f"# {full_name}\n\nSource: GitHub\nURL: {final_url}\n\n"
            + "\n".join(parts)
        )
        chunk_count = await process_document_content(
            user_id, source_id, full_name, full_text, workspace_id
        )
        if chunk_count == 0:
            raise ValueError("Docs were empty — nothing to learn from in this repo.")

        await set_source_fields(source_id, {
            "status": "ready",
            "chunk_count": chunk_count,
            "filename": f"[GitHub] {full_name}",
            "file_size": total,
            "remote_url": final_url,
            "last_synced_at": datetime.now(timezone.utc),
            "sync_error": None,
        })
        logger.info("[OK] Synced GitHub repo %s -> %d chunks", full_name, chunk_count)
        return chunk_count
    except Exception as e:
        logger.error("[ERR] GitHub sync failed for repo %s: %s", full_name, e)
        msg = str(e)
        if "404" in msg:
            msg = "GitHub can't find this repo (access removed?). Remove it or pick it again."
        await set_source_fields(source_id, {"status": "error", "sync_error": msg[:500]})
        raise
