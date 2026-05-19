"""
Purrfect Care — Treatment Models

Covers: treatments table (SubsequentTransaction domain)
References: Doc 07, Doc 08, TS-3, TS-6
"""

from datetime import date, datetime

from pydantic import BaseModel, Field


class TreatmentCreate(BaseModel):
    """Request body for recording a treatment after an appointment."""
    appointment_id: str
    cat_id: str
    diagnosis: str | None = None
    notes: str | None = None
    follow_up_instructions: str | None = None
    follow_up_date: date | None = None


class TreatmentUpdate(BaseModel):
    """Request body for updating a treatment record."""
    diagnosis: str | None = None
    notes: str | None = None
    follow_up_instructions: str | None = None
    follow_up_date: date | None = None
    status: str | None = Field(None, pattern="^(in_progress|completed|follow_up_needed)$")


class TreatmentResponse(BaseModel):
    """Response body for treatment data."""
    id: str
    appointment_id: str
    vet_id: str
    cat_id: str
    diagnosis: str | None = None
    notes: str | None = None
    follow_up_instructions: str | None = None
    follow_up_date: date | None = None
    status: str = "completed"
    created_at: datetime

    # Optionally joined
    vet_name: str | None = None
    cat_name: str | None = None

    model_config = {"from_attributes": True}
