"""
Purrfect Care — Test Configuration

Shared fixtures and test client setup for all tests.

All Supabase client calls are mocked globally so no live connections
are attempted during the test suite. Individual tests can further
override service dependencies via app.dependency_overrides.
"""

import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Set test environment variables BEFORE importing app
os.environ.update({
    "APP_ENV": "testing",
    "APP_DEBUG": "true",
    "SUPABASE_URL": "https://test-project.supabase.co",
    "SUPABASE_ANON_KEY": "test-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
    "SUPABASE_JWT_SECRET": "test-jwt-secret-at-least-32-chars-long",
    "STRIPE_SECRET_KEY": "sk_test_fake",
    "OPENAI_API_KEY": "sk-test-fake",
})

from app.config import get_settings, Settings
from app.database import get_supabase_client, get_supabase_anon_client
from app.main import create_app


# ────────────────────────────────────────────────────────────
# Mock Supabase client factory
# ────────────────────────────────────────────────────────────

def _make_mock_supabase_client() -> MagicMock:
    """
    Return a MagicMock that quacks like a supabase.Client.
    Table-chained calls (.table().select().eq()...execute()) all
    return MagicMocks by default, which prevents SupabaseException
    from being raised when the test doesn't override the service dep.
    """
    mock = MagicMock()
    # .table(...) chain — each call returns a new MagicMock naturally
    return mock


# ────────────────────────────────────────────────────────────
# Session-level fixtures
# ────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def _base_app():
    """Create the FastAPI application once per session."""
    get_settings.cache_clear()
    # Clear the lru_cache so mock clients are created fresh
    get_supabase_client.cache_clear()
    get_supabase_anon_client.cache_clear()
    return create_app()


# ────────────────────────────────────────────────────────────
# Function-scoped fixtures (fresh overrides for each test)
# ────────────────────────────────────────────────────────────

@pytest.fixture
def app(_base_app):
    """
    Provide the app with globally mocked Supabase clients.
    Overrides are cleared after each test so they don't bleed across tests.
    """
    mock_svc_client = _make_mock_supabase_client()
    mock_anon_client = _make_mock_supabase_client()

    _base_app.dependency_overrides[get_supabase_client] = lambda: mock_svc_client
    _base_app.dependency_overrides[get_supabase_anon_client] = lambda: mock_anon_client

    yield _base_app

    _base_app.dependency_overrides.clear()


@pytest.fixture
def client(app):
    """Create a test HTTP client with mocked Supabase."""
    return TestClient(app)


@pytest.fixture
def settings():
    """Get test settings."""
    get_settings.cache_clear()
    return get_settings()
