"""
Purrfect Care — Prescription Models

Covers: prescriptions table (SubsequentTransaction domain)
Enums: PrescriptionStatus
References: Doc 07, Doc 08, TS-6, SD-7
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class PrescriptionStatus(str, Enum):
    """Prescription status matching the database CHECK constraint."""
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PrescriptionCreate(BaseModel):
    """Request body for prescribing medicine (POST /api/prescriptions)."""
    appointment_id: str | None = None
    cat_id: str
    medicine_id: str
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=100)
    duration_days: int = Field(..., ge=1)
    instructions: str | None = None


class PrescriptionResponse(BaseModel):
    """Response body for prescription data."""
    id: str
    appointment_id: str | None = None
    cat_id: str
    vet_id: str
    medicine_id: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: str | None = None
    status: PrescriptionStatus
    prescribed_at: datetime

    # Optionally joined
    medicine_name: str | None = None
    cat_name: str | None = None
    vet_name: str | None = None

    model_config = {"from_attributes": True}


class ContraindicationResult(BaseModel):
    """Result of contraindication check before prescribing."""
    safe: bool
    warnings: list[str] = Field(default_factory=list)
    allergy_conflicts: list[str] = Field(default_factory=list)
    breed_warnings: list[str] = Field(default_factory=list)
