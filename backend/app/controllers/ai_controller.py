"""
Purrfect Care — AI Companion Controller

Handles all routes under /api/ai:
  POST   /api/ai/chat   — Ask PurrfectAI a question about your cat's health

The endpoint is optionally authenticated. Authenticated users get their
cat's medical profile injected into the context for more personalised answers.
Anonymous use is also allowed so guests can try the companion.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from app.database import get_supabase_client
from app.middleware.auth_middleware import get_optional_user
from app.middleware.rate_limiter import limit_ai
from app.services.ai_service import ask_ai_companion
from app.utils.exceptions import ExternalServiceException

logger = logging.getLogger("purrfect_care.ai_controller")

router = APIRouter()


# Request / Response schemas

class ChatMessage(BaseModel):
    """A single message in the conversation history."""
    role:    str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4000)


class AIChatRequest(BaseModel):
    """
    Body for POST /api/ai/chat

    - message: The user's current question.
    - history: Previous turns (up to 6) for multi-turn conversation support.
    - cat_id:  Optional — if provided, the AI can reference the cat's profile.
    """
    message: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="The user's question about their cat's health.",
        examples=["My cat has been sneezing a lot and has a runny nose. What should I do?"],
    )
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=12,
        description="Previous conversation turns for multi-turn context (max 12 messages).",
    )
    cat_id: Optional[str] = Field(
        default=None,
        description="Optional cat UUID — enables personalised responses using the cat's medical profile.",
    )


class AISource(BaseModel):
    """A knowledge source that was retrieved and used to generate the answer."""
    title:      str
    source:     str
    source_url: str
    similarity: float


class AIChatResponse(BaseModel):
    """Response from POST /api/ai/chat"""
    answer:          str
    sources:         list[AISource]
    retrieved_count: int


# Route

@router.post(
    "/chat",
    response_model=AIChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask PurrfectAI a cat health question",
    description=(
        "Runs the full RAG pipeline: embeds the user question, retrieves the most "
        "relevant veterinary knowledge chunks from Supabase, and generates a safe, "
        "grounded answer via Gemini. Optionally accepts conversation history for "
        "multi-turn chat support."
    ),
)
@limit_ai
async def chat(
    request: Request,
    response: Response,
    body: AIChatRequest,
    db=Depends(get_supabase_client),
    current_user=Depends(get_optional_user),
) -> AIChatResponse:
    """
    POST /api/ai/chat

    Accepts the user's question and optional conversation history,
    runs the RAG pipeline, and returns an AI-generated answer backed
    by verified veterinary knowledge.
    """
    logger.info(
        "AI chat request | user=%s | question_len=%d | history_len=%d",
        current_user.id if current_user else "anonymous",
        len(body.message),
        len(body.history),
    )

    try:
        result = ask_ai_companion(
            question=body.message,
            db=db,
            conversation_history=[m.model_dump() for m in body.history],
        )
    except Exception as e:
        logger.error("AI service error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI companion is temporarily unavailable. Please try again shortly.",
        )

    return AIChatResponse(
        answer=result["answer"],
        sources=[AISource(**s) for s in result["sources"]],
        retrieved_count=result["retrieved_count"],
    )
