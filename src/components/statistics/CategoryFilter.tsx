'use client'

import React from 'react'
import type { CategoryFilterProps } from '@/types/statistics'

export function CategoryFilter({ value, onChange, options }: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Categoría
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">Todas las categorías</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
