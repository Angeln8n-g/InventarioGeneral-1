/**
 * Date Filter Metrics - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 20: Métricas de reporte respetan filtro de fechas
 * 
 * Property Description:
 * Para cualquier reporte generado con filtro de rango de fechas, 
 * todas las métricas calculadas deben basarse únicamente en evaluaciones dentro del período especificado.
 * 
 * **Validates: Requirements 6.5**
 */

import * as fc from 'fast-check'
import type { ResponsiblePerformance, SpacePerformance, TrendDirection } from '@/types/evaluations'

// ============================================================================
// Types for Report Metrics with Date Filtering
// ============================================================================

/**
 * Represents an evaluation result with completion date and scores
 */
interface EvaluationResult {
  id: number
  completed_at: string // ISO date string
  score_percentage: number
  organization_score: number
  organization_max: number
  cleanliness_score: number
  cleanliness_max: number
  maintenance_score: number
  maintenance_max: number
  classroom_id: number
  responsible_person: string
}

/**
 * Represents a date range filter for reports
 */
interface DateRangeFilter {
  start_date?: string // ISO date string
  end_date?: string   // ISO date string
}


/**
 * Represents calculated metrics for a report
 */
interface ReportMetrics {
  total_evaluations: number
  average_score: number
  scores_by_category: {
    organization: number
    cleanliness: number
    maintenance: number
  }
}

/**
 * Represents a responsible person's report entry
 */
interface ResponsibleReportEntry {
  responsible_person: string
  classrooms: Array<{ id: number; name: string; location: string }>
  total_evaluations: number
  average_score: number
  trend: TrendDirection
  scores_by_category: {
    organization: number
    cleanliness: number
    maintenance: number
  }
}

/**
 * Represents a space report entry
 */
interface SpaceReportEntry {
  classroom_id: number
  classroom_name: string
  total_evaluations: number
  average_score: number
  last_score: number
  trend: TrendDirection
  history: Array<{ date: string; score: number }>
}

// ============================================================================
// Date Filter Logic (extracted from report routes)
// ============================================================================

/**
 * Filters evaluation results by date range
 * This simulates the filtering logic used in the API endpoints
 * 
 * The filter uses:
 * - start_date: completed_at >= start_date (inclusive)
 * - end_date: completed_at <= end_date (inclusive)
 * 
 * @param evaluations - Array of evaluation results
 * @param filters - Date range filter with optional start_date and end_date
 * @returns Filtered array with only evaluations within the date range
 */
function filterEvaluationsByDateRange(
  evaluations: EvaluationResult[],
  filters: DateRangeFilter
): EvaluationResult[] {
  return evaluations.filter((evaluation) => {
    const evalDate = new Date(evaluation.completed_at).getTime()
    
    // Check start_date filter (inclusive: completed_at >= start_date)
    if (filters.start_date) {
      const startDate = new Date(filters.start_date).getTime()
      if (evalDate < startDate) {
        return false
      }
    }
    
    // Check end_date filter (inclusive: completed_at <= end_date)
    if (filters.end_date) {
      const endDate = new Date(filters.end_date).getTime()
      if (evalDate > endDate) {
        return false
      }
    }
    
    return true
  })
}


/**
 * Calculates metrics from a set of evaluations
 * This simulates the metrics calculation in the report endpoints
 * 
 * @param evaluations - Array of evaluation results
 * @returns Calculated metrics
 */
function calculateMetrics(evaluations: EvaluationResult[]): ReportMetrics {
  const totalEvaluations = evaluations.length
  
  if (totalEvaluations === 0) {
    return {
      total_evaluations: 0,
      average_score: 0,
      scores_by_category: {
        organization: 0,
        cleanliness: 0,
        maintenance: 0,
      },
    }
  }
  
  // Calculate average score
  const totalScore = evaluations.reduce((sum, e) => sum + e.score_percentage, 0)
  const averageScore = Math.round((totalScore / totalEvaluations) * 100) / 100
  
  // Calculate category totals
  const categoryTotals = evaluations.reduce(
    (acc, e) => {
      acc.organization.score += e.organization_score
      acc.organization.max += e.organization_max
      acc.cleanliness.score += e.cleanliness_score
      acc.cleanliness.max += e.cleanliness_max
      acc.maintenance.score += e.maintenance_score
      acc.maintenance.max += e.maintenance_max
      return acc
    },
    {
      organization: { score: 0, max: 0 },
      cleanliness: { score: 0, max: 0 },
      maintenance: { score: 0, max: 0 },
    }
  )
  
  return {
    total_evaluations: totalEvaluations,
    average_score: averageScore,
    scores_by_category: {
      organization: categoryTotals.organization.max > 0
        ? Math.round((categoryTotals.organization.score / categoryTotals.organization.max) * 10000) / 100
        : 0,
      cleanliness: categoryTotals.cleanliness.max > 0
        ? Math.round((categoryTotals.cleanliness.score / categoryTotals.cleanliness.max) * 10000) / 100
        : 0,
      maintenance: categoryTotals.maintenance.max > 0
        ? Math.round((categoryTotals.maintenance.score / categoryTotals.maintenance.max) * 10000) / 100
        : 0,
    },
  }
}


/**
 * Calculates trend direction based on evaluation scores
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
 * Generates a responsible report from evaluations with date filtering
 * This simulates the responsible report endpoint logic
 * 
 * @param evaluations - All evaluation results
 * @param filters - Date range filter
 * @returns Array of responsible report entries
 */
function generateResponsibleReport(
  evaluations: EvaluationResult[],
  filters: DateRangeFilter
): ResponsibleReportEntry[] {
  // First, filter evaluations by date range
  const filteredEvaluations = filterEvaluationsByDateRange(evaluations, filters)
  
  // Group by responsible person using Map to avoid prototype pollution
  const byResponsible = new Map<string, EvaluationResult[]>()
  filteredEvaluations.forEach((evaluation) => {
    const existing = byResponsible.get(evaluation.responsible_person)
    if (existing) {
      existing.push(evaluation)
    } else {
      byResponsible.set(evaluation.responsible_person, [evaluation])
    }
  })
  
  // Build report entries
  const entries: ResponsibleReportEntry[] = []
  byResponsible.forEach((evals, responsible) => {
    const metrics = calculateMetrics(evals)
    const scores = evals
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .map((e) => e.score_percentage)
    
    entries.push({
      responsible_person: responsible,
      classrooms: [], // Simplified for testing
      total_evaluations: metrics.total_evaluations,
      average_score: metrics.average_score,
      trend: calculateTrend(scores),
      scores_by_category: metrics.scores_by_category,
    })
  })
  
  return entries
}


/**
 * Generates a space report from evaluations with date filtering
 * This simulates the space report endpoint logic
 * 
 * @param evaluations - All evaluation results
 * @param filters - Date range filter
 * @returns Array of space report entries
 */
function generateSpaceReport(
  evaluations: EvaluationResult[],
  filters: DateRangeFilter
): SpaceReportEntry[] {
  // First, filter evaluations by date range
  const filteredEvaluations = filterEvaluationsByDateRange(evaluations, filters)
  
  // Group by classroom using Map
  const byClassroom = new Map<number, EvaluationResult[]>()
  filteredEvaluations.forEach((evaluation) => {
    const existing = byClassroom.get(evaluation.classroom_id)
    if (existing) {
      existing.push(evaluation)
    } else {
      byClassroom.set(evaluation.classroom_id, [evaluation])
    }
  })
  
  // Build report entries
  const entries: SpaceReportEntry[] = []
  byClassroom.forEach((evals, classroomId) => {
    const sortedEvals = evals.sort(
      (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )
    const metrics = calculateMetrics(evals)
    const scores = sortedEvals.map((e) => e.score_percentage)
    
    entries.push({
      classroom_id: classroomId,
      classroom_name: `Classroom ${classroomId}`,
      total_evaluations: metrics.total_evaluations,
      average_score: metrics.average_score,
      last_score: sortedEvals.length > 0 ? sortedEvals[0].score_percentage : 0,
      trend: calculateTrend(scores),
      history: sortedEvals.map((e) => ({
        date: e.completed_at,
        score: e.score_percentage,
      })).reverse(),
    })
  })
  
  return entries
}

/**
 * Validates that all evaluations used in metrics are within the date range
 * 
 * @param evaluations - Array of evaluation results
 * @param filters - Date range filter
 * @returns true if all evaluations are within the range
 */
function allEvaluationsWithinDateRange(
  evaluations: EvaluationResult[],
  filters: DateRangeFilter
): boolean {
  return evaluations.every((evaluation) => {
    const evalDate = new Date(evaluation.completed_at).getTime()
    
    if (filters.start_date) {
      const startDate = new Date(filters.start_date).getTime()
      if (evalDate < startDate) {
        return false
      }
    }
    
    if (filters.end_date) {
      const endDate = new Date(filters.end_date).getTime()
      if (evalDate > endDate) {
        return false
      }
    }
    
    return true
  })
}


// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid evaluation IDs (positive integers)
 */
const evaluationIdArb = fc.integer({ min: 1, max: 1000000 })

/**
 * Generator for valid classroom IDs (positive integers)
 */
const classroomIdArb = fc.integer({ min: 1, max: 100 })

/**
 * Reserved property names that should not be used as object keys
 */
const RESERVED_PROPERTY_NAMES = [
  'valueOf', 'toString', 'hasOwnProperty', 'isPrototypeOf',
  'propertyIsEnumerable', 'toLocaleString', 'constructor',
  '__proto__', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__'
]

/**
 * Generator for responsible person names
 * Filters out reserved JavaScript property names to avoid prototype pollution issues
 */
const responsiblePersonArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim())
  .filter(s => !RESERVED_PROPERTY_NAMES.includes(s))

/**
 * Generator for ISO date strings within a reasonable range
 */
const isoDateStringArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => new Date(timestamp).toISOString())

/**
 * Generator for score percentage (0 to 100)
 */
const scorePercentageArb = fc.integer({ min: 0, max: 10000 })
  .map(score => score / 100)

/**
 * Generator for category score (score and max)
 */
const categoryScoreArb = fc.integer({ min: 1, max: 20 }).chain(max =>
  fc.integer({ min: 0, max }).map(score => ({ score, max }))
)

/**
 * Generator for a single evaluation result
 */
const evaluationResultArb = fc.record({
  id: evaluationIdArb,
  completed_at: isoDateStringArb,
  score_percentage: scorePercentageArb,
  organization_score: fc.integer({ min: 0, max: 20 }),
  organization_max: fc.integer({ min: 1, max: 20 }),
  cleanliness_score: fc.integer({ min: 0, max: 20 }),
  cleanliness_max: fc.integer({ min: 1, max: 20 }),
  maintenance_score: fc.integer({ min: 0, max: 20 }),
  maintenance_max: fc.integer({ min: 1, max: 20 }),
  classroom_id: classroomIdArb,
  responsible_person: responsiblePersonArb,
}).map(result => ({
  ...result,
  // Ensure scores don't exceed max
  organization_score: Math.min(result.organization_score, result.organization_max),
  cleanliness_score: Math.min(result.cleanliness_score, result.cleanliness_max),
  maintenance_score: Math.min(result.maintenance_score, result.maintenance_max),
}))

/**
 * Generator for an array of evaluation results with unique IDs
 */
const evaluationResultsArrayArb = fc.array(evaluationResultArb, { 
  minLength: 0, 
  maxLength: 50 
}).map(results => {
  // Ensure unique IDs
  return results.map((result, index) => ({ ...result, id: index + 1 }))
})

/**
 * Generator for an array with at least 1 evaluation
 */
const evaluationResultsArrayMinOneArb = fc.array(evaluationResultArb, { 
  minLength: 1, 
  maxLength: 50 
}).map(results => {
  return results.map((result, index) => ({ ...result, id: index + 1 }))
})


/**
 * Generator for a valid date range (start_date <= end_date)
 */
const dateRangeFilterArb = fc.tuple(
  fc.integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2030-12-31').getTime(),
  }),
  fc.integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2030-12-31').getTime(),
  })
).map(([t1, t2]) => {
  const startTime = Math.min(t1, t2)
  const endTime = Math.max(t1, t2)
  return {
    start_date: new Date(startTime).toISOString(),
    end_date: new Date(endTime).toISOString(),
  }
})

/**
 * Generator for date range with only start_date
 */
const startDateOnlyFilterArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => ({
  start_date: new Date(timestamp).toISOString(),
  end_date: undefined,
}))

/**
 * Generator for date range with only end_date
 */
const endDateOnlyFilterArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => ({
  start_date: undefined,
  end_date: new Date(timestamp).toISOString(),
}))

/**
 * Generator for any valid date range filter
 */
const anyDateRangeFilterArb = fc.oneof(
  dateRangeFilterArb,
  startDateOnlyFilterArb,
  endDateOnlyFilterArb,
  fc.constant({ start_date: undefined, end_date: undefined })
)

/**
 * Generator for evaluation with a specific date
 */
const evaluationWithDateArb = (date: Date) => fc.record({
  id: evaluationIdArb,
  completed_at: fc.constant(date.toISOString()),
  score_percentage: scorePercentageArb,
  organization_score: fc.integer({ min: 0, max: 20 }),
  organization_max: fc.integer({ min: 1, max: 20 }),
  cleanliness_score: fc.integer({ min: 0, max: 20 }),
  cleanliness_max: fc.integer({ min: 1, max: 20 }),
  maintenance_score: fc.integer({ min: 0, max: 20 }),
  maintenance_max: fc.integer({ min: 1, max: 20 }),
  classroom_id: classroomIdArb,
  responsible_person: responsiblePersonArb,
}).map(result => ({
  ...result,
  organization_score: Math.min(result.organization_score, result.organization_max),
  cleanliness_score: Math.min(result.cleanliness_score, result.cleanliness_max),
  maintenance_score: Math.min(result.maintenance_score, result.maintenance_max),
}))


// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 20: Métricas de reporte respetan filtro de fechas', () => {
  /**
   * Property 20: Report Metrics Respect Date Filter
   * For any report generated with date range filter, all calculated metrics 
   * must be based only on evaluations within the specified period.
   * 
   * **Validates: Requirements 6.5**
   */

  describe('Core Property: Filtered evaluations are within date range', () => {
    test('should filter evaluations to only include those within the date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            
            // All filtered evaluations must be within the date range
            expect(allEvaluationsWithinDateRange(filtered, filters)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include only evaluations >= start_date when only start_date is specified', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayArb,
          startDateOnlyFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const startDate = new Date(filters.start_date!).getTime()
            
            filtered.forEach(evaluation => {
              const evalDate = new Date(evaluation.completed_at).getTime()
              expect(evalDate).toBeGreaterThanOrEqual(startDate)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include only evaluations <= end_date when only end_date is specified', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayArb,
          endDateOnlyFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const endDate = new Date(filters.end_date!).getTime()
            
            filtered.forEach(evaluation => {
              const evalDate = new Date(evaluation.completed_at).getTime()
              expect(evalDate).toBeLessThanOrEqual(endDate)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return all evaluations when no date filter is specified', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayArb,
          (evaluations) => {
            const filtered = filterEvaluationsByDateRange(evaluations, {})
            
            expect(filtered.length).toBe(evaluations.length)
            expect(filtered.map(e => e.id).sort()).toEqual(evaluations.map(e => e.id).sort())
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Metrics calculation uses only filtered evaluations', () => {
    test('total_evaluations should count only evaluations within date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const metrics = calculateMetrics(filtered)
            
            // Total evaluations should match filtered count
            expect(metrics.total_evaluations).toBe(filtered.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('average_score should be calculated only from evaluations within date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const metrics = calculateMetrics(filtered)
            
            if (filtered.length > 0) {
              // Calculate expected average from filtered evaluations
              const expectedAverage = Math.round(
                (filtered.reduce((sum, e) => sum + e.score_percentage, 0) / filtered.length) * 100
              ) / 100
              
              expect(metrics.average_score).toBeCloseTo(expectedAverage, 2)
            } else {
              expect(metrics.average_score).toBe(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('category scores should be calculated only from evaluations within date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const metrics = calculateMetrics(filtered)
            
            if (filtered.length > 0) {
              // Calculate expected category scores from filtered evaluations
              const categoryTotals = filtered.reduce(
                (acc, e) => {
                  acc.organization.score += e.organization_score
                  acc.organization.max += e.organization_max
                  acc.cleanliness.score += e.cleanliness_score
                  acc.cleanliness.max += e.cleanliness_max
                  acc.maintenance.score += e.maintenance_score
                  acc.maintenance.max += e.maintenance_max
                  return acc
                },
                {
                  organization: { score: 0, max: 0 },
                  cleanliness: { score: 0, max: 0 },
                  maintenance: { score: 0, max: 0 },
                }
              )
              
              const expectedOrg = categoryTotals.organization.max > 0
                ? Math.round((categoryTotals.organization.score / categoryTotals.organization.max) * 10000) / 100
                : 0
              const expectedClean = categoryTotals.cleanliness.max > 0
                ? Math.round((categoryTotals.cleanliness.score / categoryTotals.cleanliness.max) * 10000) / 100
                : 0
              const expectedMaint = categoryTotals.maintenance.max > 0
                ? Math.round((categoryTotals.maintenance.score / categoryTotals.maintenance.max) * 10000) / 100
                : 0
              
              expect(metrics.scores_by_category.organization).toBeCloseTo(expectedOrg, 2)
              expect(metrics.scores_by_category.cleanliness).toBeCloseTo(expectedClean, 2)
              expect(metrics.scores_by_category.maintenance).toBeCloseTo(expectedMaint, 2)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Responsible report respects date filter', () => {
    test('responsible report should only include evaluations within date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const report = generateResponsibleReport(evaluations, filters)
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            
            // Total evaluations across all responsible persons should match filtered count
            const totalInReport = report.reduce((sum, entry) => sum + entry.total_evaluations, 0)
            expect(totalInReport).toBe(filtered.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('responsible report average_score should be based only on filtered evaluations', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const report = generateResponsibleReport(evaluations, filters)
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            
            // For each responsible person in report, verify average is correct
            report.forEach(entry => {
              const responsibleEvals = filtered.filter(
                e => e.responsible_person === entry.responsible_person
              )
              
              if (responsibleEvals.length > 0) {
                const expectedAverage = Math.round(
                  (responsibleEvals.reduce((sum, e) => sum + e.score_percentage, 0) / responsibleEvals.length) * 100
                ) / 100
                
                expect(entry.average_score).toBeCloseTo(expectedAverage, 2)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('responsible report should not include evaluations outside date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const report = generateResponsibleReport(evaluations, filters)
            const startDate = new Date(filters.start_date!).getTime()
            const endDate = new Date(filters.end_date!).getTime()
            
            // Count evaluations outside range
            const outsideRange = evaluations.filter(e => {
              const evalDate = new Date(e.completed_at).getTime()
              return evalDate < startDate || evalDate > endDate
            })
            
            // Total in report should not include outside range evaluations
            const totalInReport = report.reduce((sum, entry) => sum + entry.total_evaluations, 0)
            const expectedTotal = evaluations.length - outsideRange.length
            
            expect(totalInReport).toBe(expectedTotal)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Space report respects date filter', () => {
    test('space report should only include evaluations within date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const report = generateSpaceReport(evaluations, filters)
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            
            // Total evaluations across all spaces should match filtered count
            const totalInReport = report.reduce((sum, entry) => sum + entry.total_evaluations, 0)
            expect(totalInReport).toBe(filtered.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('space report average_score should be based only on filtered evaluations', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const report = generateSpaceReport(evaluations, filters)
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            
            // For each space in report, verify average is correct
            report.forEach(entry => {
              const spaceEvals = filtered.filter(e => e.classroom_id === entry.classroom_id)
              
              if (spaceEvals.length > 0) {
                const expectedAverage = Math.round(
                  (spaceEvals.reduce((sum, e) => sum + e.score_percentage, 0) / spaceEvals.length) * 100
                ) / 100
                
                expect(entry.average_score).toBeCloseTo(expectedAverage, 2)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('space report history should only contain evaluations within date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const report = generateSpaceReport(evaluations, filters)
            const startDate = new Date(filters.start_date!).getTime()
            const endDate = new Date(filters.end_date!).getTime()
            
            // All history entries should be within date range
            report.forEach(entry => {
              entry.history.forEach(historyItem => {
                const itemDate = new Date(historyItem.date).getTime()
                expect(itemDate).toBeGreaterThanOrEqual(startDate)
                expect(itemDate).toBeLessThanOrEqual(endDate)
              })
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('space report last_score should be from most recent evaluation within date range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const report = generateSpaceReport(evaluations, filters)
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            
            report.forEach(entry => {
              const spaceEvals = filtered
                .filter(e => e.classroom_id === entry.classroom_id)
                .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
              
              if (spaceEvals.length > 0) {
                expect(entry.last_score).toBe(spaceEvals[0].score_percentage)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Boundary conditions', () => {
    test('should include evaluations exactly at start_date (inclusive)', () => {
      const startDate = new Date('2024-06-15T00:00:00.000Z')
      const endDate = new Date('2024-12-31T23:59:59.999Z')
      
      fc.assert(
        fc.property(
          evaluationWithDateArb(startDate),
          (evaluation) => {
            const evaluations = [{ ...evaluation, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const metrics = calculateMetrics(filtered)
            
            // Evaluation exactly at start_date should be included
            expect(filtered.length).toBe(1)
            expect(metrics.total_evaluations).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include evaluations exactly at end_date (inclusive)', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z')
      const endDate = new Date('2024-06-15T23:59:59.999Z')
      
      fc.assert(
        fc.property(
          evaluationWithDateArb(endDate),
          (evaluation) => {
            const evaluations = [{ ...evaluation, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const metrics = calculateMetrics(filtered)
            
            // Evaluation exactly at end_date should be included
            expect(filtered.length).toBe(1)
            expect(metrics.total_evaluations).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should exclude evaluations 1ms before start_date', () => {
      const startTimestamp = new Date('2024-06-15T12:00:00.000Z').getTime()
      const beforeStart = new Date(startTimestamp - 1)
      const startDate = new Date(startTimestamp)
      const endDate = new Date('2024-12-31T23:59:59.999Z')
      
      fc.assert(
        fc.property(
          evaluationWithDateArb(beforeStart),
          (evaluation) => {
            const evaluations = [{ ...evaluation, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const metrics = calculateMetrics(filtered)
            
            // Evaluation 1ms before start_date should be excluded
            expect(filtered.length).toBe(0)
            expect(metrics.total_evaluations).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should exclude evaluations 1ms after end_date', () => {
      const endTimestamp = new Date('2024-06-15T12:00:00.000Z').getTime()
      const afterEnd = new Date(endTimestamp + 1)
      const startDate = new Date('2024-01-01T00:00:00.000Z')
      const endDate = new Date(endTimestamp)
      
      fc.assert(
        fc.property(
          evaluationWithDateArb(afterEnd),
          (evaluation) => {
            const evaluations = [{ ...evaluation, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const metrics = calculateMetrics(filtered)
            
            // Evaluation 1ms after end_date should be excluded
            expect(filtered.length).toBe(0)
            expect(metrics.total_evaluations).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Edge cases', () => {
    test('should handle empty evaluations array', () => {
      fc.assert(
        fc.property(
          dateRangeFilterArb,
          (filters) => {
            const filtered = filterEvaluationsByDateRange([], filters)
            const metrics = calculateMetrics(filtered)
            
            expect(filtered).toEqual([])
            expect(metrics.total_evaluations).toBe(0)
            expect(metrics.average_score).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle same start_date and end_date (single point in time)', () => {
      fc.assert(
        fc.property(
          fc.integer({
            min: new Date('2020-01-01').getTime(),
            max: new Date('2030-12-31').getTime(),
          }),
          evaluationResultsArrayMinOneArb,
          (timestamp, evaluations) => {
            const pointDate = new Date(timestamp).toISOString()
            const filters = {
              start_date: pointDate,
              end_date: pointDate,
            }
            
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            
            // Only evaluations with exactly that date should be included
            filtered.forEach(evaluation => {
              expect(evaluation.completed_at).toBe(pointDate)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle all evaluations outside date range', () => {
      fc.assert(
        fc.property(
          fc.array(
            evaluationWithDateArb(new Date('2020-01-15T12:00:00.000Z')),
            { minLength: 1, maxLength: 10 }
          ),
          (evaluations) => {
            const evalsWithIds = evaluations.map((e, i) => ({ ...e, id: i + 1 }))
            
            // Date range that doesn't include any evaluations
            const filters = {
              start_date: new Date('2025-01-01T00:00:00.000Z').toISOString(),
              end_date: new Date('2025-12-31T23:59:59.999Z').toISOString(),
            }
            
            const filtered = filterEvaluationsByDateRange(evalsWithIds, filters)
            const metrics = calculateMetrics(filtered)
            
            expect(filtered.length).toBe(0)
            expect(metrics.total_evaluations).toBe(0)
            expect(metrics.average_score).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle all evaluations within date range', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z')
      const endDate = new Date('2024-12-31T23:59:59.999Z')
      
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({
              min: startDate.getTime(),
              max: endDate.getTime(),
            }).chain(timestamp => evaluationWithDateArb(new Date(timestamp))),
            { minLength: 1, maxLength: 20 }
          ),
          (evaluations) => {
            const evalsWithIds = evaluations.map((e, i) => ({ ...e, id: i + 1 }))
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterEvaluationsByDateRange(evalsWithIds, filters)
            
            // All evaluations should be included
            expect(filtered.length).toBe(evalsWithIds.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Metrics consistency', () => {
    test('metrics should be consistent between direct calculation and report generation', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const directMetrics = calculateMetrics(filtered)
            
            // Generate reports
            const responsibleReport = generateResponsibleReport(evaluations, filters)
            const spaceReport = generateSpaceReport(evaluations, filters)
            
            // Total evaluations should match
            const responsibleTotal = responsibleReport.reduce((sum, e) => sum + e.total_evaluations, 0)
            const spaceTotal = spaceReport.reduce((sum, e) => sum + e.total_evaluations, 0)
            
            expect(responsibleTotal).toBe(directMetrics.total_evaluations)
            expect(spaceTotal).toBe(directMetrics.total_evaluations)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('filtered evaluations should not be mutated', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const originalCopy = evaluations.map(e => ({ ...e }))
            const originalIds = evaluations.map(e => e.id)
            
            filterEvaluationsByDateRange(evaluations, filters)
            calculateMetrics(filterEvaluationsByDateRange(evaluations, filters))
            
            // Original array should be unchanged
            expect(evaluations.map(e => e.id)).toEqual(originalIds)
            evaluations.forEach((evaluation, index) => {
              expect(evaluation.id).toBe(originalCopy[index].id)
              expect(evaluation.completed_at).toBe(originalCopy[index].completed_at)
              expect(evaluation.score_percentage).toBe(originalCopy[index].score_percentage)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should produce same result for same input (determinism)', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const filtered1 = filterEvaluationsByDateRange(evaluations, filters)
            const filtered2 = filterEvaluationsByDateRange(evaluations, filters)
            const metrics1 = calculateMetrics(filtered1)
            const metrics2 = calculateMetrics(filtered2)
            
            expect(filtered1.map(e => e.id).sort()).toEqual(filtered2.map(e => e.id).sort())
            expect(metrics1.total_evaluations).toBe(metrics2.total_evaluations)
            expect(metrics1.average_score).toBe(metrics2.average_score)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Completeness: All evaluations within range are included in metrics', () => {
    test('should not exclude any evaluations that are within the range', () => {
      fc.assert(
        fc.property(
          evaluationResultsArrayMinOneArb,
          dateRangeFilterArb,
          (evaluations, filters) => {
            const filtered = filterEvaluationsByDateRange(evaluations, filters)
            const filteredIds = new Set(filtered.map(e => e.id))
            const startDate = new Date(filters.start_date!).getTime()
            const endDate = new Date(filters.end_date!).getTime()
            
            // Check that no evaluation within range was excluded
            evaluations.forEach(evaluation => {
              const evalDate = new Date(evaluation.completed_at).getTime()
              const isInRange = evalDate >= startDate && evalDate <= endDate
              
              if (isInRange) {
                expect(filteredIds.has(evaluation.id)).toBe(true)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
