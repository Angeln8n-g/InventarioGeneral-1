/**
 * RolesService - Dynamic Permissions System
 * 
 * This service handles all role-related operations including:
 * - CRUD operations for roles (getAllRoles, getRoleById, createRole, updateRole, deleteRole)
 * - Protected role validation (admin, user roles cannot be deleted)
 * - User reassignment when deleting roles
 * - Audit logging for role changes
 * 
 * @see Requirements 1.1, 1.2, 1.4, 1.6, 1.7, 1.8
 * @see Design Document - RolesService Interface
 */

import { supabase } from '@/lib/supabase';
import type { 
  Role, 
  CreateRoleInput, 
  UpdateRoleInput, 
  CanDeleteRoleResult,
  PermissionError,
  PermissionErrorCode
} from '@/types/permissions';
import { PermissionsService } from './permissions.service';

/**
 * Extended Role interface with user count for list display
 */
export interface RoleWithUserCount extends Role {
  userCount: number;
}

/**
 * User basic info for role assignment operations
 */
interface UserBasicInfo {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
}

/**
 * Audit log entry for role changes
 */
interface RoleAuditLogEntry {
  adminUserId: number;
  actionType: 'role_created' | 'role_updated' | 'role_deleted';
  targetType: 'role';
  targetId: number;
  targetName: string;
  changes: {
    added?: string[];
    removed?: string[];
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Protected role names that cannot be deleted
 * @see Requirements 1.7, 1.8
 */
const PROTECTED_ROLE_NAMES = ['admin', 'user'];

/**
 * Default role name for user reassignment when a role is deleted
 * @see Requirements 1.6
 */
const DEFAULT_ROLE_NAME = 'user';

/**
 * Create a PermissionError object
 */
function createError(
  code: PermissionErrorCode, 
  message: string, 
  field?: string, 
  recoverable = true
): PermissionError {
  return { code, message, field, recoverable };
}

/**
 * Get all roles with user count
 * 
 * @returns Array of roles with user count
 * @see Requirements 1.1 - Show list of roles with name, description, user count
 */
export async function getAllRoles(): Promise<RoleWithUserCount[]> {
  // Get all roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .order('name');

  if (rolesError) {
    throw new Error(`Failed to get roles: ${rolesError.message}`);
  }

  if (!roles || roles.length === 0) {
    return [];
  }

  // Get user counts for each role
  const rolesWithCounts: RoleWithUserCount[] = [];

  for (const role of roles) {
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', role.id);

    if (countError) {
      console.error(`Failed to get user count for role ${role.id}:`, countError);
    }

    rolesWithCounts.push({
      id: role.id,
      name: role.name,
      description: role.description,
      isProtected: role.is_protected,
      userCount: count || 0,
      createdAt: new Date(role.created_at),
      updatedAt: new Date(role.updated_at),
    });
  }

  return rolesWithCounts;
}

/**
 * Get a role by ID
 * 
 * @param id - The role ID to retrieve
 * @returns Role object or null if not found
 */
export async function getRoleById(id: number): Promise<Role | null> {
  const { data: role, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get role: ${error.message}`);
  }

  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isProtected: role.is_protected,
    createdAt: new Date(role.created_at),
    updatedAt: new Date(role.updated_at),
  };
}

/**
 * Get a role by name
 * 
 * @param name - The role name to retrieve
 * @returns Role object or null if not found
 */
export async function getRoleByName(name: string): Promise<Role | null> {
  const { data: role, error } = await supabase
    .from('roles')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get role by name: ${error.message}`);
  }

  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isProtected: role.is_protected,
    createdAt: new Date(role.created_at),
    updatedAt: new Date(role.updated_at),
  };
}

/**
 * Validate role name
 * 
 * @param name - The role name to validate
 * @throws PermissionError if validation fails
 */
function validateRoleName(name: string): void {
  if (!name || name.trim().length === 0) {
    const error = createError('ROLE_NAME_REQUIRED', 'El nombre del rol es requerido', 'name');
    throw error;
  }

  if (name.length > 50) {
    const error = createError('ROLE_NAME_TOO_LONG', 'El nombre del rol es muy largo (máximo 50 caracteres)', 'name');
    throw error;
  }
}

/**
 * Create a new role
 * 
 * @param input - Role creation input (name, description, optional permissions)
 * @param adminId - The admin user ID making the change (for audit)
 * @returns The created role
 * @see Requirements 1.2 - Create role with valid name and description
 * @see Requirements 1.3 - Reject duplicate role names
 */
export async function createRole(input: CreateRoleInput, adminId: number): Promise<Role> {
  // Validate input
  validateRoleName(input.name);

  // Check for duplicate name
  const existingRole = await getRoleByName(input.name);
  if (existingRole) {
    const error = createError('ROLE_NAME_EXISTS', 'Ya existe un rol con este nombre', 'name');
    throw error;
  }

  // Insert the new role
  const { data: role, error: insertError } = await supabase
    .from('roles')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_protected: false,
    })
    .select()
    .single();

  if (insertError) {
    // Handle unique constraint violation
    if (insertError.code === '23505') {
      const error = createError('ROLE_NAME_EXISTS', 'Ya existe un rol con este nombre', 'name');
      throw error;
    }
    throw new Error(`Failed to create role: ${insertError.message}`);
  }

  // If permissions were provided, assign them to the role
  if (input.permissions && input.permissions.length > 0) {
    await PermissionsService.setRolePermissions(role.id, input.permissions, adminId);
  }

  // Log audit entry
  await logRoleAuditEntry({
    adminUserId: adminId,
    actionType: 'role_created',
    targetType: 'role',
    targetId: role.id,
    targetName: role.name,
    changes: {
      after: {
        name: role.name,
        description: role.description,
        permissions: input.permissions || [],
      },
    },
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isProtected: role.is_protected,
    createdAt: new Date(role.created_at),
    updatedAt: new Date(role.updated_at),
  };
}

/**
 * Update an existing role
 * 
 * @param id - The role ID to update
 * @param input - Role update input (name, description)
 * @param adminId - The admin user ID making the change (for audit)
 * @returns The updated role
 * @see Requirements 1.4 - Edit role name/description while preserving permissions and users
 */
export async function updateRole(id: number, input: UpdateRoleInput, adminId: number): Promise<Role> {
  // Get current role
  const currentRole = await getRoleById(id);
  if (!currentRole) {
    throw new Error(`Role not found: ${id}`);
  }

  // Validate name if provided
  if (input.name !== undefined) {
    validateRoleName(input.name);

    // Check for duplicate name (excluding current role)
    const existingRole = await getRoleByName(input.name);
    if (existingRole && existingRole.id !== id) {
      const error = createError('ROLE_NAME_EXISTS', 'Ya existe un rol con este nombre', 'name');
      throw error;
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }

  if (input.description !== undefined) {
    updateData.description = input.description?.trim() || null;
  }

  // Update the role
  const { data: role, error: updateError } = await supabase
    .from('roles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    // Handle unique constraint violation
    if (updateError.code === '23505') {
      const error = createError('ROLE_NAME_EXISTS', 'Ya existe un rol con este nombre', 'name');
      throw error;
    }
    throw new Error(`Failed to update role: ${updateError.message}`);
  }

  // Log audit entry
  await logRoleAuditEntry({
    adminUserId: adminId,
    actionType: 'role_updated',
    targetType: 'role',
    targetId: role.id,
    targetName: role.name,
    changes: {
      before: {
        name: currentRole.name,
        description: currentRole.description,
      },
      after: {
        name: role.name,
        description: role.description,
      },
    },
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isProtected: role.is_protected,
    createdAt: new Date(role.created_at),
    updatedAt: new Date(role.updated_at),
  };
}

/**
 * Check if a role is protected (cannot be deleted)
 * 
 * @param roleId - The role ID to check
 * @returns true if the role is protected, false otherwise
 * @see Requirements 1.7, 1.8 - admin and user roles are protected
 */
export async function isProtectedRole(roleId: number): Promise<boolean> {
  const role = await getRoleById(roleId);
  if (!role) {
    return false;
  }
  
  return role.isProtected || PROTECTED_ROLE_NAMES.includes(role.name.toLowerCase());
}

/**
 * Check if a role name is protected
 * 
 * @param roleName - The role name to check
 * @returns true if the role name is protected, false otherwise
 */
export function isProtectedRoleName(roleName: string): boolean {
  return PROTECTED_ROLE_NAMES.includes(roleName.toLowerCase());
}

/**
 * Check if a role can be deleted
 * 
 * @param roleId - The role ID to check
 * @returns Object with canDelete flag, reason if not deletable, and affected user count
 * @see Requirements 1.5 - Show confirmation with affected users
 * @see Requirements 1.7, 1.8 - Protected roles cannot be deleted
 */
export async function canDeleteRole(roleId: number): Promise<CanDeleteRoleResult> {
  const role = await getRoleById(roleId);
  
  if (!role) {
    return {
      canDelete: false,
      reason: 'El rol no existe',
    };
  }

  // Check if role is protected
  if (role.isProtected || PROTECTED_ROLE_NAMES.includes(role.name.toLowerCase())) {
    return {
      canDelete: false,
      reason: `El rol "${role.name}" es un rol protegido del sistema y no puede ser eliminado`,
    };
  }

  // Get count of users with this role
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role_id', roleId);

  if (error) {
    throw new Error(`Failed to get user count: ${error.message}`);
  }

  return {
    canDelete: true,
    affectedUsers: count || 0,
  };
}

/**
 * Delete a role
 * 
 * @param id - The role ID to delete
 * @param adminId - The admin user ID making the change (for audit)
 * @throws Error if role is protected or doesn't exist
 * @see Requirements 1.6 - Reassign users to "user" role when deleting
 * @see Requirements 1.7, 1.8 - Reject deletion of protected roles
 */
export async function deleteRole(id: number, adminId: number): Promise<void> {
  // Get current role
  const currentRole = await getRoleById(id);
  if (!currentRole) {
    throw new Error(`Role not found: ${id}`);
  }

  // Check if role can be deleted
  const canDelete = await canDeleteRole(id);
  if (!canDelete.canDelete) {
    const error = createError('PROTECTED_ROLE', canDelete.reason || 'No se puede eliminar este rol');
    throw error;
  }

  // Get the default "user" role for reassignment
  const defaultRole = await getRoleByName(DEFAULT_ROLE_NAME);
  if (!defaultRole) {
    throw new Error(`Default role "${DEFAULT_ROLE_NAME}" not found. Cannot reassign users.`);
  }

  // Reassign all users with this role to the default role
  // @see Requirements 1.6
  const { error: reassignError } = await supabase
    .from('users')
    .update({ 
      role_id: defaultRole.id,
      role: DEFAULT_ROLE_NAME,
      updated_at: new Date().toISOString(),
    })
    .eq('role_id', id);

  if (reassignError) {
    throw new Error(`Failed to reassign users: ${reassignError.message}`);
  }

  // Delete role permissions first (cascade should handle this, but being explicit)
  const { error: permissionsError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', id);

  if (permissionsError) {
    console.error(`Failed to delete role permissions: ${permissionsError.message}`);
    // Continue with role deletion - permissions should cascade
  }

  // Delete the role
  const { error: deleteError } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw new Error(`Failed to delete role: ${deleteError.message}`);
  }

  // Log audit entry
  await logRoleAuditEntry({
    adminUserId: adminId,
    actionType: 'role_deleted',
    targetType: 'role',
    targetId: id,
    targetName: currentRole.name,
    changes: {
      before: {
        name: currentRole.name,
        description: currentRole.description,
        isProtected: currentRole.isProtected,
      },
    },
  });

  // Invalidate cache for affected users
  PermissionsService.invalidateRoleCache(id);
}

/**
 * Assign a user to a role
 * 
 * @param userId - The user ID to assign
 * @param roleId - The role ID to assign to
 * @param adminId - The admin user ID making the change (for audit)
 */
export async function assignUserToRole(
  userId: number, 
  roleId: number, 
  adminId: number
): Promise<void> {
  // Verify role exists
  const role = await getRoleById(roleId);
  if (!role) {
    throw new Error(`Role not found: ${roleId}`);
  }

  // Get current user info for audit
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, role_id, role')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  const previousRoleId = user.role_id;
  const previousRoleName = user.role;

  // Update user's role
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      role_id: roleId,
      role: role.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to assign user to role: ${updateError.message}`);
  }

  // Log audit entry
  await logRoleAuditEntry({
    adminUserId: adminId,
    actionType: 'role_updated',
    targetType: 'role',
    targetId: roleId,
    targetName: role.name,
    changes: {
      before: {
        userId,
        username: user.username,
        roleId: previousRoleId,
        roleName: previousRoleName,
      },
      after: {
        userId,
        username: user.username,
        roleId: roleId,
        roleName: role.name,
      },
    },
  });

  // Invalidate user's permission cache
  PermissionsService.invalidateUserCache(userId);
}

/**
 * Get all users assigned to a role
 * 
 * @param roleId - The role ID to get users for
 * @returns Array of users with basic info
 */
export async function getUsersByRole(roleId: number): Promise<UserBasicInfo[]> {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, email, full_name')
    .eq('role_id', roleId)
    .order('username');

  if (error) {
    throw new Error(`Failed to get users by role: ${error.message}`);
  }

  return (users || []).map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
  }));
}

/**
 * Log an audit entry for role changes
 * 
 * @param entry - The audit log entry to record
 */
async function logRoleAuditEntry(entry: RoleAuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('permissions_audit')
      .insert({
        admin_user_id: entry.adminUserId,
        action_type: entry.actionType,
        target_type: entry.targetType,
        target_id: entry.targetId,
        target_name: entry.targetName,
        changes: entry.changes,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
      });

    if (error) {
      // Log error but don't throw - audit failures shouldn't break operations
      console.error('Failed to log role audit entry:', error);
    }
  } catch (err) {
    // Log error but don't throw - audit failures shouldn't break operations
    console.error('Failed to log role audit entry:', err);
  }
}

// Export the RolesService as a namespace for cleaner imports
export const RolesService = {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  isProtectedRole,
  isProtectedRoleName,
  canDeleteRole,
  assignUserToRole,
  getUsersByRole,
};

export default RolesService;
