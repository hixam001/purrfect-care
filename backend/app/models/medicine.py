"""
Purrfect Care — Medicine & Prescription Models

Covers: medicines, prescriptions tables (Item / SubsequentTransaction domain)
Enums: PrescriptionStatus
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 12-13)
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class PrescriptionStatus(str, Enum):
    ACTIVE    = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ──────────────────────────────────────────
# Medicine Models
# ──────────────────────────────────────────

class MedicineBase(BaseModel):
    name:                  str   = Field(..., max_length=200)
    generic_name:          str | None = Field(None, max_length=200)
    manufacturer:          str | None = Field(None, max_length=200)
    ingredients:           list[str] = Field(default_factory=list)
    dosage_form:           str | None = Field(None, max_length=50)
    description:           str | None = None
    usage_instructions:    str | None = None
    contraindications:     list[str] = Field(default_factory=list)
    allergy_warnings:      list[str] = Field(default_factory=list)
    breed_warnings:        list[str] = Field(default_factory=list)
    side_effects:          list[str] = Field(default_factory=list)
    requires_prescription: bool = True
    is_active:             bool = True


class MedicineCreate(MedicineBase):
    """Request body — POST /api/medicines (admin only)."""
    pass


class MedicineUpdate(BaseModel):
    name:                  str | None = Field(None, max_length=200)
    generic_name:          str | None = None
    manufacturer:          str | None = None
    ingredients:           list[str] | None = None
    dosage_form:           str | None = None
    description:           str | None = None
    usage_instructions:    str | None = None
    contraindications:     list[str] | None = None
    allergy_warnings:      list[str] | None = None
    breed_warnings:        list[str] | None = None
    side_effects:          list[str] | None = None
    requires_prescription: bool | None = None
    is_active:             bool | None = None


class MedicineResponse(MedicineBase):
    id: str
    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Prescription Models
# ──────────────────────────────────────────

class PrescriptionBase(BaseModel):
    cat_id:         str
    vet_id:         str
    medicine_id:    str
    dosage:         str   = Field(..., max_length=100)
    frequency:      str   = Field(..., max_length=100)
    duration_days:  int   = Field(..., gt=0)
    instructions:   str | None = None
    appointment_id: str | None = None


class PrescriptionCreate(PrescriptionBase):
    """Request body — POST /api/prescriptions"""
    pass


class PrescriptionUpdate(BaseModel):
    status:       PrescriptionStatus | None = None
    instructions: str | None = None


class PrescriptionResponse(PrescriptionBase):
    id:            str
    status:        PrescriptionStatus
    prescribed_at: datetime
    medicine:      MedicineResponse | None = None

    model_config = {"from_attributes": True}
