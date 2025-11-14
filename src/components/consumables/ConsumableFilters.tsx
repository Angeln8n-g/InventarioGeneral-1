// Phase 2, Task 4: ConsumableFilters component

import React from 'react'
import { ConsumableFilters as Filters } from '@/types/consumables'

interface ConsumableFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  categories: string[]
  resultCount?: number
  totalCount?: number
}

export const ConsumableFilters: React.FC<ConsumableFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  resultCount,
  totalCount,
}) => {
  const hasActiveFilters = filters.search || filters.category || filters.lowStockOnly

  const handleClearAll = () => {
    onFiltersChange({
      search: '',
      category: '',
      lowStockOnly: false,
    })
  }

  const handleRemoveFilter = (filterKey: keyof Filters) => {
    onFiltersChange({
      ...filters,
      [filterKey]: filterKey === 'lowStockOnly' ? false : '',
    })
  }

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search consumables..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pl-10 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.lowStockOnly}
              onChange={(e) => onFiltersChange({ ...filters, lowStockOnly: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-claro-red focus:ring-claro-red"
            />
            <span className="text-sm text-text-light dark:text-text-dark">Low stock only</span>
          </label>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  Search: "{filters.search}"
                  <button
                    onClick={() => handleRemoveFilter('search')}
                    className="ml-2 hover:text-blue-700 dark:hover:text-blue-300"
                    aria-label="Remove search filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                  Category: {filters.category}
                  <button
                    onClick={() => handleRemoveFilter('category')}
                    className="ml-2 hover:text-purple-700 dark:hover:text-purple-300"
                    aria-label="Remove category filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.lowStockOnly && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-claro-warning">
                  Low Stock Only
                  <button
                    onClick={() => handleRemoveFilter('lowStockOnly')}
                    className="ml-2 hover:text-yellow-700 dark:hover:text-yellow-300"
                    aria-label="Remove low stock filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={handleClearAll}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Result Counter */}
      {resultCount !== undefined && totalCount !== undefined && (
        <div className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Showing {resultCount} of {totalCount} items
        </div>
      )}
    </div>
  )
}
