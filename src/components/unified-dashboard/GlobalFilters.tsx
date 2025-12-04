'use client'

import React, { useState, useCallback } from 'react'
import type { GlobalFiltersProps, DateRange } from '@/types/unified-dashboard'

const dateRangePresets: Array<{ label: string; value: DateRange['type'] }> = [
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Año', value: 'year' },
]

export function GlobalFilters({ value, onChange, categories }: GlobalFiltersProps) {
  const [showCustomDates, setShowCustomDates] = useState(value.dateRange.type === 'custom')

  const handleDateRangeTypeChange = useCallback((type: DateRange['type']) => {
    if (type === 'custom') {
      setShowCustomDates(true)
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      onChange({
        ...value,
        dateRange: {
          type: 'custom',
          start: value.dateRange.start || weekAgo,
          end: value.dateRange.end || today,
        },
      })
    } else {
      setShowCustomDates(false)
      onChange({
        ...value,
        dateRange: { type },
      })
    }
  }, [value, onChange])

  const handleCustomDateChange = useCallback((start: string, end: string) => {
    onChange({
      ...value,
      dateRange: { type: 'custom', start, end },
    })
  }, [value, onChange])

  const handleCategoryChange = useCallback((category: string) => {
    onChange({
      ...value,
      category: category || undefined,
    })
  }, [value, onChange])

  const handleClearFilters = useCallback(() => {
    setShowCustomDates(false)
    onChange({
      dateRange: { type: 'month' },
      category: undefined,
    })
  }, [onChange])

  const hasActiveFilters = value.category || value.dateRange.type !== 'month'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* Date Range Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Período de Tiempo
          </label>
          <div className="flex flex-wrap gap-2">
            {dateRangePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleDateRangeTypeChange(preset.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    value.dateRange.type === preset.value && !showCustomDates
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => handleDateRangeTypeChange('custom')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  showCustomDates
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              Personalizado
            </button>
          </div>

          {/* Custom Date Inputs */}
          {showCustomDates && value.dateRange.type === 'custom' && (
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Desde
                </label>
                <input
                  type="date"
                  value={value.dateRange.start || ''}
                  onChange={(e) => handleCustomDateChange(e.target.value, value.dateRange.end || '')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Hasta
                </label>
                <input
                  type="date"
                  value={value.dateRange.end || ''}
                  onChange={(e) => handleCustomDateChange(value.dateRange.start || '', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="lg:w-64">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <select
              value={value.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
