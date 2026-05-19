"""
Purrfect Care — Rate Limiter Middleware

Uses slowapi for per-IP rate limiting on API endpoints.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.requests import Request


# Create limiter instance with default limit
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


def register_rate_limiter(app: FastAPI) -> None:
    """Register rate limiter on the FastAPI application."""
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={
                "error": True,
                "error_code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please try again later.",
            },
        )
