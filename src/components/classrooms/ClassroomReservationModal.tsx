'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ModalHeader } from '@/components/shared/ModalHeader'
import { Calendar, Clock, Users, X, Check, AlertTriangle } from 'lucide-react'
import type { 
  ClassroomReservation, 
  ClassroomReservationWithDetails,
  CreateClassroomReservationInput,
  validateClassroomReservationInput 
} from '@/types/classrooms'
import { toastSuccess, toastError } from '@/lib/toast'

interface ClassroomReservationModalProps {
  isOpen: boolean
  onClose: () => void
  classroomId: number
  classroomName: string
  token: string | null
  onReservationCreated?: () => void
}

export function ClassroomReservationModal({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  token,
  onReservationCreated
}: ClassroomReservationModalProps) {
  const [reservations, setReservations] = useState<ClassroomReservationWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<CreateClassroomReservationInput>({
    classroom_id: classroomId,
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    attendees_count: undefined
  })

  const fetchReservations = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setReservations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [classroomId, token])

  useEffect(() => {
    if (isOpen) {
      fetchReservations()
      setFormData(prev => ({ ...prev, classroom_id: classroomId }))
    }
  }, [isOpen, classroomId, fetchReservations])

  const handleChange = (field: keyof CreateClassroomReservationInput, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const resetForm = () => {
    setFormData({
      classroom_id: classroomId,
      title: '',
      description: '',
      start_datetime: '',
      end_datetime: '',
      attendees_count: undefined
    })
    setErrors({})
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Import validation dynamically to avoid circular deps
    const { validateClassroomReservationInput } = await import('@/types/classrooms')
    const validation = validateClassroomReservationInput(formData as unknown as Record<string, unknown>)
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {}
      validation.errors.forEach(err => { newErrors[err.field] = err.message })
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Error desconocido' } }))
        throw new Error(err.error?.message || `Error ${res.status}`)
      }

      toastSuccess('Reserva creada', 'La reserva se ha creado exitosamente')
      resetForm()
      fetchReservations()
      onReservationCreated?.()
    } catch (error) {
      toastError('Error al crear reserva', error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (reservationId: number) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return
    
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      })

      if (res.ok) {
        toastSuccess('Reserva cancelada')
        fetchReservations()
      }
    } catch (error) {
      toastError('Error al cancelar', error instanceof Error ? error.message : 'Error')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    }
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }


  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <ModalHeader title={`📅 Reservas - ${classroomName}`} onClose={onClose} />
      
      <div className="p-6">
        {/* Toggle Form Button */}
        <div className="mb-4">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Nueva Reserva
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Nueva Reserva</h3>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ej: Clase de Matemáticas"
                    className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm`}
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Inicio *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_datetime}
                      onChange={(e) => handleChange('start_datetime', e.target.value)}
                      className={`w-full border ${errors.start_datetime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm`}
                    />
                    {errors.start_datetime && <p className="mt-1 text-xs text-red-500">{errors.start_datetime}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fin *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_datetime}
                      onChange={(e) => handleChange('end_datetime', e.target.value)}
                      className={`w-full border ${errors.end_datetime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm`}
                    />
                    {errors.end_datetime && <p className="mt-1 text-xs text-red-500">{errors.end_datetime}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Asistentes</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.attendees_count || ''}
                    onChange={(e) => handleChange('attendees_count', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Número de asistentes"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Detalles adicionales..."
                    rows={2}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Crear Reserva'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Reservations List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando reservas...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No hay reservas para esta aula</p>
            </div>
          ) : (
            reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{reservation.title}</h4>
                    <p className="text-xs text-gray-500">{reservation.username}</p>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(reservation.start_datetime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(reservation.end_datetime)}</span>
                  </div>
                  {reservation.attendees_count && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{reservation.attendees_count} asistentes</span>
                    </div>
                  )}
                </div>

                {reservation.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{reservation.description}</p>
                )}

                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                  <button
                    onClick={() => handleCancel(reservation.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Cancelar reserva
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  )
}
