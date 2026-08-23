'use client'

/**
 * PermissionsContext - Dynamic Permissions Context Provider
 * 
 * This context provides permission management for the application, including:
 * - Loading permissions when user logs in (via /api/permissions/effective)
 * - Local caching of permissions to avoid repeated database queries
 * - Cache invalidation and refresh functionality
 * - Permission checking functions (hasPermission, hasAnyPermission, hasAllPermissions)
 * 
 * @see Requirements 9.2 - Client-side permission caching
 * @see Requirements 9.3 - Cache invalidation when permissions change
 * @see Requirements 9.4 - Load all effective permissions in a single query on login
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'

/**
 * Cache configuration constants
 */
const CACHE_KEY_PREFIX = 'permissions_cache_'
const CACHE_VERSION_KEY = 'permissions_cache_version'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes cache TTL
const CURRENT_CACHE_VERSION = '1'

/**
 * Interface for cached permissions data
 */
interface CachedPermissions {
  permissions: string[]
  rolePermissions: string[]
  userOverrides: { granted: string[]; revoked: string[] }
  userRole: string
  timestamp: number
  version: string
}

/**
 * Interface for the PermissionsContext value
 * Matches the design document specification
 */
export interface PermissionsContextValue {
  // Estado
  permissions: string[]
  rolePermissions: string[]
  userOverrides: { granted: string[]; revoked: string[] }
  isLoading: boolean
  error: Error | null
  
  // Verificación
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  
  // Acciones
  refreshPermissions: () => Promise<void>
  
  // Metadata
  userRole: string
  isAdmin: boolean
}

/**
 * API response type for /api/permissions/effective
 */
interface EffectivePermissionsResponse {
  success: boolean
  data?: {
    userId: number
    roleName: string
    rolePermissions: string[]
    overrides: {
      granted: string[]
      revoked: string[]
    }
    effectivePermissions: string[]
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * Default context value for when no provider is present
 */
const defaultContextValue: PermissionsContextValue = {
  permissions: [],
  rolePermissions: [],
  userOverrides: { granted: [], revoked: [] },
  isLoading: true,
  error: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refreshPermissions: async () => {},
  userRole: '',
  isAdmin: false,
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined)

/**
 * Get the cache key for a specific user
 */
function getCacheKey(userId: number): string {
  return `${CACHE_KEY_PREFIX}${userId}`
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cached: CachedPermissions | null): boolean {
  if (!cached) return false
  if (cached.version !== CURRENT_CACHE_VERSION) return false
  
  const now = Date.now()
  const age = now - cached.timestamp
  return age < CACHE_TTL_MS
}

/**
 * Load cached permissions from localStorage
 * @see Requirements 9.2 - Client-side permission caching
 */
function loadFromCache(userId: number): CachedPermissions | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cacheKey = getCacheKey(userId)
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null
    
    const parsed = JSON.parse(cached) as CachedPermissions
    if (isCacheValid(parsed)) {
      return parsed
    }
    
    // Cache expired, remove it
    localStorage.removeItem(cacheKey)
    return null
  } catch {
    return null
  }
}

/**
 * Save permissions to localStorage cache
 * @see Requirements 9.2 - Client-side permission caching
 */
function saveToCache(userId: number, data: Omit<CachedPermissions, 'timestamp' | 'version'>): void {
  if (typeof window === 'undefined') return
  
  try {
    const cacheKey = getCacheKey(userId)
    const cacheData: CachedPermissions = {
      ...data,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Clear cached permissions for a user
 * @see Requirements 9.3 - Cache invalidation when permissions change
 */
function clearCache(userId: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const cacheKey = getCacheKey(userId)
    localStorage.removeItem(cacheKey)
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Clear all permission caches (used when cache version changes)
 */
function clearAllCaches(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * PermissionsProvider component
 * 
 * Provides permission context to the application with:
 * - Automatic loading of permissions when user is authenticated
 * - Local caching to avoid repeated API calls
 * - Cache invalidation via refreshPermissions
 */
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  // Get auth state from Redux
  const { user, token } = useSelector((state: RootState) => state.auth)
  
  // Permission state
  const [permissions, setPermissions] = useState<string[]>([])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [userOverrides, setUserOverrides] = useState<{ granted: string[]; revoked: string[] }>({ granted: [], revoked: [] })
  const [userRole, setUserRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Track if we've loaded permissions for the current user
  const loadedUserIdRef = useRef<number | null>(null)
  const isLoadingRef = useRef<boolean>(false)

  /**
   * Fetch permissions from the API
   * @see Requirements 9.4 - Load all effective permissions in a single query
   */
  const fetchPermissions = useCallback(async (userId: number, authToken: string): Promise<void> => {
    // Prevent concurrent fetches
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/permissions/effective', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        }
        throw new Error(`Error al cargar permisos: ${response.status}`)
      }
      
      const data: EffectivePermissionsResponse = await response.json()
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Error al cargar permisos')
      }
      
      // Update state with fetched permissions
      setPermissions(data.data.effectivePermissions)
      setRolePermissions(data.data.rolePermissions)
      setUserOverrides(data.data.overrides)
      setUserRole(data.data.roleName)
      
      // Save to cache
      saveToCache(userId, {
        permissions: data.data.effectivePermissions,
        rolePermissions: data.data.rolePermissions,
        userOverrides: data.data.overrides,
        userRole: data.data.roleName,
      })
      
      loadedUserIdRef.current = userId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar permisos'
      setError(new Error(errorMessage))
      console.error('Error fetching permissions:', err)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [])

  /**
   * Load permissions - first try cache, then fetch from API
   * @see Requirements 9.2 - Client-side permission caching
   * @see Requirements 9.4 - Load all effective permissions on login
   */
  const loadPermissions = useCallback(async (userId: number, authToken: string): Promise<void> => {
    // Check cache first
    const cached = loadFromCache(userId)
    
    if (cached) {
      // Use cached data
      setPermissions(cached.permissions)
      setRolePermissions(cached.rolePermissions)
      setUserOverrides(cached.userOverrides)
      setUserRole(cached.userRole)
      setIsLoading(false)
      loadedUserIdRef.current = userId
      return
    }
    
    // No valid cache, fetch from API
    await fetchPermissions(userId, authToken)
  }, [fetchPermissions])

  /**
   * Refresh permissions - invalidates cache and reloads from API
   * @see Requirements 9.3 - Cache invalidation when permissions change
   */
  const refreshPermissions = useCallback(async (): Promise<void> => {
    if (!user?.id || !token) {
      return
    }
    
    // Clear cache for this user
    clearCache(user.id)
    
    // Fetch fresh permissions from API
    await fetchPermissions(user.id, token)
  }, [user?.id, token, fetchPermissions])

  /**
   * Determine if user is admin based on role
   * Computed first so it can be used in permission checks
   */
  const isAdmin = useMemo(() => userRole === 'admin', [userRole])

  /**
   * Check if user has a specific permission
   * Uses memoized permission set for O(1) lookup
   * IMPORTANT: Admin users always have all permissions
   */
  const permissionsSet = useMemo(() => new Set(permissions), [permissions])
  
  const hasPermission = useCallback((permission: string): boolean => {
    // Admin users have all permissions
    if (isAdmin) return true
    return permissionsSet.has(permission)
  }, [permissionsSet, isAdmin])

  /**
   * Check if user has any of the specified permissions
   * IMPORTANT: Admin users always have all permissions
   */
  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    // Admin users have all permissions
    if (isAdmin) return true
    return perms.some(p => permissionsSet.has(p))
  }, [permissionsSet, isAdmin])

  /**
   * Check if user has all of the specified permissions
   * IMPORTANT: Admin users always have all permissions
   */
  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    // Admin users have all permissions
    if (isAdmin) return true
    return perms.every(p => permissionsSet.has(p))
  }, [permissionsSet, isAdmin])

  /**
   * Effect: Load permissions when user authenticates
   * @see Requirements 9.4 - Load all effective permissions on login
   */
  useEffect(() => {
    // Clear state if user logs out
    if (!user?.id || !token) {
      setPermissions([])
      setRolePermissions([])
      setUserOverrides({ granted: [], revoked: [] })
      setUserRole('')
      setIsLoading(false)
      setError(null)
      loadedUserIdRef.current = null
      return
    }
    
    // Skip if we've already loaded for this user
    if (loadedUserIdRef.current === user.id) {
      return
    }
    
    // Load permissions for the authenticated user
    loadPermissions(user.id, token)
  }, [user?.id, token, loadPermissions])

  /**
   * Effect: Check and clear outdated caches on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
      if (storedVersion !== CURRENT_CACHE_VERSION) {
        clearAllCaches()
        localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION)
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [])

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<PermissionsContextValue>(() => ({
    permissions,
    rolePermissions,
    userOverrides,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
    userRole,
    isAdmin,
  }), [
    permissions,
    rolePermissions,
    userOverrides,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
    userRole,
    isAdmin,
  ])

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * Hook to access the permissions context
 * 
 * @throws Error if used outside of PermissionsProvider
 * @returns PermissionsContextValue
 */
export function usePermissionsContext(): PermissionsContextValue {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider')
  }
  return context
}

/**
 * Utility function to invalidate permissions cache for a specific user
 * Can be called from anywhere in the app when permissions change
 * 
 * @see Requirements 9.3 - Cache invalidation when permissions change
 */
export function invalidatePermissionsCache(userId: number): void {
  clearCache(userId)
}

/**
 * Utility function to invalidate all permissions caches
 * Useful when making bulk permission changes
 * 
 * @see Requirements 9.3 - Cache invalidation when permissions change
 */
export function invalidateAllPermissionsCaches(): void {
  clearAllCaches()
}

export default PermissionsContext
