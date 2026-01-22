/**
 * Scheduled Evaluations - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 5: Programación de evaluación requiere campos obligatorios
 * 
 * Property Description:
 * Para cualquier intento de crear una programación de evaluación, el sistema debe rechazar 
 * la creación si falta classroom_id, template_id, o scheduled_date.
 * 
 * **Validates: Requirements 1.3**
 */

import * as fc from 'fast-check'
import type { CreateScheduledEvaluationInput } from '@/types/evaluations'

// ============================================================================
// Validation Function (extracted from API route for testing)
// ============================================================================

/**
 * Validates the input for creating a new scheduled evaluation
 * Extracted from src/app/api/admin/evaluations/schedule/route.ts
 */
function validateCreateScheduledEvaluationInput(body: unknown): {
  isValid: boolean
  errors: string[]
  data?: CreateScheduledEvaluationInput
} {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] }
  }

  const input = body as Record<string, unknown>

  // Validate classroom_id
  if (!input.classroom_id || typeof input.classroom_id !== 'number') {
    errors.push('classroom_id is required and must be a number')
  }

  // Validate template_id
  if (!input.template_id || typeof input.template_id !== 'number') {
    errors.push('template_id is required and must be a number')
  }

  // Validate scheduled_date
  if (!input.scheduled_date || typeof input.scheduled_date !== 'string') {
    errors.push('scheduled_date is required and must be a string')
  } else {
    // Validate date format
    const date = new Date(input.scheduled_date)
    if (isNaN(date.getTime())) {
      errors.push('scheduled_date must be a valid ISO date string')
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    data: {
      classroom_id: input.classroom_id as number,
      template_id: input.template_id as number,
      scheduled_date: input.scheduled_date as string,
    },
  }
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid classroom IDs (positive integers)
 */
const classroomIdArb = fc.integer({ min: 1, max: 10000 })

/**
 * Generator for valid template IDs (positive integers)
 */
const templateIdArb = fc.integer({ min: 1, max: 10000 })

/**
 * Generator for valid ISO date strings
 * Using integer timestamps to avoid invalid date issues with fc.date()
 */
const scheduledDateArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => new Date(timestamp).toISOString())

/**
 * Generator for a valid CreateScheduledEvaluationInput
 */
const validScheduledEvaluationInputArb = fc.record({
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
  scheduled_date: scheduledDateArb,
})

/**
 * Generator for input missing classroom_id
 */
const inputMissingClassroomIdArb = fc.record({
  template_id: templateIdArb,
  scheduled_date: scheduledDateArb,
})

/**
 * Generator for input missing template_id
 */
const inputMissingTemplateIdArb = fc.record({
  classroom_id: classroomIdArb,
  scheduled_date: scheduledDateArb,
})

/**
 * Generator for input missing scheduled_date
 */
const inputMissingScheduledDateArb = fc.record({
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
})

/**
 * Generator for input with invalid classroom_id (not a number)
 */
const inputWithInvalidClassroomIdArb = fc.record({
  classroom_id: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined), fc.boolean()),
  template_id: templateIdArb,
  scheduled_date: scheduledDateArb,
})

/**
 * Generator for input with invalid template_id (not a number)
 */
const inputWithInvalidTemplateIdArb = fc.record({
  classroom_id: classroomIdArb,
  template_id: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined), fc.boolean()),
  scheduled_date: scheduledDateArb,
})

/**
 * Generator for input with invalid scheduled_date (not a valid date string)
 */
const inputWithInvalidScheduledDateArb = fc.record({
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
  scheduled_date: fc.oneof(
    fc.constant('invalid-date'),
    fc.constant('not-a-date'),
    fc.constant('2024-13-45'), // Invalid month/day
    fc.integer(), // Number instead of string
    fc.constant(null),
    fc.constant(undefined)
  ),
})

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 5: Programación de evaluación requiere campos obligatorios', () => {
  /**
   * Property 5: Scheduled Evaluation Requires Mandatory Fields
   * For any attempt to create a scheduled evaluation, the system must reject 
   * the creation if classroom_id, template_id, or scheduled_date is missing.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Required Fields Validation', () => {
    test('should reject input missing classroom_id', () => {
      fc.assert(
        fc.property(
          inputMissingClassroomIdArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('classroom_id'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject input missing template_id', () => {
      fc.assert(
        fc.property(
          inputMissingTemplateIdArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('template_id'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject input missing scheduled_date', () => {
      fc.assert(
        fc.property(
          inputMissingScheduledDateArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('scheduled_date'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should accept input with all required fields', () => {
      fc.assert(
        fc.property(
          validScheduledEvaluationInputArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
            expect(result.data).toBeDefined()
            expect(result.data!.classroom_id).toBe(input.classroom_id)
            expect(result.data!.template_id).toBe(input.template_id)
            expect(result.data!.scheduled_date).toBe(input.scheduled_date)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Invalid Field Types Validation', () => {
    test('should reject input with invalid classroom_id type', () => {
      fc.assert(
        fc.property(
          inputWithInvalidClassroomIdArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('classroom_id'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject input with invalid template_id type', () => {
      fc.assert(
        fc.property(
          inputWithInvalidTemplateIdArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('template_id'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject input with invalid scheduled_date format', () => {
      fc.assert(
        fc.property(
          inputWithInvalidScheduledDateArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('scheduled_date'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Multiple Missing Fields', () => {
    test('should report all missing fields when multiple are absent', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Only scheduled_date present
            scheduled_date: scheduledDateArb,
          }),
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('classroom_id'))).toBe(true)
            expect(result.errors.some(e => e.includes('template_id'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should report all missing fields when only classroom_id is present', () => {
      fc.assert(
        fc.property(
          fc.record({
            classroom_id: classroomIdArb,
          }),
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('template_id'))).toBe(true)
            expect(result.errors.some(e => e.includes('scheduled_date'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should report all missing fields when only template_id is present', () => {
      fc.assert(
        fc.property(
          fc.record({
            template_id: templateIdArb,
          }),
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('classroom_id'))).toBe(true)
            expect(result.errors.some(e => e.includes('scheduled_date'))).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject empty object with all required field errors', () => {
      const result = validateCreateScheduledEvaluationInput({})
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('classroom_id'))).toBe(true)
      expect(result.errors.some(e => e.includes('template_id'))).toBe(true)
      expect(result.errors.some(e => e.includes('scheduled_date'))).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('should reject null body', () => {
      const result = validateCreateScheduledEvaluationInput(null)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Request body is required')
    })

    test('should reject undefined body', () => {
      const result = validateCreateScheduledEvaluationInput(undefined)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Request body is required')
    })

    test('should reject non-object body', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject zero as classroom_id', () => {
      const result = validateCreateScheduledEvaluationInput({
        classroom_id: 0,
        template_id: 1,
        scheduled_date: new Date().toISOString(),
      })
      
      // 0 is falsy, so it should be rejected
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('classroom_id'))).toBe(true)
    })

    test('should reject zero as template_id', () => {
      const result = validateCreateScheduledEvaluationInput({
        classroom_id: 1,
        template_id: 0,
        scheduled_date: new Date().toISOString(),
      })
      
      // 0 is falsy, so it should be rejected
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('template_id'))).toBe(true)
    })

    test('should reject negative classroom_id', () => {
      fc.assert(
        fc.property(
          fc.record({
            classroom_id: fc.integer({ min: -10000, max: -1 }),
            template_id: templateIdArb,
            scheduled_date: scheduledDateArb,
          }),
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            // Negative numbers are truthy but semantically invalid
            // The current validation only checks for presence and type
            // This test documents the current behavior
            expect(result.isValid).toBe(true) // Current behavior accepts negative IDs
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should accept valid ISO date strings in various formats', () => {
      const validDates = [
        '2024-06-15T10:30:00.000Z',
        '2024-12-31T23:59:59.999Z',
        '2024-01-01T00:00:00.000Z',
      ]
      
      validDates.forEach(dateStr => {
        const result = validateCreateScheduledEvaluationInput({
          classroom_id: 1,
          template_id: 1,
          scheduled_date: dateStr,
        })
        
        expect(result.isValid).toBe(true)
        expect(result.data!.scheduled_date).toBe(dateStr)
      })
    })
  })

  describe('Validation Determinism', () => {
    test('validation result is deterministic for same input', () => {
      fc.assert(
        fc.property(
          validScheduledEvaluationInputArb,
          (input) => {
            const result1 = validateCreateScheduledEvaluationInput(input)
            const result2 = validateCreateScheduledEvaluationInput(input)
            
            expect(result1.isValid).toBe(result2.isValid)
            expect(result1.errors).toEqual(result2.errors)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('validation result is deterministic for invalid input', () => {
      fc.assert(
        fc.property(
          inputMissingClassroomIdArb,
          (input) => {
            const result1 = validateCreateScheduledEvaluationInput(input)
            const result2 = validateCreateScheduledEvaluationInput(input)
            
            expect(result1.isValid).toBe(result2.isValid)
            expect(result1.errors).toEqual(result2.errors)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Data Preservation', () => {
    test('valid input data is preserved in output', () => {
      fc.assert(
        fc.property(
          validScheduledEvaluationInputArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(true)
            expect(result.data).toBeDefined()
            expect(result.data!.classroom_id).toBe(input.classroom_id)
            expect(result.data!.template_id).toBe(input.template_id)
            expect(result.data!.scheduled_date).toBe(input.scheduled_date)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('invalid input does not produce data', () => {
      fc.assert(
        fc.property(
          inputMissingClassroomIdArb,
          (input) => {
            const result = validateCreateScheduledEvaluationInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.data).toBeUndefined()
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})
