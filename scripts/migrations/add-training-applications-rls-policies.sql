-- Migration: Add RLS Policies for training_applications Table
-- Date: 2025-11-04
-- Purpose: Fix issue where applicants cannot view their own training applications
--
-- Problem: training_applications table has RLS enabled but missing SELECT policy for applicants
-- Result: API returns 0 applications to applicants, but PESO can see all applications
--
-- Solution: Add comprehensive RLS policies for all CRUD operations

-- ============================================================================
-- STEP 1: Drop existing policies (if any) to avoid conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Applicants can view their own training applications" ON training_applications;
DROP POLICY IF EXISTS "Applicants can create their own training applications" ON training_applications;
DROP POLICY IF EXISTS "Applicants can update their own training applications" ON training_applications;
DROP POLICY IF EXISTS "PESO and ADMIN can manage all training applications" ON training_applications;
DROP POLICY IF EXISTS "PESO and ADMIN can view all training applications" ON training_applications;
DROP POLICY IF EXISTS "HR can view all training applications" ON training_applications;

-- ============================================================================
-- STEP 2: Create SELECT Policy (View/Read Access)
-- ============================================================================

-- Allow applicants to view their own training applications
-- Allow PESO, ADMIN, and HR to view all training applications
CREATE POLICY "Applicants can view their own training applications"
  ON training_applications
  FOR SELECT
  USING (
    -- Applicants can only see their own applications
    applicant_id = auth.uid()
    OR
    -- PESO, ADMIN, and HR can see all applications
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('PESO', 'ADMIN', 'HR')
  );

-- ============================================================================
-- STEP 3: Create INSERT Policy (Create Access)
-- ============================================================================

-- Allow applicants to create their own training applications
-- The applicant_id must match the authenticated user's ID
CREATE POLICY "Applicants can create their own training applications"
  ON training_applications
  FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid()
  );

-- ============================================================================
-- STEP 4: Create UPDATE Policy (Modify Access)
-- ============================================================================

-- Allow applicants to update their own training applications
-- This enables withdrawal, updating contact info, etc.
CREATE POLICY "Applicants can update their own training applications"
  ON training_applications
  FOR UPDATE
  USING (
    -- Can only update their own applications
    applicant_id = auth.uid()
  )
  WITH CHECK (
    -- After update, applicant_id must still be the same
    applicant_id = auth.uid()
  );

-- ============================================================================
-- STEP 5: Create ADMIN/PESO Policy (Full Access)
-- ============================================================================

-- Allow PESO and ADMIN to perform ALL operations on training applications
-- This includes SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "PESO and ADMIN can manage all training applications"
  ON training_applications
  FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('PESO', 'ADMIN')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('PESO', 'ADMIN')
  );

-- ============================================================================
-- STEP 6: Ensure RLS is Enabled
-- ============================================================================

-- Enable Row Level Security on training_applications table
-- (Should already be enabled from previous migrations, but enforce it)
ALTER TABLE training_applications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after applying migration)
-- ============================================================================

-- Verify policies were created:
-- SELECT policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'training_applications';

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename = 'training_applications';

-- Test as applicant (replace 'applicant-uuid' with actual user ID):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL "request.jwt.claims" = '{"sub": "applicant-uuid", "role": "authenticated"}';
-- SELECT * FROM training_applications WHERE applicant_id = 'applicant-uuid';
