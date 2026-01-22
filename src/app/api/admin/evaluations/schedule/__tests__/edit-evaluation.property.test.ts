/**
 * Scheduled Evaluations - Property-Based Tests for Edit Validation
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 10: Solo evaluaciones pendientes son editables
 * 
 * Property Description:
 * Para cualquier intento de editar una evaluación programada, el sistema debe permitir 
 * la edición solo si el estado actual es 'pending'.
 * 
 * **Validates: Requirements 1.7**
 */

import * as fc from 'fast-check'
import type { EvaluationStatus, ScheduledEvaluation } from '@/types/evaluations'

// ============================================================================
// Types for Testing
// ============================================================================

/**
 * Result of attempting to edit a scheduled evaluation
 */
interface EditAttemptResult {
  allowed: boolean
  errorCode?: string
  errorMessage?: string
}

/**
 * Input for updating a scheduled evaluation
 */
interface UpdateScheduledEvaluationInput {
  scheduled_date?: string
  template_id?: number
}

// ============================================================================
// Validation Function (extracted from API route for testing)
// ============================================================================

/**
 * Validates if a scheduled evaluation can be edited based on its status
 * Extracted from src/app/api/admin/evaluations/schedule/[id]/route.ts
 * 
 * @param evaluation - The scheduled evaluation to check
 * @param updateInput - The update data being applied
 * @returns Result indicating if edit is allowed
 */
function canEditScheduledEvaluation(
  evaluation: Pick<ScheduledEvaluation, 'id' | 'status'>,
  updateInput: UpdateScheduledEvaluationInput
): EditAttemptResult {
  // Check if there's anything to update
  if (!updateInput.scheduled_date && !updateInput.template_id) {
    return {
      allowed: false,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: 'At least one field must be provided for update',
    }
  }

  // Only pending evaluations can be edited
  if (evaluation.status !== 'pending') {
    return {
      allowed: false,
      errorCode: 'EVALUATION_NOT_PENDING',
      errorMessage: 'Solo se pueden editar evaluaciones pendientes',
    }
  }

  return { allowed: true }
}

/**
 * All possible evaluation statuses
 */
const ALL_EVALUATION_STATUSES: EvaluationStatus[] = ['pending', 'completed', 'overdue', 'cancelled']

/**
 * Non-pending evaluation statuses (should not be editable)
 */
const NON_PENDING_STATUSES: EvaluationStatus[] = ['completed', 'overdue', 'cancelled']

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid evaluation IDs (positive integers)
 */
const evaluationIdArb = fc.integer({ min: 1, max: 10000 })

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
 * Generator for pending evaluation status
 */
const pendingStatusArb = fc.constant('pending' as EvaluationStatus)

/**
 * Generator for non-pending evaluation statuses
 */
const nonPendingStatusArb = fc.constantFrom(...NON_PENDING_STATUSES)

/**
 * Generator for any evaluation status
 */
const anyStatusArb = fc.constantFrom(...ALL_EVALUATION_STATUSES)

/**
 * Generator for a scheduled evaluation with pending status
 */
const pendingEvaluationArb = fc.record({
  id: evaluationIdArb,
  status: pendingStatusArb,
})

/**
 * Generator for a scheduled evaluation with non-pending status
 */
const nonPendingEvaluationArb = fc.record({
  id: evaluationIdArb,
  status: nonPendingStatusArb,
})

/**
 * Generator for a scheduled evaluation with any status
 */
const anyEvaluationArb = fc.record({
  id: evaluationIdArb,
  status: anyStatusArb,
})

/**
 * Generator for valid update input (at least one field)
 */
const validUpdateInputArb = fc.oneof(
  // Only scheduled_date
  fc.record({
    scheduled_date: scheduledDateArb,
  }),
  // Only template_id
  fc.record({
    template_id: templateIdArb,
  }),
  // Both fields
  fc.record({
    scheduled_date: scheduledDateArb,
    template_id: templateIdArb,
  })
)

/**
 * Generator for update input with only scheduled_date
 */
const updateWithDateOnlyArb = fc.record({
  scheduled_date: scheduledDateArb,
})

/**
 * Generator for update input with only template_id
 */
const updateWithTemplateOnlyArb = fc.record({
  template_id: templateIdArb,
})

/**
 * Generator for update input with both fields
 */
const updateWithBothFieldsArb = fc.record({
  scheduled_date: scheduledDateArb,
  template_id: templateIdArb,
})

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 10: Solo evaluaciones pendientes son editables', () => {
  /**
   * Property 10: Only Pending Evaluations Are Editable
   * For any attempt to edit a scheduled evaluation, the system must allow 
   * the edit only if the current status is 'pending'.
   * 
   * **Validates: Requirements 1.7**
   */
  describe('Pending Status Allows Editing', () => {
    test('should allow editing when status is pending and update has scheduled_date', () => {
      fc.assert(
        fc.property(
          pendingEvaluationArb,
          updateWithDateOnlyArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(true)
            expect(result.errorCode).toBeUndefined()
            expect(result.errorMessage).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should allow editing when status is pending and update has template_id', () => {
      fc.assert(
        fc.property(
          pendingEvaluationArb,
          updateWithTemplateOnlyArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(true)
            expect(result.errorCode).toBeUndefined()
            expect(result.errorMessage).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should allow editing when status is pending and update has both fields', () => {
      fc.assert(
        fc.property(
          pendingEvaluationArb,
          updateWithBothFieldsArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(true)
            expect(result.errorCode).toBeUndefined()
            expect(result.errorMessage).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should allow editing for any valid update input when status is pending', () => {
      fc.assert(
        fc.property(
          pendingEvaluationArb,
          validUpdateInputArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(true)
            expect(result.errorCode).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Non-Pending Status Blocks Editing', () => {
    test('should reject editing when status is completed', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: evaluationIdArb,
            status: fc.constant('completed' as EvaluationStatus),
          }),
          validUpdateInputArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(false)
            expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
            expect(result.errorMessage).toBe('Solo se pueden editar evaluaciones pendientes')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should reject editing when status is overdue', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: evaluationIdArb,
            status: fc.constant('overdue' as EvaluationStatus),
          }),
          validUpdateInputArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(false)
            expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
            expect(result.errorMessage).toBe('Solo se pueden editar evaluaciones pendientes')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should reject editing when status is cancelled', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: evaluationIdArb,
            status: fc.constant('cancelled' as EvaluationStatus),
          }),
          validUpdateInputArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(false)
            expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
            expect(result.errorMessage).toBe('Solo se pueden editar evaluaciones pendientes')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should reject editing for any non-pending status', () => {
      fc.assert(
        fc.property(
          nonPendingEvaluationArb,
          validUpdateInputArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result.allowed).toBe(false)
            expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
            expect(result.errorMessage).toBe('Solo se pueden editar evaluaciones pendientes')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Status-Based Edit Permission Property', () => {
    test('edit permission is determined solely by pending status', () => {
      fc.assert(
        fc.property(
          anyEvaluationArb,
          validUpdateInputArb,
          (evaluation, updateInput) => {
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            // The edit is allowed if and only if the status is 'pending'
            if (evaluation.status === 'pending') {
              expect(result.allowed).toBe(true)
            } else {
              expect(result.allowed).toBe(false)
              expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('edit permission is independent of evaluation ID', () => {
      fc.assert(
        fc.property(
          evaluationIdArb,
          evaluationIdArb,
          anyStatusArb,
          validUpdateInputArb,
          (id1, id2, status, updateInput) => {
            const evaluation1 = { id: id1, status }
            const evaluation2 = { id: id2, status }
            
            const result1 = canEditScheduledEvaluation(evaluation1, updateInput)
            const result2 = canEditScheduledEvaluation(evaluation2, updateInput)
            
            // Same status should produce same edit permission regardless of ID
            expect(result1.allowed).toBe(result2.allowed)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('edit permission is independent of update content when status is non-pending', () => {
      fc.assert(
        fc.property(
          nonPendingEvaluationArb,
          validUpdateInputArb,
          validUpdateInputArb,
          (evaluation, updateInput1, updateInput2) => {
            const result1 = canEditScheduledEvaluation(evaluation, updateInput1)
            const result2 = canEditScheduledEvaluation(evaluation, updateInput2)
            
            // Both should be rejected regardless of update content
            expect(result1.allowed).toBe(false)
            expect(result2.allowed).toBe(false)
            expect(result1.errorCode).toBe(result2.errorCode)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Empty Update Input Validation', () => {
    test('should reject empty update input regardless of status', () => {
      fc.assert(
        fc.property(
          anyEvaluationArb,
          (evaluation) => {
            const emptyInput: UpdateScheduledEvaluationInput = {}
            const result = canEditScheduledEvaluation(evaluation, emptyInput)
            
            expect(result.allowed).toBe(false)
            expect(result.errorCode).toBe('VALIDATION_ERROR')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should reject update with undefined fields', () => {
      fc.assert(
        fc.property(
          pendingEvaluationArb,
          (evaluation) => {
            const undefinedInput: UpdateScheduledEvaluationInput = {
              scheduled_date: undefined,
              template_id: undefined,
            }
            const result = canEditScheduledEvaluation(evaluation, undefinedInput)
            
            expect(result.allowed).toBe(false)
            expect(result.errorCode).toBe('VALIDATION_ERROR')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Validation Determinism', () => {
    test('validation result is deterministic for same evaluation and input', () => {
      fc.assert(
        fc.property(
          anyEvaluationArb,
          validUpdateInputArb,
          (evaluation, updateInput) => {
            const result1 = canEditScheduledEvaluation(evaluation, updateInput)
            const result2 = canEditScheduledEvaluation(evaluation, updateInput)
            
            expect(result1.allowed).toBe(result2.allowed)
            expect(result1.errorCode).toBe(result2.errorCode)
            expect(result1.errorMessage).toBe(result2.errorMessage)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Status Transition Scenarios', () => {
    test('pending evaluation allows any valid field update', () => {
      const updateVariants = [
        { scheduled_date: '2024-06-15T10:00:00.000Z' },
        { template_id: 1 },
        { scheduled_date: '2024-06-15T10:00:00.000Z', template_id: 1 },
        { scheduled_date: '2025-01-01T00:00:00.000Z', template_id: 999 },
      ]
      
      updateVariants.forEach(updateInput => {
        const evaluation = { id: 1, status: 'pending' as EvaluationStatus }
        const result = canEditScheduledEvaluation(evaluation, updateInput)
        
        expect(result.allowed).toBe(true)
      })
    })

    test('completed evaluation rejects all update attempts', () => {
      const updateVariants = [
        { scheduled_date: '2024-06-15T10:00:00.000Z' },
        { template_id: 1 },
        { scheduled_date: '2024-06-15T10:00:00.000Z', template_id: 1 },
      ]
      
      updateVariants.forEach(updateInput => {
        const evaluation = { id: 1, status: 'completed' as EvaluationStatus }
        const result = canEditScheduledEvaluation(evaluation, updateInput)
        
        expect(result.allowed).toBe(false)
        expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
      })
    })

    test('overdue evaluation rejects all update attempts', () => {
      const updateVariants = [
        { scheduled_date: '2024-06-15T10:00:00.000Z' },
        { template_id: 1 },
        { scheduled_date: '2024-06-15T10:00:00.000Z', template_id: 1 },
      ]
      
      updateVariants.forEach(updateInput => {
        const evaluation = { id: 1, status: 'overdue' as EvaluationStatus }
        const result = canEditScheduledEvaluation(evaluation, updateInput)
        
        expect(result.allowed).toBe(false)
        expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
      })
    })

    test('cancelled evaluation rejects all update attempts', () => {
      const updateVariants = [
        { scheduled_date: '2024-06-15T10:00:00.000Z' },
        { template_id: 1 },
        { scheduled_date: '2024-06-15T10:00:00.000Z', template_id: 1 },
      ]
      
      updateVariants.forEach(updateInput => {
        const evaluation = { id: 1, status: 'cancelled' as EvaluationStatus }
        const result = canEditScheduledEvaluation(evaluation, updateInput)
        
        expect(result.allowed).toBe(false)
        expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
      })
    })
  })

  describe('Exhaustive Status Coverage', () => {
    test('all defined statuses are covered by the property', () => {
      // Verify that our test covers all possible statuses
      const allStatuses: EvaluationStatus[] = ['pending', 'completed', 'overdue', 'cancelled']
      const updateInput = { scheduled_date: '2024-06-15T10:00:00.000Z' }
      
      allStatuses.forEach(status => {
        const evaluation = { id: 1, status }
        const result = canEditScheduledEvaluation(evaluation, updateInput)
        
        if (status === 'pending') {
          expect(result.allowed).toBe(true)
        } else {
          expect(result.allowed).toBe(false)
          expect(result.errorCode).toBe('EVALUATION_NOT_PENDING')
        }
      })
    })

    test('only pending status allows editing (exclusive property)', () => {
      fc.assert(
        fc.property(
          anyStatusArb,
          validUpdateInputArb,
          (status, updateInput) => {
            const evaluation = { id: 1, status }
            const result = canEditScheduledEvaluation(evaluation, updateInput)
            
            // This is the core property: allowed === (status === 'pending')
            expect(result.allowed).toBe(status === 'pending')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
