/**
 * PermissionsService - Dynamic Permissions System
 * 
 * This service handles all permission-related operations including:
 * - Querying effective permissions for users
 * - Managing role permissions
 * - Managing user-specific permission overrides
 * - Permission validation (hasPermission, hasAnyPermission, hasAllPermissions)
 * - In-memory caching for performance
 * 
 * @see Requirements 2.2, 3.2, 3.3, 3.5
 * @see Design Document - PermissionsService Interface
 */

import { supabase } from '@/lib/supabase';
import type { EffectivePermissions } from '@/types/permissions';

/**
 * Interface for user permission overrides
 */
interface UserOverrides {
  granted: string[];
  revoked: string[];
}

/**
 * Cache entry structure for storing permissions with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Audit log entry for permission changes
 */
interface AuditLogEntry {
  adminUserId: number;
  actionType: 'role_permissions_changed' | 'user_permissions_changed';
  targetType: 'role' | 'user';
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
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * In-memory cache for user permissions
 */
const userPermissionsCache = new Map<number, CacheEntry<EffectivePermissions>>();

/**
 * In-memory cache for role permissions
 */
const rolePermissionsCache = new Map<number, CacheEntry<string[]>>();

/**
 * Check if a cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Get the effective permissions for a user
 * 
 * Calculates permissions using the formula:
 * effective = (rolePermissions - userRevoked) + userGranted
 * 
 * @param userId - The user ID to get permissions for
 * @returns EffectivePermissions object with all permission details
 * @see Requirements 3.5
 */
export async function getEffectivePermissions(userId: number): Promise<EffectivePermissions> {
  // Check cache first
  const cached = userPermissionsCache.get(userId);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  // Get user with role information
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role_id, role')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Get role information
  let roleId = user.role_id;
  let roleName = user.role || 'user';

  // If user doesn't have role_id, try to get it from the roles table by name
  if (!roleId) {
    const { data: role } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', roleName)
      .single();
    
    if (role) {
      roleId = role.id;
      roleName = role.name;
    }
  } else {
    // Get role name from role_id
    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single();
    
    if (role) {
      roleName = role.name;
    }
  }

  // Get role permissions
  const rolePermissions = roleId ? await getRolePermissions(roleId) : [];

  // Get user overrides
  const overrides = await getUserOverrides(userId);

  // Calculate effective permissions using the formula:
  // effective = (rolePermissions - userRevoked) + userGranted
  const effectiveSet = new Set<string>();
  
  // Add role permissions that are not revoked
  for (const permission of rolePermissions) {
    if (!overrides.revoked.includes(permission)) {
      effectiveSet.add(permission);
    }
  }
  
  // Add granted permissions
  for (const permission of overrides.granted) {
    effectiveSet.add(permission);
  }

  const result: EffectivePermissions = {
    roleId: roleId || 0,
    roleName,
    rolePermissions,
    userGranted: overrides.granted,
    userRevoked: overrides.revoked,
    effective: Array.from(effectiveSet),
  };

  // Cache the result
  userPermissionsCache.set(userId, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}

/**
 * Get permissions assigned to a role
 * 
 * @param roleId - The role ID to get permissions for
 * @returns Array of permission strings
 * @see Requirements 2.2
 */
export async function getRolePermissions(roleId: number): Promise<string[]> {
  // Check cache first
  const cached = rolePermissionsCache.get(roleId);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .select('permission')
    .eq('role_id', roleId);

  if (error) {
    throw new Error(`Failed to get role permissions: ${error.message}`);
  }

  const permissions = data?.map(row => row.permission) || [];

  // Cache the result
  rolePermissionsCache.set(roleId, {
    data: permissions,
    timestamp: Date.now(),
  });

  return permissions;
}

/**
 * Get user-specific permission overrides
 * 
 * @param userId - The user ID to get overrides for
 * @returns Object with granted and revoked permission arrays
 * @see Requirements 3.2, 3.3
 */
export async function getUserOverrides(userId: number): Promise<UserOverrides> {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('permission, is_granted')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get user overrides: ${error.message}`);
  }

  const granted: string[] = [];
  const revoked: string[] = [];

  for (const row of data || []) {
    if (row.is_granted) {
      granted.push(row.permission);
    } else {
      revoked.push(row.permission);
    }
  }

  return { granted, revoked };
}

/**
 * Set all permissions for a role (replaces existing permissions)
 * 
 * @param roleId - The role ID to set permissions for
 * @param permissions - Array of permission strings to assign
 * @param adminId - The admin user ID making the change (for audit)
 * @see Requirements 2.2
 */
export async function setRolePermissions(
  roleId: number,
  permissions: string[],
  adminId: number
): Promise<void> {
  // Get current permissions for audit
  const currentPermissions = await getRolePermissions(roleId);
  
  // Get role name for audit
  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', roleId)
    .single();

  // Delete existing permissions
  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId);

  if (deleteError) {
    throw new Error(`Failed to clear role permissions: ${deleteError.message}`);
  }

  // Insert new permissions
  if (permissions.length > 0) {
    const permissionRows = permissions.map(permission => ({
      role_id: roleId,
      permission,
    }));

    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert(permissionRows);

    if (insertError) {
      throw new Error(`Failed to set role permissions: ${insertError.message}`);
    }
  }

  // Calculate changes for audit
  const added = permissions.filter(p => !currentPermissions.includes(p));
  const removed = currentPermissions.filter(p => !permissions.includes(p));

  // Log audit entry
  await logAuditEntry({
    adminUserId: adminId,
    actionType: 'role_permissions_changed',
    targetType: 'role',
    targetId: roleId,
    targetName: role?.name || `Role ${roleId}`,
    changes: { added, removed },
  });

  // Invalidate caches
  invalidateRoleCache(roleId);
  await invalidateUsersCacheByRole(roleId);
}

/**
 * Add a single permission to a role
 * 
 * @param roleId - The role ID to add permission to
 * @param permission - The permission string to add
 * @param adminId - The admin user ID making the change (for audit)
 */
export async function addRolePermission(
  roleId: number,
  permission: string,
  adminId: number
): Promise<void> {
  // Get role name for audit
  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', roleId)
    .single();

  const { error } = await supabase
    .from('role_permissions')
    .upsert({
      role_id: roleId,
      permission,
    }, {
      onConflict: 'role_id,permission',
    });

  if (error) {
    throw new Error(`Failed to add role permission: ${error.message}`);
  }

  // Log audit entry
  await logAuditEntry({
    adminUserId: adminId,
    actionType: 'role_permissions_changed',
    targetType: 'role',
    targetId: roleId,
    targetName: role?.name || `Role ${roleId}`,
    changes: { added: [permission] },
  });

  // Invalidate caches
  invalidateRoleCache(roleId);
  await invalidateUsersCacheByRole(roleId);
}

/**
 * Remove a single permission from a role
 * 
 * @param roleId - The role ID to remove permission from
 * @param permission - The permission string to remove
 * @param adminId - The admin user ID making the change (for audit)
 */
export async function removeRolePermission(
  roleId: number,
  permission: string,
  adminId: number
): Promise<void> {
  // Get role name for audit
  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', roleId)
    .single();

  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)
    .eq('permission', permission);

  if (error) {
    throw new Error(`Failed to remove role permission: ${error.message}`);
  }

  // Log audit entry
  await logAuditEntry({
    adminUserId: adminId,
    actionType: 'role_permissions_changed',
    targetType: 'role',
    targetId: roleId,
    targetName: role?.name || `Role ${roleId}`,
    changes: { removed: [permission] },
  });

  // Invalidate caches
  invalidateRoleCache(roleId);
  await invalidateUsersCacheByRole(roleId);
}

/**
 * Grant a permission to a specific user (override)
 * 
 * @param userId - The user ID to grant permission to
 * @param permission - The permission string to grant
 * @param adminId - The admin user ID making the change (for audit)
 * @see Requirements 3.2
 */
export async function grantUserPermission(
  userId: number,
  permission: string,
  adminId: number
): Promise<void> {
  // Get user name for audit
  const { data: user } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .single();

  const { error } = await supabase
    .from('user_permissions')
    .upsert({
      user_id: userId,
      permission,
      is_granted: true,
    }, {
      onConflict: 'user_id,permission',
    });

  if (error) {
    throw new Error(`Failed to grant user permission: ${error.message}`);
  }

  // Log audit entry
  await logAuditEntry({
    adminUserId: adminId,
    actionType: 'user_permissions_changed',
    targetType: 'user',
    targetId: userId,
    targetName: user?.username || `User ${userId}`,
    changes: { added: [permission] },
  });

  // Invalidate user cache
  invalidateUserCache(userId);
}

/**
 * Revoke a permission from a specific user (override)
 * 
 * @param userId - The user ID to revoke permission from
 * @param permission - The permission string to revoke
 * @param adminId - The admin user ID making the change (for audit)
 * @see Requirements 3.3
 */
export async function revokeUserPermission(
  userId: number,
  permission: string,
  adminId: number
): Promise<void> {
  // Get user name for audit
  const { data: user } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .single();

  const { error } = await supabase
    .from('user_permissions')
    .upsert({
      user_id: userId,
      permission,
      is_granted: false,
    }, {
      onConflict: 'user_id,permission',
    });

  if (error) {
    throw new Error(`Failed to revoke user permission: ${error.message}`);
  }

  // Log audit entry
  await logAuditEntry({
    adminUserId: adminId,
    actionType: 'user_permissions_changed',
    targetType: 'user',
    targetId: userId,
    targetName: user?.username || `User ${userId}`,
    changes: { removed: [permission] },
  });

  // Invalidate user cache
  invalidateUserCache(userId);
}

/**
 * Clear all permission overrides for a user
 * 
 * @param userId - The user ID to clear overrides for
 * @param adminId - The admin user ID making the change (for audit)
 */
export async function clearUserOverrides(
  userId: number,
  adminId: number
): Promise<void> {
  // Get current overrides for audit
  const currentOverrides = await getUserOverrides(userId);
  
  // Get user name for audit
  const { data: user } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .single();

  const { error } = await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to clear user overrides: ${error.message}`);
  }

  // Log audit entry
  await logAuditEntry({
    adminUserId: adminId,
    actionType: 'user_permissions_changed',
    targetType: 'user',
    targetId: userId,
    targetName: user?.username || `User ${userId}`,
    changes: {
      removed: [...currentOverrides.granted, ...currentOverrides.revoked],
      before: { granted: currentOverrides.granted, revoked: currentOverrides.revoked },
      after: { granted: [], revoked: [] },
    },
  });

  // Invalidate user cache
  invalidateUserCache(userId);
}

/**
 * Check if a user has a specific permission
 * 
 * @param userId - The user ID to check
 * @param permission - The permission string to check for
 * @returns true if user has the permission, false otherwise
 * @see Requirements 3.5
 */
export async function hasPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  const effectivePermissions = await getEffectivePermissions(userId);
  return effectivePermissions.effective.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 * 
 * @param userId - The user ID to check
 * @param permissions - Array of permission strings to check for
 * @returns true if user has at least one of the permissions, false otherwise
 */
export async function hasAnyPermission(
  userId: number,
  permissions: string[]
): Promise<boolean> {
  const effectivePermissions = await getEffectivePermissions(userId);
  return permissions.some(p => effectivePermissions.effective.includes(p));
}

/**
 * Check if a user has all of the specified permissions
 * 
 * @param userId - The user ID to check
 * @param permissions - Array of permission strings to check for
 * @returns true if user has all of the permissions, false otherwise
 */
export async function hasAllPermissions(
  userId: number,
  permissions: string[]
): Promise<boolean> {
  const effectivePermissions = await getEffectivePermissions(userId);
  return permissions.every(p => effectivePermissions.effective.includes(p));
}

/**
 * Invalidate the cache for a specific user
 * 
 * @param userId - The user ID to invalidate cache for
 */
export function invalidateUserCache(userId: number): void {
  userPermissionsCache.delete(userId);
}

/**
 * Invalidate the cache for a specific role
 * 
 * @param roleId - The role ID to invalidate cache for
 */
export function invalidateRoleCache(roleId: number): void {
  rolePermissionsCache.delete(roleId);
}

/**
 * Invalidate cache for all users with a specific role
 * Called when role permissions change
 * 
 * @param roleId - The role ID whose users should have cache invalidated
 */
async function invalidateUsersCacheByRole(roleId: number): Promise<void> {
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('role_id', roleId);

  if (users) {
    for (const user of users) {
      invalidateUserCache(user.id);
    }
  }
}

/**
 * Log an audit entry for permission changes
 * 
 * @param entry - The audit log entry to record
 */
async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
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
      console.error('Failed to log audit entry:', error);
    }
  } catch (err) {
    // Log error but don't throw - audit failures shouldn't break operations
    console.error('Failed to log audit entry:', err);
  }
}

/**
 * Clear all caches (useful for testing or manual cache invalidation)
 */
export function clearAllCaches(): void {
  userPermissionsCache.clear();
  rolePermissionsCache.clear();
}

/**
 * Calculate effective permissions from role permissions and user overrides
 * This is a pure function useful for testing Property 8
 * 
 * Formula: effective = (rolePermissions - userRevoked) + userGranted
 * 
 * @param rolePermissions - Permissions inherited from the role
 * @param userGranted - Permissions explicitly granted to the user
 * @param userRevoked - Permissions explicitly revoked from the user
 * @returns Array of effective permission strings
 * @see Requirements 3.5
 */
export function calculateEffectivePermissions(
  rolePermissions: string[],
  userGranted: string[],
  userRevoked: string[]
): string[] {
  const effectiveSet = new Set<string>();
  
  // Add role permissions that are not revoked
  for (const permission of rolePermissions) {
    if (!userRevoked.includes(permission)) {
      effectiveSet.add(permission);
    }
  }
  
  // Add granted permissions
  for (const permission of userGranted) {
    effectiveSet.add(permission);
  }

  return Array.from(effectiveSet);
}

// Export the PermissionsService as a namespace for cleaner imports
export const PermissionsService = {
  getEffectivePermissions,
  getRolePermissions,
  getUserOverrides,
  setRolePermissions,
  addRolePermission,
  removeRolePermission,
  grantUserPermission,
  revokeUserPermission,
  clearUserOverrides,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  invalidateUserCache,
  invalidateRoleCache,
  clearAllCaches,
  calculateEffectivePermissions,
};

export default PermissionsService;
