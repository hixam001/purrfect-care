"""
Purrfect Care — FastAPI Application Entry Point

Configures the FastAPI app with:
- CORS middleware
- Rate limiting
- Global error handlers
- All API routers (added incrementally per phase)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.error_handler import register_error_handlers
from app.middleware.rate_limiter import register_rate_limiter
from app.middleware.security_headers import SecurityHeadersMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("purrfect_care")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    settings = get_settings()
    logger.info(f"🐱 Purrfect Care API starting in {settings.APP_ENV} mode")
    logger.info(f"📡 Supabase URL: {settings.SUPABASE_URL}")
    yield
    logger.info("🐱 Purrfect Care API shutting down")


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI app."""
    settings = get_settings()

    app = FastAPI(
        title="Purrfect Care API",
        description=(
            "All-in-one cat care platform — veterinary appointments, "
            "real-time vet chat, AI health companion, cat store, "
            "medicine database, and more."
        ),
        version="1.0.0",
        docs_url="/api/docs" if settings.is_development else None,
        redoc_url="/api/redoc" if settings.is_development else None,
        openapi_url="/api/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
    )

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Security Headers ---
    app.add_middleware(SecurityHeadersMiddleware)

    # --- Error Handlers ---
    register_error_handlers(app)

    # --- Rate Limiter ---
    register_rate_limiter(app)

    # --- API Routers ---
    # Phase 3: Auth & Users
    from app.controllers.auth_controller import router as auth_router
    from app.controllers.user_controller import router as user_router
    from app.controllers.payment_controller import router as payment_router
    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(user_router, prefix="/api/users", tags=["Users"])
    app.include_router(payment_router, prefix="/api", tags=["Payments"])

    # Phase 4: Cats & Breeds
    # from app.controllers.cat_controller import router as cat_router
    # app.include_router(cat_router, prefix="/api", tags=["Cats & Breeds"])

    # Phase 5: Hospitals & Appointments
    # from app.controllers.hospital_controller import router as hospital_router
    # from app.controllers.appointment_controller import router as appointment_router
    # app.include_router(hospital_router, prefix="/api/hospitals", tags=["Hospitals"])
    # app.include_router(appointment_router, prefix="/api/appointments", tags=["Appointments"])

    # Phase 6: Chat, AI, Prescriptions
    # from app.controllers.chat_controller import router as chat_router
    from app.controllers.ai_controller import router as ai_router
    # from app.controllers.prescription_controller import router as prescription_router
    # app.include_router(chat_router, prefix="/api/chats", tags=["Chat"])
    app.include_router(ai_router, prefix="/api/ai", tags=["AI Companion"])
    # app.include_router(prescription_router, prefix="/api/prescriptions", tags=["Prescriptions"])

    # Phase 7: Stores & Orders
    # from app.controllers.store_controller import router as store_router
    # from app.controllers.order_controller import router as order_router
    # app.include_router(store_router, prefix="/api/stores", tags=["Stores"])
    # app.include_router(order_router, prefix="/api/orders", tags=["Orders"])

    # Phase 8: Reviews, Offers, Admin
    # from app.controllers.review_controller import router as review_router
    # from app.controllers.offer_controller import router as offer_router
    # from app.controllers.admin_controller import router as admin_router
    # app.include_router(review_router, prefix="/api/reviews", tags=["Reviews"])
    # app.include_router(offer_router, prefix="/api/offers", tags=["Offers"])
    # app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

    # --- Health Check ---
    @app.get("/api/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "service": "Purrfect Care API",
            "version": "1.0.0",
            "environment": settings.APP_ENV,
        }

    return app


# Create the app instance
app = create_app()
