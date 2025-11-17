-- Migration: Add digital signature support for PESO officers
-- Date: 2025-01-03
-- Description: Adds signature_url column to profiles table and creates officer-signatures storage bucket

-- =====================================================
-- 1. Add signature_url column to profiles table
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.signature_url IS 'Storage path to officer digital signature image (used for training certificates)';

-- =====================================================
-- 2. Create officer-signatures storage bucket
-- =====================================================
-- Note: Run this in Supabase Dashboard > Storage or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('officer-signatures', 'officer-signatures', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. Set up RLS policies for officer-signatures bucket
-- =====================================================

-- Policy 1: PESO and ADMIN can upload their own signatures
CREATE POLICY "PESO and ADMIN can upload own signature"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'officer-signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('PESO', 'ADMIN')
  )
);

-- Policy 2: PESO and ADMIN can view their own signatures
CREATE POLICY "PESO and ADMIN can view own signature"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'officer-signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('PESO', 'ADMIN')
  )
);

-- Policy 3: PESO and ADMIN can update their own signatures
CREATE POLICY "PESO and ADMIN can update own signature"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'officer-signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('PESO', 'ADMIN')
  )
);

-- Policy 4: PESO and ADMIN can delete their own signatures
CREATE POLICY "PESO and ADMIN can delete own signature"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'officer-signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('PESO', 'ADMIN')
  )
);

-- Policy 5: Authenticated users can view signatures for certificate generation
CREATE POLICY "Authenticated can view signatures for certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'officer-signatures'
);

-- =====================================================
-- 4. Create index for faster signature lookups
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_signature_url
ON profiles(signature_url)
WHERE signature_url IS NOT NULL;
