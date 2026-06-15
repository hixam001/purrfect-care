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


@router.get(
    "/{appointment_id}",
    summary="Get a single appointment (participant only)",
    description=(
        "Returns appointment details including vet name, hospital, and cat. "
        "Accessible by the cat owner or the assigned vet. Uses service-role "
        "client so it is not blocked by user_profiles RLS."
    ),
)
async def get_appointment(
    appointment_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
):
    # Resolve profile from auth UID
    profile = _resolve_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    profile_id = profile["id"]
    role       = profile.get("role")

    # Fetch appointment (service role — bypasses all RLS)
    result = (
        db.table("appointments")
        .select(
            "id, status, user_id, vet_id, amount_paid, appointment_date, notes, "
            "cats ( name ), "
            "hospitals ( id, name, city ), "
            "hospital_services ( name ), "
            "vets ( id, user_profiles ( id, name, avatar_url ) )"
        )
        .eq("id", appointment_id)
        .maybe_single()
        .execute()
    )
    appt = result.data
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    # Participant check: cat owner OR assigned vet
    is_owner = appt["user_id"] == profile_id
    is_vet   = False
    if role == "vet":
        vet = _resolve_vet(db, profile_id)
        is_vet = vet is not None and vet["id"] == appt["vet_id"]

    if not is_owner and not is_vet:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant.")

    # Flatten vet name from nested user_profiles
    vet_data  = appt.pop("vets", None) or {}
    vet_prof  = vet_data.pop("user_profiles", None) or {}
    return {
        **appt,
        "vet_name":       vet_prof.get("name", "Veterinarian"),
        "vet_avatar_url": vet_prof.get("avatar_url"),
        "vet_db_id":      vet_data.get("id"),  # vets.id for participant check in frontend
    }


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


# ── Chat Room + Messages ──────────────────────────────────────────────────────

class MessageBody(BaseModel):
    content: str
    message_type: str = "text"


def _verify_participant(db, appointment_id: str, profile_id: str, role: str) -> dict:
    """Return appointment if caller is a participant, else raise 403."""
    result = db.table("appointments").select("id, user_id, vet_id, status") \
        .eq("id", appointment_id).maybe_single().execute()
    appt = result.data
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    is_owner = appt["user_id"] == profile_id
    is_vet   = False
    if role == "vet":
        vet = _resolve_vet(db, profile_id)
        is_vet = vet is not None and vet["id"] == appt["vet_id"]
    if not is_owner and not is_vet:
        raise HTTPException(status_code=403, detail="Not a participant.")
    return appt


@router.get(
    "/{appointment_id}/chat-room",
    summary="Get or create the chat room for an appointment",
)
async def get_or_create_chat_room(
    appointment_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
):
    profile    = _resolve_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    profile_id = profile["id"]
    role       = profile.get("role", "")

    appt = _verify_participant(db, appointment_id, profile_id, role)

    # Get existing room
    room_res = db.table("chat_rooms").select("*") \
        .eq("appointment_id", appointment_id).maybe_single().execute()
    room = room_res.data

    if not room:
        # Create room (service role — bypasses RLS)
        ins = db.table("chat_rooms").insert({
            "user_id":        appt["user_id"],
            "vet_id":         appt["vet_id"],
            "appointment_id": appointment_id,
        }).select().execute()
        room = ins.data[0] if ins.data else None

    if not room:
        raise HTTPException(status_code=500, detail="Could not create chat room.")

    return room


@router.get(
    "/{appointment_id}/messages",
    summary="Load all messages for an appointment's chat room",
)
async def get_messages(
    appointment_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
):
    profile    = _resolve_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    profile_id = profile["id"]
    role       = profile.get("role", "")

    _verify_participant(db, appointment_id, profile_id, role)

    # Find the chat room
    room_res = db.table("chat_rooms").select("id") \
        .eq("appointment_id", appointment_id).maybe_single().execute()
    if not room_res.data:
        return []   # No room yet — no messages

    room_id = room_res.data["id"]

    msgs_res = db.table("messages") \
        .select("id, content, sent_at, message_type, sender_id, user_profiles(id, name)") \
        .eq("chat_room_id", room_id) \
        .order("sent_at", desc=False) \
        .execute()
    return msgs_res.data or []


@router.post(
    "/{appointment_id}/messages",
    status_code=201,
    summary="Send a message in an appointment's chat room",
)
async def send_message(
    appointment_id: str,
    body: MessageBody,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
):
    if not body.content.strip():
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    profile    = _resolve_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    profile_id = profile["id"]
    role       = profile.get("role", "")

    _verify_participant(db, appointment_id, profile_id, role)

    # Ensure room exists
    room_res = db.table("chat_rooms").select("id") \
        .eq("appointment_id", appointment_id).maybe_single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Chat room not found.")

    room_id = room_res.data["id"]

    # Insert message (service role — bypasses messages RLS)
    ins = db.table("messages").insert({
        "chat_room_id": room_id,
        "sender_id":    profile_id,
        "content":      body.content.strip(),
        "message_type": body.message_type,
    }).select().execute()

    if not ins.data:
        raise HTTPException(status_code=500, detail="Failed to send message.")

    # Update last_message_at on the room
    db.table("chat_rooms") \
        .update({"last_message_at": ins.data[0]["sent_at"]}) \
        .eq("id", room_id).execute()

    return ins.data[0]
