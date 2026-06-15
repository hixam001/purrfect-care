"""
Purrfect Care — User & UserProfile Models

Covers: users, user_profiles tables (Participant domain)
Enums: Role
References: Doc 07 (Class Diagram), Doc 08 (DB Schema)
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────

class Role(str, Enum):
    """User roles matching the database CHECK constraint."""
    CAT_OWNER = "cat_owner"
    VET = "vet"
    HOSPITAL_ADMIN = "hospital_admin"
    STORE_OWNER = "store_owner"
    ADMIN = "admin"


# ──────────────────────────────────────────
# User Models
# ──────────────────────────────────────────

class UserBase(BaseModel):
    """Shared user fields."""
    name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = None
    address: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)


class UserCreate(UserBase):
    """Request body for user registration (POST /api/auth/register)."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: Role = Role.CAT_OWNER
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


class UserUpdate(BaseModel):
    """Request body for profile update (PUT /api/users/me)."""
    name: str | None = Field(None, min_length=1, max_length=100)
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = None
    address: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


class UserResponse(UserBase):
    """Response body for user data."""
    id: str           # user_profiles.id (profile primary key)
    user_id: str = "" # user_profiles.user_id (Supabase auth UID — used for storage paths)
    email: str
    role: Role
    is_active: bool = True
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserLoginRequest(BaseModel):
    """Request body for login (POST /api/auth/login)."""
    email: EmailStr
    password: str


class UserLoginResponse(BaseModel):
    """Response body after successful login."""
    user: UserResponse
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


# ──────────────────────────────────────────
# UserProfile Models
# ──────────────────────────────────────────

class UserProfileBase(BaseModel):
    """Shared user profile fields."""
    preferences: dict[str, Any] | None = Field(default_factory=dict)
    notification_settings: str = "all"


class UserProfileUpdate(UserProfileBase):
    """Request body for updating user preferences."""
    pass


class UserProfileResponse(UserProfileBase):
    """Response body for user profile data."""
    id: str
    user_id: str
    payment_customer_id: str | None = None
    last_login: datetime | None = None

    model_config = {"from_attributes": True}
