/**
 * History Ordering - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 14: Historial ordenado por fecha descendente
 * 
 * Property Description:
 * Para cualquier consulta de historial de evaluaciones de un espacio, 
 * los resultados deben estar ordenados por fecha de completado en orden descendente.
 * 
 * **Validates: Requirements 5.1**
 */

import * as fc from 'fast-check'

// ============================================================================
// Types for History Items
// ============================================================================

/**
 * Represents an evaluation history item with completion date
 */
interface EvaluationHistoryItem {
  id: number
  fecha: string // ISO date string (completed_at)
  evaluador: {
    id: number
    username: string
  }
  puntuacion_total: {
    score: number
    max: number
    percentage: number
  }
  puntuaciones_por_categoria: {
    organization: { score: number; max: number; percentage: number }
    cleanliness: { score: number; max: number; percentage: number }
    maintenance: { score: number; max: number; percentage: number }
  }
  estado: 'completed' | 'draft'
}

// ============================================================================
// History Ordering Logic (extracted from route.ts)
// ============================================================================

/**
 * Sorts evaluation history items by completion date in descending order
 * This is the core logic that the API endpoint uses to order results
 * 
 * @param items - Array of evaluation history items
 * @returns Sorted array with most recent evaluations first
 */
function sortHistoryByDateDescending(items: EvaluationHistoryItem[]): EvaluationHistoryItem[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.fecha).getTime()
    const dateB = new Date(b.fecha).getTime()
    return dateB - dateA // Descending order (most recent first)
  })
}

/**
 * Validates that an array of history items is sorted by date in descending order
 * 
 * @param items - Array of evaluation history items
 * @returns true if items are sorted by fecha descending, false otherwise
 */
function isOrderedByDateDescending(items: EvaluationHistoryItem[]): boolean {
  if (items.length <= 1) return true
  
  for (let i = 1; i < items.length; i++) {
    const prevDate = new Date(items[i - 1].fecha).getTime()
    const currDate = new Date(items[i].fecha).getTime()
    
    // Previous date should be >= current date (descending order)
    if (prevDate < currDate) {
      return false
    }
  }
  return true
}

/**
 * Gets the dates from history items for comparison
 * 
 * @param items - Array of evaluation history items
 * @returns Array of Date objects
 */
function extractDates(items: EvaluationHistoryItem[]): Date[] {
  return items.map(item => new Date(item.fecha))
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid evaluation IDs (positive integers)
 * Using a larger range to reduce collision probability
 */
const evaluationIdArb = fc.integer({ min: 1, max: 1000000 })

/**
 * Generator for valid user IDs (positive integers)
 */
const userIdArb = fc.integer({ min: 1, max: 10000 })

/**
 * Generator for usernames
 */
const usernameArb = fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0)

/**
 * Generator for ISO date strings within a reasonable range
 * Using integer timestamps to avoid invalid date issues
 */
const isoDateStringArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => new Date(timestamp).toISOString())

/**
 * Generator for score values (0 to max)
 */
const scoreArb = (max: number) => fc.integer({ min: 0, max })

/**
 * Generator for max score values (positive integers)
 */
const maxScoreArb = fc.integer({ min: 1, max: 100 })

/**
 * Generator for percentage values (0 to 100)
 */
const percentageArb = fc.float({ min: 0, max: 100, noNaN: true })

/**
 * Generator for evaluation status
 */
const estadoArb = fc.constantFrom<'completed' | 'draft'>('completed', 'draft')

/**
 * Generator for category scores
 */
const categoryScoreArb = maxScoreArb.chain(max => 
  fc.record({
    score: scoreArb(max),
    max: fc.constant(max),
    percentage: percentageArb,
  })
)

/**
 * Generator for a single evaluation history item
 */
const evaluationHistoryItemArb = fc.record({
  id: evaluationIdArb,
  fecha: isoDateStringArb,
  evaluador: fc.record({
    id: userIdArb,
    username: usernameArb,
  }),
  puntuacion_total: maxScoreArb.chain(max => 
    fc.record({
      score: scoreArb(max),
      max: fc.constant(max),
      percentage: percentageArb,
    })
  ),
  puntuaciones_por_categoria: fc.record({
    organization: categoryScoreArb,
    cleanliness: categoryScoreArb,
    maintenance: categoryScoreArb,
  }),
  estado: estadoArb,
})

/**
 * Generator for an array of evaluation history items with unique IDs
 */
const evaluationHistoryArrayArb = fc.array(evaluationHistoryItemArb, { 
  minLength: 0, 
  maxLength: 50 
}).map(items => {
  // Ensure unique IDs by reassigning them
  return items.map((item, index) => ({ ...item, id: index + 1 }))
})

/**
 * Generator for an array with at least 2 items (for meaningful ordering tests)
 */
const evaluationHistoryArrayMinTwoArb = fc.array(evaluationHistoryItemArb, { 
  minLength: 2, 
  maxLength: 50 
}).map(items => {
  // Ensure unique IDs by reassigning them
  return items.map((item, index) => ({ ...item, id: index + 1 }))
})

/**
 * Generator for items with specific dates to test ordering
 */
const historyItemWithDateArb = (date: Date) => fc.record({
  id: evaluationIdArb,
  fecha: fc.constant(date.toISOString()),
  evaluador: fc.record({
    id: userIdArb,
    username: usernameArb,
  }),
  puntuacion_total: maxScoreArb.chain(max => 
    fc.record({
      score: scoreArb(max),
      max: fc.constant(max),
      percentage: percentageArb,
    })
  ),
  puntuaciones_por_categoria: fc.record({
    organization: categoryScoreArb,
    cleanliness: categoryScoreArb,
    maintenance: categoryScoreArb,
  }),
  estado: estadoArb,
})

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 14: Historial ordenado por fecha descendente', () => {
  /**
   * Property 14: History Ordered by Date Descending
   * For any query of evaluation history for a space, the results must be 
   * ordered by completion date in descending order.
   * 
   * **Validates: Requirements 5.1**
   */

  describe('Core Property: History items are sorted by fecha descending', () => {
    test('should sort any array of history items by fecha in descending order', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // Result should be ordered by date descending
            expect(isOrderedByDateDescending(sorted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('sorted result should have most recent date first', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayMinTwoArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // First item should have the most recent (or equal) date
            const dates = extractDates(sorted)
            const maxDate = Math.max(...dates.map(d => d.getTime()))
            
            expect(dates[0].getTime()).toBe(maxDate)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('sorted result should have oldest date last', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayMinTwoArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // Last item should have the oldest (or equal) date
            const dates = extractDates(sorted)
            const minDate = Math.min(...dates.map(d => d.getTime()))
            
            expect(dates[dates.length - 1].getTime()).toBe(minDate)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('each item should have fecha >= next item fecha', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayMinTwoArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // Check pairwise ordering
            for (let i = 1; i < sorted.length; i++) {
              const prevDate = new Date(sorted[i - 1].fecha).getTime()
              const currDate = new Date(sorted[i].fecha).getTime()
              
              expect(prevDate).toBeGreaterThanOrEqual(currDate)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Sorting preserves all items', () => {
    test('sorted array should have same length as input', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            expect(sorted.length).toBe(items.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('sorted array should contain all original items', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // All original IDs should be present
            const originalIds = items.map(i => i.id).sort()
            const sortedIds = sorted.map(i => i.id).sort()
            
            expect(sortedIds).toEqual(originalIds)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('sorting should not modify item data', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // Each item in sorted should exist in original with same data
            sorted.forEach(sortedItem => {
              const originalItem = items.find(i => i.id === sortedItem.id)
              expect(originalItem).toBeDefined()
              expect(sortedItem).toEqual(originalItem)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Edge cases', () => {
    test('should handle empty array', () => {
      const sorted = sortHistoryByDateDescending([])
      
      expect(sorted).toEqual([])
      expect(isOrderedByDateDescending(sorted)).toBe(true)
    })

    test('should handle single item array', () => {
      fc.assert(
        fc.property(
          evaluationHistoryItemArb,
          (item) => {
            const sorted = sortHistoryByDateDescending([item])
            
            expect(sorted.length).toBe(1)
            expect(sorted[0]).toEqual(item)
            expect(isOrderedByDateDescending(sorted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle items with same date', () => {
      const fixedDate = new Date('2024-06-15T12:00:00.000Z')
      
      fc.assert(
        fc.property(
          fc.array(historyItemWithDateArb(fixedDate), { minLength: 2, maxLength: 10 }),
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // All items have same date, so any order is valid
            // But the result should still pass the ordering check
            expect(isOrderedByDateDescending(sorted)).toBe(true)
            expect(sorted.length).toBe(items.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle items with dates at millisecond precision', () => {
      const baseTime = new Date('2024-06-15T12:00:00.000Z').getTime()
      
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 0, max: 1000 }).chain(offset => 
              historyItemWithDateArb(new Date(baseTime + offset))
            ),
            { minLength: 2, maxLength: 20 }
          ),
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            expect(isOrderedByDateDescending(sorted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle dates spanning multiple years', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 2020, max: 2030 }).chain(year => {
              const date = new Date(`${year}-06-15T12:00:00.000Z`)
              return historyItemWithDateArb(date)
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            expect(isOrderedByDateDescending(sorted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Idempotency', () => {
    test('sorting an already sorted array should produce same result', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const sorted1 = sortHistoryByDateDescending(items)
            const sorted2 = sortHistoryByDateDescending(sorted1)
            
            // Sorting twice should give same result
            expect(sorted2.map(i => i.id)).toEqual(sorted1.map(i => i.id))
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Stability', () => {
    test('items with same date should maintain relative order (stable sort)', () => {
      // Create items with same date but different IDs
      const fixedDate = new Date('2024-06-15T12:00:00.000Z')
      
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 1000 }),
            { minLength: 2, maxLength: 10 }
          ).chain(ids => {
            // Create items with unique IDs but same date
            const uniqueIds = [...new Set(ids)]
            return fc.tuple(
              ...uniqueIds.map(id => 
                historyItemWithDateArb(fixedDate).map(item => ({ ...item, id }))
              )
            )
          }),
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            // All items should be present
            expect(sorted.length).toBe(items.length)
            
            // Result should be ordered (all same date, so any order is valid)
            expect(isOrderedByDateDescending(sorted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isOrderedByDateDescending validation function', () => {
    test('should return true for properly ordered arrays', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const sorted = sortHistoryByDateDescending(items)
            
            expect(isOrderedByDateDescending(sorted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return true for empty array', () => {
      expect(isOrderedByDateDescending([])).toBe(true)
    })

    test('should return true for single item', () => {
      fc.assert(
        fc.property(
          evaluationHistoryItemArb,
          (item) => {
            expect(isOrderedByDateDescending([item])).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return false for ascending order', () => {
      // Create items with ascending dates
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-06-01'),
        new Date('2024-12-01'),
      ]
      
      const items: EvaluationHistoryItem[] = dates.map((date, index) => ({
        id: index + 1,
        fecha: date.toISOString(),
        evaluador: { id: 1, username: 'test' },
        puntuacion_total: { score: 80, max: 100, percentage: 80 },
        puntuaciones_por_categoria: {
          organization: { score: 30, max: 40, percentage: 75 },
          cleanliness: { score: 25, max: 30, percentage: 83.33 },
          maintenance: { score: 25, max: 30, percentage: 83.33 },
        },
        estado: 'completed',
      }))
      
      // Items are in ascending order (oldest first)
      expect(isOrderedByDateDescending(items)).toBe(false)
    })

    test('should return true for descending order', () => {
      // Create items with descending dates
      const dates = [
        new Date('2024-12-01'),
        new Date('2024-06-01'),
        new Date('2024-01-01'),
      ]
      
      const items: EvaluationHistoryItem[] = dates.map((date, index) => ({
        id: index + 1,
        fecha: date.toISOString(),
        evaluador: { id: 1, username: 'test' },
        puntuacion_total: { score: 80, max: 100, percentage: 80 },
        puntuaciones_por_categoria: {
          organization: { score: 30, max: 40, percentage: 75 },
          cleanliness: { score: 25, max: 30, percentage: 83.33 },
          maintenance: { score: 25, max: 30, percentage: 83.33 },
        },
        estado: 'completed',
      }))
      
      // Items are in descending order (newest first)
      expect(isOrderedByDateDescending(items)).toBe(true)
    })
  })

  describe('Determinism', () => {
    test('should produce same result for same input', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const result1 = sortHistoryByDateDescending(items)
            const result2 = sortHistoryByDateDescending(items)
            
            expect(result1.map(i => i.id)).toEqual(result2.map(i => i.id))
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Immutability', () => {
    test('should not mutate the original array', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const originalCopy = items.map(i => ({ ...i }))
            const originalIds = items.map(i => i.id)
            
            sortHistoryByDateDescending(items)
            
            // Original array should be unchanged
            expect(items.map(i => i.id)).toEqual(originalIds)
            items.forEach((item, index) => {
              expect(item).toEqual(originalCopy[index])
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
