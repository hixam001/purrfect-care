"""
Purrfect Care — User Repository

Manages the `user_profiles` table in Supabase.
Extends BaseRepository with user-specific query methods.

The `user_profiles` table stores domain data (name, role, location, etc.)
linked to Supabase's `auth.users` via a `user_id` UUID foreign key.
"""

from supabase import Client

from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    """
    Repository for the `user_profiles` table.

    Usage:
        repo = UserRepository(db)
        profile = repo.find_by_user_id("auth-user-uuid")
    """

    def __init__(self, db: Client):
        super().__init__(db, "user_profiles")

    def find_by_user_id(self, user_id: str, select: str = "*") -> dict | None:
        """
        Find a user profile by the Supabase auth user ID (`auth.users.id`).
        Returns None if not found (does NOT raise NotFoundException).

        This is the primary lookup for resolving the authenticated user's
        domain profile from their JWT `sub` claim.
        """
        result = (
            self.db.table(self.table_name)
            .select(select)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def find_by_email(self, email: str, select: str = "*") -> dict | None:
        """
        Find a user profile by email address.
        Returns None if not found.

        Used in registration flow to detect duplicate accounts before
        calling Supabase Auth sign-up.
        """
        result = (
            self.db.table(self.table_name)
            .select(select)
            .eq("email", email)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def email_exists(self, email: str) -> bool:
        """
        Returns True if a profile with the given email already exists.
        Used for duplicate detection during registration.
        """
        count_result = (
            self.db.table(self.table_name)
            .select("id", count="exact")
            .eq("email", email)
            .execute()
        )
        return (count_result.count or 0) > 0

    def update_last_login(self, profile_id: str) -> None:
        """
        Updates the `last_login` timestamp for the given profile ID.
        Called on successful authentication.
        """
        from datetime import datetime, timezone
        self.db.table(self.table_name).update(
            {"last_login": datetime.now(timezone.utc).isoformat()}
        ).eq("id", profile_id).execute()
