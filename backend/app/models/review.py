"""
Purrfect Care — Review & ReviewResponse Models

Covers: reviews, review_responses tables
Domain: Transaction (Review), SubsequentTransaction (ReviewResponse)
References: Doc 07, Doc 08, TS-10, SD-12
"""

from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """Request body for creating a review (POST /api/reviews)."""
    hospital_id: str | None = None
    store_id: str | None = None
    vet_id: str | None = None
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    """Response body for review data."""
    id: str
    user_id: str
    hospital_id: str | None = None
    store_id: str | None = None
    vet_id: str | None = None
    rating: int
    comment: str | None = None
    status: str = "published"
    created_at: datetime

    # Optionally joined
    user_name: str | None = None
    user_avatar: str | None = None
    response: "ReviewResponseDetail | None" = None

    model_config = {"from_attributes": True}


class ReviewResponseCreate(BaseModel):
    """Request body for responding to a review (POST /api/reviews/{id}/respond)."""
    response_text: str = Field(..., min_length=1, max_length=2000)


class ReviewResponseDetail(BaseModel):
    """Response body for a review response."""
    id: str
    review_id: str
    responder_id: str
    response_text: str
    status: str = "published"
    responded_at: datetime

    # Optionally joined
    responder_name: str | None = None

    model_config = {"from_attributes": True}
