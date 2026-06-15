-- ============================================================
-- Migration 017: RLS policies for orders & order_items
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── orders ────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can see their own orders
DROP POLICY IF EXISTS "users_read_own_orders" ON orders;
CREATE POLICY "users_read_own_orders" ON orders
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can create their own orders
DROP POLICY IF EXISTS "users_insert_own_orders" ON orders;
CREATE POLICY "users_insert_own_orders" ON orders
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Store owners can see orders for their store
DROP POLICY IF EXISTS "store_owners_read_store_orders" ON orders;
CREATE POLICY "store_owners_read_store_orders" ON orders
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Store owners can update status of orders for their store
DROP POLICY IF EXISTS "store_owners_update_order_status" ON orders;
CREATE POLICY "store_owners_update_order_status" ON orders
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ── order_items ──────────────────────────────────────────

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can see items in their own orders
DROP POLICY IF EXISTS "users_read_own_order_items" ON order_items;
CREATE POLICY "users_read_own_order_items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert items for their own orders
DROP POLICY IF EXISTS "users_insert_own_order_items" ON order_items;
CREATE POLICY "users_insert_own_order_items" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Store owners can see items in their store's orders
DROP POLICY IF EXISTS "store_owners_read_store_order_items" ON order_items;
CREATE POLICY "store_owners_read_store_order_items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE store_id IN (
        SELECT id FROM cat_stores WHERE owner_user_id IN (
          SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );
