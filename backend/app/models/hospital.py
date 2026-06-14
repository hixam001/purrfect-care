"""
Purrfect Care — Hospital & HospitalService Models

Covers: hospitals, hospital_services tables (Place domain)
Enums: ServiceCategory
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 8-9)
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class ServiceCategory(str, Enum):
    CHECKUP     = "checkup"
    VACCINATION = "vaccination"
    SURGERY     = "surgery"
    TREATMENT   = "treatment"
    DENTAL      = "dental"
    GROOMING    = "grooming"
    EMERGENCY   = "emergency"


# ──────────────────────────────────────────
# HospitalService Models
# ──────────────────────────────────────────

class HospitalServiceBase(BaseModel):
    name:             str   = Field(..., max_length=100)
    description:      str | None = None
    category:         ServiceCategory | None = None
    price:            float = Field(..., gt=0)
    duration_minutes: int   = Field(30, ge=5)
    is_active:        bool  = True


class HospitalServiceCreate(HospitalServiceBase):
    hospital_id: str | None = None  # injected from URL path in controller


class HospitalServiceUpdate(BaseModel):
    name:             str | None = Field(None, max_length=100)
    description:      str | None = None
    category:         ServiceCategory | None = None
    price:            float | None = Field(None, gt=0)
    duration_minutes: int | None = Field(None, ge=5)
    is_active:        bool | None = None


class HospitalServiceResponse(HospitalServiceBase):
    id:          str
    hospital_id: str

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Hospital Models
# ──────────────────────────────────────────

class HospitalBase(BaseModel):
    name:            str   = Field(..., max_length=200)
    description:     str | None = None
    phone:           str | None = Field(None, max_length=20)
    email:           EmailStr | None = None
    address:         str   = Field(..., min_length=1)
    city:            str | None = Field(None, max_length=100)
    banner_url:      str | None = None
    operating_hours: dict[str, Any] | None = None


class HospitalCreate(HospitalBase):
    """Request body — POST /api/hospitals/register"""
    latitude:  float = Field(..., ge=-90,  le=90)
    longitude: float = Field(..., ge=-180, le=180)


class HospitalUpdate(BaseModel):
    name:            str | None = Field(None, max_length=200)
    description:     str | None = None
    phone:           str | None = Field(None, max_length=20)
    email:           EmailStr | None = None
    address:         str | None = None
    city:            str | None = Field(None, max_length=100)
    banner_url:      str | None = None
    operating_hours: dict[str, Any] | None = None
    page_config:     dict[str, Any] | None = None
    latitude:        float | None = Field(None, ge=-90,  le=90)
    longitude:       float | None = Field(None, ge=-180, le=180)


class HospitalResponse(HospitalBase):
    id:            str
    admin_user_id: str
    is_active:     bool
    is_approved:   bool
    rating:        float
    total_reviews: int
    page_config:   dict[str, Any]
    created_at:    datetime
    services:      list[HospitalServiceResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# AppointmentSlot shorthand (used by hospital admins to create slots)
# ──────────────────────────────────────────

class SlotCreate(BaseModel):
    """Request body — POST /api/hospitals/{id}/slots (hospital_admin)."""
    vet_id:       str
    slot_date:    str  # YYYY-MM-DD
    start_time:   str  # HH:MM
    end_time:     str  # HH:MM
    is_recurring: bool = False

