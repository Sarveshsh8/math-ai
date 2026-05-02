import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import settings


class InternalTokenMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/api/health":
            return await call_next(request)

        expected = settings.internal_api_token
        if expected and request.headers.get("x-internal-token") != expected:
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._requests: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/api/health":
            return await call_next(request)

        limit = settings.rate_limit_per_minute
        if limit <= 0:
            return await call_next(request)

        now = time.monotonic()
        client = request.client.host if request.client else "unknown"
        window = self._requests[client]
        while window and now - window[0] > 60:
            window.popleft()

        if len(window) >= limit:
            return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)

        window.append(now)
        return await call_next(request)
