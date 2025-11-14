'use client'

import React, { useState } from 'react'
import type { TimeRangeFilterProps, TimeRange } from '@/types/statistics'

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.type === 'custom')

  const presets: Array<{ label: string; value: TimeRange['type'] }> = [
    { label: 'Hoy', value: 'today' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' },
    { label: 'Trimestre', value: 'quarter' },
    { label: 'Año', value: 'year' },
  ]

  const handlePresetChange = (type: TimeRange['type']) => {
    setShowCustom(false)
    onChange({ type })
  }

  const handleCustomClick = () => {
    setShowCustom(true)
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    onChange({ type: 'custom', start: weekAgo, end: today })
  }

  const handleCustomDateChange = (start: string, end: string) => {
    onChange({ type: 'custom', start, end })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Período de Tiempo
      </label>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                value.type === preset.value && !showCustom
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleCustomClick}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${
              showCustom
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          Personalizado
        </button>
      </div>

      {showCustom && value.type === 'custom' && (
        <div className="flex gap-3 mt-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              Desde
            </label>
            <input
              type="date"
              value={value.start}
              onChange={(e) => handleCustomDateChange(e.target.value, value.end)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              Hasta
            </label>
            <input
              type="date"
              value={value.end}
              onChange={(e) => handleCustomDateChange(value.start, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}
