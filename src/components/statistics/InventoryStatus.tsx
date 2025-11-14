'use client'

import React, { useEffect } from 'react'
import type { InventoryStatusProps } from '@/types/statistics'

const statusColors = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  low: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  normal: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  high: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
}

export function InventoryStatus({ items, autoRefresh = true, refreshInterval = 30000 }: InventoryStatusProps) {
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      // Trigger refetch - would be handled by parent component
    }, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  if (!items || items.length === 0) {
    return (
      <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Estado de Inventario
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Estado de Inventario
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Artículo
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Stock Actual
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Mínimo
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Estado
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Días Restantes
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {item.name}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {item.currentStock} {item.unitOfMeasure}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.minimumThreshold}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[item.status]}`}>
                    {item.status === 'critical' && 'Crítico'}
                    {item.status === 'low' && 'Bajo'}
                    {item.status === 'normal' && 'Normal'}
                    {item.status === 'high' && 'Alto'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.daysUntilEmpty ? `${item.daysUntilEmpty} días` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
