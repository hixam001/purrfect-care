"""
Purrfect Care — Chat Room & Message Models

Covers: chat_rooms, messages tables (Transaction / TransactionLineItem domain)
Enums: MessageType
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 14-15)
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class MessageType(str, Enum):
    TEXT               = "text"
    IMAGE              = "image"
    FILE               = "file"
    PRESCRIPTION_SHARE = "prescription_share"


# ──────────────────────────────────────────
# ChatRoom Models
# ──────────────────────────────────────────

class ChatRoomCreate(BaseModel):
    """Request body — POST /api/chat/rooms (initiates a new room)."""
    vet_id: str


class ChatRoomResponse(BaseModel):
    id:              str
    user_id:         str
    vet_id:          str
    last_message_at: datetime | None = None
    unread_user:     int = 0
    unread_vet:      int = 0
    is_active:       bool = True
    created_at:      datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# Message Models
# ──────────────────────────────────────────

class MessageCreate(BaseModel):
    """Request body — POST /api/chat/rooms/{id}/messages"""
    content:      str   = Field(..., min_length=1)
    message_type: MessageType = MessageType.TEXT
    media_url:    str | None = None


class MessageResponse(BaseModel):
    id:           str
    chat_room_id: str
    sender_id:    str
    content:      str
    message_type: MessageType
    media_url:    str | None = None
    is_read:      bool = False
    sent_at:      datetime

    model_config = {"from_attributes": True}
