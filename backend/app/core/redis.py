import asyncio
import gzip
import base64
import json
import logging
import redis.asyncio as aioredis
import pandas as pd
from io import StringIO
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None
_background_tasks: set[asyncio.Task] = set()


def _enabled() -> bool:
    return bool(settings.REDIS_URL)


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


def _on_task_done(task: asyncio.Task) -> None:
    _background_tasks.discard(task)
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        logger.error(f"Background storage task failed: {exc!r}")


def _spawn(coro) -> None:
    task = asyncio.create_task(coro)
    _background_tasks.add(task)
    task.add_done_callback(_on_task_done)


def _compress(s: str) -> str:
    return base64.b64encode(gzip.compress(s.encode(), compresslevel=6)).decode()


def _decompress(s: str) -> str:
    try:
        return gzip.decompress(base64.b64decode(s.encode())).decode()
    except Exception:
        return s


async def get_dataframe(project_id: str) -> pd.DataFrame | None:
    if not _enabled():
        return None
    data = await get_redis().get(f"df:{project_id}")
    if data is None:
        return None
    return pd.read_json(StringIO(_decompress(data)), orient="split")


async def _delete_correlation_keys(project_id: str) -> None:
    r = get_redis()
    keys = await r.keys(f"correlation:{project_id}:*")
    if keys:
        await r.delete(*keys)


async def set_dataframe(project_id: str, df: pd.DataFrame, ttl: int = 86400, *, sync_storage: bool = True) -> None:
    if _enabled():
        payload = _compress(df.to_json(orient="split"))
        r = get_redis()
        pipe = r.pipeline()
        pipe.setex(f"df:{project_id}", ttl, payload)
        pipe.delete(f"analysis:{project_id}")
        await pipe.execute()
        await _delete_correlation_keys(project_id)
    if sync_storage:
        from app.core.storage import upload_dataset
        csv_bytes = df.to_csv(index=False).encode()
        _spawn(upload_dataset(project_id, csv_bytes))


async def delete_dataframe(project_id: str) -> None:
    if not _enabled():
        return
    r = get_redis()
    corr_keys = await r.keys(f"correlation:{project_id}:*")
    keys_to_delete = [f"df:{project_id}", f"meta:{project_id}", f"analysis:{project_id}", f"tags:{project_id}"]
    if corr_keys:
        keys_to_delete.extend(corr_keys)
    await r.delete(*keys_to_delete)


async def get_analysis_cache(project_id: str) -> list[Any] | None:
    if not _enabled():
        return None
    data = await get_redis().get(f"analysis:{project_id}")
    if data is None:
        return None
    return json.loads(data)


async def set_analysis_cache(project_id: str, analysis: list[Any], ttl: int = 86400) -> None:
    if not _enabled():
        return
    await get_redis().setex(f"analysis:{project_id}", ttl, json.dumps(analysis))


async def get_correlation_cache(project_id: str, method: str = "pearson") -> dict | None:
    if not _enabled():
        return None
    data = await get_redis().get(f"correlation:{project_id}:{method}")
    if data is None:
        return None
    return json.loads(data)


async def set_correlation_cache(project_id: str, payload: dict, method: str = "pearson", ttl: int = 86400) -> None:
    if not _enabled():
        return
    await get_redis().setex(f"correlation:{project_id}:{method}", ttl, json.dumps(payload))


async def get_column_tags(project_id: str) -> dict[str, list[str]]:
    if not _enabled():
        return {}
    data = await get_redis().get(f"tags:{project_id}")
    if data is None:
        return {}
    return json.loads(data)


async def set_column_tags(project_id: str, tags: dict[str, list[str]], ttl: int = 86400) -> None:
    if not _enabled():
        return
    await get_redis().setex(f"tags:{project_id}", ttl, json.dumps(tags))


async def acquire_training_lock(project_id: str, ttl: int = 300) -> bool:
    if not _enabled():
        return True
    result = await get_redis().set(f"training_lock:{project_id}", "1", ex=ttl, nx=True)
    return result is True


async def release_training_lock(project_id: str) -> None:
    if not _enabled():
        return
    await get_redis().delete(f"training_lock:{project_id}")
