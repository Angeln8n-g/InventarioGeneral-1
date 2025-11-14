'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { UsageChartProps } from '@/types/statistics'

export const UsageChart = React.memo(function UsageChart({ data, type }: UsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Uso de Herramientas y Electrónicos
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
        Uso de Herramientas y Electrónicos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" />
          <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={150} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="totalLoans" fill="#3B82F6" name="Total Préstamos" />
          <Bar dataKey="activeLoans" fill="#10B981" name="Préstamos Activos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
