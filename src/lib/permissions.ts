import type { User } from '@/types/database'
import type { AuthUser } from '@/types/auth'
import type { AuthenticatedUser } from './auth-middleware'
import type { PermissionDefinition } from '@/types/permissions'

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
  
  // Permission management (new for dynamic permissions system)
  ADMIN_MANAGE_PERMISSIONS: 'admin:manage_permissions',
  
  // Section access permissions
  SECTIONS_DASHBOARD: 'sections:dashboard',
  SECTIONS_TOOLS: 'sections:tools',
  SECTIONS_CONSUMABLES: 'sections:consumables',
  SECTIONS_MY_LOANS: 'sections:my_loans',
  SECTIONS_MY_SPACES: 'sections:my_spaces',
  SECTIONS_PROFILE: 'sections:profile',
  
  // Admin section permissions
  ADMIN_MANAGE_ELECTRONICS: 'admin:manage_electronics',
  ADMIN_MANAGE_CLASSROOMS: 'admin:manage_classrooms',
  ADMIN_MANAGE_ASSIGNMENTS: 'admin:manage_assignments',
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
  
  // Section access permissions (user sections)
  PERMISSIONS.SECTIONS_DASHBOARD,
  PERMISSIONS.SECTIONS_TOOLS,
  PERMISSIONS.SECTIONS_CONSUMABLES,
  PERMISSIONS.SECTIONS_MY_LOANS,
  PERMISSIONS.SECTIONS_MY_SPACES,
  PERMISSIONS.SECTIONS_PROFILE,
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
    
    // Permission management (new for dynamic permissions system)
    PERMISSIONS.ADMIN_MANAGE_PERMISSIONS,
    
    // Admin section permissions
    PERMISSIONS.ADMIN_MANAGE_ELECTRONICS,
    PERMISSIONS.ADMIN_MANAGE_CLASSROOMS,
    PERMISSIONS.ADMIN_MANAGE_ASSIGNMENTS,
  ],
}

/**
 * Permission definitions with metadata for display in admin UI
 * Organized by category as per Requirements 2.6
 * @see Requirements 8.1, 8.4 - Maintain compatibility with existing permissions
 */
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Tools category
  { key: PERMISSIONS.TOOLS_VIEW, name: 'Ver herramientas', description: 'Ver catálogo de herramientas', category: 'tools' },
  { key: PERMISSIONS.TOOLS_CREATE, name: 'Crear herramientas', description: 'Agregar nuevas herramientas al inventario', category: 'tools' },
  { key: PERMISSIONS.TOOLS_UPDATE, name: 'Actualizar herramientas', description: 'Modificar información de herramientas existentes', category: 'tools' },
  { key: PERMISSIONS.TOOLS_DELETE, name: 'Eliminar herramientas', description: 'Eliminar herramientas del inventario', category: 'tools' },
  { key: PERMISSIONS.TOOLS_ADJUST_STATUS, name: 'Ajustar estado', description: 'Cambiar el estado de disponibilidad de herramientas', category: 'tools' },
  { key: PERMISSIONS.TOOLS_GENERATE_QR, name: 'Generar QR', description: 'Generar códigos QR para herramientas', category: 'tools' },
  
  // Loans category
  { key: PERMISSIONS.LOANS_VIEW_OWN, name: 'Ver préstamos propios', description: 'Ver historial de préstamos propios', category: 'loans' },
  { key: PERMISSIONS.LOANS_VIEW_ALL, name: 'Ver todos los préstamos', description: 'Ver historial de préstamos de todos los usuarios', category: 'loans' },
  { key: PERMISSIONS.LOANS_CREATE, name: 'Crear préstamos', description: 'Solicitar préstamos de herramientas', category: 'loans' },
  { key: PERMISSIONS.LOANS_RETURN_OWN, name: 'Devolver propios', description: 'Devolver herramientas prestadas propias', category: 'loans' },
  { key: PERMISSIONS.LOANS_RETURN_ANY, name: 'Devolver cualquiera', description: 'Devolver herramientas de cualquier usuario', category: 'loans' },
  { key: PERMISSIONS.LOANS_EXTEND, name: 'Extender préstamos', description: 'Extender la duración de préstamos', category: 'loans' },
  { key: PERMISSIONS.LOANS_OVERRIDE, name: 'Sobrescribir préstamos', description: 'Sobrescribir reglas de préstamos', category: 'loans' },
  
  // Consumables category
  { key: PERMISSIONS.CONSUMABLES_VIEW, name: 'Ver consumibles', description: 'Ver catálogo de consumibles', category: 'consumables' },
  { key: PERMISSIONS.CONSUMABLES_REQUEST, name: 'Solicitar consumibles', description: 'Solicitar consumibles del inventario', category: 'consumables' },
  { key: PERMISSIONS.CONSUMABLES_MANAGE_STOCK, name: 'Gestionar stock', description: 'Administrar inventario de consumibles', category: 'consumables' },
  { key: PERMISSIONS.CONSUMABLES_FULFILL_REQUESTS, name: 'Cumplir solicitudes', description: 'Aprobar y entregar solicitudes de consumibles', category: 'consumables' },
  
  // Admin category
  { key: PERMISSIONS.ADMIN_VIEW_DASHBOARD, name: 'Ver dashboard admin', description: 'Acceder al panel de administración', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_ITEMS, name: 'Gestionar items', description: 'Administrar items del sistema', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_TOOLS, name: 'Gestionar herramientas', description: 'Administrar herramientas desde panel admin', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, name: 'Gestionar consumibles', description: 'Administrar consumibles desde panel admin', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_LOANS, name: 'Gestionar préstamos', description: 'Administrar préstamos desde panel admin', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_CATEGORIES, name: 'Gestionar categorías', description: 'Administrar categorías del sistema', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, name: 'Gestionar permisos', description: 'Administrar roles y permisos del sistema', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_ELECTRONICS, name: 'Gestionar electrónicos', description: 'Administrar equipos electrónicos', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_CLASSROOMS, name: 'Gestionar aulas', description: 'Administrar aulas y espacios', category: 'admin' },
  { key: PERMISSIONS.ADMIN_MANAGE_ASSIGNMENTS, name: 'Gestionar asignaciones', description: 'Administrar asignaciones de recursos', category: 'admin' },
  
  // Users category
  { key: PERMISSIONS.USERS_VIEW_OWN, name: 'Ver perfil propio', description: 'Ver información del perfil propio', category: 'users' },
  { key: PERMISSIONS.USERS_VIEW_ALL, name: 'Ver todos los usuarios', description: 'Ver información de todos los usuarios', category: 'users' },
  { key: PERMISSIONS.USERS_CREATE, name: 'Crear usuarios', description: 'Crear nuevos usuarios en el sistema', category: 'users' },
  { key: PERMISSIONS.USERS_UPDATE_OWN, name: 'Actualizar perfil propio', description: 'Modificar información del perfil propio', category: 'users' },
  { key: PERMISSIONS.USERS_UPDATE_ANY, name: 'Actualizar cualquier usuario', description: 'Modificar información de cualquier usuario', category: 'users' },
  { key: PERMISSIONS.USERS_DELETE, name: 'Eliminar usuarios', description: 'Eliminar usuarios del sistema', category: 'users' },
  { key: PERMISSIONS.USERS_MANAGE, name: 'Gestionar usuarios', description: 'Administrar usuarios del sistema', category: 'users' },
  
  // Notifications category
  { key: PERMISSIONS.NOTIFICATIONS_VIEW_OWN, name: 'Ver notificaciones propias', description: 'Ver notificaciones propias', category: 'notifications' },
  { key: PERMISSIONS.NOTIFICATIONS_VIEW_ALL, name: 'Ver todas las notificaciones', description: 'Ver notificaciones de todos los usuarios', category: 'notifications' },
  { key: PERMISSIONS.NOTIFICATIONS_CREATE, name: 'Crear notificaciones', description: 'Crear nuevas notificaciones', category: 'notifications' },
  { key: PERMISSIONS.NOTIFICATIONS_SEND, name: 'Enviar notificaciones', description: 'Enviar notificaciones a usuarios', category: 'notifications' },
  
  // Audit category
  { key: PERMISSIONS.AUDIT_VIEW, name: 'Ver auditoría', description: 'Ver registros de auditoría del sistema', category: 'audit' },
  
  // Reports category
  { key: PERMISSIONS.REPORTS_VIEW, name: 'Ver reportes', description: 'Ver reportes del sistema', category: 'reports' },
  { key: PERMISSIONS.REPORTS_EXPORT, name: 'Exportar reportes', description: 'Exportar reportes a diferentes formatos', category: 'reports' },
  
  // System category
  { key: PERMISSIONS.SYSTEM_CONFIGURE, name: 'Configurar sistema', description: 'Configurar parámetros del sistema', category: 'system' },
  { key: PERMISSIONS.SYSTEM_BACKUP, name: 'Respaldo del sistema', description: 'Crear y restaurar respaldos del sistema', category: 'system' },
  { key: PERMISSIONS.SYSTEM_MAINTENANCE, name: 'Mantenimiento', description: 'Realizar tareas de mantenimiento del sistema', category: 'system' },
  
  // Section access permissions (not typically shown in matrix, but defined for completeness)
  { key: PERMISSIONS.SECTIONS_DASHBOARD, name: 'Acceso a Dashboard', description: 'Acceder a la página de dashboard', category: 'system' },
  { key: PERMISSIONS.SECTIONS_TOOLS, name: 'Acceso a Herramientas', description: 'Acceder a la sección de herramientas', category: 'system' },
  { key: PERMISSIONS.SECTIONS_CONSUMABLES, name: 'Acceso a Consumibles', description: 'Acceder a la sección de consumibles', category: 'system' },
  { key: PERMISSIONS.SECTIONS_MY_LOANS, name: 'Acceso a Mis Préstamos', description: 'Acceder a la sección de mis préstamos', category: 'system' },
  { key: PERMISSIONS.SECTIONS_MY_SPACES, name: 'Acceso a Mis Espacios', description: 'Acceder a la sección de mis espacios', category: 'system' },
  { key: PERMISSIONS.SECTIONS_PROFILE, name: 'Acceso a Perfil', description: 'Acceder a la página de perfil', category: 'system' },
]

// Permission checking functions
export function hasPermission(user: PermissionUser, permission: Permission): boolean {
  if (!user) return false
  
  // Admin users always have all permissions
  if (user.role === 'admin') return true
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  return rolePermissions.includes(permission)
}

export function hasAnyPermission(user: PermissionUser, permissions: Permission[]): boolean {
  if (!user) return false
  
  // Admin users always have all permissions
  if (user.role === 'admin') return true
  
  return permissions.some(permission => hasPermission(user, permission))
}

export function hasAllPermissions(user: PermissionUser, permissions: Permission[]): boolean {
  if (!user) return false
  
  // Admin users always have all permissions
  if (user.role === 'admin') return true
  
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