-- Rollback: Drop device_categories table
-- Description: Removes the device_categories table and related objects
-- Date: 2025-01-28

-- Drop trigger
DROP TRIGGER IF EXISTS device_categories_updated_at ON device_categories;

-- Drop indexes
DROP INDEX IF EXISTS idx_device_categories_active;
DROP INDEX IF EXISTS idx_device_categories_name_lower;

-- Drop table
DROP TABLE IF EXISTS device_categories CASCADE;

-- Note: We don't drop the update_updated_at_column function as it may be used by other tables
