"""
Purrfect Care — Appointment & AppointmentSlot Models

Covers: appointments, appointment_slots tables (Transaction domain)
Enums: AppointmentStatus
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 10-11)
"""

from datetime import date, datetime, time

from pydantic import BaseModel, Field
from enum import Enum


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class AppointmentStatus(str, Enum):
    PENDING     = "pending"
    CONFIRMED   = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"
    CANCELLED   = "cancelled"
    NO_SHOW     = "no_show"


# ──────────────────────────────────────────
# AppointmentSlot Models
# ──────────────────────────────────────────

class AppointmentSlotBase(BaseModel):
    hospital_id:  str
    vet_id:       str
    slot_date:    date
    start_time:   time
    end_time:     time
    is_recurring: bool = False


class AppointmentSlotCreate(AppointmentSlotBase):
    """Request body — POST /api/hospitals/{id}/slots"""
    pass


class AppointmentSlotResponse(AppointmentSlotBase):
    id:        str
    is_booked: bool

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Appointment Models
# ──────────────────────────────────────────

class AppointmentBase(BaseModel):
    cat_id:           str
    vet_id:           str
    hospital_id:      str
    service_id:       str
    slot_id:          str | None = None
    appointment_date: datetime | None = None  # resolved from slot if not provided
    notes:            str | None = None


class AppointmentCreate(AppointmentBase):
    """Request body — POST /api/appointments"""
    pass


class AppointmentUpdate(BaseModel):
    status:  AppointmentStatus | None = None
    notes:   str | None = None
    slot_id: str | None = None


class AppointmentResponse(AppointmentBase):
    id:           str
    user_id:      str
    status:       AppointmentStatus
    amount_paid:  float | None = None
    payment_id:   str | None = None
    created_at:   datetime
    updated_at:   datetime | None = None

    model_config = {"from_attributes": True}
