'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ConsumptionChartProps } from '@/types/statistics'

export const ConsumptionChart = React.memo(function ConsumptionChart({ data, timeRange, groupBy }: ConsumptionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Consumo de Materiales
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  // Transform data for recharts
  const chartData = data.map((item) => ({
    name: item.period,
    total: item.total,
    ...item.consumables,
  }))

  return (
    <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Consumo de Materiales
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="total" fill="#3B82F6" name="Total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
