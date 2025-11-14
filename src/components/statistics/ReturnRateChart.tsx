'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { ReturnRateChartProps } from '@/types/statistics'

const COLORS = ['#10B981', '#EF4444', '#6B7280']

export const ReturnRateChart = React.memo(function ReturnRateChart({ data, groupBy }: ReturnRateChartProps) {
  const chartData = [
    { name: 'A Tiempo', value: data.onTimeReturns },
    { name: 'Tarde', value: data.lateReturns },
    { name: 'Pendientes', value: data.totalLoans - data.onTimeReturns - data.lateReturns },
  ]

  return (
    <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Tasa de Retorno
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Retorno</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.returnRate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Promedio de Retraso</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.avgDelayDays} días</p>
          </div>
        </div>
      </div>
    </div>
  )
})
