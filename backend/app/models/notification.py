"""
Purrfect Care — Notification Models

Covers: notifications table (System domain)
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 28)
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class NotificationChannel(str, Enum):
    PUSH  = "push"
    EMAIL = "email"
    SMS   = "sms"


class NotificationType(str, Enum):
    # Core appointment types (4)
    APPOINTMENT_CONFIRMED  = "appointment_confirmed"
    APPOINTMENT_REMINDER   = "appointment_reminder"
    APPOINTMENT_CANCELLED  = "appointment_cancelled"
    APPOINTMENT_COMPLETED  = "appointment_completed"
    # Order types (3)
    ORDER_CONFIRMED        = "order_confirmed"
    ORDER_STATUS_UPDATED   = "order_status_updated"
    ORDER_DELIVERED        = "order_delivered"
    # Engagement types (4)
    MESSAGE_RECEIVED       = "message_received"
    REVIEW_RESPONSE        = "review_response"
    NEW_OFFER              = "new_offer"
    PRESCRIPTION_READY     = "prescription_ready"
    # System types (3)
    ACCOUNT_VERIFIED       = "account_verified"
    PAYMENT_RECEIVED       = "payment_received"
    SYSTEM                 = "system"


# ──────────────────────────────────────────
# Notification Models
# ──────────────────────────────────────────

class NotificationCreate(BaseModel):
    user_id:  str
    type:     NotificationType
    title:    str   = Field(..., max_length=200)
    body:     str | None = None
    channel:  NotificationChannel = NotificationChannel.PUSH
    data:     dict = Field(default_factory=dict)


class NotificationResponse(BaseModel):
    id:         str
    user_id:    str
    type:       str
    title:      str
    body:       str | None = None
    channel:    str
    data:       dict
    is_read:    bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationMarkRead(BaseModel):
    """Request body — PATCH /api/notifications/read"""
    notification_ids: list[str] = Field(..., min_length=1)
