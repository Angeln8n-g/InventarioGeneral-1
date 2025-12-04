import { DeviceCategory, ValidationResult, ValidationError } from '@/types/database'

/**
 * Validates category input data
 * @param input - The category data to validate
 * @param existingCategories - List of existing categories to check for duplicates
 * @returns ValidationResult with isValid flag and any errors
 */
export function validateCategoryInput(
  input: Record<string, unknown>,
  existingCategories: DeviceCategory[]
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Validate name
  if (!input.name || typeof input.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'El nombre es requerido',
      code: 'REQUIRED_FIELD'
    })
  } else {
    if (input.name.length < 1 || input.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'El nombre debe tener entre 1 y 255 caracteres',
        code: 'INVALID_LENGTH'
      })
    }
    
    // Check uniqueness (case-insensitive)
    const duplicate = existingCategories.find(
      c => c.name.toLowerCase() === (input.name as string).toLowerCase() &&
           c.id !== input.id
    )
    if (duplicate) {
      errors.push({
        field: 'name',
        message: 'Ya existe una categoría con este nombre',
        code: 'DUPLICATE_NAME'
      })
    }
  }
  
  // Validate description (optional)
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'La descripción debe ser texto',
        code: 'INVALID_TYPE'
      })
    }
  }
  
  // Validate icon (optional)
  if (input.icon && typeof input.icon === 'string') {
    if (input.icon.length > 100) {
      errors.push({
        field: 'icon',
        message: 'El icono no puede exceder 100 caracteres',
        code: 'INVALID_LENGTH'
      })
    }
  }
  
  // Validate is_active (optional)
  if (input.is_active !== undefined && typeof input.is_active !== 'boolean') {
    errors.push({
      field: 'is_active',
      message: 'El estado activo debe ser verdadero o falso',
      code: 'INVALID_TYPE'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates category name uniqueness (case-insensitive)
 * @param name - The category name to check
 * @param existingCategories - List of existing categories
 * @param excludeId - Optional category ID to exclude from check (for updates)
 * @returns true if name is unique, false otherwise
 */
export function isCategoryNameUnique(
  name: string,
  existingCategories: DeviceCategory[],
  excludeId?: number
): boolean {
  const duplicate = existingCategories.find(
    c => c.name.toLowerCase() === name.toLowerCase() &&
         c.id !== excludeId
  )
  return !duplicate
}
