"""
Purrfect Care — Cat & CatBreed Models

Covers: cats, cat_breeds, medical_records, patient_history tables (SpecificItem domain)
Enums: Gender
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 3-6)
"""

from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# Enumerations

class Gender(str, Enum):
    MALE   = "male"
    FEMALE = "female"


class HistoryEntryType(str, Enum):
    APPOINTMENT  = "appointment"
    PRESCRIPTION = "prescription"
    DIAGNOSIS    = "diagnosis"
    VACCINATION  = "vaccination"
    SURGERY      = "surgery"
    NOTE         = "note"


# CatBreed Models

class CatBreedBase(BaseModel):
    name:                str   = Field(..., max_length=100)
    origin_country:      str | None = Field(None, max_length=100)
    size_category:       str | None = Field(None, max_length=20)
    coat_type:           str | None = Field(None, max_length=50)
    temperament:         str | None = None
    description:         str | None = None
    avg_lifespan_years:  float | None = None
    avg_weight_kg:       float | None = None
    common_health_issues: list[str] = Field(default_factory=list)
    grooming_needs:      list[str] = Field(default_factory=list)
    image_url:           str | None = None


class CatBreedResponse(CatBreedBase):
    id: str
    model_config = {"from_attributes": True}


# Cat Models

class CatBase(BaseModel):
    name:         str     = Field(..., min_length=1, max_length=100)
    breed_id:     str | None = None
    age_months:   int | None = Field(None, ge=0)
    weight_kg:    float | None = Field(None, gt=0)
    color:        str | None = Field(None, max_length=50)
    gender:       Gender | None = None
    photo_url:    str | None = None
    is_neutered:  bool = False
    microchip_id: str | None = Field(None, max_length=50)


class CatCreate(CatBase):
    """Request body — POST /api/cats"""
    pass


class CatUpdate(BaseModel):
    name:         str | None = Field(None, min_length=1, max_length=100)
    breed_id:     str | None = None
    age_months:   int | None = Field(None, ge=0)
    weight_kg:    float | None = Field(None, gt=0)
    color:        str | None = None
    gender:       Gender | None = None
    photo_url:    str | None = None
    is_neutered:  bool | None = None
    microchip_id: str | None = None


class CatResponse(CatBase):
    id:              str
    owner_id:        str
    registered_at:   datetime
    breed:           CatBreedResponse | None = None

    model_config = {"from_attributes": True}


# MedicalRecord Models

class MedicalRecordBase(BaseModel):
    allergies:           list[str] = Field(default_factory=list)
    existing_conditions: list[str] = Field(default_factory=list)
    vaccination_status:  dict[str, Any] = Field(default_factory=dict)
    blood_type:          str | None = Field(None, max_length=10)
    notes:               str | None = None


class MedicalRecordUpdate(MedicalRecordBase):
    pass


class MedicalRecordCreate(MedicalRecordBase):
    """Request body — POST /api/cats/{id}/medical-record"""
    cat_id: str | None = None  # injected from URL path in controller


class MedicalRecordResponse(MedicalRecordBase):
    id:           str
    cat_id:       str
    last_updated: datetime

    model_config = {"from_attributes": True}


# PatientHistory Models

class PatientHistoryCreate(BaseModel):
    cat_id:          str
    entry_type:      HistoryEntryType
    description:     str | None = None
    appointment_id:  str | None = None
    prescription_id: str | None = None
    vet_id:          str | None = None


class PatientHistoryResponse(PatientHistoryCreate):
    id:         str
    created_at: datetime

    model_config = {"from_attributes": True}
