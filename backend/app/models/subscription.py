"""
Purrfect Care — Subscription Models

Covers: subscription_plans and subscriptions tables.
"""
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class SubscriptionPlan(BaseModel):
    """A row from subscription_plans."""
    id: str
    name: str
    price_monthly: int   # PKR
    price_yearly: int    # PKR
    max_products: int | None = None   # None = unlimited
    max_vets: int | None = None       # None = unlimited
    features: list[str] = []
    for_role: str
    is_active: bool = True


class Subscription(BaseModel):
    """A row from subscriptions."""
    id: str
    profile_id: str
    plan_id: str
    status: str
    billing_cycle: str
    started_at: datetime | None = None
    expires_at: datetime | None = None
    safepay_order_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SubscriptionResponse(BaseModel):
    """Full subscription with embedded plan details."""
    subscription: Subscription
    plan: SubscriptionPlan


class SubscriptionCheckoutRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly"   # "monthly" | "yearly"
    redirect_url: str
    cancel_url: str


class ActivateSubscriptionRequest(BaseModel):
    """Directly activate a free plan (no Safepay session needed)."""
    plan_id: str
