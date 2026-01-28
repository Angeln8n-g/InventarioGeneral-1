'use client'

/**
 * PermissionsMatrix Component
 * 
 * Displays a matrix of checkboxes organized by permission categories.
 * Supports visual differentiation for inherited, granted, and revoked permissions.
 * 
 * Features:
 * - Checkboxes organized by permission category
 * - Visual differentiation: inherited (gray), granted (green), revoked (red)
 * - Toggle permissions on/off
 * - Support for role editing (no inheritance) and user editing (with inheritance)
 * 
 * @see Requirements 2.1 - Show permissions matrix organized by category
 * @see Requirements 3.6 - Visual differentiation of permission states
 */

import React, { useMemo } from 'react'
import { 
  Check, 
  X, 
  Minus,
  Wrench,
  Package,
  ShoppingCart,
  Shield,
  Users,
  Bell,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import type { PermissionDefinition, PermissionCategory } from '@/types/permissions'

/**
 * Props for the PermissionsMatrix component
 * @see Design Document - PermissionsMatrixProps interface
 */
export interface PermissionsMatrixProps {
  /** All available permission definitions */
  permissions: PermissionDefinition[]
  /** Currently selected/granted permissions */
  selectedPermissions: string[]
  /** Permissions inherited from role (for user editing mode) */
  inheritedPermissions?: string[]
  /** Permissions explicitly revoked (for user editing mode) */
  revokedPermissions?: string[]
  /** Callback when a permission is toggled */
  onChange: (permission: string, enabled: boolean) => void
  /** Whether the matrix is disabled */
  disabled?: boolean
  /** Whether to show inheritance indicators (user editing mode) */
  showInheritance?: boolean
}

/**
 * Permission state for visual differentiation
 */
type PermissionState = 'inherited' | 'granted' | 'revoked' | 'none'

/**
 * Category metadata for display
 */
interface CategoryMeta {
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

/**
 * Category metadata mapping
 * @see Requirements 2.6 - Permission categories
 */
const CATEGORY_META: Record<PermissionCategory, CategoryMeta> = {
  tools: {
    name: 'Herramientas',
    icon: Wrench,
    description: 'Permisos relacionados con la gestión de herramientas'
  },
  loans: {
    name: 'Préstamos',
    icon: Package,
    description: 'Permisos relacionados con préstamos de herramientas'
  },
  consumables: {
    name: 'Consumibles',
    icon: ShoppingCart,
    description: 'Permisos relacionados con consumibles e inventario'
  },
  admin: {
    name: 'Administración',
    icon: Shield,
    description: 'Permisos de administración del sistema'
  },
  users: {
    name: 'Usuarios',
    icon: Users,
    description: 'Permisos de gestión de usuarios'
  },
  notifications: {
    name: 'Notificaciones',
    icon: Bell,
    description: 'Permisos de notificaciones'
  },
  audit: {
    name: 'Auditoría',
    icon: FileText,
    description: 'Permisos de auditoría y registros'
  },
  reports: {
    name: 'Reportes',
    icon: BarChart3,
    description: 'Permisos de reportes y estadísticas'
  },
  system: {
    name: 'Sistema',
    icon: Settings,
    description: 'Permisos de configuración del sistema'
  }
}

/**
 * Category display order
 */
const CATEGORY_ORDER: PermissionCategory[] = [
  'tools',
  'loans',
  'consumables',
  'admin',
  'users',
  'notifications',
  'audit',
  'reports',
  'system'
]

/**
 * PermissionsMatrix Component
 */
export default function PermissionsMatrix({
  permissions,
  selectedPermissions,
  inheritedPermissions = [],
  revokedPermissions = [],
  onChange,
  disabled = false,
  showInheritance = false
}: PermissionsMatrixProps) {
  // State for collapsed categories
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<PermissionCategory>>(new Set())

  /**
   * Group permissions by category
   */
  const permissionsByCategory = useMemo(() => {
    const grouped = new Map<PermissionCategory, PermissionDefinition[]>()
    
    // Initialize all categories
    CATEGORY_ORDER.forEach(category => {
      grouped.set(category, [])
    })
    
    // Group permissions
    permissions.forEach(permission => {
      const categoryPerms = grouped.get(permission.category) || []
      categoryPerms.push(permission)
      grouped.set(permission.category, categoryPerms)
    })
    
    // Filter out empty categories
    const result = new Map<PermissionCategory, PermissionDefinition[]>()
    grouped.forEach((perms, category) => {
      if (perms.length > 0) {
        result.set(category, perms)
      }
    })
    
    return result
  }, [permissions])

  /**
   * Determine the state of a permission
   * @see Requirements 3.6 - Visual differentiation
   */
  const getPermissionState = (permissionKey: string): PermissionState => {
    if (showInheritance) {
      // User editing mode - show inheritance states
      if (revokedPermissions.includes(permissionKey)) {
        return 'revoked'
      }
      if (selectedPermissions.includes(permissionKey) && !inheritedPermissions.includes(permissionKey)) {
        return 'granted'
      }
      if (inheritedPermissions.includes(permissionKey)) {
        return 'inherited'
      }
      return 'none'
    } else {
      // Role editing mode - simple selected/not selected
      return selectedPermissions.includes(permissionKey) ? 'granted' : 'none'
    }
  }

  /**
   * Check if a permission is currently enabled (checked)
   */
  const isPermissionEnabled = (permissionKey: string): boolean => {
    if (showInheritance) {
      // In user mode: enabled if inherited and not revoked, or explicitly granted
      const isInherited = inheritedPermissions.includes(permissionKey)
      const isRevoked = revokedPermissions.includes(permissionKey)
      const isGranted = selectedPermissions.includes(permissionKey)
      
      return (isInherited && !isRevoked) || isGranted
    } else {
      // In role mode: simply check if selected
      return selectedPermissions.includes(permissionKey)
    }
  }

  /**
   * Handle permission toggle
   */
  const handleToggle = (permissionKey: string) => {
    if (disabled) return
    
    const currentlyEnabled = isPermissionEnabled(permissionKey)
    onChange(permissionKey, !currentlyEnabled)
  }

  /**
   * Toggle category collapse state
   */
  const toggleCategory = (category: PermissionCategory) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  /**
   * Get count of enabled permissions in a category
   */
  const getCategoryEnabledCount = (categoryPerms: PermissionDefinition[]): number => {
    return categoryPerms.filter(p => isPermissionEnabled(p.key)).length
  }

  /**
   * Toggle all permissions in a category
   */
  const toggleAllInCategory = (categoryPerms: PermissionDefinition[], enable: boolean) => {
    if (disabled) return
    
    categoryPerms.forEach(permission => {
      const currentlyEnabled = isPermissionEnabled(permission.key)
      if (currentlyEnabled !== enable) {
        onChange(permission.key, enable)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Legend for inheritance mode */}
      {showInheritance && (
        <div className="flex flex-wrap gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <Minus className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark">
              Heredado del rol
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark">
              Agregado al usuario
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-3 h-3 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark">
              Revocado del usuario
            </span>
          </div>
        </div>
      )}

      {/* Permission categories */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map(category => {
          const categoryPerms = permissionsByCategory.get(category)
          if (!categoryPerms || categoryPerms.length === 0) return null

          const meta = CATEGORY_META[category]
          const Icon = meta.icon
          const isCollapsed = collapsedCategories.has(category)
          const enabledCount = getCategoryEnabledCount(categoryPerms)
          const allEnabled = enabledCount === categoryPerms.length
          const someEnabled = enabledCount > 0 && enabledCount < categoryPerms.length

          return (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Category header */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-gray-500 dark:text-gray-400"
                    aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-light dark:text-text-dark">
                      {meta.name}
                    </h3>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {enabledCount} de {categoryPerms.length} permisos activos
                    </p>
                  </div>
                </div>

                {/* Select all checkbox for category */}
                {!disabled && (
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Todos
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleAllInCategory(categoryPerms, !allEnabled)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        allEnabled
                          ? 'bg-primary border-primary text-white'
                          : someEnabled
                          ? 'bg-primary/50 border-primary text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                      aria-label={allEnabled ? 'Desmarcar todos' : 'Marcar todos'}
                    >
                      {allEnabled && <Check className="w-3 h-3" />}
                      {someEnabled && !allEnabled && <Minus className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Permission list */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {categoryPerms.map(permission => (
                    <PermissionRow
                      key={permission.key}
                      permission={permission}
                      state={getPermissionState(permission.key)}
                      isEnabled={isPermissionEnabled(permission.key)}
                      showInheritance={showInheritance}
                      disabled={disabled}
                      onToggle={() => handleToggle(permission.key)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {permissionsByCategory.size === 0 && (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            No hay permisos disponibles
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * PermissionRow Component
 * Individual permission row with checkbox and state indicator
 */
interface PermissionRowProps {
  permission: PermissionDefinition
  state: PermissionState
  isEnabled: boolean
  showInheritance: boolean
  disabled: boolean
  onToggle: () => void
}

function PermissionRow({
  permission,
  state,
  isEnabled,
  showInheritance,
  disabled,
  onToggle
}: PermissionRowProps) {
  /**
   * Get checkbox styles based on permission state
   * @see Requirements 3.6 - Visual differentiation
   */
  const getCheckboxStyles = (): string => {
    if (disabled) {
      return 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
    }

    if (showInheritance) {
      switch (state) {
        case 'inherited':
          // Gray for inherited permissions
          return isEnabled
            ? 'bg-gray-400 dark:bg-gray-500 border-gray-400 dark:border-gray-500 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        case 'granted':
          // Green for explicitly granted permissions
          return 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white'
        case 'revoked':
          // Red for revoked permissions
          return 'bg-red-500 dark:bg-red-600 border-red-500 dark:border-red-600 text-white'
        default:
          return 'border-gray-300 dark:border-gray-600 hover:border-primary'
      }
    } else {
      // Role editing mode - simple primary color
      return isEnabled
        ? 'bg-primary border-primary text-white'
        : 'border-gray-300 dark:border-gray-600 hover:border-primary'
    }
  }

  /**
   * Get the icon to display in the checkbox
   */
  const getCheckboxIcon = () => {
    if (showInheritance) {
      switch (state) {
        case 'inherited':
          return isEnabled ? <Minus className="w-3 h-3" /> : null
        case 'granted':
          return <Check className="w-3 h-3" />
        case 'revoked':
          return <X className="w-3 h-3" />
        default:
          return null
      }
    } else {
      return isEnabled ? <Check className="w-3 h-3" /> : null
    }
  }

  /**
   * Get row background styles based on state
   */
  const getRowStyles = (): string => {
    if (!showInheritance) return ''

    switch (state) {
      case 'inherited':
        return 'bg-gray-50/50 dark:bg-gray-700/20'
      case 'granted':
        return 'bg-green-50/50 dark:bg-green-900/10'
      case 'revoked':
        return 'bg-red-50/50 dark:bg-red-900/10'
      default:
        return ''
    }
  }

  /**
   * Get state label for accessibility and tooltip
   */
  const getStateLabel = (): string => {
    if (!showInheritance) {
      return isEnabled ? 'Activo' : 'Inactivo'
    }

    switch (state) {
      case 'inherited':
        return 'Heredado del rol'
      case 'granted':
        return 'Agregado al usuario'
      case 'revoked':
        return 'Revocado del usuario'
      default:
        return 'No asignado'
    }
  }

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${getRowStyles()}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${getCheckboxStyles()}`}
        aria-label={`${permission.name}: ${getStateLabel()}`}
        title={getStateLabel()}
      >
        {getCheckboxIcon()}
      </button>

      {/* Permission info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-text-light dark:text-text-dark">
            {permission.name}
          </span>
          {showInheritance && state !== 'none' && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                state === 'inherited'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  : state === 'granted'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {state === 'inherited' && 'Heredado'}
              {state === 'granted' && 'Agregado'}
              {state === 'revoked' && 'Revocado'}
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
          {permission.description}
        </p>
      </div>

      {/* Permission key (for debugging/reference) */}
      <code className="hidden lg:block text-xs text-gray-400 dark:text-gray-500 font-mono">
        {permission.key}
      </code>
    </div>
  )
}
