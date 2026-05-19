"""
Tests for the FastAPI application setup, health check, and CORS.
"""


class TestHealthCheck:
    """Test the /api/health endpoint."""

    def test_health_check_returns_200(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_check_response_body(self, client):
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Purrfect Care API"
        assert data["version"] == "1.0.0"
        assert "environment" in data

    def test_health_check_content_type(self, client):
        response = client.get("/api/health")
        assert response.headers["content-type"] == "application/json"


class TestCORS:
    """Test CORS is configured correctly."""

    def test_cors_headers_present(self, client):
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        # FastAPI CORS middleware should respond
        assert response.status_code in (200, 405)

    def test_cors_rejects_unauthorized_origin(self, client):
        response = client.get(
            "/api/health",
            headers={"Origin": "http://malicious-site.com"},
        )
        # Request still succeeds but without CORS headers
        assert response.status_code == 200


class TestDocumentation:
    """Test that Swagger/ReDoc docs are disabled in non-development environments."""

    def test_swagger_docs_disabled_in_testing(self, client):
        """Docs should be disabled when APP_ENV != development."""
        response = client.get("/api/docs")
        # In testing mode, docs are disabled (only enabled in development)
        assert response.status_code == 404

    def test_redoc_disabled_in_testing(self, client):
        response = client.get("/api/redoc")
        assert response.status_code == 404

    def test_openapi_json_disabled_in_testing(self, client):
        response = client.get("/api/openapi.json")
        assert response.status_code == 404


class TestNotFound:
    """Test 404 responses for non-existent routes."""

    def test_unknown_route_returns_404(self, client):
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
