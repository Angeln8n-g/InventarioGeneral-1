/**
 * Date Filter - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 15: Filtro de fechas retorna solo evaluaciones en rango
 * 
 * Property Description:
 * Para cualquier consulta de historial con filtro de rango de fechas, 
 * todas las evaluaciones retornadas deben tener fecha de completado dentro del rango especificado.
 * 
 * **Validates: Requirements 5.5**
 */

import * as fc from 'fast-check'

// ============================================================================
// Types for History Items and Date Filtering
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

/**
 * Represents a date range filter
 */
interface DateRangeFilter {
  start_date?: string // ISO date string
  end_date?: string   // ISO date string
}

// ============================================================================
// Date Filter Logic (extracted from route.ts and supabase-client.ts)
// ============================================================================

/**
 * Filters evaluation history items by date range
 * This simulates the filtering logic used in the API endpoint
 * 
 * The filter uses:
 * - start_date: completed_at >= start_date (inclusive)
 * - end_date: completed_at <= end_date (inclusive)
 * 
 * @param items - Array of evaluation history items
 * @param filters - Date range filter with optional start_date and end_date
 * @returns Filtered array with only items within the date range
 */
function filterByDateRange(
  items: EvaluationHistoryItem[],
  filters: DateRangeFilter
): EvaluationHistoryItem[] {
  return items.filter((item) => {
    const itemDate = new Date(item.fecha).getTime()
    
    // Check start_date filter (inclusive: completed_at >= start_date)
    if (filters.start_date) {
      const startDate = new Date(filters.start_date).getTime()
      if (itemDate < startDate) {
        return false
      }
    }
    
    // Check end_date filter (inclusive: completed_at <= end_date)
    if (filters.end_date) {
      const endDate = new Date(filters.end_date).getTime()
      if (itemDate > endDate) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Validates that all items in an array are within the specified date range
 * 
 * @param items - Array of evaluation history items
 * @param filters - Date range filter
 * @returns true if all items are within the range, false otherwise
 */
function allItemsWithinDateRange(
  items: EvaluationHistoryItem[],
  filters: DateRangeFilter
): boolean {
  return items.every((item) => {
    const itemDate = new Date(item.fecha).getTime()
    
    if (filters.start_date) {
      const startDate = new Date(filters.start_date).getTime()
      if (itemDate < startDate) {
        return false
      }
    }
    
    if (filters.end_date) {
      const endDate = new Date(filters.end_date).getTime()
      if (itemDate > endDate) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Checks if a date is within a range (inclusive on both ends)
 * 
 * @param date - The date to check
 * @param startDate - Start of range (optional)
 * @param endDate - End of range (optional)
 * @returns true if date is within range
 */
function isDateInRange(
  date: Date,
  startDate?: Date,
  endDate?: Date
): boolean {
  const dateTime = date.getTime()
  
  if (startDate && dateTime < startDate.getTime()) {
    return false
  }
  
  if (endDate && dateTime > endDate.getTime()) {
    return false
  }
  
  return true
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid evaluation IDs (positive integers)
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
 * Generator for an array with at least 1 item (for meaningful filter tests)
 */
const evaluationHistoryArrayMinOneArb = fc.array(evaluationHistoryItemArb, { 
  minLength: 1, 
  maxLength: 50 
}).map(items => {
  // Ensure unique IDs by reassigning them
  return items.map((item, index) => ({ ...item, id: index + 1 }))
})

/**
 * Generator for a valid date range (start_date <= end_date)
 * Both dates are optional, but when both are present, start <= end
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
  // Ensure start <= end
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
 * Generator for any valid date range filter (both, start only, end only, or none)
 */
const anyDateRangeFilterArb = fc.oneof(
  dateRangeFilterArb,
  startDateOnlyFilterArb,
  endDateOnlyFilterArb,
  fc.constant({ start_date: undefined, end_date: undefined })
)

/**
 * Generator for items with a specific date
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

describe('Feature: classroom-evaluation-system, Property 15: Filtro de fechas retorna solo evaluaciones en rango', () => {
  /**
   * Property 15: Date Filter Returns Only Evaluations Within Range
   * For any query of history with date range filter, all returned evaluations 
   * must have completion date within the specified range.
   * 
   * **Validates: Requirements 5.5**
   */

  describe('Core Property: All filtered items are within date range', () => {
    test('should return only items within the specified date range (both start and end)', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          dateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            
            // All filtered items must be within the date range
            expect(allItemsWithinDateRange(filtered, filters)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return only items >= start_date when only start_date is specified', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          startDateOnlyFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const startDate = new Date(filters.start_date!).getTime()
            
            // All filtered items must have fecha >= start_date
            filtered.forEach(item => {
              const itemDate = new Date(item.fecha).getTime()
              expect(itemDate).toBeGreaterThanOrEqual(startDate)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return only items <= end_date when only end_date is specified', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          endDateOnlyFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const endDate = new Date(filters.end_date!).getTime()
            
            // All filtered items must have fecha <= end_date
            filtered.forEach(item => {
              const itemDate = new Date(item.fecha).getTime()
              expect(itemDate).toBeLessThanOrEqual(endDate)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return all items when no date filter is specified', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          (items) => {
            const filtered = filterByDateRange(items, {})
            
            // All items should be returned when no filter
            expect(filtered.length).toBe(items.length)
            expect(filtered.map(i => i.id).sort()).toEqual(items.map(i => i.id).sort())
          }
        ),
        { numRuns: 100 }
      )
    })

    test('each filtered item fecha should satisfy start_date <= fecha <= end_date', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          dateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const startDate = new Date(filters.start_date!).getTime()
            const endDate = new Date(filters.end_date!).getTime()
            
            // Each filtered item must satisfy the range constraint
            filtered.forEach(item => {
              const itemDate = new Date(item.fecha).getTime()
              expect(itemDate).toBeGreaterThanOrEqual(startDate)
              expect(itemDate).toBeLessThanOrEqual(endDate)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Completeness: All items within range are included', () => {
    test('should include all items that are within the date range', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          dateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const startDate = new Date(filters.start_date!).getTime()
            const endDate = new Date(filters.end_date!).getTime()
            
            // Count items that should be in range
            const expectedInRange = items.filter(item => {
              const itemDate = new Date(item.fecha).getTime()
              return itemDate >= startDate && itemDate <= endDate
            })
            
            // Filtered should contain exactly those items
            expect(filtered.length).toBe(expectedInRange.length)
            expect(filtered.map(i => i.id).sort()).toEqual(expectedInRange.map(i => i.id).sort())
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should not exclude any items that are within the range', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayMinOneArb,
          dateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const filteredIds = new Set(filtered.map(i => i.id))
            const startDate = new Date(filters.start_date!).getTime()
            const endDate = new Date(filters.end_date!).getTime()
            
            // Check that no item within range was excluded
            items.forEach(item => {
              const itemDate = new Date(item.fecha).getTime()
              const isInRange = itemDate >= startDate && itemDate <= endDate
              
              if (isInRange) {
                expect(filteredIds.has(item.id)).toBe(true)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Exclusion: Items outside range are excluded', () => {
    test('should exclude items before start_date', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayMinOneArb,
          startDateOnlyFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const filteredIds = new Set(filtered.map(i => i.id))
            const startDate = new Date(filters.start_date!).getTime()
            
            // Items before start_date should be excluded
            items.forEach(item => {
              const itemDate = new Date(item.fecha).getTime()
              if (itemDate < startDate) {
                expect(filteredIds.has(item.id)).toBe(false)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should exclude items after end_date', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayMinOneArb,
          endDateOnlyFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const filteredIds = new Set(filtered.map(i => i.id))
            const endDate = new Date(filters.end_date!).getTime()
            
            // Items after end_date should be excluded
            items.forEach(item => {
              const itemDate = new Date(item.fecha).getTime()
              if (itemDate > endDate) {
                expect(filteredIds.has(item.id)).toBe(false)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should exclude items outside both bounds', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayMinOneArb,
          dateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            const filteredIds = new Set(filtered.map(i => i.id))
            const startDate = new Date(filters.start_date!).getTime()
            const endDate = new Date(filters.end_date!).getTime()
            
            // Items outside range should be excluded
            items.forEach(item => {
              const itemDate = new Date(item.fecha).getTime()
              const isOutsideRange = itemDate < startDate || itemDate > endDate
              
              if (isOutsideRange) {
                expect(filteredIds.has(item.id)).toBe(false)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Boundary conditions', () => {
    test('should include items exactly at start_date (inclusive)', () => {
      const startDate = new Date('2024-06-15T00:00:00.000Z')
      const endDate = new Date('2024-12-31T23:59:59.999Z')
      
      fc.assert(
        fc.property(
          historyItemWithDateArb(startDate),
          (item) => {
            const items = [{ ...item, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterByDateRange(items, filters)
            
            // Item exactly at start_date should be included
            expect(filtered.length).toBe(1)
            expect(filtered[0].id).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should include items exactly at end_date (inclusive)', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z')
      const endDate = new Date('2024-06-15T23:59:59.999Z')
      
      fc.assert(
        fc.property(
          historyItemWithDateArb(endDate),
          (item) => {
            const items = [{ ...item, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterByDateRange(items, filters)
            
            // Item exactly at end_date should be included
            expect(filtered.length).toBe(1)
            expect(filtered[0].id).toBe(1)
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
          evaluationHistoryArrayMinOneArb,
          (timestamp, items) => {
            const pointDate = new Date(timestamp).toISOString()
            const filters = {
              start_date: pointDate,
              end_date: pointDate,
            }
            
            const filtered = filterByDateRange(items, filters)
            
            // Only items with exactly that date should be included
            filtered.forEach(item => {
              expect(item.fecha).toBe(pointDate)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should exclude item 1ms before start_date', () => {
      const startTimestamp = new Date('2024-06-15T12:00:00.000Z').getTime()
      const beforeStart = new Date(startTimestamp - 1)
      const startDate = new Date(startTimestamp)
      const endDate = new Date('2024-12-31T23:59:59.999Z')
      
      fc.assert(
        fc.property(
          historyItemWithDateArb(beforeStart),
          (item) => {
            const items = [{ ...item, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterByDateRange(items, filters)
            
            // Item 1ms before start_date should be excluded
            expect(filtered.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should exclude item 1ms after end_date', () => {
      const endTimestamp = new Date('2024-06-15T12:00:00.000Z').getTime()
      const afterEnd = new Date(endTimestamp + 1)
      const startDate = new Date('2024-01-01T00:00:00.000Z')
      const endDate = new Date(endTimestamp)
      
      fc.assert(
        fc.property(
          historyItemWithDateArb(afterEnd),
          (item) => {
            const items = [{ ...item, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterByDateRange(items, filters)
            
            // Item 1ms after end_date should be excluded
            expect(filtered.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Edge cases', () => {
    test('should handle empty array', () => {
      fc.assert(
        fc.property(
          dateRangeFilterArb,
          (filters) => {
            const filtered = filterByDateRange([], filters)
            
            expect(filtered).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle single item within range', () => {
      fc.assert(
        fc.property(
          evaluationHistoryItemArb,
          (item) => {
            const itemDate = new Date(item.fecha)
            const startDate = new Date(itemDate.getTime() - 86400000) // 1 day before
            const endDate = new Date(itemDate.getTime() + 86400000)   // 1 day after
            
            const items = [{ ...item, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterByDateRange(items, filters)
            
            expect(filtered.length).toBe(1)
            expect(filtered[0].id).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle single item outside range', () => {
      fc.assert(
        fc.property(
          evaluationHistoryItemArb,
          (item) => {
            const itemDate = new Date(item.fecha)
            // Create a range that doesn't include the item
            const startDate = new Date(itemDate.getTime() + 86400000)  // 1 day after item
            const endDate = new Date(itemDate.getTime() + 172800000)   // 2 days after item
            
            const items = [{ ...item, id: 1 }]
            const filters = {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
            
            const filtered = filterByDateRange(items, filters)
            
            expect(filtered.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle dates at millisecond precision', () => {
      const baseTime = new Date('2024-06-15T12:00:00.000Z').getTime()
      
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 0, max: 1000 }).chain(offset => 
              historyItemWithDateArb(new Date(baseTime + offset))
            ),
            { minLength: 5, maxLength: 20 }
          ),
          (items) => {
            const itemsWithIds = items.map((item, index) => ({ ...item, id: index + 1 }))
            
            // Filter for items in the first 500ms
            const filters = {
              start_date: new Date(baseTime).toISOString(),
              end_date: new Date(baseTime + 500).toISOString(),
            }
            
            const filtered = filterByDateRange(itemsWithIds, filters)
            
            // All filtered items should be within the 500ms window
            expect(allItemsWithinDateRange(filtered, filters)).toBe(true)
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
            { minLength: 5, maxLength: 20 }
          ),
          (items) => {
            const itemsWithIds = items.map((item, index) => ({ ...item, id: index + 1 }))
            
            // Filter for years 2023-2025
            const filters = {
              start_date: new Date('2023-01-01T00:00:00.000Z').toISOString(),
              end_date: new Date('2025-12-31T23:59:59.999Z').toISOString(),
            }
            
            const filtered = filterByDateRange(itemsWithIds, filters)
            
            // All filtered items should be within 2023-2025
            expect(allItemsWithinDateRange(filtered, filters)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Filter preserves item data', () => {
    test('filtering should not modify item data', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          dateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            
            // Each filtered item should have identical data to original
            filtered.forEach(filteredItem => {
              const originalItem = items.find(i => i.id === filteredItem.id)
              expect(originalItem).toBeDefined()
              expect(filteredItem).toEqual(originalItem)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('filtered array should be a subset of original', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          anyDateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            
            // Filtered length should be <= original length
            expect(filtered.length).toBeLessThanOrEqual(items.length)
            
            // All filtered IDs should exist in original
            const originalIds = new Set(items.map(i => i.id))
            filtered.forEach(item => {
              expect(originalIds.has(item.id)).toBe(true)
            })
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
          dateRangeFilterArb,
          (items, filters) => {
            const originalCopy = items.map(i => ({ ...i }))
            const originalIds = items.map(i => i.id)
            
            filterByDateRange(items, filters)
            
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

  describe('Determinism', () => {
    test('should produce same result for same input', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          dateRangeFilterArb,
          (items, filters) => {
            const result1 = filterByDateRange(items, filters)
            const result2 = filterByDateRange(items, filters)
            
            expect(result1.map(i => i.id).sort()).toEqual(result2.map(i => i.id).sort())
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('allItemsWithinDateRange validation function', () => {
    test('should return true for properly filtered arrays', () => {
      fc.assert(
        fc.property(
          evaluationHistoryArrayArb,
          dateRangeFilterArb,
          (items, filters) => {
            const filtered = filterByDateRange(items, filters)
            
            expect(allItemsWithinDateRange(filtered, filters)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return true for empty array', () => {
      fc.assert(
        fc.property(
          dateRangeFilterArb,
          (filters) => {
            expect(allItemsWithinDateRange([], filters)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return false when item is before start_date', () => {
      const startDate = new Date('2024-06-15T00:00:00.000Z')
      const beforeStart = new Date('2024-06-14T23:59:59.999Z')
      
      const item: EvaluationHistoryItem = {
        id: 1,
        fecha: beforeStart.toISOString(),
        evaluador: { id: 1, username: 'test' },
        puntuacion_total: { score: 80, max: 100, percentage: 80 },
        puntuaciones_por_categoria: {
          organization: { score: 30, max: 40, percentage: 75 },
          cleanliness: { score: 25, max: 30, percentage: 83.33 },
          maintenance: { score: 25, max: 30, percentage: 83.33 },
        },
        estado: 'completed',
      }
      
      const filters = {
        start_date: startDate.toISOString(),
        end_date: new Date('2024-12-31T23:59:59.999Z').toISOString(),
      }
      
      expect(allItemsWithinDateRange([item], filters)).toBe(false)
    })

    test('should return false when item is after end_date', () => {
      const endDate = new Date('2024-06-15T23:59:59.999Z')
      const afterEnd = new Date('2024-06-16T00:00:00.000Z')
      
      const item: EvaluationHistoryItem = {
        id: 1,
        fecha: afterEnd.toISOString(),
        evaluador: { id: 1, username: 'test' },
        puntuacion_total: { score: 80, max: 100, percentage: 80 },
        puntuaciones_por_categoria: {
          organization: { score: 30, max: 40, percentage: 75 },
          cleanliness: { score: 25, max: 30, percentage: 83.33 },
          maintenance: { score: 25, max: 30, percentage: 83.33 },
        },
        estado: 'completed',
      }
      
      const filters = {
        start_date: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        end_date: endDate.toISOString(),
      }
      
      expect(allItemsWithinDateRange([item], filters)).toBe(false)
    })

    test('should return true when item is exactly at start_date', () => {
      const startDate = new Date('2024-06-15T00:00:00.000Z')
      
      const item: EvaluationHistoryItem = {
        id: 1,
        fecha: startDate.toISOString(),
        evaluador: { id: 1, username: 'test' },
        puntuacion_total: { score: 80, max: 100, percentage: 80 },
        puntuaciones_por_categoria: {
          organization: { score: 30, max: 40, percentage: 75 },
          cleanliness: { score: 25, max: 30, percentage: 83.33 },
          maintenance: { score: 25, max: 30, percentage: 83.33 },
        },
        estado: 'completed',
      }
      
      const filters = {
        start_date: startDate.toISOString(),
        end_date: new Date('2024-12-31T23:59:59.999Z').toISOString(),
      }
      
      expect(allItemsWithinDateRange([item], filters)).toBe(true)
    })

    test('should return true when item is exactly at end_date', () => {
      const endDate = new Date('2024-06-15T23:59:59.999Z')
      
      const item: EvaluationHistoryItem = {
        id: 1,
        fecha: endDate.toISOString(),
        evaluador: { id: 1, username: 'test' },
        puntuacion_total: { score: 80, max: 100, percentage: 80 },
        puntuaciones_por_categoria: {
          organization: { score: 30, max: 40, percentage: 75 },
          cleanliness: { score: 25, max: 30, percentage: 83.33 },
          maintenance: { score: 25, max: 30, percentage: 83.33 },
        },
        estado: 'completed',
      }
      
      const filters = {
        start_date: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        end_date: endDate.toISOString(),
      }
      
      expect(allItemsWithinDateRange([item], filters)).toBe(true)
    })
  })

  describe('isDateInRange helper function', () => {
    test('should return true for date within range', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() }),
            fc.integer({ min: new Date('2025-01-02').getTime(), max: new Date('2030-12-31').getTime() })
          ),
          ([startTime, endTime]) => {
            const startDate = new Date(startTime)
            const endDate = new Date(endTime)
            // Pick a date in the middle
            const middleTime = startTime + Math.floor((endTime - startTime) / 2)
            const middleDate = new Date(middleTime)
            
            expect(isDateInRange(middleDate, startDate, endDate)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return false for date before range', () => {
      const startDate = new Date('2024-06-15')
      const endDate = new Date('2024-12-31')
      const beforeDate = new Date('2024-06-14')
      
      expect(isDateInRange(beforeDate, startDate, endDate)).toBe(false)
    })

    test('should return false for date after range', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-06-15')
      const afterDate = new Date('2024-06-16')
      
      expect(isDateInRange(afterDate, startDate, endDate)).toBe(false)
    })

    test('should return true when no bounds specified', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            expect(isDateInRange(date, undefined, undefined)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
