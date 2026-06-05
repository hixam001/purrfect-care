"""
Purrfect Care — User Controller

Handles all routes under /api/users:
  PUT  /api/users/me  — Update the authenticated user's profile

Profile updates are restricted to the authenticated user's own record
(enforced by extracting the profile ID from the JWT via get_current_user).
"""

import logging

from fastapi import APIRouter, Depends, status

from app.database import get_supabase_client
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.models.user import UserResponse, UserUpdate
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService
from app.utils.exceptions import NotFoundException

logger = logging.getLogger("purrfect_care.user_controller")

router = APIRouter()


# ──────────────────────────────────────────────────────────────
# Dependencies
# ──────────────────────────────────────────────────────────────

def get_user_service(
    service_client=Depends(get_supabase_client),
) -> UserService:
    """
    FastAPI dependency that constructs a UserService.
    Receives the Supabase service client via DI so it can be
    overridden in tests without touching any real Supabase connection.
    """
    return UserService(service_client=service_client)


def get_user_repository(
    service_client=Depends(get_supabase_client),
) -> UserRepository:
    """
    FastAPI dependency that constructs a UserRepository.
    Used to resolve the domain profile ID from the auth user ID.
    """
    return UserRepository(service_client)


# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update my profile",
    description=(
        "Updates the authenticated user's profile. "
        "All fields are optional — only supplied fields are changed. "
        "Returns the full updated profile."
    ),
)
async def update_my_profile(
    body: UserUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
    repo: UserRepository = Depends(get_user_repository),
) -> UserResponse:
    # Resolve the domain profile ID from the auth user ID (JWT sub)
    profile = repo.find_by_user_id(current_user.id)
    if not profile:
        raise NotFoundException("User profile")

    return service.update_profile(profile["id"], body)
