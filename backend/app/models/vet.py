"""
Purrfect Care — Vet Models

Covers: vets table (Participant domain)
References: Doc 07 (Class Diagram), Doc 08 (DB Schema)
"""

from datetime import datetime

from pydantic import BaseModel, Field


class VetBase(BaseModel):
    """Shared vet fields."""
    license_number: str = Field(..., min_length=1, max_length=50)
    specialization: str | None = Field(None, max_length=100)
    experience_years: int | None = Field(None, ge=0)
    bio: str | None = None
    qualifications: list[str] = Field(default_factory=list)


class VetCreate(VetBase):
    """Request body for vet registration."""
    hospital_id: str | None = None


class VetUpdate(BaseModel):
    """Request body for updating vet profile."""
    specialization: str | None = Field(None, max_length=100)
    experience_years: int | None = Field(None, ge=0)
    bio: str | None = None
    qualifications: list[str] | None = None
    hospital_id: str | None = None


class VetResponse(VetBase):
    """Response body for vet data."""
    id: str
    user_id: str
    hospital_id: str | None = None
    is_verified: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    verified_at: datetime | None = None

    # Optionally joined
    user_name: str | None = None
    user_email: str | None = None
    hospital_name: str | None = None

    model_config = {"from_attributes": True}
