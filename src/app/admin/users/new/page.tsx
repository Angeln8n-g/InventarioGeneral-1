'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Role {
  id: number
  name: string
  description: string | null
}

export default function NewUserPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    full_name: '',
    role_id: '',
  })

  // Cargar roles disponibles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/admin/roles')
        if (!response.ok) {
          throw new Error('Error al cargar roles')
        }
        const data = await response.json()
        if (data.success && data.data) {
          setRoles(data.data)
          // Set default role to first available role
          if (data.data.length > 0) {
            setFormData(prev => ({ ...prev, role_id: data.data[0].id.toString() }))
          }
        }
      } catch (err) {
        console.error('Error loading roles:', err)
        setError('Error al cargar los roles disponibles')
      } finally {
        setIsLoadingRoles(false)
      }
    }

    if (isAuthenticated && isAdmin) {
      fetchRoles()
    }
  }, [isAuthenticated, isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!formData.role_id) {
      setError('Debe seleccionar un rol')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email || undefined,
          full_name: formData.full_name,
          role_id: parseInt(formData.role_id),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al crear usuario')
      }

      router.push('/admin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isLoadingRoles) {
    return (
      <ProtectedRoute>
        <AppLayout title="Agregar Usuario">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <ProtectedRoute>
      <AppLayout title="Agregar Usuario">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Agregar Usuario</h1>
            <Button
              onClick={() => router.back()}
              variant="secondary"
              size="sm"
            >
              Cancelar
            </Button>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-accent rounded-lg p-4">
                  <p className="text-sm text-red-accent">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Nombre de Usuario *
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="usuario"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Nombre Completo *
                </label>
                <Input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Email (Opcional)
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Si no se proporciona, se generará un email predeterminado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  Rol *
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  disabled={roles.length === 0}
                >
                  {roles.length === 0 ? (
                    <option value="">No hay roles disponibles</option>
                  ) : (
                    <>
                      <option value="">Seleccionar rol</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                          {role.description && ` - ${role.description}`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {roles.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No se pudieron cargar los roles. Por favor, recarga la página.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Contraseña *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Confirmar Contraseña *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.username || !formData.full_name || !formData.password || !formData.role_id}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
