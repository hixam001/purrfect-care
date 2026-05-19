"""
Tests for middleware — RBAC role guard and error handler.
"""

import pytest
from app.middleware.role_guard import require_role, VALID_ROLES
from app.middleware.auth_middleware import AuthenticatedUser


class TestRoleGuard:
    def test_valid_roles_set(self):
        assert "cat_owner" in VALID_ROLES
        assert "vet" in VALID_ROLES
        assert "hospital_admin" in VALID_ROLES
        assert "store_owner" in VALID_ROLES
        assert "admin" in VALID_ROLES
        assert len(VALID_ROLES) == 5

    def test_require_role_rejects_invalid_role(self):
        with pytest.raises(ValueError, match="Invalid role"):
            require_role("superadmin")

    def test_require_role_accepts_valid_roles(self):
        # Should not raise
        checker = require_role("vet", "admin")
        assert callable(checker)

    def test_require_single_role(self):
        checker = require_role("admin")
        assert callable(checker)


class TestAuthenticatedUser:
    def test_user_creation(self):
        user = AuthenticatedUser(id="123", email="test@test.com", role="cat_owner")
        assert user.id == "123"
        assert user.email == "test@test.com"
        assert user.role == "cat_owner"

    def test_user_repr(self):
        user = AuthenticatedUser(id="123", email="test@test.com", role="vet")
        repr_str = repr(user)
        assert "123" in repr_str
        assert "vet" in repr_str


class TestConfigSettings:
    def test_settings_loaded(self, settings):
        assert settings.APP_ENV == "testing"
        assert settings.SUPABASE_URL == "https://test-project.supabase.co"

    def test_cors_origins_parsed(self, settings):
        origins = settings.cors_origins_list
        assert isinstance(origins, list)
        assert len(origins) >= 1

    def test_is_development_false_in_testing(self, settings):
        assert settings.is_development is False

    def test_is_production_false_in_testing(self, settings):
        assert settings.is_production is False
