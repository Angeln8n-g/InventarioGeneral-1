'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ReportChartsProps } from '@/types/reports'

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
]

export default function ReportCharts({ charts, data, isLoading = false }: ReportChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
            <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    )
  }

  const renderChart = (chart: (typeof charts)[0]) => {
    const chartData = (data[chart.dataKey] || []) as Record<string, unknown>[]
    const colors = chart.colors || DEFAULT_COLORS
    const height = chart.height || 300

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey={chart.xAxisKey || 'date'}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#374151' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={chart.yAxisKey || 'count'}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0], r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey={chart.xAxisKey || 'name'}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Bar dataKey={chart.yAxisKey || 'value'} fill={colors[0]} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis type="number" className="text-xs text-gray-600 dark:text-gray-400" />
              <YAxis
                type="category"
                dataKey={chart.yAxisKey || 'name'}
                className="text-xs text-gray-600 dark:text-gray-400"
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Bar dataKey={chart.xAxisKey || 'value'} fill={colors[0]} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={chart.yAxisKey || 'value'}
                nameKey={chart.xAxisKey || 'name'}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.name}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey={chart.xAxisKey || 'date'}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={chart.yAxisKey || 'value'}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'stacked-bar':
        // For stacked bar, we need to dynamically get all keys except the x-axis key
        const stackKeys = chartData.length > 0 && chartData[0] ? Object.keys(chartData[0] as Record<string, unknown>).filter((key) => key !== (chart.xAxisKey || 'date')) : []
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey={chart.xAxisKey || 'date'}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              {stackKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={colors[index % colors.length]}
                  radius={index === stackKeys.length - 1 ? [8, 8, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-gray-500">Tipo de gráfico no soportado</div>
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart) => (
        <div
          key={chart.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {chart.title}
          </h3>
          {data[chart.dataKey] && data[chart.dataKey].length > 0 ? (
            renderChart(chart)
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
