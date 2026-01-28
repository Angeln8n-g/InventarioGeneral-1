-- Rollback Migration: Dynamic Permissions System Schema
-- Description: Removes all tables and columns created by 031_dynamic_permissions_schema.sql
-- Use this to revert the dynamic permissions system schema

-- ============================================
-- Drop triggers first
-- ============================================
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;

-- ============================================
-- Drop indexes
-- ============================================
DROP INDEX IF EXISTS idx_role_permissions_role_id;
DROP INDEX IF EXISTS idx_role_permissions_permission;
DROP INDEX IF EXISTS idx_user_permissions_user_id;
DROP INDEX IF EXISTS idx_user_permissions_permission;
DROP INDEX IF EXISTS idx_sections_path;
DROP INDEX IF EXISTS idx_sections_required_permission;
DROP INDEX IF EXISTS idx_sections_parent;
DROP INDEX IF EXISTS idx_permissions_audit_target;
DROP INDEX IF EXISTS idx_permissions_audit_admin;
DROP INDEX IF EXISTS idx_permissions_audit_created;
DROP INDEX IF EXISTS idx_permissions_audit_action;
DROP INDEX IF EXISTS idx_users_role_id;

-- ============================================
-- Remove role_id column from users table
-- ============================================
ALTER TABLE users DROP COLUMN IF EXISTS role_id;

-- ============================================
-- Drop tables in correct order (respecting foreign keys)
-- ============================================
DROP TABLE IF EXISTS permissions_audit;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS roles;
