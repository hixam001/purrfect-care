-- ============================================================
-- Migration 005: Add free-text breed column to cats table
-- ============================================================
-- The cats table only had breed_id (FK → cat_breeds) but the
-- app forms collect breed as free text. This migration adds
-- a plain TEXT column so inserts from the web/mobile don't fail.
-- ============================================================

ALTER TABLE cats ADD COLUMN IF NOT EXISTS breed TEXT;

-- Backfill breed text from existing breed_id references (if any)
UPDATE cats c
SET breed = cb.name
FROM cat_breeds cb
WHERE c.breed_id = cb.id
  AND c.breed IS NULL;
