'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import DynamicFieldRenderer from './DynamicFieldRenderer'
import type { CategoryField } from '@/types/database'

interface DynamicFieldsContainerProps {
  categoryId: number | null
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
  disabled?: boolean
  showTitle?: boolean
}

/**
 * Container component that fetches and renders all dynamic fields for a category
 */
export const DynamicFieldsContainer: React.FC<DynamicFieldsContainerProps> = ({
  categoryId,
  values,
  onChange,
  errors = {},
  disabled = false,
  showTitle = true,
}) => {
  const [fields, setFields] = useState<CategoryField[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (categoryId) {
      fetchFields(categoryId)
    } else {
      setFields([])
    }
  }, [categoryId])

  const fetchFields = async (catId: number) => {
    try {
      setLoading(true)
      setFetchError(null)
      const response = await fetch(`/api/admin/categories/${catId}/fields`)
      if (!response.ok) {
        throw new Error('Error al cargar campos')
      }
      const data = await response.json()
      setFields(data.data || [])
    } catch (error) {
      console.error('Error fetching category fields:', error)
      setFetchError('No se pudieron cargar los campos de la categoría')
      setFields([])
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldId: number, value: unknown) => {
    const field = fields.find((f) => f.id === fieldId)
    if (field) {
      onChange({
        ...values,
        [field.field_name]: value,
      })
    }
  }

  if (!categoryId) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Cargando campos...</span>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex items-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">{fetchError}</span>
      </div>
    )
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Campos adicionales
          </h4>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <DynamicFieldRenderer
            key={field.id}
            field={field}
            value={values[field.field_name]}
            onChange={handleFieldChange}
            error={errors[field.field_name]}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}

export default DynamicFieldsContainer
