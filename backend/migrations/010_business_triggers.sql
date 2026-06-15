-- ============================================================
-- Migration 010: Business Logic Triggers
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Mark appointment slot as booked when an
--    appointment row is inserted.
--    Prevents double-booking beyond the UNIQUE
--    constraint on appointments.slot_id.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_slot_booked()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE appointment_slots
  SET    is_booked = TRUE
  WHERE  id = NEW.slot_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_slot_booked ON appointments;

CREATE TRIGGER trg_mark_slot_booked
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION mark_slot_booked();


-- ─────────────────────────────────────────────
-- 2. Decrement product stock when an order item
--    is inserted. The CHECK (stock_quantity >= 0)
--    constraint on products prevents overselling.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION decrement_product_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products
  SET    stock_quantity = stock_quantity - NEW.quantity
  WHERE  id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON order_items;

CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrement_product_stock();


-- ─────────────────────────────────────────────
-- 3. RLS: Allow hospital admins to manage slots
--    for their hospital's vets
-- ─────────────────────────────────────────────

-- Allow anyone to read available slots (for booking)
DROP POLICY IF EXISTS "public_read_slots" ON appointment_slots;
CREATE POLICY "public_read_slots"
  ON appointment_slots FOR SELECT
  USING (true);

-- Allow hospital admin to insert slots for their hospital
DROP POLICY IF EXISTS "hospital_admin_insert_slots" ON appointment_slots;
CREATE POLICY "hospital_admin_insert_slots"
  ON appointment_slots FOR INSERT
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM hospitals WHERE admin_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Allow hospital admin to update slots for their hospital
DROP POLICY IF EXISTS "hospital_admin_update_slots" ON appointment_slots;
CREATE POLICY "hospital_admin_update_slots"
  ON appointment_slots FOR UPDATE
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE admin_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Allow hospital admin to delete slots for their hospital
DROP POLICY IF EXISTS "hospital_admin_delete_slots" ON appointment_slots;
CREATE POLICY "hospital_admin_delete_slots"
  ON appointment_slots FOR DELETE
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE admin_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );


-- ─────────────────────────────────────────────
-- 4. RLS: hospital_services CRUD for admin
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_hospital_services" ON hospital_services;
CREATE POLICY "public_read_hospital_services"
  ON hospital_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "hospital_admin_manage_services" ON hospital_services;
CREATE POLICY "hospital_admin_manage_services"
  ON hospital_services FOR ALL
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE admin_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM hospitals WHERE admin_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );


-- ─────────────────────────────────────────────
-- 5. Allow hospital admin to UPDATE their hospital row
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "hospital_admin_update_hospital" ON hospitals;
CREATE POLICY "hospital_admin_update_hospital"
  ON hospitals FOR UPDATE
  USING (
    admin_user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- 6. Allow store owner to UPDATE their store row
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "store_owner_update_store" ON cat_stores;
CREATE POLICY "store_owner_update_store"
  ON cat_stores FOR UPDATE
  USING (
    owner_user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- 7. Allow store owners to read their orders
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "store_owner_read_orders" ON orders;
CREATE POLICY "store_owner_read_orders"
  ON orders FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "store_owner_update_orders" ON orders;
CREATE POLICY "store_owner_update_orders"
  ON orders FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM cat_stores WHERE owner_user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );
