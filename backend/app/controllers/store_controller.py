"""
Store Controller
================
Backend routes for store owner operations.
Uses the service-role client to bypass RLS — store owners can always
read their own store data regardless of approval status.

Routes:
  GET  /api/store/mine        — Return own store (approved or pending)
  POST /api/store/mine/reload — Placeholder for future cache invalidation
"""

import logging
from fastapi import APIRouter, Depends

from app.database import get_supabase_client
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.utils.exceptions import ForbiddenException, NotFoundException

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _resolve_profile(db, auth_uid: str) -> dict:
    """Resolve user_profiles row from Supabase auth UID."""
    r = db.table("user_profiles").select("id, role, name, email").eq("user_id", auth_uid).maybe_single().execute()
    return r.data or {}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/mine",
    response_model=dict,
    summary="Get own store",
    description=(
        "Returns the cat_store row that belongs to the authenticated store owner. "
        "Uses the service-role client so it works regardless of approval status "
        "(RLS would hide pending stores from the anon client)."
    ),
)
async def get_my_store(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
) -> dict:
    profile = _resolve_profile(db, current_user.id)
    if not profile:
        raise NotFoundException("User profile")
    if profile.get("role") != "store_owner":
        raise ForbiddenException("Only store owners can access this endpoint.")

    store_res = (
        db.table("cat_stores")
        .select("*")
        .eq("owner_user_id", profile["id"])
        .maybe_single()
        .execute()
    )
    store = store_res.data
    if not store:
        raise NotFoundException("Store", "linked to your account")

    return store
