-- ============================================================
-- Migration 015: Fix Store Owner RLS Policies
-- ============================================================
-- Root cause: cat_stores.owner_user_id is a FK to user_profiles.id
--             NOT to auth.uid() (which is auth.users.id / user_profiles.user_id).
--
-- Bugs fixed:
--   1. cat_stores SELECT — owners can now read their OWN store even when pending
--   2. products INSERT/UPDATE/DELETE/SELECT — fixed auth.uid() → user_profiles join
--   3. Restore public read for approved products (was blocked by wrong policy)
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ── 1. CAT_STORES: let store owners read their own store at any time ──────────

DROP POLICY IF EXISTS "store_owner_read_own_store" ON cat_stores;
CREATE POLICY "store_owner_read_own_store"
    ON cat_stores FOR SELECT
    USING (
        owner_user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

-- ── 2. PRODUCTS: fix all policies to use user_profiles join ──────────────────
-- (old policies used auth.uid() directly, but owner_user_id = user_profiles.id)

DROP POLICY IF EXISTS "store_owner_insert_products" ON products;
CREATE POLICY "store_owner_insert_products"
    ON products FOR INSERT
    WITH CHECK (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "store_owner_update_products" ON products;
CREATE POLICY "store_owner_update_products"
    ON products FOR UPDATE
    USING (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "store_owner_delete_products" ON products;
CREATE POLICY "store_owner_delete_products"
    ON products FOR DELETE
    USING (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "store_owner_read_own_products" ON products;
CREATE POLICY "store_owner_read_own_products"
    ON products FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ── 3. ORDERS: fix policies to use user_profiles join ────────────────────────

DROP POLICY IF EXISTS "store_owner_read_orders" ON orders;
CREATE POLICY "store_owner_read_orders"
    ON orders FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "store_owner_update_orders" ON orders;
CREATE POLICY "store_owner_update_orders"
    ON orders FOR UPDATE
    USING (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM cat_stores
            WHERE owner_user_id IN (
                SELECT id FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT policyname, tablename, cmd
-- FROM pg_policies
-- WHERE tablename IN ('cat_stores', 'products', 'orders')
-- ORDER BY tablename, policyname;
