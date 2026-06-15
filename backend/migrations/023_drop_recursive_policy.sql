-- ============================================================
-- Migration 023: Drop broken recursive RLS policy
-- ============================================================
-- Migration 022 introduced infinite recursion:
--   user_profiles policy → queries vets
--   vets policies → query user_profiles  (circular!)
-- Drop the offending policy immediately.
-- ============================================================

DROP POLICY IF EXISTS "Public can read vet profile names" ON user_profiles;
