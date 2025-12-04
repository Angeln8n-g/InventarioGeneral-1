import { useState, useCallback } from 'react'
import type { CategoryField } from '@/types/database'

interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Hook for validating dynamic fields based on category configuration
 */
export function useDynamicValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateFields = useCallback(
    (fields: CategoryField[], values: Record<string, unknown>): ValidationResult => {
      const newErrors: Record<string, string> = {}

      for (const field of fields) {
        const value = values[field.field_name]

        // Check required fields
        if (field.is_required) {
          if (value === undefined || value === null || value === '') {
            newErrors[field.field_name] = `${field.field_name} es requerido`
            continue
          }
        }

        // Skip validation if value is empty and not required
        if (value === undefined || value === null || value === '') {
          continue
        }

        // Validate field type
        switch (field.field_type) {
          case 'text':
            if (typeof value !== 'string') {
              newErrors[field.field_name] = `${field.field_name} debe ser texto`
            }
            break

          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              newErrors[field.field_name] = `${field.field_name} debe ser un número`
            }
            break

          case 'boolean':
            if (typeof value !== 'boolean') {
              newErrors[field.field_name] = `${field.field_name} debe ser verdadero o falso`
            }
            break

          case 'select':
            const options = (field.options as { options?: string[] })?.options || []
            if (!options.includes(value as string)) {
              newErrors[field.field_name] = `${field.field_name} debe ser una opción válida`
            }
            break
        }
      }

      setErrors(newErrors)
      return {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors,
      }
    },
    []
  )

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  return {
    errors,
    validateFields,
    clearErrors,
    clearFieldError,
  }
}

export default useDynamicValidation
