-- Migration: Dynamic Permissions System Schema
-- Description: Creates tables for dynamic role-based permissions management
-- Requirements: 8.3, 9.5
-- 
-- This migration creates:
-- - roles: Custom roles table
-- - role_permissions: Permissions assigned to roles
-- - user_permissions: User-specific permission overrides
-- - sections: System sections with required permissions
-- - permissions_audit: Audit log for permission changes
-- - Adds role_id column to users table
-- - Optimized indexes for permission queries

-- ============================================
-- Table: roles
-- Stores custom roles that can be assigned to users
-- ============================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_protected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comment for documentation
COMMENT ON TABLE roles IS 'Custom roles for the dynamic permissions system';
COMMENT ON COLUMN roles.is_protected IS 'Protected roles (admin, user) cannot be deleted';

-- ============================================
-- Table: role_permissions
-- Maps permissions to roles (many-to-many)
-- ============================================
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission)
);

COMMENT ON TABLE role_permissions IS 'Permissions assigned to each role';
COMMENT ON COLUMN role_permissions.permission IS 'Permission identifier (e.g., tools:view, loans:create)';

-- ============================================
-- Table: user_permissions
-- User-specific permission overrides (grant or revoke)
-- ============================================
CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL, -- true = granted (adds permission), false = revoked (removes permission)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission)
);

COMMENT ON TABLE user_permissions IS 'User-specific permission overrides that supersede role permissions';
COMMENT ON COLUMN user_permissions.is_granted IS 'true = permission granted (added), false = permission revoked (removed from role)';

-- ============================================
-- Table: sections
-- System sections with access control
-- ============================================
CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  required_permission VARCHAR(100) NOT NULL,
  parent_section_id INTEGER REFERENCES sections(id),
  display_order INTEGER DEFAULT 0,
  is_admin_section BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sections IS 'System sections with required permissions for access control';
COMMENT ON COLUMN sections.required_permission IS 'Permission required to access this section';
COMMENT ON COLUMN sections.is_admin_section IS 'Whether this section is part of the admin area';

-- ============================================
-- Table: permissions_audit
-- Immutable audit log for all permission changes
-- ============================================
CREATE TABLE permissions_audit (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- 'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed', 'user_permissions_changed'
  target_type VARCHAR(20) NOT NULL, -- 'role' or 'user'
  target_id INTEGER NOT NULL,
  target_name VARCHAR(100),
  changes JSONB NOT NULL, -- { added: [], removed: [], before: {}, after: {} }
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE permissions_audit IS 'Immutable audit log for permission changes';
COMMENT ON COLUMN permissions_audit.action_type IS 'Type of action: role_created, role_updated, role_deleted, role_permissions_changed, user_permissions_changed';
COMMENT ON COLUMN permissions_audit.target_type IS 'Target entity type: role or user';
COMMENT ON COLUMN permissions_audit.changes IS 'JSON object with change details: added, removed, before, after';

-- ============================================
-- Modify users table: Add role_id column
-- ============================================
ALTER TABLE users 
  ADD COLUMN role_id INTEGER REFERENCES roles(id);

COMMENT ON COLUMN users.role_id IS 'Reference to the dynamic roles table';

-- ============================================
-- Indexes for performance optimization
-- Requirement 9.5: Optimized indexes for permission queries
-- ============================================

-- Indexes for role_permissions table
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);

-- Indexes for user_permissions table
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission);

-- Indexes for sections table
CREATE INDEX idx_sections_path ON sections(path);
CREATE INDEX idx_sections_required_permission ON sections(required_permission);
CREATE INDEX idx_sections_parent ON sections(parent_section_id);

-- Indexes for permissions_audit table
CREATE INDEX idx_permissions_audit_target ON permissions_audit(target_type, target_id);
CREATE INDEX idx_permissions_audit_admin ON permissions_audit(admin_user_id);
CREATE INDEX idx_permissions_audit_created ON permissions_audit(created_at DESC);
CREATE INDEX idx_permissions_audit_action ON permissions_audit(action_type);

-- Index for users.role_id
CREATE INDEX idx_users_role_id ON users(role_id);

-- ============================================
-- Triggers for updated_at columns
-- ============================================

-- Trigger for roles table
CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_permissions table
CREATE TRIGGER update_user_permissions_updated_at 
  BEFORE UPDATE ON user_permissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
