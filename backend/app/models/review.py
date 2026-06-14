"""
Purrfect Care — Review & ReviewResponse & Offer Models

Covers: reviews, review_responses, offers tables (Transaction / SubsequentTransaction domain)
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 23-24-25)
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Review Models
# ──────────────────────────────────────────

class ReviewBase(BaseModel):
    rating:      int  = Field(..., ge=1, le=5)
    comment:     str | None = None
    hospital_id: str | None = None
    store_id:    str | None = None
    vet_id:      str | None = None


class ReviewCreate(ReviewBase):
    """Request body — POST /api/reviews.
    Exactly one of hospital_id, store_id, or vet_id must be provided.
    """
    pass


class ReviewResponse(ReviewBase):
    id:         str
    user_id:    str
    status:     str = "published"
    created_at: datetime
    response:   "ReviewResponseResponse | None" = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# ReviewResponse Models
# ──────────────────────────────────────────

class ReviewResponseCreate(BaseModel):
    """Request body — POST /api/reviews/{id}/response (hospital_admin / store_owner / vet)."""
    response_text: str = Field(..., min_length=1)


class ReviewResponseResponse(BaseModel):
    id:            str
    review_id:     str
    responder_id:  str
    response_text: str
    status:        str = "published"
    responded_at:  datetime

    model_config = {"from_attributes": True}


ReviewResponse.model_rebuild()


# ──────────────────────────────────────────
# Offer Models
# ──────────────────────────────────────────

class OfferBase(BaseModel):
    title:            str   = Field(..., max_length=200)
    description:      str | None = None
    discount_percent: float | None = Field(None, ge=0, le=100)
    promo_code:       str | None = Field(None, max_length=50)
    valid_from:       datetime
    valid_to:         datetime
    applicable_items: list[str] = Field(default_factory=list)
    hospital_id:      str | None = None
    store_id:         str | None = None


class OfferCreate(OfferBase):
    """Request body — POST /api/offers (hospital_admin / store_owner)."""
    pass


class OfferUpdate(BaseModel):
    title:            str | None = Field(None, max_length=200)
    description:      str | None = None
    discount_percent: float | None = Field(None, ge=0, le=100)
    promo_code:       str | None = None
    valid_from:       datetime | None = None
    valid_to:         datetime | None = None
    is_active:        bool | None = None
    applicable_items: list[str] | None = None


class OfferResponse(OfferBase):
    id:        str
    is_active: bool

    model_config = {"from_attributes": True}
