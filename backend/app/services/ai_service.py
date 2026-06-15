"""
Purrfect Care — AI Companion Service (google-genai SDK)
=========================================================
Full RAG pipeline:
  1. Embed question with gemini-embedding-001 (RETRIEVAL_QUERY, 768-dim)
  2. Retrieve top-K chunks from Supabase pgvector
  3. Build grounded prompt with context
  4. Generate answer with gemini-2.5-flash
"""

from __future__ import annotations

import logging
from typing import Optional

from google import genai
from google.genai import types
from supabase import Client

from app.config import get_settings

logger   = logging.getLogger("purrfect_care.ai_service")
settings = get_settings()

# One shared client per process
_gemini_client: genai.Client | None = None


def get_gemini_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        api_key = settings.GEMINI_API_KEY.strip()   # strip newlines from Secret Manager
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


# Constants

EMBEDDING_MODEL  = settings.GEMINI_EMBEDDING_MODEL   # gemini-embedding-001
CHAT_MODEL       = settings.GEMINI_CHAT_MODEL         # gemini-2.5-flash
MATCH_THRESHOLD  = 0.55   # gemini-embedding-001 cosine similarities are typically 0.55-0.70
MATCH_COUNT      = 6      # More context chunks = better answers

SYSTEM_INSTRUCTION = """You are PurrfectAI, a friendly and knowledgeable cat health assistant for the Purrfect Care app.

Your role is to help cat owners understand their cat's symptoms and know what steps to take — using ONLY the verified veterinary knowledge provided in each prompt.

RULES YOU MUST FOLLOW:
1. Answer ONLY using the information in the CONTEXT section provided with each message.
2. If the answer is not in the context, say exactly: "I don't have enough verified information on that. Please consult a licensed veterinarian."
3. Always recommend seeing a vet for any serious, worsening, or emergency symptoms.
4. Never suggest specific drug dosages or prescribe medication — only describe what a vet might prescribe.
5. Be warm, clear, and easy to understand — avoid overly technical jargon.
6. If symptoms sound like an emergency, make that very clear and tell the owner to seek emergency veterinary care immediately."""


# Step 1: Embed the user's question

def embed_query(question: str) -> list[float]:
    """Converts a user question to a 768-dim vector (RETRIEVAL_QUERY task)."""
    logger.info("Embedding question (%d chars) with model %s", len(question), EMBEDDING_MODEL)
    client = get_gemini_client()
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=question.strip(),
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=768,   # Must match the stored knowledge vectors
        ),
    )
    vector = result.embeddings[0].values
    logger.info("Embedding OK — dim=%d", len(vector))
    return vector


# Step 2: Retrieve relevant chunks from Supabase

def retrieve_context(db: Client, question_embedding: list[float]) -> list[dict]:
    """Calls the match_cat_health Postgres RPC."""
    logger.info("Retrieving context (threshold=%.2f, count=%d)", MATCH_THRESHOLD, MATCH_COUNT)
    response = db.rpc(
        "match_cat_health",
        {
            "query_embedding": question_embedding,
            "match_threshold": MATCH_THRESHOLD,
            "match_count":     MATCH_COUNT,
        }
    ).execute()
    chunks = response.data or []
    logger.info("Retrieved %d chunks", len(chunks))
    return chunks


# Step 3: Build context string

def build_context_string(chunks: list[dict]) -> str:
    if not chunks:
        return "No specific veterinary information was found for this query."

    parts = []
    for i, chunk in enumerate(chunks, start=1):
        source_info = f"(Source: {chunk.get('source', 'Unknown')})"
        parts.append(f"[{i}] {chunk['title']} {source_info}\n{chunk['content']}")
    return "\n\n".join(parts)


# Step 4: Generate answer with Gemini Flash

def generate_answer(
    question: str,
    context_string: str,
    conversation_history: Optional[list[dict]] = None,
) -> str:
    logger.info("Generating answer with model %s (history_len=%d)",
                CHAT_MODEL, len(conversation_history or []))
    client = get_gemini_client()

    # Build message history in Gemini format Gemini uses: [{"role": "user"|"model", "parts": [{"text": "..."}]}]
    contents = []

    if conversation_history:
        for msg in conversation_history[-6:]:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    # Inject context into the current user message
    augmented_message = (
        f"--- VERIFIED VETERINARY CONTEXT ---\n"
        f"{context_string}\n"
        f"--- END OF CONTEXT ---\n\n"
        f"Question: {question}"
    )
    contents.append({"role": "user", "parts": [{"text": augmented_message}]})

    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.3,
            max_output_tokens=1024,
        ),
    )

    # Guard against empty responses (safety filter, quota, etc.)
    answer = None
    if response.candidates:
        candidate = response.candidates[0]
        finish_reason = getattr(candidate, "finish_reason", None)
        logger.info("Finish reason: %s", finish_reason)
        if hasattr(candidate, "content") and candidate.content and candidate.content.parts:
            answer = "".join(
                part.text for part in candidate.content.parts
                if hasattr(part, "text") and part.text
            ).strip()

    if not answer:
        logger.warning("Model returned empty response — using fallback.")
        answer = "I don't have enough verified information on that topic. Please consult a licensed veterinarian."

    logger.info("Answer generated (%d chars)", len(answer))
    return answer


# Main public function

def ask_ai_companion(
    question: str,
    db: Client,
    conversation_history: Optional[list[dict]] = None,
) -> dict:
    """
    Full RAG pipeline: embed → retrieve → augment → generate.
    Returns {"answer": str, "sources": list, "retrieved_count": int}
    """
    logger.info("=== AI Companion RAG pipeline START ===")
    try:
        question_embedding = embed_query(question)
        chunks             = retrieve_context(db, question_embedding)

        # Short-circuit: no knowledge found — skip model call entirely
        if not chunks:
            logger.warning("No knowledge chunks retrieved — returning fallback answer.")
            return {
                "answer":          "I don't have enough verified information on that topic. Please consult a licensed veterinarian.",
                "sources":         [],
                "retrieved_count": 0,
            }

        context_string = build_context_string(chunks)
        answer         = generate_answer(question, context_string, conversation_history)
    except Exception as exc:
        logger.exception("RAG pipeline FAILED: %s", exc)
        raise

    sources = [
        {
            "title":      chunk.get("title", ""),
            "source":     chunk.get("source", ""),
            "source_url": chunk.get("source_url", ""),
            "similarity": round(chunk.get("similarity", 0), 3),
        }
        for chunk in chunks
    ]

    return {
        "answer":          answer,
        "sources":         sources,
        "retrieved_count": len(chunks),
    }
