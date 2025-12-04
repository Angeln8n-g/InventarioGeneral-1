/**
 * Marker Validation Utility - Unit Tests
 * 
 * Tests for marker validation and length calculation
 * Requirements: 2.2, 2.3, 3.2, 3.3, 4.1, 4.4
 */

import {
  validateMarkers,
  calculateLength,
  parseMarker,
  formatMarker,
  validateAgainstStock,
  validateReturnLength,
  isReasonableMarkerValue
} from '../markerValidation'

describe('validateMarkers', () => {
  describe('valid inputs', () => {
    test('should accept valid marker pair', () => {
      const result = validateMarkers('100', '150')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should accept decimal markers', () => {
      const result = validateMarkers('100.5', '150.75')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should accept markers with whitespace', () => {
      const result = validateMarkers('  100  ', '  150  ')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('required fields', () => {
    test('should reject empty start marker', () => {
      const result = validateMarkers('', '150')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ambos campos son requeridos')
    })

    test('should reject empty end marker', () => {
      const result = validateMarkers('100', '')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ambos campos son requeridos')
    })

    test('should reject both empty', () => {
      const result = validateMarkers('', '')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ambos campos son requeridos')
    })

    test('should reject whitespace-only inputs', () => {
      const result = validateMarkers('   ', '   ')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ambos campos son requeridos')
    })
  })

  describe('numeric validation', () => {
    test('should reject non-numeric start', () => {
      const result = validateMarkers('abc', '150')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Los valores deben ser numéricos')
    })

    test('should reject non-numeric end', () => {
      const result = validateMarkers('100', 'xyz')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Los valores deben ser numéricos')
    })

    test('should reject negative start', () => {
      const result = validateMarkers('-10', '150')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Los valores deben ser positivos')
    })

    test('should reject negative end', () => {
      const result = validateMarkers('100', '-50')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Los valores deben ser positivos')
    })
  })

  describe('end > start validation', () => {
    test('should reject end equal to start', () => {
      const result = validateMarkers('100', '100')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('El número final debe ser mayor que el número inicial')
    })

    test('should reject end less than start', () => {
      const result = validateMarkers('150', '100')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('El número final debe ser mayor que el número inicial')
    })
  })

  describe('options', () => {
    test('should enforce maxLength', () => {
      const result = validateMarkers('100', '200', { maxLength: 50 })
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('excede el máximo permitido')
    })

    test('should enforce minLength', () => {
      const result = validateMarkers('100', '105', { minLength: 10 })
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('menor al mínimo requerido')
    })

    test('should reject decimals when allowDecimals is false', () => {
      const result = validateMarkers('100.5', '150', { allowDecimals: false })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Los valores deben ser números enteros')
    })

    test('should add warning for large lengths', () => {
      const result = validateMarkers('100', '1200', { warningThreshold: 1000 })
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('muy grande')
    })
  })
})

describe('calculateLength', () => {
  test('should calculate correct length', () => {
    expect(calculateLength(100, 150)).toBe(50)
  })

  test('should handle decimals with default precision', () => {
    expect(calculateLength(100.25, 150.75)).toBe(50.5)
  })

  test('should round to specified precision', () => {
    expect(calculateLength(100, 150.123, 2)).toBe(50.12)
    expect(calculateLength(100, 150.126, 2)).toBe(50.13)
  })

  test('should handle precision of 0', () => {
    expect(calculateLength(100, 150.7, 0)).toBe(51)
  })

  test('should handle precision of 3', () => {
    expect(calculateLength(100, 150.1234, 3)).toBe(50.123)
  })
})

describe('parseMarker', () => {
  test('should parse valid integer', () => {
    expect(parseMarker('100')).toBe(100)
  })

  test('should parse valid decimal', () => {
    expect(parseMarker('100.5')).toBe(100.5)
  })

  test('should trim whitespace', () => {
    expect(parseMarker('  150  ')).toBe(150)
  })

  test('should return null for empty string', () => {
    expect(parseMarker('')).toBeNull()
  })

  test('should return null for whitespace only', () => {
    expect(parseMarker('   ')).toBeNull()
  })

  test('should return null for non-numeric', () => {
    expect(parseMarker('abc')).toBeNull()
  })

  test('should return null for negative', () => {
    expect(parseMarker('-10')).toBeNull()
  })
})

describe('formatMarker', () => {
  test('should format with default precision', () => {
    expect(formatMarker(100)).toBe('100.00')
  })

  test('should format with specified precision', () => {
    expect(formatMarker(100.5, 1)).toBe('100.5')
    expect(formatMarker(100.123, 3)).toBe('100.123')
  })
})

describe('validateAgainstStock', () => {
  test('should accept length within stock', () => {
    const result = validateAgainstStock(50, 100)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject length exceeding stock', () => {
    const result = validateAgainstStock(150, 100)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Stock insuficiente')
  })

  test('should warn when consuming >80% of stock', () => {
    const result = validateAgainstStock(85, 100)
    expect(result.isValid).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('80%')
  })
})

describe('validateReturnLength', () => {
  test('should accept return within consumed', () => {
    const result = validateReturnLength(30, 50)
    expect(result.isValid).toBe(true)
  })

  test('should reject return exceeding consumed', () => {
    const result = validateReturnLength(60, 50)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('No puedes devolver más')
  })

  test('should account for already returned', () => {
    const result = validateReturnLength(30, 50, 25)
    expect(result.isValid).toBe(false) // 30 > (50 - 25)
  })

  test('should warn when returning everything', () => {
    const result = validateReturnLength(50, 50)
    expect(result.isValid).toBe(true)
    expect(result.warnings[0]).toContain('devolviendo todo')
  })
})

describe('isReasonableMarkerValue', () => {
  test('should accept values within default range', () => {
    expect(isReasonableMarkerValue(100)).toBe(true)
    expect(isReasonableMarkerValue(0)).toBe(true)
    expect(isReasonableMarkerValue(10000)).toBe(true)
  })

  test('should reject values outside default range', () => {
    expect(isReasonableMarkerValue(-1)).toBe(false)
    expect(isReasonableMarkerValue(10001)).toBe(false)
  })

  test('should use custom range', () => {
    expect(isReasonableMarkerValue(50, 0, 100)).toBe(true)
    expect(isReasonableMarkerValue(150, 0, 100)).toBe(false)
  })
})
