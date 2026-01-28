'use client'

/**
 * RolesTab Component
 * 
 * Manages roles in the dynamic permissions system.
 * 
 * Features:
 * - List of roles with name, description, and user count
 * - Create new roles with name and description
 * - Edit existing roles
 * - Delete roles with confirmation showing affected users
 * - Visual indication of protected roles (admin, user)
 * 
 * @see Requirements 1.1 - Show list of roles with name, description, user count
 * @see Requirements 1.5 - Show confirmation with affected users when deleting
 * @see Requirements 1.6 - Reassign users to "user" role when deleting
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  AlertTriangle,
  X,
  Loader2,
  Check,
  ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'
import type { 
  Role, 
  CreateRoleInput, 
  UpdateRoleInput,
  CanDeleteRoleResult 
} from '@/types/permissions'

/**
 * Extended Role interface with user count for display
 */
interface RoleWithUserCount extends Role {
  userCount: number
}

/**
 * Props for the RolesTab component
 * @see Design Document - RolesTabProps interface
 */
export interface RolesTabProps {
  roles: Role[]
  selectedRole: Role | null
  onSelectRole: (role: Role) => void
  onCreateRole: (input: CreateRoleInput) => Promise<void>
  onUpdateRole: (id: number, input: UpdateRoleInput) => Promise<void>
  onDeleteRole: (id: number) => Promise<void>
  onPendingChanges?: (hasChanges: boolean) => void
}

/**
 * RolesTab Component - Standalone version that manages its own state
 * This version fetches data directly from the API
 */
export default function RolesTab({ 
  onPendingChanges 
}: { 
  onPendingChanges?: (hasChanges: boolean) => void 
}) {
  // State
  const [roles, setRoles] = useState<RoleWithUserCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<RoleWithUserCount | null>(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState<CanDeleteRoleResult | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<CreateRoleInput>({ name: '', description: '' })
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Fetch all roles from the API
   */
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
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
      setRoles(data.data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar los roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  /**
   * Filter roles based on search term
   * @see Requirements 5.3 - Filter roles by name in real time
   */
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  /**
   * Handle opening the create modal
   */
  const handleOpenCreate = () => {
    setFormData({ name: '', description: '' })
    setFormErrors({})
    setShowCreateModal(true)
  }

  /**
   * Handle opening the edit modal
   */
  const handleOpenEdit = (role: RoleWithUserCount) => {
    setSelectedRole(role)
    setFormData({ name: role.name, description: role.description || '' })
    setFormErrors({})
    setShowEditModal(true)
  }

  /**
   * Handle opening the delete confirmation modal
   * @see Requirements 1.5 - Show confirmation with affected users
   */
  const handleOpenDelete = async (role: RoleWithUserCount) => {
    setSelectedRole(role)
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al verificar el rol')
      }

      const data = await response.json()
      setDeleteInfo({
        canDelete: !data.data.isProtected,
        reason: data.data.isProtected 
          ? `El rol "${role.name}" es un rol protegido del sistema y no puede ser eliminado`
          : undefined,
        affectedUsers: data.data.userCount || role.userCount,
      })
      setShowDeleteModal(true)
    } catch (error) {
      console.error('Error checking role:', error)
      toast.error(error instanceof Error ? error.message : 'Error al verificar el rol')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: { name?: string; description?: string } = {}
    
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'El nombre del rol es requerido'
    } else if (formData.name.length > 50) {
      errors.name = 'El nombre del rol es muy largo (máximo 50 caracteres)'
    }

    // Check for duplicate name (excluding current role when editing)
    const existingRole = roles.find(
      r => r.name.toLowerCase() === formData.name.toLowerCase() && 
           r.id !== selectedRole?.id
    )
    if (existingRole) {
      errors.name = 'Ya existe un rol con este nombre'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Handle creating a new role
   * @see Requirements 1.2 - Create role with valid name and description
   */
  const handleCreate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.code === 'ROLE_NAME_EXISTS') {
          setFormErrors({ name: 'Ya existe un rol con este nombre' })
          return
        }
        throw new Error(errorData.error || 'Error al crear el rol')
      }

      toast.success('Rol creado exitosamente')
      setShowCreateModal(false)
      fetchRoles()
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el rol')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle updating an existing role
   * @see Requirements 1.4 - Edit role name/description while preserving permissions
   */
  const handleUpdate = async () => {
    if (!selectedRole || !validateForm()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.code === 'ROLE_NAME_EXISTS') {
          setFormErrors({ name: 'Ya existe un rol con este nombre' })
          return
        }
        throw new Error(errorData.error || 'Error al actualizar el rol')
      }

      toast.success('Rol actualizado exitosamente')
      setShowEditModal(false)
      setSelectedRole(null)
      fetchRoles()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el rol')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle deleting a role
   * @see Requirements 1.6 - Reassign users to "user" role when deleting
   */
  const handleDelete = async () => {
    if (!selectedRole || !deleteInfo?.canDelete) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al eliminar el rol')
      }

      const message = deleteInfo.affectedUsers && deleteInfo.affectedUsers > 0
        ? `Rol eliminado. ${deleteInfo.affectedUsers} usuario(s) reasignado(s) al rol "user"`
        : 'Rol eliminado exitosamente'
      
      toast.success(message)
      setShowDeleteModal(false)
      setSelectedRole(null)
      setDeleteInfo(null)
      fetchRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el rol')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Check if a role is protected (admin or user)
   */
  const isProtectedRole = (role: RoleWithUserCount): boolean => {
    return role.isProtected || ['admin', 'user'].includes(role.name.toLowerCase())
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cargando roles...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Create button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Rol
        </button>
      </div>

      {/* Roles list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isProtected={isProtectedRole(role)}
            onEdit={() => handleOpenEdit(role)}
            onDelete={() => handleOpenDelete(role)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
            {searchTerm ? 'No se encontraron roles' : 'No hay roles'}
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza creando tu primer rol personalizado'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <RoleFormModal
          title="Crear Nuevo Rol"
          formData={formData}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          onFormChange={setFormData}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
          submitText="Crear Rol"
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <RoleFormModal
          title={`Editar Rol: ${selectedRole.name}`}
          formData={formData}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          isProtected={isProtectedRole(selectedRole)}
          onFormChange={setFormData}
          onSubmit={handleUpdate}
          onClose={() => {
            setShowEditModal(false)
            setSelectedRole(null)
          }}
          submitText="Guardar Cambios"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && deleteInfo && (
        <DeleteRoleModal
          role={selectedRole}
          deleteInfo={deleteInfo}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedRole(null)
            setDeleteInfo(null)
          }}
        />
      )}
    </div>
  )
}


/**
 * RoleCard Component
 * Displays a single role with its details and actions
 * 
 * @see Requirements 1.1 - Show role name, description, and user count
 */
interface RoleCardProps {
  role: RoleWithUserCount
  isProtected: boolean
  onEdit: () => void
  onDelete: () => void
}

function RoleCard({ role, isProtected, onEdit, onDelete }: RoleCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isProtected 
              ? 'bg-amber-100 dark:bg-amber-900/30' 
              : 'bg-purple-100 dark:bg-purple-900/30'
          }`}>
            {isProtected ? (
              <ShieldAlert className={`h-5 w-5 ${
                isProtected ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'
              }`} />
            ) : (
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-text-light dark:text-text-dark">
              {role.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <Users className="h-3.5 w-3.5" />
                {role.userCount} usuario{role.userCount !== 1 ? 's' : ''}
              </span>
              {isProtected && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                  Protegido
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {role.description && (
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4 line-clamp-2">
          {role.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-text-light dark:text-text-dark rounded-lg transition-colors text-sm"
        >
          <Edit className="h-4 w-4" />
          Editar
        </button>
        <button
          onClick={onDelete}
          disabled={isProtected}
          className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-sm ${
            isProtected
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400'
          }`}
          title={isProtected ? 'No se puede eliminar un rol protegido' : 'Eliminar rol'}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * RoleFormModal Component
 * Modal for creating or editing a role
 */
interface RoleFormModalProps {
  title: string
  formData: CreateRoleInput
  formErrors: { name?: string; description?: string }
  isSubmitting: boolean
  isProtected?: boolean
  onFormChange: (data: CreateRoleInput) => void
  onSubmit: () => void
  onClose: () => void
  submitText: string
}

function RoleFormModal({
  title,
  formData,
  formErrors,
  isSubmitting,
  isProtected,
  onFormChange,
  onSubmit,
  onClose,
  submitText,
}: RoleFormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Protected role warning */}
          {isProtected && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Este es un rol protegido del sistema. Solo puedes modificar la descripción.
              </p>
            </div>
          )}

          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Nombre del rol *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              disabled={isProtected || isSubmitting}
              placeholder="Ej: supervisor, editor, viewer"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                formErrors.name 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              } ${isProtected ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
              maxLength={50}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Description field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              placeholder="Describe las responsabilidades de este rol..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {(formData.description || '').length}/200 caracteres
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-text-light dark:text-text-dark bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {submitText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * DeleteRoleModal Component
 * Confirmation modal for deleting a role
 * 
 * @see Requirements 1.5 - Show confirmation with affected users
 * @see Requirements 1.6 - Inform about user reassignment
 */
interface DeleteRoleModalProps {
  role: RoleWithUserCount
  deleteInfo: CanDeleteRoleResult
  isSubmitting: boolean
  onConfirm: () => void
  onClose: () => void
}

function DeleteRoleModal({
  role,
  deleteInfo,
  isSubmitting,
  onConfirm,
  onClose,
}: DeleteRoleModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              deleteInfo.canDelete 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              {deleteInfo.canDelete ? (
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
                {deleteInfo.canDelete ? 'Eliminar Rol' : 'No se puede eliminar'}
              </h3>
              
              {deleteInfo.canDelete ? (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    ¿Estás seguro de que deseas eliminar el rol <strong>"{role.name}"</strong>?
                  </p>
                  
                  {/* Affected users warning */}
                  {deleteInfo.affectedUsers && deleteInfo.affectedUsers > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium">
                          {deleteInfo.affectedUsers} usuario{deleteInfo.affectedUsers !== 1 ? 's' : ''} será{deleteInfo.affectedUsers !== 1 ? 'n' : ''} afectado{deleteInfo.affectedUsers !== 1 ? 's' : ''}
                        </p>
                        <p className="mt-1">
                          Estos usuarios serán reasignados automáticamente al rol <strong>"user"</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {deleteInfo.reason}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-text-light dark:text-text-dark bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleteInfo.canDelete ? 'Cancelar' : 'Cerrar'}
          </button>
          {deleteInfo.canDelete && (
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Eliminar Rol
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Export the controlled version of RolesTab for use with parent state management
 */
export function RolesTabControlled({
  roles,
  selectedRole,
  onSelectRole,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: RolesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState<CanDeleteRoleResult | null>(null)
  const [formData, setFormData] = useState<CreateRoleInput>({ name: '', description: '' })
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Convert roles to RoleWithUserCount (assuming userCount is available)
  const rolesWithCount: RoleWithUserCount[] = roles.map(role => ({
    ...role,
    userCount: (role as RoleWithUserCount).userCount || 0,
  }))

  const filteredRoles = rolesWithCount.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const isProtectedRole = (role: RoleWithUserCount): boolean => {
    return role.isProtected || ['admin', 'user'].includes(role.name.toLowerCase())
  }

  const handleOpenCreate = () => {
    setFormData({ name: '', description: '' })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const handleOpenEdit = (role: RoleWithUserCount) => {
    onSelectRole(role)
    setFormData({ name: role.name, description: role.description || '' })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleOpenDelete = async (role: RoleWithUserCount) => {
    onSelectRole(role)
    setDeleteInfo({
      canDelete: !isProtectedRole(role),
      reason: isProtectedRole(role) 
        ? `El rol "${role.name}" es un rol protegido del sistema y no puede ser eliminado`
        : undefined,
      affectedUsers: role.userCount,
    })
    setShowDeleteModal(true)
  }

  const validateForm = (): boolean => {
    const errors: { name?: string; description?: string } = {}
    
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'El nombre del rol es requerido'
    } else if (formData.name.length > 50) {
      errors.name = 'El nombre del rol es muy largo (máximo 50 caracteres)'
    }

    const existingRole = rolesWithCount.find(
      r => r.name.toLowerCase() === formData.name.toLowerCase() && 
           r.id !== selectedRole?.id
    )
    if (existingRole) {
      errors.name = 'Ya existe un rol con este nombre'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onCreateRole({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      })
      toast.success('Rol creado exitosamente')
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el rol')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRole || !validateForm()) return

    setIsSubmitting(true)
    try {
      await onUpdateRole(selectedRole.id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      })
      toast.success('Rol actualizado exitosamente')
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el rol')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRole || !deleteInfo?.canDelete) return

    setIsSubmitting(true)
    try {
      await onDeleteRole(selectedRole.id)
      const message = deleteInfo.affectedUsers && deleteInfo.affectedUsers > 0
        ? `Rol eliminado. ${deleteInfo.affectedUsers} usuario(s) reasignado(s) al rol "user"`
        : 'Rol eliminado exitosamente'
      toast.success(message)
      setShowDeleteModal(false)
      setDeleteInfo(null)
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el rol')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Rol
        </button>
      </div>

      {/* Roles list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isProtected={isProtectedRole(role)}
            onEdit={() => handleOpenEdit(role)}
            onDelete={() => handleOpenDelete(role)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
            {searchTerm ? 'No se encontraron roles' : 'No hay roles'}
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza creando tu primer rol personalizado'}
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <RoleFormModal
          title="Crear Nuevo Rol"
          formData={formData}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          onFormChange={setFormData}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
          submitText="Crear Rol"
        />
      )}

      {showEditModal && selectedRole && (
        <RoleFormModal
          title={`Editar Rol: ${selectedRole.name}`}
          formData={formData}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          isProtected={isProtectedRole(selectedRole as RoleWithUserCount)}
          onFormChange={setFormData}
          onSubmit={handleUpdate}
          onClose={() => setShowEditModal(false)}
          submitText="Guardar Cambios"
        />
      )}

      {showDeleteModal && selectedRole && deleteInfo && (
        <DeleteRoleModal
          role={selectedRole as RoleWithUserCount}
          deleteInfo={deleteInfo}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteModal(false)
            setDeleteInfo(null)
          }}
        />
      )}
    </div>
  )
}
