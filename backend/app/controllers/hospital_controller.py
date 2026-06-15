"""
Hospital Controller
===================
Endpoints for hospital management, including vet registration.

Routes:
  POST /api/hospitals/vets  — Hospital admin registers a new vet account
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.database import get_supabase_client
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.utils.exceptions import ForbiddenException

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Models ────────────────────────────────────────────────────────────────────

class VetRegisterRequest(BaseModel):
    name:             str
    email:            EmailStr
    password:         str
    phone:            Optional[str] = None
    specialization:   str
    license_number:   str
    experience_years: Optional[int] = None
    bio:              Optional[str] = None
    consultation_fee: Optional[float] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_caller_profile(db, auth_uid: str) -> dict:
    result = db.table("user_profiles").select("*").eq("user_id", auth_uid).maybe_single().execute()
    return result.data or {}


def _get_hospital_for_admin(db, profile_id: str) -> Optional[dict]:
    result = db.table("hospitals").select("id, name").eq("admin_user_id", profile_id).maybe_single().execute()
    return result.data


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/vets",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new vet for this hospital",
    description=(
        "Hospital admin creates a vet account. Uses the Supabase Admin API "
        "(service role) to create the Supabase Auth user with the provided "
        "password — so the hospital admin's own session is unaffected and no "
        "email verification is required. The vet can immediately log in via "
        "the normal login page."
    ),
)
async def register_vet(
    body: VetRegisterRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db=Depends(get_supabase_client),
):
    # 1. Verify caller is a hospital_admin
    caller = _get_caller_profile(db, current_user.id)
    if not caller or caller.get("role") != "hospital_admin":
        raise ForbiddenException("Only hospital admins can register vets.")

    # 2. Get this admin's hospital
    hospital = _get_hospital_for_admin(db, caller["id"])
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hospital found for this admin account.",
        )

    hospital_id = hospital["id"]

    # 3. Create Supabase Auth user using Admin API (service role key bypasses
    #    email confirmation and doesn't affect the caller's session)
    try:
        auth_result = db.auth.admin.create_user({
            "email":            body.email,
            "password":         body.password,
            "email_confirm":    True,   # Mark email as confirmed immediately
            "user_metadata":    {"name": body.name},
        })
    except Exception as exc:
        err_msg = str(exc)
        logger.error("Supabase admin create_user failed: %s", err_msg)
        if "already registered" in err_msg or "already exists" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Auth user creation failed: {err_msg}",
        )

    auth_user = auth_result.user
    if not auth_user:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Auth user creation returned no user.",
        )

    auth_uid = auth_user.id

    # 4. Create user_profiles row
    try:
        profile_result = db.table("user_profiles").insert({
            "user_id":   auth_uid,
            "name":      body.name,
            "email":     body.email,
            "phone":     body.phone,
            "role":      "vet",
            "is_active": True,
        }).select().execute()
    except Exception as exc:
        # Rollback: delete the auth user we just created
        try:
            db.auth.admin.delete_user(auth_uid)
        except Exception:
            pass
        logger.error("Failed to create user_profiles for vet: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile creation failed: {exc}",
        )

    if not profile_result.data:
        try:
            db.auth.admin.delete_user(auth_uid)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile creation returned no data.",
        )

    profile = profile_result.data[0]
    profile_id = profile["id"]

    # 5. Create vets row
    try:
        vet_result = db.table("vets").insert({
            "user_id":          profile_id,
            "hospital_id":      hospital_id,
            "specialization":   body.specialization,
            "license_number":   body.license_number,
            "experience_years": body.experience_years,
            "bio":              body.bio,
            "consultation_fee": body.consultation_fee,
            "is_verified":      True,
        }).select().execute()
    except Exception as exc:
        logger.error("Failed to create vet record: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vet record creation failed: {exc}",
        )

    vet = vet_result.data[0] if vet_result.data else {}

    logger.info(
        "Vet registered: profile_id=%s hospital_id=%s email=%s",
        profile_id, hospital_id, body.email,
    )

    return {
        "message":    "Vet registered successfully. They can log in immediately.",
        "vet_id":     vet.get("id"),
        "profile_id": profile_id,
        "name":       body.name,
        "email":      body.email,
        "hospital":   hospital["name"],
    }
