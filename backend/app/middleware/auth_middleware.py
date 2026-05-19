"""
Purrfect Care — JWT Authentication Middleware

Verifies the Supabase JWT from the Authorization header and
extracts the authenticated user's id and role.
Used as a FastAPI dependency on protected routes.
"""

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import get_settings, Settings
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
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    """
    FastAPI dependency that:
    1. Extracts the Bearer token from the Authorization header
    2. Verifies it against Supabase Auth
    3. Returns an AuthenticatedUser with id, email, and role

    Usage:
        @router.get("/protected")
        async def protected_route(user: AuthenticatedUser = Depends(get_current_user)):
            ...
    """
    token = credentials.credentials

    try:
        # Verify the JWT using Supabase's dedicated JWT secret
        # Found in Supabase Dashboard > Settings > API > JWT Secret
        jwt_secret = settings.SUPABASE_JWT_SECRET or settings.SUPABASE_ANON_KEY
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise UnauthorizedException(f"Invalid or expired token: {str(e)}")

    user_id = payload.get("sub")
    email = payload.get("email", "")

    if not user_id:
        raise UnauthorizedException("Invalid token: missing user ID")

    # Fetch the user's role from our users table
    db = get_supabase_client()
    result = db.table("users").select("role").eq("id", user_id).single().execute()

    if not result.data:
        raise UnauthorizedException("User not found in database")

    role = result.data.get("role", "cat_owner")

    return AuthenticatedUser(id=user_id, email=email, role=role)


async def get_optional_user(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser | None:
    """
    Optional authentication — returns None if no token is provided.
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    try:
        token = auth_header.split(" ")[1]
        jwt_secret = settings.SUPABASE_JWT_SECRET or settings.SUPABASE_ANON_KEY
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        email = payload.get("email", "")
        if not user_id:
            return None

        db = get_supabase_client()
        result = db.table("users").select("role").eq("id", user_id).single().execute()
        if not result.data:
            return None

        return AuthenticatedUser(
            id=user_id,
            email=email,
            role=result.data.get("role", "cat_owner"),
        )
    except (JWTError, Exception):
        return None
