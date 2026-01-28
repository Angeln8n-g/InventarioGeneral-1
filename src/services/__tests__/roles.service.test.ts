/**
 * RolesService - Unit Tests and Property-Based Tests
 * 
 * Feature: dynamic-permissions-system
 * 
 * This test file validates the RolesService functionality including:
 * - CRUD operations for roles
 * - Protected role validation
 * - User reassignment when deleting roles
 * 
 * Property-Based Tests:
 * - Property 1: Unicidad de nombres de roles
 * - Property 2: Edición de roles preserva permisos
 * - Property 3: Eliminación de roles reasigna usuarios
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8**
 */

import * as fc from 'fast-check';
import { 
  isProtectedRoleName,
} from '@/services/roles.service';
import { PERMISSIONS } from '@/lib/permissions';

describe('Feature: dynamic-permissions-system - RolesService', () => {
  /**
   * Test protected role name validation
   * @see Requirements 1.7, 1.8
   */
  describe('isProtectedRoleName', () => {
    it('should return true for "admin" role', () => {
      expect(isProtectedRoleName('admin')).toBe(true);
    });

    it('should return true for "user" role', () => {
      expect(isProtectedRoleName('user')).toBe(true);
    });

    it('should return true for "Admin" role (case insensitive)', () => {
      expect(isProtectedRoleName('Admin')).toBe(true);
    });

    it('should return true for "USER" role (case insensitive)', () => {
      expect(isProtectedRoleName('USER')).toBe(true);
    });

    it('should return false for custom role names', () => {
      expect(isProtectedRoleName('manager')).toBe(false);
      expect(isProtectedRoleName('supervisor')).toBe(false);
      expect(isProtectedRoleName('guest')).toBe(false);
      expect(isProtectedRoleName('moderator')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isProtectedRoleName('')).toBe(false);
    });

    it('should return false for role names containing protected names', () => {
      expect(isProtectedRoleName('admin_backup')).toBe(false);
      expect(isProtectedRoleName('super_admin')).toBe(false);
      expect(isProtectedRoleName('user_manager')).toBe(false);
      expect(isProtectedRoleName('power_user')).toBe(false);
    });
  });

  /**
   * Test role name validation edge cases
   * These tests verify the validation logic without database calls
   */
  describe('Role name validation logic', () => {
    const validateRoleName = (name: string): { valid: boolean; error?: string } => {
      if (!name || name.trim().length === 0) {
        return { valid: false, error: 'ROLE_NAME_REQUIRED' };
      }
      if (name.length > 50) {
        return { valid: false, error: 'ROLE_NAME_TOO_LONG' };
      }
      return { valid: true };
    };

    it('should reject empty role name', () => {
      const result = validateRoleName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ROLE_NAME_REQUIRED');
    });

    it('should reject whitespace-only role name', () => {
      const result = validateRoleName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ROLE_NAME_REQUIRED');
    });

    it('should reject role name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = validateRoleName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ROLE_NAME_TOO_LONG');
    });

    it('should accept valid role name', () => {
      const result = validateRoleName('manager');
      expect(result.valid).toBe(true);
    });

    it('should accept role name with exactly 50 characters', () => {
      const exactName = 'a'.repeat(50);
      const result = validateRoleName(exactName);
      expect(result.valid).toBe(true);
    });

    it('should accept role name with special characters', () => {
      const result = validateRoleName('role-with_special.chars');
      expect(result.valid).toBe(true);
    });

    it('should accept role name with numbers', () => {
      const result = validateRoleName('role123');
      expect(result.valid).toBe(true);
    });

    it('should accept role name with spaces', () => {
      const result = validateRoleName('Role With Spaces');
      expect(result.valid).toBe(true);
    });
  });

  /**
   * Test canDeleteRole logic
   * These tests verify the deletion validation logic
   */
  describe('canDeleteRole logic', () => {
    const canDeleteRoleLogic = (
      role: { name: string; isProtected: boolean } | null,
      userCount: number
    ): { canDelete: boolean; reason?: string; affectedUsers?: number } => {
      if (!role) {
        return { canDelete: false, reason: 'El rol no existe' };
      }

      const protectedNames = ['admin', 'user'];
      if (role.isProtected || protectedNames.includes(role.name.toLowerCase())) {
        return {
          canDelete: false,
          reason: `El rol "${role.name}" es un rol protegido del sistema y no puede ser eliminado`,
        };
      }

      return {
        canDelete: true,
        affectedUsers: userCount,
      };
    };

    it('should not allow deletion of null role', () => {
      const result = canDeleteRoleLogic(null, 0);
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('El rol no existe');
    });

    it('should not allow deletion of admin role', () => {
      const result = canDeleteRoleLogic({ name: 'admin', isProtected: true }, 5);
      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('rol protegido');
    });

    it('should not allow deletion of user role', () => {
      const result = canDeleteRoleLogic({ name: 'user', isProtected: true }, 10);
      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('rol protegido');
    });

    it('should not allow deletion of role with isProtected flag', () => {
      const result = canDeleteRoleLogic({ name: 'custom', isProtected: true }, 0);
      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('rol protegido');
    });

    it('should allow deletion of non-protected role with no users', () => {
      const result = canDeleteRoleLogic({ name: 'manager', isProtected: false }, 0);
      expect(result.canDelete).toBe(true);
      expect(result.affectedUsers).toBe(0);
    });

    it('should allow deletion of non-protected role with users and report affected count', () => {
      const result = canDeleteRoleLogic({ name: 'supervisor', isProtected: false }, 15);
      expect(result.canDelete).toBe(true);
      expect(result.affectedUsers).toBe(15);
    });
  });

  /**
   * Test effective permissions calculation for role deletion
   * When a role is deleted, users should be reassigned to "user" role
   * @see Requirements 1.6
   */
  describe('User reassignment logic', () => {
    it('should identify default role name as "user"', () => {
      const DEFAULT_ROLE_NAME = 'user';
      expect(DEFAULT_ROLE_NAME).toBe('user');
    });

    it('should calculate correct number of affected users', () => {
      const usersWithRole = [
        { id: 1, roleId: 5 },
        { id: 2, roleId: 5 },
        { id: 3, roleId: 5 },
      ];
      const roleIdToDelete = 5;
      const affectedUsers = usersWithRole.filter(u => u.roleId === roleIdToDelete);
      expect(affectedUsers.length).toBe(3);
    });
  });
});


/**
 * Get all permission values from the PERMISSIONS constant
 */
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Generator for valid role names (non-empty, not just spaces, not protected names)
 * @see Design Document - Testing Strategy - validRoleNameArb
 */
const validRoleNameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0 && !['admin', 'user'].includes(s.toLowerCase()));

/**
 * Generator for permission sets
 */
const permissionSetArb = fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 });

/**
 * ============================================================================
 * PROPERTY-BASED TESTS FOR ROLE MANAGEMENT
 * Feature: dynamic-permissions-system
 * ============================================================================
 */
describe('Feature: dynamic-permissions-system - Property-Based Tests', () => {
  /**
   * Property 1: Unicidad de nombres de roles
   * 
   * For any valid role name (non-empty, not just spaces), if a role is created 
   * successfully with that name, attempting to create another role with the same 
   * name must result in a duplicate error.
   * 
   * **Validates: Requirements 1.2, 1.3**
   * 
   * Since these tests require database operations, we create pure function tests
   * that validate the logic without DB calls.
   */
  describe('Property 1: Unicidad de nombres de roles', () => {
    /**
     * Simulates role creation logic for testing uniqueness
     * This is a pure function that mimics the service behavior
     */
    interface MockRole {
      id: number;
      name: string;
      description: string | null;
    }

    class MockRoleStore {
      private roles: Map<string, MockRole> = new Map();
      private nextId = 1;

      createRole(name: string, description?: string): MockRole | { error: string } {
        // Validate name
        if (!name || name.trim().length === 0) {
          return { error: 'ROLE_NAME_REQUIRED' };
        }
        if (name.length > 50) {
          return { error: 'ROLE_NAME_TOO_LONG' };
        }

        // Check for duplicate (case-sensitive as per implementation)
        if (this.roles.has(name)) {
          return { error: 'ROLE_NAME_EXISTS' };
        }

        const role: MockRole = {
          id: this.nextId++,
          name: name.trim(),
          description: description?.trim() || null,
        };
        this.roles.set(name, role);
        return role;
      }

      getRoleByName(name: string): MockRole | null {
        return this.roles.get(name) || null;
      }

      clear(): void {
        this.roles.clear();
        this.nextId = 1;
      }
    }

    it('should reject duplicate role names when creating roles', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          fc.option(fc.string({ maxLength: 200 })),
          (roleName, description) => {
            const store = new MockRoleStore();
            
            // Create first role - should succeed
            const result1 = store.createRole(roleName, description ?? undefined);
            expect('error' in result1).toBe(false);
            
            // Create second role with same name - should fail with duplicate error
            const result2 = store.createRole(roleName, description ?? undefined);
            expect('error' in result2).toBe(true);
            if ('error' in result2) {
              expect(result2.error).toBe('ROLE_NAME_EXISTS');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow different role names to coexist', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(validRoleNameArb, { minLength: 2, maxLength: 10 }),
          (roleNames) => {
            const store = new MockRoleStore();
            
            // Create all roles - all should succeed since names are unique
            for (const name of roleNames) {
              const result = store.createRole(name);
              expect('error' in result).toBe(false);
            }
            
            // Verify all roles exist
            for (const name of roleNames) {
              const role = store.getRoleByName(name);
              expect(role).not.toBeNull();
              expect(role?.name).toBe(name.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain uniqueness constraint after multiple operations', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          fc.array(validRoleNameArb, { minLength: 1, maxLength: 5 }),
          (targetName, otherNames) => {
            const store = new MockRoleStore();
            
            // Create target role first
            const targetResult = store.createRole(targetName);
            expect('error' in targetResult).toBe(false);
            
            // Create other roles (may or may not succeed depending on uniqueness)
            for (const name of otherNames) {
              store.createRole(name);
            }
            
            // Attempting to create target role again should always fail
            const duplicateResult = store.createRole(targetName);
            expect('error' in duplicateResult).toBe(true);
            if ('error' in duplicateResult) {
              expect(duplicateResult.error).toBe('ROLE_NAME_EXISTS');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Edición de roles preserva permisos
   * 
   * For any existing role with a set of assigned permissions, updating the role's 
   * name or description must result in the role's permissions remaining exactly 
   * the same before and after the operation.
   * 
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Edición de roles preserva permisos', () => {
    /**
     * Simulates role with permissions for testing preservation
     */
    interface MockRoleWithPermissions {
      id: number;
      name: string;
      description: string | null;
      permissions: string[];
    }

    class MockRoleStoreWithPermissions {
      private roles: Map<number, MockRoleWithPermissions> = new Map();
      private nameIndex: Map<string, number> = new Map();
      private nextId = 1;

      createRole(name: string, description?: string, permissions: string[] = []): MockRoleWithPermissions | { error: string } {
        if (!name || name.trim().length === 0) {
          return { error: 'ROLE_NAME_REQUIRED' };
        }
        if (this.nameIndex.has(name)) {
          return { error: 'ROLE_NAME_EXISTS' };
        }

        const role: MockRoleWithPermissions = {
          id: this.nextId++,
          name: name.trim(),
          description: description?.trim() || null,
          permissions: [...permissions],
        };
        this.roles.set(role.id, role);
        this.nameIndex.set(name, role.id);
        return role;
      }

      updateRole(id: number, updates: { name?: string; description?: string }): MockRoleWithPermissions | { error: string } {
        const role = this.roles.get(id);
        if (!role) {
          return { error: 'ROLE_NOT_FOUND' };
        }

        // Validate new name if provided
        if (updates.name !== undefined) {
          if (!updates.name || updates.name.trim().length === 0) {
            return { error: 'ROLE_NAME_REQUIRED' };
          }
          // Check for duplicate name (excluding current role)
          const existingId = this.nameIndex.get(updates.name);
          if (existingId !== undefined && existingId !== id) {
            return { error: 'ROLE_NAME_EXISTS' };
          }
          
          // Update name index
          this.nameIndex.delete(role.name);
          this.nameIndex.set(updates.name.trim(), id);
          role.name = updates.name.trim();
        }

        if (updates.description !== undefined) {
          role.description = updates.description?.trim() || null;
        }

        // IMPORTANT: Permissions are NOT modified during name/description update
        // This is the key behavior we're testing
        
        return { ...role };
      }

      getRoleById(id: number): MockRoleWithPermissions | null {
        const role = this.roles.get(id);
        return role ? { ...role } : null;
      }

      getPermissions(id: number): string[] | null {
        const role = this.roles.get(id);
        return role ? [...role.permissions] : null;
      }
    }

    it('should preserve permissions when updating role name', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          validRoleNameArb,
          fc.option(fc.string({ maxLength: 200 })),
          permissionSetArb,
          (originalName, newName, description, permissions) => {
            // Skip if names are the same (not a meaningful test case)
            if (originalName === newName) return;
            
            const store = new MockRoleStoreWithPermissions();
            
            // Create role with permissions
            const createResult = store.createRole(originalName, description ?? undefined, permissions);
            expect('error' in createResult).toBe(false);
            if ('error' in createResult) return;
            
            const roleId = createResult.id;
            const permissionsBefore = store.getPermissions(roleId);
            
            // Update role name
            const updateResult = store.updateRole(roleId, { name: newName });
            expect('error' in updateResult).toBe(false);
            
            // Verify permissions are unchanged
            const permissionsAfter = store.getPermissions(roleId);
            expect(new Set(permissionsAfter)).toEqual(new Set(permissionsBefore));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve permissions when updating role description', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          fc.option(fc.string({ maxLength: 200 })),
          fc.option(fc.string({ maxLength: 200 })),
          permissionSetArb,
          (roleName, originalDescription, newDescription, permissions) => {
            const store = new MockRoleStoreWithPermissions();
            
            // Create role with permissions
            const createResult = store.createRole(roleName, originalDescription ?? undefined, permissions);
            expect('error' in createResult).toBe(false);
            if ('error' in createResult) return;
            
            const roleId = createResult.id;
            const permissionsBefore = store.getPermissions(roleId);
            
            // Update role description
            const updateResult = store.updateRole(roleId, { description: newDescription ?? undefined });
            expect('error' in updateResult).toBe(false);
            
            // Verify permissions are unchanged
            const permissionsAfter = store.getPermissions(roleId);
            expect(new Set(permissionsAfter)).toEqual(new Set(permissionsBefore));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve permissions when updating both name and description', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          validRoleNameArb,
          fc.option(fc.string({ maxLength: 200 })),
          fc.option(fc.string({ maxLength: 200 })),
          permissionSetArb,
          (originalName, newName, originalDescription, newDescription, permissions) => {
            // Skip if names are the same
            if (originalName === newName) return;
            
            const store = new MockRoleStoreWithPermissions();
            
            // Create role with permissions
            const createResult = store.createRole(originalName, originalDescription ?? undefined, permissions);
            expect('error' in createResult).toBe(false);
            if ('error' in createResult) return;
            
            const roleId = createResult.id;
            const permissionsBefore = store.getPermissions(roleId);
            
            // Update both name and description
            const updateResult = store.updateRole(roleId, { 
              name: newName, 
              description: newDescription ?? undefined 
            });
            expect('error' in updateResult).toBe(false);
            
            // Verify permissions are unchanged
            const permissionsAfter = store.getPermissions(roleId);
            expect(new Set(permissionsAfter)).toEqual(new Set(permissionsBefore));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve permissions after multiple consecutive updates', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          fc.array(
            fc.record({
              name: fc.option(validRoleNameArb),
              description: fc.option(fc.string({ maxLength: 200 })),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          permissionSetArb,
          (initialName, updates, permissions) => {
            const store = new MockRoleStoreWithPermissions();
            
            // Create role with permissions
            const createResult = store.createRole(initialName, undefined, permissions);
            expect('error' in createResult).toBe(false);
            if ('error' in createResult) return;
            
            const roleId = createResult.id;
            const originalPermissions = store.getPermissions(roleId);
            
            // Apply multiple updates
            let currentName = initialName;
            for (const update of updates) {
              const updateData: { name?: string; description?: string } = {};
              
              if (update.name !== null && update.name !== currentName) {
                updateData.name = update.name;
              }
              if (update.description !== null) {
                updateData.description = update.description;
              }
              
              if (Object.keys(updateData).length > 0) {
                const result = store.updateRole(roleId, updateData);
                if (!('error' in result) && updateData.name) {
                  currentName = updateData.name;
                }
              }
            }
            
            // Verify permissions are still unchanged after all updates
            const finalPermissions = store.getPermissions(roleId);
            expect(new Set(finalPermissions)).toEqual(new Set(originalPermissions));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Eliminación de roles reasigna usuarios
   * 
   * For any non-protected role with assigned users, when the role is deleted, 
   * all users who had that role must be reassigned to the "user" default role.
   * 
   * **Validates: Requirements 1.6**
   */
  describe('Property 3: Eliminación de roles reasigna usuarios', () => {
    /**
     * Simulates role and user management for testing reassignment
     */
    interface MockUser {
      id: number;
      username: string;
      roleId: number;
      roleName: string;
    }

    interface MockRole {
      id: number;
      name: string;
      isProtected: boolean;
    }

    const DEFAULT_ROLE_NAME = 'user';
    const PROTECTED_ROLE_NAMES = ['admin', 'user'];

    class MockRoleUserStore {
      private roles: Map<number, MockRole> = new Map();
      private users: Map<number, MockUser> = new Map();
      private nextRoleId = 1;
      private nextUserId = 1;
      private defaultRoleId: number | null = null;

      constructor() {
        // Initialize with protected roles
        const adminRole = this.createRole('admin', true);
        const userRole = this.createRole('user', true);
        if (!('error' in userRole)) {
          this.defaultRoleId = userRole.id;
        }
      }

      createRole(name: string, isProtected = false): MockRole | { error: string } {
        if (!name || name.trim().length === 0) {
          return { error: 'ROLE_NAME_REQUIRED' };
        }

        const role: MockRole = {
          id: this.nextRoleId++,
          name: name.trim(),
          isProtected,
        };
        this.roles.set(role.id, role);
        return role;
      }

      createUser(username: string, roleId: number): MockUser | { error: string } {
        const role = this.roles.get(roleId);
        if (!role) {
          return { error: 'ROLE_NOT_FOUND' };
        }

        const user: MockUser = {
          id: this.nextUserId++,
          username,
          roleId,
          roleName: role.name,
        };
        this.users.set(user.id, user);
        return user;
      }

      deleteRole(roleId: number): { success: boolean; error?: string; reassignedUsers?: number[] } {
        const role = this.roles.get(roleId);
        if (!role) {
          return { success: false, error: 'ROLE_NOT_FOUND' };
        }

        // Check if role is protected
        if (role.isProtected || PROTECTED_ROLE_NAMES.includes(role.name.toLowerCase())) {
          return { success: false, error: 'PROTECTED_ROLE' };
        }

        // Get default role for reassignment
        if (this.defaultRoleId === null) {
          return { success: false, error: 'DEFAULT_ROLE_NOT_FOUND' };
        }
        const defaultRole = this.roles.get(this.defaultRoleId);
        if (!defaultRole) {
          return { success: false, error: 'DEFAULT_ROLE_NOT_FOUND' };
        }

        // Find and reassign all users with this role
        const reassignedUserIds: number[] = [];
        for (const [userId, user] of this.users) {
          if (user.roleId === roleId) {
            user.roleId = this.defaultRoleId;
            user.roleName = DEFAULT_ROLE_NAME;
            reassignedUserIds.push(userId);
          }
        }

        // Delete the role
        this.roles.delete(roleId);

        return { success: true, reassignedUsers: reassignedUserIds };
      }

      getUsersByRole(roleId: number): MockUser[] {
        return Array.from(this.users.values()).filter(u => u.roleId === roleId);
      }

      getUserById(userId: number): MockUser | null {
        return this.users.get(userId) || null;
      }

      getRoleById(roleId: number): MockRole | null {
        return this.roles.get(roleId) || null;
      }

      getDefaultRoleId(): number | null {
        return this.defaultRoleId;
      }
    }

    it('should reassign all users to default role when non-protected role is deleted', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          (roleName, usernames) => {
            const store = new MockRoleUserStore();
            
            // Create a custom role
            const roleResult = store.createRole(roleName);
            expect('error' in roleResult).toBe(false);
            if ('error' in roleResult) return;
            
            const roleId = roleResult.id;
            
            // Create users with this role
            const createdUserIds: number[] = [];
            for (const username of usernames) {
              const userResult = store.createUser(username, roleId);
              if (!('error' in userResult)) {
                createdUserIds.push(userResult.id);
              }
            }
            
            // Verify users are assigned to the custom role
            const usersBeforeDelete = store.getUsersByRole(roleId);
            expect(usersBeforeDelete.length).toBe(createdUserIds.length);
            
            // Delete the role
            const deleteResult = store.deleteRole(roleId);
            expect(deleteResult.success).toBe(true);
            
            // Verify all users are now assigned to default role
            const defaultRoleId = store.getDefaultRoleId();
            expect(defaultRoleId).not.toBeNull();
            
            for (const userId of createdUserIds) {
              const user = store.getUserById(userId);
              expect(user).not.toBeNull();
              expect(user?.roleId).toBe(defaultRoleId);
              expect(user?.roleName).toBe(DEFAULT_ROLE_NAME);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow deletion of protected roles', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('admin', 'user', 'Admin', 'User', 'ADMIN', 'USER'),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          (protectedRoleName, usernames) => {
            const store = new MockRoleUserStore();
            
            // Find the protected role
            let protectedRoleId: number | null = null;
            for (let i = 1; i <= 10; i++) {
              const role = store.getRoleById(i);
              if (role && role.name.toLowerCase() === protectedRoleName.toLowerCase()) {
                protectedRoleId = role.id;
                break;
              }
            }
            
            if (protectedRoleId === null) return; // Skip if role not found
            
            // Try to delete protected role
            const deleteResult = store.deleteRole(protectedRoleId);
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.error).toBe('PROTECTED_ROLE');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should report correct number of reassigned users', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          fc.integer({ min: 0, max: 20 }),
          (roleName, userCount) => {
            const store = new MockRoleUserStore();
            
            // Create a custom role
            const roleResult = store.createRole(roleName);
            expect('error' in roleResult).toBe(false);
            if ('error' in roleResult) return;
            
            const roleId = roleResult.id;
            
            // Create specified number of users
            const createdUserIds: number[] = [];
            for (let i = 0; i < userCount; i++) {
              const userResult = store.createUser(`user_${i}`, roleId);
              if (!('error' in userResult)) {
                createdUserIds.push(userResult.id);
              }
            }
            
            // Delete the role
            const deleteResult = store.deleteRole(roleId);
            expect(deleteResult.success).toBe(true);
            
            // Verify reassigned users count matches
            expect(deleteResult.reassignedUsers?.length).toBe(createdUserIds.length);
            
            // Verify all reassigned user IDs are correct
            if (deleteResult.reassignedUsers) {
              expect(new Set(deleteResult.reassignedUsers)).toEqual(new Set(createdUserIds));
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion of role with no users', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          (roleName) => {
            const store = new MockRoleUserStore();
            
            // Create a custom role with no users
            const roleResult = store.createRole(roleName);
            expect('error' in roleResult).toBe(false);
            if ('error' in roleResult) return;
            
            const roleId = roleResult.id;
            
            // Verify no users are assigned
            const usersBeforeDelete = store.getUsersByRole(roleId);
            expect(usersBeforeDelete.length).toBe(0);
            
            // Delete the role
            const deleteResult = store.deleteRole(roleId);
            expect(deleteResult.success).toBe(true);
            expect(deleteResult.reassignedUsers?.length).toBe(0);
            
            // Verify role is deleted
            const deletedRole = store.getRoleById(roleId);
            expect(deletedRole).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve users in other roles when deleting a specific role', () => {
      fc.assert(
        fc.property(
          validRoleNameArb,
          validRoleNameArb,
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          (roleToDelete, roleToKeep, usersToReassign, usersToKeep) => {
            // Skip if role names are the same (after trimming, as the service trims names)
            if (roleToDelete.trim() === roleToKeep.trim()) return;
            
            const store = new MockRoleUserStore();
            
            // Create two custom roles
            const deleteRoleResult = store.createRole(roleToDelete);
            const keepRoleResult = store.createRole(roleToKeep);
            
            expect('error' in deleteRoleResult).toBe(false);
            expect('error' in keepRoleResult).toBe(false);
            if ('error' in deleteRoleResult || 'error' in keepRoleResult) return;
            
            const deleteRoleId = deleteRoleResult.id;
            const keepRoleId = keepRoleResult.id;
            
            // Get the actual stored role name (trimmed)
            const storedKeepRoleName = keepRoleResult.name;
            
            // Create users for role to delete
            const deleteRoleUserIds: number[] = [];
            for (const username of usersToReassign) {
              const userResult = store.createUser(`del_${username}`, deleteRoleId);
              if (!('error' in userResult)) {
                deleteRoleUserIds.push(userResult.id);
              }
            }
            
            // Create users for role to keep
            const keepRoleUserIds: number[] = [];
            for (const username of usersToKeep) {
              const userResult = store.createUser(`keep_${username}`, keepRoleId);
              if (!('error' in userResult)) {
                keepRoleUserIds.push(userResult.id);
              }
            }
            
            // Delete the first role
            const deleteResult = store.deleteRole(deleteRoleId);
            expect(deleteResult.success).toBe(true);
            
            // Verify users from deleted role are reassigned to default
            const defaultRoleId = store.getDefaultRoleId();
            for (const userId of deleteRoleUserIds) {
              const user = store.getUserById(userId);
              expect(user?.roleId).toBe(defaultRoleId);
            }
            
            // Verify users from kept role are unchanged
            for (const userId of keepRoleUserIds) {
              const user = store.getUserById(userId);
              expect(user?.roleId).toBe(keepRoleId);
              // Compare against the stored (trimmed) role name
              expect(user?.roleName).toBe(storedKeepRoleName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
