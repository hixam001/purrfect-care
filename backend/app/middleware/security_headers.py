"""
Purrfect Care — Security Headers Middleware
============================================

Adds HTTP security headers to every response:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security (HTTPS only)
  - Content-Security-Policy (restrictive default for a pure API)
  - Referrer-Policy
  - Permissions-Policy (disable camera/mic/location access from the API)

Also removes the 'server' header to avoid fingerprinting.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects security headers on every HTTP response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Legacy XSS filter (belt-and-suspenders for old browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Force HTTPS for 1 year (only meaningful in production)
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

        # Minimal CSP — this is a pure API, so lock down everything
        response.headers["Content-Security-Policy"] = "default-src 'none'"

        # Don't leak the referrer
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Disable browser features the API doesn't need
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Remove server fingerprint — MutableHeaders uses del, not pop
        try:
            del response.headers["server"]
        except KeyError:
            pass
        try:
            del response.headers["Server"]
        except KeyError:
            pass

        return response
