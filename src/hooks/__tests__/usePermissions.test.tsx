/**
 * Tests for usePermissions hook
 * 
 * Verifies:
 * - Backward compatibility with existing API (Requirements 8.1, 8.2)
 * - Support for dynamic permissions from PermissionsContext
 * - Fallback to static permissions when context is not available
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { usePermissions, usePermissionCheck, usePermissionChecks } from '../usePermissions'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import { PERMISSIONS } from '@/lib/permissions'
import authReducer from '@/features/auth/authSlice'

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Type for mock user that matches AuthUser
interface MockUser {
  id: number
  role: 'admin' | 'user'
  username: string
  email: string
  created_at: string
  updated_at: string
  version: number
}

// Helper to create a mock user with all required fields
function createMockUser(overrides: { id: number; role: 'admin' | 'user'; username: string; email: string }): MockUser {
  return {
    ...overrides,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  }
}

// Create a mock store with auth state
function createMockStore(user: MockUser | null = null, token: string | null = null) {
  return configureStore({
    reducer: {
      auth: authReducer,
      // Add a minimal api reducer to satisfy RTK Query
      api: (state = { queries: {}, mutations: {}, provided: {}, subscriptions: {} }) => state,
    },
    preloadedState: {
      auth: {
        user,
        token,
        isLoading: false,
        error: null,
      },
    },
  })
}

// Wrapper component for testing without PermissionsProvider (static mode)
function createStaticWrapper(user: MockUser | null = null, token: string | null = null) {
  const store = createMockStore(user, token)
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }
}

// Wrapper component for testing with PermissionsProvider (dynamic mode)
function createDynamicWrapper(
  user: MockUser | null = null,
  token: string | null = null
) {
  const store = createMockStore(user, token)
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <PermissionsProvider>{children}</PermissionsProvider>
      </Provider>
    )
  }
}

describe('usePermissions hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Static mode (without PermissionsProvider)', () => {
    /**
     * @see Requirements 8.1 - Maintain compatibility with hasPermission
     */
    it('should return hasPermission function that works with static permissions', () => {
      const adminUser = createMockUser({ id: 1, role: 'admin', username: 'admin', email: 'admin@test.com' })
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(adminUser, 'test-token'),
      })

      // Admin should have admin permissions
      expect(result.current.hasPermission(PERMISSIONS.ADMIN_VIEW_DASHBOARD)).toBe(true)
      expect(result.current.hasPermission(PERMISSIONS.USERS_CREATE)).toBe(true)
    })

    it('should return false for permissions user does not have', () => {
      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      // Regular user should not have admin permissions
      expect(result.current.hasPermission(PERMISSIONS.ADMIN_VIEW_DASHBOARD)).toBe(false)
      expect(result.current.hasPermission(PERMISSIONS.USERS_CREATE)).toBe(false)
    })

    /**
     * @see Requirements 8.1 - Maintain compatibility with hasAnyPermission
     */
    it('should return hasAnyPermission function that works correctly', () => {
      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      // User has TOOLS_VIEW but not ADMIN_VIEW_DASHBOARD
      expect(result.current.hasAnyPermission([PERMISSIONS.TOOLS_VIEW, PERMISSIONS.ADMIN_VIEW_DASHBOARD])).toBe(true)
      expect(result.current.hasAnyPermission([PERMISSIONS.ADMIN_VIEW_DASHBOARD, PERMISSIONS.USERS_CREATE])).toBe(false)
    })

    /**
     * @see Requirements 8.1 - Maintain compatibility with hasAllPermissions
     */
    it('should return hasAllPermissions function that works correctly', () => {
      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      // User has both TOOLS_VIEW and LOANS_VIEW_OWN
      expect(result.current.hasAllPermissions([PERMISSIONS.TOOLS_VIEW, PERMISSIONS.LOANS_VIEW_OWN])).toBe(true)
      // User has TOOLS_VIEW but not ADMIN_VIEW_DASHBOARD
      expect(result.current.hasAllPermissions([PERMISSIONS.TOOLS_VIEW, PERMISSIONS.ADMIN_VIEW_DASHBOARD])).toBe(false)
    })

    /**
     * @see Requirements 8.2 - Maintain compatibility with existing components
     */
    it('should return isAdmin and isUser correctly', () => {
      const adminUser = createMockUser({ id: 1, role: 'admin', username: 'admin', email: 'admin@test.com' })
      const { result: adminResult } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(adminUser, 'test-token'),
      })

      expect(adminResult.current.isAdmin).toBe(true)
      expect(adminResult.current.isUser).toBe(false)

      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const { result: userResult } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      expect(userResult.current.isAdmin).toBe(false)
      expect(userResult.current.isUser).toBe(true)
    })

    it('should return business logic permission helpers', () => {
      const adminUser = createMockUser({ id: 1, role: 'admin', username: 'admin', email: 'admin@test.com' })
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(adminUser, 'test-token'),
      })

      expect(result.current.canLoanTool()).toBe(true)
      expect(result.current.canAdjustToolStatus()).toBe(true)
      expect(result.current.canManageStock()).toBe(true)
      expect(result.current.canViewAuditLogs()).toBe(true)
      expect(result.current.canCreateUsers()).toBe(true)
      expect(result.current.canViewAllUsers()).toBe(true)
      expect(result.current.canViewAllLoans()).toBe(true)
      expect(result.current.canGenerateReports()).toBe(true)
      expect(result.current.canConfigureSystem()).toBe(true)
      expect(result.current.canManageCategories()).toBe(true)
    })

    it('should handle canReturnTool with ownership check', () => {
      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      // User can return their own tools
      expect(result.current.canReturnTool(2)).toBe(true)
      // User cannot return other users' tools
      expect(result.current.canReturnTool(3)).toBe(false)
    })

    it('should handle resource ownership checks', () => {
      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      // User can view/modify their own resources
      expect(result.current.canViewOwnResource(2)).toBe(true)
      expect(result.current.canModifyOwnResource(2)).toBe(true)
      // User cannot view/modify other users' resources
      expect(result.current.canViewOwnResource(3)).toBe(false)
      expect(result.current.canModifyOwnResource(3)).toBe(false)
    })

    it('should return false for all permissions when user is null', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createStaticWrapper(null, null),
      })

      expect(result.current.hasPermission(PERMISSIONS.TOOLS_VIEW)).toBe(false)
      expect(result.current.hasAnyPermission([PERMISSIONS.TOOLS_VIEW])).toBe(false)
      expect(result.current.hasAllPermissions([PERMISSIONS.TOOLS_VIEW])).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isUser).toBe(false)
    })
  })

  describe('Dynamic mode (with PermissionsProvider)', () => {
    it('should use dynamic permissions when context is available and loaded', async () => {
      const adminUser = createMockUser({ id: 1, role: 'admin', username: 'admin', email: 'admin@test.com' })
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 1,
            roleName: 'admin',
            rolePermissions: [PERMISSIONS.TOOLS_VIEW, PERMISSIONS.ADMIN_VIEW_DASHBOARD],
            overrides: { granted: [], revoked: [] },
            effectivePermissions: [PERMISSIONS.TOOLS_VIEW, PERMISSIONS.ADMIN_VIEW_DASHBOARD],
          },
        }),
      })

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createDynamicWrapper(adminUser, 'test-token'),
      })

      // Wait for permissions to load and dynamic mode to be active
      await waitFor(() => {
        expect(result.current.isDynamic).toBe(true)
      })
    })

    it('should expose new properties for dynamic permissions', async () => {
      const adminUser = createMockUser({ id: 1, role: 'admin', username: 'admin', email: 'admin@test.com' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 1,
            roleName: 'admin',
            rolePermissions: [PERMISSIONS.TOOLS_VIEW],
            overrides: { granted: [PERMISSIONS.AUDIT_VIEW], revoked: [] },
            effectivePermissions: [PERMISSIONS.TOOLS_VIEW, PERMISSIONS.AUDIT_VIEW],
          },
        }),
      })

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createDynamicWrapper(adminUser, 'test-token'),
      })

      // Wait for permissions to load
      await waitFor(() => {
        expect(result.current.rolePermissions).toBeDefined()
        expect(result.current.userOverrides).toBeDefined()
        expect(result.current.refreshPermissions).toBeDefined()
        expect(result.current.userRole).toBeDefined()
      })
    })
  })

  describe('usePermissionCheck hook', () => {
    it('should return permission check result and loading state', () => {
      const adminUser = createMockUser({ id: 1, role: 'admin', username: 'admin', email: 'admin@test.com' })
      const { result } = renderHook(() => usePermissionCheck(PERMISSIONS.ADMIN_VIEW_DASHBOARD), {
        wrapper: createStaticWrapper(adminUser, 'test-token'),
      })

      expect(result.current.hasPermission).toBe(true)
      expect(typeof result.current.isLoading).toBe('boolean')
    })

    it('should return false for permissions user does not have', () => {
      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const { result } = renderHook(() => usePermissionCheck(PERMISSIONS.ADMIN_VIEW_DASHBOARD), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      expect(result.current.hasPermission).toBe(false)
    })
  })

  describe('usePermissionChecks hook', () => {
    it('should return multiple permission check results', () => {
      const adminUser = createMockUser({ id: 1, role: 'admin', username: 'admin', email: 'admin@test.com' })
      const permissionsToCheck = [PERMISSIONS.TOOLS_VIEW, PERMISSIONS.ADMIN_VIEW_DASHBOARD, PERMISSIONS.USERS_CREATE]
      
      const { result } = renderHook(() => usePermissionChecks(permissionsToCheck), {
        wrapper: createStaticWrapper(adminUser, 'test-token'),
      })

      expect(result.current.permissions[PERMISSIONS.TOOLS_VIEW]).toBe(true)
      expect(result.current.permissions[PERMISSIONS.ADMIN_VIEW_DASHBOARD]).toBe(true)
      expect(result.current.permissions[PERMISSIONS.USERS_CREATE]).toBe(true)
      expect(result.current.hasAnyPermission).toBe(true)
      expect(result.current.hasAllPermissions).toBe(true)
    })

    it('should correctly report hasAnyPermission and hasAllPermissions', () => {
      const regularUser = createMockUser({ id: 2, role: 'user', username: 'user', email: 'user@test.com' })
      const permissionsToCheck = [PERMISSIONS.TOOLS_VIEW, PERMISSIONS.ADMIN_VIEW_DASHBOARD]
      
      const { result } = renderHook(() => usePermissionChecks(permissionsToCheck), {
        wrapper: createStaticWrapper(regularUser, 'test-token'),
      })

      // User has TOOLS_VIEW but not ADMIN_VIEW_DASHBOARD
      expect(result.current.permissions[PERMISSIONS.TOOLS_VIEW]).toBe(true)
      expect(result.current.permissions[PERMISSIONS.ADMIN_VIEW_DASHBOARD]).toBe(false)
      expect(result.current.hasAnyPermission).toBe(true)
      expect(result.current.hasAllPermissions).toBe(false)
    })
  })
})
