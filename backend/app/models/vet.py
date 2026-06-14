"""
Purrfect Care — Vet Models

Covers: vets table (Participant domain)
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 7)
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Vet Models
# ──────────────────────────────────────────

class VetBase(BaseModel):
    license_number:   str   = Field(..., min_length=1, max_length=50)
    specialization:   str | None = Field(None, max_length=100)
    experience_years: int | None = Field(None, ge=0)
    bio:              str | None = None
    qualifications:   list[str] = Field(default_factory=list)
    hospital_id:      str | None = None


class VetCreate(VetBase):
    """Request body — POST /api/vets (called at registration if role=vet)."""
    user_id: str | None = None  # injected from auth context in controller


class VetUpdate(BaseModel):
    specialization:   str | None = Field(None, max_length=100)
    experience_years: int | None = Field(None, ge=0)
    bio:              str | None = None
    qualifications:   list[str] | None = None
    hospital_id:      str | None = None


class VetResponse(VetBase):
    id:           str
    user_id:      str
    is_verified:  bool
    rating:       float
    total_reviews: int
    verified_at:  datetime | None = None

    model_config = {"from_attributes": True}
