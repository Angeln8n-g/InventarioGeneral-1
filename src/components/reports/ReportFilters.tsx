'use client'

import { useState } from 'react'
import { X, Calendar, Filter } from 'lucide-react'
import { ReportFiltersProps, FilterConfig } from '@/types/reports'

export default function ReportFilters({
  filters,
  onFiltersChange,
  availableFilters,
  isLoading = false,
}: ReportFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleFilterChange = (name: string, value: unknown) => {
    onFiltersChange({
      ...filters,
      [name]: value,
    })
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const currentRange = filters.dateRange || { start: '', end: '' }
    onFiltersChange({
      ...filters,
      dateRange: {
        ...currentRange,
        [field]: value,
      },
    })
  }

  const removeFilter = (name: string) => {
    const newFilters = { ...filters }
    delete newFilters[name]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.dateRange?.start || filters.dateRange?.end) count++
    Object.keys(filters).forEach((key) => {
      if (key !== 'dateRange' && filters[key]) count++
    })
    return count
  }

  const validateDateRange = () => {
    if (filters.dateRange?.start && filters.dateRange?.end) {
      const start = new Date(filters.dateRange.start)
      const end = new Date(filters.dateRange.end)
      if (start > end) {
        return 'La fecha de inicio debe ser anterior a la fecha de fin'
      }
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 365) {
        return 'El rango de fechas no puede exceder 1 año'
      }
    }
    return null
  }

  const dateRangeError = validateDateRange()
  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              disabled={isLoading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
            >
              Limpiar todo
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableFilters.map((filterConfig) => (
              <div key={filterConfig.name}>
                {filterConfig.type === 'date-range' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {filterConfig.label}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="date"
                          value={filters.dateRange?.start || ''}
                          onChange={(e) => handleDateRangeChange('start', e.target.value)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                          placeholder="Inicio"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="date"
                          value={filters.dateRange?.end || ''}
                          onChange={(e) => handleDateRangeChange('end', e.target.value)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                          placeholder="Fin"
                        />
                      </div>
                    </div>
                    {dateRangeError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{dateRangeError}</p>
                    )}
                  </div>
                )}

                {filterConfig.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {filterConfig.label}
                    </label>
                    <select
                      value={(filters[filterConfig.name] as string) || ''}
                      onChange={(e) => handleFilterChange(filterConfig.name, e.target.value || undefined)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    >
                      <option value="">{filterConfig.placeholder || 'Todos'}</option>
                      {filterConfig.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterConfig.type === 'search' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {filterConfig.label}
                    </label>
                    <input
                      type="text"
                      value={(filters[filterConfig.name] as string) || ''}
                      onChange={(e) => handleFilterChange(filterConfig.name, e.target.value || undefined)}
                      disabled={isLoading}
                      placeholder={filterConfig.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {filters.dateRange?.start && filters.dateRange?.end && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(filters.dateRange.start).toLocaleDateString()} -{' '}
                      {new Date(filters.dateRange.end).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => removeFilter('dateRange')}
                      disabled={isLoading}
                      className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {Object.entries(filters).map(([key, value]) => {
                  if (key === 'dateRange' || !value) return null
                  const filterConfig = availableFilters.find((f) => f.name === key)
                  if (!filterConfig) return null

                  let displayValue = value as string
                  if (filterConfig.type === 'select' && filterConfig.options) {
                    const option = filterConfig.options.find((o) => o.value === value)
                    displayValue = option?.label || (value as string)
                  }

                  return (
                    <div
                      key={key}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      <span>
                        {filterConfig.label}: {displayValue}
                      </span>
                      <button
                        onClick={() => removeFilter(key)}
                        disabled={isLoading}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
