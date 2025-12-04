-- Migration: 024_fix_updated_at_trigger.sql
-- Description: Fix the update_updated_at_column function that was incorrectly modified
-- to include version increment, which breaks tables without a version column
-- Date: 2024-12-03

-- Step 1: Create a specific function for tables WITH version column
CREATE OR REPLACE FUNCTION update_updated_at_with_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Restore the original update_updated_at_column function (WITHOUT version)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update device_categories to use the version-aware function
DROP TRIGGER IF EXISTS device_categories_updated_at ON device_categories;
CREATE TRIGGER device_categories_updated_at
  BEFORE UPDATE ON device_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_version();

-- Step 4: Update classrooms to use the version-aware function (if it has version column)
DROP TRIGGER IF EXISTS trigger_update_classroom_timestamp ON classrooms;
CREATE TRIGGER trigger_update_classroom_timestamp
  BEFORE UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_version();

-- Verify the fix by checking the function definition
DO $$
BEGIN
  RAISE NOTICE 'Migration 024 completed: Fixed update_updated_at_column function';
END $$;
