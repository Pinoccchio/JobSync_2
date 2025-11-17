-- Fix Enrolled Count Double Counting Bug
-- Run this script to recalculate enrolled_count based on actual application statuses
--
-- This fixes the issue where enrolled_count was being incremented twice:
-- 1. Once by the database trigger 'update_training_enrolled_count_trigger'
-- 2. Once by manual API code (now removed)
--
-- Expected result: Full-Stack Web Development Bootcamp should go from 9 → 7

-- Before: Check current counts
SELECT
  tp.id,
  tp.title,
  tp.enrolled_count AS current_count,
  (
    SELECT COUNT(*)
    FROM training_applications ta
    WHERE ta.program_id = tp.id
      AND ta.status IN ('approved', 'enrolled', 'in_progress')
  ) AS actual_count,
  tp.capacity
FROM training_programs tp
WHERE tp.id IN (
  SELECT DISTINCT program_id FROM training_applications
)
ORDER BY tp.title;

-- Fix: Recalculate enrolled_count based on actual statuses
UPDATE training_programs tp
SET enrolled_count = (
  SELECT COUNT(*)
  FROM training_applications ta
  WHERE ta.program_id = tp.id
    AND ta.status IN ('approved', 'enrolled', 'in_progress')
),
updated_at = NOW()
WHERE tp.id IN (
  SELECT DISTINCT program_id FROM training_applications
);

-- After: Verify the fix
SELECT
  tp.id,
  tp.title,
  tp.enrolled_count AS fixed_count,
  (
    SELECT COUNT(*)
    FROM training_applications ta
    WHERE ta.program_id = tp.id
      AND ta.status IN ('approved', 'enrolled', 'in_progress')
  ) AS actual_count,
  tp.capacity,
  CASE
    WHEN tp.enrolled_count = (
      SELECT COUNT(*)
      FROM training_applications ta
      WHERE ta.program_id = tp.id
        AND ta.status IN ('approved', 'enrolled', 'in_progress')
    ) THEN '✅ FIXED'
    ELSE '❌ MISMATCH'
  END AS status
FROM training_programs tp
WHERE tp.id IN (
  SELECT DISTINCT program_id FROM training_applications
)
ORDER BY tp.title;
