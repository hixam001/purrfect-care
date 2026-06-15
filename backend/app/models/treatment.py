"""
Purrfect Care — Treatment Models

Covers: treatments table (SubsequentTransaction domain)
Enums: TreatmentStatus
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 21)
"""

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


# Enumerations

class TreatmentStatus(str, Enum):
    IN_PROGRESS      = "in_progress"
    COMPLETED        = "completed"
    FOLLOW_UP_NEEDED = "follow_up_needed"


# Treatment Models

class TreatmentBase(BaseModel):
    appointment_id:       str
    vet_id:               str
    cat_id:               str
    diagnosis:            str | None = None
    notes:                str | None = None
    follow_up_instructions: str | None = None
    follow_up_date:       date | None = None


class TreatmentCreate(TreatmentBase):
    """Request body — POST /api/treatments (vet only)."""
    pass


class TreatmentUpdate(BaseModel):
    diagnosis:              str | None = None
    notes:                  str | None = None
    follow_up_instructions: str | None = None
    follow_up_date:         date | None = None
    status:                 TreatmentStatus | None = None


class TreatmentResponse(TreatmentBase):
    id:         str
    status:     TreatmentStatus
    created_at: datetime

    model_config = {"from_attributes": True}
