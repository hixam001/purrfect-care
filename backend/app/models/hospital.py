"""
Purrfect Care — Hospital & HospitalService Models

Covers: hospitals, hospital_services, appointment_slots tables
Domain: Place (Hospital), Item (HospitalService), Transaction-Extension (Slot)
References: Doc 07, Doc 08, TS-3, TS-8
"""

from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Hospital Models (Place)
# ──────────────────────────────────────────

class HospitalBase(BaseModel):
    """Shared hospital fields."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    address: str = Field(..., max_length=500)
    city: str | None = Field(None, max_length=100)
    banner_url: str | None = None
    operating_hours: dict[str, Any] | None = None


class HospitalCreate(HospitalBase):
    """Request body for hospital registration."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class HospitalUpdate(BaseModel):
    """Request body for updating hospital info."""
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    banner_url: str | None = None
    operating_hours: dict[str, Any] | None = None


class HospitalPageUpdate(BaseModel):
    """Request body for customizing hospital page (PUT /api/hospitals/{id}/page)."""
    banner_url: str | None = None
    description: str | None = None
    page_config: dict[str, Any] | None = None
    operating_hours: dict[str, Any] | None = None


class HospitalResponse(HospitalBase):
    """Response body for hospital data."""
    id: str
    admin_user_id: str
    is_active: bool = True
    is_approved: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    page_config: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    distance_km: float | None = None  # Populated by PostGIS queries

    model_config = {"from_attributes": True}


class HospitalDetailResponse(HospitalResponse):
    """Extended hospital response with nested services, vets, and offers."""
    services: list["HospitalServiceResponse"] = Field(default_factory=list)
    vets: list[Any] = Field(default_factory=list)
    offers: list[Any] = Field(default_factory=list)


# ──────────────────────────────────────────
# HospitalService Models (Item)
# ──────────────────────────────────────────

class HospitalServiceBase(BaseModel):
    """Shared hospital service fields."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str | None = Field(None, max_length=50)
    price: float = Field(..., ge=0)
    duration_minutes: int = Field(30, ge=5)
    is_active: bool = True


class HospitalServiceCreate(HospitalServiceBase):
    """Request body for adding a hospital service."""
    pass


class HospitalServiceUpdate(BaseModel):
    """Request body for updating a hospital service."""
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    category: str | None = Field(None, max_length=50)
    price: float | None = Field(None, ge=0)
    duration_minutes: int | None = Field(None, ge=5)
    is_active: bool | None = None


class HospitalServiceResponse(HospitalServiceBase):
    """Response body for hospital service data."""
    id: str
    hospital_id: str

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# AppointmentSlot Models (Transaction-Extension)
# ──────────────────────────────────────────

class SlotBase(BaseModel):
    """Shared appointment slot fields."""
    slot_date: date
    start_time: time
    end_time: time


class SlotCreate(SlotBase):
    """Request body for creating an appointment slot."""
    vet_id: str
    is_recurring: bool = False


class SlotBulkCreate(BaseModel):
    """Request body for creating multiple slots at once."""
    vet_id: str
    slot_date: date
    slots: list[dict[str, time]]  # [{"start_time": "09:00", "end_time": "09:30"}, ...]
    is_recurring: bool = False


class SlotResponse(SlotBase):
    """Response body for appointment slot data."""
    id: str
    hospital_id: str
    vet_id: str
    is_booked: bool = False
    is_recurring: bool = False

    model_config = {"from_attributes": True}

