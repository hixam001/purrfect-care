"""
Purrfect Care — User Service

Handles domain-level operations on user profiles:
- Profile updates (name, phone, location, avatar, etc.)
- Profile retrieval by internal ID or Supabase auth UUID

Intentionally separated from AuthService to keep auth and profile
concerns distinct and independently testable.
"""

import logging
from datetime import datetime, timezone

from supabase import Client

from app.models.user import UserUpdate, UserResponse
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import NotFoundException

logger = logging.getLogger("purrfect_care.users")


class UserService:
    """
    Business logic for managing user profile data.

    Receives the service-role Supabase client via constructor injection
    for full testability with mock clients.
    """

    def __init__(self, service_client: Client):
        self.user_repo = UserRepository(service_client)

    def get_profile_by_auth_id(self, supabase_user_id: str) -> UserResponse:
        """
        Retrieve a user profile by Supabase auth UUID (the `sub` in the JWT).
        Raises NotFoundException if not found.
        """
        profile = self.user_repo.find_by_user_id(supabase_user_id)
        if not profile:
            raise NotFoundException("User profile")
        return self._to_response(profile)

    def update_profile(self, profile_id: str, data: UserUpdate) -> UserResponse:
        """
        Update mutable profile fields for the currently authenticated user.

        Only non-None fields in `data` are sent to the database, so callers
        can do partial PATCH-like updates by omitting unchanged fields.

        Returns the updated UserResponse.
        """
        update_payload = data.model_dump(exclude_none=True)

        if not update_payload:
            # Nothing to update — return current profile as-is
            profile = self.user_repo.find_by_id(profile_id)
            return self._to_response(profile)

        update_payload["updated_at"] = datetime.now(timezone.utc).isoformat()

        updated = self.user_repo.update(profile_id, update_payload)
        return self._to_response(updated)

    # ──────────────────────────────────────────────────
    # Private Helpers
    # ──────────────────────────────────────────────────

    @staticmethod
    def _to_response(profile: dict) -> UserResponse:
        """Convert a raw user_profiles DB row to a UserResponse model."""
        return UserResponse(
            id=profile["id"],
            email=profile.get("email", ""),
            name=profile.get("name", ""),
            phone=profile.get("phone"),
            avatar_url=profile.get("avatar_url"),
            address=profile.get("address"),
            city=profile.get("city"),
            country=profile.get("country"),
            role=profile.get("role", "cat_owner"),
            is_active=profile.get("is_active", True),
            created_at=profile["created_at"],
            updated_at=profile.get("updated_at"),
        )
