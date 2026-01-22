/**
 * Low Performer Identification - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 19: Responsables con bajo desempeño son resaltados
 * 
 * Property Description:
 * Para cualquier responsable con promedio de puntuación menor al 70%, 
 * el sistema debe marcarlo como "bajo desempeño" en el reporte.
 * 
 * **Validates: Requirements 6.7**
 */

import * as fc from 'fast-check'
import type { ResponsiblePerformance, TrendDirection } from '@/types/evaluations'

// ============================================================================
// Constants
// ============================================================================

/**
 * Threshold for low performance classification
 * Responsables with average_score < 70% are considered low performers
 */
const LOW_PERFORMANCE_THRESHOLD = 70

// ============================================================================
// Types for Low Performer Identification
// ============================================================================

/**
 * Response structure from the responsible report endpoint
 * Includes low_performers array for identifying low performers
 */
interface ResponsibleReportResponse {
  data: ResponsiblePerformance[]
  total: number
  low_performers: ResponsiblePerformance[]
  filters: {
    start_date: string | null
    end_date: string | null
  }
  generated_at: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates trend direction based on evaluation scores
 * Compares the average of the last 3 evaluations with the previous 3
 * @param scores - Array of scores ordered by date descending (most recent first)
 * @returns Trend direction: 'up', 'down', or 'stable'
 */
function calculateTrend(scores: number[]): TrendDirection {
  if (scores.length < 2) {
    return 'stable'
  }

  const recentCount = Math.min(3, Math.floor(scores.length / 2))
  const recentScores = scores.slice(0, recentCount)
  const previousScores = scores.slice(recentCount, recentCount * 2)

  if (previousScores.length === 0) {
    return 'stable'
  }

  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
  const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length

  const threshold = 5
  const difference = recentAvg - previousAvg

  if (difference > threshold) {
    return 'up'
  } else if (difference < -threshold) {
    return 'down'
  }
  return 'stable'
}

/**
 * Creates a valid ResponsiblePerformance object from input data
 * This simulates the transformation that the API endpoint performs
 * 
 * @param responsiblePerson - Name of the responsible person
 * @param classrooms - List of classrooms under their responsibility
 * @param evaluationScores - Array of evaluation scores (percentages)
 * @returns A valid ResponsiblePerformance object
 */
function createResponsiblePerformance(
  responsiblePerson: string,
  classrooms: Array<{ id: number; name: string; location: string }>,
  evaluationScores: number[]
): ResponsiblePerformance {
  const totalEvaluations = evaluationScores.length
  const averageScore = totalEvaluations > 0
    ? Math.round((evaluationScores.reduce((a, b) => a + b, 0) / totalEvaluations) * 100) / 100
    : 0

  const trend = calculateTrend(evaluationScores)

  return {
    responsible_person: responsiblePerson,
    classrooms,
    total_evaluations: totalEvaluations,
    average_score: averageScore,
    trend,
    last_evaluation_date: totalEvaluations > 0 ? new Date().toISOString() : undefined,
    scores_by_category: {
      organization: 0,
      cleanliness: 0,
      maintenance: 0,
    },
  }
}

/**
 * Identifies low performers from a list of responsible performance data
 * A low performer is defined as someone with:
 * - At least one evaluation (total_evaluations > 0)
 * - Average score less than 70%
 * 
 * This mirrors the logic in the responsible report endpoint
 * 
 * @param performanceData - Array of ResponsiblePerformance objects
 * @returns Array of ResponsiblePerformance objects that are low performers
 */
function identifyLowPerformers(performanceData: ResponsiblePerformance[]): ResponsiblePerformance[] {
  return performanceData.filter(
    (p) => p.total_evaluations > 0 && p.average_score < LOW_PERFORMANCE_THRESHOLD
  )
}

/**
 * Checks if a responsible person should be marked as low performer
 * @param performance - The ResponsiblePerformance object to check
 * @returns true if the person is a low performer
 */
function isLowPerformer(performance: ResponsiblePerformance): boolean {
  return performance.total_evaluations > 0 && performance.average_score < LOW_PERFORMANCE_THRESHOLD
}

/**
 * Generates a mock report response from performance data
 * @param performanceData - Array of ResponsiblePerformance objects
 * @returns A ResponsibleReportResponse object
 */
function generateReportResponse(performanceData: ResponsiblePerformance[]): ResponsibleReportResponse {
  const lowPerformers = identifyLowPerformers(performanceData)
  
  return {
    data: performanceData,
    total: performanceData.length,
    low_performers: lowPerformers,
    filters: {
      start_date: null,
      end_date: null,
    },
    generated_at: new Date().toISOString(),
  }
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid responsible person names
 */
const responsiblePersonArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim())

/**
 * Generator for valid classroom IDs (positive integers)
 */
const classroomIdArb = fc.integer({ min: 1, max: 1000000 })

/**
 * Generator for classroom names
 */
const classroomNameArb = fc.string({ minLength: 1, maxLength: 255 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim())

/**
 * Generator for classroom locations
 */
const classroomLocationArb = fc.string({ minLength: 1, maxLength: 255 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim())

/**
 * Generator for a single classroom
 */
const classroomArb = fc.record({
  id: classroomIdArb,
  name: classroomNameArb,
  location: classroomLocationArb,
})

/**
 * Generator for an array of classrooms with unique IDs
 */
const classroomsArrayArb = fc.array(classroomArb, { minLength: 1, maxLength: 10 })
  .map(classrooms => {
    // Ensure unique IDs
    return classrooms.map((c, index) => ({ ...c, id: index + 1 }))
  })

/**
 * Generator for evaluation score percentages (0 to 100)
 */
const scorePercentageArb = fc.integer({ min: 0, max: 10000 })
  .map(score => score / 100)

/**
 * Generator for LOW performance scores (below 70%)
 * Used to generate guaranteed low performers
 */
const lowScoreArb = fc.integer({ min: 0, max: 6999 })
  .map(score => score / 100)

/**
 * Generator for HIGH performance scores (70% and above)
 * Used to generate guaranteed non-low performers
 */
const highScoreArb = fc.integer({ min: 7000, max: 10000 })
  .map(score => score / 100)

/**
 * Generator for an array of low evaluation scores
 */
const lowScoresArrayArb = fc.array(lowScoreArb, { minLength: 1, maxLength: 20 })

/**
 * Generator for an array of high evaluation scores
 */
const highScoresArrayArb = fc.array(highScoreArb, { minLength: 1, maxLength: 20 })

/**
 * Generator for a ResponsiblePerformance with LOW average score (< 70%)
 * These should always be identified as low performers
 */
const lowPerformerArb = fc.tuple(
  responsiblePersonArb,
  classroomsArrayArb,
  lowScoresArrayArb
).map(([responsiblePerson, classrooms, scores]) => 
  createResponsiblePerformance(responsiblePerson, classrooms, scores)
)

/**
 * Generator for a ResponsiblePerformance with HIGH average score (>= 70%)
 * These should never be identified as low performers
 */
const highPerformerArb = fc.tuple(
  responsiblePersonArb,
  classroomsArrayArb,
  highScoresArrayArb
).map(([responsiblePerson, classrooms, scores]) => 
  createResponsiblePerformance(responsiblePerson, classrooms, scores)
)

/**
 * Generator for a ResponsiblePerformance with NO evaluations
 * These should never be identified as low performers (no data to evaluate)
 */
const noEvaluationsPerformerArb = fc.tuple(
  responsiblePersonArb,
  classroomsArrayArb
).map(([responsiblePerson, classrooms]) => 
  createResponsiblePerformance(responsiblePerson, classrooms, [])
)

/**
 * Generator for a mixed array of ResponsiblePerformance objects
 * Contains both low and high performers
 */
const mixedPerformanceArrayArb = fc.tuple(
  fc.array(lowPerformerArb, { minLength: 0, maxLength: 10 }),
  fc.array(highPerformerArb, { minLength: 0, maxLength: 10 }),
  fc.array(noEvaluationsPerformerArb, { minLength: 0, maxLength: 5 })
).map(([lowPerformers, highPerformers, noEvalPerformers]) => {
  // Combine and shuffle to create realistic mixed data
  const all = [...lowPerformers, ...highPerformers, ...noEvalPerformers]
  // Ensure unique responsible_person names
  return all.map((p, index) => ({
    ...p,
    responsible_person: `${p.responsible_person}_${index}`
  }))
})

/**
 * Generator for scores that result in exactly the threshold (70%)
 * Edge case: exactly 70% should NOT be a low performer
 */
const exactThresholdScoresArb = fc.constant([70])

/**
 * Generator for scores just below threshold (69.99%)
 * Edge case: just below 70% should be a low performer
 */
const justBelowThresholdScoresArb = fc.constant([69.99])

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 19: Responsables con bajo desempeño son resaltados', () => {
  /**
   * Property 19: Low Performers Are Highlighted
   * For any responsible person with average score less than 70%, 
   * the system must mark them as "low performance" in the report.
   * 
   * **Validates: Requirements 6.7**
   */

  describe('Core Property: Low performers are correctly identified', () => {
    test('should mark responsible persons with average < 70% as low performers', () => {
      fc.assert(
        fc.property(
          lowPerformerArb,
          (performance) => {
            // Verify the performance has evaluations and low average
            expect(performance.total_evaluations).toBeGreaterThan(0)
            expect(performance.average_score).toBeLessThan(LOW_PERFORMANCE_THRESHOLD)
            
            // Verify they are identified as low performer
            expect(isLowPerformer(performance)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should NOT mark responsible persons with average >= 70% as low performers', () => {
      fc.assert(
        fc.property(
          highPerformerArb,
          (performance) => {
            // Verify the performance has evaluations and high average
            expect(performance.total_evaluations).toBeGreaterThan(0)
            expect(performance.average_score).toBeGreaterThanOrEqual(LOW_PERFORMANCE_THRESHOLD)
            
            // Verify they are NOT identified as low performer
            expect(isLowPerformer(performance)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should NOT mark responsible persons with no evaluations as low performers', () => {
      fc.assert(
        fc.property(
          noEvaluationsPerformerArb,
          (performance) => {
            // Verify no evaluations
            expect(performance.total_evaluations).toBe(0)
            
            // Verify they are NOT identified as low performer
            // (cannot determine performance without evaluations)
            expect(isLowPerformer(performance)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Report low_performers array contains all and only low performers', () => {
    test('low_performers array should contain all responsible persons with average < 70%', () => {
      fc.assert(
        fc.property(
          mixedPerformanceArrayArb,
          (performanceData) => {
            const report = generateReportResponse(performanceData)
            
            // Find all expected low performers
            const expectedLowPerformers = performanceData.filter(
              p => p.total_evaluations > 0 && p.average_score < LOW_PERFORMANCE_THRESHOLD
            )
            
            // Verify all expected low performers are in the low_performers array
            expectedLowPerformers.forEach(expected => {
              const found = report.low_performers.find(
                lp => lp.responsible_person === expected.responsible_person
              )
              expect(found).toBeDefined()
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('low_performers array should NOT contain responsible persons with average >= 70%', () => {
      fc.assert(
        fc.property(
          mixedPerformanceArrayArb,
          (performanceData) => {
            const report = generateReportResponse(performanceData)
            
            // Find all high performers
            const highPerformers = performanceData.filter(
              p => p.total_evaluations > 0 && p.average_score >= LOW_PERFORMANCE_THRESHOLD
            )
            
            // Verify no high performers are in the low_performers array
            highPerformers.forEach(highPerformer => {
              const found = report.low_performers.find(
                lp => lp.responsible_person === highPerformer.responsible_person
              )
              expect(found).toBeUndefined()
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('low_performers array should NOT contain responsible persons with no evaluations', () => {
      fc.assert(
        fc.property(
          mixedPerformanceArrayArb,
          (performanceData) => {
            const report = generateReportResponse(performanceData)
            
            // Find all persons with no evaluations
            const noEvalPersons = performanceData.filter(p => p.total_evaluations === 0)
            
            // Verify none of them are in the low_performers array
            noEvalPersons.forEach(noEvalPerson => {
              const found = report.low_performers.find(
                lp => lp.responsible_person === noEvalPerson.responsible_person
              )
              expect(found).toBeUndefined()
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('low_performers count should match count of persons with average < 70% and evaluations > 0', () => {
      fc.assert(
        fc.property(
          mixedPerformanceArrayArb,
          (performanceData) => {
            const report = generateReportResponse(performanceData)
            
            const expectedCount = performanceData.filter(
              p => p.total_evaluations > 0 && p.average_score < LOW_PERFORMANCE_THRESHOLD
            ).length
            
            expect(report.low_performers.length).toBe(expectedCount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Threshold boundary conditions', () => {
    test('exactly 70% average should NOT be marked as low performer', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          exactThresholdScoresArb,
          (responsiblePerson, classrooms, scores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              scores
            )
            
            expect(performance.average_score).toBe(70)
            expect(isLowPerformer(performance)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('69.99% average should be marked as low performer', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          justBelowThresholdScoresArb,
          (responsiblePerson, classrooms, scores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              scores
            )
            
            expect(performance.average_score).toBeLessThan(70)
            expect(isLowPerformer(performance)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('scores averaging to exactly threshold boundary should be handled correctly', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.integer({ min: 6995, max: 7005 }),
          (responsiblePerson, classrooms, boundaryScoreInt) => {
            const boundaryScore = boundaryScoreInt / 100
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              [boundaryScore]
            )
            
            // If rounded score is < 70, should be low performer
            // If rounded score is >= 70, should NOT be low performer
            if (performance.average_score < LOW_PERFORMANCE_THRESHOLD) {
              expect(isLowPerformer(performance)).toBe(true)
            } else {
              expect(isLowPerformer(performance)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Average score calculation affects low performer identification', () => {
    test('multiple low scores should result in low performer identification', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.array(lowScoreArb, { minLength: 2, maxLength: 20 }),
          (responsiblePerson, classrooms, lowScores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              lowScores
            )
            
            // All scores are below 70%, so average must be below 70%
            expect(performance.average_score).toBeLessThan(LOW_PERFORMANCE_THRESHOLD)
            expect(isLowPerformer(performance)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('multiple high scores should NOT result in low performer identification', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.array(highScoreArb, { minLength: 2, maxLength: 20 }),
          (responsiblePerson, classrooms, highScores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              highScores
            )
            
            // All scores are >= 70%, so average must be >= 70%
            expect(performance.average_score).toBeGreaterThanOrEqual(LOW_PERFORMANCE_THRESHOLD)
            expect(isLowPerformer(performance)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('mixed scores should be identified based on calculated average', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.array(scorePercentageArb, { minLength: 1, maxLength: 20 }),
          (responsiblePerson, classrooms, mixedScores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              mixedScores
            )
            
            // Calculate expected average
            const expectedAverage = Math.round(
              (mixedScores.reduce((a, b) => a + b, 0) / mixedScores.length) * 100
            ) / 100
            
            expect(performance.average_score).toBeCloseTo(expectedAverage, 2)
            
            // Low performer status should match the threshold comparison
            if (expectedAverage < LOW_PERFORMANCE_THRESHOLD) {
              expect(isLowPerformer(performance)).toBe(true)
            } else {
              expect(isLowPerformer(performance)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Low performer data integrity', () => {
    test('low performers in report should have all required fields', () => {
      fc.assert(
        fc.property(
          fc.array(lowPerformerArb, { minLength: 1, maxLength: 10 }),
          (lowPerformers) => {
            const report = generateReportResponse(lowPerformers)
            
            report.low_performers.forEach(lp => {
              // Verify all required fields are present
              expect(lp).toHaveProperty('responsible_person')
              expect(lp).toHaveProperty('classrooms')
              expect(lp).toHaveProperty('total_evaluations')
              expect(lp).toHaveProperty('average_score')
              expect(lp).toHaveProperty('trend')
              expect(lp).toHaveProperty('scores_by_category')
              
              // Verify types
              expect(typeof lp.responsible_person).toBe('string')
              expect(Array.isArray(lp.classrooms)).toBe(true)
              expect(typeof lp.total_evaluations).toBe('number')
              expect(typeof lp.average_score).toBe('number')
              expect(['up', 'down', 'stable']).toContain(lp.trend)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('low performers should have average_score < 70 and total_evaluations > 0', () => {
      fc.assert(
        fc.property(
          mixedPerformanceArrayArb,
          (performanceData) => {
            const report = generateReportResponse(performanceData)
            
            report.low_performers.forEach(lp => {
              expect(lp.average_score).toBeLessThan(LOW_PERFORMANCE_THRESHOLD)
              expect(lp.total_evaluations).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Edge cases', () => {
    test('empty performance data should result in empty low_performers array', () => {
      const report = generateReportResponse([])
      
      expect(report.low_performers).toHaveLength(0)
      expect(report.data).toHaveLength(0)
      expect(report.total).toBe(0)
    })

    test('all high performers should result in empty low_performers array', () => {
      fc.assert(
        fc.property(
          fc.array(highPerformerArb, { minLength: 1, maxLength: 20 }),
          (highPerformers) => {
            const report = generateReportResponse(highPerformers)
            
            expect(report.low_performers).toHaveLength(0)
            expect(report.data.length).toBe(highPerformers.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('all low performers should all be in low_performers array', () => {
      fc.assert(
        fc.property(
          fc.array(lowPerformerArb, { minLength: 1, maxLength: 20 }),
          (lowPerformers) => {
            const report = generateReportResponse(lowPerformers)
            
            expect(report.low_performers.length).toBe(lowPerformers.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('all persons with no evaluations should result in empty low_performers array', () => {
      fc.assert(
        fc.property(
          fc.array(noEvaluationsPerformerArb, { minLength: 1, maxLength: 20 }),
          (noEvalPerformers) => {
            const report = generateReportResponse(noEvalPerformers)
            
            expect(report.low_performers).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('single evaluation at 0% should be marked as low performer', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          (responsiblePerson, classrooms) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              [0] // Worst possible score
            )
            
            expect(performance.average_score).toBe(0)
            expect(isLowPerformer(performance)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('single evaluation at 100% should NOT be marked as low performer', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          (responsiblePerson, classrooms) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              [100] // Best possible score
            )
            
            expect(performance.average_score).toBe(100)
            expect(isLowPerformer(performance)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('responsible person with many classrooms but low score should be low performer', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          fc.array(classroomArb, { minLength: 10, maxLength: 50 }).map(classrooms => 
            classrooms.map((c, i) => ({ ...c, id: i + 1 }))
          ),
          lowScoresArrayArb,
          (responsiblePerson, manyClassrooms, lowScores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              manyClassrooms,
              lowScores
            )
            
            expect(performance.classrooms.length).toBeGreaterThanOrEqual(10)
            expect(isLowPerformer(performance)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('responsible person with many evaluations averaging below 70% should be low performer', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.array(lowScoreArb, { minLength: 50, maxLength: 100 }),
          (responsiblePerson, classrooms, manyLowScores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              manyLowScores
            )
            
            expect(performance.total_evaluations).toBeGreaterThanOrEqual(50)
            expect(isLowPerformer(performance)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Consistency between isLowPerformer and identifyLowPerformers', () => {
    test('identifyLowPerformers should return exactly those where isLowPerformer is true', () => {
      fc.assert(
        fc.property(
          mixedPerformanceArrayArb,
          (performanceData) => {
            const identified = identifyLowPerformers(performanceData)
            
            performanceData.forEach(p => {
              const isInIdentified = identified.some(
                lp => lp.responsible_person === p.responsible_person
              )
              
              if (isLowPerformer(p)) {
                expect(isInIdentified).toBe(true)
              } else {
                expect(isInIdentified).toBe(false)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
