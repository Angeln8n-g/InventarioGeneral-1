/**
 * Overdue Evaluations - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 9: Evaluaciones vencidas se marcan automáticamente
 * 
 * Property Description:
 * Para cualquier evaluación programada con fecha pasada y estado 'pending', 
 * el sistema debe retornar estado 'overdue' al consultarla.
 * 
 * **Validates: Requirements 1.6**
 */

import * as fc from 'fast-check'
import type { EvaluationStatus, ScheduledEvaluation, ScheduledEvaluationWithDetails, SpaceType } from '@/types/evaluations'

// ============================================================================
// Overdue Marking Logic (extracted from src/lib/supabase-client.ts)
// ============================================================================

/**
 * Determines if an evaluation should be marked as overdue
 * An evaluation is overdue if:
 * - Its status is 'pending'
 * - Its scheduled_date is in the past (before current time)
 * 
 * @param evaluation - The scheduled evaluation to check
 * @param currentTime - The current time to compare against (defaults to now)
 * @returns The evaluation with potentially updated status
 */
function markOverdueIfApplicable<T extends ScheduledEvaluation>(
  evaluation: T,
  currentTime: Date = new Date()
): T {
  const scheduledDate = new Date(evaluation.scheduled_date)
  if (evaluation.status === 'pending' && scheduledDate < currentTime) {
    return { ...evaluation, status: 'overdue' as EvaluationStatus }
  }
  return evaluation
}

/**
 * Processes a list of evaluations and marks overdue ones
 * @param evaluations - List of scheduled evaluations
 * @param currentTime - The current time to compare against
 * @returns List of evaluations with overdue status applied where applicable
 */
function processEvaluationsForOverdue<T extends ScheduledEvaluation>(
  evaluations: T[],
  currentTime: Date = new Date()
): T[] {
  return evaluations.map(evaluation => markOverdueIfApplicable(evaluation, currentTime))
}

/**
 * Checks if an evaluation is overdue based on its date and status
 * @param scheduledDate - The scheduled date of the evaluation
 * @param status - The current status of the evaluation
 * @param currentTime - The current time to compare against
 * @returns true if the evaluation should be marked as overdue
 */
function isOverdue(
  scheduledDate: Date,
  status: EvaluationStatus,
  currentTime: Date = new Date()
): boolean {
  return status === 'pending' && scheduledDate < currentTime
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid evaluation IDs (positive integers)
 */
const evaluationIdArb = fc.integer({ min: 1, max: 100000 })

/**
 * Generator for valid classroom IDs (positive integers)
 */
const classroomIdArb = fc.integer({ min: 1, max: 10000 })

/**
 * Generator for valid template IDs (positive integers)
 */
const templateIdArb = fc.integer({ min: 1, max: 10000 })

/**
 * Generator for valid space types
 */
const spaceTypeArb = fc.constantFrom<SpaceType>('training_room', 'warehouse', 'external_plant')

/**
 * Generator for evaluation statuses
 */
const evaluationStatusArb = fc.constantFrom<EvaluationStatus>('pending', 'completed', 'overdue', 'cancelled')

/**
 * Generator for non-pending statuses (completed, overdue, cancelled)
 */
const nonPendingStatusArb = fc.constantFrom<EvaluationStatus>('completed', 'overdue', 'cancelled')

/**
 * Generator for past dates (before a reference time)
 * Generates dates from 1 minute to 365 days in the past
 */
const pastDateArb = (referenceTime: Date) => fc.integer({ min: 1, max: 365 * 24 * 60 }).map(minutesAgo => {
  const date = new Date(referenceTime.getTime() - minutesAgo * 60 * 1000)
  return date
})

/**
 * Generator for future dates (after a reference time)
 * Generates dates from 1 minute to 365 days in the future
 */
const futureDateArb = (referenceTime: Date) => fc.integer({ min: 1, max: 365 * 24 * 60 }).map(minutesAhead => {
  const date = new Date(referenceTime.getTime() + minutesAhead * 60 * 1000)
  return date
})

/**
 * Generator for ISO date strings
 * Using integer timestamps to avoid invalid date issues with fc.date()
 */
const isoDateStringArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => new Date(timestamp).toISOString())

/**
 * Generator for a base scheduled evaluation (without status-specific constraints)
 */
const baseScheduledEvaluationArb = fc.record({
  id: evaluationIdArb,
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
  scheduled_date: isoDateStringArb,
  status: evaluationStatusArb,
  created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
})

/**
 * Generator for a pending evaluation with a past date (should become overdue)
 */
const pendingPastEvaluationArb = (referenceTime: Date) => fc.record({
  id: evaluationIdArb,
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
  scheduled_date: pastDateArb(referenceTime).map(d => d.toISOString()),
  status: fc.constant<EvaluationStatus>('pending'),
  created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
})

/**
 * Generator for a pending evaluation with a future date (should stay pending)
 */
const pendingFutureEvaluationArb = (referenceTime: Date) => fc.record({
  id: evaluationIdArb,
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
  scheduled_date: futureDateArb(referenceTime).map(d => d.toISOString()),
  status: fc.constant<EvaluationStatus>('pending'),
  created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
})

/**
 * Generator for a non-pending evaluation with a past date (should NOT change status)
 */
const nonPendingPastEvaluationArb = (referenceTime: Date) => fc.record({
  id: evaluationIdArb,
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
  scheduled_date: pastDateArb(referenceTime).map(d => d.toISOString()),
  status: nonPendingStatusArb,
  created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
})

/**
 * Generator for ScheduledEvaluationWithDetails
 */
const scheduledEvaluationWithDetailsArb = (referenceTime: Date) => fc.record({
  id: evaluationIdArb,
  classroom_id: classroomIdArb,
  template_id: templateIdArb,
  scheduled_date: fc.oneof(
    pastDateArb(referenceTime).map(d => d.toISOString()),
    futureDateArb(referenceTime).map(d => d.toISOString())
  ),
  status: evaluationStatusArb,
  created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
  classroom: fc.record({
    id: classroomIdArb,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    location: fc.string({ minLength: 1, maxLength: 200 }),
    responsible_person: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  }),
  template: fc.record({
    id: templateIdArb,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    space_type: spaceTypeArb,
  }),
})

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 9: Evaluaciones vencidas se marcan automáticamente', () => {
  /**
   * Property 9: Overdue Evaluations Are Automatically Marked
   * For any scheduled evaluation with a past date and 'pending' status,
   * the system must return 'overdue' status when queried.
   * 
   * **Validates: Requirements 1.6**
   */
  
  // Use a fixed reference time for deterministic tests
  const referenceTime = new Date('2024-06-15T12:00:00.000Z')

  describe('Core Property: Pending evaluations with past dates become overdue', () => {
    test('should mark pending evaluation as overdue when scheduled_date is in the past', () => {
      fc.assert(
        fc.property(
          pendingPastEvaluationArb(referenceTime),
          (evaluation) => {
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            // The evaluation should now have 'overdue' status
            expect(result.status).toBe('overdue')
            
            // All other fields should remain unchanged
            expect(result.id).toBe(evaluation.id)
            expect(result.classroom_id).toBe(evaluation.classroom_id)
            expect(result.template_id).toBe(evaluation.template_id)
            expect(result.scheduled_date).toBe(evaluation.scheduled_date)
            expect(result.created_by).toBe(evaluation.created_by)
            expect(result.created_at).toBe(evaluation.created_at)
            expect(result.updated_at).toBe(evaluation.updated_at)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should NOT mark pending evaluation as overdue when scheduled_date is in the future', () => {
      fc.assert(
        fc.property(
          pendingFutureEvaluationArb(referenceTime),
          (evaluation) => {
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            // The evaluation should remain 'pending'
            expect(result.status).toBe('pending')
            
            // All fields should remain unchanged
            expect(result).toEqual(evaluation)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Non-pending evaluations should not change status', () => {
    test('should NOT change status of completed evaluations regardless of date', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: evaluationIdArb,
            classroom_id: classroomIdArb,
            template_id: templateIdArb,
            scheduled_date: pastDateArb(referenceTime).map(d => d.toISOString()),
            status: fc.constant<EvaluationStatus>('completed'),
            created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
            created_at: isoDateStringArb,
            updated_at: isoDateStringArb,
          }),
          (evaluation) => {
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            // Status should remain 'completed'
            expect(result.status).toBe('completed')
            expect(result).toEqual(evaluation)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should NOT change status of already overdue evaluations', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: evaluationIdArb,
            classroom_id: classroomIdArb,
            template_id: templateIdArb,
            scheduled_date: pastDateArb(referenceTime).map(d => d.toISOString()),
            status: fc.constant<EvaluationStatus>('overdue'),
            created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
            created_at: isoDateStringArb,
            updated_at: isoDateStringArb,
          }),
          (evaluation) => {
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            // Status should remain 'overdue'
            expect(result.status).toBe('overdue')
            expect(result).toEqual(evaluation)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should NOT change status of cancelled evaluations regardless of date', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: evaluationIdArb,
            classroom_id: classroomIdArb,
            template_id: templateIdArb,
            scheduled_date: pastDateArb(referenceTime).map(d => d.toISOString()),
            status: fc.constant<EvaluationStatus>('cancelled'),
            created_by: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
            created_at: isoDateStringArb,
            updated_at: isoDateStringArb,
          }),
          (evaluation) => {
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            // Status should remain 'cancelled'
            expect(result.status).toBe('cancelled')
            expect(result).toEqual(evaluation)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should NOT change any non-pending status with past date', () => {
      fc.assert(
        fc.property(
          nonPendingPastEvaluationArb(referenceTime),
          (evaluation) => {
            const originalStatus = evaluation.status
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            // Status should remain unchanged
            expect(result.status).toBe(originalStatus)
            expect(result).toEqual(evaluation)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Batch processing of evaluations', () => {
    test('should correctly process a list of mixed evaluations', () => {
      fc.assert(
        fc.property(
          fc.array(baseScheduledEvaluationArb, { minLength: 1, maxLength: 50 }),
          (evaluations) => {
            const results = processEvaluationsForOverdue(evaluations, referenceTime)
            
            // Same number of evaluations
            expect(results.length).toBe(evaluations.length)
            
            // Check each evaluation
            results.forEach((result, index) => {
              const original = evaluations[index]
              const scheduledDate = new Date(original.scheduled_date)
              const isPast = scheduledDate < referenceTime
              
              if (original.status === 'pending' && isPast) {
                // Should be marked as overdue
                expect(result.status).toBe('overdue')
              } else {
                // Should remain unchanged
                expect(result.status).toBe(original.status)
              }
              
              // All other fields should be preserved
              expect(result.id).toBe(original.id)
              expect(result.classroom_id).toBe(original.classroom_id)
              expect(result.template_id).toBe(original.template_id)
              expect(result.scheduled_date).toBe(original.scheduled_date)
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    test('should handle empty list of evaluations', () => {
      const results = processEvaluationsForOverdue([], referenceTime)
      expect(results).toEqual([])
    })
  })

  describe('isOverdue helper function', () => {
    test('should return true for pending status with past date', () => {
      fc.assert(
        fc.property(
          pastDateArb(referenceTime),
          (pastDate) => {
            const result = isOverdue(pastDate, 'pending', referenceTime)
            expect(result).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return false for pending status with future date', () => {
      fc.assert(
        fc.property(
          futureDateArb(referenceTime),
          (futureDate) => {
            const result = isOverdue(futureDate, 'pending', referenceTime)
            expect(result).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return false for non-pending status regardless of date', () => {
      fc.assert(
        fc.property(
          pastDateArb(referenceTime),
          nonPendingStatusArb,
          (pastDate, status) => {
            const result = isOverdue(pastDate, status, referenceTime)
            expect(result).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Edge cases', () => {
    test('should handle evaluation scheduled exactly at reference time', () => {
      const evaluation: ScheduledEvaluation = {
        id: 1,
        classroom_id: 1,
        template_id: 1,
        scheduled_date: referenceTime.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const result = markOverdueIfApplicable(evaluation, referenceTime)
      
      // Exactly at reference time is NOT past, so should remain pending
      expect(result.status).toBe('pending')
    })

    test('should handle evaluation scheduled 1 millisecond before reference time', () => {
      const oneMillisecondBefore = new Date(referenceTime.getTime() - 1)
      const evaluation: ScheduledEvaluation = {
        id: 1,
        classroom_id: 1,
        template_id: 1,
        scheduled_date: oneMillisecondBefore.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const result = markOverdueIfApplicable(evaluation, referenceTime)
      
      // 1 millisecond before is past, so should be overdue
      expect(result.status).toBe('overdue')
    })

    test('should handle evaluation scheduled 1 millisecond after reference time', () => {
      const oneMillisecondAfter = new Date(referenceTime.getTime() + 1)
      const evaluation: ScheduledEvaluation = {
        id: 1,
        classroom_id: 1,
        template_id: 1,
        scheduled_date: oneMillisecondAfter.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const result = markOverdueIfApplicable(evaluation, referenceTime)
      
      // 1 millisecond after is future, so should remain pending
      expect(result.status).toBe('pending')
    })

    test('should handle very old dates (years in the past)', () => {
      const veryOldDate = new Date('2010-01-01T00:00:00.000Z')
      const evaluation: ScheduledEvaluation = {
        id: 1,
        classroom_id: 1,
        template_id: 1,
        scheduled_date: veryOldDate.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const result = markOverdueIfApplicable(evaluation, referenceTime)
      
      expect(result.status).toBe('overdue')
    })

    test('should handle dates far in the future', () => {
      const farFutureDate = new Date('2050-12-31T23:59:59.999Z')
      const evaluation: ScheduledEvaluation = {
        id: 1,
        classroom_id: 1,
        template_id: 1,
        scheduled_date: farFutureDate.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const result = markOverdueIfApplicable(evaluation, referenceTime)
      
      expect(result.status).toBe('pending')
    })
  })

  describe('Data integrity', () => {
    test('should preserve all fields except status when marking as overdue', () => {
      fc.assert(
        fc.property(
          pendingPastEvaluationArb(referenceTime),
          (evaluation) => {
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            // Only status should change
            expect(result.id).toBe(evaluation.id)
            expect(result.classroom_id).toBe(evaluation.classroom_id)
            expect(result.template_id).toBe(evaluation.template_id)
            expect(result.scheduled_date).toBe(evaluation.scheduled_date)
            expect(result.created_by).toBe(evaluation.created_by)
            expect(result.created_at).toBe(evaluation.created_at)
            expect(result.updated_at).toBe(evaluation.updated_at)
            
            // Status should be overdue
            expect(result.status).toBe('overdue')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should not mutate the original evaluation object', () => {
      fc.assert(
        fc.property(
          pendingPastEvaluationArb(referenceTime),
          (evaluation) => {
            const originalStatus = evaluation.status
            const originalCopy = { ...evaluation }
            
            markOverdueIfApplicable(evaluation, referenceTime)
            
            // Original should be unchanged
            expect(evaluation.status).toBe(originalStatus)
            expect(evaluation).toEqual(originalCopy)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Determinism', () => {
    test('should produce the same result for the same input', () => {
      fc.assert(
        fc.property(
          baseScheduledEvaluationArb,
          (evaluation) => {
            const result1 = markOverdueIfApplicable(evaluation, referenceTime)
            const result2 = markOverdueIfApplicable(evaluation, referenceTime)
            
            expect(result1).toEqual(result2)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('batch processing should be deterministic', () => {
      fc.assert(
        fc.property(
          fc.array(baseScheduledEvaluationArb, { minLength: 1, maxLength: 20 }),
          (evaluations) => {
            const results1 = processEvaluationsForOverdue(evaluations, referenceTime)
            const results2 = processEvaluationsForOverdue(evaluations, referenceTime)
            
            expect(results1).toEqual(results2)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('ScheduledEvaluationWithDetails support', () => {
    test('should correctly process evaluations with details', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationWithDetailsArb(referenceTime),
          (evaluation) => {
            const scheduledDate = new Date(evaluation.scheduled_date)
            const isPast = scheduledDate < referenceTime
            
            const result = markOverdueIfApplicable(evaluation, referenceTime)
            
            if (evaluation.status === 'pending' && isPast) {
              expect(result.status).toBe('overdue')
            } else {
              expect(result.status).toBe(evaluation.status)
            }
            
            // Nested objects should be preserved
            expect(result.classroom).toEqual(evaluation.classroom)
            expect(result.template).toEqual(evaluation.template)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
