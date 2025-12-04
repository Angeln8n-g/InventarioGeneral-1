'use client'

import React, { useState, useEffect } from 'react'
import { X, Edit, Trash2, Settings, Loader2, FolderOpen, Package } from 'lucide-react'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import type { DeviceCategoryWithCount, CategoryField } from '@/types/database'

interface CategoryDetailModalProps {
  category: DeviceCategoryWithCount
  onEdit: () => void
  onDelete: () => void
  onManageFields: () => void
  onClose: () => void
}

interface DeviceSummary {
  id: string
  brand: string
  model: string
  serial_number: string
  status: string
}

export default function CategoryDetailModal({ 
  category, 
  onEdit, 
  onDelete, 
  onManageFields, 
  onClose 
}: CategoryDetailModalProps) {
  const { isAdmin } = usePermissions()
  const [fields, setFields] = useState<CategoryField[]>([])
  const [devices, setDevices] = useState<DeviceSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategoryDetails()
  }, [category.id])

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      }
      
      // Fetch fields
      const fieldsResponse = await fetch(`/api/admin/categories/${category.id}/fields`, { headers })
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json()
        setFields(fieldsData.data || [])
      }

      // Fetch devices (limited)
      const devicesResponse = await fetch(`/api/admin/electronics?category=${category.id}&limit=5`, { headers })
      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json()
        setDevices(devicesData.data || [])
      }
    } catch (error) {
      console.error('Error fetching category details:', error)
      toast.error('Error al cargar los detalles')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'in_use': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'retired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'in_use': return 'En uso'
      case 'maintenance': return 'Mantenimiento'
      case 'retired': return 'Retirado'
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {category.icon ? (
                <span className="text-2xl">{category.icon}</span>
              ) : (
                <FolderOpen className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.is_active ? 'Activa' : 'Inactiva'}
                </span>
                <span className="text-sm text-gray-500">
                  {category.device_count} dispositivo{category.device_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Description */}
              {category.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Descripción</h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              )}

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Campos configurados ({fields.length})
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={onManageFields}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Settings className="h-4 w-4" />
                      Gestionar
                    </button>
                  )}
                </div>
                {fields.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay campos configurados</p>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {fields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{field.field_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 capitalize">{field.field_type}</span>
                          {field.is_required && (
                            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                              Requerido
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Devices */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Dispositivos recientes
                </h3>
                {devices.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay dispositivos en esta categoría</p>
                ) : (
                  <div className="space-y-2">
                    {devices.map((device) => (
                      <div 
                        key={device.id} 
                        className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {device.brand} {device.model}
                            </p>
                            <p className="text-xs text-gray-500">{device.serial_number}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(device.status)}`}>
                          {getStatusLabel(device.status)}
                        </span>
                      </div>
                    ))}
                    {category.device_count > 5 && (
                      <p className="text-sm text-gray-500 text-center pt-2">
                        Y {category.device_count - 5} dispositivo(s) más...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          {isAdmin ? (
            <>
              <button
                onClick={onEdit}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={onManageFields}
                className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Campos
              </button>
              <button
                onClick={onDelete}
                disabled={category.device_count > 0}
                className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                  category.device_count > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
                title={category.device_count > 0 ? 'No se puede eliminar con dispositivos' : 'Eliminar'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
