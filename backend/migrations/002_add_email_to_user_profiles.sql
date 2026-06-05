-- ============================================================
-- Purrfect Care — Migration 002: Add email to user_profiles
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Rationale: The API needs to quickly look up users by email without
-- a JOIN to auth.users. We store a denormalized copy in user_profiles
-- so our service-role queries remain simple and fast.
-- The email is sourced from auth.users at registration time and is
-- treated as immutable in the domain layer (changes go through Supabase Auth).
-- ============================================================

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Index for duplicate-check lookups in registration flow
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email
    ON user_profiles(email)
    WHERE email IS NOT NULL;
