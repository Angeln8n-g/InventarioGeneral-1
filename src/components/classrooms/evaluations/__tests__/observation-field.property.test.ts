/**
 * Observation Field Visibility - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 25: Campo de observación aparece solo para respuestas "No"
 * 
 * Property Description:
 * Para cualquier pregunta con respuesta "No", el campo de observación debe estar visible.
 * Para respuestas "Sí" o "No aplica", el campo debe estar oculto.
 * 
 * **Validates: Requirements 3.3**
 */

import * as fc from 'fast-check'
import type { ResponseType } from '@/types/evaluations'

/**
 * Determines if the observation field should be visible based on the response type.
 * This is a pure function extracted from QuestionnaireForm's observation field visibility logic.
 * 
 * The observation field is shown only when the response is 'no', allowing the evaluator
 * to provide additional context or evidence for negative responses.
 * 
 * @param response - The response type for a question (or null if unanswered)
 * @returns true if the observation field should be visible, false otherwise
 * 
 * Validates: Requirement 3.3 - Show observation field for "No" responses
 */
export function shouldShowObservationField(response: ResponseType | null): boolean {
  return response === 'no'
}

describe('Feature: classroom-evaluation-system, Property 25: Campo de observación aparece solo para respuestas "No"', () => {
  /**
   * Property 25: Observation Field Visibility
   * For any question:
   * - When response is 'no', observation field should be visible (return true)
   * - When response is 'yes' or 'not_applicable', observation field should be hidden (return false)
   * - When response is null (unanswered), observation field should be hidden (return false)
   * 
   * **Validates: Requirements 3.3**
   */
  describe('Observation Field Visibility', () => {
    // Arbitraries for generating test data
    const responseTypeArb = fc.constantFrom<ResponseType>('yes', 'no', 'not_applicable')
    const nullableResponseTypeArb = fc.oneof(
      fc.constant<ResponseType | null>(null),
      responseTypeArb
    )

    test('observation field is visible only when response is "no"', () => {
      fc.assert(
        fc.property(
          nullableResponseTypeArb,
          (response) => {
            const isVisible = shouldShowObservationField(response)
            
            if (response === 'no') {
              expect(isVisible).toBe(true)
            } else {
              expect(isVisible).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('observation field is always visible for "no" responses', () => {
      fc.assert(
        fc.property(
          fc.constant<ResponseType>('no'),
          (response) => {
            const isVisible = shouldShowObservationField(response)
            expect(isVisible).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('observation field is always hidden for "yes" responses', () => {
      fc.assert(
        fc.property(
          fc.constant<ResponseType>('yes'),
          (response) => {
            const isVisible = shouldShowObservationField(response)
            expect(isVisible).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('observation field is always hidden for "not_applicable" responses', () => {
      fc.assert(
        fc.property(
          fc.constant<ResponseType>('not_applicable'),
          (response) => {
            const isVisible = shouldShowObservationField(response)
            expect(isVisible).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('observation field is always hidden for null (unanswered) responses', () => {
      fc.assert(
        fc.property(
          fc.constant<ResponseType | null>(null),
          (response) => {
            const isVisible = shouldShowObservationField(response)
            expect(isVisible).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('visibility is deterministic for the same response', () => {
      fc.assert(
        fc.property(
          nullableResponseTypeArb,
          (response) => {
            const result1 = shouldShowObservationField(response)
            const result2 = shouldShowObservationField(response)
            
            expect(result1).toBe(result2)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('visibility returns boolean type', () => {
      fc.assert(
        fc.property(
          nullableResponseTypeArb,
          (response) => {
            const isVisible = shouldShowObservationField(response)
            expect(typeof isVisible).toBe('boolean')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('exactly one response type shows observation field', () => {
      const responseTypes: (ResponseType | null)[] = ['yes', 'no', 'not_applicable', null]
      const visibleCount = responseTypes.filter(r => shouldShowObservationField(r)).length
      
      expect(visibleCount).toBe(1)
    })

    test('only "no" response type shows observation field among all valid types', () => {
      fc.assert(
        fc.property(
          responseTypeArb,
          (response) => {
            const isVisible = shouldShowObservationField(response)
            
            // Only 'no' should return true
            expect(isVisible).toBe(response === 'no')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Additional tests for multiple questions scenario
   * Validates that observation field visibility is independent per question
   */
  describe('Multiple Questions Observation Field Visibility', () => {
    const responseTypeArb = fc.constantFrom<ResponseType>('yes', 'no', 'not_applicable')
    const nullableResponseTypeArb = fc.oneof(
      fc.constant<ResponseType | null>(null),
      responseTypeArb
    )

    /**
     * Generates a map of question IDs to responses
     */
    const responsesMapArb = fc.array(
      fc.record({
        questionId: fc.integer({ min: 1, max: 1000 }),
        response: nullableResponseTypeArb
      }),
      { minLength: 1, maxLength: 50 }
    )

    test('observation field visibility is independent for each question', () => {
      fc.assert(
        fc.property(
          responsesMapArb,
          (questions) => {
            for (const { response } of questions) {
              const isVisible = shouldShowObservationField(response)
              
              // Each question's visibility depends only on its own response
              if (response === 'no') {
                expect(isVisible).toBe(true)
              } else {
                expect(isVisible).toBe(false)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('count of visible observation fields equals count of "no" responses', () => {
      fc.assert(
        fc.property(
          responsesMapArb,
          (questions) => {
            const noResponseCount = questions.filter(q => q.response === 'no').length
            const visibleFieldCount = questions.filter(q => shouldShowObservationField(q.response)).length
            
            expect(visibleFieldCount).toBe(noResponseCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('changing response from "no" to other hides observation field', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ResponseType>('yes', 'not_applicable'),
          (newResponse) => {
            // Start with 'no' - observation field visible
            const initialVisibility = shouldShowObservationField('no')
            expect(initialVisibility).toBe(true)
            
            // Change to other response - observation field hidden
            const newVisibility = shouldShowObservationField(newResponse)
            expect(newVisibility).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('changing response from other to "no" shows observation field', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant<ResponseType | null>('yes'),
            fc.constant<ResponseType | null>('not_applicable'),
            fc.constant<ResponseType | null>(null)
          ),
          (initialResponse) => {
            // Start with non-'no' response - observation field hidden
            const initialVisibility = shouldShowObservationField(initialResponse)
            expect(initialVisibility).toBe(false)
            
            // Change to 'no' - observation field visible
            const newVisibility = shouldShowObservationField('no')
            expect(newVisibility).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Edge cases and boundary conditions
   */
  describe('Edge Cases', () => {
    test('empty string is not a valid response and should be treated as hidden', () => {
      // Type coercion test - empty string should not show observation field
      const isVisible = shouldShowObservationField('' as unknown as ResponseType | null)
      expect(isVisible).toBe(false)
    })

    test('undefined is treated as hidden', () => {
      const isVisible = shouldShowObservationField(undefined as unknown as ResponseType | null)
      expect(isVisible).toBe(false)
    })

    test('case sensitivity - "No" (capitalized) should not show observation field', () => {
      // The function should be case-sensitive and only accept lowercase 'no'
      const isVisible = shouldShowObservationField('No' as unknown as ResponseType | null)
      expect(isVisible).toBe(false)
    })

    test('case sensitivity - "NO" (uppercase) should not show observation field', () => {
      const isVisible = shouldShowObservationField('NO' as unknown as ResponseType | null)
      expect(isVisible).toBe(false)
    })
  })
})
