"""
Purrfect Care — Input Validation Helpers

Common validation functions used across controllers and services.
"""

import re
from uuid import UUID


def is_valid_uuid(value: str) -> bool:
    """Check if a string is a valid UUID v4."""
    try:
        UUID(str(value), version=4)
        return True
    except (ValueError, AttributeError):
        return False


def is_valid_email(email: str) -> bool:
    """Basic email format validation."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def is_valid_phone(phone: str) -> bool:
    """Basic phone number validation (allows +, digits, spaces, hyphens)."""
    pattern = r"^\+?[\d\s\-()]{7,20}$"
    return bool(re.match(pattern, phone))


def sanitize_string(value: str, max_length: int = 500) -> str:
    """Strip whitespace and truncate to max length."""
    if not value:
        return ""
    return value.strip()[:max_length]


def validate_rating(rating: int) -> bool:
    """Ensure rating is between 1 and 5."""
    return 1 <= rating <= 5


def validate_latitude(lat: float) -> bool:
    """Validate latitude range."""
    return -90.0 <= lat <= 90.0


def validate_longitude(lng: float) -> bool:
    """Validate longitude range."""
    return -180.0 <= lng <= 180.0
