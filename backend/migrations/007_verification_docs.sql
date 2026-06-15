-- ============================================================
-- Migration 007: Verification documents storage
-- ============================================================
-- Adds verification_docs JSONB column to store Storage paths.
-- Creates a private 'verification-docs' bucket with RLS so:
--   - Owners can upload their own docs (INSERT only)
--   - Service role (backend) can read all (for signed URLs)
--   - Anonymous / other users cannot read anything
-- ============================================================

-- 1. Add column to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS verification_docs JSONB DEFAULT '{}'::jsonb;

-- 2. Create the private storage bucket (run in Supabase Dashboard → Storage if
--    the SQL editor does not support storage.buckets directly)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('verification-docs', 'verification-docs', false)
-- ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies (run after creating the bucket):
-- Allow authenticated users to upload ONLY to their own folder:
-- CREATE POLICY "owners_upload"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow service role to read all objects (backend generates signed URLs):
-- This is automatic for service_role — no extra policy needed.

-- Note: run the commented INSERT + CREATE POLICY statements
-- manually in Supabase SQL Editor after creating the bucket.
