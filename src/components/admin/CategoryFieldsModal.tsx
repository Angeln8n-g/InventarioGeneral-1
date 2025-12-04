'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Save, Loader2, GripVertical, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { DeviceCategory, CategoryField } from '@/types/database'

interface CategoryFieldsModalProps {
  category: DeviceCategory
  onClose: () => void
}

interface FieldFormData {
  field_name: string
  field_type: 'text' | 'number' | 'select' | 'boolean'
  is_required: boolean
  display_order: number
  options?: string[]
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto', description: 'Campo de texto libre' },
  { value: 'number', label: 'Número', description: 'Valor numérico' },
  { value: 'select', label: 'Selección', description: 'Lista de opciones' },
  { value: 'boolean', label: 'Sí/No', description: 'Valor verdadero/falso' },
]

export default function CategoryFieldsModal({ category, onClose }: CategoryFieldsModalProps) {
  const [fields, setFields] = useState<CategoryField[]>([])
  const [loading, setLoading] = useState(true)
  const [showFieldForm, setShowFieldForm] = useState(false)
  const [editingField, setEditingField] = useState<CategoryField | null>(null)
  const [fieldFormData, setFieldFormData] = useState<FieldFormData>({
    field_name: '',
    field_type: 'text',
    is_required: false,
    display_order: 0,
    options: [],
  })
  const [selectOptions, setSelectOptions] = useState<string[]>([''])
  const [formLoading, setFormLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchFields()
  }, [category.id])

  const fetchFields = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/categories/${category.id}/fields`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Error al cargar campos')
      }
      const data = await response.json()
      setFields(data.data || [])
    } catch (error) {
      console.error('Error fetching fields:', error)
      toast.error('Error al cargar los campos')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFieldFormData({
      field_name: '',
      field_type: 'text',
      is_required: false,
      display_order: fields.length,
      options: [],
    })
    setSelectOptions([''])
    setErrors({})
  }

  const handleCreateField = () => {
    setEditingField(null)
    resetForm()
    setFieldFormData(prev => ({ ...prev, display_order: fields.length }))
    setShowFieldForm(true)
  }

  const handleEditField = (field: CategoryField) => {
    setEditingField(field)
    setFieldFormData({
      field_name: field.field_name,
      field_type: field.field_type,
      is_required: field.is_required,
      display_order: field.display_order,
    })
    
    if (field.field_type === 'select' && field.options) {
      const opts = (field.options as { options?: string[] })?.options || []
      setSelectOptions(opts.length > 0 ? opts : [''])
    } else {
      setSelectOptions([''])
    }
    
    setErrors({})
    setShowFieldForm(true)
  }

  const handleDeleteField = async (field: CategoryField) => {
    if (!confirm(`¿Eliminar el campo '${field.field_name}'? Los valores existentes se perderán.`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/categories/${category.id}/fields/${field.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al eliminar campo')
      }

      toast.success('Campo eliminado exitosamente')
      fetchFields()
    } catch (error) {
      console.error('Error deleting field:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el campo')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!fieldFormData.field_name.trim()) {
      newErrors.field_name = 'El nombre es requerido'
    } else if (fieldFormData.field_name.length > 100) {
      newErrors.field_name = 'El nombre no puede exceder 100 caracteres'
    }

    if (fieldFormData.field_type === 'select') {
      const validOptions = selectOptions.filter(opt => opt.trim())
      if (validOptions.length < 2) {
        newErrors.options = 'Se requieren al menos 2 opciones'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitField = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setFormLoading(true)

    try {
      const payload = {
        field_name: fieldFormData.field_name.trim(),
        field_type: fieldFormData.field_type,
        is_required: fieldFormData.is_required,
        display_order: fieldFormData.display_order,
        is_custom: true,
        options: fieldFormData.field_type === 'select' 
          ? { options: selectOptions.filter(opt => opt.trim()) }
          : null,
      }

      const url = editingField
        ? `/api/admin/categories/${category.id}/fields/${editingField.id}`
        : `/api/admin/categories/${category.id}/fields`
      
      const method = editingField ? 'PUT' : 'POST'
      const token = localStorage.getItem('token')

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al guardar el campo')
      }

      toast.success(editingField ? 'Campo actualizado' : 'Campo creado')
      setShowFieldForm(false)
      fetchFields()
    } catch (error) {
      console.error('Error saving field:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar el campo')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSelectOptionChange = (index: number, value: string) => {
    const newOptions = [...selectOptions]
    newOptions[index] = value
    setSelectOptions(newOptions)
  }

  const addSelectOption = () => {
    setSelectOptions([...selectOptions, ''])
  }

  const removeSelectOption = (index: number) => {
    if (selectOptions.length > 1) {
      setSelectOptions(selectOptions.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Campos de {category.name}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Configura los campos personalizados para esta categoría
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : showFieldForm ? (
            /* Field Form */
            <form onSubmit={handleSubmitField} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingField ? 'Editar Campo' : 'Nuevo Campo'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFieldForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Field Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del campo *
                </label>
                <input
                  type="text"
                  value={fieldFormData.field_name}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, field_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.field_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Capacidad de memoria, Resolución..."
                />
                {errors.field_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.field_name}</p>
                )}
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de campo *
                </label>
                <select
                  value={fieldFormData.field_type}
                  onChange={(e) => setFieldFormData(prev => ({ 
                    ...prev, 
                    field_type: e.target.value as FieldFormData['field_type']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Options */}
              {fieldFormData.field_type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opciones *
                  </label>
                  <div className="space-y-2">
                    {selectOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleSelectOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Opción ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectOption(index)}
                          disabled={selectOptions.length <= 1}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSelectOption}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar opción
                    </button>
                  </div>
                  {errors.options && (
                    <p className="text-red-600 text-sm mt-1">{errors.options}</p>
                  )}
                </div>
              )}

              {/* Required */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={fieldFormData.is_required}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_required" className="ml-2 block text-sm text-gray-700">
                  Campo requerido
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFieldForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingField ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          ) : (
            /* Fields List */
            <div className="space-y-4">
              <button
                onClick={handleCreateField}
                className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-4 text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Agregar Campo
              </button>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay campos configurados para esta categoría</p>
                  <p className="text-sm mt-1">Agrega campos personalizados para los dispositivos</p>
                </div>
              ) : (
                fields.map((field) => (
                  <div
                    key={field.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{field.field_name}</h4>
                          {field.is_required && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                              Requerido
                            </span>
                          )}
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                            {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                          </span>
                        </div>
                        {field.field_type === 'select' && field.options && (
                          <p className="text-sm text-gray-500 mt-1">
                            Opciones: {((field.options as { options?: string[] })?.options || []).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditField(field)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
