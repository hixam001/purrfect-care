-- ============================================================
-- Migration 011: RLS self-read policies for business owners
-- ============================================================
-- The existing cat_stores and hospitals SELECT policies only
-- expose approved + active records. This means a store owner
-- or hospital admin cannot query their own row until the system
-- admin approves them — making the dashboard show "No store
-- linked" even though the store exists in the DB.
--
-- These additional policies allow the owner/admin to always
-- read their own record regardless of approval status.
-- ============================================================

-- Store owner can always read their own store
CREATE POLICY "Owner sees own store"
    ON cat_stores FOR SELECT
    USING (owner_user_id = auth.uid());

-- Hospital admin can always read their own hospital
CREATE POLICY "Admin sees own hospital"
    ON hospitals FOR SELECT
    USING (admin_user_id = auth.uid());
