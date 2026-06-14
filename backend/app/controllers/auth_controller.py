"""
Purrfect Care — Auth Controller

Handles all routes under /api/auth:
  POST   /api/auth/register        — Register a new user
  POST   /api/auth/login           — Login and obtain JWT
  POST   /api/auth/logout          — Invalidate session
  POST   /api/auth/refresh         — Refresh access token
  POST   /api/auth/password-reset  — Request password reset email
  GET    /api/auth/me              — Get current user profile

All endpoints wire up AuthService via FastAPI's dependency injection,
making them trivially testable by overriding the get_auth_service dep.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from app.database import get_supabase_client, get_supabase_anon_client
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.middleware.rate_limiter import limit_auth, limit_strict
from app.models.user import UserCreate, UserLoginRequest, UserLoginResponse, UserResponse
from app.services.auth_service import AuthService
from app.utils.exceptions import (
    AppException,
    ConflictException,
    UnauthorizedException,
    ExternalServiceException,
)

logger = logging.getLogger("purrfect_care.auth_controller")

router   = APIRouter()
security = HTTPBearer()


# ──────────────────────────────────────────────────────────
# Dependency: build AuthService from the two Supabase clients
# ──────────────────────────────────────────────────────────

def get_auth_service(
    anon_client=Depends(get_supabase_anon_client),
    service_client=Depends(get_supabase_client),
) -> AuthService:
    """
    FastAPI dependency that constructs an AuthService.
    Receives Supabase clients via DI so they can be overridden in tests.
    """
    return AuthService(anon_client=anon_client, service_client=service_client)


# ──────────────────────────────────────────────────────────
# Request / Response helpers
# ──────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


# ──────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserLoginResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Creates a new Supabase auth account and a linked user_profiles record. "
        "Returns JWT access + refresh tokens alongside the created user profile."
    ),
)
@limit_auth
async def register(
    request: Request,
    response: Response,
    body: UserCreate,
    service: AuthService = Depends(get_auth_service),
) -> UserLoginResponse:
    return service.register_user(body)


@router.post(
    "/login",
    response_model=UserLoginResponse,
    summary="Login with email and password",
    description="Authenticates the user against Supabase and returns JWT tokens.",
)
@limit_auth
async def login(
    request: Request,
    response: Response,
    body: UserLoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> UserLoginResponse:
    return service.login_user(body)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout — invalidate current session",
    description=(
        "Signs out the user from Supabase Auth. "
        "The client should discard locally stored tokens after calling this."
    ),
)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    service: AuthService = Depends(get_auth_service),
) -> dict:
    service.logout_user(credentials.credentials)
    return {"message": "Logged out successfully"}


@router.post(
    "/refresh",
    response_model=UserLoginResponse,
    summary="Refresh access token",
    description="Exchanges a valid refresh token for a new access token and refresh token pair.",
)
@limit_auth
async def refresh(
    request: Request,
    response: Response,
    body: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> UserLoginResponse:
    return service.refresh_session(body.refresh_token)


@router.post(
    "/password-reset",
    status_code=status.HTTP_200_OK,
    summary="Request a password reset email",
    description=(
        "Triggers a password reset email via Supabase. "
        "Always returns 200 regardless of whether the email is registered "
        "(prevents account enumeration)."
    ),
)
@limit_strict
async def password_reset(
    request: Request,
    response: Response,
    body: PasswordResetRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    service.request_password_reset(str(body.email))
    return {"message": "If that email is registered, a reset link has been sent."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the authenticated user's full domain profile from user_profiles.",
)
async def get_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    return service.get_current_profile(current_user.id)
