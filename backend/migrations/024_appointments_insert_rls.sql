-- ============================================================
-- Migration 024: Allow cat owners to INSERT appointments
-- ============================================================
-- The appointments table has SELECT policies for owners/vets/
-- hospital admins, and UPDATE policies for vets/hospital admins.
-- But there is NO INSERT policy, so cat owners get:
--   "new row violates row-level security policy for table appointments"
-- ============================================================

DROP POLICY IF EXISTS "Cat owners can book appointments" ON appointments;

CREATE POLICY "Cat owners can book appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- user_id on the row must match the current user's profile
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );
