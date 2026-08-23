/**
 * Search Property-Based Tests
 * 
 * Feature: dynamic-permissions-system, Property 11: Búsqueda de usuarios y roles
 * 
 * **Validates: Requirements 5.2, 5.3**
 * 
 * Property 11: Para cualquier query de búsqueda, los resultados de búsqueda de usuarios
 * deben contener solo usuarios cuyo nombre, email o username contenga el query.
 * Los resultados de búsqueda de roles deben contener solo roles cuyo nombre contenga el query.
 */

import * as fc from 'fast-check'
import type { UserWithPermissions, Role } from '@/types/permissions'

// ============================================================================
// SEARCH FILTER FUNCTIONS (extracted from components for testing)
// ============================================================================

/**
 * Filter users based on search query
 * Matches against username, email, or fullName (case-insensitive)
 * 
 * @see Requirements 5.2 - Filter by name, email, or username in real time
 */
export function filterUsers(users: UserWithPermissions[], searchQuery: string): UserWithPermissions[] {
  if (!searchQuery.trim()) return users
  
  const query = searchQuery.toLowerCase().trim()
  return users.filter(user =>
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    (user.fullName && user.fullName.toLowerCase().includes(query))
  )
}

/**
 * Filter roles based on search term
 * Matches against role name (case-insensitive)
 * 
 * @see Requirements 5.3 - Filter roles by name in real time
 */
export function filterRoles(roles: Role[], searchTerm: string): Role[] {
  if (!searchTerm.trim()) return roles
  
  const query = searchTerm.toLowerCase().trim()
  return roles.filter(role =>
    role.name.toLowerCase().includes(query)
  )
}

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid usernames (alphanumeric with underscores)
 */
const usernameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/)

/**
 * Generator for valid email addresses
 */
const emailArb = fc.emailAddress()

/**
 * Generator for full names (can be null)
 */
const fullNameArb = fc.option(
  fc.tuple(
    fc.stringMatching(/^[A-Z][a-z]{1,10}$/),
    fc.stringMatching(/^[A-Z][a-z]{1,15}$/)
  ).map(([first, last]) => `${first} ${last}`),
  { nil: null }
)

/**
 * Generator for a UserWithPermissions object
 */
const userWithPermissionsArb: fc.Arbitrary<UserWithPermissions> = fc.record({
  id: fc.nat({ max: 10000 }),
  username: usernameArb,
  email: emailArb,
  fullName: fullNameArb,
  roleId: fc.nat({ max: 100 }),
  roleName: fc.constantFrom('admin', 'user', 'editor', 'viewer', 'supervisor'),
  effectivePermissions: fc.constant([]),
  overrides: fc.constant({ granted: [], revoked: [] })
})

/**
 * Generator for a Role object
 */
const roleArb: fc.Arbitrary<Role> = fc.record({
  id: fc.nat({ max: 10000 }),
  name: fc.stringMatching(/^[a-z][a-z0-9_]{2,19}$/),
  description: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
  isProtected: fc.boolean(),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

/**
 * Generator for search queries (non-empty strings)
 */
const searchQueryArb = fc.string({ minLength: 1, maxLength: 30 })
  .filter(s => s.trim().length > 0)

/**
 * Generator for arrays of users with unique IDs
 */
const usersArrayArb = fc.array(userWithPermissionsArb, { minLength: 0, maxLength: 50 })
  .map(users => {
    // Ensure unique IDs by reassigning them
    return users.map((user, index) => ({ ...user, id: index + 1 }))
  })

/**
 * Generator for arrays of roles with unique IDs
 */
const rolesArrayArb = fc.array(roleArb, { minLength: 0, maxLength: 20 })
  .map(roles => {
    // Ensure unique IDs by reassigning them
    return roles.map((role, index) => ({ ...role, id: index + 1 }))
  })

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Feature: dynamic-permissions-system', () => {
  /**
   * Property 11: Búsqueda de usuarios y roles
   * 
   * Para cualquier query de búsqueda, los resultados de búsqueda de usuarios
   * deben contener solo usuarios cuyo nombre, email o username contenga el query.
   * Los resultados de búsqueda de roles deben contener solo roles cuyo nombre
   * contenga el query.
   * 
   * **Validates: Requirements 5.2, 5.3**
   */
  describe('Property 11: Búsqueda de usuarios y roles', () => {
    
    // ========================================================================
    // USER SEARCH TESTS - Requirements 5.2
    // ========================================================================
    
    describe('User Search - Requirements 5.2', () => {
      
      it('should return only users whose username, email, or fullName contains the query', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            searchQueryArb,
            (users, query) => {
              const results = filterUsers(users, query)
              const queryLower = query.toLowerCase().trim()
              
              // Every result must match the query in at least one field
              for (const user of results) {
                const matchesUsername = user.username.toLowerCase().includes(queryLower)
                const matchesEmail = user.email.toLowerCase().includes(queryLower)
                const matchesFullName = user.fullName 
                  ? user.fullName.toLowerCase().includes(queryLower) 
                  : false
                
                expect(matchesUsername || matchesEmail || matchesFullName).toBe(true)
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should not exclude any user that matches the query', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            searchQueryArb,
            (users, query) => {
              const results = filterUsers(users, query)
              const resultIds = new Set(results.map(u => u.id))
              const queryLower = query.toLowerCase().trim()
              
              // Every user that matches should be in results
              for (const user of users) {
                const matchesUsername = user.username.toLowerCase().includes(queryLower)
                const matchesEmail = user.email.toLowerCase().includes(queryLower)
                const matchesFullName = user.fullName 
                  ? user.fullName.toLowerCase().includes(queryLower) 
                  : false
                
                if (matchesUsername || matchesEmail || matchesFullName) {
                  expect(resultIds.has(user.id)).toBe(true)
                }
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should return all users when query is empty or whitespace', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            fc.constantFrom('', '   ', '\t', '\n', '  \t  '),
            (users, emptyQuery) => {
              const results = filterUsers(users, emptyQuery)
              
              expect(results.length).toBe(users.length)
              expect(results).toEqual(users)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should be case-insensitive for user search', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            searchQueryArb,
            (users, query) => {
              const resultsLower = filterUsers(users, query.toLowerCase())
              const resultsUpper = filterUsers(users, query.toUpperCase())
              const resultsMixed = filterUsers(users, query)
              
              // All case variations should return the same results
              const idsLower = new Set(resultsLower.map(u => u.id))
              const idsUpper = new Set(resultsUpper.map(u => u.id))
              const idsMixed = new Set(resultsMixed.map(u => u.id))
              
              expect(idsLower).toEqual(idsUpper)
              expect(idsUpper).toEqual(idsMixed)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should return empty array when no users match the query', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            (users) => {
              // Use a query that is unlikely to match any generated user
              const impossibleQuery = 'zzz_impossible_query_xyz_12345'
              const results = filterUsers(users, impossibleQuery)
              
              expect(results.length).toBe(0)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should preserve the order of matching users', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            searchQueryArb,
            (users, query) => {
              const results = filterUsers(users, query)
              
              // Results should maintain relative order from original array
              let lastIndex = -1
              for (const result of results) {
                const currentIndex = users.findIndex(u => u.id === result.id)
                expect(currentIndex).toBeGreaterThan(lastIndex)
                lastIndex = currentIndex
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle users with null fullName correctly', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.nat({ max: 10000 }),
                username: usernameArb,
                email: emailArb,
                fullName: fc.constant(null),
                roleId: fc.nat({ max: 100 }),
                roleName: fc.constant('user'),
                effectivePermissions: fc.constant<string[]>([]),
                overrides: fc.constant<{ granted: string[]; revoked: string[] }>({ granted: [], revoked: [] })
              }),
              { minLength: 1, maxLength: 20 }
            ),
            searchQueryArb,
            (usersWithNullNames, query) => {
              // Should not throw when fullName is null
              const results = filterUsers(usersWithNullNames, query)
              
              // Results should only match username or email
              const queryLower = query.toLowerCase().trim()
              for (const user of results) {
                const matchesUsername = user.username.toLowerCase().includes(queryLower)
                const matchesEmail = user.email.toLowerCase().includes(queryLower)
                
                expect(matchesUsername || matchesEmail).toBe(true)
              }
            }
          ),
          { numRuns: 100 }
        )
      })
    })

    // ========================================================================
    // ROLE SEARCH TESTS - Requirements 5.3
    // ========================================================================
    
    describe('Role Search - Requirements 5.3', () => {
      
      it('should return only roles whose name contains the query', () => {
        fc.assert(
          fc.property(
            rolesArrayArb,
            searchQueryArb,
            (roles, query) => {
              const results = filterRoles(roles, query)
              const queryLower = query.toLowerCase().trim()
              
              // Every result must have a name that contains the query
              for (const role of results) {
                expect(role.name.toLowerCase().includes(queryLower)).toBe(true)
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should not exclude any role that matches the query', () => {
        fc.assert(
          fc.property(
            rolesArrayArb,
            searchQueryArb,
            (roles, query) => {
              const results = filterRoles(roles, query)
              const resultIds = new Set(results.map(r => r.id))
              const queryLower = query.toLowerCase().trim()
              
              // Every role that matches should be in results
              for (const role of roles) {
                if (role.name.toLowerCase().includes(queryLower)) {
                  expect(resultIds.has(role.id)).toBe(true)
                }
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should return all roles when query is empty or whitespace', () => {
        fc.assert(
          fc.property(
            rolesArrayArb,
            fc.constantFrom('', '   ', '\t', '\n', '  \t  '),
            (roles, emptyQuery) => {
              const results = filterRoles(roles, emptyQuery)
              
              expect(results.length).toBe(roles.length)
              expect(results).toEqual(roles)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should be case-insensitive for role search', () => {
        fc.assert(
          fc.property(
            rolesArrayArb,
            searchQueryArb,
            (roles, query) => {
              const resultsLower = filterRoles(roles, query.toLowerCase())
              const resultsUpper = filterRoles(roles, query.toUpperCase())
              const resultsMixed = filterRoles(roles, query)
              
              // All case variations should return the same results
              const idsLower = new Set(resultsLower.map(r => r.id))
              const idsUpper = new Set(resultsUpper.map(r => r.id))
              const idsMixed = new Set(resultsMixed.map(r => r.id))
              
              expect(idsLower).toEqual(idsUpper)
              expect(idsUpper).toEqual(idsMixed)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should return empty array when no roles match the query', () => {
        fc.assert(
          fc.property(
            rolesArrayArb,
            (roles) => {
              // Use a query that is unlikely to match any generated role
              const impossibleQuery = 'zzz_impossible_query_xyz_12345'
              const results = filterRoles(roles, impossibleQuery)
              
              expect(results.length).toBe(0)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should preserve the order of matching roles', () => {
        fc.assert(
          fc.property(
            rolesArrayArb,
            searchQueryArb,
            (roles, query) => {
              const results = filterRoles(roles, query)
              
              // Results should maintain relative order from original array
              let lastIndex = -1
              for (const result of results) {
                const currentIndex = roles.findIndex(r => r.id === result.id)
                expect(currentIndex).toBeGreaterThan(lastIndex)
                lastIndex = currentIndex
              }
            }
          ),
          { numRuns: 100 }
        )
      })
    })

    // ========================================================================
    // COMBINED SEARCH PROPERTIES
    // ========================================================================
    
    describe('Combined Search Properties', () => {
      
      it('should return subset of original array for any non-empty query', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            rolesArrayArb,
            searchQueryArb,
            (users, roles, query) => {
              const userResults = filterUsers(users, query)
              const roleResults = filterRoles(roles, query)
              
              // Results should be subsets
              expect(userResults.length).toBeLessThanOrEqual(users.length)
              expect(roleResults.length).toBeLessThanOrEqual(roles.length)
              
              // All results should be from original arrays
              const userIds = new Set(users.map(u => u.id))
              const roleIds = new Set(roles.map(r => r.id))
              
              for (const user of userResults) {
                expect(userIds.has(user.id)).toBe(true)
              }
              for (const role of roleResults) {
                expect(roleIds.has(role.id)).toBe(true)
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should be idempotent - filtering twice with same query gives same results', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            rolesArrayArb,
            searchQueryArb,
            (users, roles, query) => {
              const userResults1 = filterUsers(users, query)
              const userResults2 = filterUsers(userResults1, query)
              
              const roleResults1 = filterRoles(roles, query)
              const roleResults2 = filterRoles(roleResults1, query)
              
              // Filtering already filtered results should give same results
              expect(userResults1).toEqual(userResults2)
              expect(roleResults1).toEqual(roleResults2)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle special characters in search query safely', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            rolesArrayArb,
            fc.constantFrom(
              '.',
              '*',
              '+',
              '?',
              '^',
              '$',
              '|',
              '\\',
              '[',
              ']',
              '(',
              ')',
              '{',
              '}',
              '@',
              '#',
              '%',
              '&',
              '-',
              '_'
            ),
            (users, roles, specialChar) => {
              // Should not throw with special characters
              expect(() => filterUsers(users, specialChar)).not.toThrow()
              expect(() => filterRoles(roles, specialChar)).not.toThrow()
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should trim whitespace from query before searching', () => {
        fc.assert(
          fc.property(
            usersArrayArb,
            rolesArrayArb,
            searchQueryArb,
            (users, roles, query) => {
              const paddedQuery = `  ${query}  `
              
              const userResultsNormal = filterUsers(users, query)
              const userResultsPadded = filterUsers(users, paddedQuery)
              
              const roleResultsNormal = filterRoles(roles, query)
              const roleResultsPadded = filterRoles(roles, paddedQuery)
              
              // Padded query should give same results as trimmed
              expect(userResultsNormal.map(u => u.id)).toEqual(userResultsPadded.map(u => u.id))
              expect(roleResultsNormal.map(r => r.id)).toEqual(roleResultsPadded.map(r => r.id))
            }
          ),
          { numRuns: 100 }
        )
      })
    })
  })
})
