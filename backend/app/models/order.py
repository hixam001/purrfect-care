"""
Purrfect Care — Order & OrderItem Models

Covers: orders, order_items tables (Transaction / TransactionLineItem domain)
Enums: OrderStatus
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 19-20)
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class OrderStatus(str, Enum):
    PENDING          = "pending"
    CONFIRMED        = "confirmed"
    PREPARING        = "preparing"
    READY            = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED        = "delivered"
    CANCELLED        = "cancelled"
    REFUNDED         = "refunded"


# ──────────────────────────────────────────
# OrderItem Models
# ──────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: str
    quantity:   int   = Field(..., gt=0)
    unit_price: float | None = Field(None, gt=0)  # resolved from product in controller


class OrderItemResponse(BaseModel):
    id:          str
    order_id:    str
    product_id:  str
    quantity:    int
    unit_price:  float
    total_price: float

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Order Models
# ──────────────────────────────────────────

class OrderCreate(BaseModel):
    """Request body — POST /api/orders (cat_owner)."""
    store_id:         str
    items:            list[OrderItemCreate] = Field(..., min_length=1)
    delivery_address: str
    notes:            str | None = None
    latitude:         float | None = Field(None, ge=-90,  le=90)
    longitude:        float | None = Field(None, ge=-180, le=180)


class OrderUpdate(BaseModel):
    """Request body — PATCH /api/orders/{id} (store_owner or buyer)."""
    status: OrderStatus | None = None
    notes:  str | None = None


class OrderResponse(BaseModel):
    id:               str
    user_id:          str
    store_id:         str
    subtotal:         float
    delivery_fee:     float
    total:            float
    status:           OrderStatus
    payment_id:       str | None = None
    delivery_address: str
    notes:            str | None = None
    ordered_at:       datetime
    delivered_at:     datetime | None = None
    items:            list[OrderItemResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
