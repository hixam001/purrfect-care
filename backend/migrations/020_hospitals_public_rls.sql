-- ============================================================
-- Migration 020: Public read access for hospitals, vets,
--                hospital_services — free tier
-- ============================================================
-- Grant both anon and authenticated roles full SELECT access
-- to approved/active hospitals and their associated data,
-- mirroring the pattern used for cat_stores/products (019).
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- HOSPITALS
-- ──────────────────────────────────────────────────────────

-- Drop any old conflicting SELECT policies
DROP POLICY IF EXISTS "Public can view approved hospitals"         ON hospitals;
DROP POLICY IF EXISTS "public_read_approved_hospitals"            ON hospitals;
DROP POLICY IF EXISTS "anon_read_approved_hospitals"              ON hospitals;
DROP POLICY IF EXISTS "authenticated_read_approved_hospitals"     ON hospitals;
DROP POLICY IF EXISTS "hospital_admin_read_own_hospital"          ON hospitals;

-- Anon: browse approved hospitals
CREATE POLICY "anon_read_approved_hospitals"
  ON hospitals
  FOR SELECT
  TO anon
  USING (is_approved = true);

-- Authenticated (cat owners, vets, etc.): browse approved hospitals
CREATE POLICY "authenticated_read_approved_hospitals"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- Hospital admins see their own hospital regardless of approval status
CREATE POLICY "hospital_admin_read_own_hospital"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (
    admin_user_id = auth.uid()
  );

-- ──────────────────────────────────────────────────────────
-- VETS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can view verified vets"             ON vets;
DROP POLICY IF EXISTS "public_read_verified_vets"                 ON vets;
DROP POLICY IF EXISTS "anon_read_verified_vets"                   ON vets;
DROP POLICY IF EXISTS "authenticated_read_verified_vets"          ON vets;

-- Anon: browse vets attached to approved hospitals
CREATE POLICY "anon_read_vets"
  ON vets
  FOR SELECT
  TO anon
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE is_approved = true
    )
  );

-- Authenticated: browse vets
CREATE POLICY "authenticated_read_vets"
  ON vets
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE is_approved = true
    )
  );

-- ──────────────────────────────────────────────────────────
-- HOSPITAL_SERVICES
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can view hospital services"         ON hospital_services;
DROP POLICY IF EXISTS "public_read_hospital_services"            ON hospital_services;
DROP POLICY IF EXISTS "anon_read_hospital_services"              ON hospital_services;
DROP POLICY IF EXISTS "authenticated_read_hospital_services"     ON hospital_services;

-- Anon: view services of approved hospitals
CREATE POLICY "anon_read_hospital_services"
  ON hospital_services
  FOR SELECT
  TO anon
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE is_approved = true
    )
  );

-- Authenticated: view services of approved hospitals
CREATE POLICY "authenticated_read_hospital_services"
  ON hospital_services
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE is_approved = true
    )
  );
