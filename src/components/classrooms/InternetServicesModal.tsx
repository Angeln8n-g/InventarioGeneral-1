'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ModalHeader } from '@/components/shared/ModalHeader'
import { Wifi, X, Plus, Edit2, Trash2, Globe } from 'lucide-react'
import type { 
  ClassroomInternetService, 
  CreateInternetServiceInput,
  InternetServiceType,
  InternetServiceStatus
} from '@/types/classrooms'
import { toastSuccess, toastError } from '@/lib/toast'

interface InternetServicesModalProps {
  isOpen: boolean
  onClose: () => void
  classroomId: number
  classroomName: string
  token: string | null
}

const SERVICE_TYPES: { value: InternetServiceType; label: string }[] = [
  { value: 'fiber', label: 'Fibra Óptica' },
  { value: 'cable', label: 'Cable' },
  { value: 'dsl', label: 'DSL' },
  { value: 'wireless', label: 'Inalámbrico' },
  { value: 'satellite', label: 'Satelital' },
  { value: 'other', label: 'Otro' }
]

const STATUS_OPTIONS: { value: InternetServiceStatus; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' }
]

export function InternetServicesModal({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  token
}: InternetServicesModalProps) {
  const [services, setServices] = useState<ClassroomInternetService[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<CreateInternetServiceInput>({
    classroom_id: classroomId,
    service_provider: '',
    service_type: 'fiber',
    plan_name: '',
    download_speed: undefined,
    upload_speed: undefined,
    account_number: '',
    ip_address: '',
    router_model: '',
    router_serial: '',
    installation_date: '',
    contract_end_date: '',
    monthly_cost: undefined,
    status: 'active',
    notes: ''
  })

  const fetchServices = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}/internet-services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setServices(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setIsLoading(false)
    }
  }, [classroomId, token])

  useEffect(() => {
    if (isOpen) {
      fetchServices()
      setFormData(prev => ({ ...prev, classroom_id: classroomId }))
    }
  }, [isOpen, classroomId, fetchServices])

  const handleChange = (field: keyof CreateInternetServiceInput, value: string | number | undefined) => {
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
      service_provider: '',
      service_type: 'fiber',
      plan_name: '',
      download_speed: undefined,
      upload_speed: undefined,
      account_number: '',
      ip_address: '',
      router_model: '',
      router_serial: '',
      installation_date: '',
      contract_end_date: '',
      monthly_cost: undefined,
      status: 'active',
      notes: ''
    })
    setErrors({})
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (service: ClassroomInternetService) => {
    setFormData({
      classroom_id: classroomId,
      service_provider: service.service_provider,
      service_type: service.service_type,
      plan_name: service.plan_name || '',
      download_speed: service.download_speed,
      upload_speed: service.upload_speed,
      account_number: service.account_number || '',
      ip_address: service.ip_address || '',
      router_model: service.router_model || '',
      router_serial: service.router_serial || '',
      installation_date: service.installation_date || '',
      contract_end_date: service.contract_end_date || '',
      monthly_cost: service.monthly_cost,
      status: service.status,
      notes: service.notes || ''
    })
    setEditingId(service.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.service_provider.trim()) {
      setErrors({ service_provider: 'El proveedor es requerido' })
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingId 
        ? `/api/admin/classrooms/${classroomId}/internet-services/${editingId}`
        : `/api/admin/classrooms/${classroomId}/internet-services`
      
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
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

      toastSuccess(editingId ? 'Servicio actualizado' : 'Servicio agregado')
      resetForm()
      fetchServices()
    } catch (error) {
      toastError('Error', error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este servicio de internet?')) return
    
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}/internet-services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        toastSuccess('Servicio eliminado')
        fetchServices()
      }
    } catch (error) {
      toastError('Error al eliminar', error instanceof Error ? error.message : 'Error')
    }
  }

  const getStatusBadge = (status: InternetServiceStatus) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
    const labels: Record<string, string> = { active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido' }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getServiceTypeLabel = (type: InternetServiceType) => {
    return SERVICE_TYPES.find(t => t.value === type)?.label || type
  }


  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      <ModalHeader title={`🌐 Servicios de Internet - ${classroomName}`} onClose={onClose} />
      
      <div className="p-6">
        {/* Add/Edit Form Toggle */}
        <div className="mb-4">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar Servicio
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Proveedor *</label>
                    <input
                      type="text"
                      value={formData.service_provider}
                      onChange={(e) => handleChange('service_provider', e.target.value)}
                      placeholder="Ej: Claro, Altice, etc."
                      className={`w-full border ${errors.service_provider ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm`}
                    />
                    {errors.service_provider && <p className="mt-1 text-xs text-red-500">{errors.service_provider}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Servicio</label>
                    <select
                      value={formData.service_type}
                      onChange={(e) => handleChange('service_type', e.target.value as InternetServiceType)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    >
                      {SERVICE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan</label>
                    <input
                      type="text"
                      value={formData.plan_name || ''}
                      onChange={(e) => handleChange('plan_name', e.target.value)}
                      placeholder="Nombre del plan"
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bajada (Mbps)</label>
                    <input
                      type="number"
                      value={formData.download_speed || ''}
                      onChange={(e) => handleChange('download_speed', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="100"
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subida (Mbps)</label>
                    <input
                      type="number"
                      value={formData.upload_speed || ''}
                      onChange={(e) => handleChange('upload_speed', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="50"
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      value={formData.account_number || ''}
                      onChange={(e) => handleChange('account_number', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección IP</label>
                    <input
                      type="text"
                      value={formData.ip_address || ''}
                      onChange={(e) => handleChange('ip_address', e.target.value)}
                      placeholder="192.168.1.1"
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Modelo Router</label>
                    <input
                      type="text"
                      value={formData.router_model || ''}
                      onChange={(e) => handleChange('router_model', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Serial Router</label>
                    <input
                      type="text"
                      value={formData.router_serial || ''}
                      onChange={(e) => handleChange('router_serial', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Instalación</label>
                    <input
                      type="date"
                      value={formData.installation_date || ''}
                      onChange={(e) => handleChange('installation_date', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fin Contrato</label>
                    <input
                      type="date"
                      value={formData.contract_end_date || ''}
                      onChange={(e) => handleChange('contract_end_date', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Costo Mensual</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monthly_cost || ''}
                      onChange={(e) => handleChange('monthly_cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value as InternetServiceStatus)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notas</label>
                    <input
                      type="text"
                      value={formData.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar'}
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

        {/* Services List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando servicios...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No hay servicios de internet registrados</p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{service.service_provider}</h4>
                      <p className="text-xs text-gray-500">{getServiceTypeLabel(service.service_type)} {service.plan_name && `• ${service.plan_name}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(service.status)}
                    <button onClick={() => handleEdit(service)} className="p-1 text-gray-500 hover:text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="p-1 text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {(service.download_speed || service.upload_speed) && (
                    <div>
                      <span className="font-medium">Velocidad:</span> {service.download_speed || '?'}/{service.upload_speed || '?'} Mbps
                    </div>
                  )}
                  {service.ip_address && (
                    <div>
                      <span className="font-medium">IP:</span> {service.ip_address}
                    </div>
                  )}
                  {service.router_model && (
                    <div>
                      <span className="font-medium">Router:</span> {service.router_model}
                    </div>
                  )}
                  {service.monthly_cost && (
                    <div>
                      <span className="font-medium">Costo:</span> ${service.monthly_cost}/mes
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  )
}
