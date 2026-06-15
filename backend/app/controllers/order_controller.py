"""
Purrfect Care — Order Controller

Routes under /api/orders:
  POST /           — Create a new order with items (cat_owner)
  GET  /mine       — List the current user's orders
  GET  /store      — List orders for the current store_owner's store
  PATCH /{id}/status — Update order status (store_owner only)
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import get_supabase_client
from app.middleware.auth_middleware import AuthenticatedUser, get_current_user

logger = logging.getLogger("purrfect_care.orders")
router = APIRouter()


# ── Models ────────────────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    product_id:  str
    quantity:    int
    unit_price:  float


class CreateOrderRequest(BaseModel):
    store_id:           str
    items:              list[OrderItem]
    delivery_address:   str
    delivery_latitude:  Optional[float] = None
    delivery_longitude: Optional[float] = None
    delivery_fee:       float = 0
    notes:              Optional[str]   = None


class UpdateOrderStatusRequest(BaseModel):
    status: str  # pending | confirmed | preparing | out_for_delivery | delivered | cancelled


# ── Helpers ───────────────────────────────────────────────────────────────────

def _profile_id(user: AuthenticatedUser, sb) -> str:
    row = sb.table("user_profiles").select("id").eq("user_id", user.id).single().execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return row.data["id"]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_order(
    body: CreateOrderRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    """Create an order for a store purchase."""
    profile_id = _profile_id(current_user, sb)

    # Validate all products belong to the store and calculate totals
    product_ids = [item.product_id for item in body.items]
    prods_res = (
        sb.table("products")
        .select("id, price, discount_price, stock_quantity, name")
        .in_("id", product_ids)
        .eq("store_id", body.store_id)
        .eq("is_active", True)
        .execute()
    )
    prods = {p["id"]: p for p in (prods_res.data or [])}

    if len(prods) != len(body.items):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more products are unavailable or don't belong to this store.",
        )

    subtotal = 0.0
    item_rows = []
    for item in body.items:
        p = prods[item.product_id]
        if p["stock_quantity"] < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{p['name']}'.",
            )
        unit_price  = p["discount_price"] if p["discount_price"] else p["price"]
        total_price = unit_price * item.quantity
        subtotal   += total_price
        item_rows.append({
            "product_id":  item.product_id,
            "quantity":    item.quantity,
            "unit_price":  unit_price,
            "total_price": total_price,
        })

    total = subtotal + body.delivery_fee

    # Insert order
    order_data = {
        "user_id":          profile_id,
        "store_id":         body.store_id,
        "subtotal":         subtotal,
        "delivery_fee":     body.delivery_fee,
        "total":            total,
        "status":           "pending",
        "delivery_address": body.delivery_address,
        "notes":            body.notes,
    }
    if body.delivery_latitude is not None:
        order_data["delivery_latitude"]  = body.delivery_latitude
        order_data["delivery_longitude"] = body.delivery_longitude

    order_res = sb.table("orders").insert(order_data).execute()
    if not order_res.data:
        raise HTTPException(status_code=500, detail="Failed to create order.")

    order = order_res.data[0]
    order_id = order["id"]

    # Insert order items
    for row in item_rows:
        row["order_id"] = order_id
    sb.table("order_items").insert(item_rows).execute()

    logger.info("Order created order_id=%s profile_id=%s total=%.2f", order_id, profile_id, total)
    return {"order": order, "items": item_rows}


@router.get("/mine")
async def get_my_orders(
    current_user: AuthenticatedUser = Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    """Return all orders for the current user, newest first."""
    profile_id = _profile_id(current_user, sb)
    res = (
        sb.table("orders")
        .select("*, cat_stores(name, city), order_items(*, products(name, images))")
        .eq("user_id", profile_id)
        .order("ordered_at", desc=True)
        .execute()
    )
    return {"orders": res.data or []}


@router.get("/store")
async def get_store_orders(
    current_user: AuthenticatedUser = Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    """Return all orders for the store owned by the current store_owner."""
    profile_id = _profile_id(current_user, sb)

    store_res = (
        sb.table("cat_stores")
        .select("id")
        .eq("owner_user_id", profile_id)
        .eq("is_approved", True)
        .maybe_single()
        .execute()
    )
    if not store_res.data:
        raise HTTPException(status_code=404, detail="No approved store found for this account.")

    store_id = store_res.data["id"]
    res = (
        sb.table("orders")
        .select("*, user_profiles(name, phone), order_items(*, products(name, images))")
        .eq("store_id", store_id)
        .order("ordered_at", desc=True)
        .execute()
    )
    return {"orders": res.data or [], "store_id": store_id}


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: UpdateOrderStatusRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    """Update order status — store_owner only."""
    profile_id = _profile_id(current_user, sb)

    # Verify this order belongs to one of the caller's stores
    store_res = (
        sb.table("cat_stores")
        .select("id")
        .eq("owner_user_id", profile_id)
        .execute()
    )
    store_ids = [s["id"] for s in (store_res.data or [])]
    if not store_ids:
        raise HTTPException(status_code=403, detail="No store found for this account.")

    valid_statuses = {"pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    update_data: dict = {"status": body.status}
    if body.status == "delivered":
        update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()

    res = (
        sb.table("orders")
        .update(update_data)
        .eq("id", order_id)
        .in_("store_id", store_ids)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found or not authorised.")
    return {"order": res.data[0]}
