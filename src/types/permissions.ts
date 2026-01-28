/**
 * Permission Types for Dynamic Permissions System
 * 
 * This file contains all TypeScript types and interfaces for the dynamic
 * permissions system that replaces the hardcoded permissions.
 * 
 * @see Requirements 8.4 - Maintain same permission identifiers
 */

/**
 * Base Role interface representing a role in the system
 */
export interface Role {
  id: number;
  name: string;
  description: string | null;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended Role interface that includes permissions and user count
 * Used in admin interfaces to display role details
 */
export interface RoleWithPermissions extends Role {
  permissions: string[];
  userCount: number;
}

/**
 * User permission override - allows granting or revoking specific
 * permissions for individual users, independent of their role
 */
export interface UserPermissionOverride {
  id: number;
  userId: number;
  permission: string;
  isGranted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Section represents a navigable area of the system
 * Each section has a required permission for access control
 */
export interface Section {
  id: number;
  name: string;
  path: string;
  description: string | null;
  requiredPermission: string;
  parentSectionId: number | null;
  displayOrder: number;
  isAdminSection: boolean;
}

/**
 * Audit entry for tracking all permission-related changes
 * Supports immutable audit trail as per Requirements 6.5
 */
export interface PermissionAuditEntry {
  id: number;
  adminUserId: number | null;
  adminUsername?: string;
  actionType: 'role_created' | 'role_updated' | 'role_deleted' | 'role_permissions_changed' | 'user_permissions_changed';
  targetType: 'role' | 'user';
  targetId: number;
  targetName: string;
  changes: {
    added?: string[];
    removed?: string[];
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Effective permissions for a user, combining role permissions
 * with user-specific overrides (grants and revokes)
 * 
 * Formula: effective = (rolePermissions - userRevoked) + userGranted
 */
export interface EffectivePermissions {
  roleId: number;
  roleName: string;
  rolePermissions: string[];
  userGranted: string[];
  userRevoked: string[];
  effective: string[];
}

/**
 * Permission categories for organizing permissions in the UI matrix
 * @see Requirements 2.6 - Categories for permission matrix
 */
export type PermissionCategory = 
  | 'tools'
  | 'loans'
  | 'consumables'
  | 'admin'
  | 'users'
  | 'notifications'
  | 'audit'
  | 'reports'
  | 'system';

/**
 * Definition of a permission with metadata for display in admin UI
 */
export interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

/**
 * User with their complete permission information
 * Used in the Users tab of the permissions admin interface
 */
export interface UserWithPermissions {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  roleId: number;
  roleName: string;
  effectivePermissions: string[];
  overrides: {
    granted: string[];
    revoked: string[];
  };
}

/**
 * Input type for creating a new role
 */
export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions?: string[];
}

/**
 * Input type for updating an existing role
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

/**
 * Result of checking if a role can be deleted
 */
export interface CanDeleteRoleResult {
  canDelete: boolean;
  reason?: string;
  affectedUsers?: number;
}

/**
 * Audit history filter options
 */
export interface AuditHistoryFilters {
  actionType?: PermissionAuditEntry['actionType'];
  targetType?: 'role' | 'user';
  adminUserId?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Permission error codes for consistent error handling
 */
export type PermissionErrorCode =
  | 'ROLE_NAME_REQUIRED'
  | 'ROLE_NAME_EXISTS'
  | 'ROLE_NAME_TOO_LONG'
  | 'PROTECTED_ROLE'
  | 'CRITICAL_PERMISSION'
  | 'SELF_PERMISSION_REMOVAL'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ADMIN_REQUIRED'
  | 'DB_CONNECTION_ERROR'
  | 'CONSTRAINT_VIOLATION'
  | 'TRANSACTION_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * Structured permission error for consistent error handling
 */
export interface PermissionError {
  code: PermissionErrorCode;
  message: string;
  field?: string;
  recoverable: boolean;
}
