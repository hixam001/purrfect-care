"""
Purrfect Care — AI Consultation & Illness Models

Covers: ai_consultations, illness_records tables
Domain: Transaction (AIConsultation), Item (IllnessRecord)
Enums: SeverityLevel
References: Doc 07, Doc 08, TS-7, SD-6
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    """Severity level for illness assessment."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


# ──────────────────────────────────────────
# IllnessRecord Models (Item)
# ──────────────────────────────────────────

class IllnessRecordCreate(BaseModel):
    """Request body for adding an illness to the knowledge base."""
    illness_name: str = Field(..., min_length=1, max_length=200)
    description: str
    symptoms: list[str] = Field(..., min_length=1)
    affected_breeds: list[str] = Field(default_factory=list)
    severity_level: SeverityLevel
    home_remedies: str | None = None
    when_to_see_vet: str | None = None
    related_medicines: list[str] = Field(default_factory=list)


class IllnessRecordResponse(BaseModel):
    """Response body for illness record data."""
    id: str
    illness_name: str
    description: str
    symptoms: list[str]
    affected_breeds: list[str] = Field(default_factory=list)
    severity_level: SeverityLevel
    home_remedies: str | None = None
    when_to_see_vet: str | None = None
    related_medicines: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# AI Consultation Models (Transaction)
# ──────────────────────────────────────────

class AIConsultRequest(BaseModel):
    """Request body for AI consultation (POST /api/ai/consult)."""
    symptoms: str = Field(..., min_length=10, max_length=2000)
    cat_id: str | None = None


class AIRecommendation(BaseModel):
    """AI consultation result with matched illnesses and recommendations."""
    illnesses: list[IllnessRecordResponse] = Field(default_factory=list)
    confidence_scores: list[float] = Field(default_factory=list)
    severity: SeverityLevel
    remedies: list[str] = Field(default_factory=list)
    see_vet: bool = False
    related_medicines: list[str] = Field(default_factory=list)


class AIConsultationResponse(BaseModel):
    """Response body for stored AI consultation."""
    id: str
    user_id: str
    cat_id: str | None = None
    query_text: str
    results: dict[str, Any]
    confidence_score: float | None = None
    severity: str | None = None
    status: str = "completed"
    created_at: datetime

    model_config = {"from_attributes": True}
