"""Shared MongoDB helpers for connector sync.

Free-tier MongoDB naps when idle: the first write after a pause can time out
even though the actual RAG work (embed + store vectors) already succeeded.
A stuck row then shows "syncing" forever with chunks already present.

Every status-stamp write therefore retries with backoff instead of failing
the whole import on one slow database round-trip.
"""
import asyncio
import logging
from typing import Any

from bson import ObjectId

import app.database as database

logger = logging.getLogger(__name__)


async def set_source_fields(source_id: str, fields: dict[str, Any], retries: int = 3) -> bool:
    """Best-effort $set on a source row with exponential backoff. Never raises."""
    delay = 2.0
    for attempt in range(retries):
        try:
            await database.sources_collection.update_one(
                {"_id": ObjectId(source_id)}, {"$set": fields}
            )
            return True
        except Exception as e:
            if attempt == retries - 1:
                logger.warning(
                    "[WARN] Status stamp failed for source %s after %d tries: %s",
                    source_id, retries, e,
                )
                return False
            await asyncio.sleep(delay)
            delay *= 2
    return False
