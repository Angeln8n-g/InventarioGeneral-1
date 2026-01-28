'use client'

/**
 * SectionsTab Component
 * 
 * Displays system sections and their access matrix by role.
 * This is a read-only view - sections are controlled via role permissions.
 * 
 * Features:
 * - List of all system sections with names and paths
 * - Matrix showing which roles have access to each section
 * - Visual indication of admin vs user sections
 * - Read-only view (informational only)
 * 
 * @see Requirements 4.1 - Define 17 controllable sections
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  LayoutGrid,
  Shield,
  ShieldCheck,
  Users,
  Loader2,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import type { Section, Role } from '@/types/permissions'

/**
 * Props for the SectionsTab component
 * @see Design Document - SectionsTabProps interface
 */
export interface SectionsTabProps {
  sections: Section[]
  rolePermissions: Record<number, string[]>
  onUpdateSectionAccess: (roleId: number, sectionId: number, hasAccess: boolean) => Promise<void>
}

/**
 * Extended Role interface with permissions for display
 */
interface RoleWithPermissions extends Role {
  permissions: string[]
  userCount: number
}

/**
 * SectionsTab Component - Standalone version that manages its own state
 * This version fetches data directly from the API
 */
export default function SectionsTab({
  onPendingChanges
}: {
  onPendingChanges?: (hasChanges: boolean) => void
}) {
  // State
  const [sections, setSections] = useState<Section[]>([])
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['user', 'admin']))

  /**
   * Fetch sections from the database via API
   */
  const fetchSections = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch sections - we'll use the roles API and construct sections from seed data
      // Since there's no dedicated sections API, we'll use the known sections from requirements
      const sectionsData: Section[] = [
        // User sections (non-admin)
        { id: 1, name: 'Dashboard', path: '/dashboard', requiredPermission: 'sections:dashboard', isAdminSection: false, displayOrder: 1, description: 'Panel principal del usuario', parentSectionId: null },
        { id: 2, name: 'Herramientas', path: '/tools', requiredPermission: 'sections:tools', isAdminSection: false, displayOrder: 2, description: 'Catálogo de herramientas disponibles', parentSectionId: null },
        { id: 3, name: 'Consumibles', path: '/consumables', requiredPermission: 'sections:consumables', isAdminSection: false, displayOrder: 3, description: 'Catálogo de consumibles disponibles', parentSectionId: null },
        { id: 4, name: 'Mis Préstamos', path: '/my-loans', requiredPermission: 'sections:my_loans', isAdminSection: false, displayOrder: 4, description: 'Préstamos activos del usuario', parentSectionId: null },
        { id: 5, name: 'Mis Espacios', path: '/my-spaces', requiredPermission: 'sections:my_spaces', isAdminSection: false, displayOrder: 5, description: 'Espacios reservados por el usuario', parentSectionId: null },
        { id: 6, name: 'Perfil', path: '/profile', requiredPermission: 'sections:profile', isAdminSection: false, displayOrder: 6, description: 'Perfil y configuración del usuario', parentSectionId: null },
        // Admin sections
        { id: 7, name: 'Admin Dashboard', path: '/admin/dashboard', requiredPermission: 'admin:view_dashboard', isAdminSection: true, displayOrder: 10, description: 'Panel de administración', parentSectionId: null },
        { id: 8, name: 'Admin Herramientas', path: '/admin/tools', requiredPermission: 'admin:manage_tools', isAdminSection: true, displayOrder: 11, description: 'Gestión de herramientas', parentSectionId: null },
        { id: 9, name: 'Admin Consumibles', path: '/admin/consumables', requiredPermission: 'admin:manage_consumables', isAdminSection: true, displayOrder: 12, description: 'Gestión de consumibles', parentSectionId: null },
        { id: 10, name: 'Admin Electrónicos', path: '/admin/electronics', requiredPermission: 'admin:manage_electronics', isAdminSection: true, displayOrder: 13, description: 'Gestión de equipos electrónicos', parentSectionId: null },
        { id: 11, name: 'Admin Aulas', path: '/admin/classrooms', requiredPermission: 'admin:manage_classrooms', isAdminSection: true, displayOrder: 14, description: 'Gestión de aulas y espacios', parentSectionId: null },
        { id: 12, name: 'Admin Asignaciones', path: '/admin/assignments', requiredPermission: 'admin:manage_assignments', isAdminSection: true, displayOrder: 15, description: 'Gestión de asignaciones', parentSectionId: null },
        { id: 13, name: 'Admin Usuarios', path: '/admin/users', requiredPermission: 'users:manage', isAdminSection: true, displayOrder: 16, description: 'Gestión de usuarios', parentSectionId: null },
        { id: 14, name: 'Admin Categorías', path: '/admin/categories', requiredPermission: 'admin:manage_categories', isAdminSection: true, displayOrder: 17, description: 'Gestión de categorías', parentSectionId: null },
        { id: 15, name: 'Admin Reportes', path: '/admin/reports', requiredPermission: 'reports:view', isAdminSection: true, displayOrder: 18, description: 'Reportes y estadísticas', parentSectionId: null },
        { id: 16, name: 'Admin Auditoría', path: '/admin/audit', requiredPermission: 'audit:view', isAdminSection: true, displayOrder: 19, description: 'Registro de auditoría', parentSectionId: null },
        { id: 17, name: 'Admin Permisos', path: '/admin/permissions', requiredPermission: 'admin:manage_permissions', isAdminSection: true, displayOrder: 20, description: 'Gestión de roles y permisos', parentSectionId: null },
      ]
      
      setSections(sectionsData)
      return sectionsData
    } catch (error) {
      console.error('Error fetching sections:', error)
      toast.error('Error al cargar las secciones')
      return []
    }
  }, [])


  /**
   * Fetch roles with their permissions from the API
   */
  const fetchRoles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al cargar los roles')
      }

      const data = await response.json()
      const rolesData = data.data || []
      
      // Fetch permissions for each role
      const rolesWithPermissions: RoleWithPermissions[] = await Promise.all(
        rolesData.map(async (role: Role & { userCount?: number }) => {
          try {
            const permResponse = await fetch(`/api/admin/roles/${role.id}/permissions`, {
              headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
              },
            })
            
            if (permResponse.ok) {
              const permData = await permResponse.json()
              // Ensure permissions is always an array
              const permissions = Array.isArray(permData.data) 
                ? permData.data 
                : Array.isArray(permData.permissions)
                ? permData.permissions
                : []
              
              return {
                ...role,
                permissions,
                userCount: role.userCount || 0,
              }
            }
          } catch (error) {
            console.error(`Error fetching permissions for role ${role.id}:`, error)
          }
          return {
            ...role,
            permissions: [],
            userCount: role.userCount || 0,
          }
        })
      )
      
      setRoles(rolesWithPermissions)
      return rolesWithPermissions
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Error al cargar los roles')
      return []
    }
  }, [])

  /**
   * Load all data on mount
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSections(), fetchRoles()])
      setLoading(false)
    }
    loadData()
  }, [fetchSections, fetchRoles])

  /**
   * Refresh data
   */
  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([fetchSections(), fetchRoles()])
    setLoading(false)
    toast.success('Datos actualizados')
  }


  /**
   * Group sections by type (user vs admin)
   */
  const groupedSections = useMemo(() => {
    const userSections = sections.filter(s => !s.isAdminSection).sort((a, b) => a.displayOrder - b.displayOrder)
    const adminSections = sections.filter(s => s.isAdminSection).sort((a, b) => a.displayOrder - b.displayOrder)
    return { user: userSections, admin: adminSections }
  }, [sections])

  /**
   * Check if a role has access to a section
   */
  const roleHasAccess = (role: RoleWithPermissions, section: Section): boolean => {
    // Ensure permissions is an array before calling includes
    if (!Array.isArray(role.permissions)) {
      console.warn(`Role ${role.name} has invalid permissions:`, role.permissions)
      return false
    }
    return role.permissions.includes(section.requiredPermission)
  }

  /**
   * Toggle group expansion
   */
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  /**
   * Count sections accessible by a role
   */
  const countAccessibleSections = (role: RoleWithPermissions): number => {
    return sections.filter(s => roleHasAccess(role, s)).length
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cargando secciones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with info and refresh */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex-1">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Vista de Solo Lectura
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              El acceso a las secciones se controla a través de los permisos asignados a cada rol.
              Para modificar el acceso, edita los permisos del rol correspondiente en la pestaña "Roles".
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-text-light dark:text-text-dark rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>


      {/* Role summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {roles.map(role => (
          <RoleSummaryCard
            key={role.id}
            role={role}
            totalSections={sections.length}
            accessibleSections={countAccessibleSections(role)}
          />
        ))}
      </div>

      {/* Sections Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Matrix Header */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Matriz de Acceso a Secciones
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Muestra qué roles tienen acceso a cada sección del sistema
          </p>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/30">
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark w-64">
                  Sección
                </th>
                {roles.map(role => (
                  <th
                    key={role.id}
                    className="text-center px-3 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark min-w-[100px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={role.isProtected ? 'text-amber-600 dark:text-amber-400' : ''}>
                        {role.name}
                      </span>
                      {role.isProtected && (
                        <span className="text-xs text-amber-500">Protegido</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* User Sections Group */}
              <SectionGroup
                title="Secciones de Usuario"
                icon={<Users className="h-4 w-4" />}
                sections={groupedSections.user}
                roles={roles}
                isExpanded={expandedGroups.has('user')}
                onToggle={() => toggleGroup('user')}
                roleHasAccess={roleHasAccess}
                bgColor="bg-blue-50 dark:bg-blue-900/20"
                iconColor="text-blue-600 dark:text-blue-400"
              />

              {/* Admin Sections Group */}
              <SectionGroup
                title="Secciones de Administración"
                icon={<Shield className="h-4 w-4" />}
                sections={groupedSections.admin}
                roles={roles}
                isExpanded={expandedGroups.has('admin')}
                onToggle={() => toggleGroup('admin')}
                roleHasAccess={roleHasAccess}
                bgColor="bg-amber-50 dark:bg-amber-900/20"
                iconColor="text-amber-600 dark:text-amber-400"
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-text-secondary-light dark:text-text-secondary-dark">
            Tiene acceso
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <span className="text-text-secondary-light dark:text-text-secondary-dark">
            Sin acceso
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-text-secondary-light dark:text-text-secondary-dark">
            Sección de usuario
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-text-secondary-light dark:text-text-secondary-dark">
            Sección de administración
          </span>
        </div>
      </div>
    </div>
  )
}


/**
 * RoleSummaryCard Component
 * Shows a summary of section access for a role
 */
interface RoleSummaryCardProps {
  role: RoleWithPermissions
  totalSections: number
  accessibleSections: number
}

function RoleSummaryCard({ role, totalSections, accessibleSections }: RoleSummaryCardProps) {
  const percentage = totalSections > 0 ? Math.round((accessibleSections / totalSections) * 100) : 0
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          role.isProtected 
            ? 'bg-amber-100 dark:bg-amber-900/30' 
            : 'bg-purple-100 dark:bg-purple-900/30'
        }`}>
          {role.isProtected ? (
            <ShieldCheck className={`h-5 w-5 ${
              role.isProtected ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'
            }`} />
          ) : (
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          )}
        </div>
        <div>
          <h4 className="font-medium text-text-light dark:text-text-dark">
            {role.name}
          </h4>
          {role.isProtected && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Rol protegido
            </span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary-light dark:text-text-secondary-dark">
            Acceso a secciones
          </span>
          <span className="font-medium text-text-light dark:text-text-dark">
            {accessibleSections}/{totalSections}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              percentage === 100
                ? 'bg-green-500'
                : percentage >= 50
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-right">
          {percentage}% de acceso
        </p>
      </div>
    </div>
  )
}


/**
 * SectionGroup Component
 * Renders a collapsible group of sections in the matrix
 */
interface SectionGroupProps {
  title: string
  icon: React.ReactNode
  sections: Section[]
  roles: RoleWithPermissions[]
  isExpanded: boolean
  onToggle: () => void
  roleHasAccess: (role: RoleWithPermissions, section: Section) => boolean
  bgColor: string
  iconColor: string
}

function SectionGroup({
  title,
  icon,
  sections,
  roles,
  isExpanded,
  onToggle,
  roleHasAccess,
  bgColor,
  iconColor
}: SectionGroupProps) {
  return (
    <>
      {/* Group Header Row */}
      <tr
        className={`${bgColor} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={onToggle}
      >
        <td className="px-4 py-3" colSpan={roles.length + 1}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-gray-500 dark:text-gray-400"
              aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
              <span className={iconColor}>{icon}</span>
            </div>
            <div>
              <span className="font-medium text-text-light dark:text-text-dark">
                {title}
              </span>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark ml-2">
                ({sections.length} secciones)
              </span>
            </div>
          </div>
        </td>
      </tr>

      {/* Section Rows */}
      {isExpanded && sections.map((section, index) => (
        <tr
          key={section.id}
          className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
            index === sections.length - 1 ? 'border-b-2' : ''
          }`}
        >
          <td className="px-4 py-3">
            <div className="flex items-center gap-3 pl-8">
              <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                <span className={iconColor}>{icon}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-text-light dark:text-text-dark">
                    {section.name}
                  </span>
                  <a
                    href={section.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    title={`Abrir ${section.path}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {section.path}
                  </code>
                </div>
                {section.description && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 truncate max-w-xs">
                    {section.description}
                  </p>
                )}
              </div>
            </div>
          </td>
          
          {/* Access indicators for each role */}
          {roles.map(role => {
            const hasAccess = roleHasAccess(role, section)
            return (
              <td key={role.id} className="px-3 py-3 text-center">
                <div className="flex justify-center">
                  {hasAccess ? (
                    <div
                      className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                      title={`${role.name} tiene acceso a ${section.name}`}
                    >
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                      title={`${role.name} no tiene acceso a ${section.name}`}
                    >
                      <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}


/**
 * Export the controlled version of SectionsTab for use with parent state management
 */
export function SectionsTabControlled({
  sections,
  rolePermissions,
  onUpdateSectionAccess
}: SectionsTabProps) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['user', 'admin']))

  /**
   * Fetch roles from the API
   */
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/roles', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const rolesData = data.data || []
          
          // Map role permissions from props
          const rolesWithPermissions: RoleWithPermissions[] = rolesData.map((role: Role & { userCount?: number }) => ({
            ...role,
            permissions: rolePermissions[role.id] || [],
            userCount: role.userCount || 0,
          }))
          
          setRoles(rolesWithPermissions)
        }
      } catch (error) {
        console.error('Error fetching roles:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRoles()
  }, [rolePermissions])

  /**
   * Group sections by type
   */
  const groupedSections = useMemo(() => {
    const userSections = sections.filter(s => !s.isAdminSection).sort((a, b) => a.displayOrder - b.displayOrder)
    const adminSections = sections.filter(s => s.isAdminSection).sort((a, b) => a.displayOrder - b.displayOrder)
    return { user: userSections, admin: adminSections }
  }, [sections])

  /**
   * Check if a role has access to a section
   */
  const roleHasAccess = (role: RoleWithPermissions, section: Section): boolean => {
    // Ensure permissions is an array before calling includes
    if (!Array.isArray(role.permissions)) {
      console.warn(`Role ${role.name} has invalid permissions:`, role.permissions)
      return false
    }
    return role.permissions.includes(section.requiredPermission)
  }

  /**
   * Toggle group expansion
   */
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  /**
   * Count sections accessible by a role
   */
  const countAccessibleSections = (role: RoleWithPermissions): number => {
    return sections.filter(s => roleHasAccess(role, s)).length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cargando secciones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Vista de Solo Lectura
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            El acceso a las secciones se controla a través de los permisos asignados a cada rol.
          </p>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {roles.map(role => (
          <RoleSummaryCard
            key={role.id}
            role={role}
            totalSections={sections.length}
            accessibleSections={countAccessibleSections(role)}
          />
        ))}
      </div>

      {/* Sections Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Matriz de Acceso a Secciones
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/30">
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark w-64">
                  Sección
                </th>
                {roles.map(role => (
                  <th
                    key={role.id}
                    className="text-center px-3 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark min-w-[100px]"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SectionGroup
                title="Secciones de Usuario"
                icon={<Users className="h-4 w-4" />}
                sections={groupedSections.user}
                roles={roles}
                isExpanded={expandedGroups.has('user')}
                onToggle={() => toggleGroup('user')}
                roleHasAccess={roleHasAccess}
                bgColor="bg-blue-50 dark:bg-blue-900/20"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <SectionGroup
                title="Secciones de Administración"
                icon={<Shield className="h-4 w-4" />}
                sections={groupedSections.admin}
                roles={roles}
                isExpanded={expandedGroups.has('admin')}
                onToggle={() => toggleGroup('admin')}
                roleHasAccess={roleHasAccess}
                bgColor="bg-amber-50 dark:bg-amber-900/20"
                iconColor="text-amber-600 dark:text-amber-400"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
