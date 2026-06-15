-- ============================================================
-- Migration 006: Add email column to user_profiles
-- ============================================================
-- Email is stored in auth.users but not in user_profiles.
-- Adding it here so it can be returned in the user profile
-- response without a join to the auth schema.
-- ============================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill existing rows from auth.users
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
  AND up.email IS NULL;
