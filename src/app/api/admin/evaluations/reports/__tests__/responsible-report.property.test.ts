/**
 * Responsible Report - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 17: Reporte por responsable incluye todos los campos requeridos
 * 
 * Property Description:
 * Para cualquier responsable en el reporte, el registro debe incluir: nombre, 
 * lista de espacios a cargo, promedio de puntuación, tendencia, y número de evaluaciones.
 * 
 * **Validates: Requirements 6.2**
 */

import * as fc from 'fast-check'
import type { ResponsiblePerformance, TrendDirection } from '@/types/evaluations'

// ============================================================================
// Types for Responsible Report
// ============================================================================

/**
 * Required fields for a responsible person report entry
 * Based on Requirement 6.2
 */
interface RequiredResponsibleFields {
  responsible_person: string  // nombre del responsable
  classrooms: Array<{         // lista de espacios a cargo
    id: number
    name: string
    location: string
  }>
  average_score: number       // promedio de puntuación
  trend: TrendDirection       // tendencia
  total_evaluations: number   // número de evaluaciones
}

/**
 * Validates that a ResponsiblePerformance object has all required fields
 * @param data - The responsible performance data to validate
 * @returns Object with validation result and any missing fields
 */
function validateRequiredFields(data: unknown): { 
  isValid: boolean
  missingFields: string[]
  invalidFields: string[]
} {
  const missingFields: string[] = []
  const invalidFields: string[] = []

  if (data === null || data === undefined || typeof data !== 'object') {
    return { isValid: false, missingFields: ['entire object'], invalidFields: [] }
  }

  const record = data as Record<string, unknown>

  // Check responsible_person (nombre)
  if (!('responsible_person' in record)) {
    missingFields.push('responsible_person')
  } else if (typeof record.responsible_person !== 'string') {
    invalidFields.push('responsible_person (must be string)')
  }

  // Check classrooms (lista de espacios a cargo)
  if (!('classrooms' in record)) {
    missingFields.push('classrooms')
  } else if (!Array.isArray(record.classrooms)) {
    invalidFields.push('classrooms (must be array)')
  } else {
    // Validate each classroom has required fields
    const classrooms = record.classrooms as unknown[]
    classrooms.forEach((classroom, index) => {
      if (classroom === null || typeof classroom !== 'object') {
        invalidFields.push(`classrooms[${index}] (must be object)`)
      } else {
        const c = classroom as Record<string, unknown>
        if (!('id' in c) || typeof c.id !== 'number') {
          invalidFields.push(`classrooms[${index}].id (must be number)`)
        }
        if (!('name' in c) || typeof c.name !== 'string') {
          invalidFields.push(`classrooms[${index}].name (must be string)`)
        }
        if (!('location' in c) || typeof c.location !== 'string') {
          invalidFields.push(`classrooms[${index}].location (must be string)`)
        }
      }
    })
  }

  // Check average_score (promedio de puntuación)
  if (!('average_score' in record)) {
    missingFields.push('average_score')
  } else if (typeof record.average_score !== 'number') {
    invalidFields.push('average_score (must be number)')
  }

  // Check trend (tendencia)
  if (!('trend' in record)) {
    missingFields.push('trend')
  } else if (!['up', 'down', 'stable'].includes(record.trend as string)) {
    invalidFields.push('trend (must be up, down, or stable)')
  }

  // Check total_evaluations (número de evaluaciones)
  if (!('total_evaluations' in record)) {
    missingFields.push('total_evaluations')
  } else if (typeof record.total_evaluations !== 'number') {
    invalidFields.push('total_evaluations (must be number)')
  }

  return {
    isValid: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields,
  }
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

  // Calculate trend based on recent vs previous evaluations
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
const scorePercentageArb = fc.float({ min: 0, max: 100, noNaN: true })
  .map(score => Math.round(score * 100) / 100)

/**
 * Generator for an array of evaluation scores
 */
const evaluationScoresArb = fc.array(scorePercentageArb, { minLength: 0, maxLength: 50 })

/**
 * Generator for trend direction
 */
const trendArb = fc.constantFrom<TrendDirection>('up', 'down', 'stable')

/**
 * Generator for a complete ResponsiblePerformance object
 */
const responsiblePerformanceArb = fc.tuple(
  responsiblePersonArb,
  classroomsArrayArb,
  evaluationScoresArb
).map(([responsiblePerson, classrooms, scores]) => 
  createResponsiblePerformance(responsiblePerson, classrooms, scores)
)

/**
 * Generator for an array of ResponsiblePerformance objects
 */
const responsiblePerformanceArrayArb = fc.array(responsiblePerformanceArb, { 
  minLength: 1, 
  maxLength: 20 
})


// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 17: Reporte por responsable incluye todos los campos requeridos', () => {
  /**
   * Property 17: Responsible Report Includes All Required Fields
   * For any responsible person in the report, the record must include:
   * - nombre (responsible_person)
   * - lista de espacios a cargo (classrooms)
   * - promedio de puntuación (average_score)
   * - tendencia (trend)
   * - número de evaluaciones (total_evaluations)
   * 
   * **Validates: Requirements 6.2**
   */

  describe('Core Property: All required fields are present', () => {
    test('should include responsible_person (nombre) for any generated report entry', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(performance).toHaveProperty('responsible_person')
            expect(typeof performance.responsible_person).toBe('string')
            expect(performance.responsible_person.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include classrooms (lista de espacios a cargo) for any generated report entry', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(performance).toHaveProperty('classrooms')
            expect(Array.isArray(performance.classrooms)).toBe(true)
            
            // Each classroom should have id, name, and location
            performance.classrooms.forEach((classroom) => {
              expect(classroom).toHaveProperty('id')
              expect(typeof classroom.id).toBe('number')
              expect(classroom).toHaveProperty('name')
              expect(typeof classroom.name).toBe('string')
              expect(classroom).toHaveProperty('location')
              expect(typeof classroom.location).toBe('string')
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include average_score (promedio de puntuación) for any generated report entry', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(performance).toHaveProperty('average_score')
            expect(typeof performance.average_score).toBe('number')
            expect(performance.average_score).toBeGreaterThanOrEqual(0)
            expect(performance.average_score).toBeLessThanOrEqual(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include trend (tendencia) for any generated report entry', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(performance).toHaveProperty('trend')
            expect(['up', 'down', 'stable']).toContain(performance.trend)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include total_evaluations (número de evaluaciones) for any generated report entry', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(performance).toHaveProperty('total_evaluations')
            expect(typeof performance.total_evaluations).toBe('number')
            expect(Number.isInteger(performance.total_evaluations)).toBe(true)
            expect(performance.total_evaluations).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Validation function correctly identifies required fields', () => {
    test('should validate complete ResponsiblePerformance objects as valid', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            const validation = validateRequiredFields(performance)
            
            expect(validation.isValid).toBe(true)
            expect(validation.missingFields).toHaveLength(0)
            expect(validation.invalidFields).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should detect missing responsible_person field', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            const { responsible_person, ...withoutName } = performance
            const validation = validateRequiredFields(withoutName)
            
            expect(validation.isValid).toBe(false)
            expect(validation.missingFields).toContain('responsible_person')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should detect missing classrooms field', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            const { classrooms, ...withoutClassrooms } = performance
            const validation = validateRequiredFields(withoutClassrooms)
            
            expect(validation.isValid).toBe(false)
            expect(validation.missingFields).toContain('classrooms')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should detect missing average_score field', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            const { average_score, ...withoutScore } = performance
            const validation = validateRequiredFields(withoutScore)
            
            expect(validation.isValid).toBe(false)
            expect(validation.missingFields).toContain('average_score')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should detect missing trend field', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            const { trend, ...withoutTrend } = performance
            const validation = validateRequiredFields(withoutTrend)
            
            expect(validation.isValid).toBe(false)
            expect(validation.missingFields).toContain('trend')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should detect missing total_evaluations field', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            const { total_evaluations, ...withoutEvaluations } = performance
            const validation = validateRequiredFields(withoutEvaluations)
            
            expect(validation.isValid).toBe(false)
            expect(validation.missingFields).toContain('total_evaluations')
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Field value constraints', () => {
    test('responsible_person should be a non-empty string', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(performance.responsible_person).toBeTruthy()
            expect(performance.responsible_person.trim().length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('classrooms should be an array with valid classroom objects', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(Array.isArray(performance.classrooms)).toBe(true)
            
            performance.classrooms.forEach((classroom) => {
              expect(typeof classroom.id).toBe('number')
              expect(classroom.id).toBeGreaterThan(0)
              expect(typeof classroom.name).toBe('string')
              expect(classroom.name.length).toBeGreaterThan(0)
              expect(typeof classroom.location).toBe('string')
              expect(classroom.location.length).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('average_score should be between 0 and 100', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(performance.average_score).toBeGreaterThanOrEqual(0)
            expect(performance.average_score).toBeLessThanOrEqual(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('trend should be one of: up, down, stable', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(['up', 'down', 'stable']).toContain(performance.trend)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('total_evaluations should be a non-negative integer', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArb,
          (performance) => {
            expect(Number.isInteger(performance.total_evaluations)).toBe(true)
            expect(performance.total_evaluations).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Average score calculation consistency', () => {
    test('average_score should be 0 when total_evaluations is 0', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          (responsiblePerson, classrooms) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              [] // No evaluations
            )
            
            expect(performance.total_evaluations).toBe(0)
            expect(performance.average_score).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('average_score should equal the single score when total_evaluations is 1', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          scorePercentageArb,
          (responsiblePerson, classrooms, score) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              [score]
            )
            
            expect(performance.total_evaluations).toBe(1)
            expect(performance.average_score).toBeCloseTo(score, 2)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('average_score should be correctly calculated for multiple evaluations', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.array(scorePercentageArb, { minLength: 2, maxLength: 20 }),
          (responsiblePerson, classrooms, scores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              scores
            )
            
            const expectedAverage = Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
            ) / 100
            
            expect(performance.total_evaluations).toBe(scores.length)
            expect(performance.average_score).toBeCloseTo(expectedAverage, 2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Trend calculation consistency', () => {
    test('trend should be stable when there are fewer than 2 evaluations', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.array(scorePercentageArb, { minLength: 0, maxLength: 1 }),
          (responsiblePerson, classrooms, scores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              scores
            )
            
            expect(performance.trend).toBe('stable')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('trend should be up when recent scores are significantly higher than previous', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.float({ min: 10, max: 40, noNaN: true }),
          fc.float({ min: 60, max: 100, noNaN: true }),
          (responsiblePerson, classrooms, lowScore, highScore) => {
            // Recent scores (first) are high, previous scores (later) are low
            const scores = [highScore, highScore, highScore, lowScore, lowScore, lowScore]
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              scores
            )
            
            expect(performance.trend).toBe('up')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('trend should be down when recent scores are significantly lower than previous', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.float({ min: 10, max: 40, noNaN: true }),
          fc.float({ min: 60, max: 100, noNaN: true }),
          (responsiblePerson, classrooms, lowScore, highScore) => {
            // Recent scores (first) are low, previous scores (later) are high
            const scores = [lowScore, lowScore, lowScore, highScore, highScore, highScore]
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              scores
            )
            
            expect(performance.trend).toBe('down')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('trend should be stable when scores are similar', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.float({ min: 50, max: 55, noNaN: true }),
          (responsiblePerson, classrooms, baseScore) => {
            // All scores are within 5% threshold
            const scores = [baseScore, baseScore + 1, baseScore - 1, baseScore + 2, baseScore - 2, baseScore]
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              scores
            )
            
            expect(performance.trend).toBe('stable')
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Report array validation', () => {
    test('all entries in a report array should have required fields', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArrayArb,
          (reportEntries) => {
            reportEntries.forEach((entry) => {
              const validation = validateRequiredFields(entry)
              
              expect(validation.isValid).toBe(true)
              expect(validation.missingFields).toHaveLength(0)
              expect(validation.invalidFields).toHaveLength(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('each entry in report should have all five required fields', () => {
      fc.assert(
        fc.property(
          responsiblePerformanceArrayArb,
          (reportEntries) => {
            reportEntries.forEach((entry) => {
              // Check all 5 required fields per Requirement 6.2
              expect(entry).toHaveProperty('responsible_person')
              expect(entry).toHaveProperty('classrooms')
              expect(entry).toHaveProperty('average_score')
              expect(entry).toHaveProperty('trend')
              expect(entry).toHaveProperty('total_evaluations')
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Edge cases', () => {
    test('should handle responsible person with special characters in name', () => {
      const specialNames = [
        'José García',
        "O'Brien",
        'María-José',
        'Müller',
        '张伟',
        'Αλέξανδρος',
      ]
      
      specialNames.forEach((name) => {
        const performance = createResponsiblePerformance(
          name,
          [{ id: 1, name: 'Aula 1', location: 'Edificio A' }],
          [85]
        )
        
        const validation = validateRequiredFields(performance)
        expect(validation.isValid).toBe(true)
        expect(performance.responsible_person).toBe(name)
      })
    })

    test('should handle classroom with long name and location', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          fc.string({ minLength: 100, maxLength: 255 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 100, maxLength: 255 }).filter(s => s.trim().length > 0),
          (responsiblePerson, longName, longLocation) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              [{ id: 1, name: longName.trim(), location: longLocation.trim() }],
              [75]
            )
            
            const validation = validateRequiredFields(performance)
            expect(validation.isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle maximum number of classrooms', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          fc.array(classroomArb, { minLength: 50, maxLength: 100 }).map(classrooms => 
            classrooms.map((c, i) => ({ ...c, id: i + 1 }))
          ),
          (responsiblePerson, manyClassrooms) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              manyClassrooms,
              [80]
            )
            
            const validation = validateRequiredFields(performance)
            expect(validation.isValid).toBe(true)
            expect(performance.classrooms.length).toBe(manyClassrooms.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle maximum number of evaluations', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.array(scorePercentageArb, { minLength: 100, maxLength: 200 }),
          (responsiblePerson, classrooms, manyScores) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              manyScores
            )
            
            const validation = validateRequiredFields(performance)
            expect(validation.isValid).toBe(true)
            expect(performance.total_evaluations).toBe(manyScores.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle boundary score values (0 and 100)', () => {
      fc.assert(
        fc.property(
          responsiblePersonArb,
          classroomsArrayArb,
          fc.constantFrom(0, 100),
          (responsiblePerson, classrooms, boundaryScore) => {
            const performance = createResponsiblePerformance(
              responsiblePerson,
              classrooms,
              [boundaryScore]
            )
            
            const validation = validateRequiredFields(performance)
            expect(validation.isValid).toBe(true)
            expect(performance.average_score).toBe(boundaryScore)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
