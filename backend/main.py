"""
Firebase Cloud Functions entry point.
Adapts the FastAPI ASGI app to run as a Firebase HTTP Cloud Function.
"""
import asyncio

from firebase_functions import https_fn
from flask import Response

from app.main import create_app

_fastapi_app = create_app()


def _run_asgi(asgi_app, request: https_fn.Request) -> Response:
    """Bridge a Firebase (Flask-style) request into the FastAPI ASGI app."""
    body: bytes = request.get_data()

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": request.method,
        "headers": [
            (k.lower().encode(), v.encode())
            for k, v in request.headers.items()
        ],
        "path": request.path or "/",
        "query_string": request.query_string or b"",
        "root_path": "",
        "server": ("localhost", 443),
        "scheme": "https",
    }

    response_meta: dict = {"status": 500, "headers": []}
    response_chunks: list = []

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message: dict):
        if message["type"] == "http.response.start":
            response_meta["status"] = message["status"]
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


@https_fn.on_request(region="us-central1")
def server(req: https_fn.Request) -> https_fn.Response:
    """Main entry point — all HTTP requests delegated to FastAPI."""
    return _run_asgi(_fastapi_app, req)
