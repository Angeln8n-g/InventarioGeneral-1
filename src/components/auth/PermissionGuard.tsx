import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { Permission } from '@/lib/permissions'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  resourceUserId?: number
  requireOwnership?: boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  resourceUserId,
  requireOwnership = false,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canModifyOwnResource,
  } = usePermissions()

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>
    }
  }

  // Check resource ownership
  if (requireOwnership && resourceUserId !== undefined) {
    if (!canModifyOwnResource(resourceUserId)) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Specific permission components for common use cases
interface ToolManagementGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ToolManagementGuard: React.FC<ToolManagementGuardProps> = ({
  children,
  fallback = null,
}) => {
  return (
    <PermissionGuard
      permissions={['tools:create', 'tools:update', 'tools:delete', 'tools:adjust_status']}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

interface AdminOnlyGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AdminOnlyGuard: React.FC<AdminOnlyGuardProps> = ({
  children,
  fallback = null,
}) => {
  const { isAdmin } = usePermissions()
  
  if (!isAdmin) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface LoanManagementGuardProps {
  children: React.ReactNode
  loanUserId?: number
  fallback?: React.ReactNode
}

export const LoanManagementGuard: React.FC<LoanManagementGuardProps> = ({
  children,
  loanUserId,
  fallback = null,
}) => {
  const { canReturnTool } = usePermissions()
  
  if (!canReturnTool(loanUserId)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface StockManagementGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const StockManagementGuard: React.FC<StockManagementGuardProps> = ({
  children,
  fallback = null,
}) => {
  return (
    <PermissionGuard
      permission="consumables:manage_stock"
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

interface AuditViewGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AuditViewGuard: React.FC<AuditViewGuardProps> = ({
  children,
  fallback = null,
}) => {
  return (
    <PermissionGuard
      permission="audit:view"
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

interface UserManagementGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const UserManagementGuard: React.FC<UserManagementGuardProps> = ({
  children,
  fallback = null,
}) => {
  return (
    <PermissionGuard
      permissions={['users:create', 'users:update_any', 'users:delete', 'users:view_all']}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}