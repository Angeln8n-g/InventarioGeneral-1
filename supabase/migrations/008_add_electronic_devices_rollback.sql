-- Rollback Migration: Remove electronic_devices table
-- This script removes the electronic_devices table and all associated objects

-- Drop trigger
DROP TRIGGER IF EXISTS update_electronic_devices_updated_at ON electronic_devices;

-- Drop indexes
DROP INDEX IF EXISTS idx_electronic_devices_tool_instance;
DROP INDEX IF EXISTS idx_electronic_devices_brand;
DROP INDEX IF EXISTS idx_electronic_devices_model;

-- Drop table (CASCADE will remove foreign key constraints)
DROP TABLE IF EXISTS electronic_devices CASCADE;

-- Log the rollback
DO $
BEGIN
  RAISE NOTICE 'Rollback completed: electronic_devices table and related objects removed';
END $;
