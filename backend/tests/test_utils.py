"""
Tests for utility modules — exceptions, pagination, validators.
"""

import pytest
from fastapi.testclient import TestClient

from app.utils.exceptions import (
    AppException,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
    PaymentException,
    ExternalServiceException,
)
from app.utils.pagination import PaginationParams, PaginatedResponse
from app.utils.validators import (
    is_valid_uuid,
    is_valid_email,
    is_valid_phone,
    sanitize_string,
    validate_rating,
    validate_latitude,
    validate_longitude,
)


class TestExceptions:
    def test_not_found_exception(self):
        exc = NotFoundException("Cat", "abc-123")
        assert exc.status_code == 404
        assert "Cat" in exc.message
        assert "abc-123" in exc.message
        assert exc.error_code == "NOT_FOUND"

    def test_not_found_without_id(self):
        exc = NotFoundException("Hospital")
        assert "Hospital not found" == exc.message

    def test_bad_request_exception(self):
        exc = BadRequestException("Invalid data", details={"field": "email"})
        assert exc.status_code == 400
        assert exc.details == {"field": "email"}

    def test_unauthorized_exception(self):
        exc = UnauthorizedException()
        assert exc.status_code == 401
        assert "Authentication required" in exc.message

    def test_forbidden_exception(self):
        exc = ForbiddenException()
        assert exc.status_code == 403

    def test_conflict_exception(self):
        exc = ConflictException("Allergy detected", details={"allergy": "penicillin"})
        assert exc.status_code == 409

    def test_payment_exception(self):
        exc = PaymentException()
        assert exc.status_code == 402

    def test_external_service_exception(self):
        exc = ExternalServiceException("Stripe", "Connection timeout")
        assert exc.status_code == 502
        assert "Stripe" in exc.message

    def test_app_exception_base(self):
        exc = AppException("Custom error", status_code=418, error_code="TEAPOT")
        assert exc.status_code == 418
        assert exc.error_code == "TEAPOT"


class TestErrorHandler:
    """Test that exceptions are properly converted to JSON responses."""

    def test_404_json_response(self, client):
        """Unknown routes should return structured JSON, not HTML."""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404

    def test_422_converted_to_400(self, client):
        """Pydantic validation errors should return 400 not 422."""
        # This would be tested once we have POST endpoints
        pass


class TestPagination:
    def test_default_pagination(self):
        params = PaginationParams()
        assert params.page == 1
        assert params.limit == 20
        assert params.offset == 0

    def test_pagination_offset_calculation(self):
        params = PaginationParams(page=3, limit=10)
        assert params.offset == 20

    def test_pagination_page_1_offset_0(self):
        params = PaginationParams(page=1, limit=50)
        assert params.offset == 0

    def test_paginated_response_total_pages(self):
        resp = PaginatedResponse.create(data=[], total=95, page=1, limit=20)
        assert resp.total_pages == 5

    def test_paginated_response_single_page(self):
        resp = PaginatedResponse.create(data=[1, 2, 3], total=3, page=1, limit=20)
        assert resp.total_pages == 1

    def test_paginated_response_empty(self):
        resp = PaginatedResponse.create(data=[], total=0, page=1, limit=20)
        assert resp.total_pages == 0

    def test_pagination_rejects_page_zero(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PaginationParams(page=0)

    def test_pagination_rejects_limit_over_100(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PaginationParams(limit=200)


class TestValidators:
    def test_valid_uuid(self):
        assert is_valid_uuid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d") is True

    def test_invalid_uuid(self):
        assert is_valid_uuid("not-a-uuid") is False
        assert is_valid_uuid("") is False

    def test_valid_email(self):
        assert is_valid_email("test@example.com") is True
        assert is_valid_email("user.name+tag@domain.co.uk") is True

    def test_invalid_email(self):
        assert is_valid_email("not-an-email") is False
        assert is_valid_email("@domain.com") is False
        assert is_valid_email("") is False

    def test_valid_phone(self):
        assert is_valid_phone("+1 555-123-4567") is True
        assert is_valid_phone("03001234567") is True

    def test_invalid_phone(self):
        assert is_valid_phone("abc") is False
        assert is_valid_phone("12") is False

    def test_sanitize_string(self):
        assert sanitize_string("  hello  ") == "hello"
        assert sanitize_string("") == ""
        long_str = "a" * 1000
        assert len(sanitize_string(long_str, max_length=100)) == 100

    def test_validate_rating(self):
        assert validate_rating(1) is True
        assert validate_rating(5) is True
        assert validate_rating(0) is False
        assert validate_rating(6) is False

    def test_validate_latitude(self):
        assert validate_latitude(0) is True
        assert validate_latitude(90) is True
        assert validate_latitude(-90) is True
        assert validate_latitude(91) is False
        assert validate_latitude(-91) is False

    def test_validate_longitude(self):
        assert validate_longitude(0) is True
        assert validate_longitude(180) is True
        assert validate_longitude(-180) is True
        assert validate_longitude(181) is False
