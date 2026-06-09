"""
Purrfect Care — Auth Service

Handles all authentication operations by orchestrating between:
- Supabase Auth  (sign up, sign in, refresh, sign out, password reset)
- UserRepository (user_profiles table for domain attributes and role)

Design decisions:
- We use the Supabase ANON key client for auth operations so that
  Row Level Security is respected for auth.users interaction.
- After sign-up, we insert into user_profiles using the SERVICE ROLE
  client so the backend can write without being bound to the caller's RLS.
- All domain-level validation (duplicate email, missing profile) happens
  here before touching Supabase Auth to keep errors clean and consistent.
"""

import logging
from datetime import datetime, timezone

from supabase import Client

from app.models.user import UserCreate, UserLoginRequest, UserLoginResponse, UserResponse
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import (
    ConflictException,
    UnauthorizedException,
    ExternalServiceException,
    NotFoundException,
)

logger = logging.getLogger("purrfect_care.auth")


class AuthService:
    """
    Business logic for user registration, login, logout, session refresh,
    and password reset.

    Receives both the anon client (for auth operations) and the service-role
    client (for writing user_profiles) via constructor injection, making it
    fully testable with mock clients.
    """

    def __init__(self, anon_client: Client, service_client: Client):
        self.anon = anon_client
        self.service = service_client
        self.user_repo = UserRepository(service_client)

    # ──────────────────────────────────────────────────
    # Registration
    # ──────────────────────────────────────────────────

    def register_user(self, data: UserCreate) -> UserLoginResponse:
        """
        Register a new user.

        1. Check for duplicate email in user_profiles.
        2. Create the Supabase auth account.
        3. Insert the domain profile into user_profiles.
        4. Return tokens + profile.
        """
        # 1. Supabase Auth sign-up
        try:
            auth_response = self.anon.auth.sign_up(
                {"email": data.email, "password": data.password}
            )
        except Exception as e:
            logger.error(f"Supabase sign_up failed: {e}")
            raise ExternalServiceException("Supabase", str(e))

        if not auth_response.user:
            raise ExternalServiceException("Supabase", "Sign-up returned no user")

        supabase_user_id = auth_response.user.id

        # 3. Insert domain profile
        now = datetime.now(timezone.utc).isoformat()
        profile_data: dict = {
            "user_id": supabase_user_id,
            "name": data.name,
            "role": data.role.value,
            "phone": data.phone,
            "avatar_url": data.avatar_url,
            "address": data.address,
            "city": data.city,
            "country": data.country,
            "latitude": data.latitude,
            "longitude": data.longitude,
            "is_active": True,
            "created_at": now,
        }
        # Remove None values to let DB defaults apply
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        profile_data["created_at"] = now  # always set

        try:
            profile = self.user_repo.create(profile_data)
        except Exception as e:
            logger.error(f"Failed to insert user_profile for {supabase_user_id}: {e}")
            raise ExternalServiceException("Supabase", f"Profile creation failed: {e}")

        # 4. Build response
        user_response = self._profile_to_response(profile)
        session = auth_response.session

        return UserLoginResponse(
            user=user_response,
            access_token=session.access_token if session else "",
            refresh_token=session.refresh_token if session else None,
            token_type="bearer",
        )

    # ──────────────────────────────────────────────────
    # Login
    # ──────────────────────────────────────────────────

    def login_user(self, data: UserLoginRequest) -> UserLoginResponse:
        """
        Authenticate an existing user with email + password.

        1. Sign in via Supabase Auth.
        2. Retrieve domain profile.
        3. Update last_login timestamp.
        4. Return tokens + profile.
        """
        try:
            auth_response = self.anon.auth.sign_in_with_password(
                {"email": data.email, "password": data.password}
            )
        except Exception as e:
            error_msg = str(e).lower()
            if "invalid" in error_msg or "credentials" in error_msg or "password" in error_msg:
                raise UnauthorizedException("Invalid email or password")
            raise ExternalServiceException("Supabase", str(e))

        if not auth_response.user or not auth_response.session:
            raise UnauthorizedException("Invalid email or password")

        supabase_user_id = auth_response.user.id

        profile = self.user_repo.find_by_user_id(supabase_user_id)
        if not profile:
            raise NotFoundException("User profile")

        # Update last login timestamp (non-blocking, best-effort)
        try:
            self.user_repo.update_last_login(profile["id"])
        except Exception as e:
            logger.warning(f"Failed to update last_login for {profile['id']}: {e}")

        user_response = self._profile_to_response(profile)

        return UserLoginResponse(
            user=user_response,
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
        )

    # ──────────────────────────────────────────────────
    # Logout
    # ──────────────────────────────────────────────────

    def logout_user(self, access_token: str) -> None:
        """
        Invalidate the current session on Supabase Auth.
        Best-effort — does not raise if Supabase call fails.
        """
        try:
            # Sign out the specific token by setting session first
            self.anon.auth.sign_out()
        except Exception as e:
            logger.warning(f"Supabase sign_out failed (non-fatal): {e}")

    # ──────────────────────────────────────────────────
    # Token Refresh
    # ──────────────────────────────────────────────────

    def refresh_session(self, refresh_token: str) -> UserLoginResponse:
        """
        Exchange a refresh token for a new access token.

        1. Call Supabase refresh.
        2. Return new tokens + updated profile.
        """
        try:
            auth_response = self.anon.auth.refresh_session(refresh_token)
        except Exception as e:
            raise UnauthorizedException(f"Token refresh failed: {str(e)}")

        if not auth_response.user or not auth_response.session:
            raise UnauthorizedException("Token refresh failed: invalid refresh token")

        supabase_user_id = auth_response.user.id
        profile = self.user_repo.find_by_user_id(supabase_user_id)
        if not profile:
            raise NotFoundException("User profile")

        user_response = self._profile_to_response(profile)

        return UserLoginResponse(
            user=user_response,
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
        )

    # ──────────────────────────────────────────────────
    # Password Reset
    # ──────────────────────────────────────────────────

    def request_password_reset(self, email: str) -> None:
        """
        Trigger a Supabase password reset email.
        Always returns successfully even if the email does not exist
        (prevents account enumeration).
        """
        try:
            self.anon.auth.reset_password_for_email(email)
        except Exception as e:
            # Log but do not surface — we never confirm whether the email exists
            logger.warning(f"Password reset for {email} failed (suppressed): {e}")

    # ──────────────────────────────────────────────────
    # Get Current User Profile
    # ──────────────────────────────────────────────────

    def get_current_profile(self, supabase_user_id: str) -> UserResponse:
        """
        Retrieve the full domain profile for the authenticated user.
        Called by the GET /api/auth/me endpoint.
        """
        profile = self.user_repo.find_by_user_id(supabase_user_id)
        if not profile:
            raise NotFoundException("User profile")
        return self._profile_to_response(profile)

    # ──────────────────────────────────────────────────
    # Private Helpers
    # ──────────────────────────────────────────────────

    @staticmethod
    def _profile_to_response(profile: dict) -> UserResponse:
        """Convert a raw user_profiles row to a UserResponse model."""
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
