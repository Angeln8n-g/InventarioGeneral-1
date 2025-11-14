'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'

interface UserData {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  full_name?: string
  created_at: string
  updated_at: string
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const token = useSelector((state: RootState) => state.auth.token)
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()

  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    if (isAuthenticated && isAdmin && token) {
      fetchUser()
    }
  }, [isAuthenticated, isAdmin, token, userId])

  const fetchUser = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('Fetching user:', userId)
      console.log('Token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        
        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error(`Usuario con ID ${userId} no encontrado. Verifica que el usuario existe en la base de datos.`)
        } else if (response.status === 401) {
          throw new Error('No autorizado. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para ver este usuario.')
        }
        
        throw new Error(errorData.error?.message || 'Error al cargar usuario')
      }

      const data = await response.json()
      console.log('User data loaded:', data.data)
      
      setUser(data.data)
      setEmail(data.data.email)
      setRole(data.data.role)
      setFullName(data.data.full_name || '')
    } catch (err) {
      console.error('Error fetching user:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          role,
          full_name: fullName || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al actualizar usuario')
      }

      setSuccess(true)
      
      // Refresh user data
      await fetchUser()

      // Show success message
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${user?.username}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al eliminar usuario')
      }

      // Redirect to users list
      router.push('/admin/users?success=user_deleted')
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Editar Usuario">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                Cargando usuario...
              </p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  if (error && !user) {
    return (
      <ProtectedRoute>
        <AppLayout title="Editar Usuario">
          <div className="px-4 py-6 max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-claro-red mb-2">Error</h3>
              <p className="text-text-light dark:text-text-dark mb-4">{error}</p>
              <Button variant="secondary" onClick={() => router.push('/admin/users')}>
                Volver a Usuarios
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout title="Editar Usuario">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark transition-colors mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver a Usuarios
            </button>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">
              Editar Usuario
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Actualiza la información y permisos del usuario
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-green-800 dark:text-green-200">
                  Usuario actualizado exitosamente
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-claro-red mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-claro-red">{error}</span>
              </div>
            </div>
          )}

          {/* User Info Card */}
          {user && (
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-claro-red/10 dark:bg-claro-red/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-claro-red"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                    {user.username}
                  </h2>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    ID: {user.id} • Creado:{' '}
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
                Información del Usuario
              </h3>

              {/* Username (Read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark cursor-not-allowed"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  El nombre de usuario no se puede cambiar
                </p>
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre completo del usuario"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:border-claro-red focus:ring-2 focus:ring-claro-red/20 transition-all"
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:border-claro-red focus:ring-2 focus:ring-claro-red/20 transition-all"
                />
              </div>

              {/* Role */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Rol
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:border-claro-red focus:ring-2 focus:ring-claro-red/20 transition-all"
                >
                  <option value="user">Usuario Regular</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Los administradores tienen acceso completo al sistema
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/users')}
                disabled={isSaving}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-claro-red mb-2">Zona de Peligro</h3>
            <p className="text-sm text-text-light dark:text-text-dark mb-4">
              Eliminar este usuario removerá permanentemente toda su información y no se puede
              deshacer.
            </p>
            <Button
              variant="secondary"
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-claro-red hover:bg-red-700 text-white border-claro-red"
            >
              Eliminar Usuario
            </Button>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
