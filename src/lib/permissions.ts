import type { User } from '@/types/database'
import type { AuthUser } from '@/types/auth'
import type { AuthenticatedUser } from './auth-middleware'

// Union type for all user types that can be used for permission checking
type PermissionUser = AuthUser | User | AuthenticatedUser | null

// Permission definitions
export const PERMISSIONS = {
  // Tool management
  TOOLS_VIEW: 'tools:view',
  TOOLS_CREATE: 'tools:create',
  TOOLS_UPDATE: 'tools:update',
  TOOLS_DELETE: 'tools:delete',
  TOOLS_ADJUST_STATUS: 'tools:adjust_status',
  TOOLS_GENERATE_QR: 'tools:generate_qr',
  
  // Loan management
  LOANS_VIEW_OWN: 'loans:view_own',
  LOANS_VIEW_ALL: 'loans:view_all',
  LOANS_CREATE: 'loans:create',
  LOANS_RETURN_OWN: 'loans:return_own',
  LOANS_RETURN_ANY: 'loans:return_any',
  LOANS_EXTEND: 'loans:extend',
  LOANS_OVERRIDE: 'loans:override',
  
  // Consumable management
  CONSUMABLES_VIEW: 'consumables:view',
  CONSUMABLES_REQUEST: 'consumables:request',
  CONSUMABLES_MANAGE_STOCK: 'consumables:manage_stock',
  CONSUMABLES_FULFILL_REQUESTS: 'consumables:fulfill_requests',
  
  // Admin permissions
  ADMIN_VIEW_DASHBOARD: 'admin:view_dashboard',
  ADMIN_MANAGE_ITEMS: 'admin:manage_items',
  ADMIN_MANAGE_TOOLS: 'admin:manage_tools',
  ADMIN_MANAGE_CONSUMABLES: 'admin:manage_consumables',
  ADMIN_MANAGE_LOANS: 'admin:manage_loans',
  ADMIN_MANAGE_CATEGORIES: 'admin:manage_categories',
  
  // User management
  USERS_VIEW_OWN: 'users:view_own',
  USERS_VIEW_ALL: 'users:view_all',
  USERS_CREATE: 'users:create',
  USERS_UPDATE_OWN: 'users:update_own',
  USERS_UPDATE_ANY: 'users:update_any',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage', // Alias for UPDATE_ANY + DELETE
  
  // Notification management
  NOTIFICATIONS_VIEW_OWN: 'notifications:view_own',
  NOTIFICATIONS_VIEW_ALL: 'notifications:view_all',
  NOTIFICATIONS_CREATE: 'notifications:create',
  NOTIFICATIONS_SEND: 'notifications:send',
  
  // Audit and reporting
  AUDIT_VIEW: 'audit:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // System administration
  SYSTEM_CONFIGURE: 'system:configure',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_MAINTENANCE: 'system:maintenance',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Define user permissions first
const USER_PERMISSIONS: Permission[] = [
  // Tool permissions
  PERMISSIONS.TOOLS_VIEW,
  
  // Loan permissions
  PERMISSIONS.LOANS_VIEW_OWN,
  PERMISSIONS.LOANS_CREATE,
  PERMISSIONS.LOANS_RETURN_OWN,
  
  // Consumable permissions
  PERMISSIONS.CONSUMABLES_VIEW,
  PERMISSIONS.CONSUMABLES_REQUEST,
  
  // User permissions
  PERMISSIONS.USERS_VIEW_OWN,
  PERMISSIONS.USERS_UPDATE_OWN,
  
  // Notification permissions
  PERMISSIONS.NOTIFICATIONS_VIEW_OWN,
]

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  user: USER_PERMISSIONS,
  
  admin: [
    // All user permissions
    ...USER_PERMISSIONS,
    
    // Additional tool permissions
    PERMISSIONS.TOOLS_CREATE,
    PERMISSIONS.TOOLS_UPDATE,
    PERMISSIONS.TOOLS_DELETE,
    PERMISSIONS.TOOLS_ADJUST_STATUS,
    PERMISSIONS.TOOLS_GENERATE_QR,
    
    // Additional loan permissions
    PERMISSIONS.LOANS_VIEW_ALL,
    PERMISSIONS.LOANS_RETURN_ANY,
    PERMISSIONS.LOANS_EXTEND,
    PERMISSIONS.LOANS_OVERRIDE,
    
    // Additional consumable permissions
    PERMISSIONS.CONSUMABLES_MANAGE_STOCK,
    PERMISSIONS.CONSUMABLES_FULFILL_REQUESTS,
    
    // Additional user permissions
    PERMISSIONS.USERS_VIEW_ALL,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE_ANY,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_MANAGE,
    
    // Additional notification permissions
    PERMISSIONS.NOTIFICATIONS_VIEW_ALL,
    PERMISSIONS.NOTIFICATIONS_CREATE,
    PERMISSIONS.NOTIFICATIONS_SEND,
    
    // Audit and reporting permissions
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    
    // System administration permissions
    PERMISSIONS.SYSTEM_CONFIGURE,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_MAINTENANCE,
    
    // Admin permissions
    PERMISSIONS.ADMIN_VIEW_DASHBOARD,
    PERMISSIONS.ADMIN_MANAGE_ITEMS,
    PERMISSIONS.ADMIN_MANAGE_TOOLS,
    PERMISSIONS.ADMIN_MANAGE_CONSUMABLES,
    PERMISSIONS.ADMIN_MANAGE_LOANS,
    PERMISSIONS.ADMIN_MANAGE_CATEGORIES,
  ],
}

// Permission checking functions
export function hasPermission(user: PermissionUser, permission: Permission): boolean {
  if (!user) return false
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  return rolePermissions.includes(permission)
}

export function hasAnyPermission(user: PermissionUser, permissions: Permission[]): boolean {
  if (!user) return false
  
  return permissions.some(permission => hasPermission(user, permission))
}

export function hasAllPermissions(user: PermissionUser, permissions: Permission[]): boolean {
  if (!user) return false
  
  return permissions.every(permission => hasPermission(user, permission))
}

export function canViewOwnResource(user: PermissionUser, resourceUserId: number): boolean {
  if (!user) return false
  
  // Admins can view any resource
  if (user.role === 'admin') return true
  
  // Users can only view their own resources
  return user.id === resourceUserId
}

export function canModifyOwnResource(user: PermissionUser, resourceUserId: number): boolean {
  if (!user) return false
  
  // Admins can modify any resource
  if (user.role === 'admin') return true
  
  // Users can only modify their own resources
  return user.id === resourceUserId
}

// Specific business logic permissions
export function canLoanTool(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.LOANS_CREATE)
}

export function canReturnTool(user: PermissionUser, loanUserId?: number): boolean {
  if (!user) return false
  
  // Admins can return any tool
  if (hasPermission(user, PERMISSIONS.LOANS_RETURN_ANY)) return true
  
  // Users can only return their own tools
  if (loanUserId && hasPermission(user, PERMISSIONS.LOANS_RETURN_OWN)) {
    return user.id === loanUserId
  }
  
  return false
}

export function canAdjustToolStatus(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.TOOLS_ADJUST_STATUS)
}

export function canManageStock(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.CONSUMABLES_MANAGE_STOCK)
}

export function canViewAuditLogs(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.AUDIT_VIEW)
}

export function canCreateUsers(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.USERS_CREATE)
}

export function canViewAllUsers(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.USERS_VIEW_ALL)
}

export function canViewAllLoans(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.LOANS_VIEW_ALL)
}

export function canGenerateReports(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.REPORTS_VIEW)
}

export function canConfigureSystem(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.SYSTEM_CONFIGURE)
}

export function canManageCategories(user: PermissionUser): boolean {
  return hasPermission(user, PERMISSIONS.ADMIN_MANAGE_CATEGORIES)
}

// Permission middleware for API routes
export function requirePermission(user: PermissionUser, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

export function requireAnyPermission(user: PermissionUser, permissions: Permission[]): void {
  if (!hasAnyPermission(user, permissions)) {
    throw new Error(`Permission denied: requires one of ${permissions.join(', ')}`)
  }
}

export function requireAllPermissions(user: PermissionUser, permissions: Permission[]): void {
  if (!hasAllPermissions(user, permissions)) {
    throw new Error(`Permission denied: requires all of ${permissions.join(', ')}`)
  }
}

// Resource ownership validation
export function requireResourceOwnership(user: PermissionUser, resourceUserId: number): void {
  if (!canModifyOwnResource(user, resourceUserId)) {
    throw new Error('Permission denied: can only modify own resources')
  }
}