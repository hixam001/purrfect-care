"""
Purrfect Care — Chat & Message Models

Covers: chat_rooms, messages tables
Domain: Transaction (ChatRoom), TransactionLineItem (Message)
Enums: MessageType
References: Doc 07, Doc 08, TS-5, SD-5
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class MessageType(str, Enum):
    """Message type matching the database CHECK constraint."""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    PRESCRIPTION_SHARE = "prescription_share"


# ──────────────────────────────────────────
# ChatRoom Models (Transaction)
# ──────────────────────────────────────────

class ChatRoomCreate(BaseModel):
    """Request body for initiating a chat (auto-created if needed)."""
    vet_id: str


class ChatRoomResponse(BaseModel):
    """Response body for chat room data."""
    id: str
    user_id: str
    vet_id: str
    last_message_at: datetime | None = None
    unread_user: int = 0
    unread_vet: int = 0
    is_active: bool = True
    created_at: datetime

    # Optionally joined
    vet_name: str | None = None
    user_name: str | None = None
    last_message: str | None = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Message Models (TransactionLineItem)
# ──────────────────────────────────────────

class MessageCreate(BaseModel):
    """Request body for sending a message (POST /api/chats/{id}/messages)."""
    content: str = Field(..., min_length=1, max_length=5000)
    message_type: MessageType = MessageType.TEXT
    media_url: str | None = None


class MessageResponse(BaseModel):
    """Response body for message data."""
    id: str
    chat_room_id: str
    sender_id: str
    content: str
    message_type: MessageType
    media_url: str | None = None
    is_read: bool = False
    sent_at: datetime

    # Optionally joined
    sender_name: str | None = None

    model_config = {"from_attributes": True}
