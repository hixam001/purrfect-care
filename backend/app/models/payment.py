"""
Purrfect Care — Payment Models

Covers: payments table (SubsequentTransaction domain)
Enums: PaymentStatus
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 22)
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class PaymentStatus(str, Enum):
    PENDING   = "pending"
    COMPLETED = "completed"
    FAILED    = "failed"
    REFUNDED  = "refunded"


# ──────────────────────────────────────────
# Payment Models
# ──────────────────────────────────────────

class PaymentCreate(BaseModel):
    """Request body — POST /api/payments/initiate"""
    appointment_id: str | None = None
    order_id:       str | None = None
    amount:         float = Field(..., gt=0)
    payment_method: str | None = Field(None, max_length=50)


class PaymentResponse(BaseModel):
    id:               str
    appointment_id:   str | None = None
    order_id:         str | None = None
    user_id:          str
    amount:           float
    payment_method:   str | None = None
    stripe_payment_id: str
    status:           PaymentStatus
    created_at:       datetime
    completed_at:     datetime | None = None

    model_config = {"from_attributes": True}


class PaymentIntentResponse(BaseModel):
    """Response when creating a Safepay payment intent (checkout session)."""
    client_secret: str
    payment_id:    str
    amount:        float
    currency:      str = "PKR"
