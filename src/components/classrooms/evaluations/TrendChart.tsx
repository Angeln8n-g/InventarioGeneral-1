'use client'

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp } from 'lucide-react'

/**
 * Data point for the trend chart
 * Represents a single evaluation's scores at a point in time
 */
export interface TrendDataPoint {
  /** Date of the evaluation in ISO format */
  date: string
  /** Total score percentage (0-100) */
  total_percentage: number
  /** Organization category percentage (optional) */
  organization_percentage?: number
  /** Cleanliness category percentage (optional) */
  cleanliness_percentage?: number
  /** Maintenance category percentage (optional) */
  maintenance_percentage?: number
}

/**
 * Props for the TrendChart component
 */
export interface TrendChartProps {
  /** Array of data points to display */
  data: TrendDataPoint[]
  /** Height of the chart in pixels (default: 300) */
  height?: number
  /** Whether to show category lines (default: false) */
  showCategories?: boolean
}

// Category configuration for lines
const CATEGORY_CONFIG = {
  total: {
    key: 'total_percentage',
    name: 'Puntuación Total',
    color: '#dc2626', // claro-red
    strokeWidth: 3
  },
  organization: {
    key: 'organization_percentage',
    name: 'Organización',
    color: '#3b82f6', // blue-500
    strokeWidth: 2
  },
  cleanliness: {
    key: 'cleanliness_percentage',
    name: 'Limpieza',
    color: '#10b981', // emerald-500
    strokeWidth: 2
  },
  maintenance: {
    key: 'maintenance_percentage',
    name: 'Mantenimiento',
    color: '#f59e0b', // amber-500
    strokeWidth: 2
  }
} as const

// Score threshold colors for reference lines
const SCORE_THRESHOLDS = {
  excellent: { value: 90, color: '#22c55e', label: 'Excelente' },
  acceptable: { value: 70, color: '#eab308', label: 'Aceptable' }
}

/**
 * Formats a date string for display on the X axis
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formats a date string for the tooltip
 */
function formatDateFull(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Custom tooltip component for the chart
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length || !label) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {formatDateFull(label)}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * TrendChart Component
 * 
 * Displays a line chart showing the trend of evaluation scores over time.
 * 
 * Features:
 * - Line chart using Recharts library
 * - Main line for total score percentage
 * - Optional lines for category scores (organization, cleanliness, maintenance)
 * - Interactive tooltips showing date and score values
 * - Responsive design that adapts to container width
 * - Dark/light theme support
 * - Reference lines for score thresholds (70% acceptable, 90% excellent)
 * 
 * @example
 * // Basic usage with total score only
 * <TrendChart
 *   data={[
 *     { date: '2024-01-15', total_percentage: 85 },
 *     { date: '2024-02-15', total_percentage: 78 },
 *     { date: '2024-03-15', total_percentage: 92 }
 *   ]}
 * />
 * 
 * @example
 * // With category breakdown
 * <TrendChart
 *   data={[
 *     {
 *       date: '2024-01-15',
 *       total_percentage: 85,
 *       organization_percentage: 90,
 *       cleanliness_percentage: 80,
 *       maintenance_percentage: 85
 *     }
 *   ]}
 *   showCategories
 *   height={400}
 * />
 * 
 * @validates Requirements 5.4 - Show trend chart of scores over time when multiple evaluations exist
 */
export function TrendChart({
  data,
  height = 300,
  showCategories = false
}: TrendChartProps) {
  // Sort data by date ascending for proper line rendering
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [data])

  // Check if we have category data
  const hasCategoryData = useMemo(() => {
    return sortedData.some(point => 
      point.organization_percentage !== undefined ||
      point.cleanliness_percentage !== undefined ||
      point.maintenance_percentage !== undefined
    )
  }, [sortedData])

  // Determine if we should show categories
  const displayCategories = showCategories && hasCategoryData

  // Empty state
  if (data.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ height }}
      >
        <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay datos suficientes para mostrar tendencia
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Se requieren al menos 2 evaluaciones
        </p>
      </div>
    )
  }

  // Single data point state
  if (data.length === 1) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ height }}
      >
        <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Solo hay una evaluación registrada
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Se necesitan más evaluaciones para ver la tendencia
        </p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sortedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          {/* Grid */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* X Axis - Dates */}
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            className="text-gray-500 dark:text-gray-400"
            tickLine={{ stroke: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
          />
          
          {/* Y Axis - Percentage */}
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            className="text-gray-500 dark:text-gray-400"
            tickLine={{ stroke: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            width={50}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Legend */}
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {value}
              </span>
            )}
          />
          
          {/* Reference lines for thresholds */}
          {/* Excellent threshold (90%) */}
          <Line
            type="monotone"
            dataKey={() => SCORE_THRESHOLDS.excellent.value}
            stroke={SCORE_THRESHOLDS.excellent.color}
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={false}
            name={`${SCORE_THRESHOLDS.excellent.label} (${SCORE_THRESHOLDS.excellent.value}%)`}
            legendType="none"
          />
          
          {/* Acceptable threshold (70%) */}
          <Line
            type="monotone"
            dataKey={() => SCORE_THRESHOLDS.acceptable.value}
            stroke={SCORE_THRESHOLDS.acceptable.color}
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={false}
            name={`${SCORE_THRESHOLDS.acceptable.label} (${SCORE_THRESHOLDS.acceptable.value}%)`}
            legendType="none"
          />
          
          {/* Main total score line */}
          <Line
            type="monotone"
            dataKey={CATEGORY_CONFIG.total.key}
            name={CATEGORY_CONFIG.total.name}
            stroke={CATEGORY_CONFIG.total.color}
            strokeWidth={CATEGORY_CONFIG.total.strokeWidth}
            dot={{ fill: CATEGORY_CONFIG.total.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            connectNulls
          />
          
          {/* Category lines (optional) */}
          {displayCategories && (
            <>
              <Line
                type="monotone"
                dataKey={CATEGORY_CONFIG.organization.key}
                name={CATEGORY_CONFIG.organization.name}
                stroke={CATEGORY_CONFIG.organization.color}
                strokeWidth={CATEGORY_CONFIG.organization.strokeWidth}
                dot={{ fill: CATEGORY_CONFIG.organization.color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey={CATEGORY_CONFIG.cleanliness.key}
                name={CATEGORY_CONFIG.cleanliness.name}
                stroke={CATEGORY_CONFIG.cleanliness.color}
                strokeWidth={CATEGORY_CONFIG.cleanliness.strokeWidth}
                dot={{ fill: CATEGORY_CONFIG.cleanliness.color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey={CATEGORY_CONFIG.maintenance.key}
                name={CATEGORY_CONFIG.maintenance.name}
                stroke={CATEGORY_CONFIG.maintenance.color}
                strokeWidth={CATEGORY_CONFIG.maintenance.strokeWidth}
                dot={{ fill: CATEGORY_CONFIG.maintenance.color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2 }}
                connectNulls
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * TrendChartWithHeader Component
 * 
 * A wrapper component that includes a header with title and optional toggle for categories.
 */
export interface TrendChartWithHeaderProps extends TrendChartProps {
  /** Title to display above the chart */
  title?: string
  /** Whether to show the category toggle button */
  showCategoryToggle?: boolean
}

export function TrendChartWithHeader({
  title = 'Tendencia de Puntuaciones',
  showCategoryToggle = true,
  showCategories: initialShowCategories = false,
  ...chartProps
}: TrendChartWithHeaderProps) {
  const [showCategories, setShowCategories] = React.useState(initialShowCategories)

  // Check if category data exists
  const hasCategoryData = chartProps.data.some(point => 
    point.organization_percentage !== undefined ||
    point.cleanliness_percentage !== undefined ||
    point.maintenance_percentage !== undefined
  )

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-claro-red" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        
        {showCategoryToggle && hasCategoryData && (
          <button
            onClick={() => setShowCategories(!showCategories)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showCategories
                ? 'bg-claro-red text-white hover:bg-red-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showCategories ? 'Ocultar Categorías' : 'Mostrar Categorías'}
          </button>
        )}
      </div>

      {/* Chart */}
      <TrendChart {...chartProps} showCategories={showCategories} />

      {/* Legend explanation */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }} />
            <span>≥90% Excelente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-yellow-500" style={{ borderStyle: 'dashed' }} />
            <span>≥70% Aceptable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-red-500" />
            <span>&lt;70% Requiere Atención</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendChart
