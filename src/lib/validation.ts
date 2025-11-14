/**
 * Form validation utilities for modal forms
 */

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface FieldValidation {
  value: any
  rules: ValidationRule[]
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

/**
 * Validate a single field against multiple rules
 */
export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          return rule.message
        }
        break

      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message
        }
        break

      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message
        }
        break

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message
        }
        break

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message
        }
        break

      case 'pattern':
        if (typeof value === 'string' && rule.value instanceof RegExp && !rule.value.test(value)) {
          return rule.message
        }
        break

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message
        }
        break
    }
  }

  return null
}

/**
 * Validate multiple fields at once
 */
export function validateForm(fields: Record<string, FieldValidation>): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [fieldName, field] of Object.entries(fields)) {
    const error = validateField(field.value, field.rules)
    if (error) {
      errors[fieldName] = error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Common validation rules
 */
export const commonRules = {
  required: (message = 'Este campo es requerido'): ValidationRule => ({
    type: 'required',
    message,
  }),

  min: (value: number, message?: string): ValidationRule => ({
    type: 'min',
    value,
    message: message || `El valor mínimo es ${value}`,
  }),

  max: (value: number, message?: string): ValidationRule => ({
    type: 'max',
    value,
    message: message || `El valor máximo es ${value}`,
  }),

  minLength: (value: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value,
    message: message || `La longitud mínima es ${value} caracteres`,
  }),

  maxLength: (value: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value,
    message: message || `La longitud máxima es ${value} caracteres`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    type: 'pattern',
    value: regex,
    message,
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    type: 'custom',
    validator,
    message,
  }),

  positiveNumber: (message = 'Debe ser un número positivo'): ValidationRule => ({
    type: 'custom',
    validator: (value) => typeof value === 'number' && value > 0,
    message,
  }),

  email: (message = 'Email inválido'): ValidationRule => ({
    type: 'pattern',
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message,
  }),

  uuid: (message = 'UUID inválido'): ValidationRule => ({
    type: 'pattern',
    value: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message,
  }),
}

/**
 * Specific validators for dashboard modals
 */
export const modalValidators = {
  /**
   * Validate quantity against available stock
   */
  validateQuantity: (quantity: number, maxStock: number): ValidationResult => {
    return validateForm({
      quantity: {
        value: quantity,
        rules: [
          commonRules.required('La cantidad es requerida'),
          commonRules.positiveNumber('La cantidad debe ser mayor a 0'),
          commonRules.max(maxStock, `No puedes solicitar más de ${maxStock} unidades`),
        ],
      },
    })
  },

  /**
   * Validate return quantity
   */
  validateReturnQuantity: (quantity: number, maxReturnable: number): ValidationResult => {
    return validateForm({
      quantity: {
        value: quantity,
        rules: [
          commonRules.required('La cantidad es requerida'),
          commonRules.positiveNumber('La cantidad debe ser mayor a 0'),
          commonRules.max(maxReturnable, `No puedes devolver más de ${maxReturnable} unidades`),
        ],
      },
    })
  },

  /**
   * Validate loan duration
   */
  validateLoanDuration: (days: number, maxDays = 30): ValidationResult => {
    return validateForm({
      days: {
        value: days,
        rules: [
          commonRules.required('La duración es requerida'),
          commonRules.min(1, 'La duración mínima es 1 día'),
          commonRules.max(maxDays, `La duración máxima es ${maxDays} días`),
        ],
      },
    })
  },

  /**
   * Validate return reason
   */
  validateReturnReason: (reason: string, required = false): ValidationResult => {
    const rules: ValidationRule[] = [
      commonRules.maxLength(500, 'La razón no puede exceder 500 caracteres'),
    ]

    if (required) {
      rules.unshift(commonRules.required('La razón es requerida'))
    }

    return validateForm({
      reason: {
        value: reason,
        rules,
      },
    })
  },

  /**
   * Validate tool condition
   */
  validateToolCondition: (condition: string): ValidationResult => {
    return validateForm({
      condition: {
        value: condition,
        rules: [
          commonRules.required('La condición es requerida'),
          commonRules.custom(
            (value) => ['good', 'minor_damage', 'major_damage'].includes(value),
            'Condición inválida'
          ),
        ],
      },
    })
  },

  /**
   * Validate notes
   */
  validateNotes: (notes: string, required = false): ValidationResult => {
    const rules: ValidationRule[] = [
      commonRules.maxLength(500, 'Las notas no pueden exceder 500 caracteres'),
    ]

    if (required) {
      rules.unshift(commonRules.required('Las notas son requeridas'))
    }

    return validateForm({
      notes: {
        value: notes,
        rules,
      },
    })
  },
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 500) // Max length
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.values(errors).join('. ')
}
