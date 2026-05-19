"""
Purrfect Care — Payment Models

Covers: payments table (SubsequentTransaction domain)
References: Doc 07, Doc 08, TS-3, TS-4
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    """Payment status matching the database CHECK constraint."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentResponse(BaseModel):
    """Response body for payment data."""
    id: str
    appointment_id: str | None = None
    order_id: str | None = None
    user_id: str
    amount: float
    payment_method: str | None = None
    stripe_payment_id: str
    status: PaymentStatus
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class PaymentWebhookEvent(BaseModel):
    """Incoming Stripe webhook event payload."""
    type: str
    data: dict
