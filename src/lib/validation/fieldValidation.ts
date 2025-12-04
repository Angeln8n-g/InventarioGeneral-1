import { CategoryField, ValidationResult, ValidationError } from '@/types/database'

/**
 * Validates field configuration input data
 * @param input - The field configuration data to validate
 * @param existingFields - List of existing fields in the category to check for duplicates
 * @returns ValidationResult with isValid flag and any errors
 */
export function validateFieldConfiguration(
  input: Record<string, unknown>,
  existingFields: CategoryField[]
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Validate field_name
  if (!input.field_name || typeof input.field_name !== 'string') {
    errors.push({
      field: 'field_name',
      message: 'El nombre del campo es requerido',
      code: 'REQUIRED_FIELD'
    })
  } else {
    if (input.field_name.length < 1 || input.field_name.length > 255) {
      errors.push({
        field: 'field_name',
        message: 'El nombre del campo debe tener entre 1 y 255 caracteres',
        code: 'INVALID_LENGTH'
      })
    }
    
    // Check uniqueness within category
    const duplicate = existingFields.find(
      f => f.field_name === input.field_name &&
           f.category_id === input.category_id &&
           f.id !== input.id
    )
    if (duplicate) {
      errors.push({
        field: 'field_name',
        message: 'Ya existe un campo con este nombre en esta categoría',
        code: 'DUPLICATE_FIELD_NAME'
      })
    }
  }
  
  // Validate field_type
  const validTypes = ['text', 'number', 'select', 'boolean']
  if (!input.field_type || !validTypes.includes(input.field_type as string)) {
    errors.push({
      field: 'field_type',
      message: 'El tipo de campo debe ser: text, number, select, o boolean',
      code: 'INVALID_FIELD_TYPE'
    })
  }
  
  // Validate options for select type
  if (input.field_type === 'select') {
    if (!input.options || typeof input.options !== 'object') {
      errors.push({
        field: 'options',
        message: 'Los campos de tipo select requieren opciones',
        code: 'REQUIRED_OPTIONS'
      })
    }
  }
  
  // Validate category_id
  if (!input.category_id || typeof input.category_id !== 'number') {
    errors.push({
      field: 'category_id',
      message: 'El ID de categoría es requerido',
      code: 'REQUIRED_FIELD'
    })
  }
  
  // Validate is_required (optional)
  if (input.is_required !== undefined && typeof input.is_required !== 'boolean') {
    errors.push({
      field: 'is_required',
      message: 'El campo requerido debe ser verdadero o falso',
      code: 'INVALID_TYPE'
    })
  }
  
  // Validate is_custom (optional)
  if (input.is_custom !== undefined && typeof input.is_custom !== 'boolean') {
    errors.push({
      field: 'is_custom',
      message: 'El campo personalizado debe ser verdadero o falso',
      code: 'INVALID_TYPE'
    })
  }
  
  // Validate display_order (optional)
  if (input.display_order !== undefined && typeof input.display_order !== 'number') {
    errors.push({
      field: 'display_order',
      message: 'El orden de visualización debe ser un número',
      code: 'INVALID_TYPE'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates field name uniqueness within a category
 * @param fieldName - The field name to check
 * @param categoryId - The category ID
 * @param existingFields - List of existing fields in the category
 * @param excludeId - Optional field ID to exclude from check (for updates)
 * @returns true if field name is unique within the category, false otherwise
 */
export function isFieldNameUnique(
  fieldName: string,
  categoryId: number,
  existingFields: CategoryField[],
  excludeId?: number
): boolean {
  const duplicate = existingFields.find(
    f => f.field_name === fieldName &&
         f.category_id === categoryId &&
         f.id !== excludeId
  )
  return !duplicate
}
