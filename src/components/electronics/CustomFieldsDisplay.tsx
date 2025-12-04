'use client'

import React from 'react'
import { Check, X } from 'lucide-react'

interface CustomFieldValue {
  value: unknown
  field_definition?: {
    id: number
    field_type: string
    is_required: boolean
    options?: unknown
  }
}

interface CustomFieldsDisplayProps {
  customFields: Record<string, unknown> | Record<string, CustomFieldValue>
  variant?: 'compact' | 'detailed' | 'inline'
  maxFields?: number
  className?: string
}

/**
 * Component to display custom field values in device cards and details
 */
export const CustomFieldsDisplay: React.FC<CustomFieldsDisplayProps> = ({
  customFields,
  variant = 'compact',
  maxFields,
  className = '',
}) => {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null
  }

  const entries = Object.entries(customFields)
  const displayEntries = maxFields ? entries.slice(0, maxFields) : entries
  const hasMore = maxFields && entries.length > maxFields

  const formatValue = (value: unknown, fieldType?: string): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">-</span>
    }

    if (typeof value === 'boolean' || fieldType === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      )
    }

    if (typeof value === 'number') {
      return <span>{value.toLocaleString()}</span>
    }

    return <span>{String(value)}</span>
  }

  const getFieldValue = (
    entry: [string, unknown | CustomFieldValue]
  ): { value: unknown; fieldType?: string } => {
    const [, fieldData] = entry
    if (
      fieldData &&
      typeof fieldData === 'object' &&
      'value' in (fieldData as object)
    ) {
      const typedData = fieldData as CustomFieldValue
      return {
        value: typedData.value,
        fieldType: typedData.field_definition?.field_type,
      }
    }
    return { value: fieldData }
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {displayEntries.map(([fieldName, fieldData]) => {
          const { value, fieldType } = getFieldValue([fieldName, fieldData])
          return (
            <span
              key={fieldName}
              className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
            >
              <span className="text-gray-500 dark:text-gray-400">{fieldName}:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatValue(value, fieldType)}
              </span>
            </span>
          )
        })}
        {hasMore && (
          <span className="text-xs text-gray-400">
            +{entries.length - maxFields!} más
          </span>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-1 ${className}`}>
        {displayEntries.map(([fieldName, fieldData]) => {
          const { value, fieldType } = getFieldValue([fieldName, fieldData])
          return (
            <div
              key={fieldName}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-500 dark:text-gray-400 truncate mr-2">
                {fieldName}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                {formatValue(value, fieldType)}
              </span>
            </div>
          )
        })}
        {hasMore && (
          <p className="text-xs text-gray-400 text-right">
            +{entries.length - maxFields!} campos más
          </p>
        )}
      </div>
    )
  }

  // Detailed variant
  return (
    <div className={`space-y-3 ${className}`}>
      {displayEntries.map(([fieldName, fieldData]) => {
        const { value, fieldType } = getFieldValue([fieldName, fieldData])
        return (
          <div key={fieldName} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {fieldName}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              {formatValue(value, fieldType)}
            </p>
          </div>
        )
      })}
      {hasMore && (
        <p className="text-sm text-gray-400 text-center">
          Y {entries.length - maxFields!} campo(s) más...
        </p>
      )}
    </div>
  )
}

export default CustomFieldsDisplay
