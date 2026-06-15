-- ============================================================
-- Migration 016: Make latitude/longitude nullable
-- ============================================================
-- Allows hospital and store rows to be created at registration
-- even when the browser geolocation was denied.
-- Coordinates can be updated later via settings.
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE hospitals  ALTER COLUMN latitude  DROP NOT NULL;
ALTER TABLE hospitals  ALTER COLUMN longitude DROP NOT NULL;

ALTER TABLE cat_stores ALTER COLUMN latitude  DROP NOT NULL;
ALTER TABLE cat_stores ALTER COLUMN longitude DROP NOT NULL;
