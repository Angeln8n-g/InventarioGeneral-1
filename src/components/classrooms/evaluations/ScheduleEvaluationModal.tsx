'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Calendar, Building2, FileText, Clock, AlertCircle, CheckCircle, User, UserCheck } from 'lucide-react'
import type { SpaceType } from '@/types/evaluations'

/**
 * Classroom data for the selector
 */
interface Classroom {
  id: number
  name: string
  location: string
  responsible_person?: string
}

/**
 * Template with question count for display
 */
interface TemplateWithCount {
  id: number
  name: string
  space_type: SpaceType
  version: number
  is_active: boolean
  created_by?: number
  created_at: string
  updated_at: string
  question_count: number
}

/**
 * Admin user for assignment
 */
interface AdminUser {
  id: number
  username: string
  full_name?: string
  role: string
}

/**
 * Props for the ScheduleEvaluationModal component
 */
interface ScheduleEvaluationModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** JWT token for API authentication */
  token: string | null
  /** Pre-selected date (optional) */
  initialDate?: Date
  /** Callback when evaluation is successfully scheduled */
  onSuccess?: () => void
}

// Space type labels in Spanish
const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  training_room: 'Aula de entrenamiento',
  warehouse: 'Almacén',
  external_plant: 'Planta externa'
}

/**
 * Formats a Date object to an ISO string for the datetime-local input
 * @param date - The date to format
 * @returns Formatted string for datetime-local input
 */
function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * ScheduleEvaluationModal Component
 * 
 * Modal form for scheduling a new evaluation.
 * Allows selecting a classroom, date/time, and evaluation template.
 * 
 * Features:
 * - Classroom selector with search
 * - Date and time picker
 * - Template selector filtered by space type
 * - Required field validation
 * - Loading and error states
 * - Success feedback
 * 
 * Validates: Requirements 1.2, 1.3
 */
export function ScheduleEvaluationModal({
  isOpen,
  onClose,
  token,
  initialDate,
  onSuccess
}: ScheduleEvaluationModalProps) {
  // Form state
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null)
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [assignedTo, setAssignedTo] = useState<number | null>(null)
  const [approverId, setApproverId] = useState<number | null>(null)
  
  // Data state
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [templates, setTemplates] = useState<TemplateWithCount[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  
  // UI state
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Validation state
  const [touched, setTouched] = useState({
    classroom: false,
    date: false,
    template: false
  })

  // Get selected classroom for filtering templates
  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId)

  /**
   * Fetches classrooms from the API
   * Validates: Requirements 8.1 (use existing classrooms data)
   */
  const fetchClassrooms = useCallback(async () => {
    if (!token) return
    setIsLoadingClassrooms(true)
    try {
      const res = await fetch('/api/admin/classrooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setClassrooms(data.data || [])
      } else {
        console.error('Error fetching classrooms:', res.status)
        setError('Error al cargar los espacios')
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err)
      setError('Error al cargar los espacios')
    } finally {
      setIsLoadingClassrooms(false)
    }
  }, [token])

  /**
   * Fetches evaluation templates from the API
   * Validates: Requirements 2.1 (list templates)
   */
  const fetchTemplates = useCallback(async () => {
    if (!token) return
    setIsLoadingTemplates(true)
    try {
      const res = await fetch('/api/admin/evaluations/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.data || [])
      } else {
        console.error('Error fetching templates:', res.status)
        setError('Error al cargar las plantillas')
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError('Error al cargar las plantillas')
    } finally {
      setIsLoadingTemplates(false)
    }
  }, [token])

  /**
   * Fetches admin users for assignment
   */
  const fetchAdminUsers = useCallback(async () => {
    if (!token) return
    setIsLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users?role=admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Filter to only admin users
        const admins = (data.data || []).filter((u: AdminUser) => 
          u.role === 'admin' || u.role === 'superadmin'
        )
        setAdminUsers(admins)
      } else {
        console.error('Error fetching admin users:', res.status)
        // Don't show error for this, it's optional
      }
    } catch (err) {
      console.error('Error fetching admin users:', err)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [token])

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClassrooms()
      fetchTemplates()
      fetchAdminUsers()
      // Reset form state
      setSelectedClassroomId(null)
      setSelectedTemplateId(null)
      setAssignedTo(null)
      setApproverId(null)
      setError(null)
      setSuccess(false)
      setTouched({ classroom: false, date: false, template: false })
      
      // Set initial date if provided
      if (initialDate) {
        // Set time to 9:00 AM by default
        const dateWithTime = new Date(initialDate)
        dateWithTime.setHours(9, 0, 0, 0)
        setScheduledDate(formatDateForInput(dateWithTime))
      } else {
        setScheduledDate('')
      }
    }
  }, [isOpen, initialDate, fetchClassrooms, fetchTemplates, fetchAdminUsers])

  /**
   * Validates the form fields
   * Validates: Requirements 1.3 (validate required fields)
   * @returns true if all required fields are valid
   */
  const validateForm = (): boolean => {
    return selectedClassroomId !== null && 
           scheduledDate !== '' && 
           selectedTemplateId !== null
  }

  /**
   * Gets validation error message for a field
   * @param field - The field to check
   * @returns Error message or null
   */
  const getFieldError = (field: 'classroom' | 'date' | 'template'): string | null => {
    if (!touched[field]) return null
    
    switch (field) {
      case 'classroom':
        return selectedClassroomId === null ? 'Seleccione un espacio' : null
      case 'date':
        return scheduledDate === '' ? 'Seleccione fecha y hora' : null
      case 'template':
        return selectedTemplateId === null ? 'Seleccione una plantilla' : null
      default:
        return null
    }
  }

  /**
   * Handles form submission
   * Validates: Requirements 1.2 (schedule evaluation), 1.3 (validate fields)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched for validation display
    setTouched({ classroom: true, date: true, template: true })
    
    // Validate form
    if (!validateForm()) {
      setError('Complete todos los campos requeridos')
      return
    }
    
    if (!token) {
      setError('No hay sesión activa')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const requestBody: Record<string, unknown> = {
        classroom_id: selectedClassroomId,
        template_id: selectedTemplateId,
        scheduled_date: new Date(scheduledDate).toISOString()
      }
      
      // Add optional fields if selected
      if (assignedTo) {
        requestBody.assigned_to = assignedTo
      }
      if (approverId) {
        requestBody.approver_id = approverId
      }
      
      const res = await fetch('/api/admin/evaluations/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (res.ok) {
        setSuccess(true)
        // Wait a moment to show success message, then close
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error?.message || 'Error al programar la evaluación')
      }
    } catch (err) {
      console.error('Error scheduling evaluation:', err)
      setError('Error al programar la evaluación')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handles field blur for validation
   */
  const handleBlur = (field: 'classroom' | 'date' | 'template') => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  // Filter templates based on selected classroom (if we had space_type mapping)
  // For now, show all active templates
  const availableTemplates = templates.filter(t => t.is_active)

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Programar Evaluación"
      size="md"
    >
      {success ? (
        // Success state
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ¡Evaluación Programada!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            La evaluación ha sido programada exitosamente
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Classroom selector */}
          <div>
            <label 
              htmlFor="classroom" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Building2 className="w-4 h-4 inline-block mr-1" />
              Espacio a evaluar *
            </label>
            <select
              id="classroom"
              value={selectedClassroomId ?? ''}
              onChange={(e) => setSelectedClassroomId(e.target.value ? Number(e.target.value) : null)}
              onBlur={() => handleBlur('classroom')}
              disabled={isLoadingClassrooms || isSubmitting}
              className={`
                w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-claro-red focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${getFieldError('classroom') 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'}
              `}
            >
              <option value="">
                {isLoadingClassrooms ? 'Cargando espacios...' : 'Seleccione un espacio'}
              </option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.location}
                  {classroom.responsible_person && ` (${classroom.responsible_person})`}
                </option>
              ))}
            </select>
            {getFieldError('classroom') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError('classroom')}
              </p>
            )}
            {selectedClassroom?.responsible_person && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Responsable: {selectedClassroom.responsible_person}
              </p>
            )}
          </div>

          {/* Date and time picker */}
          <div>
            <label 
              htmlFor="scheduledDate" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Clock className="w-4 h-4 inline-block mr-1" />
              Fecha y hora *
            </label>
            <input
              type="datetime-local"
              id="scheduledDate"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              onBlur={() => handleBlur('date')}
              disabled={isSubmitting}
              className={`
                w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-claro-red focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${getFieldError('date') 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'}
              `}
            />
            {getFieldError('date') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError('date')}
              </p>
            )}
          </div>

          {/* Template selector */}
          <div>
            <label 
              htmlFor="template" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <FileText className="w-4 h-4 inline-block mr-1" />
              Plantilla de evaluación *
            </label>
            <select
              id="template"
              value={selectedTemplateId ?? ''}
              onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
              onBlur={() => handleBlur('template')}
              disabled={isLoadingTemplates || isSubmitting}
              className={`
                w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-claro-red focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${getFieldError('template') 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'}
              `}
            >
              <option value="">
                {isLoadingTemplates ? 'Cargando plantillas...' : 'Seleccione una plantilla'}
              </option>
              {availableTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({SPACE_TYPE_LABELS[template.space_type]}) - {template.question_count} preguntas
                </option>
              ))}
            </select>
            {getFieldError('template') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError('template')}
              </p>
            )}
            {availableTemplates.length === 0 && !isLoadingTemplates && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                No hay plantillas disponibles. Cree una plantilla primero.
              </p>
            )}
          </div>

          {/* Assigned evaluator selector (optional) */}
          <div>
            <label 
              htmlFor="assignedTo" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <User className="w-4 h-4 inline-block mr-1" />
              Evaluador asignado
              <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(opcional)</span>
            </label>
            <select
              id="assignedTo"
              value={assignedTo ?? ''}
              onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
              disabled={isLoadingUsers || isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingUsers ? 'Cargando usuarios...' : 'Sin asignar (cualquier admin puede evaluar)'}
              </option>
              {adminUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.username}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              El evaluador asignado recibirá una notificación con los detalles de la evaluación.
            </p>
          </div>

          {/* Approver selector (optional) */}
          <div>
            <label 
              htmlFor="approverId" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <UserCheck className="w-4 h-4 inline-block mr-1" />
              Aprobador designado
              <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(opcional)</span>
            </label>
            <select
              id="approverId"
              value={approverId ?? ''}
              onChange={(e) => setApproverId(e.target.value ? Number(e.target.value) : null)}
              disabled={isLoadingUsers || isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingUsers ? 'Cargando usuarios...' : 'Sin aprobador (no requiere aprobación)'}
              </option>
              {adminUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.username}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              El aprobador recibirá una notificación cuando la evaluación sea completada para revisarla y aprobarla.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !validateForm()}
              className="px-4 py-2 text-sm font-medium text-white bg-claro-red rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-claro-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Programando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Programar Evaluación
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
