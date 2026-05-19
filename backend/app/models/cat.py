"""
Purrfect Care — Cat, CatBreed & MedicalRecord Models

Covers: cats, cat_breeds, medical_records, patient_history tables
Domain: SpecificItem (Cat, MedicalRecord), Item (CatBreed)
References: Doc 07 (Class Diagram), Doc 08 (DB Schema), TS-2
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# CatBreed Models (Item)
# ──────────────────────────────────────────

class CatBreedResponse(BaseModel):
    """Response body for cat breed data."""
    id: str
    name: str
    origin_country: str | None = None
    size_category: str | None = None
    coat_type: str | None = None
    temperament: str | None = None
    description: str | None = None
    avg_lifespan_years: float | None = None
    avg_weight_kg: float | None = None
    common_health_issues: list[str] = Field(default_factory=list)
    grooming_needs: list[str] = Field(default_factory=list)
    image_url: str | None = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# MedicalRecord Models (SpecificItem)
# ──────────────────────────────────────────

class MedicalRecordBase(BaseModel):
    """Shared medical record fields."""
    allergies: list[str] = Field(default_factory=list)
    existing_conditions: list[str] = Field(default_factory=list)
    vaccination_status: dict[str, Any] = Field(default_factory=dict)
    blood_type: str | None = Field(None, max_length=10)
    notes: str | None = None


class MedicalRecordCreate(MedicalRecordBase):
    """Initial medical record created during cat registration."""
    pass


class MedicalRecordUpdate(BaseModel):
    """Request body for updating a medical record."""
    allergies: list[str] | None = None
    existing_conditions: list[str] | None = None
    vaccination_status: dict[str, Any] | None = None
    blood_type: str | None = None
    notes: str | None = None


class MedicalRecordResponse(MedicalRecordBase):
    """Response body for medical record data."""
    id: str
    cat_id: str
    last_updated: datetime | None = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Cat Models (SpecificItem)
# ──────────────────────────────────────────

class CatBase(BaseModel):
    """Shared cat fields."""
    name: str = Field(..., min_length=1, max_length=100)
    breed_id: str | None = None
    age_months: int | None = Field(None, ge=0)
    weight_kg: float | None = Field(None, ge=0)
    color: str | None = Field(None, max_length=50)
    gender: str | None = Field(None, pattern="^(male|female)$")
    photo_url: str | None = None
    is_neutered: bool = False
    microchip_id: str | None = Field(None, max_length=50)


class CatCreate(CatBase):
    """Request body for registering a cat (POST /api/cats)."""
    # Medical record fields inline for convenience
    allergies: list[str] = Field(default_factory=list)
    existing_conditions: list[str] = Field(default_factory=list)
    blood_type: str | None = None


class CatUpdate(BaseModel):
    """Request body for updating a cat (PUT /api/cats/{id})."""
    name: str | None = Field(None, min_length=1, max_length=100)
    age_months: int | None = Field(None, ge=0)
    weight_kg: float | None = Field(None, ge=0)
    color: str | None = Field(None, max_length=50)
    photo_url: str | None = None
    is_neutered: bool | None = None


class CatResponse(CatBase):
    """Response body for cat data."""
    id: str
    owner_id: str
    registered_at: datetime

    # Optionally joined data
    breed: CatBreedResponse | None = None
    medical_record: MedicalRecordResponse | None = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# PatientHistory Models (SubsequentTransaction)
# ──────────────────────────────────────────

class PatientHistoryCreate(BaseModel):
    """Create a patient history entry."""
    cat_id: str
    entry_type: str = Field(..., pattern="^(appointment|prescription|diagnosis|vaccination|surgery|note)$")
    description: str | None = None
    appointment_id: str | None = None
    prescription_id: str | None = None
    vet_id: str | None = None


class PatientHistoryResponse(BaseModel):
    """Response body for patient history entry."""
    id: str
    cat_id: str
    entry_type: str
    description: str | None = None
    appointment_id: str | None = None
    prescription_id: str | None = None
    vet_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
