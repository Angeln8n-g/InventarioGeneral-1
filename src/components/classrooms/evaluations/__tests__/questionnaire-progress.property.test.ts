/**
 * Questionnaire Progress - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 24: Progreso de cuestionario refleja respuestas
 * 
 * Property Description:
 * Para cualquier estado del cuestionario, el porcentaje de progreso debe ser igual a 
 * (preguntas respondidas / total de preguntas) × 100.
 * 
 * **Validates: Requirements 7.4**
 */

import * as fc from 'fast-check'
import type { ResponseType } from '@/types/evaluations'

/**
 * Response state for a single question (matching QuestionnaireForm's internal state)
 */
interface ResponseState {
  response: ResponseType | null
  observation: string
}

/**
 * Progress calculation result
 */
interface ProgressResult {
  answered: number
  total: number
  percentage: number
}

/**
 * Calculates questionnaire progress based on responses
 * This is a pure function extracted from QuestionnaireForm's progress calculation logic
 * 
 * @param totalQuestions - Total number of questions in the questionnaire
 * @param responses - Map of question IDs to their response states
 * @returns Progress result with answered count, total count, and percentage
 * 
 * Validates: Requirement 7.4 - Progress bar showing answered questions
 */
export function calculateQuestionnaireProgress(
  totalQuestions: number,
  responses: Record<number, ResponseState>
): ProgressResult {
  const total = totalQuestions
  const answered = Object.values(responses).filter(r => r.response !== null).length
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0
  
  return { answered, total, percentage }
}

describe('Feature: classroom-evaluation-system, Property 24: Progreso de cuestionario refleja respuestas', () => {
  /**
   * Property 24: Questionnaire Progress Reflects Responses
   * For any questionnaire state:
   * - Progress percentage equals (answered questions / total questions) × 100
   * - Percentage is always between 0 and 100
   * - Percentage is correctly rounded
   * 
   * **Validates: Requirements 7.4**
   */
  describe('Questionnaire Progress Calculation', () => {
    // Arbitraries for generating test data
    const responseTypeArb = fc.constantFrom<ResponseType>('yes', 'no', 'not_applicable')
    const nullableResponseTypeArb = fc.oneof(
      fc.constant<ResponseType | null>(null),
      responseTypeArb
    )
    
    const responseStateArb = fc.record<ResponseState>({
      response: nullableResponseTypeArb,
      observation: fc.string({ maxLength: 100 })
    })

    /**
     * Generates a responses map with a specific number of questions
     */
    const responsesMapArb = (minQuestions: number, maxQuestions: number) =>
      fc.integer({ min: minQuestions, max: maxQuestions }).chain(numQuestions =>
        fc.array(responseStateArb, { minLength: numQuestions, maxLength: numQuestions })
          .map(responses => {
            const map: Record<number, ResponseState> = {}
            responses.forEach((response, index) => {
              map[index + 1] = response
            })
            return { numQuestions, responses: map }
          })
      )

    test('progress percentage equals (answered / total) × 100 for any questionnaire state', () => {
      fc.assert(
        fc.property(
          responsesMapArb(1, 50),
          ({ numQuestions, responses }) => {
            const result = calculateQuestionnaireProgress(numQuestions, responses)
            
            const answeredCount = Object.values(responses).filter(r => r.response !== null).length
            const expectedPercentage = Math.round((answeredCount / numQuestions) * 100)
            
            expect(result.answered).toBe(answeredCount)
            expect(result.total).toBe(numQuestions)
            expect(result.percentage).toBe(expectedPercentage)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('progress percentage is always between 0 and 100', () => {
      fc.assert(
        fc.property(
          responsesMapArb(1, 50),
          ({ numQuestions, responses }) => {
            const result = calculateQuestionnaireProgress(numQuestions, responses)
            
            expect(result.percentage).toBeGreaterThanOrEqual(0)
            expect(result.percentage).toBeLessThanOrEqual(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('answered count is always less than or equal to total', () => {
      fc.assert(
        fc.property(
          responsesMapArb(1, 50),
          ({ numQuestions, responses }) => {
            const result = calculateQuestionnaireProgress(numQuestions, responses)
            
            expect(result.answered).toBeLessThanOrEqual(result.total)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('answered count is always non-negative', () => {
      fc.assert(
        fc.property(
          responsesMapArb(1, 50),
          ({ numQuestions, responses }) => {
            const result = calculateQuestionnaireProgress(numQuestions, responses)
            
            expect(result.answered).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('percentage is 0 when no questions are answered', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (numQuestions) => {
            // Create responses with all null (unanswered)
            const responses: Record<number, ResponseState> = {}
            for (let i = 1; i <= numQuestions; i++) {
              responses[i] = { response: null, observation: '' }
            }
            
            const result = calculateQuestionnaireProgress(numQuestions, responses)
            
            expect(result.answered).toBe(0)
            expect(result.percentage).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('percentage is 100 when all questions are answered', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.array(responseTypeArb, { minLength: 1, maxLength: 50 }),
          (numQuestions, responseTypes) => {
            // Create responses with all answered
            const responses: Record<number, ResponseState> = {}
            for (let i = 1; i <= numQuestions; i++) {
              responses[i] = { 
                response: responseTypes[i % responseTypes.length], 
                observation: '' 
              }
            }
            
            const result = calculateQuestionnaireProgress(numQuestions, responses)
            
            expect(result.answered).toBe(numQuestions)
            expect(result.percentage).toBe(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('percentage is correctly rounded to nearest integer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (total, answered) => {
            // Ensure answered doesn't exceed total
            const actualAnswered = Math.min(answered, total)
            
            // Create responses
            const responses: Record<number, ResponseState> = {}
            for (let i = 1; i <= total; i++) {
              responses[i] = { 
                response: i <= actualAnswered ? 'yes' : null, 
                observation: '' 
              }
            }
            
            const result = calculateQuestionnaireProgress(total, responses)
            
            // Verify rounding
            const exactPercentage = (actualAnswered / total) * 100
            const expectedRounded = Math.round(exactPercentage)
            
            expect(result.percentage).toBe(expectedRounded)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('progress calculation is deterministic for same input', () => {
      fc.assert(
        fc.property(
          responsesMapArb(1, 50),
          ({ numQuestions, responses }) => {
            const result1 = calculateQuestionnaireProgress(numQuestions, responses)
            const result2 = calculateQuestionnaireProgress(numQuestions, responses)
            
            expect(result1.answered).toBe(result2.answered)
            expect(result1.total).toBe(result2.total)
            expect(result1.percentage).toBe(result2.percentage)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('empty questionnaire (0 questions) returns 0 percentage', () => {
      const result = calculateQuestionnaireProgress(0, {})
      
      expect(result.answered).toBe(0)
      expect(result.total).toBe(0)
      expect(result.percentage).toBe(0)
    })

    test('response type does not affect answered count (yes, no, not_applicable all count)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.array(responseTypeArb, { minLength: 1, maxLength: 50 }),
          (numQuestions, responseTypes) => {
            // Create responses with various response types
            const responses: Record<number, ResponseState> = {}
            for (let i = 1; i <= numQuestions; i++) {
              responses[i] = { 
                response: responseTypes[i % responseTypes.length], 
                observation: '' 
              }
            }
            
            const result = calculateQuestionnaireProgress(numQuestions, responses)
            
            // All responses should be counted regardless of type
            expect(result.answered).toBe(numQuestions)
            expect(result.percentage).toBe(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('only null responses are considered unanswered', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }),
          fc.integer({ min: 1, max: 49 }),
          (total, nullCount) => {
            // Ensure nullCount doesn't exceed total
            const actualNullCount = Math.min(nullCount, total)
            const answeredCount = total - actualNullCount
            
            // Create responses with some null and some answered
            const responses: Record<number, ResponseState> = {}
            for (let i = 1; i <= total; i++) {
              responses[i] = { 
                response: i <= answeredCount ? 'yes' : null, 
                observation: '' 
              }
            }
            
            const result = calculateQuestionnaireProgress(total, responses)
            
            expect(result.answered).toBe(answeredCount)
            expect(result.total).toBe(total)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('observation field does not affect progress calculation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.string({ maxLength: 500 }),
          (numQuestions, observation) => {
            // Create responses with observations
            const responsesWithObs: Record<number, ResponseState> = {}
            const responsesWithoutObs: Record<number, ResponseState> = {}
            
            for (let i = 1; i <= numQuestions; i++) {
              responsesWithObs[i] = { response: 'no', observation }
              responsesWithoutObs[i] = { response: 'no', observation: '' }
            }
            
            const resultWithObs = calculateQuestionnaireProgress(numQuestions, responsesWithObs)
            const resultWithoutObs = calculateQuestionnaireProgress(numQuestions, responsesWithoutObs)
            
            expect(resultWithObs.answered).toBe(resultWithoutObs.answered)
            expect(resultWithObs.percentage).toBe(resultWithoutObs.percentage)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('progress increases monotonically as more questions are answered', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }),
          (numQuestions) => {
            let previousPercentage = 0
            
            for (let answered = 0; answered <= numQuestions; answered++) {
              const responses: Record<number, ResponseState> = {}
              for (let i = 1; i <= numQuestions; i++) {
                responses[i] = { 
                  response: i <= answered ? 'yes' : null, 
                  observation: '' 
                }
              }
              
              const result = calculateQuestionnaireProgress(numQuestions, responses)
              
              expect(result.percentage).toBeGreaterThanOrEqual(previousPercentage)
              previousPercentage = result.percentage
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
