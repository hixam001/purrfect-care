"""
Purrfect Care — Store & Product Models

Covers: cat_stores, products, product_categories tables
Domain: Place (CatStore), Item (Product, ProductCategory)
References: Doc 07, Doc 08, TS-4, TS-9
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# ProductCategory Models (Item-Classification)
# ──────────────────────────────────────────

class ProductCategoryCreate(BaseModel):
    """Request body for creating a product category."""
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    icon_url: str | None = None
    sort_order: int = 0


class ProductCategoryResponse(BaseModel):
    """Response body for product category data."""
    id: str
    name: str
    description: str | None = None
    icon_url: str | None = None
    sort_order: int = 0

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# CatStore Models (Place)
# ──────────────────────────────────────────

class StoreBase(BaseModel):
    """Shared store fields."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    address: str = Field(..., max_length=500)
    city: str | None = Field(None, max_length=100)
    banner_url: str | None = None
    operating_hours: dict[str, Any] | None = None
    delivery_zones: dict[str, Any] | None = None
    delivery_fee: float = Field(0, ge=0)


class StoreCreate(StoreBase):
    """Request body for store registration."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class StoreUpdate(BaseModel):
    """Request body for updating store info."""
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    banner_url: str | None = None
    operating_hours: dict[str, Any] | None = None
    delivery_zones: dict[str, Any] | None = None
    delivery_fee: float | None = Field(None, ge=0)


class StorePageUpdate(BaseModel):
    """Request body for customizing store page (PUT /api/stores/{id}/page)."""
    banner_url: str | None = None
    page_config: dict[str, Any] | None = None
    operating_hours: dict[str, Any] | None = None
    delivery_zones: dict[str, Any] | None = None
    delivery_fee: float | None = Field(None, ge=0)


class StoreResponse(StoreBase):
    """Response body for store data."""
    id: str
    owner_user_id: str
    is_active: bool = True
    is_approved: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    page_config: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    distance_km: float | None = None  # Populated by PostGIS queries

    model_config = {"from_attributes": True}


class StoreDetailResponse(StoreResponse):
    """Extended store response with products, categories, and offers."""
    products: list["ProductResponse"] = Field(default_factory=list)
    categories: list[ProductCategoryResponse] = Field(default_factory=list)
    offers: list[Any] = Field(default_factory=list)


# ──────────────────────────────────────────
# Product Models (Item)
# ──────────────────────────────────────────

class ProductBase(BaseModel):
    """Shared product fields."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    price: float = Field(..., ge=0)
    discount_price: float | None = Field(None, ge=0)
    images: list[str] = Field(default_factory=list)
    stock_quantity: int = Field(0, ge=0)
    brand: str | None = Field(None, max_length=100)
    weight: float | None = Field(None, ge=0)
    unit: str | None = Field(None, max_length=20)
    is_active: bool = True


class ProductCreate(ProductBase):
    """Request body for adding a product (POST /api/stores/{id}/products)."""
    category_id: str | None = None


class ProductUpdate(BaseModel):
    """Request body for updating a product."""
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    price: float | None = Field(None, ge=0)
    discount_price: float | None = Field(None, ge=0)
    images: list[str] | None = None
    stock_quantity: int | None = Field(None, ge=0)
    brand: str | None = Field(None, max_length=100)
    weight: float | None = Field(None, ge=0)
    unit: str | None = Field(None, max_length=20)
    category_id: str | None = None
    is_active: bool | None = None


class ProductResponse(ProductBase):
    """Response body for product data."""
    id: str
    store_id: str
    category_id: str | None = None
    rating: float = 0.0
    total_reviews: int = 0
    created_at: datetime

    # Optionally joined
    category_name: str | None = None

    model_config = {"from_attributes": True}
