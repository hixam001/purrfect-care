-- ============================================================
-- Migration 012: Appointment RLS for Vets and Hospital Admins
-- ============================================================
-- The original schema only has:
--   "Users see own appointments" (cat_owner SELECT via user_id)
--
-- Missing policies:
--   1. Vet can SELECT appointments assigned to them
--   2. Hospital admin can SELECT appointments for their hospital
--   3. Hospital admin can UPDATE appointment status (confirm/cancel)
--   4. Vet can UPDATE appointment status (complete/in_progress)
-- ============================================================

-- 1. Vets can see their own assigned appointments
CREATE POLICY "Vets see own appointments"
    ON appointments FOR SELECT
    USING (
        vet_id IN (
            SELECT v.id FROM vets v
            JOIN user_profiles up ON up.id = v.user_id
            WHERE up.user_id = auth.uid()
        )
    );

-- 2. Hospital admins can see all appointments for their hospital
CREATE POLICY "Hospital admins see hospital appointments"
    ON appointments FOR SELECT
    USING (
        hospital_id IN (
            SELECT h.id FROM hospitals h
            JOIN user_profiles up ON up.id = h.admin_user_id
            WHERE up.user_id = auth.uid()
        )
    );

-- 3. Hospital admins can update appointment status (confirm, cancel)
CREATE POLICY "Hospital admins update appointment status"
    ON appointments FOR UPDATE
    USING (
        hospital_id IN (
            SELECT h.id FROM hospitals h
            JOIN user_profiles up ON up.id = h.admin_user_id
            WHERE up.user_id = auth.uid()
        )
    )
    WITH CHECK (
        hospital_id IN (
            SELECT h.id FROM hospitals h
            JOIN user_profiles up ON up.id = h.admin_user_id
            WHERE up.user_id = auth.uid()
        )
    );

-- 4. Vets can update appointment status (mark in_progress, completed)
CREATE POLICY "Vets update appointment status"
    ON appointments FOR UPDATE
    USING (
        vet_id IN (
            SELECT v.id FROM vets v
            JOIN user_profiles up ON up.id = v.user_id
            WHERE up.user_id = auth.uid()
        )
    )
    WITH CHECK (
        vet_id IN (
            SELECT v.id FROM vets v
            JOIN user_profiles up ON up.id = v.user_id
            WHERE up.user_id = auth.uid()
        )
    );
