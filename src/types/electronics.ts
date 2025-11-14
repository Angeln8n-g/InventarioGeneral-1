import { ElectronicCategory, ToolInstance } from './database'

// Filter types for electronics
export interface ElectronicDeviceFilters {
  status?: ToolInstance['status']
  category?: ElectronicCategory
  search?: string
  brand?: string
  model?: string
}

// Validation schemas
export interface ElectronicDeviceValidation {
  name: {
    required: boolean
    minLength: number
    maxLength: number
  }
  category: {
    required: boolean
    allowedValues: ElectronicCategory[]
  }
  brand: {
    required: boolean
    maxLength: number
  }
  model: {
    required: boolean
    maxLength: number
  }
  serial_number: {
    required: boolean
    maxLength: number
  }
  description: {
    required: boolean
    maxLength: number
  }
}

export const ELECTRONIC_DEVICE_VALIDATION: ElectronicDeviceValidation = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  category: {
    required: true,
    allowedValues: ['Laptops', 'Tablets', 'Smartphones', 'Periféricos', 'Digitales', 'Otros'],
  },
  brand: {
    required: false,
    maxLength: 100,
  },
  model: {
    required: false,
    maxLength: 255,
  },
  serial_number: {
    required: false,
    maxLength: 255,
  },
  description: {
    required: false,
    maxLength: 1000,
  },
}

// Validation error types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Helper function to validate electronic device input
export function validateElectronicDeviceInput(
  input: Record<string, unknown>
): ValidationResult {
  const errors: ValidationError[] = []

  // Validate name
  if (!input.name || typeof input.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'El nombre es requerido',
      code: 'REQUIRED_FIELD',
    })
  } else if (input.name.length < ELECTRONIC_DEVICE_VALIDATION.name.minLength) {
    errors.push({
      field: 'name',
      message: `El nombre debe tener al menos ${ELECTRONIC_DEVICE_VALIDATION.name.minLength} caracteres`,
      code: 'MIN_LENGTH',
    })
  } else if (input.name.length > ELECTRONIC_DEVICE_VALIDATION.name.maxLength) {
    errors.push({
      field: 'name',
      message: `El nombre no puede exceder ${ELECTRONIC_DEVICE_VALIDATION.name.maxLength} caracteres`,
      code: 'MAX_LENGTH',
    })
  }

  // Validate category
  if (!input.category || typeof input.category !== 'string') {
    errors.push({
      field: 'category',
      message: 'La categoría es requerida',
      code: 'REQUIRED_FIELD',
    })
  } else if (!ELECTRONIC_DEVICE_VALIDATION.category.allowedValues.includes(input.category as ElectronicCategory)) {
    errors.push({
      field: 'category',
      message: 'La categoría seleccionada no es válida',
      code: 'INVALID_VALUE',
    })
  }

  // Validate brand (optional)
  if (input.brand && typeof input.brand === 'string') {
    if (input.brand.length > ELECTRONIC_DEVICE_VALIDATION.brand.maxLength) {
      errors.push({
        field: 'brand',
        message: `La marca no puede exceder ${ELECTRONIC_DEVICE_VALIDATION.brand.maxLength} caracteres`,
        code: 'MAX_LENGTH',
      })
    }
  }

  // Validate model (optional)
  if (input.model && typeof input.model === 'string') {
    if (input.model.length > ELECTRONIC_DEVICE_VALIDATION.model.maxLength) {
      errors.push({
        field: 'model',
        message: `El modelo no puede exceder ${ELECTRONIC_DEVICE_VALIDATION.model.maxLength} caracteres`,
        code: 'MAX_LENGTH',
      })
    }
  }

  // Validate serial_number (optional)
  if (input.serial_number && typeof input.serial_number === 'string') {
    if (input.serial_number.length > ELECTRONIC_DEVICE_VALIDATION.serial_number.maxLength) {
      errors.push({
        field: 'serial_number',
        message: `El número de serie no puede exceder ${ELECTRONIC_DEVICE_VALIDATION.serial_number.maxLength} caracteres`,
        code: 'MAX_LENGTH',
      })
    }
  }

  // Validate description (optional)
  if (input.description && typeof input.description === 'string') {
    if (input.description.length > ELECTRONIC_DEVICE_VALIDATION.description.maxLength) {
      errors.push({
        field: 'description',
        message: `La descripción no puede exceder ${ELECTRONIC_DEVICE_VALIDATION.description.maxLength} caracteres`,
        code: 'MAX_LENGTH',
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Status display helpers
export const ELECTRONIC_STATUS_LABELS: Record<ToolInstance['status'], string> = {
  available: 'Disponible',
  loaned: 'Prestado',
  'out-of-service': 'Fuera de Servicio',
  lost: 'Perdido',
  damaged: 'Dañado',
}

export const ELECTRONIC_STATUS_COLORS: Record<ToolInstance['status'], string> = {
  available: 'green',
  loaned: 'blue',
  'out-of-service': 'orange',
  lost: 'red',
  damaged: 'red',
}

// Category display helpers
export const ELECTRONIC_CATEGORY_LABELS: Record<ElectronicCategory, string> = {
  Laptops: 'Laptops',
  Tablets: 'Tablets',
  Smartphones: 'Smartphones',
  Periféricos: 'Periféricos',
  Digitales: 'Digitales',
  Otros: 'Otros',
}

// Category icons (using common icon names)
export const ELECTRONIC_CATEGORY_ICONS: Record<ElectronicCategory, string> = {
  Laptops: 'laptop',
  Tablets: 'tablet',
  Smartphones: 'smartphone',
  Periféricos: 'keyboard',
  Digitales: 'camera',
  Otros: 'device',
}

// Helper types for better type safety
export interface ElectronicDeviceToolInstance {
  id: number
  qr_code: string
  serial_number: string | null
  status: ToolInstance['status']
  condition_notes: string | null
  created_at: string
  updated_at: string
  item_type: {
    id: number
    name: string
    description: string | null
    category: ElectronicCategory
  }
}

// Helper function to safely extract device data
export function getDeviceData(device: any) {
  const toolInstance = device.tool_instance as ElectronicDeviceToolInstance
  const itemType = toolInstance?.item_type || {
    id: 0,
    name: 'Unknown Device',
    description: null,
    category: 'Otros' as ElectronicCategory,
  }

  return {
    toolInstance,
    itemType,
  }
}
