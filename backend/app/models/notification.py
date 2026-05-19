"""
Purrfect Care — Notification Models

Covers: notifications table (System domain)
Enums: NotificationType, NotificationChannel
References: Doc 07, Doc 08
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class NotificationType(str, Enum):
    """Notification type enum — aligned with Doc 07 class diagram."""
    # Core types from Doc 07
    WELCOME = "welcome"
    APPOINTMENT_BOOKED = "appointment_booked"
    APPOINTMENT_REMINDER = "appointment_reminder"
    NEW_MESSAGE = "new_message"
    NEW_PRESCRIPTION = "new_prescription"
    ORDER_PLACED = "order_placed"
    ORDER_STATUS_UPDATE = "order_status_update"
    NEW_REVIEW = "new_review"
    SYSTEM_ALERT = "system_alert"
    # Extended types for implementation completeness
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    VET_VERIFIED = "vet_verified"
    HOSPITAL_APPROVED = "hospital_approved"
    STORE_APPROVED = "store_approved"


class NotificationChannel(str, Enum):
    """Notification delivery channel."""
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"


class NotificationCreate(BaseModel):
    """Internal model for creating a notification."""
    user_id: str
    type: NotificationType
    title: str = Field(..., max_length=200)
    body: str | None = None
    channel: NotificationChannel = NotificationChannel.PUSH
    data: dict[str, Any] = Field(default_factory=dict)


class NotificationResponse(BaseModel):
    """Response body for notification data."""
    id: str
    user_id: str
    type: NotificationType
    title: str
    body: str | None = None
    channel: NotificationChannel
    data: dict[str, Any] = Field(default_factory=dict)
    is_read: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
