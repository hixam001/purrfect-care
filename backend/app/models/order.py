"""
Purrfect Care — Order & OrderItem Models

Covers: orders, order_items tables
Domain: Transaction (Order), TransactionLineItem (OrderItem)
Enums: OrderStatus
References: Doc 07, Doc 08, TS-4, TS-12, SD-8, SD-14
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    """Order status matching the database CHECK constraint."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


# ──────────────────────────────────────────
# OrderItem Models (TransactionLineItem)
# ──────────────────────────────────────────

class OrderItemCreate(BaseModel):
    """Single item in an order."""
    product_id: str
    quantity: int = Field(..., ge=1)


class OrderItemResponse(BaseModel):
    """Response body for order item data."""
    id: str
    order_id: str
    product_id: str
    quantity: int
    unit_price: float
    total_price: float

    # Optionally joined
    product_name: str | None = None
    product_image: str | None = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Order Models (Transaction)
# ──────────────────────────────────────────

class OrderCreate(BaseModel):
    """Request body for creating an order (POST /api/orders)."""
    store_id: str
    items: list[OrderItemCreate] = Field(..., min_length=1)
    delivery_address: str = Field(..., min_length=1)
    delivery_latitude: float | None = Field(None, ge=-90, le=90)
    delivery_longitude: float | None = Field(None, ge=-180, le=180)
    notes: str | None = None


class OrderConfirm(BaseModel):
    """Request body for confirming order payment."""
    payment_id: str


class OrderStatusUpdate(BaseModel):
    """Request body for updating order status (store owner fulfillment)."""
    status: OrderStatus
    reason: str | None = None  # Required for cancellation


class OrderResponse(BaseModel):
    """Response body for order data."""
    id: str
    user_id: str
    store_id: str
    subtotal: float
    delivery_fee: float
    total: float
    status: OrderStatus
    payment_id: str | None = None
    delivery_address: str
    notes: str | None = None
    ordered_at: datetime
    delivered_at: datetime | None = None

    # Optionally joined
    store_name: str | None = None
    items: list[OrderItemResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class OrderPreview(BaseModel):
    """Preview before payment confirmation."""
    order_id: str
    store_name: str
    items: list[OrderItemResponse]
    subtotal: float
    delivery_fee: float
    total: float
    client_secret: str  # Stripe PaymentIntent client_secret
