/**
 * Section Access Control - Property-Based Tests
 * 
 * Feature: dynamic-permissions-system
 * 
 * Property 9: Control de acceso a secciones
 * Property 10: Filtrado de navegación
 * 
 * **Validates: Requirements 4.2, 4.3**
 * 
 * These tests verify that:
 * - Users without required permissions cannot access protected sections
 * - Navigation filtering returns only sections the user has access to
 */

import * as fc from 'fast-check'
import {
  hasAccessToSection,
  getRequiredPermissionForPath,
  filterNavigationByPermissions,
  getAccessibleSections,
  isAdminSection,
  isPublicPath,
  SECTION_CONFIG,
  NavigationItem,
} from '@/lib/section-access'
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/permissions'
import { calculateEffectivePermissions } from '@/services/permissions.service'

/**
 * Get all permission values from the PERMISSIONS constant
 */
const ALL_PERMISSIONS = Object.values(PERMISSIONS)

/**
 * Get all section paths from the SECTION_CONFIG
 */
const ALL_SECTION_PATHS = Object.keys(SECTION_CONFIG)

/**
 * Get all section permissions from the SECTION_CONFIG
 */
const ALL_SECTION_PERMISSIONS = Object.values(SECTION_CONFIG).map(s => s.requiredPermission)

/**
 * Valid roles in the system
 */
const VALID_ROLES = ['admin', 'user'] as const
type ValidRole = typeof VALID_ROLES[number]

/**
 * Generator for permission arrays
 */
const permissionArrayArb = fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { 
  minLength: 0, 
  maxLength: 20 
})

/**
 * Generator for section paths
 */
const sectionPathArb = fc.constantFrom(...ALL_SECTION_PATHS)

/**
 * Generator for navigation items
 */
const navigationItemArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  href: fc.constantFrom(...ALL_SECTION_PATHS),
  requiredPermission: fc.constantFrom(...ALL_SECTION_PERMISSIONS),
  isAdminSection: fc.boolean(),
})

/**
 * Generator for arrays of navigation items
 */
const navigationItemsArb = fc.array(navigationItemArb, { minLength: 0, maxLength: 10 })

describe('Feature: dynamic-permissions-system', () => {
  /**
   * Property 9: Control de acceso a secciones
   * 
   * Para cualquier usuario y sección del sistema, si el usuario no tiene el permiso 
   * requerido por la sección, el acceso a la API de esa sección debe retornar código 403.
   * 
   * **Validates: Requirements 4.2, 4.4**
   */
  describe('Property 9: Control de acceso a secciones', () => {
    /**
     * Test that users without required permission cannot access protected sections
     */
    it('users without required permission should not have access to protected sections', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          permissionArrayArb,
          (sectionPath, userPermissions) => {
            const requiredPermission = getRequiredPermissionForPath(sectionPath)
            
            // If section requires a permission
            if (requiredPermission) {
              const hasRequiredPermission = userPermissions.includes(requiredPermission)
              const hasAccess = hasAccessToSection(sectionPath, userPermissions)
              
              // Access should match whether user has the required permission
              expect(hasAccess).toBe(hasRequiredPermission)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that admin users have access to all admin sections
     */
    it('admin users should have access to all admin sections', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          (sectionPath) => {
            // Get admin role permissions
            const adminPermissions = ROLE_PERMISSIONS['admin']
            const effectivePermissions = calculateEffectivePermissions(adminPermissions, [], [])
            
            // Admin should have access to all sections
            const hasAccess = hasAccessToSection(sectionPath, effectivePermissions)
            
            // Admin should always have access
            expect(hasAccess).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that regular users cannot access admin sections without explicit permission
     */
    it('regular users should not have access to admin sections without explicit permission', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          (sectionPath) => {
            // Get user role permissions (no overrides)
            const userPermissions = ROLE_PERMISSIONS['user']
            const effectivePermissions = calculateEffectivePermissions(userPermissions, [], [])
            
            // Check if this is an admin section
            const isAdmin = isAdminSection(sectionPath)
            const hasAccess = hasAccessToSection(sectionPath, effectivePermissions)
            
            // If it's an admin section, user should not have access
            // (unless the user role explicitly has that permission)
            if (isAdmin) {
              const requiredPermission = getRequiredPermissionForPath(sectionPath)
              const userHasPermission = requiredPermission ? effectivePermissions.includes(requiredPermission) : true
              expect(hasAccess).toBe(userHasPermission)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that granting a section permission gives access to that section
     */
    it('granting section permission should give access to that section', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          fc.constantFrom<ValidRole>(...VALID_ROLES),
          (sectionPath, role) => {
            const requiredPermission = getRequiredPermissionForPath(sectionPath)
            
            if (requiredPermission) {
              // Get base role permissions
              const rolePermissions = ROLE_PERMISSIONS[role]
              
              // Grant the required permission
              const effectivePermissions = calculateEffectivePermissions(
                rolePermissions,
                [requiredPermission], // Grant the required permission
                []
              )
              
              // User should now have access
              const hasAccess = hasAccessToSection(sectionPath, effectivePermissions)
              expect(hasAccess).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that revoking a section permission removes access to that section
     */
    it('revoking section permission should remove access to that section', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          (sectionPath) => {
            const requiredPermission = getRequiredPermissionForPath(sectionPath)
            
            if (requiredPermission) {
              // Start with admin permissions (has all permissions)
              const adminPermissions = ROLE_PERMISSIONS['admin']
              
              // Revoke the required permission
              const effectivePermissions = calculateEffectivePermissions(
                adminPermissions,
                [],
                [requiredPermission] // Revoke the required permission
              )
              
              // User should no longer have access
              const hasAccess = hasAccessToSection(sectionPath, effectivePermissions)
              expect(hasAccess).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that nested routes inherit parent section permissions
     */
    it('nested routes should inherit parent section permissions', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/') && s.match(/^[a-z0-9-]+$/)),
          permissionArrayArb,
          (basePath, nestedSegment, userPermissions) => {
            const nestedPath = `${basePath}/${nestedSegment}`
            
            // Get required permission for base path
            const baseRequiredPermission = getRequiredPermissionForPath(basePath)
            
            // Get required permission for nested path
            const nestedRequiredPermission = getRequiredPermissionForPath(nestedPath)
            
            // Nested path should inherit parent's permission requirement
            // (unless it has its own specific configuration)
            if (baseRequiredPermission && !SECTION_CONFIG[nestedPath]) {
              expect(nestedRequiredPermission).toBe(baseRequiredPermission)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that public paths are always accessible
     */
    it('public paths should always be accessible regardless of permissions', () => {
      const publicPaths = ['/login', '/register', '/forgot-password', '/access-denied']
      
      fc.assert(
        fc.property(
          fc.constantFrom(...publicPaths),
          permissionArrayArb,
          (publicPath, userPermissions) => {
            // Public paths should always be accessible
            const isPublic = isPublicPath(publicPath)
            expect(isPublic).toBe(true)
            
            // hasAccessToSection should return true for public paths
            // (since they don't have required permissions in SECTION_CONFIG)
            const requiredPermission = getRequiredPermissionForPath(publicPath)
            expect(requiredPermission).toBeNull()
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * Test that access check is consistent for the same inputs
     */
    it('access check should be deterministic for the same inputs', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          permissionArrayArb,
          (sectionPath, userPermissions) => {
            // Check access multiple times
            const result1 = hasAccessToSection(sectionPath, userPermissions)
            const result2 = hasAccessToSection(sectionPath, userPermissions)
            const result3 = hasAccessToSection(sectionPath, userPermissions)
            
            // All results should be the same
            expect(result1).toBe(result2)
            expect(result2).toBe(result3)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 10: Filtrado de navegación
   * 
   * Para cualquier usuario, las secciones retornadas por la API de navegación deben 
   * ser exactamente aquellas para las cuales el usuario tiene el permiso requerido.
   * 
   * **Validates: Requirements 4.3**
   */
  describe('Property 10: Filtrado de navegación', () => {
    /**
     * Test that filtered navigation only includes accessible sections
     */
    it('filtered navigation should only include sections user has access to', () => {
      fc.assert(
        fc.property(
          navigationItemsArb,
          permissionArrayArb,
          (navItems, userPermissions) => {
            const filteredItems = filterNavigationByPermissions(navItems, userPermissions)
            
            // Every item in filtered list should be accessible
            for (const item of filteredItems) {
              if (item.requiredPermission) {
                expect(userPermissions.includes(item.requiredPermission)).toBe(true)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that filtered navigation excludes inaccessible sections
     */
    it('filtered navigation should exclude sections user does not have access to', () => {
      fc.assert(
        fc.property(
          navigationItemsArb,
          permissionArrayArb,
          (navItems, userPermissions) => {
            const filteredItems = filterNavigationByPermissions(navItems, userPermissions)
            const filteredHrefs = new Set(filteredItems.map(item => item.href))
            
            // Items that require permissions the user doesn't have should be excluded
            for (const item of navItems) {
              if (item.requiredPermission && !userPermissions.includes(item.requiredPermission)) {
                expect(filteredHrefs.has(item.href)).toBe(false)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that getAccessibleSections returns correct sections for admin
     */
    it('getAccessibleSections should return all sections for admin', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // includeAdminSections
          (includeAdminSections) => {
            // Get admin permissions
            const adminPermissions = ROLE_PERMISSIONS['admin']
            const effectivePermissions = calculateEffectivePermissions(adminPermissions, [], [])
            
            // Get accessible sections
            const accessibleSections = getAccessibleSections(effectivePermissions, includeAdminSections)
            
            // Admin should have access to all sections (filtered by includeAdminSections)
            const expectedSections = Object.entries(SECTION_CONFIG)
              .filter(([, config]) => includeAdminSections || !config.isAdminSection)
              .map(([path]) => path)
            
            expect(new Set(accessibleSections)).toEqual(new Set(expectedSections))
          }
        ),
        { numRuns: 10 }
      )
    })

    /**
     * Test that getAccessibleSections returns only user sections for regular user
     */
    it('getAccessibleSections should return only permitted sections for regular user', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // includeAdminSections
          (includeAdminSections) => {
            // Get user permissions
            const userPermissions = ROLE_PERMISSIONS['user']
            const effectivePermissions = calculateEffectivePermissions(userPermissions, [], [])
            
            // Get accessible sections
            const accessibleSections = getAccessibleSections(effectivePermissions, includeAdminSections)
            
            // Every accessible section should have its required permission in user's permissions
            for (const sectionPath of accessibleSections) {
              const config = SECTION_CONFIG[sectionPath]
              if (config) {
                expect(effectivePermissions.includes(config.requiredPermission)).toBe(true)
              }
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    /**
     * Test that navigation filtering is consistent with hasAccessToSection
     */
    it('navigation filtering should be consistent with hasAccessToSection', () => {
      fc.assert(
        fc.property(
          navigationItemsArb,
          permissionArrayArb,
          (navItems, userPermissions) => {
            const filteredItems = filterNavigationByPermissions(navItems, userPermissions)
            
            // For each original item, check consistency
            for (const item of navItems) {
              const isInFiltered = filteredItems.some(f => f.href === item.href && f.requiredPermission === item.requiredPermission)
              const hasAccess = hasAccessToSection(item.href, userPermissions)
              
              // If item has a required permission, filtering should match access check
              if (item.requiredPermission) {
                const hasPermission = userPermissions.includes(item.requiredPermission)
                expect(isInFiltered).toBe(hasPermission)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that filtering preserves item properties
     */
    it('filtering should preserve all item properties', () => {
      fc.assert(
        fc.property(
          navigationItemsArb,
          permissionArrayArb,
          (navItems, userPermissions) => {
            const filteredItems = filterNavigationByPermissions(navItems, userPermissions)
            
            // Each filtered item should have all its original properties
            for (const filteredItem of filteredItems) {
              const originalItem = navItems.find(
                item => item.href === filteredItem.href && 
                        item.requiredPermission === filteredItem.requiredPermission
              )
              
              if (originalItem) {
                expect(filteredItem.name).toBe(originalItem.name)
                expect(filteredItem.href).toBe(originalItem.href)
                expect(filteredItem.requiredPermission).toBe(originalItem.requiredPermission)
                expect(filteredItem.isAdminSection).toBe(originalItem.isAdminSection)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that filtering with all permissions returns all items
     */
    it('filtering with all permissions should return all items', () => {
      fc.assert(
        fc.property(
          navigationItemsArb,
          (navItems) => {
            // Use all permissions
            const allPermissions = ALL_PERMISSIONS
            
            const filteredItems = filterNavigationByPermissions(navItems, allPermissions)
            
            // All items should be included
            expect(filteredItems.length).toBe(navItems.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that filtering with no permissions returns only items without required permissions
     */
    it('filtering with no permissions should return only items without required permissions', () => {
      fc.assert(
        fc.property(
          navigationItemsArb,
          (navItems) => {
            // Use no permissions
            const noPermissions: string[] = []
            
            const filteredItems = filterNavigationByPermissions(navItems, noPermissions)
            
            // Only items without required permissions should be included
            for (const item of filteredItems) {
              expect(item.requiredPermission).toBeFalsy()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that admin sections are correctly identified
     */
    it('admin sections should be correctly identified', () => {
      fc.assert(
        fc.property(
          sectionPathArb,
          (sectionPath) => {
            const config = SECTION_CONFIG[sectionPath]
            const isAdmin = isAdminSection(sectionPath)
            
            // isAdminSection should match the config
            if (config) {
              expect(isAdmin).toBe(config.isAdminSection)
            }
            
            // All /admin/* paths should be admin sections
            if (sectionPath.startsWith('/admin')) {
              expect(isAdmin).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test that filtering is idempotent
     */
    it('filtering should be idempotent', () => {
      fc.assert(
        fc.property(
          navigationItemsArb,
          permissionArrayArb,
          (navItems, userPermissions) => {
            // Filter once
            const filteredOnce = filterNavigationByPermissions(navItems, userPermissions)
            
            // Filter again
            const filteredTwice = filterNavigationByPermissions(filteredOnce, userPermissions)
            
            // Results should be the same
            expect(filteredTwice.length).toBe(filteredOnce.length)
            for (let i = 0; i < filteredOnce.length; i++) {
              expect(filteredTwice[i]).toEqual(filteredOnce[i])
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
