// Phase 3, Task 11: useConsumableFilters hook

import { useState, useMemo } from 'react'
import { ConsumableFilters, ConsumableItem, ConsumableStockAdmin } from '@/types/consumables'

export function useConsumableFilters<T extends ConsumableItem | ConsumableStockAdmin>(items: T[]) {
  const [filters, setFilters] = useState<ConsumableFilters>({
    search: '',
    category: '',
    lowStockOnly: false,
  })

  const updateFilter = <K extends keyof ConsumableFilters>(key: K, value: ConsumableFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      lowStockOnly: false,
    })
  }

  // Extract unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    items.forEach(item => {
      const category = 'item_type' in item ? item.item_type.category : item.category
      if (category) {
        categorySet.add(category)
      }
    })
    return Array.from(categorySet).sort()
  }, [items])

  // Apply filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Extract properties based on item type
      const isAdminItem = 'item_type' in item
      const name = isAdminItem ? item.item_type.name : item.name
      const description = isAdminItem ? item.item_type.description : item.description
      const category = isAdminItem ? item.item_type.category : item.category
      const isLowStock = isAdminItem ? item.is_low_stock : item.stock?.is_low_stock

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = name.toLowerCase().includes(searchLower)
        const matchesDescription = description?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesDescription) return false
      }

      // Category filter
      if (filters.category && category !== filters.category) {
        return false
      }

      // Low stock filter
      if (filters.lowStockOnly && !isLowStock) {
        return false
      }

      return true
    })
  }, [items, filters])

  const hasActiveFilters = !!(filters.search || filters.category || filters.lowStockOnly)

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    filteredItems,
    categories,
    hasActiveFilters,
  }
}
