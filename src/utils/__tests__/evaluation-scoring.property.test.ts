/**
 * Evaluation Scoring Utility - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 1: Cálculo de puntuación sigue la fórmula definida
 * 
 * Property Description:
 * Para cualquier conjunto de respuestas de evaluación, la puntuación total debe ser igual 
 * a la cantidad de respuestas "Sí", y el máximo posible debe ser igual al total de respuestas 
 * menos las respuestas "No aplica".
 * 
 * **Validates: Requirements 4.1**
 */

import * as fc from 'fast-check'
import { 
  calculateScore, 
  ResponseWithCategory 
} from '../evaluation-scoring'
import type { ResponseType, QuestionCategory } from '@/types/evaluations'

describe('Feature: classroom-evaluation-system, Property 1: Cálculo de puntuación sigue la fórmula definida', () => {
  /**
   * Property 1: Score Calculation Formula
   * For any set of evaluation responses:
   * - totalScore equals count of 'yes' responses
   * - maxPossibleScore equals total responses minus 'not_applicable' responses
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Score Calculation', () => {
    // Arbitraries for generating test data
    const responseTypeArb = fc.constantFrom<ResponseType>('yes', 'no', 'not_applicable')
    const categoryArb = fc.constantFrom<QuestionCategory>('organization', 'cleanliness', 'maintenance')
    
    const responseWithCategoryArb = fc.record<ResponseWithCategory>({
      response: responseTypeArb,
      category: categoryArb
    })

    test('totalScore equals count of yes responses for any set of responses', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const yesCount = responses.filter(r => r.response === 'yes').length
            const result = calculateScore(responses)
            
            expect(result.totalScore).toBe(yesCount)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('maxPossibleScore equals total responses minus not_applicable responses', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const notApplicableCount = responses.filter(r => r.response === 'not_applicable').length
            const applicableCount = responses.length - notApplicableCount
            const result = calculateScore(responses)
            
            expect(result.maxPossibleScore).toBe(applicableCount)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should calculate score correctly for any set of responses (combined property)', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const yesCount = responses.filter(r => r.response === 'yes').length
            const applicableCount = responses.filter(r => r.response !== 'not_applicable').length
            const result = calculateScore(responses)
            
            expect(result.totalScore).toBe(yesCount)
            expect(result.maxPossibleScore).toBe(applicableCount)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('totalScore is always less than or equal to maxPossibleScore', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            expect(result.totalScore).toBeLessThanOrEqual(result.maxPossibleScore)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('no responses contribute 0 points to totalScore', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record<ResponseWithCategory>({
              response: fc.constant<ResponseType>('no'),
              category: categoryArb
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (responses) => {
            const result = calculateScore(responses)
            expect(result.totalScore).toBe(0)
            expect(result.maxPossibleScore).toBe(responses.length)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('all yes responses give totalScore equal to maxPossibleScore', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record<ResponseWithCategory>({
              response: fc.constant<ResponseType>('yes'),
              category: categoryArb
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (responses) => {
            const result = calculateScore(responses)
            expect(result.totalScore).toBe(responses.length)
            expect(result.maxPossibleScore).toBe(responses.length)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('all not_applicable responses give zero for both scores', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record<ResponseWithCategory>({
              response: fc.constant<ResponseType>('not_applicable'),
              category: categoryArb
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (responses) => {
            const result = calculateScore(responses)
            expect(result.totalScore).toBe(0)
            expect(result.maxPossibleScore).toBe(0)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('empty responses array gives zero for both scores', () => {
      const result = calculateScore([])
      expect(result.totalScore).toBe(0)
      expect(result.maxPossibleScore).toBe(0)
    })

    test('score calculation is deterministic for same input', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result1 = calculateScore(responses)
            const result2 = calculateScore(responses)
            
            expect(result1.totalScore).toBe(result2.totalScore)
            expect(result1.maxPossibleScore).toBe(result2.maxPossibleScore)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('order of responses does not affect total scores', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 2, maxLength: 15 }),
          (responses) => {
            // Shuffle the responses
            const shuffled = [...responses].sort(() => Math.random() - 0.5)
            
            const result1 = calculateScore(responses)
            const result2 = calculateScore(shuffled)
            
            expect(result1.totalScore).toBe(result2.totalScore)
            expect(result1.maxPossibleScore).toBe(result2.maxPossibleScore)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})


/**
 * Feature: classroom-evaluation-system, Property 4: Clasificación de puntuación es consistente con umbrales
 * 
 * Property Description:
 * Para cualquier porcentaje de puntuación, la clasificación debe ser: 
 * "Requiere Atención" si < 70%, "Aceptable" si >= 70% y < 90%, "Excelente" si >= 90%.
 * 
 * **Validates: Requirements 4.4, 4.5, 4.6**
 */

import { classifyScore, SCORE_THRESHOLDS } from '../evaluation-scoring'

describe('Feature: classroom-evaluation-system, Property 4: Clasificación de puntuación es consistente con umbrales', () => {
  /**
   * Property 4: Score Classification Consistency
   * For any score percentage:
   * - percentage < 70 returns 'requires_attention'
   * - percentage >= 70 and < 90 returns 'acceptable'
   * - percentage >= 90 returns 'excellent'
   * 
   * **Validates: Requirements 4.4, 4.5, 4.6**
   */
  describe('Score Classification', () => {
    test('should classify scores correctly for any percentage', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (percentage) => {
            const classification = classifyScore(percentage)
            
            if (percentage < 70) {
              expect(classification).toBe('requires_attention')
            } else if (percentage < 90) {
              expect(classification).toBe('acceptable')
            } else {
              expect(classification).toBe('excellent')
            }
          }
        ),
        { numRuns: 25 }
      )
    })

    test('percentage < 70 always returns requires_attention', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: Math.fround(69.99), noNaN: true }),
          (percentage) => {
            const classification = classifyScore(percentage)
            expect(classification).toBe('requires_attention')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('percentage >= 70 and < 90 always returns acceptable', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 70, max: Math.fround(89.99), noNaN: true }),
          (percentage) => {
            const classification = classifyScore(percentage)
            expect(classification).toBe('acceptable')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('percentage >= 90 always returns excellent', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 90, max: 100, noNaN: true }),
          (percentage) => {
            const classification = classifyScore(percentage)
            expect(classification).toBe('excellent')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('classification is deterministic for same input', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (percentage) => {
            const classification1 = classifyScore(percentage)
            const classification2 = classifyScore(percentage)
            expect(classification1).toBe(classification2)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('boundary value 70 returns acceptable (not requires_attention)', () => {
      const classification = classifyScore(70)
      expect(classification).toBe('acceptable')
    })

    test('boundary value 90 returns excellent (not acceptable)', () => {
      const classification = classifyScore(90)
      expect(classification).toBe('excellent')
    })

    test('classification uses correct thresholds from constants', () => {
      // Verify the thresholds are as expected
      expect(SCORE_THRESHOLDS.REQUIRES_ATTENTION_MAX).toBe(70)
      expect(SCORE_THRESHOLDS.ACCEPTABLE_MAX).toBe(90)
      
      // Test values just below and at thresholds
      expect(classifyScore(69.99)).toBe('requires_attention')
      expect(classifyScore(70)).toBe('acceptable')
      expect(classifyScore(89.99)).toBe('acceptable')
      expect(classifyScore(90)).toBe('excellent')
    })

    test('extreme values are classified correctly', () => {
      expect(classifyScore(0)).toBe('requires_attention')
      expect(classifyScore(100)).toBe('excellent')
    })

    test('classification only returns valid ScoreClassification values', () => {
      const validClassifications = ['requires_attention', 'acceptable', 'excellent']
      
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (percentage) => {
            const classification = classifyScore(percentage)
            expect(validClassifications).toContain(classification)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})


/**
 * Feature: classroom-evaluation-system, Property 3: Puntuaciones por categoría suman correctamente
 * 
 * Property Description:
 * Para cualquier resultado de evaluación, la suma de puntuaciones por categoría 
 * (organización + limpieza + mantenimiento) debe ser igual a la puntuación total, 
 * y la suma de máximos por categoría debe ser igual al máximo posible total.
 * 
 * **Validates: Requirements 4.3**
 */

describe('Feature: classroom-evaluation-system, Property 3: Puntuaciones por categoría suman correctamente', () => {
  /**
   * Property 3: Category Scores Sum Correctly
   * For any evaluation result:
   * - Sum of category scores (organization + cleanliness + maintenance) equals totalScore
   * - Sum of category max values equals maxPossibleScore
   * 
   * **Validates: Requirements 4.3**
   */
  describe('Category Scores Summation', () => {
    // Arbitraries for generating test data
    const responseTypeArb = fc.constantFrom<ResponseType>('yes', 'no', 'not_applicable')
    const categoryArb = fc.constantFrom<QuestionCategory>('organization', 'cleanliness', 'maintenance')
    
    const responseWithCategoryArb = fc.record<ResponseWithCategory>({
      response: responseTypeArb,
      category: categoryArb
    })

    test('sum of category scores equals total score for any set of responses', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            
            const categoryScoreSum = 
              result.categoryScores.organization.score + 
              result.categoryScores.cleanliness.score + 
              result.categoryScores.maintenance.score
            
            expect(categoryScoreSum).toBe(result.totalScore)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('sum of category max values equals max possible score for any set of responses', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            
            const categoryMaxSum = 
              result.categoryScores.organization.max + 
              result.categoryScores.cleanliness.max + 
              result.categoryScores.maintenance.max
            
            expect(categoryMaxSum).toBe(result.maxPossibleScore)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('both category sums are correct simultaneously for any set of responses', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            
            // Sum of category scores
            const categoryScoreSum = 
              result.categoryScores.organization.score + 
              result.categoryScores.cleanliness.score + 
              result.categoryScores.maintenance.score
            
            // Sum of category max values
            const categoryMaxSum = 
              result.categoryScores.organization.max + 
              result.categoryScores.cleanliness.max + 
              result.categoryScores.maintenance.max
            
            expect(categoryScoreSum).toBe(result.totalScore)
            expect(categoryMaxSum).toBe(result.maxPossibleScore)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('category scores are correctly attributed to their respective categories', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            
            // Calculate expected scores per category manually
            const expectedOrganizationScore = responses
              .filter(r => r.category === 'organization' && r.response === 'yes')
              .length
            const expectedCleanlinessScore = responses
              .filter(r => r.category === 'cleanliness' && r.response === 'yes')
              .length
            const expectedMaintenanceScore = responses
              .filter(r => r.category === 'maintenance' && r.response === 'yes')
              .length
            
            expect(result.categoryScores.organization.score).toBe(expectedOrganizationScore)
            expect(result.categoryScores.cleanliness.score).toBe(expectedCleanlinessScore)
            expect(result.categoryScores.maintenance.score).toBe(expectedMaintenanceScore)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('category max values are correctly attributed to their respective categories', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            
            // Calculate expected max per category manually (excluding not_applicable)
            const expectedOrganizationMax = responses
              .filter(r => r.category === 'organization' && r.response !== 'not_applicable')
              .length
            const expectedCleanlinessMax = responses
              .filter(r => r.category === 'cleanliness' && r.response !== 'not_applicable')
              .length
            const expectedMaintenanceMax = responses
              .filter(r => r.category === 'maintenance' && r.response !== 'not_applicable')
              .length
            
            expect(result.categoryScores.organization.max).toBe(expectedOrganizationMax)
            expect(result.categoryScores.cleanliness.max).toBe(expectedCleanlinessMax)
            expect(result.categoryScores.maintenance.max).toBe(expectedMaintenanceMax)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('empty responses array gives zero for all category scores and max values', () => {
      const result = calculateScore([])
      
      expect(result.categoryScores.organization.score).toBe(0)
      expect(result.categoryScores.organization.max).toBe(0)
      expect(result.categoryScores.cleanliness.score).toBe(0)
      expect(result.categoryScores.cleanliness.max).toBe(0)
      expect(result.categoryScores.maintenance.score).toBe(0)
      expect(result.categoryScores.maintenance.max).toBe(0)
      
      // Verify sums still hold
      const categoryScoreSum = 
        result.categoryScores.organization.score + 
        result.categoryScores.cleanliness.score + 
        result.categoryScores.maintenance.score
      const categoryMaxSum = 
        result.categoryScores.organization.max + 
        result.categoryScores.cleanliness.max + 
        result.categoryScores.maintenance.max
      
      expect(categoryScoreSum).toBe(result.totalScore)
      expect(categoryMaxSum).toBe(result.maxPossibleScore)
    })

    test('responses in single category have correct totals', () => {
      // Test with only organization responses
      fc.assert(
        fc.property(
          fc.array(
            fc.record<ResponseWithCategory>({
              response: responseTypeArb,
              category: fc.constant<QuestionCategory>('organization')
            }),
            { minLength: 1, maxLength: 15 }
          ),
          (responses) => {
            const result = calculateScore(responses)
            
            // All scores should be in organization category
            expect(result.categoryScores.organization.score).toBe(result.totalScore)
            expect(result.categoryScores.organization.max).toBe(result.maxPossibleScore)
            
            // Other categories should be zero
            expect(result.categoryScores.cleanliness.score).toBe(0)
            expect(result.categoryScores.cleanliness.max).toBe(0)
            expect(result.categoryScores.maintenance.score).toBe(0)
            expect(result.categoryScores.maintenance.max).toBe(0)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('category score is always less than or equal to category max', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 1, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            
            expect(result.categoryScores.organization.score)
              .toBeLessThanOrEqual(result.categoryScores.organization.max)
            expect(result.categoryScores.cleanliness.score)
              .toBeLessThanOrEqual(result.categoryScores.cleanliness.max)
            expect(result.categoryScores.maintenance.score)
              .toBeLessThanOrEqual(result.categoryScores.maintenance.max)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('category scores are non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(responseWithCategoryArb, { minLength: 0, maxLength: 20 }),
          (responses) => {
            const result = calculateScore(responses)
            
            expect(result.categoryScores.organization.score).toBeGreaterThanOrEqual(0)
            expect(result.categoryScores.organization.max).toBeGreaterThanOrEqual(0)
            expect(result.categoryScores.cleanliness.score).toBeGreaterThanOrEqual(0)
            expect(result.categoryScores.cleanliness.max).toBeGreaterThanOrEqual(0)
            expect(result.categoryScores.maintenance.score).toBeGreaterThanOrEqual(0)
            expect(result.categoryScores.maintenance.max).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})
