-- ============================================================
-- Migration 004: Store owner product management RLS
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Allow store owners to INSERT products into their own store
CREATE POLICY "store_owner_insert_products"
  ON products
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id = auth.uid()
    )
  );

-- Allow store owners to UPDATE (edit stock, price, active status) their own store's products
CREATE POLICY "store_owner_update_products"
  ON products
  FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id = auth.uid()
    )
  );

-- Allow store owners to DELETE their own store's products
CREATE POLICY "store_owner_delete_products"
  ON products
  FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id = auth.uid()
    )
  );

-- Allow store owners to read their own store's products (including inactive ones)
-- (The existing public SELECT policy only shows is_active=true products)
CREATE POLICY "store_owner_read_own_products"
  ON products
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id = auth.uid()
    )
  );

-- Allow store owners to insert new product categories if needed
-- (product_categories is a lookup table; owners should be able to add new ones)
CREATE POLICY "store_owner_insert_categories"
  ON product_categories
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- Verify policies
-- ============================================================
-- SELECT policyname, tablename, cmd FROM pg_policies
-- WHERE tablename IN ('products', 'product_categories')
-- ORDER BY tablename, policyname;
