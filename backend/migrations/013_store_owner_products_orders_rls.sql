-- ============================================================
-- Migration 013: Products and Order Items RLS
-- ============================================================
-- products, order_items have RLS enabled but NO policies.
-- Migration 010 already handles orders (store owner read/update).
-- This migration adds the missing pieces.
-- ============================================================

-- ── PRODUCT CATEGORIES ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read product categories" ON product_categories;
CREATE POLICY "Public read product categories"
    ON product_categories FOR SELECT USING (TRUE);

-- ── PRODUCTS ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products"
    ON products FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Store owners manage own products" ON products;
CREATE POLICY "Store owners manage own products"
    ON products FOR ALL
    USING (
        store_id IN (
            SELECT id FROM cat_stores WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM cat_stores WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ── ORDERS (supplement migration 010) ────────────────────────────────────────

-- Buyers can INSERT orders (place an order)
DROP POLICY IF EXISTS "Buyers can place orders" ON orders;
CREATE POLICY "Buyers can place orders"
    ON orders FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

-- ── ORDER ITEMS ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Buyers see own order items" ON order_items;
CREATE POLICY "Buyers see own order items"
    ON order_items FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Store owners see own store order items" ON order_items;
CREATE POLICY "Store owners see own store order items"
    ON order_items FOR SELECT
    USING (
        order_id IN (
            SELECT o.id FROM orders o
            JOIN cat_stores cs ON cs.id = o.store_id
            WHERE cs.owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Buyers insert order items" ON order_items;
CREATE POLICY "Buyers insert order items"
    ON order_items FOR INSERT
    WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );
