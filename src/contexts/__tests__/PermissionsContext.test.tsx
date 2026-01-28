/**
 * PermissionsContext - Unit Tests
 * 
 * Tests for the PermissionsContext provider and hooks.
 * 
 * @see Requirements 9.2 - Client-side permission caching
 * @see Requirements 9.3 - Cache invalidation when permissions change
 * @see Requirements 9.4 - Load all effective permissions on login
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import {
  PermissionsProvider,
  usePermissionsContext,
  invalidatePermissionsCache,
  invalidateAllPermissionsCaches,
} from '../PermissionsContext'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Create a mock auth reducer
const createMockAuthSlice = (user: { id: number; role: string } | null, token: string | null) => {
  return (state = { user, token, isLoading: false, error: null }) => state
}

// Create a mock store
const createMockStore = (user: { id: number; role: string } | null, token: string | null) => {
  return configureStore({
    reducer: {
      auth: createMockAuthSlice(user, token),
    },
  })
}

// Test component that uses the context
const TestConsumer: React.FC = () => {
  const {
    permissions,
    rolePermissions,
    userOverrides,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    isAdmin,
  } = usePermissionsContext()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error?.message || 'no-error'}</div>
      <div data-testid="permissions">{permissions.join(',')}</div>
      <div data-testid="role-permissions">{rolePermissions.join(',')}</div>
      <div data-testid="granted">{userOverrides.granted.join(',')}</div>
      <div data-testid="revoked">{userOverrides.revoked.join(',')}</div>
      <div data-testid="user-role">{userRole}</div>
      <div data-testid="is-admin">{isAdmin ? 'true' : 'false'}</div>
      <div data-testid="has-tools-view">{hasPermission('tools:view') ? 'true' : 'false'}</div>
      <div data-testid="has-any">{hasAnyPermission(['tools:view', 'loans:create']) ? 'true' : 'false'}</div>
      <div data-testid="has-all">{hasAllPermissions(['tools:view', 'loans:create']) ? 'true' : 'false'}</div>
    </div>
  )
}

describe('PermissionsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  describe('Initial State', () => {
    it('should have empty permissions when user is not authenticated', async () => {
      const store = createMockStore(null, null)

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('permissions')).toHaveTextContent('')
      expect(screen.getByTestId('user-role')).toHaveTextContent('')
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false')
    })
  })

  describe('Permission Loading', () => {
    it('should load permissions from API when user is authenticated', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 1,
          roleName: 'admin',
          rolePermissions: ['tools:view', 'tools:create'],
          overrides: {
            granted: ['loans:create'],
            revoked: [],
          },
          effectivePermissions: ['tools:view', 'tools:create', 'loans:create'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const store = createMockStore({ id: 1, role: 'admin' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('permissions')).toHaveTextContent('tools:view,tools:create,loans:create')
      expect(screen.getByTestId('role-permissions')).toHaveTextContent('tools:view,tools:create')
      expect(screen.getByTestId('granted')).toHaveTextContent('loans:create')
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin')
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const store = createMockStore({ id: 1, role: 'user' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Error al cargar permisos: 500')
    })

    it('should handle 401 errors with session expired message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const store = createMockStore({ id: 1, role: 'user' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Sesión expirada')
    })
  })

  describe('Permission Checking Functions', () => {
    it('hasPermission should return true for existing permission', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 1,
          roleName: 'user',
          rolePermissions: ['tools:view'],
          overrides: { granted: [], revoked: [] },
          effectivePermissions: ['tools:view'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const store = createMockStore({ id: 1, role: 'user' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('has-tools-view')).toHaveTextContent('true')
    })

    it('hasAnyPermission should return true if any permission exists', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 1,
          roleName: 'user',
          rolePermissions: ['tools:view'],
          overrides: { granted: [], revoked: [] },
          effectivePermissions: ['tools:view'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const store = createMockStore({ id: 1, role: 'user' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      // Has tools:view but not loans:create, so hasAny should be true
      expect(screen.getByTestId('has-any')).toHaveTextContent('true')
    })

    it('hasAllPermissions should return false if not all permissions exist', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 1,
          roleName: 'user',
          rolePermissions: ['tools:view'],
          overrides: { granted: [], revoked: [] },
          effectivePermissions: ['tools:view'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const store = createMockStore({ id: 1, role: 'user' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      // Has tools:view but not loans:create, so hasAll should be false
      expect(screen.getByTestId('has-all')).toHaveTextContent('false')
    })
  })

  describe('Caching', () => {
    /**
     * @see Requirements 9.2 - Client-side permission caching
     */
    it('should cache permissions in localStorage', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 1,
          roleName: 'user',
          rolePermissions: ['tools:view'],
          overrides: { granted: [], revoked: [] },
          effectivePermissions: ['tools:view'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const store = createMockStore({ id: 1, role: 'user' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      // Verify localStorage was called to save cache
      expect(localStorageMock.setItem).toHaveBeenCalled()
      const cacheKey = localStorageMock.setItem.mock.calls.find(
        (call: string[]) => call[0].startsWith('permissions_cache_')
      )
      expect(cacheKey).toBeDefined()
    })

    it('should use cached permissions if available and valid', async () => {
      // Pre-populate cache
      const cachedData = {
        permissions: ['cached:permission'],
        rolePermissions: ['cached:permission'],
        userOverrides: { granted: [], revoked: [] },
        userRole: 'user',
        timestamp: Date.now(),
        version: '1',
      }
      localStorageMock.setItem('permissions_cache_1', JSON.stringify(cachedData))

      const store = createMockStore({ id: 1, role: 'user' }, 'test-token')

      render(
        <Provider store={store}>
          <PermissionsProvider>
            <TestConsumer />
          </PermissionsProvider>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      // Should use cached data, not call API
      expect(mockFetch).not.toHaveBeenCalled()
      expect(screen.getByTestId('permissions')).toHaveTextContent('cached:permission')
    })

    /**
     * @see Requirements 9.3 - Cache invalidation when permissions change
     */
    it('should invalidate cache when invalidatePermissionsCache is called', () => {
      // Pre-populate cache
      const cachedData = {
        permissions: ['cached:permission'],
        rolePermissions: ['cached:permission'],
        userOverrides: { granted: [], revoked: [] },
        userRole: 'user',
        timestamp: Date.now(),
        version: '1',
      }
      localStorageMock.setItem('permissions_cache_1', JSON.stringify(cachedData))

      // Invalidate cache
      invalidatePermissionsCache(1)

      // Verify cache was removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('permissions_cache_1')
    })

    it('should invalidate all caches when invalidateAllPermissionsCaches is called', () => {
      // Pre-populate multiple caches
      localStorageMock.setItem('permissions_cache_1', JSON.stringify({ version: '1' }))
      localStorageMock.setItem('permissions_cache_2', JSON.stringify({ version: '1' }))
      localStorageMock.setItem('other_key', 'other_value')

      // Invalidate all permission caches
      invalidateAllPermissionsCaches()

      // Verify only permission caches were removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('permissions_cache_1')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('permissions_cache_2')
    })
  })

  describe('Context Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('usePermissionsContext must be used within a PermissionsProvider')

      consoleSpy.mockRestore()
    })
  })
})
