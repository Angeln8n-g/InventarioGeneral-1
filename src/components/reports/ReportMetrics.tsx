'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ReportMetricsProps, Metric } from '@/types/reports'

export default function ReportMetrics({ metrics, isLoading = false }: ReportMetricsProps) {
  const formatValue = (value: number | string, format?: Metric['format']): string => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'number':
        return value.toLocaleString('es-ES')
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
        }).format(value)
      case 'duration':
        if (value < 1) return `${Math.round(value * 24)} horas`
        return `${Math.round(value)} días`
      default:
        return value.toLocaleString('es-ES')
    }
  }

  const getColorClasses = (color: Metric['color']) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
          text: 'text-blue-900 dark:text-blue-100',
        }
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
          text: 'text-green-900 dark:text-green-100',
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
          text: 'text-yellow-900 dark:text-yellow-100',
        }
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
          text: 'text-red-900 dark:text-red-100',
        }
      case 'gray':
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
          text: 'text-gray-900 dark:text-gray-100',
        }
    }
  }

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'neutral':
        return <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const colors = getColorClasses(metric.color)
        return (
          <div
            key={metric.id}
            className={`${colors.bg} rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </p>
                <p className={`text-3xl font-bold ${colors.text} mb-2`}>
                  {formatValue(metric.value, metric.format)}
                </p>
                {metric.trend && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend.direction)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.trend.value > 0 ? '+' : ''}
                      {metric.trend.value}%
                    </span>
                  </div>
                )}
              </div>
              <div className={`${colors.icon} p-3 rounded-lg`}>{metric.icon}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
