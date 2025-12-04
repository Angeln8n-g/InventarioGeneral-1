/**
 * Hook for fetching and using category icons
 * 
 * Provides a way to get category icons from the database with caching
 * and fallback to default icons.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DeviceCategory } from '@/types/database'
import { getCategoryIcon, getCategoryIconFromMap, createCategoriesMap, GENERIC_DEFAULT_ICON } from '@/utils/categoryIcons'

interface UseCategoryIconsResult {
  /** Get the icon for a category by name */
  getIcon: (categoryName: string | null | undefined) => string
  /** Map of category names to DeviceCategory objects */
  categoriesMap: Map<string, DeviceCategory>
  /** Whether categories are being loaded */
  isLoading: boolean
  /** Error if categories failed to load */
  error: Error | null
  /** Refresh categories from the server */
  refresh: () => Promise<void>
}

// Cache for categories to avoid refetching
let categoriesCache: DeviceCategory[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useCategoryIcons(): UseCategoryIconsResult {
  const [categories, setCategories] = useState<DeviceCategory[]>(categoriesCache || [])
  const [isLoading, setIsLoading] = useState(!categoriesCache)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    // Check if cache is still valid
    const now = Date.now()
    if (categoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setCategories(categoriesCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      const fetchedCategories = data.data || []
      
      // Update cache
      categoriesCache = fetchedCategories
      cacheTimestamp = Date.now()
      
      setCategories(fetchedCategories)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      // Keep using cached data if available
      if (categoriesCache) {
        setCategories(categoriesCache)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const categoriesMap = useMemo(() => createCategoriesMap(categories), [categories])

  const getIcon = useCallback((categoryName: string | null | undefined): string => {
    return getCategoryIconFromMap(categoryName, categoriesMap)
  }, [categoriesMap])

  const refresh = useCallback(async () => {
    // Invalidate cache
    categoriesCache = null
    cacheTimestamp = 0
    await fetchCategories()
  }, [fetchCategories])

  return {
    getIcon,
    categoriesMap,
    isLoading,
    error,
    refresh,
  }
}

/**
 * Simple function to get category icon without hook (for non-React contexts)
 * Uses default icons only, no database lookup
 */
export { getCategoryIcon, GENERIC_DEFAULT_ICON }
