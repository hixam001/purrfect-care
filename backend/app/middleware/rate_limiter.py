"""
Purrfect Care — Custom Rate Limiter
=====================================

A zero-dependency, in-memory sliding-window rate limiter implemented as a
pure ASGI middleware.  No slowapi / anyio task-group issues; compatible with
the asyncio.run() ASGI bridge used by Firebase Cloud Functions (Gen 2).

Rate Tiers
----------
| Tier      | Limit        | Path prefix          |
|-----------|--------------|----------------------|
| Strict    | 5 / minute   | /api/auth/password-* |
| Auth      | 15 / minute  | /api/auth/*          |
| AI        | 20 / minute  | /api/ai/*            |
| Global    | 200 / minute | everything else      |

Implementation: sliding window counter keyed on (client_ip, route_tier).
Uses collections.deque of timestamps — O(1) amortised per request.
Thread-safe enough for single-threaded async execution (no true threading).
"""

import time
from collections import defaultdict, deque
from typing import Callable

from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send


# Tier definitions: (path_prefix, max_requests, window_seconds) Evaluated in order; first match wins.
_TIERS = [
    ("/api/auth/password",  5,   60),   # strict — password reset
    ("/api/auth",          15,   60),   # auth endpoints
    ("/api/ai",            20,   60),   # Gemini / RAG
    ("/",                 200,   60),   # global fallback
]

# Sliding-window store: {(ip, tier_prefix): deque[timestamp_float]}
_windows: dict[tuple, deque] = defaultdict(deque)


def _get_tier(path: str):
    """Return (prefix, limit, window) for the given request path."""
    for prefix, limit, window in _TIERS:
        if path.startswith(prefix):
            return prefix, limit, window
    return "/", 200, 60


def _client_ip(scope: Scope) -> str:
    """Extract best-effort client IP from ASGI scope headers."""
    headers = dict(scope.get("headers", []))
    for header in (b"x-forwarded-for", b"x-real-ip"):
        val = headers.get(header)
        if val:
            return val.decode().split(",")[0].strip()
    client = scope.get("client")
    return client[0] if client else "unknown"


def _is_rate_limited(ip: str, prefix: str, limit: int, window: int) -> tuple[bool, int]:
    """
    Sliding-window check.
    Returns (limited: bool, retry_after_seconds: int).
    """
    key = (ip, prefix)
    now = time.monotonic()
    cutoff = now - window

    dq = _windows[key]

    # Evict timestamps outside the window
    while dq and dq[0] < cutoff:
        dq.popleft()

    if len(dq) >= limit:
        retry_after = int(window - (now - dq[0])) + 1
        return True, retry_after

    dq.append(now)
    return False, 0


class RateLimitMiddleware:
    """
    Pure ASGI middleware — no BaseHTTPMiddleware, no anyio task groups.
    Compatible with asyncio.run() inside Firebase Cloud Functions.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path   = scope.get("path", "/")
        ip     = _client_ip(scope)
        prefix, limit, window = _get_tier(path)

        limited, retry_after = _is_rate_limited(ip, prefix, limit, window)

        if limited:
            response = JSONResponse(
                status_code=429,
                content={
                    "detail": (
                        f"Rate limit exceeded. "
                        f"Try again in {retry_after} second(s)."
                    )
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Window": f"{window}s",
                },
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)


# Decorators kept as no-ops so controller signatures are unchanged. Rate limiting is now entirely handled by RateLimitMiddleware above.
def _noop(fn: Callable) -> Callable:
    return fn


limit_auth    = _noop
limit_ai      = _noop
limit_strict  = _noop
limit_payment = _noop


def register_rate_limiter(app) -> None:
    """Register the rate-limit middleware on the FastAPI app."""
    app.add_middleware(RateLimitMiddleware)
