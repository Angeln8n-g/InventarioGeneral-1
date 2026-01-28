'use client'

/**
 * UsersTab Component
 * 
 * Manages user permission overrides in the dynamic permissions system.
 * 
 * Features:
 * - Search users by name, email, or username in real time
 * - Display user list with role and override count
 * - Show inherited permissions and overrides clearly differentiated
 * - Edit user permission overrides using PermissionsMatrix
 * 
 * @see Requirements 3.1 - Show inherited and override permissions clearly differentiated
 * @see Requirements 5.2 - Filter users by name, email, or username in real time
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  User,
  Users,
  Shield,
  ShieldCheck,
  ShieldX,
  X,
  Loader2,
  Save,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import PermissionsMatrix from './PermissionsMatrix'
import { PERMISSION_DEFINITIONS } from '@/lib/permissions'
import type { UserWithPermissions } from '@/types/permissions'

/**
 * Props for the UsersTab component
 * @see Design Document - UsersTabProps interface
 */
export interface UsersTabProps {
  users: UserWithPermissions[]
  selectedUser: UserWithPermissions | null
  onSelectUser: (user: UserWithPermissions) => void
  onUpdateUserPermissions: (userId: number, granted: string[], revoked: string[]) => Promise<void>
  searchQuery: string
  onSearchChange: (query: string) => void
}

/**
 * UsersTab Component - Standalone version that manages its own state
 * This version fetches data directly from the API
 */
export default function UsersTab({
  onPendingChanges
}: {
  onPendingChanges?: (hasChanges: boolean) => void
}) {
  // State
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Permission editing state
  const [editedGranted, setEditedGranted] = useState<string[]>([])
  const [editedRevoked, setEditedRevoked] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  /**
   * Fetch all users with their permissions from the API
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch users list
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Error al cargar los usuarios')
      }

      const data = await response.json()
      const usersList = data.data || data.users || []
      
      // Transform users to UserWithPermissions format
      const usersWithPermissions: UserWithPermissions[] = usersList.map((user: {
        id: number
        username: string
        email: string
        full_name?: string | null
        fullName?: string | null
        role_id?: number
        roleId?: number
        role?: string
        roleName?: string
      }) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name || user.fullName || null,
        roleId: user.role_id || user.roleId || 0,
        roleName: user.role || user.roleName || 'user',
        effectivePermissions: [],
        overrides: {
          granted: [],
          revoked: [],
        },
      }))
      
      setUsers(usersWithPermissions)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  /**
   * Filter users based on search query
   * @see Requirements 5.2 - Filter by name, email, or username in real time
   */
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    
    const query = searchQuery.toLowerCase().trim()
    return users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.fullName && user.fullName.toLowerCase().includes(query))
    )
  }, [users, searchQuery])

  /**
   * Fetch detailed permissions for a selected user
   */
  const fetchUserPermissions = useCallback(async (userId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Error al cargar los permisos del usuario')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      throw error
    }
  }, [])

  /**
   * Handle selecting a user to view/edit permissions
   */
  const handleSelectUser = async (user: UserWithPermissions) => {
    // Check for unsaved changes
    if (hasChanges && selectedUser) {
      const confirmDiscard = window.confirm(
        '¿Deseas descartar los cambios pendientes?'
      )
      if (!confirmDiscard) return
    }

    try {
      setIsSubmitting(true)
      const permissionsData = await fetchUserPermissions(user.id)
      
      const updatedUser: UserWithPermissions = {
        ...user,
        roleId: permissionsData.roleId,
        roleName: permissionsData.roleName,
        effectivePermissions: permissionsData.effectivePermissions || [],
        overrides: {
          granted: permissionsData.overrides?.granted || [],
          revoked: permissionsData.overrides?.revoked || [],
        },
      }
      
      setSelectedUser(updatedUser)
      setEditedGranted(updatedUser.overrides.granted)
      setEditedRevoked(updatedUser.overrides.revoked)
      setHasChanges(false)
      onPendingChanges?.(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar los permisos')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle permission toggle in the matrix
   * Manages the logic for inherited, granted, and revoked permissions
   */
  const handlePermissionChange = (permission: string, enabled: boolean) => {
    if (!selectedUser) return

    const isInherited = selectedUser.effectivePermissions.includes(permission) &&
      !selectedUser.overrides.granted.includes(permission)
    const wasInheritedFromRole = isInherited || 
      (selectedUser.overrides.revoked.includes(permission))

    let newGranted = [...editedGranted]
    let newRevoked = [...editedRevoked]

    if (enabled) {
      // User wants to enable this permission
      if (wasInheritedFromRole) {
        // Permission is inherited from role - remove from revoked if it was there
        newRevoked = newRevoked.filter(p => p !== permission)
      } else {
        // Permission is not inherited - add to granted
        if (!newGranted.includes(permission)) {
          newGranted.push(permission)
        }
        // Remove from revoked if it was there
        newRevoked = newRevoked.filter(p => p !== permission)
      }
    } else {
      // User wants to disable this permission
      if (wasInheritedFromRole && !editedGranted.includes(permission)) {
        // Permission is inherited from role - add to revoked
        if (!newRevoked.includes(permission)) {
          newRevoked.push(permission)
        }
      } else {
        // Permission was explicitly granted - remove from granted
        newGranted = newGranted.filter(p => p !== permission)
      }
    }

    setEditedGranted(newGranted)
    setEditedRevoked(newRevoked)
    
    // Check if there are changes
    const originalGranted = selectedUser.overrides.granted
    const originalRevoked = selectedUser.overrides.revoked
    const grantedChanged = 
      newGranted.length !== originalGranted.length ||
      !newGranted.every(p => originalGranted.includes(p))
    const revokedChanged = 
      newRevoked.length !== originalRevoked.length ||
      !newRevoked.every(p => originalRevoked.includes(p))
    
    const changed = grantedChanged || revokedChanged
    setHasChanges(changed)
    onPendingChanges?.(changed)
  }

  /**
   * Calculate selected permissions for the matrix
   * This combines inherited permissions with overrides
   */
  const getSelectedPermissions = (): string[] => {
    if (!selectedUser) return []
    
    // Start with role permissions (inherited)
    const rolePermissions = selectedUser.effectivePermissions.filter(
      p => !selectedUser.overrides.granted.includes(p)
    )
    
    // Add granted overrides
    const withGranted = [...new Set([...rolePermissions, ...editedGranted])]
    
    // Remove revoked permissions
    return withGranted.filter(p => !editedRevoked.includes(p))
  }

  /**
   * Get inherited permissions (from role, not overridden)
   */
  const getInheritedPermissions = (): string[] => {
    if (!selectedUser) return []
    
    // Inherited = effective - granted overrides
    return selectedUser.effectivePermissions.filter(
      p => !selectedUser.overrides.granted.includes(p)
    )
  }

  /**
   * Save user permission overrides
   */
  const handleSavePermissions = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          granted: editedGranted,
          revoked: editedRevoked,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Error al guardar los permisos')
      }

      const data = await response.json()
      
      // Update the selected user with new data
      const updatedUser: UserWithPermissions = {
        ...selectedUser,
        effectivePermissions: data.data.effectivePermissions || [],
        overrides: {
          granted: data.data.overrides?.granted || [],
          revoked: data.data.overrides?.revoked || [],
        },
      }
      
      setSelectedUser(updatedUser)
      setEditedGranted(updatedUser.overrides.granted)
      setEditedRevoked(updatedUser.overrides.revoked)
      setHasChanges(false)
      onPendingChanges?.(false)
      
      toast.success('Permisos actualizados exitosamente')
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar los permisos')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Reset changes to original state
   */
  const handleResetChanges = () => {
    if (!selectedUser) return
    
    setEditedGranted(selectedUser.overrides.granted)
    setEditedRevoked(selectedUser.overrides.revoked)
    setHasChanges(false)
    onPendingChanges?.(false)
  }

  /**
   * Close the user detail panel
   */
  const handleCloseDetail = () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm(
        '¿Deseas descartar los cambios pendientes?'
      )
      if (!confirmDiscard) return
    }
    
    setSelectedUser(null)
    setEditedGranted([])
    setEditedRevoked([])
    setHasChanges(false)
    onPendingChanges?.(false)
  }

  /**
   * Get override count for display
   */
  const getOverrideCount = (user: UserWithPermissions): number => {
    return user.overrides.granted.length + user.overrides.revoked.length
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cargando usuarios...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Users List Panel */}
      <div className={`${selectedUser ? 'lg:w-1/3' : 'w-full'} space-y-4`}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Users List */}
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUser?.id === user.id}
              overrideCount={getOverrideCount(user)}
              onClick={() => handleSelectUser(user)}
              isLoading={isSubmitting && selectedUser?.id !== user.id}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {searchQuery
                ? 'Intenta con otros términos de búsqueda'
                : 'No hay usuarios registrados en el sistema'}
            </p>
          </div>
        )}

        {/* Results count */}
        {filteredUsers.length > 0 && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-light dark:text-text-dark">
                  {selectedUser.fullName || selectedUser.username}
                </h3>
                <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <span>{selectedUser.email}</span>
                  <span>•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                    {selectedUser.roleName}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseDetail}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Permission Stats */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-2xl font-bold text-text-light dark:text-text-dark">
                    {getInheritedPermissions().length}
                  </span>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Heredados del rol
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {editedGranted.length}
                  </span>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Agregados
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShieldX className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {editedRevoked.length}
                  </span>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Revocados
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="p-6 max-h-[calc(100vh-500px)] overflow-y-auto">
            <h4 className="font-medium text-text-light dark:text-text-dark mb-4">
              Permisos del Usuario
            </h4>
            <PermissionsMatrix
              permissions={PERMISSION_DEFINITIONS}
              selectedPermissions={getSelectedPermissions()}
              inheritedPermissions={getInheritedPermissions()}
              revokedPermissions={editedRevoked}
              onChange={handlePermissionChange}
              disabled={isSubmitting}
              showInheritance={true}
            />
          </div>

          {/* Footer with actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            {hasChanges && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Tienes cambios sin guardar
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              {hasChanges && (
                <button
                  onClick={handleResetChanges}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-text-light dark:text-text-dark bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Descartar
                </button>
              )}
              <button
                onClick={handleSavePermissions}
                disabled={isSubmitting || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no user selected */}
      {!selectedUser && filteredUsers.length > 0 && (
        <div className="hidden lg:flex lg:w-2/3 items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center p-8">
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
              Selecciona un usuario
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-sm">
              Selecciona un usuario de la lista para ver y editar sus permisos específicos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


/**
 * UserCard Component
 * Displays a single user in the list with role and override info
 */
interface UserCardProps {
  user: UserWithPermissions
  isSelected: boolean
  overrideCount: number
  onClick: () => void
  isLoading?: boolean
}

function UserCard({ user, isSelected, overrideCount, onClick, isLoading }: UserCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        isSelected
          ? 'bg-primary/5 border-primary ring-2 ring-primary/20'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-sm'
      } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <User className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-light dark:text-text-dark truncate">
              {user.fullName || user.username}
            </span>
            {overrideCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {overrideCount} override{overrideCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
              {user.roleName}
            </span>
          </div>
        </div>
        <ChevronRight className={`h-5 w-5 flex-shrink-0 ${
          isSelected ? 'text-primary' : 'text-gray-400'
        }`} />
      </div>
    </button>
  )
}


/**
 * Export the controlled version of UsersTab for use with parent state management
 */
export function UsersTabControlled({
  users,
  selectedUser,
  onSelectUser,
  onUpdateUserPermissions,
  searchQuery,
  onSearchChange,
}: UsersTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editedGranted, setEditedGranted] = useState<string[]>([])
  const [editedRevoked, setEditedRevoked] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Update edited state when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setEditedGranted(selectedUser.overrides.granted)
      setEditedRevoked(selectedUser.overrides.revoked)
      setHasChanges(false)
    }
  }, [selectedUser])

  /**
   * Filter users based on search query
   * @see Requirements 5.2 - Filter by name, email, or username in real time
   */
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    
    const query = searchQuery.toLowerCase().trim()
    return users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.fullName && user.fullName.toLowerCase().includes(query))
    )
  }, [users, searchQuery])

  /**
   * Handle permission toggle in the matrix
   */
  const handlePermissionChange = (permission: string, enabled: boolean) => {
    if (!selectedUser) return

    const isInherited = selectedUser.effectivePermissions.includes(permission) &&
      !selectedUser.overrides.granted.includes(permission)
    const wasInheritedFromRole = isInherited || 
      (selectedUser.overrides.revoked.includes(permission))

    let newGranted = [...editedGranted]
    let newRevoked = [...editedRevoked]

    if (enabled) {
      if (wasInheritedFromRole) {
        newRevoked = newRevoked.filter(p => p !== permission)
      } else {
        if (!newGranted.includes(permission)) {
          newGranted.push(permission)
        }
        newRevoked = newRevoked.filter(p => p !== permission)
      }
    } else {
      if (wasInheritedFromRole && !editedGranted.includes(permission)) {
        if (!newRevoked.includes(permission)) {
          newRevoked.push(permission)
        }
      } else {
        newGranted = newGranted.filter(p => p !== permission)
      }
    }

    setEditedGranted(newGranted)
    setEditedRevoked(newRevoked)
    
    const originalGranted = selectedUser.overrides.granted
    const originalRevoked = selectedUser.overrides.revoked
    const grantedChanged = 
      newGranted.length !== originalGranted.length ||
      !newGranted.every(p => originalGranted.includes(p))
    const revokedChanged = 
      newRevoked.length !== originalRevoked.length ||
      !newRevoked.every(p => originalRevoked.includes(p))
    
    setHasChanges(grantedChanged || revokedChanged)
  }

  /**
   * Calculate selected permissions for the matrix
   */
  const getSelectedPermissions = (): string[] => {
    if (!selectedUser) return []
    
    const rolePermissions = selectedUser.effectivePermissions.filter(
      p => !selectedUser.overrides.granted.includes(p)
    )
    const withGranted = [...new Set([...rolePermissions, ...editedGranted])]
    return withGranted.filter(p => !editedRevoked.includes(p))
  }

  /**
   * Get inherited permissions (from role, not overridden)
   */
  const getInheritedPermissions = (): string[] => {
    if (!selectedUser) return []
    return selectedUser.effectivePermissions.filter(
      p => !selectedUser.overrides.granted.includes(p)
    )
  }

  /**
   * Save user permission overrides
   */
  const handleSavePermissions = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      await onUpdateUserPermissions(selectedUser.id, editedGranted, editedRevoked)
      setHasChanges(false)
      toast.success('Permisos actualizados exitosamente')
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar los permisos')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Reset changes to original state
   */
  const handleResetChanges = () => {
    if (!selectedUser) return
    setEditedGranted(selectedUser.overrides.granted)
    setEditedRevoked(selectedUser.overrides.revoked)
    setHasChanges(false)
  }

  /**
   * Get override count for display
   */
  const getOverrideCount = (user: UserWithPermissions): number => {
    return user.overrides.granted.length + user.overrides.revoked.length
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Users List Panel */}
      <div className={`${selectedUser ? 'lg:w-1/3' : 'w-full'} space-y-4`}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o username..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Users List */}
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUser?.id === user.id}
              overrideCount={getOverrideCount(user)}
              onClick={() => onSelectUser(user)}
              isLoading={isSubmitting}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {searchQuery
                ? 'Intenta con otros términos de búsqueda'
                : 'No hay usuarios registrados en el sistema'}
            </p>
          </div>
        )}
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-light dark:text-text-dark">
                  {selectedUser.fullName || selectedUser.username}
                </h3>
                <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <span>{selectedUser.email}</span>
                  <span>•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                    {selectedUser.roleName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Permission Stats */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-2xl font-bold text-text-light dark:text-text-dark">
                    {getInheritedPermissions().length}
                  </span>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Heredados del rol
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {editedGranted.length}
                  </span>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Agregados
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShieldX className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {editedRevoked.length}
                  </span>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Revocados
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="p-6 max-h-[calc(100vh-500px)] overflow-y-auto">
            <h4 className="font-medium text-text-light dark:text-text-dark mb-4">
              Permisos del Usuario
            </h4>
            <PermissionsMatrix
              permissions={PERMISSION_DEFINITIONS}
              selectedPermissions={getSelectedPermissions()}
              inheritedPermissions={getInheritedPermissions()}
              revokedPermissions={editedRevoked}
              onChange={handlePermissionChange}
              disabled={isSubmitting}
              showInheritance={true}
            />
          </div>

          {/* Footer with actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            {hasChanges && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Tienes cambios sin guardar
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              {hasChanges && (
                <button
                  onClick={handleResetChanges}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-text-light dark:text-text-dark bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Descartar
                </button>
              )}
              <button
                onClick={handleSavePermissions}
                disabled={isSubmitting || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no user selected */}
      {!selectedUser && filteredUsers.length > 0 && (
        <div className="hidden lg:flex lg:w-2/3 items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center p-8">
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
              Selecciona un usuario
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-sm">
              Selecciona un usuario de la lista para ver y editar sus permisos específicos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
