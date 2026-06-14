"""
Purrfect Care — Offer Models (standalone re-export)

Offer is defined in review.py alongside ReviewResponse (same domain grouping).
This module re-exports for import clarity when controllers only need Offer types.
References: Doc 08 (DB Schema § 23)
"""

# Re-export from review module for clean import paths
from app.models.review import OfferBase, OfferCreate, OfferUpdate, OfferResponse

__all__ = ["OfferBase", "OfferCreate", "OfferUpdate", "OfferResponse"]
