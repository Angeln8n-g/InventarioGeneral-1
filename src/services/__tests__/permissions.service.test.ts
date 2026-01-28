/**
 * PermissionsService - Property-Based Tests
 * 
 * Feature: dynamic-permissions-system, Property 8: Effective permissions calculation
 * 
 * **Validates: Requirements 3.5**
 * 
 * This test file validates the effective permissions calculation formula:
 * effective = (rolePermissions - userRevoked) + userGranted
 */

import * as fc from 'fast-check'
import { calculateEffectivePermissions } from '@/services/permissions.service'
import { PERMISSIONS } from '@/lib/permissions'

/**
 * Get all permission values from the PERMISSIONS constant
 */
const ALL_PERMISSIONS = Object.values(PERMISSIONS)

describe('Feature: dynamic-permissions-system', () => {
  /**
   * Property 8: Effective permissions calculation
   * 
   * For any user with a role and a set of overrides, the effective permissions must be:
   * (permisos del rol - permisos revocados) + permisos otorgados.
   * This formula must produce consistent results.
   * 
   * **Validates: Requirements 3.5**
   */
  describe('Property 8: Effective permissions calculation', () => {
    it('should calculate effective permissions using formula: (role - revoked) + granted', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 15 }), // rolePermissions
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // grantedOverrides
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // revokedOverrides
          (rolePerms, granted, revoked) => {
            const effective = calculateEffectivePermissions(rolePerms, granted, revoked)
            
            // Verify formula: (role - revoked) + granted
            const expected = new Set([
              ...rolePerms.filter(p => !revoked.includes(p)),
              ...granted
            ])
            
            expect(new Set(effective)).toEqual(expected)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include all granted permissions regardless of role', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // rolePermissions
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 1, maxLength: 10 }), // grantedOverrides (at least 1)
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // revokedOverrides
          (rolePerms, granted, revoked) => {
            const effective = calculateEffectivePermissions(rolePerms, granted, revoked)
            const effectiveSet = new Set(effective)
            
            // All granted permissions must be in effective permissions
            for (const permission of granted) {
              expect(effectiveSet.has(permission)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should exclude revoked permissions from role permissions', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 1, maxLength: 15 }), // rolePermissions (at least 1)
          (rolePerms) => {
            // Revoke some permissions that are in the role
            const revokedFromRole = rolePerms.slice(0, Math.min(3, rolePerms.length))
            const granted: string[] = [] // No granted permissions
            
            const effective = calculateEffectivePermissions(rolePerms, granted, revokedFromRole)
            const effectiveSet = new Set(effective)
            
            // Revoked permissions should NOT be in effective (unless they were also granted)
            for (const permission of revokedFromRole) {
              expect(effectiveSet.has(permission)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should allow granted to override revoked for the same permission', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // rolePermissions
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 1, maxLength: 5 }), // permissions to both grant and revoke
          (rolePerms, conflictingPerms) => {
            // Grant and revoke the same permissions
            const granted = conflictingPerms
            const revoked = conflictingPerms
            
            const effective = calculateEffectivePermissions(rolePerms, granted, revoked)
            const effectiveSet = new Set(effective)
            
            // Granted takes precedence - all conflicting permissions should be present
            for (const permission of conflictingPerms) {
              expect(effectiveSet.has(permission)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty array when role has no permissions and nothing is granted', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // revokedOverrides
          (revoked) => {
            const rolePerms: string[] = []
            const granted: string[] = []
            
            const effective = calculateEffectivePermissions(rolePerms, granted, revoked)
            
            expect(effective).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return role permissions unchanged when no overrides exist', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 15 }), // rolePermissions
          (rolePerms) => {
            const granted: string[] = []
            const revoked: string[] = []
            
            const effective = calculateEffectivePermissions(rolePerms, granted, revoked)
            
            expect(new Set(effective)).toEqual(new Set(rolePerms))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should produce consistent results for the same inputs', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 15 }), // rolePermissions
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // grantedOverrides
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // revokedOverrides
          (rolePerms, granted, revoked) => {
            // Call the function multiple times with the same inputs
            const result1 = calculateEffectivePermissions(rolePerms, granted, revoked)
            const result2 = calculateEffectivePermissions(rolePerms, granted, revoked)
            const result3 = calculateEffectivePermissions(rolePerms, granted, revoked)
            
            // Results should be consistent (same set of permissions)
            expect(new Set(result1)).toEqual(new Set(result2))
            expect(new Set(result2)).toEqual(new Set(result3))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not contain duplicate permissions in the result', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 15 }), // rolePermissions
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // grantedOverrides
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 }), // revokedOverrides
          (rolePerms, granted, revoked) => {
            const effective = calculateEffectivePermissions(rolePerms, granted, revoked)
            
            // Check for duplicates
            const uniqueEffective = new Set(effective)
            expect(effective.length).toBe(uniqueEffective.size)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle overlapping role and granted permissions correctly', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 2, maxLength: 10 }), // permissions in both role and granted
          (overlappingPerms) => {
            // Use same permissions for role and granted
            const rolePerms = overlappingPerms
            const granted = overlappingPerms
            const revoked: string[] = []
            
            const effective = calculateEffectivePermissions(rolePerms, granted, revoked)
            
            // Result should contain each permission exactly once
            expect(new Set(effective)).toEqual(new Set(overlappingPerms))
            expect(effective.length).toBe(new Set(effective).size)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
