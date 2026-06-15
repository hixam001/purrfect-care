-- ============================================================
-- Migration 018: Public RLS policies for products & categories
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── product_categories (reference data — anyone can read) ──

DROP POLICY IF EXISTS "public_read_product_categories" ON product_categories;
CREATE POLICY "public_read_product_categories" ON product_categories
  FOR SELECT USING (true);

-- Store owners can manage categories (optional — or leave admin-only)
DROP POLICY IF EXISTS "store_owner_insert_product_categories" ON product_categories;
CREATE POLICY "store_owner_insert_product_categories" ON product_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'store_owner'
    )
  );

-- ── products ────────────────────────────────────────────────

-- Anyone can browse active products from approved stores
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT USING (
    is_active = true
    AND store_id IN (
      SELECT id FROM cat_stores WHERE is_approved = true AND is_active = true
    )
  );

-- Store owners can see ALL their products (incl. inactive drafts)
DROP POLICY IF EXISTS "store_owner_read_own_products" ON products;
CREATE POLICY "store_owner_read_own_products" ON products
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Store owners can add products to their own store
DROP POLICY IF EXISTS "store_owner_insert_products" ON products;
CREATE POLICY "store_owner_insert_products" ON products
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Store owners can update/delete their own products
DROP POLICY IF EXISTS "store_owner_update_products" ON products;
CREATE POLICY "store_owner_update_products" ON products
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "store_owner_delete_products" ON products;
CREATE POLICY "store_owner_delete_products" ON products
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );
