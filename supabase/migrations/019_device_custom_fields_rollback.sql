-- Rollback: Drop device_custom_fields table
-- Description: Removes the device_custom_fields table and related objects
-- Date: 2025-01-28

-- Drop trigger
DROP TRIGGER IF EXISTS device_custom_fields_updated_at ON device_custom_fields;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_device_custom_fields_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_device_custom_fields_field;
DROP INDEX IF EXISTS idx_device_custom_fields_device;

-- Drop table
DROP TABLE IF EXISTS device_custom_fields CASCADE;
