'use client'

import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { UnifiedChartProps } from '@/types/unified-dashboard'

// Theme-aware color palettes
const lightColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#f97316', // orange
  '#14b8a6', // teal
  '#ec4899', // pink
]

const darkColors = [
  '#60a5fa', // blue
  '#34d399', // green
  '#fbbf24', // yellow
  '#f87171', // red
  '#a78bfa', // purple
  '#fb923c', // orange
  '#2dd4bf', // teal
  '#f472b6', // pink
]

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <svg
        className="w-12 h-12 text-gray-300 dark:text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </div>
  )
}

export function UnifiedChart({
  type,
  data,
  title,
  loading = false,
  height = 300,
}: UnifiedChartProps) {
  const isDarkMode =
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false

  const colors = isDarkMode ? darkColors : lightColors

  // Transform Chart.js labels + datasets structure into Recharts row-based structure
  const rechartsData = useMemo(() => {
    if (!data || !data.labels) return []
    return data.labels.map((label, index) => {
      const row: Record<string, string | number> = { name: label }
      data.datasets.forEach((dataset) => {
        row[dataset.label] = dataset.data[index] ?? 0
      })
      return row
    })
  }, [data])

  // Transform for Pie/Doughnut charts
  const pieData = useMemo(() => {
    if (!data || !data.labels || !data.datasets[0]) return []
    const firstDataset = data.datasets[0]
    return data.labels.map((label, index) => ({
      name: label,
      value: firstDataset.data[index] ?? 0,
    }))
  }, [data])

  const renderChart = () => {
    if (!rechartsData.length) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-gray-500">
          No hay datos disponibles
        </div>
      )
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rechartsData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} tick={{ fontSize: 12 }} />
              <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  borderRadius: '0.5rem',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
              {data.datasets.map((dataset, idx) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rechartsData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} tick={{ fontSize: 12 }} />
              <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  borderRadius: '0.5rem',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
              {data.datasets.map((dataset, idx) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={type === 'doughnut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={type === 'doughnut' ? 4 : 0}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  borderRadius: '0.5rem',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {loading ? <ChartSkeleton height={height} /> : <div style={{ height }}>{renderChart()}</div>}
    </div>
  )
}
