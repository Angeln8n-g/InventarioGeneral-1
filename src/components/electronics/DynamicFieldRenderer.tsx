'use client'

import React from 'react'
import type { CategoryField } from '@/types/database'

interface DynamicFieldRendererProps {
  field: CategoryField
  value: unknown
  onChange: (fieldId: number, value: unknown) => void
  error?: string
  disabled?: boolean
}

/**
 * Renders a form field dynamically based on the field configuration
 */
export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const handleChange = (newValue: unknown) => {
    onChange(field.id, newValue)
  }

  const baseInputClass = `w-full border ${
    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
  } rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed`

  const renderField = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClass}
            placeholder={`Ingrese ${field.field_name.toLowerCase()}`}
            disabled={disabled}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => {
              const val = e.target.value
              handleChange(val === '' ? null : parseFloat(val))
            }}
            className={baseInputClass}
            placeholder={`Ingrese ${field.field_name.toLowerCase()}`}
            disabled={disabled}
            step="any"
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50"
              disabled={disabled}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {value ? 'Sí' : 'No'}
            </span>
          </div>
        )

      case 'select':
        const options = (field.options as { options?: string[] })?.options || []
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value || null)}
            className={baseInputClass}
            disabled={disabled}
          >
            <option value="">Seleccione una opción</option>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      default:
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClass}
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
        {field.field_name}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default DynamicFieldRenderer
