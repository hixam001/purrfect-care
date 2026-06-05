"""
Tests for User endpoints — PUT /api/users/me.

All Supabase and repository calls are mocked via FastAPI dependency_overrides.
No live network calls are made.
"""

import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone

from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
from app.controllers.user_controller import get_user_service, get_user_repository
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.models.user import UserResponse, Role


NOW = datetime.now(timezone.utc)

FAKE_USER_RESPONSE = UserResponse(
    id="profile-uuid-001",
    email="test@example.com",
    name="Test User",
    role=Role.CAT_OWNER,
    is_active=True,
    created_at=NOW,
    updated_at=None,
)

FAKE_PROFILE_ROW = {
    "id": "profile-uuid-001",
    "user_id": "auth-uuid-001",
    "email": "test@example.com",
    "name": "Test User",
    "role": "cat_owner",
    "is_active": True,
    "created_at": NOW.isoformat(),
    "updated_at": None,
}


def _fake_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id="auth-uuid-001",
        email="test@example.com",
        role="cat_owner",
    )


class TestUpdateProfile:
    def test_update_name_success(self, app, client):
        mock_service = MagicMock(spec=UserService)
        updated = FAKE_USER_RESPONSE.model_copy(update={"name": "Updated Name"})
        mock_service.update_profile.return_value = updated

        mock_repo = MagicMock(spec=UserRepository)
        mock_repo.find_by_user_id.return_value = FAKE_PROFILE_ROW

        app.dependency_overrides[get_user_service] = lambda: mock_service
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        app.dependency_overrides[get_current_user] = _fake_user

        response = client.put(
            "/api/users/me",
            json={"name": "Updated Name"},
            headers={"Authorization": "Bearer fake-token"},
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
        mock_service.update_profile.assert_called_once_with("profile-uuid-001", unittest_any())

        app.dependency_overrides.clear()

    def test_update_location_success(self, app, client):
        mock_service = MagicMock(spec=UserService)
        updated = FAKE_USER_RESPONSE.model_copy(update={"city": "Lahore"})
        mock_service.update_profile.return_value = updated

        mock_repo = MagicMock(spec=UserRepository)
        mock_repo.find_by_user_id.return_value = FAKE_PROFILE_ROW

        app.dependency_overrides[get_user_service] = lambda: mock_service
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        app.dependency_overrides[get_current_user] = _fake_user

        response = client.put(
            "/api/users/me",
            json={
                "city": "Lahore",
                "country": "Pakistan",
                "latitude": 31.5,
                "longitude": 74.3,
            },
            headers={"Authorization": "Bearer fake-token"},
        )

        assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_update_empty_body_succeeds(self, app, client):
        """Empty body is valid — all fields in UserUpdate are optional."""
        mock_service = MagicMock(spec=UserService)
        mock_service.update_profile.return_value = FAKE_USER_RESPONSE

        mock_repo = MagicMock(spec=UserRepository)
        mock_repo.find_by_user_id.return_value = FAKE_PROFILE_ROW

        app.dependency_overrides[get_user_service] = lambda: mock_service
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        app.dependency_overrides[get_current_user] = _fake_user

        response = client.put(
            "/api/users/me",
            json={},
            headers={"Authorization": "Bearer fake-token"},
        )

        assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_update_invalid_latitude_returns_400(self, app, client):
        """Latitude > 90 must be rejected by Pydantic validation."""
        mock_service = MagicMock(spec=UserService)
        mock_repo = MagicMock(spec=UserRepository)
        mock_repo.find_by_user_id.return_value = FAKE_PROFILE_ROW

        app.dependency_overrides[get_user_service] = lambda: mock_service
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        app.dependency_overrides[get_current_user] = _fake_user

        response = client.put(
            "/api/users/me",
            json={"latitude": 200.0},
            headers={"Authorization": "Bearer fake-token"},
        )

        assert response.status_code == 400
        assert response.json()["error_code"] == "VALIDATION_ERROR"

        app.dependency_overrides.clear()

    def test_update_without_token_returns_403(self, client):
        """No Authorization header → HTTPBearer rejects with 403."""
        response = client.put("/api/users/me", json={"name": "Test"})
        assert response.status_code == 403

    def test_update_profile_not_found_returns_404(self, app, client):
        """Profile lookup returns None → 404 NOT_FOUND."""
        from app.utils.exceptions import NotFoundException

        mock_service = MagicMock(spec=UserService)
        mock_repo = MagicMock(spec=UserRepository)
        mock_repo.find_by_user_id.return_value = None  # simulate missing profile

        app.dependency_overrides[get_user_service] = lambda: mock_service
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        app.dependency_overrides[get_current_user] = _fake_user

        response = client.put(
            "/api/users/me",
            json={"name": "Test"},
            headers={"Authorization": "Bearer fake-token"},
        )

        assert response.status_code == 404
        assert response.json()["error_code"] == "NOT_FOUND"

        app.dependency_overrides.clear()


# ── Helper ─────────────────────────────────────────────────────

def unittest_any():
    """A sentinel object that equals anything — used in assert_called_once_with."""
    class _Any:
        def __eq__(self, other):
            return True
    return _Any()
