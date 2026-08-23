/**
 * Property-Based Tests for Top Users
 *
 * **Feature: unified-reports-dashboard, Property 13: Top Users Ranking Correctness**
 * **Feature: unified-reports-dashboard, Property 14: Top Users Activity Type Filter**
 * **Validates: Requirements 8.1, 8.4**
 */

import * as fc from 'fast-check'

// Types for testing
interface TopUser {
  rank: number
  userId: number
  username: string
  email: string
  activeLoans: number
  totalConsumables: number
  totalCost: number
  lastActivity: string
}

type ActivityFilter = 'all' | 'loans' | 'consumables'

// Helper function to calculate activity score
function calculateActivityScore(user: TopUser): number {
  return user.activeLoans * 10 + user.totalConsumables * 5 + user.totalCost * 0.01
}

// Helper function to rank users by activity
function rankUsersByActivity(users: TopUser[]): TopUser[] {
  const sorted = [...users].sort((a, b) => calculateActivityScore(b) - calculateActivityScore(a))
  return sorted.map((user, index) => ({ ...user, rank: index + 1 }))
}

// Helper function to filter users by activity type
function filterUsersByActivityType(users: TopUser[], filter: ActivityFilter): TopUser[] {
  switch (filter) {
    case 'loans':
      return users.filter((u) => u.activeLoans > 0)
    case 'consumables':
      return users.filter((u) => u.totalConsumables > 0)
    default:
      return users
  }
}

// Generators
const topUserArb = (id: number): fc.Arbitrary<TopUser> =>
  fc.record({
    rank: fc.constant(0), // Will be calculated
    userId: fc.constant(id),
    username: fc.string({ minLength: 3, maxLength: 20 }).map((s) => `user-${s}`),
    email: fc.string({ minLength: 3, maxLength: 15 }).map((s) => `${s}@test.com`),
    activeLoans: fc.integer({ min: 0, max: 20 }),
    totalConsumables: fc.integer({ min: 0, max: 100 }),
    totalCost: fc.integer({ min: 0, max: 10000 }),
    lastActivity: fc.integer({ min: 1609459200000, max: 1767225600000 }).map((ts) =>
      new Date(ts).toISOString()
    ),
  })

describe('Top Users Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 13: Top Users Ranking Correctness**
   * **Validates: Requirements 8.1**
   *
   * For any top users list, users should be sorted in descending order by their activity score.
   */
  it('users should be sorted in descending order by activity score', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }).chain((numUsers) => {
          const ids = Array.from({ length: numUsers }, (_, i) => i + 1)
          return fc
            .array(
              fc.integer({ min: 0, max: numUsers - 1 }).chain((idx) => topUserArb(ids[idx])),
              { minLength: numUsers, maxLength: numUsers }
            )
            .map((arr) => ids.map((id, i) => ({ ...arr[i], userId: id })))
        }),
        (users) => {
          const rankedUsers = rankUsersByActivity(users)

          // Verify descending order by activity score
          for (let i = 0; i < rankedUsers.length - 1; i++) {
            const currentScore = calculateActivityScore(rankedUsers[i])
            const nextScore = calculateActivityScore(rankedUsers[i + 1])
            expect(currentScore).toBeGreaterThanOrEqual(nextScore)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 13: Top Users Ranking Correctness**
   * **Validates: Requirements 8.1**
   *
   * Ranks should be consecutive starting from 1.
   */
  it('ranks should be consecutive starting from 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }).chain((numUsers) => {
          const ids = Array.from({ length: numUsers }, (_, i) => i + 1)
          return fc
            .array(
              fc.integer({ min: 0, max: numUsers - 1 }).chain((idx) => topUserArb(ids[idx])),
              { minLength: numUsers, maxLength: numUsers }
            )
            .map((arr) => ids.map((id, i) => ({ ...arr[i], userId: id })))
        }),
        (users) => {
          const rankedUsers = rankUsersByActivity(users)

          rankedUsers.forEach((user, index) => {
            expect(user.rank).toBe(index + 1)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 14: Top Users Activity Type Filter**
   * **Validates: Requirements 8.4**
   *
   * Filtering by loans should only include users with activeLoans > 0.
   */
  it('loans filter should only include users with active loans', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }).chain((numUsers) => {
          const ids = Array.from({ length: numUsers }, (_, i) => i + 1)
          return fc
            .array(
              fc.integer({ min: 0, max: numUsers - 1 }).chain((idx) => topUserArb(ids[idx])),
              { minLength: numUsers, maxLength: numUsers }
            )
            .map((arr) => ids.map((id, i) => ({ ...arr[i], userId: id })))
        }),
        (users) => {
          const filtered = filterUsersByActivityType(users, 'loans')

          // All filtered users should have active loans
          filtered.forEach((user) => {
            expect(user.activeLoans).toBeGreaterThan(0)
          })

          // All users with active loans should be in filtered result
          const usersWithLoans = users.filter((u) => u.activeLoans > 0)
          expect(filtered.length).toBe(usersWithLoans.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 14: Top Users Activity Type Filter**
   * **Validates: Requirements 8.4**
   *
   * Filtering by consumables should only include users with totalConsumables > 0.
   */
  it('consumables filter should only include users with consumables', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }).chain((numUsers) => {
          const ids = Array.from({ length: numUsers }, (_, i) => i + 1)
          return fc
            .array(
              fc.integer({ min: 0, max: numUsers - 1 }).chain((idx) => topUserArb(ids[idx])),
              { minLength: numUsers, maxLength: numUsers }
            )
            .map((arr) => ids.map((id, i) => ({ ...arr[i], userId: id })))
        }),
        (users) => {
          const filtered = filterUsersByActivityType(users, 'consumables')

          // All filtered users should have consumables
          filtered.forEach((user) => {
            expect(user.totalConsumables).toBeGreaterThan(0)
          })

          // All users with consumables should be in filtered result
          const usersWithConsumables = users.filter((u) => u.totalConsumables > 0)
          expect(filtered.length).toBe(usersWithConsumables.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 14: Top Users Activity Type Filter**
   * **Validates: Requirements 8.4**
   *
   * 'all' filter should return all users.
   */
  it('all filter should return all users', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }).chain((numUsers: number) => {
          if (numUsers === 0) return fc.constant<TopUser[]>([])
          const ids = Array.from({ length: numUsers }, (_, i) => i + 1)
          return fc
            .array(
              fc.integer({ min: 0, max: numUsers - 1 }).chain((idx) => topUserArb(ids[idx])),
              { minLength: numUsers, maxLength: numUsers }
            )
            .map((arr) => ids.map((id, i) => ({ ...arr[i], userId: id }))) as fc.Arbitrary<TopUser[]>
        }),
        (users: TopUser[]) => {
          const filtered = filterUsersByActivityType(users, 'all')
          expect(filtered.length).toBe(users.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 14: Top Users Activity Type Filter**
   * **Validates: Requirements 8.4**
   *
   * Filtered results should be a subset of all users.
   */
  it('filtered results should be a subset of all users', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 15 }).chain((numUsers: number) => {
            const ids = Array.from({ length: numUsers }, (_, i) => i + 1)
            return fc
              .array(
                fc.integer({ min: 0, max: numUsers - 1 }).chain((idx) => topUserArb(ids[idx])),
                { minLength: numUsers, maxLength: numUsers }
              )
              .map((arr) => ids.map((id, i) => ({ ...arr[i], userId: id }))) as fc.Arbitrary<TopUser[]>
          }),
          fc.constantFrom<ActivityFilter>('all', 'loans', 'consumables')
        ),
        ([users, filter]: [TopUser[], ActivityFilter]) => {
          const filtered = filterUsersByActivityType(users, filter)

          // Every filtered user should exist in original array
          filtered.forEach((filteredUser) => {
            expect(users.some((u) => u.userId === filteredUser.userId)).toBe(true)
          })

          // Filtered count should not exceed total
          expect(filtered.length).toBeLessThanOrEqual(users.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 13: Top Users Ranking Correctness**
   * **Validates: Requirements 8.1**
   *
   * User with highest activity score should have rank 1.
   */
  it('user with highest activity score should have rank 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }).chain((numUsers) => {
          const ids = Array.from({ length: numUsers }, (_, i) => i + 1)
          return fc
            .array(
              fc.integer({ min: 0, max: numUsers - 1 }).chain((idx) => topUserArb(ids[idx])),
              { minLength: numUsers, maxLength: numUsers }
            )
            .map((arr) => ids.map((id, i) => ({ ...arr[i], userId: id })))
        }),
        (users) => {
          const rankedUsers = rankUsersByActivity(users)

          if (rankedUsers.length > 0) {
            const maxScore = Math.max(...users.map(calculateActivityScore))
            const topUser = rankedUsers[0]

            expect(topUser.rank).toBe(1)
            expect(calculateActivityScore(topUser)).toBe(maxScore)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
