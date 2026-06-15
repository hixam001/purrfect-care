-- ============================================================
-- Migration 014: Vets, Messages, and Cat Store RLS
-- ============================================================
-- Missing policies that block key features:
--   • vets: public can't read (HospitalDetailPage/BookingPage blank)
--   • messages: no policy = chat silently broken (can't send/read)
-- ============================================================

-- ── VETS ──────────────────────────────────────────────────────────────────────

-- Public can read vets (for hospital detail and booking pages)
DROP POLICY IF EXISTS "Public can read vets" ON vets;
CREATE POLICY "Public can read vets"
    ON vets FOR SELECT USING (TRUE);

-- Hospital admins can INSERT vets into their hospital
DROP POLICY IF EXISTS "Hospital admins manage vets" ON vets;
CREATE POLICY "Hospital admins manage vets"
    ON vets FOR ALL
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

-- Vets can read/update their own profile
DROP POLICY IF EXISTS "Vets manage own profile" ON vets;
CREATE POLICY "Vets manage own profile"
    ON vets FOR ALL
    USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

-- ── MESSAGES ──────────────────────────────────────────────────────────────────
-- chat_rooms has "Chat participants only" FOR ALL, but messages has NO policy.
-- Without this, sending/reading messages silently fails.

DROP POLICY IF EXISTS "Chat participants can read messages" ON messages;
CREATE POLICY "Chat participants can read messages"
    ON messages FOR SELECT
    USING (
        chat_room_id IN (
            SELECT id FROM chat_rooms
            WHERE
                user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
                OR
                vet_id IN (
                    SELECT v.id FROM vets v
                    JOIN user_profiles up ON up.id = v.user_id
                    WHERE up.user_id = auth.uid()
                )
        )
    );

DROP POLICY IF EXISTS "Chat participants can send messages" ON messages;
CREATE POLICY "Chat participants can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
        AND
        chat_room_id IN (
            SELECT id FROM chat_rooms
            WHERE
                user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
                OR
                vet_id IN (
                    SELECT v.id FROM vets v
                    JOIN user_profiles up ON up.id = v.user_id
                    WHERE up.user_id = auth.uid()
                )
        )
    );

-- ── CAT STORE INSERT ──────────────────────────────────────────────────────────
-- Store registration inserts into cat_stores. Without INSERT policy, registration fails.

DROP POLICY IF EXISTS "Store owners can create own store" ON cat_stores;
CREATE POLICY "Store owners can create own store"
    ON cat_stores FOR INSERT
    WITH CHECK (
        owner_user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

-- ── HOSPITALS INSERT ──────────────────────────────────────────────────────────
-- Hospital registration inserts into hospitals. Without INSERT policy, registration fails.

DROP POLICY IF EXISTS "Hospital admins can create own hospital" ON hospitals;
CREATE POLICY "Hospital admins can create own hospital"
    ON hospitals FOR INSERT
    WITH CHECK (
        admin_user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );
