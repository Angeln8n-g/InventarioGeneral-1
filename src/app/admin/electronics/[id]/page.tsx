'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/app/store'
import { loadFromStorage } from '@/features/auth/authSlice'
import { ElectronicDeviceForm } from '@/components/electronics'
import { ElectronicDeviceWithDetails, UpdateElectronicDeviceInput } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCategoryIcons } from '@/hooks/useCategoryIcons'
import { toastSuccess, toastError, toastWarning } from '@/lib/toast'

export default function EditElectronicDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const token = useSelector((state: RootState) => state.auth.token)
  const [device, setDevice] = useState<ElectronicDeviceWithDetails | null>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Fetch category icons for dynamic display
  const { getIcon } = useCategoryIcons()

  // Load token from localStorage on mount
  useEffect(() => {
    dispatch(loadFromStorage())
  }, [dispatch])

  useEffect(() => {
    if (token) {
      fetchDevice()
    }
  }, [resolvedParams.id, token])

  const fetchDevice = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/electronics/${resolvedParams.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch device')
      }

      const data = await response.json()
      setDevice(data.data)

      // Fetch assignment history
      try {
        const assignmentsResponse = await fetch(`/api/admin/device-assignments/by-device/${resolvedParams.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setAssignments(assignmentsData.data || [])
        }
      } catch (err) {
        console.error('Error fetching assignments:', err)
      }
    } catch (error) {
      console.error('Error fetching device:', error)
      toastError('Error al cargar dispositivo', 'No se pudo cargar la información del dispositivo')
      router.push('/admin/electronics')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateElectronicDeviceInput) => {
    if (!token) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/admin/electronics/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update device')
      }

      // Show success message
      toastSuccess('Dispositivo actualizado', 'Los cambios han sido guardados correctamente')
      
      // Redirect to devices list
      router.push('/admin/electronics')
    } catch (error) {
      console.error('Error updating device:', error)
      toastError('Error al actualizar', error instanceof Error ? error.message : 'Failed to update device')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!device || !token) return

    if (device.current_loan) {
      toastWarning('No se puede eliminar', 'El dispositivo tiene un préstamo activo')
      return
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este dispositivo? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/admin/electronics/${resolvedParams.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete device')
      }

      // Show success message
      toastSuccess('Dispositivo eliminado', 'El dispositivo ha sido eliminado correctamente')
      
      // Redirect to devices list
      router.push('/admin/electronics')
    } catch (error) {
      console.error('Error deleting device:', error)
      toastError('Error al eliminar', error instanceof Error ? error.message : 'Failed to delete device')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/electronics')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Loading device...</p>
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-light dark:text-text-dark">Device not found</p>
          <Link
            href="/admin/electronics"
            className="mt-4 inline-block claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to List
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                Edit Electronic Device
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Update device information
              </p>
            </div>
            <Link
              href="/admin/electronics"
              className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Device Info Card */}
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold mb-4">Información del Dispositivo</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {device.tool_instance.item_type && (
              <>
                <div>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Tipo</span>
                  <p className="text-sm font-medium">{device.tool_instance.item_type.name}</p>
                </div>
                <div>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Categoría</span>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <span role="img" aria-hidden="true">{getIcon(device.tool_instance.item_type.category)}</span>
                    {device.tool_instance.item_type.category}
                  </p>
                </div>
              </>
            )}
            {device.brand && (
              <div>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Marca</span>
                <p className="text-sm font-medium">{device.brand}</p>
              </div>
            )}
            {device.model && (
              <div>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Assetag</span>
                <p className="text-sm font-medium">{device.model}</p>
              </div>
            )}
            {device.memory_capacity && device.memory_unit && (
              <div>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Memoria</span>
                <p className="text-sm font-medium">{device.memory_capacity} {device.memory_unit}</p>
              </div>
            )}
            {device.tool_instance.serial_number && (
              <div>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Número de Serie</span>
                <p className="text-sm font-medium font-mono">{device.tool_instance.serial_number}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Estado</span>
              <p className="text-sm font-medium capitalize">{device.tool_instance.status}</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <ElectronicDeviceForm
            device={device}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Assignment History */}
        {assignments.length > 0 && (
          <div className="mt-6 bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Historial de Asignaciones</h3>
            
            {/* Current Assignment */}
            {assignments.filter((a: any) => a.is_active).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asignación Actual</h4>
                {assignments.filter((a: any) => a.is_active).map((a: any) => (
                  <div key={a.id} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium">{a.classroom.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Ubicación: {a.classroom.location}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Asignado: {new Date(a.assigned_date).toLocaleDateString()}
                    </p>
                    {a.assigned_by_user && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Por: {a.assigned_by_user.username}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Historical Assignments */}
            {assignments.filter((a: any) => !a.is_active).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Historial ({assignments.filter((a: any) => !a.is_active).length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left">Aula</th>
                        <th className="px-4 py-2 text-left">Ubicación</th>
                        <th className="px-4 py-2 text-left">Asignado</th>
                        <th className="px-4 py-2 text-left">Removido</th>
                        <th className="px-4 py-2 text-left">Asignado Por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.filter((a: any) => !a.is_active).map((a: any) => (
                        <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2">{a.classroom.name}</td>
                          <td className="px-4 py-2">{a.classroom.location}</td>
                          <td className="px-4 py-2">{new Date(a.assigned_date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            {a.removed_date ? new Date(a.removed_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-2">{a.assigned_by_user?.username || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Section */}
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            Once you delete a device, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !!device.current_loan}
            className="bg-claro-red hover:bg-claro-red/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Device'}
          </button>
          {device.current_loan && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Cannot delete device with active loan
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
