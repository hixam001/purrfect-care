"""
Purrfect Care — Role-Based Access Control (RBAC) Guard

Provides a dependency factory that restricts endpoint access
to specific user roles. Works in conjunction with auth_middleware.
"""

from functools import wraps
from typing import Callable

from fastapi import Depends

from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.utils.exceptions import ForbiddenException


# Valid roles matching the Role enum from doc 07
VALID_ROLES = {"cat_owner", "vet", "hospital_admin", "store_owner", "admin"}


def require_role(*allowed_roles: str) -> Callable:
    """
    FastAPI dependency factory that checks if the authenticated user
    has one of the allowed roles.

    Usage:
        @router.post("/api/prescriptions")
        async def prescribe(
            user: AuthenticatedUser = Depends(require_role("vet")),
        ):
            ...

        @router.get("/api/admin/dashboard")
        async def admin_dashboard(
            user: AuthenticatedUser = Depends(require_role("admin")),
        ):
            ...

        @router.post("/api/reviews")
        async def create_review(
            user: AuthenticatedUser = Depends(require_role("cat_owner", "vet")),
        ):
            ...
    """
    # Validate that all provided roles are valid
    for role in allowed_roles:
        if role not in VALID_ROLES:
            raise ValueError(f"Invalid role: '{role}'. Must be one of {VALID_ROLES}")

    async def role_checker(
        user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise ForbiddenException(
                f"This action requires one of the following roles: {', '.join(allowed_roles)}. "
                f"Your role: {user.role}"
            )
        return user

    return role_checker


def require_admin() -> Callable:
    """Shortcut for require_role('admin')."""
    return require_role("admin")


def require_vet() -> Callable:
    """Shortcut for require_role('vet')."""
    return require_role("vet")


def require_owner_or_admin(*owner_roles: str) -> Callable:
    """
    Allows access to specific roles plus admin (admin always has access).
    """
    roles = set(owner_roles) | {"admin"}
    return require_role(*roles)
