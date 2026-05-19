"""
Purrfect Care — Pagination Utilities

Provides standardized pagination for all list endpoints.
"""

from pydantic import BaseModel, Field
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameters for paginated requests."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        """Calculate the SQL OFFSET from page and limit."""
        return (self.page - 1) * self.limit


class PaginatedResponse(BaseModel):
    """Standardized paginated response wrapper."""

    data: list[Any]
    total: int
    page: int
    limit: int
    total_pages: int

    @classmethod
    def create(
        cls,
        data: list[Any],
        total: int,
        page: int,
        limit: int,
    ) -> "PaginatedResponse":
        """Create a paginated response from query results."""
        total_pages = (total + limit - 1) // limit if limit > 0 else 0
        return cls(
            data=data,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
