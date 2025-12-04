/**
 * Marker Validation Utility
 * 
 * Provides functions to validate cable marker inputs and calculate lengths
 * with proper precision handling.
 */

export interface MarkerValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface MarkerValidationOptions {
  maxLength?: number
  minLength?: number
  allowDecimals?: boolean
  warningThreshold?: number
}

/**
 * Validates marker inputs for cable consumption or return
 * 
 * @param startMarker - Starting marker value as string
 * @param endMarker - Ending marker value as string
 * @param options - Validation options
 * @returns Validation result with errors and warnings
 * 
 * @example
 * validateMarkers('100', '150') // { isValid: true, errors: [], warnings: [] }
 * validateMarkers('150', '100') // { isValid: false, errors: ['El número final debe ser mayor...'], warnings: [] }
 * validateMarkers('100', '1200') // { isValid: true, errors: [], warnings: ['La cantidad calculada es muy grande...'] }
 */
export function validateMarkers(
  startMarker: string,
  endMarker: string,
  options: MarkerValidationOptions = {}
): MarkerValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const {
    maxLength,
    minLength,
    allowDecimals = true,
    warningThreshold = 1000
  } = options
  
  // Check if both fields are provided
  if (!startMarker || !endMarker) {
    errors.push('Ambos campos son requeridos')
    return { isValid: false, errors, warnings }
  }
  
  // Check if both are strings (trim whitespace)
  const trimmedStart = startMarker.trim()
  const trimmedEnd = endMarker.trim()
  
  if (!trimmedStart || !trimmedEnd) {
    errors.push('Ambos campos son requeridos')
    return { isValid: false, errors, warnings }
  }
  
  // Parse as numbers
  const start = parseFloat(trimmedStart)
  const end = parseFloat(trimmedEnd)
  
  // Check if valid numbers
  if (isNaN(start) || isNaN(end)) {
    errors.push('Los valores deben ser numéricos')
    return { isValid: false, errors, warnings }
  }
  
  // Check if positive
  if (start < 0 || end < 0) {
    errors.push('Los valores deben ser positivos')
    return { isValid: false, errors, warnings }
  }
  
  // Check if decimals are allowed
  if (!allowDecimals) {
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      errors.push('Los valores deben ser números enteros')
      return { isValid: false, errors, warnings }
    }
  }
  
  // Check if end > start
  if (end <= start) {
    errors.push('El número final debe ser mayor que el número inicial')
    return { isValid: false, errors, warnings }
  }
  
  const length = end - start
  
  // Check maximum length
  if (maxLength !== undefined && length > maxLength) {
    errors.push(`La cantidad calculada (${length.toFixed(2)}) excede el máximo permitido (${maxLength})`)
    return { isValid: false, errors, warnings }
  }
  
  // Check minimum length
  if (minLength !== undefined && length < minLength) {
    errors.push(`La cantidad calculada (${length.toFixed(2)}) es menor al mínimo requerido (${minLength})`)
    return { isValid: false, errors, warnings }
  }
  
  // Warning for unusually large lengths
  if (length > warningThreshold) {
    warnings.push(`La cantidad calculada (${length.toFixed(2)}) es muy grande. Verifica los números.`)
  }
  
  return { isValid: true, errors, warnings }
}

/**
 * Calculates length from markers with specified precision
 * 
 * @param start - Starting marker number
 * @param end - Ending marker number
 * @param precision - Number of decimal places (default: 2)
 * @returns Calculated length rounded to specified precision
 * 
 * @example
 * calculateLength(100, 150.5) // 50.5
 * calculateLength(100.25, 150.75) // 50.5
 * calculateLength(100, 150.123, 3) // 50.123
 */
export function calculateLength(start: number, end: number, precision: number = 2): number {
  const length = end - start
  const multiplier = Math.pow(10, precision)
  return Math.round(length * multiplier) / multiplier
}

/**
 * Parses a marker string to a number, handling various formats
 * 
 * @param marker - Marker string to parse
 * @returns Parsed number or null if invalid
 * 
 * @example
 * parseMarker('100') // 100
 * parseMarker('100.5') // 100.5
 * parseMarker('  150  ') // 150
 * parseMarker('abc') // null
 */
export function parseMarker(marker: string): number | null {
  if (!marker) return null
  
  const trimmed = marker.trim()
  if (!trimmed) return null
  
  const parsed = parseFloat(trimmed)
  
  if (isNaN(parsed)) return null
  if (parsed < 0) return null
  
  return parsed
}

/**
 * Formats a marker number for display
 * 
 * @param marker - Marker number to format
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted marker string
 * 
 * @example
 * formatMarker(100) // '100.00'
 * formatMarker(100.5) // '100.50'
 * formatMarker(100.123, 3) // '100.123'
 */
export function formatMarker(marker: number, precision: number = 2): string {
  return marker.toFixed(precision)
}

/**
 * Validates that a calculated length doesn't exceed available stock
 * 
 * @param calculatedLength - The calculated length from markers
 * @param availableStock - Available stock quantity
 * @returns Validation result
 */
export function validateAgainstStock(
  calculatedLength: number,
  availableStock: number
): MarkerValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (calculatedLength > availableStock) {
    errors.push(`Stock insuficiente. Disponible: ${availableStock}`)
    return { isValid: false, errors, warnings }
  }
  
  // Warning if consuming more than 80% of available stock
  if (calculatedLength > availableStock * 0.8) {
    warnings.push(`Estás consumiendo más del 80% del stock disponible`)
  }
  
  return { isValid: true, errors, warnings }
}

/**
 * Validates that a return length doesn't exceed consumed length
 * 
 * @param returnLength - The calculated return length
 * @param consumedLength - Originally consumed length
 * @param alreadyReturned - Length already returned
 * @returns Validation result
 */
export function validateReturnLength(
  returnLength: number,
  consumedLength: number,
  alreadyReturned: number = 0
): MarkerValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const availableToReturn = consumedLength - alreadyReturned
  
  if (returnLength > availableToReturn) {
    errors.push(`No puedes devolver más de lo que consumiste. Disponible para devolver: ${availableToReturn.toFixed(2)}`)
    return { isValid: false, errors, warnings }
  }
  
  if (returnLength === availableToReturn) {
    warnings.push('Estás devolviendo todo lo consumido')
  }
  
  return { isValid: true, errors, warnings }
}

/**
 * Checks if a marker value is within a reasonable range
 * 
 * @param marker - Marker value to check
 * @param min - Minimum reasonable value (default: 0)
 * @param max - Maximum reasonable value (default: 10000)
 * @returns true if within range, false otherwise
 */
export function isReasonableMarkerValue(
  marker: number,
  min: number = 0,
  max: number = 10000
): boolean {
  return marker >= min && marker <= max
}
