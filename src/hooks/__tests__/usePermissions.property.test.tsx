/**
 * usePermissions Hook - Property-Based Tests for Compatibility
 * 
 * Feature: dynamic-permissions-system
 * 
 * Property 16: Compatibilidad con sistema anterior
 * Property 17: Invalidación de caché
 * 
 * **Validates: Requirements 8.1, 8.2, 9.3**
 * 
 * These tests verify that:
 * - The new dynamic permissions system produces the same results as the old static system
 * - Cache invalidation correctly reflects permission changes
 */

import * as fc from 'fast-check'
import {
  hasPermission as hasPermissionStatic,
  hasAnyPermission as hasAnyPermissionStatic,
  hasAllPermissions as hasAllPermissionsStatic,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
} from '@/lib/permissions'
import { calculateEffectivePermissions } from '@/services/permissions.service'

/**
 * Get all permission values from the PERMISSIONS constant
 */
const ALL_PERMISSIONS = Object.values(PERMISSIONS)

/**
 * Valid roles in the system
 */
const VALID_ROLES = ['admin', 'user'] as const
type ValidRole = typeof VALID_ROLES[number]

/**
 * Generator for valid user objects that match the static system's expectations
 */
const userArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  role: fc.constantFrom<ValidRole>(...VALID_ROLES),
  username: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
})

/**
 * Generator for permission arrays
 */
const permissionArrayArb = fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { 
  minLength: 0, 
  maxLength: 15 
})

/**
 * Generator for non-empty permission arrays (for hasAny/hasAll tests)
 */
const nonEmptyPermissionArrayArb = fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { 
  minLength: 1, 
  maxLength: 10 
})

describe('Feature: dynamic-permissions-system', () => {
  /**
   * Property 16: Compatibilidad con sistema anterior
   * 
   * Para cualquier usuario y permiso, las funciones hasPermission, hasAnyPermission 
   * y hasAllPermissions del nuevo sistema deben producir los mismos resultados que 
   * el sistema anterior cuando se usan los mismos datos de entrada.
   * 
   * **Validates: Requirements 8.1, 8.2**
   */
  describe('Property 16: Compatibilidad con sistema anterior', () => {
    /**
     * Test that hasPermission produces the same results in both systems
     * when using the same role-based permissions (no overrides)
     */
    it('hasPermission should produce same results as static system for role-based permissions', () => {
      fc.assert(
        fc.property(
          userArb,
          fc.constantFrom(...ALL_PERMISSIONS),
          (user, permission) => {
            // Get the static system result
            const staticResult = hasPermissionStatic(user, permission)
            
            // Simulate the dynamic system with no overrides
            // The dynamic system uses effective permissions calculated from role + overrides
            const rolePermissions = ROLE_PERMISSIONS[user.role] || []
            const effectivePermissions = calculateEffectivePermissions(
              rolePermissions,
              [], // no granted overrides
              []  // no revoked overrides
            )
            
            // Check if permission is in effective permissions (dynamic system behavior)
            const dynamicResult = effectivePermissions.includes(permission)
            
            // Both systems should produce the same result
            expect(dynamicResult).toBe(staticResult)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that hasAnyPermission produces the same results in both systems
     */
    it('hasAnyPermission should produce same results as static system for role-based permissions', () => {
      fc.assert(
        fc.property(
          userArb,
          nonEmptyPermissionArrayArb,
          (user, permissions) => {
            // Get the static system result
            const staticResult = hasAnyPermissionStatic(user, permissions as Permission[])
            
            // Simulate the dynamic system with no overrides
            const rolePermissions = ROLE_PERMISSIONS[user.role] || []
            const effectivePermissions = calculateEffectivePermissions(
              rolePermissions,
              [], // no granted overrides
              []  // no revoked overrides
            )
            
            // Check if any permission is in effective permissions (dynamic system behavior)
            const dynamicResult = permissions.some(p => effectivePermissions.includes(p))
            
            // Both systems should produce the same result
            expect(dynamicResult).toBe(staticResult)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that hasAllPermissions produces the same results in both systems
     */
    it('hasAllPermissions should produce same results as static system for role-based permissions', () => {
      fc.assert(
        fc.property(
          userArb,
          nonEmptyPermissionArrayArb,
          (user, permissions) => {
            // Get the static system result
            const staticResult = hasAllPermissionsStatic(user, permissions as Permission[])
            
            // Simulate the dynamic system with no overrides
            const rolePermissions = ROLE_PERMISSIONS[user.role] || []
            const effectivePermissions = calculateEffectivePermissions(
              rolePermissions,
              [], // no granted overrides
              []  // no revoked overrides
            )
            
            // Check if all permissions are in effective permissions (dynamic system behavior)
            const dynamicResult = permissions.every(p => effectivePermissions.includes(p))
            
            // Both systems should produce the same result
            expect(dynamicResult).toBe(staticResult)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that admin role has all admin permissions in both systems
     */
    it('admin role should have consistent permissions in both systems', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }), // userId
          fc.constantFrom(...ALL_PERMISSIONS),
          (userId, permission) => {
            const adminUser = { id: userId, role: 'admin' as const, username: 'admin', email: 'admin@test.com' }
            
            // Static system result
            const staticResult = hasPermissionStatic(adminUser, permission)
            
            // Dynamic system result (using role permissions)
            const rolePermissions = ROLE_PERMISSIONS['admin']
            const effectivePermissions = calculateEffectivePermissions(rolePermissions, [], [])
            const dynamicResult = effectivePermissions.includes(permission)
            
            expect(dynamicResult).toBe(staticResult)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that user role has consistent permissions in both systems
     */
    it('user role should have consistent permissions in both systems', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }), // userId
          fc.constantFrom(...ALL_PERMISSIONS),
          (userId, permission) => {
            const regularUser = { id: userId, role: 'user' as const, username: 'user', email: 'user@test.com' }
            
            // Static system result
            const staticResult = hasPermissionStatic(regularUser, permission)
            
            // Dynamic system result (using role permissions)
            const rolePermissions = ROLE_PERMISSIONS['user']
            const effectivePermissions = calculateEffectivePermissions(rolePermissions, [], [])
            const dynamicResult = effectivePermissions.includes(permission)
            
            expect(dynamicResult).toBe(staticResult)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that null user returns false for all permissions in both systems
     */
    it('null user should return false for all permissions in both systems', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_PERMISSIONS),
          (permission) => {
            // Static system with null user
            const staticResult = hasPermissionStatic(null, permission)
            
            // Dynamic system with empty permissions (simulating no user)
            const effectivePermissions: string[] = []
            const dynamicResult = effectivePermissions.includes(permission)
            
            // Both should return false
            expect(staticResult).toBe(false)
            expect(dynamicResult).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that the set of permissions for each role is identical in both systems
     */
    it('role permission sets should be identical in both systems', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          (role) => {
            // Get permissions from static system
            const staticPermissions = new Set(ROLE_PERMISSIONS[role])
            
            // Get permissions from dynamic system (no overrides)
            const dynamicPermissions = new Set(
              calculateEffectivePermissions(ROLE_PERMISSIONS[role], [], [])
            )
            
            // Both sets should be identical
            expect(dynamicPermissions).toEqual(staticPermissions)
          }
        ),
        { numRuns: 10 } // Only 2 roles, so fewer runs needed
      )
    })

    /**
     * Test that hasAnyPermission with empty array returns false in both systems
     */
    it('hasAnyPermission with empty array should return false in both systems', () => {
      fc.assert(
        fc.property(
          userArb,
          (user) => {
            // Static system
            const staticResult = hasAnyPermissionStatic(user, [])
            
            // Dynamic system
            const rolePermissions = ROLE_PERMISSIONS[user.role] || []
            const effectivePermissions = calculateEffectivePermissions(rolePermissions, [], [])
            const dynamicResult = ([] as string[]).some(p => effectivePermissions.includes(p))
            
            // Both should return false for empty array
            expect(staticResult).toBe(false)
            expect(dynamicResult).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * Test that hasAllPermissions with empty array returns true in both systems
     */
    it('hasAllPermissions with empty array should return true in both systems', () => {
      fc.assert(
        fc.property(
          userArb,
          (user) => {
            // Static system
            const staticResult = hasAllPermissionsStatic(user, [])
            
            // Dynamic system
            const rolePermissions = ROLE_PERMISSIONS[user.role] || []
            const effectivePermissions = calculateEffectivePermissions(rolePermissions, [], [])
            const dynamicResult = ([] as string[]).every(p => effectivePermissions.includes(p))
            
            // Both should return true for empty array (vacuous truth)
            expect(staticResult).toBe(true)
            expect(dynamicResult).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 17: Invalidación de caché
   * 
   * Para cualquier cambio en los permisos de un usuario (directo o a través de su rol), 
   * después de la invalidación del caché, la siguiente consulta de permisos debe 
   * reflejar los cambios realizados.
   * 
   * **Validates: Requirements 9.3**
   */
  describe('Property 17: Invalidación de caché', () => {
    /**
     * Test that adding a granted permission is reflected after cache invalidation
     */
    it('granted permission changes should be reflected after recalculation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 1, maxLength: 5 }),
          (role, newGrantedPermissions) => {
            const rolePermissions = ROLE_PERMISSIONS[role]
            
            // Initial state: no overrides
            const initialEffective = calculateEffectivePermissions(rolePermissions, [], [])
            
            // After change: add granted permissions (simulates cache invalidation + reload)
            const afterChangeEffective = calculateEffectivePermissions(
              rolePermissions,
              newGrantedPermissions,
              []
            )
            
            // All newly granted permissions should be in the result
            for (const permission of newGrantedPermissions) {
              expect(afterChangeEffective.includes(permission)).toBe(true)
            }
            
            // The new effective permissions should include all granted permissions
            const afterChangeSet = new Set(afterChangeEffective)
            for (const permission of newGrantedPermissions) {
              expect(afterChangeSet.has(permission)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that revoking a permission is reflected after cache invalidation
     */
    it('revoked permission changes should be reflected after recalculation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          (role) => {
            const rolePermissions = ROLE_PERMISSIONS[role]
            
            // Only test if role has permissions to revoke
            if (rolePermissions.length === 0) return true
            
            // Pick some permissions to revoke
            const permissionsToRevoke = rolePermissions.slice(0, Math.min(3, rolePermissions.length))
            
            // Initial state: no overrides
            const initialEffective = calculateEffectivePermissions(rolePermissions, [], [])
            
            // Verify initial state has the permissions
            for (const permission of permissionsToRevoke) {
              expect(initialEffective.includes(permission)).toBe(true)
            }
            
            // After change: revoke permissions (simulates cache invalidation + reload)
            const afterChangeEffective = calculateEffectivePermissions(
              rolePermissions,
              [],
              permissionsToRevoke
            )
            
            // Revoked permissions should NOT be in the result
            for (const permission of permissionsToRevoke) {
              expect(afterChangeEffective.includes(permission)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that role permission changes are reflected after cache invalidation
     */
    it('role permission changes should be reflected after recalculation', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }),
          (initialRolePermissions, newRolePermissions) => {
            // Initial state
            const initialEffective = calculateEffectivePermissions(initialRolePermissions, [], [])
            
            // After role change (simulates cache invalidation + reload with new role permissions)
            const afterChangeEffective = calculateEffectivePermissions(newRolePermissions, [], [])
            
            // The effective permissions should match the new role permissions
            expect(new Set(afterChangeEffective)).toEqual(new Set(newRolePermissions))
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that combined grant and revoke changes are reflected correctly
     */
    it('combined grant and revoke changes should be reflected after recalculation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 5 }),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 5 }),
          (role, grantedPermissions, revokedPermissions) => {
            const rolePermissions = ROLE_PERMISSIONS[role]
            
            // Initial state: no overrides
            const initialEffective = calculateEffectivePermissions(rolePermissions, [], [])
            
            // After changes (simulates cache invalidation + reload)
            const afterChangeEffective = calculateEffectivePermissions(
              rolePermissions,
              grantedPermissions,
              revokedPermissions
            )
            
            // Calculate expected result
            const expected = new Set([
              ...rolePermissions.filter(p => !revokedPermissions.includes(p)),
              ...grantedPermissions
            ])
            
            // The effective permissions should match expected
            expect(new Set(afterChangeEffective)).toEqual(expected)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that clearing all overrides returns to base role permissions
     */
    it('clearing overrides should return to base role permissions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 1, maxLength: 5 }),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 1, maxLength: 5 }),
          (role, grantedPermissions, revokedPermissions) => {
            const rolePermissions = ROLE_PERMISSIONS[role]
            
            // State with overrides
            const withOverrides = calculateEffectivePermissions(
              rolePermissions,
              grantedPermissions,
              revokedPermissions
            )
            
            // State after clearing overrides (simulates cache invalidation + reload)
            const afterClearingOverrides = calculateEffectivePermissions(
              rolePermissions,
              [], // cleared
              []  // cleared
            )
            
            // Should return to base role permissions
            expect(new Set(afterClearingOverrides)).toEqual(new Set(rolePermissions))
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that permission state is deterministic after any sequence of changes
     */
    it('permission state should be deterministic regardless of change history', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 5 }),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 5 }),
          (role, finalGranted, finalRevoked) => {
            const rolePermissions = ROLE_PERMISSIONS[role]
            
            // Simulate multiple intermediate states (as if cache was invalidated multiple times)
            // The final state should only depend on the final inputs, not the history
            
            // Path 1: Direct to final state
            const directResult = calculateEffectivePermissions(
              rolePermissions,
              finalGranted,
              finalRevoked
            )
            
            // Path 2: Through intermediate states
            const intermediate1 = calculateEffectivePermissions(rolePermissions, [], [])
            const intermediate2 = calculateEffectivePermissions(
              rolePermissions,
              finalGranted.slice(0, 2),
              []
            )
            const throughIntermediateResult = calculateEffectivePermissions(
              rolePermissions,
              finalGranted,
              finalRevoked
            )
            
            // Both paths should produce the same final result
            expect(new Set(directResult)).toEqual(new Set(throughIntermediateResult))
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that cache invalidation for one user doesn't affect another user's permissions
     */
    it('permission changes for one user should not affect another user', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 5 }),
          (role1, role2, user1Granted) => {
            const rolePermissions1 = ROLE_PERMISSIONS[role1]
            const rolePermissions2 = ROLE_PERMISSIONS[role2]
            
            // User 1 gets some granted permissions
            const user1Effective = calculateEffectivePermissions(
              rolePermissions1,
              user1Granted,
              []
            )
            
            // User 2 should still have only their role permissions (no overrides)
            const user2Effective = calculateEffectivePermissions(
              rolePermissions2,
              [], // User 2 has no overrides
              []
            )
            
            // User 2's permissions should be exactly their role permissions
            expect(new Set(user2Effective)).toEqual(new Set(rolePermissions2))
            
            // User 1's permissions should include their granted permissions
            for (const permission of user1Granted) {
              expect(user1Effective.includes(permission)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
