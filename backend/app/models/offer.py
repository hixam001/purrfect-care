"""
Purrfect Care — Offer Models

Covers: offers table (Transaction domain)
References: Doc 07, Doc 08, TS-11, SD-13
"""

from datetime import datetime

from pydantic import BaseModel, Field


class OfferCreate(BaseModel):
    """Request body for creating an offer/promotion (POST /api/offers)."""
    hospital_id: str | None = None
    store_id: str | None = None
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    discount_percent: float | None = Field(None, ge=0, le=100)
    promo_code: str | None = Field(None, max_length=50)
    valid_from: datetime
    valid_to: datetime
    applicable_items: list[str] = Field(default_factory=list)


class OfferUpdate(BaseModel):
    """Request body for updating an offer."""
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    discount_percent: float | None = Field(None, ge=0, le=100)
    promo_code: str | None = Field(None, max_length=50)
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    is_active: bool | None = None
    applicable_items: list[str] | None = None


class OfferResponse(BaseModel):
    """Response body for offer data."""
    id: str
    hospital_id: str | None = None
    store_id: str | None = None
    title: str
    description: str | None = None
    discount_percent: float | None = None
    promo_code: str | None = None
    valid_from: datetime
    valid_to: datetime
    is_active: bool = True
    applicable_items: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}
