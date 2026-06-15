-- ============================================================
-- Migration 019: Clean up products RLS — fix role coverage
-- ============================================================
-- The issue: old "Public can read active products" policy may only
-- apply to anon role, while logged-in users use authenticated role.
-- Fix: explicitly grant both roles read access to active products.
-- ============================================================

-- Drop ALL existing SELECT policies on products (start clean)
DROP POLICY IF EXISTS "Public can read active products"      ON products;
DROP POLICY IF EXISTS "public_read_active_products"          ON products;
DROP POLICY IF EXISTS "store_owner_read_own_products"        ON products;

-- 1. Anon users (not logged in) can browse active products of approved stores
DROP POLICY IF EXISTS "anon_read_active_products" ON products;
CREATE POLICY "anon_read_active_products"
  ON products
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND store_id IN (
      SELECT id FROM cat_stores
      WHERE is_approved = true AND is_active = true
    )
  );

-- 2. Authenticated users (cat owners, etc.) can browse active products
DROP POLICY IF EXISTS "authenticated_read_active_products" ON products;
CREATE POLICY "authenticated_read_active_products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND store_id IN (
      SELECT id FROM cat_stores
      WHERE is_approved = true AND is_active = true
    )
  );

-- 3. Store owners see ALL their own products (incl. inactive drafts)
DROP POLICY IF EXISTS "store_owner_read_own_products" ON products;
CREATE POLICY "store_owner_read_own_products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM cat_stores
      WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ── product_categories: same fix ────────────────────────────

DROP POLICY IF EXISTS "public_read_product_categories" ON product_categories;

CREATE POLICY "anon_read_product_categories"
  ON product_categories
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated_read_product_categories"
  ON product_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- ── Verify ───────────────────────────────────────────────────
-- SELECT policyname, tablename, cmd, roles
-- FROM pg_policies
-- WHERE tablename IN ('products', 'product_categories')
-- ORDER BY tablename, policyname;
