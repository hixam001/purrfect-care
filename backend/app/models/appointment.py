"""
Purrfect Care — Appointment Models

Covers: appointments table (Transaction domain)
Enums: AppointmentStatus
References: Doc 07, Doc 08, TS-3, SD-4
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AppointmentStatus(str, Enum):
    """Appointment status matching the database CHECK constraint."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class AppointmentCreate(BaseModel):
    """Request body for booking an appointment (POST /api/appointments)."""
    hospital_id: str
    vet_id: str
    service_id: str
    slot_id: str
    cat_id: str
    notes: str | None = None


class AppointmentConfirm(BaseModel):
    """Request body for confirming with payment (PUT /api/appointments/{id}/confirm)."""
    payment_id: str


class AppointmentUpdate(BaseModel):
    """Request body for updating appointment status."""
    status: AppointmentStatus
    notes: str | None = None


class AppointmentResponse(BaseModel):
    """Response body for appointment data."""
    id: str
    user_id: str
    cat_id: str
    vet_id: str
    hospital_id: str
    service_id: str
    slot_id: str
    appointment_date: datetime
    status: AppointmentStatus
    notes: str | None = None
    amount_paid: float | None = None
    payment_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    # Optionally joined
    hospital_name: str | None = None
    vet_name: str | None = None
    service_name: str | None = None
    cat_name: str | None = None

    model_config = {"from_attributes": True}


class AppointmentPreview(BaseModel):
    """Preview before payment confirmation."""
    appointment_id: str
    hospital_name: str
    service_name: str
    vet_name: str
    cat_name: str
    appointment_date: datetime
    amount: float
    client_secret: str  # Stripe PaymentIntent client_secret
