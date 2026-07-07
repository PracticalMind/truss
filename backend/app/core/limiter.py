from fastapi import Request
from slowapi import Limiter

from app.core.config import settings


def _get_client_ip(request: Request) -> str:
    hops = settings.TRUSTED_PROXY_COUNT
    if hops > 0:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            parts = [p.strip() for p in forwarded_for.split(",") if p.strip()]
            if parts:
                return parts[-min(hops, len(parts))]
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_get_client_ip)
