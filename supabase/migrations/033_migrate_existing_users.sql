-- Migration: Migrate Existing Users to Dynamic Permissions System
-- Description: Migrates existing users from the hardcoded role column to the new role_id foreign key
-- Requirements: 8.3, 8.6
-- 
-- This migration:
-- - Maps users with role='admin' to the admin role_id
-- - Maps users with role='user' to the user role_id
-- - Handles NULL or unknown roles by defaulting to user role
-- - Preserves all existing user data and permissions
-- 
-- IMPORTANT: This migration must run AFTER:
-- - 031_dynamic_permissions_schema.sql (creates roles table and role_id column)
-- - 032_dynamic_permissions_seed.sql (seeds admin and user roles)

-- ============================================
-- Step 1: Update users with role='admin' to use admin role_id
-- ============================================
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE role = 'admin';

-- ============================================
-- Step 2: Update users with role='user' to use user role_id
-- ============================================
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'user')
WHERE role = 'user';

-- ============================================
-- Step 3: Handle users with NULL or unknown roles
-- Default to 'user' role for safety
-- ============================================
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'user')
WHERE role_id IS NULL;

-- ============================================
-- Step 4: Add NOT NULL constraint to role_id
-- Now that all users have been migrated, enforce the constraint
-- ============================================
ALTER TABLE users
ALTER COLUMN role_id SET NOT NULL;

-- ============================================
-- Step 5: Add comment documenting the migration
-- ============================================
COMMENT ON COLUMN users.role_id IS 'Foreign key to roles table. Migrated from legacy role column. All users must have a role assigned.';

-- ============================================
-- Verification query (for manual verification after migration)
-- This is commented out but can be run to verify the migration
-- ============================================
-- SELECT 
--   u.id,
--   u.username,
--   u.email,
--   u.role AS legacy_role,
--   u.role_id,
--   r.name AS new_role_name
-- FROM users u
-- LEFT JOIN roles r ON u.role_id = r.id
-- ORDER BY u.id;

-- ============================================
-- Migration Summary
-- ============================================
-- This migration preserves all existing user permissions by:
-- 1. Users with role='admin' → role_id pointing to admin role (has all permissions)
-- 2. Users with role='user' → role_id pointing to user role (has basic permissions)
-- 3. Users with NULL/unknown role → role_id pointing to user role (safe default)
--
-- The legacy 'role' column is preserved for backward compatibility during transition.
-- It can be dropped in a future migration once all code has been updated to use role_id.
