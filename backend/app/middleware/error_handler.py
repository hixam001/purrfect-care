"""
Purrfect Care — Global Error Handler

Catches all exceptions and returns structured JSON error responses.
Handles both custom AppExceptions and unexpected errors.
"""

import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.utils.exceptions import AppException

logger = logging.getLogger("purrfect_care")


def register_error_handlers(app: FastAPI) -> None:
    """Register all error handlers on the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        """Handle custom application exceptions."""
        logger.warning(
            f"AppException: {exc.error_code} - {exc.message} "
            f"[{request.method} {request.url.path}]"
        )
        body = {
            "error": True,
            "error_code": exc.error_code,
            "message": exc.message,
        }
        if exc.details:
            body["details"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle Pydantic request validation errors (422 → 400)."""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": " → ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })
        logger.warning(
            f"Validation error: {errors} [{request.method} {request.url.path}]"
        )
        return JSONResponse(
            status_code=400,
            content={
                "error": True,
                "error_code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all for unhandled exceptions — returns 500."""
        logger.error(
            f"Unhandled exception: {str(exc)} [{request.method} {request.url.path}]\n"
            f"{traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "error_code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred" if not app.debug else str(exc),
            },
        )
