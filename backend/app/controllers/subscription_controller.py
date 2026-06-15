"""
Purrfect Care — Subscription Controller

Routes under /api/subscriptions:
  GET  /plans               — list plans for a role
  GET  /me                  — current user's active subscription
  POST /checkout            — create Safepay session for a paid plan
  POST /activate            — activate a free plan directly (no payment)
"""
import logging
import math
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.database import get_supabase_client
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user
from app.models.subscription import (
    ActivateSubscriptionRequest,
    SubscriptionCheckoutRequest,
    SubscriptionPlan,
    SubscriptionResponse,
)

logger = logging.getLogger("purrfect_care.subscriptions")
router = APIRouter()

SAFEPAY_SANDBOX_BASE = "https://sandbox.api.getsafepay.com"
SAFEPAY_LIVE_BASE    = "https://api.getsafepay.com"


def _safepay_base(settings: Settings) -> str:
    return SAFEPAY_SANDBOX_BASE if settings.SAFEPAY_ENV == "sandbox" else SAFEPAY_LIVE_BASE


def _checkout_url(tracker: str, settings: Settings) -> str:
    """Safepay checkout page URL (NOT the API subdomain)."""
    if settings.SAFEPAY_ENV == "sandbox":
        return f"https://sandbox.getsafepay.com/checkout/pay/{tracker}?env=sandbox"
    return f"https://www.getsafepay.com/checkout/pay/{tracker}?env=production"


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def _get_profile_id(user: AuthenticatedUser, sb) -> str:
    """Resolve Supabase auth UID → user_profiles.id."""
    row = (
        sb.table("user_profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return row.data


def _get_plan(plan_id: str, sb) -> dict:
    row = sb.table("subscription_plans").select("*").eq("id", plan_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found.")
    return row.data


def _active_subscription(profile_id: str, sb) -> dict | None:
    row = (
        sb.table("subscriptions")
        .select("*")
        .eq("profile_id", profile_id)
        .in_("status", ["active", "pending_payment"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return row.data[0] if row.data else None


# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

@router.get("/plans", response_model=list[SubscriptionPlan])
async def list_plans(
    role: str = "store_owner",
    sb=Depends(get_supabase_client),
):
    """Return all active plans for a given role."""
    rows = (
        sb.table("subscription_plans")
        .select("*")
        .eq("for_role", role)
        .eq("is_active", True)
        .execute()
    )
    plans = rows.data or []
    # Parse features from JSONB (may already be list)
    for p in plans:
        if isinstance(p.get("features"), str):
            import json
            p["features"] = json.loads(p["features"])
    return [SubscriptionPlan(**p) for p in plans]


@router.get("/me")
async def get_my_subscription(
    current_user: AuthenticatedUser = Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    """Return the current user's active subscription + plan, or null."""
    profile = _get_profile_id(current_user, sb)
    sub = _active_subscription(profile["id"], sb)
    if not sub:
        return {"subscription": None, "plan": None}

    plan = _get_plan(sub["plan_id"], sb)
    if isinstance(plan.get("features"), str):
        import json
        plan["features"] = json.loads(plan["features"])

    return {"subscription": sub, "plan": plan}


@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def subscription_checkout(
    body: SubscriptionCheckoutRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    sb=Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    """Create a Safepay payment session for a paid subscription plan."""
    profile = _get_profile_id(current_user, sb)
    plan    = _get_plan(body.plan_id, sb)

    # Block free plan through this endpoint
    price = plan["price_monthly"] if body.billing_cycle == "monthly" else plan["price_yearly"]
    if price == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /activate for free plans.",
        )

    # Verify role matches plan
    if plan["for_role"] != profile["role"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This plan is not available for your account type.",
        )

    order_id = f"SUB-{profile['id'][:8]}-{int(datetime.now(timezone.utc).timestamp())}"
    amount_paisa = price * 100  # PKR → paisa

    base = _safepay_base(settings)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/order/v1/init",
            json={
                "merchant_api_key": settings.SAFEPAY_SECRET_KEY,
                "intent":           "CYBERSOURCE",
                "mode":             "payment",
                "currency":         "PKR",
                "amount":           amount_paisa,
                "order_id":         order_id,
                "cancel_url":       body.cancel_url,
                "redirect_url":     body.redirect_url,
            },
            headers={"Content-Type": "application/json"},
            timeout=15.0,
        )

    if resp.status_code not in (200, 201):
        logger.error("Safepay session failed: %s", resp.text)
        raise HTTPException(status_code=502, detail="Payment gateway error.")

    data    = resp.json()
    tracker = data.get("data", {}).get("tracker", {}).get("token")
    if not tracker:
        raise HTTPException(status_code=502, detail="No payment token returned.")

    # Create a pending subscription row so webhook can activate it
    sb.table("subscriptions").insert({
        "profile_id":       profile["id"],
        "plan_id":          body.plan_id,
        "status":           "pending_payment",
        "billing_cycle":    body.billing_cycle,
        "safepay_order_id": order_id,
    }).execute()

    return {"token": tracker, "checkout_url": _checkout_url(tracker, settings), "order_id": order_id}



@router.post("/activate", status_code=status.HTTP_201_CREATED)
async def activate_free_plan(
    body: ActivateSubscriptionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    """Directly activate a free plan (price = 0) — no Safepay needed."""
    profile = _get_profile_id(current_user, sb)
    plan    = _get_plan(body.plan_id, sb)

    if plan["price_monthly"] != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /checkout for paid plans.",
        )

    if plan["for_role"] != profile["role"]:
        raise HTTPException(status_code=403, detail="Plan not available for your role.")

    # Cancel any existing subscription first
    sb.table("subscriptions").update({"status": "cancelled"}).eq(
        "profile_id", profile["id"]
    ).in_("status", ["active", "pending_payment"]).execute()

    row = sb.table("subscriptions").insert({
        "profile_id":    profile["id"],
        "plan_id":       body.plan_id,
        "status":        "active",
        "billing_cycle": "monthly",
        "started_at":    datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"subscription": row.data[0] if row.data else {}, "plan": plan}
