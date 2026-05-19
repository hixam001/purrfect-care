"""
Purrfect Care — Test Configuration

Shared fixtures and test client setup for all tests.
"""

import os
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
from app.main import create_app


@pytest.fixture(scope="session")
def app():
    """Create a fresh FastAPI app for testing."""
    # Clear the cached settings so test env vars are used
    get_settings.cache_clear()
    test_app = create_app()
    return test_app


@pytest.fixture(scope="session")
def client(app):
    """Create a test HTTP client."""
    return TestClient(app)


@pytest.fixture
def settings():
    """Get test settings."""
    get_settings.cache_clear()
    return get_settings()
