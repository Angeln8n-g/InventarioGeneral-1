/**
 * usePermissions Hook - Dynamic Permissions Support
 * 
 * This hook provides permission checking functionality that supports both:
 * - Dynamic permissions from the database (via PermissionsContext)
 * - Fallback to hardcoded permissions when context is not available
 * 
 * @see Requirements 8.1 - Maintain compatibility with hasPermission, hasAnyPermission, hasAllPermissions
 * @see Requirements 8.2 - Maintain compatibility with existing components (RoleGuard, PermissionGuard, usePermissions)
 */

import { useAuth } from './useAuth'
import { usePermissionsContext, PermissionsContextValue } from '@/contexts/PermissionsContext'
import {
  hasPermission as hasPermissionStatic,
  hasAnyPermission as hasAnyPermissionStatic,
  hasAllPermissions as hasAllPermissionsStatic,
  canViewOwnResource,
  canModifyOwnResource,
  canLoanTool as canLoanToolStatic,
  canReturnTool as canReturnToolStatic,
  canAdjustToolStatus as canAdjustToolStatusStatic,
  canManageStock as canManageStockStatic,
  canViewAuditLogs as canViewAuditLogsStatic,
  canCreateUsers as canCreateUsersStatic,
  canViewAllUsers as canViewAllUsersStatic,
  canViewAllLoans as canViewAllLoansStatic,
  canGenerateReports as canGenerateReportsStatic,
  canConfigureSystem as canConfigureSystemStatic,
  canManageCategories as canManageCategoriesStatic,
  PERMISSIONS,
  type Permission,
} from '@/lib/permissions'
import { useContext, useMemo, useCallback } from 'react'
import PermissionsContext from '@/contexts/PermissionsContext'

/**
 * Check if the PermissionsContext is available and has loaded permissions
 * This allows the hook to work both with and without the PermissionsProvider
 */
function usePermissionsContextSafe(): PermissionsContextValue | null {
  try {
    const context = useContext(PermissionsContext)
    // Check if context has meaningful data (not just default values)
    if (context && context.permissions.length > 0) {
      return context
    }
    // If context exists but is loading, still return it so we can use isLoading
    if (context && context.isLoading) {
      return context
    }
    return null
  } catch {
    return null
  }
}

/**
 * Main usePermissions hook
 * 
 * Provides permission checking with support for:
 * - Dynamic permissions from database (when PermissionsProvider is available)
 * - Fallback to static/hardcoded permissions (for backward compatibility)
 * 
 * @see Requirements 8.1 - Maintains hasPermission, hasAnyPermission, hasAllPermissions API
 * @see Requirements 8.2 - Maintains compatibility with existing components
 */
export const usePermissions = () => {
  const { user } = useAuth()
  const dynamicContext = usePermissionsContextSafe()
  
  // Determine if we should use dynamic permissions
  const useDynamic = dynamicContext !== null && !dynamicContext.isLoading && dynamicContext.permissions.length > 0
  
  /**
   * Check if user has a specific permission
   * Uses dynamic permissions if available, falls back to static
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.hasPermission(permission)
    }
    return hasPermissionStatic(user, permission)
  }, [useDynamic, dynamicContext, user])
  
  /**
   * Check if user has any of the specified permissions
   * Uses dynamic permissions if available, falls back to static
   */
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.hasAnyPermission(permissions)
    }
    return hasAnyPermissionStatic(user, permissions)
  }, [useDynamic, dynamicContext, user])
  
  /**
   * Check if user has all of the specified permissions
   * Uses dynamic permissions if available, falls back to static
   */
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.hasAllPermissions(permissions)
    }
    return hasAllPermissionsStatic(user, permissions)
  }, [useDynamic, dynamicContext, user])
  
  /**
   * Business logic permission helpers
   * These use the dynamic hasPermission when available
   */
  const canLoanTool = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.LOANS_CREATE)
    }
    return canLoanToolStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canReturnTool = useCallback((loanUserId?: number): boolean => {
    if (useDynamic) {
      // Admins can return any tool
      if (hasPermission(PERMISSIONS.LOANS_RETURN_ANY)) return true
      // Users can only return their own tools
      if (loanUserId && hasPermission(PERMISSIONS.LOANS_RETURN_OWN)) {
        return user?.id === loanUserId
      }
      return false
    }
    return canReturnToolStatic(user, loanUserId)
  }, [useDynamic, hasPermission, user])
  
  const canAdjustToolStatus = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.TOOLS_ADJUST_STATUS)
    }
    return canAdjustToolStatusStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canManageStock = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.CONSUMABLES_MANAGE_STOCK)
    }
    return canManageStockStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canViewAuditLogs = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.AUDIT_VIEW)
    }
    return canViewAuditLogsStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canCreateUsers = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.USERS_CREATE)
    }
    return canCreateUsersStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canViewAllUsers = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.USERS_VIEW_ALL)
    }
    return canViewAllUsersStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canViewAllLoans = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.LOANS_VIEW_ALL)
    }
    return canViewAllLoansStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canGenerateReports = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.REPORTS_VIEW)
    }
    return canGenerateReportsStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canConfigureSystem = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.SYSTEM_CONFIGURE)
    }
    return canConfigureSystemStatic(user)
  }, [useDynamic, hasPermission, user])
  
  const canManageCategories = useCallback((): boolean => {
    if (useDynamic) {
      return hasPermission(PERMISSIONS.ADMIN_MANAGE_CATEGORIES)
    }
    return canManageCategoriesStatic(user)
  }, [useDynamic, hasPermission, user])
  
  /**
   * Determine admin status
   * Uses dynamic context role if available, falls back to user.role
   */
  const isAdmin = useMemo((): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.isAdmin
    }
    return user?.role === 'admin'
  }, [useDynamic, dynamicContext, user?.role])
  
  /**
   * Determine user role status
   */
  const isUser = useMemo((): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.userRole === 'user'
    }
    return user?.role === 'user'
  }, [useDynamic, dynamicContext, user?.role])
  
  return {
    // Core permission checking - maintains existing API
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Resource ownership - these don't need dynamic support as they check user.id
    canViewOwnResource: (resourceUserId: number) => canViewOwnResource(user, resourceUserId),
    canModifyOwnResource: (resourceUserId: number) => canModifyOwnResource(user, resourceUserId),
    
    // Business logic permissions - now support dynamic permissions
    canLoanTool,
    canReturnTool,
    canAdjustToolStatus,
    canManageStock,
    canViewAuditLogs,
    canCreateUsers,
    canViewAllUsers,
    canViewAllLoans,
    canGenerateReports,
    canConfigureSystem,
    canManageCategories,
    
    // Role checks - now support dynamic permissions
    isAdmin,
    isUser,
    
    // New: expose loading state for components that need it
    isLoading: dynamicContext?.isLoading ?? false,
    
    // New: expose error state for components that need it
    error: dynamicContext?.error ?? null,
    
    // New: expose refresh function for manual cache invalidation
    refreshPermissions: dynamicContext?.refreshPermissions ?? (async () => {}),
    
    // New: expose whether dynamic permissions are being used
    isDynamic: useDynamic,
    
    // New: expose the user's role name
    userRole: useDynamic && dynamicContext ? dynamicContext.userRole : (user?.role ?? ''),
    
    // New: expose role permissions and overrides for advanced use cases
    rolePermissions: dynamicContext?.rolePermissions ?? [],
    userOverrides: dynamicContext?.userOverrides ?? { granted: [], revoked: [] },
  }
}

/**
 * Hook for checking specific permissions with loading state
 * Maintains backward compatibility while supporting dynamic permissions
 */
export const usePermissionCheck = (permission: Permission) => {
  const { user, isLoading: authLoading } = useAuth()
  const dynamicContext = usePermissionsContextSafe()
  
  const useDynamic = dynamicContext !== null && !dynamicContext.isLoading && dynamicContext.permissions.length > 0
  
  const hasPermissionResult = useMemo((): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.hasPermission(permission)
    }
    return hasPermissionStatic(user, permission)
  }, [useDynamic, dynamicContext, user, permission])
  
  const isLoading = authLoading || (dynamicContext?.isLoading ?? false)
  
  return {
    hasPermission: hasPermissionResult,
    isLoading,
  }
}

/**
 * Hook for checking multiple permissions
 * Maintains backward compatibility while supporting dynamic permissions
 */
export const usePermissionChecks = (permissions: Permission[]) => {
  const { user, isLoading: authLoading } = useAuth()
  const dynamicContext = usePermissionsContextSafe()
  
  const useDynamic = dynamicContext !== null && !dynamicContext.isLoading && dynamicContext.permissions.length > 0
  
  const permissionResults = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      if (useDynamic && dynamicContext) {
        acc[permission] = dynamicContext.hasPermission(permission)
      } else {
        acc[permission] = hasPermissionStatic(user, permission)
      }
      return acc
    }, {} as Record<Permission, boolean>)
  }, [permissions, useDynamic, dynamicContext, user])
  
  const hasAnyPermissionResult = useMemo((): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.hasAnyPermission(permissions)
    }
    return hasAnyPermissionStatic(user, permissions)
  }, [useDynamic, dynamicContext, user, permissions])
  
  const hasAllPermissionsResult = useMemo((): boolean => {
    if (useDynamic && dynamicContext) {
      return dynamicContext.hasAllPermissions(permissions)
    }
    return hasAllPermissionsStatic(user, permissions)
  }, [useDynamic, dynamicContext, user, permissions])
  
  const isLoading = authLoading || (dynamicContext?.isLoading ?? false)
  
  return {
    permissions: permissionResults,
    hasAnyPermission: hasAnyPermissionResult,
    hasAllPermissions: hasAllPermissionsResult,
    isLoading,
  }
}

// Re-export Permission type for convenience
export type { Permission }
