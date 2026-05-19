"""
Purrfect Care — Custom Exception Classes

Structured exceptions that are caught by the global error handler
and converted into consistent JSON error responses.
"""

from typing import Any


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Any = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found (404)."""

    def __init__(self, resource: str, resource_id: str = ""):
        detail = f"{resource} not found"
        if resource_id:
            detail = f"{resource} with id '{resource_id}' not found"
        super().__init__(
            message=detail,
            status_code=404,
            error_code="NOT_FOUND",
        )


class BadRequestException(AppException):
    """Invalid request data (400)."""

    def __init__(self, message: str, details: Any = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="BAD_REQUEST",
            details=details,
        )


class UnauthorizedException(AppException):
    """Authentication required or failed (401)."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    """Insufficient permissions (403)."""

    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
        )


class ConflictException(AppException):
    """Resource conflict, e.g. duplicate or contraindication (409)."""

    def __init__(self, message: str, details: Any = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
            details=details,
        )


class PaymentException(AppException):
    """Payment processing error (402)."""

    def __init__(self, message: str = "Payment failed", details: Any = None):
        super().__init__(
            message=message,
            status_code=402,
            error_code="PAYMENT_FAILED",
            details=details,
        )


class ExternalServiceException(AppException):
    """External service (Stripe, OpenAI, etc.) error (502)."""

    def __init__(self, service: str, message: str = ""):
        super().__init__(
            message=f"External service error ({service}): {message}" if message else f"External service error ({service})",
            status_code=502,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service},
        )
