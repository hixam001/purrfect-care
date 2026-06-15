"""
Appointment Controller
======================
REST endpoints for appointment management.

Endpoints:
  GET  /api/appointments/mine          — Vet: list own appointments
  PATCH /api/appointments/{id}/status  — Vet/Hospital admin: update status
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.database import get_supabase_client
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.utils.exceptions import ForbiddenException, NotFoundException

logger = logging.getLogger(__name__)
router = APIRouter()


def get_db(db=Depends(get_supabase_client)):
    return db


# ── Request / Response models ─────────────────────────────────────────────────

class StatusUpdate(BaseModel):
    status: str   # confirmed | cancelled | in_progress | completed | no_show


# ── Helpers ───────────────────────────────────────────────────────────────────

def _resolve_profile(db, auth_uid: str) -> dict:
    """Fetch user_profiles row by Supabase auth UID."""
    result = db.table("user_profiles").select("*").eq("user_id", auth_uid).maybe_single().execute()
    return result.data or {}


def _resolve_vet(db, profile_id: str) -> Optional[dict]:
    """Fetch vet row by user_profiles.id (profile_id FK)."""
    result = db.table("vets").select("id, hospital_id").eq("user_id", profile_id).maybe_single().execute()
    return result.data


def _resolve_hospital_admin(db, profile_id: str) -> Optional[dict]:
    """Fetch hospital row where admin_user_id = profile_id."""
    result = db.table("hospitals").select("id").eq("admin_user_id", profile_id).maybe_single().execute()
    return result.data


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/mine",
    summary="List appointments for the logged-in vet",
    description=(
        "Returns all appointments where vet_id matches the caller's vet profile. "
        "Only accessible by users with role='vet'."
    ),
)
async def get_my_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
):
    profile = _resolve_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found.")

    role = profile.get("role")
    if role != "vet":
        raise ForbiddenException("Only vets can access /appointments/mine.")

    vet = _resolve_vet(db, profile["id"])
    if not vet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vet profile not found.")

    query = (
        db.table("appointments")
        .select(
            "id, appointment_date, status, notes, amount_paid, created_at, "
            "cats ( name, breed_id, age_months ), "
            "user_profiles ( name, email, phone ), "
            "hospitals ( name, city ), "
            "hospital_services ( name, duration_minutes ), "
            "appointment_slots ( start_time, end_time )"
        )
        .eq("vet_id", vet["id"])
        .order("appointment_date", desc=True)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()
    return result.data or []


@router.patch(
    "/{appointment_id}/status",
    summary="Update appointment status",
    description=(
        "Vets can mark appointments as in_progress, completed, or no_show. "
        "Hospital admins can confirm or cancel appointments. "
        "Returns the updated appointment."
    ),
)
async def update_appointment_status(
    appointment_id: str,
    body: StatusUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
):
    VALID_STATUSES = {"pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"}
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{body.status}'. Must be one of: {', '.join(VALID_STATUSES)}",
        )

    profile = _resolve_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found.")

    role = profile.get("role")
    profile_id = profile["id"]

    # Fetch the appointment to verify ownership
    appt_result = db.table("appointments").select("id, vet_id, hospital_id, status").eq("id", appointment_id).maybe_single().execute()
    if not appt_result.data:
        raise NotFoundException("Appointment", appointment_id)

    appt = appt_result.data

    # Role-based permission checks
    if role == "vet":
        vet = _resolve_vet(db, profile_id)
        if not vet or vet["id"] != appt["vet_id"]:
            raise ForbiddenException("You can only update your own appointments.")
        allowed = {"in_progress", "completed", "no_show"}
        if body.status not in allowed:
            raise ForbiddenException(f"Vets can only set status to: {', '.join(allowed)}")

    elif role == "hospital_admin":
        hospital = _resolve_hospital_admin(db, profile_id)
        if not hospital or hospital["id"] != appt["hospital_id"]:
            raise ForbiddenException("You can only update appointments for your hospital.")
        allowed = {"confirmed", "cancelled"}
        if body.status not in allowed:
            raise ForbiddenException(f"Hospital admins can only set status to: {', '.join(allowed)}")

    else:
        raise ForbiddenException("Only vets and hospital admins can update appointment status.")

    # Perform the update
    result = (
        db.table("appointments")
        .update({"status": body.status})
        .eq("id", appointment_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed.")

    logger.info(
        "Appointment %s status → %s (by %s role=%s)",
        appointment_id, body.status, profile_id, role,
    )
    return result.data[0]
