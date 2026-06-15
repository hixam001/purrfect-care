-- ============================================================
-- Migration 022: Allow public read of vet user profile names
-- ============================================================
-- The hospital detail page joins vets → user_profiles to show
-- vet names/avatars. Without a public SELECT policy, cat owners
-- (and anon users) can't read vet profiles, causing the inner
-- join to exclude vet rows entirely (blank booking page).
--
-- This adds a limited public-read policy: any authenticated or
-- anon user can read the name, avatar_url of profiles belonging
-- to verified vets at approved hospitals.
-- ============================================================

DROP POLICY IF EXISTS "Public can read vet profile names" ON user_profiles;

CREATE POLICY "Public can read vet profile names"
  ON user_profiles
  FOR SELECT
  USING (
    id IN (
      SELECT v.user_id
      FROM   vets v
      JOIN   hospitals h ON h.id = v.hospital_id
      WHERE  v.is_verified = true
        AND  h.is_approved = true
    )
  );
