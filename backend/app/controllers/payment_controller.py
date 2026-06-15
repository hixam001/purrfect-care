import hashlib
import hmac
import logging
import math
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.database import get_supabase_client

logger = logging.getLogger("purrfect_care.payments")

PLATFORM_FEE_RATE   = 0.015   # 1.5%
APPOINTMENT_BASE    = 500     # PKR fixed appointment fee
APPOINTMENT_TOTAL   = math.ceil(APPOINTMENT_BASE * (1 + PLATFORM_FEE_RATE))  # 508 PKR

router = APIRouter()

SAFEPAY_SANDBOX_BASE = "https://sandbox.api.getsafepay.com"
SAFEPAY_LIVE_BASE = "https://api.getsafepay.com"


def _safepay_base(settings: Settings) -> str:
    return SAFEPAY_SANDBOX_BASE if settings.SAFEPAY_ENV == "sandbox" else SAFEPAY_LIVE_BASE


def _verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


class CreatePaymentRequest(BaseModel):
    amount: int
    currency: str = "PKR"
    order_id: str
    cancel_url: str
    redirect_url: str


@router.post("/payments/create-session", status_code=status.HTTP_201_CREATED)
async def create_payment_session(
    body: CreatePaymentRequest,
    settings: Settings = Depends(get_settings),
):
    base = _safepay_base(settings)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{base}/order/v1/init",
            json={
                "merchant_api_key": settings.SAFEPAY_PUBLIC_KEY,
                "intent": "CYBERSOURCE",
                "mode": "payment",
                "currency": body.currency,
                "amount": body.amount,
                "order_id": body.order_id,
                "cancel_url": body.cancel_url,
                "redirect_url": body.redirect_url,
            },
            headers={"Content-Type": "application/json"},
            timeout=15.0,
        )

    if response.status_code not in (200, 201):
        logger.error("Safepay session creation failed: %s", response.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create payment session with Safepay.",
        )

    data = response.json()
    tracker = data.get("data", {}).get("tracker", {}).get("token")
    if not tracker:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Safepay did not return a payment token.",
        )

    checkout_url = (
        f"{'https://sandbox.api.getsafepay.com' if settings.SAFEPAY_ENV == 'sandbox' else 'https://www.getsafepay.com'}"
        f"/checkout/pay/{tracker}"
        f"?env={'sandbox' if settings.SAFEPAY_ENV == 'sandbox' else 'production'}"
    )

    return {
        "token": tracker,
        "checkout_url": checkout_url,
    }


# ─────────────────────────────────────────────────────────────
# Order payment session (store order with 1.5% platform fee)
# ─────────────────────────────────────────────────────────────

class OrderPaymentRequest(BaseModel):
    order_id: str          # your internal order ref
    amount_pkr: int        # cart total in PKR (without fee)
    redirect_url: str
    cancel_url: str


@router.post("/payments/order-session", status_code=status.HTTP_201_CREATED)
async def create_order_payment_session(
    body: OrderPaymentRequest,
    settings: Settings = Depends(get_settings),
):
    """Create a Safepay session for a store order (cart + 1.5% platform fee)."""
    fee_pkr        = math.ceil(body.amount_pkr * PLATFORM_FEE_RATE)
    total_pkr      = body.amount_pkr + fee_pkr
    total_paisa    = total_pkr * 100
    safepay_oid    = f"ORD-{body.order_id}"

    base = _safepay_base(settings)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/order/v1/init",
            json={
                "merchant_api_key": settings.SAFEPAY_PUBLIC_KEY,
                "intent":           "CYBERSOURCE",
                "mode":             "payment",
                "currency":         "PKR",
                "amount":           total_paisa,
                "order_id":         safepay_oid,
                "cancel_url":       body.cancel_url,
                "redirect_url":     body.redirect_url,
            },
            headers={"Content-Type": "application/json"},
            timeout=15.0,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail="Payment gateway error.")

    data    = resp.json()
    tracker = data.get("data", {}).get("tracker", {}).get("token")
    if not tracker:
        raise HTTPException(status_code=502, detail="No payment token returned.")

    checkout_url = (
        f"{'https://sandbox.api.getsafepay.com' if settings.SAFEPAY_ENV == 'sandbox' else 'https://www.getsafepay.com'}"
        f"/checkout/pay/{tracker}"
        f"?env={'sandbox' if settings.SAFEPAY_ENV == 'sandbox' else 'production'}"
    )

    return {
        "token":        tracker,
        "checkout_url": checkout_url,
        "order_id":     safepay_oid,
        "amount_pkr":   body.amount_pkr,
        "fee_pkr":      fee_pkr,
        "total_pkr":    total_pkr,
    }


# ─────────────────────────────────────────────────────────────
# Appointment payment session (₨500 fixed + 1.5% = ₨508)
# ─────────────────────────────────────────────────────────────

class AppointmentPaymentRequest(BaseModel):
    appointment_ref: str   # internal reference (for order_id)
    redirect_url: str
    cancel_url: str


@router.post("/payments/appointment-session", status_code=status.HTTP_201_CREATED)
async def create_appointment_payment_session(
    body: AppointmentPaymentRequest,
    settings: Settings = Depends(get_settings),
):
    """Create a Safepay session for an appointment booking (₨508 fixed)."""
    total_paisa  = APPOINTMENT_TOTAL * 100
    safepay_oid  = f"APT-{body.appointment_ref}"

    base = _safepay_base(settings)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/order/v1/init",
            json={
                "merchant_api_key": settings.SAFEPAY_PUBLIC_KEY,
                "intent":           "CYBERSOURCE",
                "mode":             "payment",
                "currency":         "PKR",
                "amount":           total_paisa,
                "order_id":         safepay_oid,
                "cancel_url":       body.cancel_url,
                "redirect_url":     body.redirect_url,
            },
            headers={"Content-Type": "application/json"},
            timeout=15.0,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail="Payment gateway error.")

    data    = resp.json()
    tracker = data.get("data", {}).get("tracker", {}).get("token")
    if not tracker:
        raise HTTPException(status_code=502, detail="No payment token returned.")

    checkout_url = (
        f"{'https://sandbox.api.getsafepay.com' if settings.SAFEPAY_ENV == 'sandbox' else 'https://www.getsafepay.com'}"
        f"/checkout/pay/{tracker}"
        f"?env={'sandbox' if settings.SAFEPAY_ENV == 'sandbox' else 'production'}"
    )

    return {
        "token":           tracker,
        "checkout_url":    checkout_url,
        "order_id":        safepay_oid,
        "base_fee_pkr":    APPOINTMENT_BASE,
        "platform_fee_pkr": APPOINTMENT_TOTAL - APPOINTMENT_BASE,
        "total_pkr":       APPOINTMENT_TOTAL,
    }


@router.post("/payments/webhook", status_code=status.HTTP_200_OK)
async def safepay_webhook(
    request: Request,
    x_sfpy_signature: str = Header(None, alias="x-sfpy-signature"),
    settings: Settings = Depends(get_settings),
):
    payload = await request.body()

    if settings.SAFEPAY_WEBHOOK_SECRET:
        if not x_sfpy_signature:
            logger.warning("Webhook received without signature header — rejected.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Safepay signature header.",
            )

        if not _verify_webhook_signature(
            payload, x_sfpy_signature, settings.SAFEPAY_WEBHOOK_SECRET
        ):
            logger.warning("Webhook signature verification failed — rejected.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature.",
            )

    try:
        event = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload.",
        )

    event_type = event.get("type") or event.get("event_type", "")
    logger.info("Safepay webhook received: %s", event_type)

    if event_type in ("payment:created", "payment:succeeded"):
        tracker  = event.get("data", {}).get("tracker", {}).get("token")
        order_id = event.get("data", {}).get("order_id", "")
        amount   = event.get("data", {}).get("amount")
        logger.info(
            "Payment succeeded — tracker=%s order_id=%s amount=%s",
            tracker, order_id, amount,
        )

        # Activate subscription when SUB-* order completes
        if order_id.startswith("SUB-"):
            try:
                from app.database import get_supabase_client as _get_sb
                _sb = next(_get_sb())
                _sb.table("subscriptions").update({
                    "status":     "active",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                }).eq("safepay_order_id", order_id).execute()
                logger.info("Subscription activated for order_id=%s", order_id)
            except Exception as _e:
                logger.error("Failed to activate subscription: %s", _e)

    elif event_type in ("payment:failed", "payment:reversed"):
        tracker = event.get("data", {}).get("tracker", {}).get("token")
        reason = event.get("data", {}).get("reason", "unknown")
        logger.warning("Payment failed — tracker=%s reason=%s", tracker, reason)

    elif event_type == "refund:created":
        logger.info("Refund created: %s", event.get("data"))

    else:
        logger.info("Unhandled Safepay event type: %s", event_type)

    return {"received": True}
