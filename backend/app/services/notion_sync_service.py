"""Notion sync: fetch page blocks (rate-limited) -> markdown -> reuse RAG pipeline.

Rate limit: Notion allows ~3 requests/sec per integration.
We enforce with asyncio.Semaphore(3) + tenacity retry on 429/5xx.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

from app.services.rag_service import process_document_content

logger = logging.getLogger(__name__)

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

# Global semaphore: max 3 concurrent Notion API calls per worker.
_notion_semaphore = asyncio.Semaphore(3)


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in (429, 500, 502, 503, 504)
    return isinstance(exc, httpx.TransportError)


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=16),
    retry=retry_if_exception(_is_retryable),
    reraise=True,
)
async def _notion_get(client: httpx.AsyncClient, url: str, token: str, params: dict | None = None) -> dict:
    async with _notion_semaphore:
        resp = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Notion-Version": NOTION_VERSION,
            },
            params=params,
            timeout=30.0,
        )
        if resp.status_code in (429, 500, 502, 503, 504):
            raise httpx.HTTPStatusError(
                f"Retryable Notion status {resp.status_code}",
                request=resp.request,
                response=resp,
            )
        resp.raise_for_status()
        return resp.json()


async def fetch_page_title(client: httpx.AsyncClient, page_id: str, token: str) -> tuple[str, Optional[str]]:
    """Return (title, url) for a Notion page."""
    data = await _notion_get(client, f"{NOTION_API_BASE}/pages/{page_id}", token)
    props = data.get("properties", {})
    title = "Untitled"
    for prop in props.values():
        if prop.get("type") == "title":
            parts = prop.get("title", [])
            title = "".join(p.get("plain_text", "") for p in parts).strip() or "Untitled"
            break
    return title, data.get("url")


async def fetch_all_blocks(client: httpx.AsyncClient, block_id: str, token: str) -> list[dict]:
    """Paginate through all children blocks (handles nesting one level)."""
    blocks: list[dict] = []
    cursor: Optional[str] = None
    while True:
        params = {"page_size": 100}
        if cursor:
            params["start_cursor"] = cursor
        data = await _notion_get(
            client, f"{NOTION_API_BASE}/blocks/{block_id}/children", token, params
        )
        batch = data.get("results", [])
        blocks.extend(batch)
        # Fetch nested children for blocks that have them (one level deep is enough for v1)
        for b in batch:
            if b.get("has_children"):
                try:
                    children = await _notion_get(
                        client, f"{NOTION_API_BASE}/blocks/{b['id']}/children", token,
                        {"page_size": 50},
                    )
                    b["_children"] = children.get("results", [])
                except Exception as e:
                    logger.warning("Failed to fetch nested blocks for %s: %s", b.get("id"), e)
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
        if not cursor:
            break
    return blocks


def _rich_text_to_markdown(rich_text: list[dict]) -> str:
    parts: list[str] = []
    for t in rich_text or []:
        text = t.get("plain_text", "")
        href = t.get("href")
        annotations = t.get("annotations", {})
        if annotations.get("code"):
            text = f"`{text}`"
        if annotations.get("bold"):
            text = f"**{text}**"
        if annotations.get("italic"):
            text = f"*{text}*"
        if href:
            text = f"[{text}]({href})"
        parts.append(text)
    return "".join(parts)


def blocks_to_markdown(blocks: list[dict]) -> str:
    """Convert Notion blocks to markdown plain text for chunking."""
    lines: list[str] = []
    for b in blocks:
        btype = b.get("type", "")
        data = b.get(btype, {}) if btype else {}
        rich = data.get("rich_text", []) if isinstance(data, dict) else []
        text = _rich_text_to_markdown(rich)
        if btype in ("heading_1",):
            lines.append(f"# {text}")
        elif btype == "heading_2":
            lines.append(f"## {text}")
        elif btype == "heading_3":
            lines.append(f"### {text}")
        elif btype == "bulleted_list_item":
            lines.append(f"- {text}")
        elif btype == "numbered_list_item":
            lines.append(f"1. {text}")
        elif btype == "to_do":
            checked = data.get("checked") if isinstance(data, dict) else False
            lines.append(f"- [{'x' if checked else ' '}] {text}")
        elif btype == "quote":
            lines.append(f"> {text}")
        elif btype == "code":
            lang = data.get("language", "") if isinstance(data, dict) else ""
            lines.append(f"```{lang}\n{text}\n```")
        elif btype == "divider":
            lines.append("---")
        elif btype in ("paragraph", "callout", "toggleable_heading_1"):
            if text.strip():
                lines.append(text)
        for child in b.get("_children", []) or []:
            child_md = blocks_to_markdown([child])
            if child_md.strip():
                lines.append(child_md)
    return "\n\n".join([ln for ln in lines if ln.strip()])


async def sync_notion_page(
    user_id: str,
    workspace_id: Optional[str],
    source_id: str,
    page_id: str,
    token: str,
    title_override: Optional[str] = None,
    page_url: Optional[str] = None,
) -> int:
    """Fetch a Notion page + blocks, convert to markdown, index via shared RAG pipeline."""
    from app.services.sync_db import set_source_fields

    await set_source_fields(source_id, {"status": "syncing", "sync_error": None})

    try:
        async with httpx.AsyncClient() as client:
            title, fetched_url = await fetch_page_title(client, page_id, token)
            blocks = await fetch_all_blocks(client, page_id, token)
        markdown = blocks_to_markdown(blocks)
        final_title = title_override or title
        final_url = page_url or fetched_url
        header = f"# {final_title}\n\nSource: Notion\n"
        if final_url:
            header += f"URL: {final_url}\n\n"
        full_text = header + (markdown or "(Empty page — no text content found.)")

        chunk_count = await process_document_content(
            user_id, source_id, final_title, full_text, workspace_id
        )

        await set_source_fields(source_id, {
            "status": "ready",
            "chunk_count": chunk_count,
            "filename": f"[Notion] {final_title}",
            "last_synced_at": datetime.now(timezone.utc),
            "sync_error": None,
        })
        logger.info("[OK] Synced Notion page %s -> %d chunks", page_id, chunk_count)
        return chunk_count
    except Exception as e:
        logger.error("[ERR] Notion sync failed for page %s: %s", page_id, e)
        await set_source_fields(source_id, {"status": "error", "sync_error": str(e)[:500]})
        raise
