"""
Purrfect Care — Medicine Models

Covers: medicines table (Item domain)
References: Doc 07, Doc 08, TS-6, SD-10
"""

from datetime import datetime

from pydantic import BaseModel, Field


class MedicineBase(BaseModel):
    """Shared medicine fields."""
    name: str = Field(..., min_length=1, max_length=200)
    generic_name: str | None = Field(None, max_length=200)
    manufacturer: str | None = Field(None, max_length=200)
    ingredients: list[str] = Field(default_factory=list)
    dosage_form: str | None = Field(None, max_length=50)
    description: str | None = None
    usage_instructions: str | None = None
    contraindications: list[str] = Field(default_factory=list)
    allergy_warnings: list[str] = Field(default_factory=list)
    breed_warnings: list[str] = Field(default_factory=list)
    side_effects: list[str] = Field(default_factory=list)
    requires_prescription: bool = True
    is_active: bool = True


class MedicineCreate(MedicineBase):
    """Request body for adding a medicine (POST /api/admin/medicines)."""
    pass


class MedicineUpdate(BaseModel):
    """Request body for updating a medicine."""
    name: str | None = Field(None, min_length=1, max_length=200)
    generic_name: str | None = Field(None, max_length=200)
    manufacturer: str | None = Field(None, max_length=200)
    ingredients: list[str] | None = None
    dosage_form: str | None = Field(None, max_length=50)
    description: str | None = None
    usage_instructions: str | None = None
    contraindications: list[str] | None = None
    allergy_warnings: list[str] | None = None
    breed_warnings: list[str] | None = None
    side_effects: list[str] | None = None
    requires_prescription: bool | None = None
    is_active: bool | None = None


class MedicineResponse(MedicineBase):
    """Response body for medicine data."""
    id: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
