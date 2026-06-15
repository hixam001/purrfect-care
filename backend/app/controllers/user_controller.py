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


# ──────────────────────────────────────────────────────────────
# Save verification document storage paths to the caller's profile
# ──────────────────────────────────────────────────────────────

from pydantic import BaseModel  # noqa: E402


class VerificationDocsUpdate(BaseModel):
    verification_docs: dict  # { "label": "storagePath" }


@router.patch(
    "/me/docs",
    response_model=dict,
    summary="Save verification document paths",
    description="Saves Storage object paths to the authenticated user's verification_docs field.",
)
async def save_my_docs(
    body: VerificationDocsUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
) -> dict:
    profile = repo.find_by_user_id(current_user.id)
    if not profile:
        raise NotFoundException("User profile")

    repo.db.table("user_profiles") \
        .update({"verification_docs": body.verification_docs}) \
        .eq("id", profile["id"]) \
        .execute()

    return {"status": "saved", "docs": body.verification_docs}



# ──────────────────────────────────────────────────────────────
# Admin — Approve / Reject hospital or store accounts
# ──────────────────────────────────────────────────────────────

from app.utils.exceptions import ForbiddenException  # noqa: E402 (after router def)


@router.get(
    "/admin/pending",
    response_model=list,
    summary="List pending hospital/store accounts",
    description="Returns user_profiles where is_active=False and role in (hospital_admin, store_owner). Admin only.",
)
async def admin_list_pending(
    current_user: AuthenticatedUser = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
) -> list:
    caller_profile = repo.find_by_user_id(current_user.id)
    if not caller_profile or caller_profile.get("role") != "admin":
        raise ForbiddenException("Only system admins can view pending accounts.")

    result = (
        repo.db.table("user_profiles")
        .select("*")
        .eq("is_active", False)
        .in_("role", ["hospital_admin", "store_owner"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get(
    "/admin/{profile_id}/doc-urls",
    response_model=dict,
    summary="Get signed URLs for a user's verification documents",
    description=(
        "Admin only. Fetches the verification_docs paths from user_profiles "
        "and generates 1-hour signed download URLs via Supabase Storage."
    ),
)
async def admin_get_doc_urls(
    profile_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
) -> dict:
    caller_profile = repo.find_by_user_id(current_user.id)
    if not caller_profile or caller_profile.get("role") != "admin":
        raise ForbiddenException("Only system admins can view verification documents.")

    result = repo.db.table("user_profiles").select("verification_docs").eq("id", profile_id).execute()
    if not result.data:
        raise NotFoundException("User profile", profile_id)

    docs: dict = result.data[0].get("verification_docs") or {}
    signed_urls = {}

    for label, path in docs.items():
        try:
            signed = repo.db.storage.from_("verification-docs").create_signed_url(path, 3600)
            signed_urls[label] = signed.get("signedURL") or signed.get("signed_url") or ""
        except Exception as e:
            signed_urls[label] = f"error:{e}"

    return {"profile_id": profile_id, "docs": signed_urls}


@router.patch(
    "/admin/{profile_id}/approve",
    response_model=dict,
    summary="Approve a pending hospital or store account",
    description=(
        "Sets is_active=True on user_profiles AND sets is_approved=True on the "
        "associated cat_stores or hospitals row, depending on the user's role. Admin only."
    ),
)
async def admin_approve_user(
    profile_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
) -> dict:
    # Verify caller is a system admin
    caller_profile = repo.find_by_user_id(current_user.id)
    if not caller_profile or caller_profile.get("role") != "admin":
        raise ForbiddenException("Only system admins can approve accounts.")

    # 1. Activate the user profile
    result = (
        repo.db.table("user_profiles")
        .update({"is_active": True})
        .eq("id", profile_id)
        .execute()
    )
    if not result.data:
        raise NotFoundException("User profile", profile_id)

    approved_profile = result.data[0]
    role = approved_profile.get("role", "")

    # 2. Cascade approval to the associated business entity
    if role == "store_owner":
        repo.db.table("cat_stores") \
            .update({"is_approved": True, "is_active": True}) \
            .eq("owner_user_id", profile_id) \
            .execute()
    elif role == "hospital_admin":
        repo.db.table("hospitals") \
            .update({"is_approved": True, "is_active": True}) \
            .eq("admin_user_id", profile_id) \
            .execute()

    return {"status": "approved", "profile_id": profile_id, "role": role}


@router.patch(
    "/admin/{profile_id}/reject",
    response_model=dict,
    summary="Reject a pending hospital or store account",
    description="Sets is_active=False on the user_profiles row. Admin only.",
)
async def admin_reject_user(
    profile_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
) -> dict:
    caller_profile = repo.find_by_user_id(current_user.id)
    if not caller_profile or caller_profile.get("role") != "admin":
        raise ForbiddenException("Only system admins can reject accounts.")

    result = (
        repo.db.table("user_profiles")
        .update({"is_active": False})
        .eq("id", profile_id)
        .execute()
    )
    if not result.data:
        raise NotFoundException("User profile", profile_id)

    return {"status": "rejected", "profile_id": profile_id}


@router.get(
    "/admin/all",
    response_model=list,
    summary="List all user profiles",
    description="Admin only. Returns all user_profiles rows, optionally filtered by role.",
)
async def admin_list_all(
    role: str | None = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
) -> list:
    caller_profile = repo.find_by_user_id(current_user.id)
    if not caller_profile or caller_profile.get("role") != "admin":
        raise ForbiddenException("Only system admins can list all users.")

    query = (
        repo.db.table("user_profiles")
        .select("id,user_id,name,email,role,city,is_active,created_at,phone,address,verification_docs")
        .order("created_at", desc=True)
    )
    if role:
        query = query.eq("role", role)

    result = query.execute()
    return result.data or []
