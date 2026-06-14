-- ============================================================
-- Purrfect Care — Migration 002: Vector Search RAG
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Enable the pgvector extension (provides VECTOR type)
CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================
-- TABLE: cat_health_knowledge
-- Stores chunked veterinary text + OpenAI embeddings
-- ============================================================

CREATE TABLE IF NOT EXISTS cat_health_knowledge (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title        VARCHAR(255) NOT NULL,         -- e.g., "Feline Diabetes"
    category     VARCHAR(100),                  -- e.g., "endocrine", "respiratory"
    section      VARCHAR(100),                  -- e.g., "symptoms", "treatment", "emergency"
    content      TEXT NOT NULL,                 -- The raw text chunk (~200-300 words)
    source       VARCHAR(255),                  -- e.g., "Cornell Feline Health Center"
    source_url   TEXT,                          -- Optional link to original material
    embedding    VECTOR(768),                   -- gemini-embedding-001 truncated to 768 dims (Matryoshka)
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast cosine similarity lookups
CREATE INDEX ON cat_health_knowledge
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

CREATE INDEX idx_cat_health_category ON cat_health_knowledge(category);
CREATE INDEX idx_cat_health_section  ON cat_health_knowledge(section);


-- ============================================================
-- FUNCTION: match_cat_health
-- Called by FastAPI via supabase.rpc("match_cat_health", {...})
-- Returns the top N chunks closest to the user's question
-- ============================================================

CREATE OR REPLACE FUNCTION match_cat_health(
    query_embedding  VECTOR(768),
    match_threshold  FLOAT   DEFAULT 0.70,
    match_count      INT     DEFAULT 4
)
RETURNS TABLE (
    id         UUID,
    title      VARCHAR,
    category   VARCHAR,
    section    VARCHAR,
    content    TEXT,
    source     VARCHAR,
    source_url TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.title,
        k.category,
        k.section,
        k.content,
        k.source,
        k.source_url,
        1 - (k.embedding <=> query_embedding) AS similarity
    FROM cat_health_knowledge k
    WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
    ORDER BY k.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


-- ============================================================
-- RLS — Enable Row Level Security
-- This is public read-only knowledge (no user data here)
-- ============================================================

ALTER TABLE cat_health_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read cat health knowledge"
    ON cat_health_knowledge FOR SELECT
    USING (TRUE);
