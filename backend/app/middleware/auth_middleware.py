"""
Purrfect Care — JWT Authentication Middleware

Verifies the Supabase JWT by calling Supabase Auth's get_user endpoint
(algorithm-agnostic — works with HS256 and ES256 tokens alike).
Extracts the authenticated user's id, email, and platform role.
Used as a FastAPI dependency on protected routes.
"""

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import get_supabase_client
from app.utils.exceptions import UnauthorizedException

# FastAPI security scheme — extracts Bearer token from header
security = HTTPBearer()


class AuthenticatedUser:
    """Represents the currently authenticated user extracted from JWT."""

    def __init__(self, id: str, email: str, role: str):
        self.id = id
        self.email = email
        self.role = role

    def __repr__(self) -> str:
        return f"AuthenticatedUser(id={self.id}, email={self.email}, role={self.role})"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    """
    FastAPI dependency that:
    1. Extracts the Bearer token from the Authorization header.
    2. Verifies it via Supabase Auth's get_user API (supports ES256 and HS256).
    3. Fetches the caller's domain role from user_profiles.
    4. Returns an AuthenticatedUser with id, email, and role.
    """
    token = credentials.credentials
    db = get_supabase_client()

    # ── Step 1: Verify token via Supabase Auth (algorithm-agnostic) ──
    try:
        user_response = db.auth.get_user(token)
    except Exception as e:
        raise UnauthorizedException(f"Invalid or expired token: {str(e)}")

    if not user_response or not user_response.user:
        raise UnauthorizedException("Invalid or expired token")

    supabase_user = user_response.user
    user_id = supabase_user.id
    email = supabase_user.email or ""

    # ── Step 2: Fetch platform role from user_profiles ──
    try:
        result = (
            db.table("user_profiles")
            .select("role")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise UnauthorizedException(f"Could not fetch user profile: {str(e)}")

    if not result.data:
        raise UnauthorizedException("User profile not found")

    role = result.data.get("role", "cat_owner")

    return AuthenticatedUser(id=user_id, email=email, role=role)


async def get_optional_user(
    request: Request,
) -> AuthenticatedUser | None:
    """
    Optional authentication — returns None if no valid token is provided.
    Useful for endpoints that behave differently for authenticated vs anonymous users.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    db = get_supabase_client()

    try:
        user_response = db.auth.get_user(token)
        if not user_response or not user_response.user:
            return None

        user_id = user_response.user.id
        email = user_response.user.email or ""

        result = (
            db.table("user_profiles")
            .select("role")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not result.data:
            return None

        return AuthenticatedUser(
            id=user_id,
            email=email,
            role=result.data.get("role", "cat_owner"),
        )
    except Exception:
        return None
