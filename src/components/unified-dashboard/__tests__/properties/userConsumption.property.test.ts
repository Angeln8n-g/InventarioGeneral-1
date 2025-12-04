/**
 * Property-based tests for User Consumption
 *
 * **Feature: unified-reports-dashboard, Property 16: User Consumption Aggregation Consistency**
 * **Feature: unified-reports-dashboard, Property 17: User Consumption Date Filter**
 * **Feature: unified-reports-dashboard, Property 18: User Consumption Sorting**
 *
 * Validates: Requirements 11.1, 11.2, 11.4, 11.5
 */

import * as fc from 'fast-check'

// ============================================================================
// Test Utilities
// ============================================================================

interface ConsumptionByType {
  typeId: number
  typeName: string
  quantity: number
  cost: number
}

interface UserConsumption {
  userId: number
  username: string
  email: string
  totalQuantity: number
  totalCost: number
  byType: ConsumptionByType[]
}

interface ConsumptionRecord {
  userId: number
  username: string
  email: string
  typeId: number
  typeName: string
  quantity: number
  cost: number
  date: string
}

/**
 * Aggregates consumption records into user consumption summaries
 */
function aggregateUserConsumption(records: ConsumptionRecord[]): UserConsumption[] {
  const userMap = new Map<number, UserConsumption>()

  for (const record of records) {
    if (!userMap.has(record.userId)) {
      userMap.set(record.userId, {
        userId: record.userId,
        username: record.username,
        email: record.email,
        totalQuantity: 0,
        totalCost: 0,
        byType: [],
      })
    }

    const user = userMap.get(record.userId)!
    user.totalQuantity += record.quantity
    user.totalCost += record.cost

    const existingType = user.byType.find((t) => t.typeId === record.typeId)
    if (existingType) {
      existingType.quantity += record.quantity
      existingType.cost += record.cost
    } else {
      user.byType.push({
        typeId: record.typeId,
        typeName: record.typeName,
        quantity: record.quantity,
        cost: record.cost,
      })
    }
  }

  return Array.from(userMap.values())
}

/**
 * Filters consumption records by date range
 */
function filterByDateRange(
  records: ConsumptionRecord[],
  startDate: string,
  endDate: string
): ConsumptionRecord[] {
  const start = new Date(startDate)
  const end = new Date(endDate)

  return records.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= start && recordDate <= end
  })
}

/**
 * Sorts user consumption by specified field
 */
function sortUserConsumption(
  users: UserConsumption[],
  sortBy: 'quantity' | 'cost' | 'name',
  direction: 'asc' | 'desc'
): UserConsumption[] {
  return [...users].sort((a, b) => {
    let comparison: number

    switch (sortBy) {
      case 'quantity':
        comparison = a.totalQuantity - b.totalQuantity
        break
      case 'cost':
        comparison = a.totalCost - b.totalCost
        break
      case 'name':
      default:
        comparison = a.username.localeCompare(b.username)
        break
    }

    return direction === 'asc' ? comparison : -comparison
  })
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const dateStringArb = fc
  .integer({ min: 2023, max: 2025 })
  .chain((year) =>
    fc
      .integer({ min: 1, max: 12 })
      .chain((month) =>
        fc
          .integer({ min: 1, max: 28 })
          .map(
            (day) =>
              `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          )
      )
  )

const consumptionRecordArb: fc.Arbitrary<ConsumptionRecord> = fc.record({
  userId: fc.integer({ min: 1, max: 100 }),
  username: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  typeId: fc.integer({ min: 1, max: 50 }),
  typeName: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  quantity: fc.integer({ min: 1, max: 100 }),
  cost: fc.integer({ min: 1, max: 100000 }).map(n => n / 100),
  date: dateStringArb,
})

const sortByArb = fc.constantFrom<'quantity' | 'cost' | 'name'>('quantity', 'cost', 'name')
const sortDirectionArb = fc.constantFrom<'asc' | 'desc'>('asc', 'desc')

// ============================================================================
// Property Tests
// ============================================================================

describe('User Consumption Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 16: User Consumption Aggregation Consistency**
   *
   * For any user, the sum of consumption quantities by consumable type
   * should equal the user's total consumption quantity.
   */
  describe('Property 16: User Consumption Aggregation Consistency', () => {
    it('should have total quantity equal to sum of quantities by type', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          (records) => {
            const aggregated = aggregateUserConsumption(records)

            return aggregated.every((user) => {
              const sumByType = user.byType.reduce((sum, t) => sum + t.quantity, 0)
              return Math.abs(user.totalQuantity - sumByType) < 0.001
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have total cost equal to sum of costs by type', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          (records) => {
            const aggregated = aggregateUserConsumption(records)

            return aggregated.every((user) => {
              const sumByType = user.byType.reduce((sum, t) => sum + t.cost, 0)
              // Use tolerance for floating point comparison
              return Math.abs(user.totalCost - sumByType) < 0.01
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should aggregate all records for each user', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          (records) => {
            const aggregated = aggregateUserConsumption(records)

            // Total quantity across all users should equal sum of all records
            const totalFromAggregated = aggregated.reduce((sum, u) => sum + u.totalQuantity, 0)
            const totalFromRecords = records.reduce((sum, r) => sum + r.quantity, 0)

            return Math.abs(totalFromAggregated - totalFromRecords) < 0.001
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should create one entry per unique user', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          (records) => {
            const aggregated = aggregateUserConsumption(records)
            const uniqueUserIds = new Set(records.map((r) => r.userId))

            return aggregated.length === uniqueUserIds.size
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: unified-reports-dashboard, Property 17: User Consumption Date Filter**
   *
   * For any date range filter, user consumption totals should only include
   * consumptions within that date range.
   */
  describe('Property 17: User Consumption Date Filter', () => {
    it('should only include records within the date range', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          fc.constant('2024-01-01'),
          fc.constant('2024-12-31'),
          (records, startDate, endDate) => {
            const filtered = filterByDateRange(records, startDate, endDate)
            const start = new Date(startDate)
            const end = new Date(endDate)

            return filtered.every((record) => {
              const recordDate = new Date(record.date)
              return recordDate >= start && recordDate <= end
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not include records outside the date range', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          fc.constant('2024-06-01'),
          fc.constant('2024-06-30'),
          (records, startDate, endDate) => {
            const filtered = filterByDateRange(records, startDate, endDate)
            const start = new Date(startDate)
            const end = new Date(endDate)

            const outsideRecords = records.filter((record) => {
              const recordDate = new Date(record.date)
              return recordDate < start || recordDate > end
            })

            // None of the outside records should be in filtered
            return outsideRecords.every(
              (outside) => !filtered.some((f) => f === outside)
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly aggregate filtered records', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          fc.constant('2024-01-01'),
          fc.constant('2024-12-31'),
          (records, startDate, endDate) => {
            const filtered = filterByDateRange(records, startDate, endDate)
            const aggregated = aggregateUserConsumption(filtered)

            // Total should match sum of filtered records
            const totalFromAggregated = aggregated.reduce((sum, u) => sum + u.totalQuantity, 0)
            const totalFromFiltered = filtered.reduce((sum, r) => sum + r.quantity, 0)

            return Math.abs(totalFromAggregated - totalFromFiltered) < 0.001
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: unified-reports-dashboard, Property 18: User Consumption Sorting**
   *
   * For any sort by consumption quantity, users should be correctly ordered
   * by their total consumption.
   */
  describe('Property 18: User Consumption Sorting', () => {
    it('should sort by quantity correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          sortDirectionArb,
          (records, direction) => {
            const aggregated = aggregateUserConsumption(records)
            const sorted = sortUserConsumption(aggregated, 'quantity', direction)

            for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i - 1].totalQuantity
              const curr = sorted[i].totalQuantity

              if (direction === 'asc' && prev > curr) return false
              if (direction === 'desc' && prev < curr) return false
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should sort by cost correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          sortDirectionArb,
          (records, direction) => {
            const aggregated = aggregateUserConsumption(records)
            const sorted = sortUserConsumption(aggregated, 'cost', direction)

            for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i - 1].totalCost
              const curr = sorted[i].totalCost

              if (direction === 'asc' && prev > curr) return false
              if (direction === 'desc' && prev < curr) return false
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should sort by name correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          sortDirectionArb,
          (records, direction) => {
            const aggregated = aggregateUserConsumption(records)
            const sorted = sortUserConsumption(aggregated, 'name', direction)

            for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i - 1].username
              const curr = sorted[i].username
              const comparison = prev.localeCompare(curr)

              if (direction === 'asc' && comparison > 0) return false
              if (direction === 'desc' && comparison < 0) return false
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve all users after sorting', () => {
      fc.assert(
        fc.property(
          fc.array(consumptionRecordArb, { minLength: 0, maxLength: 100 }),
          sortByArb,
          sortDirectionArb,
          (records, sortBy, direction) => {
            const aggregated = aggregateUserConsumption(records)
            const sorted = sortUserConsumption(aggregated, sortBy, direction)

            // Same length
            if (sorted.length !== aggregated.length) return false

            // All users present
            return aggregated.every((user) => sorted.some((s) => s.userId === user.userId))
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
