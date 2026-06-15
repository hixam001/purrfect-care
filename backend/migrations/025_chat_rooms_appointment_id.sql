-- Migration 025: Add appointment_id to chat_rooms
-- chat_rooms previously had UNIQUE(user_id, vet_id) — one room per owner-vet pair.
-- We now link each room to a specific appointment so chat history is per-appointment.

-- 1. Drop old unique constraint (allow multiple rooms between same owner-vet)
ALTER TABLE chat_rooms
  DROP CONSTRAINT IF EXISTS chat_rooms_user_id_vet_id_key;

-- 2. Add appointment_id FK
ALTER TABLE chat_rooms
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

-- 3. One chat room per appointment
ALTER TABLE chat_rooms
  ADD CONSTRAINT chat_rooms_appointment_id_key UNIQUE (appointment_id);

-- 4. Index for lookups
CREATE INDEX IF NOT EXISTS idx_chat_rooms_appointment_id
  ON chat_rooms(appointment_id);
