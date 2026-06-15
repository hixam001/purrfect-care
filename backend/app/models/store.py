"""
Purrfect Care — Store, Product & ProductCategory Models

Covers: cat_stores, products, product_categories tables (Place / Item domain)
References: Doc 07 (Class Diagram), Doc 08 (DB Schema § 16-18)
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ProductCategory Models

class ProductCategoryBase(BaseModel):
    name:        str   = Field(..., max_length=100)
    description: str | None = None
    icon_url:    str | None = None
    sort_order:  int  = 0


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryResponse(ProductCategoryBase):
    id: str
    model_config = {"from_attributes": True}


# Product Models

class ProductBase(BaseModel):
    category_id:    str | None = None
    name:           str   = Field(..., max_length=200)
    description:    str | None = None
    price:          float = Field(..., gt=0)
    discount_price: float | None = Field(None, gt=0)
    images:         list[str] = Field(default_factory=list)
    stock_quantity: int   = Field(0, ge=0)
    brand:          str | None = Field(None, max_length=100)
    weight:         float | None = None
    unit:           str | None = Field(None, max_length=20)
    is_active:      bool  = True


class ProductCreate(ProductBase):
    """Request body — POST /api/stores/{id}/products (store_owner)."""
    store_id: str | None = None  # injected from URL path in controller


class ProductUpdate(BaseModel):
    category_id:    str | None = None
    name:           str | None = Field(None, max_length=200)
    description:    str | None = None
    price:          float | None = Field(None, gt=0)
    discount_price: float | None = None
    images:         list[str] | None = None
    stock_quantity: int | None = Field(None, ge=0)
    brand:          str | None = None
    weight:         float | None = None
    unit:           str | None = None
    is_active:      bool | None = None


class ProductResponse(ProductBase):
    id:            str
    store_id:      str
    rating:        float
    total_reviews: int
    created_at:    datetime
    category:      ProductCategoryResponse | None = None

    model_config = {"from_attributes": True}


# CatStore Models

class CatStoreBase(BaseModel):
    name:            str   = Field(..., max_length=200)
    description:     str | None = None
    phone:           str | None = Field(None, max_length=20)
    email:           EmailStr | None = None
    address:         str   = Field(..., min_length=1)
    city:            str | None = Field(None, max_length=100)
    banner_url:      str | None = None
    operating_hours: dict[str, Any] | None = None
    delivery_fee:    float = Field(0.0, ge=0)


class CatStoreCreate(CatStoreBase):
    """Request body — POST /api/stores/register"""
    latitude:  float = Field(..., ge=-90,  le=90)
    longitude: float = Field(..., ge=-180, le=180)


class CatStoreUpdate(BaseModel):
    name:            str | None = Field(None, max_length=200)
    description:     str | None = None
    phone:           str | None = Field(None, max_length=20)
    email:           EmailStr | None = None
    address:         str | None = None
    city:            str | None = Field(None, max_length=100)
    banner_url:      str | None = None
    operating_hours: dict[str, Any] | None = None
    delivery_fee:    float | None = Field(None, ge=0)
    page_config:     dict[str, Any] | None = None
    latitude:        float | None = Field(None, ge=-90,  le=90)
    longitude:       float | None = Field(None, ge=-180, le=180)


class CatStoreResponse(CatStoreBase):
    id:            str
    owner_user_id: str
    is_active:     bool
    is_approved:   bool
    rating:        float
    total_reviews: int
    page_config:   dict[str, Any]
    created_at:    datetime
    products:      list[ProductResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# Aliases used by tests and controllers
StoreCreate   = CatStoreCreate
StoreUpdate   = CatStoreUpdate
StoreResponse = CatStoreResponse
