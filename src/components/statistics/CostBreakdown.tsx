'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CostBreakdownProps } from '@/types/statistics'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export const CostBreakdown = React.memo(function CostBreakdown({ data, chartType }: CostBreakdownProps) {
  return (
    <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Desglose de Costos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cost"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.items} items</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">${item.cost.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
