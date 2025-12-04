-- Rollback Migration 016: Remove Classrooms and Device Assignments
-- This script reverses all changes made in migration 016
-- WARNING: This will delete all classroom and assignment data!

-- ============================================================================
-- 1. Drop triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_classroom_timestamp ON classrooms;
DROP TRIGGER IF EXISTS trigger_update_device_assignment_timestamp ON device_assignments;
DROP TRIGGER IF EXISTS trigger_update_device_combination_timestamp ON device_combinations;

-- ============================================================================
-- 2. Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS update_classroom_timestamp();
DROP FUNCTION IF EXISTS update_device_assignment_timestamp();
DROP FUNCTION IF EXISTS update_device_combination_timestamp();
DROP FUNCTION IF EXISTS get_classroom_device_count(INTEGER);
DROP FUNCTION IF EXISTS can_combine_devices(INTEGER, INTEGER);

-- ============================================================================
-- 3. Drop tables (in reverse order of dependencies)
-- ============================================================================

DROP TABLE IF EXISTS device_combinations CASCADE;
DROP TABLE IF EXISTS device_assignments CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;

-- ============================================================================
-- 4. Remove memory capacity columns from electronic_devices
-- ============================================================================

ALTER TABLE electronic_devices 
  DROP COLUMN IF EXISTS memory_capacity,
  DROP COLUMN IF EXISTS memory_unit;

-- ============================================================================
-- Rollback complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 016 rollback completed successfully';
  RAISE NOTICE 'All classroom and device assignment data has been removed';
END $$;
