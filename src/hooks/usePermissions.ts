import { useAuth } from './useAuth'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canViewOwnResource,
  canModifyOwnResource,
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
  type Permission,
} from '@/lib/permissions'

export const usePermissions = () => {
  const { user } = useAuth()

  return {
    // Core permission checking
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    
    // Resource ownership
    canViewOwnResource: (resourceUserId: number) => canViewOwnResource(user, resourceUserId),
    canModifyOwnResource: (resourceUserId: number) => canModifyOwnResource(user, resourceUserId),
    
    // Business logic permissions
    canLoanTool: () => canLoanTool(user),
    canReturnTool: (loanUserId?: number) => canReturnTool(user, loanUserId),
    canAdjustToolStatus: () => canAdjustToolStatus(user),
    canManageStock: () => canManageStock(user),
    canViewAuditLogs: () => canViewAuditLogs(user),
    canCreateUsers: () => canCreateUsers(user),
    canViewAllUsers: () => canViewAllUsers(user),
    canViewAllLoans: () => canViewAllLoans(user),
    canGenerateReports: () => canGenerateReports(user),
    canConfigureSystem: () => canConfigureSystem(user),
    
    // Role checks
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
  }
}

// Hook for checking specific permissions with loading state
export const usePermissionCheck = (permission: Permission) => {
  const { user, isLoading } = useAuth()
  
  return {
    hasPermission: hasPermission(user, permission),
    isLoading,
  }
}

// Hook for checking multiple permissions
export const usePermissionChecks = (permissions: Permission[]) => {
  const { user, isLoading } = useAuth()
  
  const permissionResults = permissions.reduce((acc, permission) => {
    acc[permission] = hasPermission(user, permission)
    return acc
  }, {} as Record<Permission, boolean>)
  
  return {
    permissions: permissionResults,
    hasAnyPermission: hasAnyPermission(user, permissions),
    hasAllPermissions: hasAllPermissions(user, permissions),
    isLoading,
  }
}