"""
Tests for Auth endpoints — POST /api/auth/register, /login,
/logout, /refresh, /password-reset, GET /api/auth/me.

All Supabase calls are mocked so no live network calls are made.
We use FastAPI's dependency_overrides to inject fake AuthService instances.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.services.auth_service import AuthService
from app.controllers.auth_controller import get_auth_service
from app.models.user import UserResponse, UserLoginResponse, Role


# ─────────────────────────────────────────────────────────────
# Shared fixtures
# ─────────────────────────────────────────────────────────────

NOW = datetime.now(timezone.utc)

FAKE_PROFILE = {
    "id": "profile-uuid-001",
    "user_id": "auth-uuid-001",
    "email": "test@example.com",
    "name": "Test User",
    "phone": None,
    "avatar_url": None,
    "address": None,
    "city": None,
    "country": None,
    "role": "cat_owner",
    "is_active": True,
    "created_at": NOW.isoformat(),
    "updated_at": None,
}

FAKE_USER_RESPONSE = UserResponse(
    id="profile-uuid-001",
    email="test@example.com",
    name="Test User",
    role=Role.CAT_OWNER,
    is_active=True,
    created_at=NOW,
    updated_at=None,
)

FAKE_LOGIN_RESPONSE = UserLoginResponse(
    user=FAKE_USER_RESPONSE,
    access_token="fake-access-token",
    refresh_token="fake-refresh-token",
    token_type="bearer",
)


def make_auth_service_override(mock_service: AuthService):
    """Return a factory function that always returns mock_service."""
    def _override() -> AuthService:
        return mock_service
    return _override


# ─────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, app, client):
        mock_service = MagicMock(spec=AuthService)
        mock_service.register_user.return_value = FAKE_LOGIN_RESPONSE
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "securepass123",
        })

        assert response.status_code == 201
        data = response.json()
        assert data["access_token"] == "fake-access-token"
        assert data["user"]["email"] == "test@example.com"
        assert data["token_type"] == "bearer"
        mock_service.register_user.assert_called_once()

        app.dependency_overrides.clear()

    def test_register_duplicate_email_returns_409(self, app, client):
        from app.utils.exceptions import ConflictException
        mock_service = MagicMock(spec=AuthService)
        mock_service.register_user.side_effect = ConflictException(
            "A user with this email already exists"
        )
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post("/api/auth/register", json={
            "name": "Test",
            "email": "duplicate@example.com",
            "password": "securepass123",
        })

        assert response.status_code == 409
        data = response.json()
        assert data["error_code"] == "CONFLICT"

        app.dependency_overrides.clear()

    def test_register_missing_email_returns_400(self, client):
        response = client.post("/api/auth/register", json={
            "name": "Test",
            "password": "securepass123",
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "VALIDATION_ERROR"

    def test_register_short_password_returns_400(self, client):
        response = client.post("/api/auth/register", json={
            "name": "Test",
            "email": "test@example.com",
            "password": "short",
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "VALIDATION_ERROR"

    def test_register_invalid_email_returns_400(self, client):
        response = client.post("/api/auth/register", json={
            "name": "Test",
            "email": "not-an-email",
            "password": "securepass123",
        })
        assert response.status_code == 400

    def test_register_with_vet_role(self, app, client):
        mock_service = MagicMock(spec=AuthService)
        vet_response = UserLoginResponse(
            user=UserResponse(
                id="profile-002",
                email="vet@clinic.com",
                name="Dr. Vet",
                role=Role.VET,
                is_active=True,
                created_at=NOW,
            ),
            access_token="vet-token",
            refresh_token=None,
            token_type="bearer",
        )
        mock_service.register_user.return_value = vet_response
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post("/api/auth/register", json={
            "name": "Dr. Vet",
            "email": "vet@clinic.com",
            "password": "securepass123",
            "role": "vet",
        })

        assert response.status_code == 201
        assert response.json()["user"]["role"] == "vet"

        app.dependency_overrides.clear()


class TestLogin:
    def test_login_success(self, app, client):
        mock_service = MagicMock(spec=AuthService)
        mock_service.login_user.return_value = FAKE_LOGIN_RESPONSE
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "securepass123",
        })

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "fake-access-token"
        assert data["refresh_token"] == "fake-refresh-token"

        app.dependency_overrides.clear()

    def test_login_invalid_credentials_returns_401(self, app, client):
        from app.utils.exceptions import UnauthorizedException
        mock_service = MagicMock(spec=AuthService)
        mock_service.login_user.side_effect = UnauthorizedException(
            "Invalid email or password"
        )
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword",
        })

        assert response.status_code == 401
        assert response.json()["error_code"] == "UNAUTHORIZED"

        app.dependency_overrides.clear()

    def test_login_missing_password_returns_400(self, client):
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
        })
        assert response.status_code == 400


class TestLogout:
    def test_logout_success(self, app, client):
        mock_service = MagicMock(spec=AuthService)
        mock_service.logout_user.return_value = None
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post(
            "/api/auth/logout",
            headers={"Authorization": "Bearer fake-access-token"},
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

        app.dependency_overrides.clear()

    def test_logout_without_token_returns_403(self, client):
        response = client.post("/api/auth/logout")
        # HTTPBearer returns 403 when no token is present
        assert response.status_code == 403


class TestRefresh:
    def test_refresh_success(self, app, client):
        mock_service = MagicMock(spec=AuthService)
        mock_service.refresh_session.return_value = UserLoginResponse(
            user=FAKE_USER_RESPONSE,
            access_token="new-access-token",
            refresh_token="new-refresh-token",
            token_type="bearer",
        )
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post("/api/auth/refresh", json={
            "refresh_token": "old-refresh-token",
        })

        assert response.status_code == 200
        assert response.json()["access_token"] == "new-access-token"

        app.dependency_overrides.clear()

    def test_refresh_invalid_token_returns_401(self, app, client):
        from app.utils.exceptions import UnauthorizedException
        mock_service = MagicMock(spec=AuthService)
        mock_service.refresh_session.side_effect = UnauthorizedException(
            "Token refresh failed: invalid refresh token"
        )
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        response = client.post("/api/auth/refresh", json={
            "refresh_token": "bad-token",
        })

        assert response.status_code == 401

        app.dependency_overrides.clear()


class TestPasswordReset:
    def test_password_reset_always_returns_200(self, app, client):
        mock_service = MagicMock(spec=AuthService)
        mock_service.request_password_reset.return_value = None
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        # Registered email
        response = client.post("/api/auth/password-reset", json={
            "email": "registered@example.com"
        })
        assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_password_reset_invalid_email_returns_400(self, client):
        response = client.post("/api/auth/password-reset", json={
            "email": "not-an-email"
        })
        assert response.status_code == 400


class TestGetMe:
    def test_get_me_returns_profile(self, app, client):
        from app.middleware.auth_middleware import AuthenticatedUser, get_current_user

        mock_service = MagicMock(spec=AuthService)
        mock_service.get_current_profile.return_value = FAKE_USER_RESPONSE
        app.dependency_overrides[get_auth_service] = make_auth_service_override(mock_service)

        fake_user = AuthenticatedUser(
            id="auth-uuid-001",
            email="test@example.com",
            role="cat_owner",
        )
        app.dependency_overrides[get_current_user] = lambda: fake_user

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer fake-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["role"] == "cat_owner"

        app.dependency_overrides.clear()

    def test_get_me_without_token_returns_403(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 403
