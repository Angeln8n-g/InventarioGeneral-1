-- Migration: Remove duplicate foreign key constraint
-- This fixes the ambiguity issue when querying with Supabase

-- Drop the manually created constraint (keep the auto-generated one)
ALTER TABLE electronic_devices 
DROP CONSTRAINT IF EXISTS fk_tool_instance;

-- The constraint electronic_devices_tool_instance_id_fkey will remain
-- This is the one we're using in our queries

-- Add comment
COMMENT ON CONSTRAINT electronic_devices_tool_instance_id_fkey ON electronic_devices 
IS 'Foreign key to tool_instances table (primary relationship)';
