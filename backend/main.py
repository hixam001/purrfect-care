"""
Firebase Cloud Functions entry point.
Adapts the FastAPI ASGI app to run as a Firebase HTTP Cloud Function.

Secrets (managed via Firebase Secret Manager) are mounted as env vars
by passing them to the @https_fn.on_request decorator. They are then
automatically available as os.environ variables inside the function.
"""
import asyncio
import os

from firebase_functions import https_fn
from firebase_functions.params import SecretParam
from flask import Response

# ── Declare all secrets ── (Firebase mounts these as env vars at runtime)
GEMINI_API_KEY           = SecretParam("GEMINI_API_KEY")
SUPABASE_URL             = SecretParam("SUPABASE_URL")
SUPABASE_ANON_KEY        = SecretParam("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = SecretParam("SUPABASE_SERVICE_ROLE_KEY")

# We create the FastAPI app lazily (first request) so that the secret
# env vars are already populated by the time the app reads Settings().
_fastapi_app = None

def _get_app():
    global _fastapi_app
    if _fastapi_app is None:
        from app.main import create_app
        _fastapi_app = create_app()
    return _fastapi_app


def _run_asgi(asgi_app, request: https_fn.Request) -> Response:
    """Bridge a Firebase (Flask-style) request into the FastAPI ASGI app."""
    body: bytes = request.get_data()

    scope = {
        "type":         "http",
        "asgi":         {"version": "3.0"},
        "http_version": "1.1",
        "method":       request.method,
        "headers":      [
            (k.lower().encode(), v.encode())
            for k, v in request.headers.items()
        ],
        "path":         request.path or "/",
        "query_string": request.query_string or b"",
        "root_path":    "",
        "server":       ("localhost", 443),
        "scheme":       "https",
    }

    response_meta:   dict = {"status": 500, "headers": []}
    response_chunks: list = []

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message: dict):
        if message["type"] == "http.response.start":
            response_meta["status"]  = message["status"]
            response_meta["headers"] = message.get("headers", [])
        elif message["type"] == "http.response.body":
            if chunk := message.get("body"):
                response_chunks.append(chunk)

    asyncio.run(asgi_app(scope, receive, send))

    headers = {
        k.decode(): v.decode()
        for k, v in response_meta["headers"]
    }
    return Response(
        b"".join(response_chunks),
        status=response_meta["status"],
        headers=headers,
    )


@https_fn.on_request(
    region="us-central1",
    secrets=[
        GEMINI_API_KEY,
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY,
    ],
    timeout_sec=120,
    memory=512,
)
def server(req: https_fn.Request) -> https_fn.Response:
    """Main entry point — all HTTP requests delegated to FastAPI."""
    return _run_asgi(_get_app(), req)
