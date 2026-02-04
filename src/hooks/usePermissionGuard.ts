/**
 * usePermissionGuard Hook
 * 
 * A hook for checking if the current user has access to specific permissions.
 * Integrates with the existing PermissionsContext to determine module visibility.
 * 
 * @requirements 3.1, 3.2 - Role-Based UI Adaptation
 * @see Design Document: Permission Guard Hook
 */

import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import type { Permission } from '@/lib/permissions';

/**
 * Options for the usePermissionGuard hook
 */
export interface PermissionGuardOptions {
  /** Array of permissions to check */
  permissions: string[];
  /** If true, user must have ALL permissions. If false (default), user needs ANY permission */
  requireAll?: boolean;
}

/**
 * Result returned by the usePermissionGuard hook
 */
export interface PermissionGuardResult {
  /** Whether the user has access based on the permission check */
  hasAccess: boolean;
  /** Whether permissions are still being loaded */
  isLoading: boolean;
}

/**
 * Hook for checking if the current user has access to specific permissions.
 * 
 * Uses the existing PermissionsContext via usePermissions hook to check
 * if the user has the required permissions for a module or feature.
 * 
 * @param options - Configuration options for the permission check
 * @returns Object containing hasAccess boolean and isLoading state
 * 
 * @example
 * // Check if user has any of the permissions (default)
 * const { hasAccess, isLoading } = usePermissionGuard({
 *   permissions: ['dashboard:view_kpis', 'admin:view']
 * });
 * 
 * @example
 * // Check if user has ALL permissions
 * const { hasAccess, isLoading } = usePermissionGuard({
 *   permissions: ['users:manage', 'users:delete'],
 *   requireAll: true
 * });
 */
export function usePermissionGuard(options: PermissionGuardOptions): PermissionGuardResult {
  const { permissions, requireAll = false } = options;
  const { hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  const hasAccess = useMemo(() => {
    // If no permissions specified, deny access
    if (!permissions || permissions.length === 0) {
      return false;
    }

    // Cast to Permission[] for type compatibility
    const permissionList = permissions as Permission[];

    // Check permissions based on requireAll flag
    if (requireAll) {
      return hasAllPermissions(permissionList);
    }

    return hasAnyPermission(permissionList);
  }, [permissions, requireAll, hasAnyPermission, hasAllPermissions]);

  return {
    hasAccess,
    isLoading,
  };
}

export default usePermissionGuard;
