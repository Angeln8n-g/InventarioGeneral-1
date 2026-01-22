'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Users,
  Building2,
  BarChart3,
  Filter,
  Download,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ChevronDown,
  FileSpreadsheet,
  FileIcon
} from 'lucide-react'
import { ScoreDisplayCompact } from './ScoreDisplay'
import { TrendChart } from './TrendChart'
import type { ResponsiblePerformance, SpacePerformance, TrendDirection } from '@/types/evaluations'

// ============================================================================
// Types
// ============================================================================

/**
 * Report type options
 */
type ReportType = 'responsible' | 'space' | 'general'

/**
 * Export format options
 */
type ExportFormat = 'pdf' | 'excel'

/**
 * Global metrics from general report
 */
interface GlobalMetrics {
  total_evaluations: number
  overall_average_score: number
  total_spaces_evaluated: number
  total_responsible_persons: number
  evaluations_by_status: {
    pending: number
    completed: number
    overdue: number
    cancelled: number
  }
  average_by_category: {
    organization: number
    cleanliness: number
    maintenance: number
  }
  score_distribution: {
    excellent: number
    acceptable: number
    requires_attention: number
  }
}

/**
 * API response types
 */
interface ResponsibleReportResponse {
  data: ResponsiblePerformance[]
  total: number
  low_performers: ResponsiblePerformance[]
  filters: {
    start_date: string | null
    end_date: string | null
  }
  generated_at: string
}

interface SpaceReportResponse {
  data: SpacePerformance[]
  total: number
  filters: {
    start_date: string | null
    end_date: string | null
  }
  generated_at: string
}

interface GeneralReportResponse {
  global_metrics: GlobalMetrics
  responsible_ranking: ResponsiblePerformance[]
  best_performing_spaces: SpacePerformance[]
  worst_performing_spaces: SpacePerformance[]
  low_performers: ResponsiblePerformance[]
  filters: {
    start_date: string | null
    end_date: string | null
  }
  generated_at: string
}

/**
 * Props for the EvaluationReports component
 */
export interface EvaluationReportsProps {
  /** JWT token for API authentication */
  token: string | null
}

// ============================================================================
// Constants
// ============================================================================

const REPORT_TYPES: Array<{ value: ReportType; label: string; icon: React.ElementType; description: string }> = [
  {
    value: 'responsible',
    label: 'Por Responsable',
    icon: Users,
    description: 'Desempeño de cada responsable'
  },
  {
    value: 'space',
    label: 'Por Espacio',
    icon: Building2,
    description: 'Desempeño de cada espacio'
  },
  {
    value: 'general',
    label: 'General',
    icon: BarChart3,
    description: 'Métricas globales y rankings'
  }
]

const CATEGORY_LABELS = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Renders trend indicator icon
 */
function TrendIndicator({ trend }: { trend: TrendDirection }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />
    default:
      return <Minus className="w-4 h-4 text-gray-400" />
  }
}

/**
 * Formats a date string to a localized format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Gets score classification style
 */
function getScoreStyle(score: number): string {
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Report Type Selector Component
 * Validates: Requirement 6.1 - Show report type options
 */
interface ReportTypeSelectorProps {
  selectedType: ReportType
  onTypeChange: (type: ReportType) => void
}

function ReportTypeSelector({ selectedType, onTypeChange }: ReportTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {REPORT_TYPES.map(({ value, label, icon: Icon, description }) => (
        <button
          key={value}
          onClick={() => onTypeChange(value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            selectedType === value
              ? 'bg-claro-red text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title={description}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Date Range Filter Component
 * Validates: Requirement 6.5 - Support date range filtering
 */
interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onClear: () => void
  showFilters: boolean
  onToggleFilters: () => void
}

function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  showFilters,
  onToggleFilters
}: DateRangeFilterProps) {
  const hasActiveFilters = startDate || endDate

  return (
    <div>
      <button
        onClick={onToggleFilters}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
          hasActiveFilters
            ? 'bg-claro-red text-white hover:bg-red-700'
            : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filtros
        {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full" />}
        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                max={endDate || undefined}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                min={startDate || undefined}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={onClear}
                disabled={!hasActiveFilters}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Export Button Component
 * Validates: Requirement 6.6 - Export reports to PDF or Excel
 */
interface ExportButtonProps {
  onExport: (format: ExportFormat) => void
  isExporting: boolean
  disabled: boolean
}

function ExportButton({ onExport, isExporting, disabled }: ExportButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">Exportar</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && !disabled && !isExporting && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <button
              onClick={() => {
                onExport('pdf')
                setShowDropdown(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
            >
              <FileIcon className="w-4 h-4 text-red-500" />
              Exportar a PDF
            </button>
            <button
              onClick={() => {
                onExport('excel')
                setShowDropdown(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              Exportar a Excel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Responsible Report Component
 * Validates: Requirement 6.2 - Report by responsible shows name, spaces, average score, trend, evaluation count
 */
interface ResponsibleReportProps {
  data: ResponsiblePerformance[]
  lowPerformers: ResponsiblePerformance[]
}

function ResponsibleReport({ data, lowPerformers }: ResponsibleReportProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Sin datos de responsables
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          No hay responsables con evaluaciones en el período seleccionado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Low performers warning */}
      {lowPerformers.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Responsables con bajo desempeño ({lowPerformers.length})
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                Los siguientes responsables tienen un promedio menor al 70%:
                {' '}{lowPerformers.map(p => p.responsible_person).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Responsible table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Responsable
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Espacios
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Promedio
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Tendencia
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Evaluaciones
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm hidden lg:table-cell">
                Última Evaluación
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const isLowPerformer = item.total_evaluations > 0 && item.average_score < 70
              
              return (
                <tr
                  key={item.responsible_person}
                  className={`border-b border-gray-100 dark:border-gray-800 ${
                    isLowPerformer ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.responsible_person}
                      </span>
                      {isLowPerformer && (
                        <span title="Bajo desempeño">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {item.classrooms.length} espacio{item.classrooms.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]" title={item.classrooms.map(c => c.name).join(', ')}>
                      {item.classrooms.map(c => c.name).join(', ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.total_evaluations > 0 ? (
                      <span className={`text-sm font-semibold ${getScoreStyle(item.average_score)}`}>
                        {item.average_score.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <TrendIndicator trend={item.trend} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.total_evaluations}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center hidden lg:table-cell">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.last_evaluation_date ? formatDate(item.last_evaluation_date) : '-'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Space Report Component
 * Validates: Requirement 6.3 - Report by space shows name, responsible, last score, average, trend
 */
interface SpaceReportProps {
  data: SpacePerformance[]
}

function SpaceReport({ data }: SpaceReportProps) {
  const [selectedSpace, setSelectedSpace] = useState<SpacePerformance | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Sin datos de espacios
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          No hay espacios con evaluaciones en el período seleccionado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Space table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Espacio
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Responsable
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Última Puntuación
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Promedio
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Tendencia
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
                Evaluaciones
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.classroom_id}
                onClick={() => setSelectedSpace(selectedSpace?.classroom_id === item.classroom_id ? null : item)}
                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                  selectedSpace?.classroom_id === item.classroom_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.classroom_name}
                      </span>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {item.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.responsible_person || '-'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {item.total_evaluations > 0 ? (
                    <ScoreDisplayCompact
                      totalScore={Math.round(item.last_score)}
                      maxScore={100}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {item.total_evaluations > 0 ? (
                    <span className={`text-sm font-semibold ${getScoreStyle(item.average_score)}`}>
                      {item.average_score.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center">
                    <TrendIndicator trend={item.trend} />
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.total_evaluations}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected space trend chart */}
      {selectedSpace && selectedSpace.history.length > 1 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Tendencia: {selectedSpace.classroom_name}
            </h4>
            <button
              onClick={() => setSelectedSpace(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <TrendChart
            data={selectedSpace.history.map(h => ({
              date: h.date,
              total_percentage: h.score
            }))}
            height={200}
          />
        </div>
      )}
    </div>
  )
}

/**
 * General Report Component
 * Validates: Requirement 6.4 - General report shows ranking, best/worst performers, global metrics
 */
interface GeneralReportProps {
  globalMetrics: GlobalMetrics
  responsibleRanking: ResponsiblePerformance[]
  bestPerformingSpaces: SpacePerformance[]
  worstPerformingSpaces: SpacePerformance[]
  lowPerformers: ResponsiblePerformance[]
}

function GeneralReport({
  globalMetrics,
  responsibleRanking,
  bestPerformingSpaces,
  worstPerformingSpaces,
  lowPerformers
}: GeneralReportProps) {
  return (
    <div className="space-y-6">
      {/* Global Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Evaluaciones"
          value={globalMetrics.total_evaluations}
          icon={FileText}
        />
        <MetricCard
          label="Promedio General"
          value={`${globalMetrics.overall_average_score.toFixed(1)}%`}
          icon={BarChart3}
          valueClassName={getScoreStyle(globalMetrics.overall_average_score)}
        />
        <MetricCard
          label="Espacios Evaluados"
          value={globalMetrics.total_spaces_evaluated}
          icon={Building2}
        />
        <MetricCard
          label="Responsables"
          value={globalMetrics.total_responsible_persons}
          icon={Users}
        />
      </div>

      {/* Score Distribution */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
          Distribución de Puntuaciones
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {globalMetrics.score_distribution.excellent}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Excelente (≥90%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {globalMetrics.score_distribution.acceptable}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Aceptable (70-89%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {globalMetrics.score_distribution.requires_attention}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Requiere Atención (&lt;70%)</div>
          </div>
        </div>
      </div>

      {/* Category Averages */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
          Promedio por Categoría
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const score = globalMetrics.average_by_category[key as keyof typeof globalMetrics.average_by_category]
            return (
              <div key={key} className="text-center">
                <div className={`text-2xl font-bold ${getScoreStyle(score)}`}>
                  {score.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Low Performers Warning */}
      {lowPerformers.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Responsables con bajo desempeño ({lowPerformers.length})
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {lowPerformers.map(p => `${p.responsible_person} (${p.average_score.toFixed(1)}%)`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Best and Worst Performing Spaces */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Best Performing */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Mejores Espacios
          </h4>
          {bestPerformingSpaces.length > 0 ? (
            <div className="space-y-2">
              {bestPerformingSpaces.map((space, index) => (
                <div key={space.classroom_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">#{index + 1}</span>
                    <span className="text-sm text-green-800 dark:text-green-200">{space.classroom_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {space.average_score.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-600 dark:text-green-400">Sin datos disponibles</p>
          )}
        </div>

        {/* Worst Performing */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Espacios que Requieren Atención
          </h4>
          {worstPerformingSpaces.length > 0 ? (
            <div className="space-y-2">
              {worstPerformingSpaces.map((space, index) => (
                <div key={space.classroom_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">#{index + 1}</span>
                    <span className="text-sm text-red-800 dark:text-red-200">{space.classroom_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {space.average_score.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400">Sin datos disponibles</p>
          )}
        </div>
      </div>

      {/* Responsible Ranking */}
      {responsibleRanking.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Ranking de Responsables
          </h4>
          <div className="space-y-2">
            {responsibleRanking.slice(0, 10).map((item, index) => (
              <div key={item.responsible_person} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${index < 3 ? 'text-claro-red' : 'text-gray-400'}`}>
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {item.responsible_person}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendIndicator trend={item.trend} />
                  <span className={`text-sm font-semibold ${getScoreStyle(item.average_score)}`}>
                    {item.average_score.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  valueClassName?: string
}

function MetricCard({ label, value, icon: Icon, valueClassName = '' }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${valueClassName}`}>
        {value}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * EvaluationReports Component
 * 
 * Displays performance reports for the evaluation system with multiple report types,
 * date range filtering, and export functionality.
 * 
 * Features:
 * - Report type selector (responsible, space, general)
 * - Date range filters
 * - Report-specific content components
 * - Export button with format selection (PDF/Excel)
 * - Loading, error, and empty states
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 * - 6.1: Show report type options (responsible, space, general)
 * - 6.2: Report by responsible shows name, spaces, average score, trend, evaluation count
 * - 6.3: Report by space shows name, responsible, last score, average, trend
 * - 6.4: General report shows ranking, best/worst performers, global metrics
 * - 6.5: Support date range filtering for reports
 * - 6.6: Export reports to PDF or Excel
 */
export function EvaluationReports({ token }: EvaluationReportsProps) {
  // Report type state
  const [reportType, setReportType] = useState<ReportType>('general')

  // Filter state
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Data state
  const [responsibleData, setResponsibleData] = useState<ResponsibleReportResponse | null>(null)
  const [spaceData, setSpaceData] = useState<SpaceReportResponse | null>(null)
  const [generalData, setGeneralData] = useState<GeneralReportResponse | null>(null)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  /**
   * Fetches report data from the API
   */
  const fetchReport = useCallback(async () => {
    if (!token) {
      setError('No hay sesión activa')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build query params for date filters
      const params = new URLSearchParams()
      if (startDate) {
        params.append('start_date', new Date(startDate).toISOString())
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        params.append('end_date', endDateTime.toISOString())
      }

      const queryString = params.toString()
      const baseUrl = `/api/admin/evaluations/reports/${reportType}`
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Error al cargar el reporte')
      }

      const data = await res.json()

      // Store data based on report type
      switch (reportType) {
        case 'responsible':
          setResponsibleData(data)
          break
        case 'space':
          setSpaceData(data)
          break
        case 'general':
          setGeneralData(data)
          break
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte')
    } finally {
      setIsLoading(false)
    }
  }, [token, reportType, startDate, endDate])

  // Fetch report on mount and when dependencies change
  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  /**
   * Handles export functionality
   * Validates: Requirement 6.6 - Export reports to PDF or Excel
   */
  const handleExport = async (format: ExportFormat) => {
    if (!token) return

    setIsExporting(true)

    try {
      const params = new URLSearchParams()
      params.append('format', format)
      params.append('report_type', reportType)
      if (startDate) {
        params.append('start_date', new Date(startDate).toISOString())
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        params.append('end_date', endDateTime.toISOString())
      }

      const res = await fetch(`/api/admin/evaluations/reports/export?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Error al exportar el reporte')
      }

      // Get the blob and download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-${reportType}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting report:', err)
      setError(err instanceof Error ? err.message : 'Error al exportar el reporte')
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Handles clearing all filters
   */
  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  /**
   * Renders the loading state
   */
  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando reporte...</span>
    </div>
  )

  /**
   * Renders the error state
   */
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
      <button
        onClick={() => {
          setError(null)
          fetchReport()
        }}
        className="flex items-center gap-2 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  )

  /**
   * Renders the report content based on type
   */
  const renderReportContent = () => {
    switch (reportType) {
      case 'responsible':
        return responsibleData ? (
          <ResponsibleReport
            data={responsibleData.data}
            lowPerformers={responsibleData.low_performers}
          />
        ) : null

      case 'space':
        return spaceData ? (
          <SpaceReport data={spaceData.data} />
        ) : null

      case 'general':
        return generalData ? (
          <GeneralReport
            globalMetrics={generalData.global_metrics}
            responsibleRanking={generalData.responsible_ranking}
            bestPerformingSpaces={generalData.best_performing_spaces}
            worstPerformingSpaces={generalData.worst_performing_spaces}
            lowPerformers={generalData.low_performers}
          />
        ) : null

      default:
        return null
    }
  }

  // Get generated timestamp
  const generatedAt = reportType === 'responsible' 
    ? responsibleData?.generated_at 
    : reportType === 'space' 
      ? spaceData?.generated_at 
      : generalData?.generated_at

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-claro-red" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reportes de Desempeño
              </h2>
              {generatedAt && !isLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Generado: {formatDate(generatedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <ExportButton
              onExport={handleExport}
              isExporting={isExporting}
              disabled={isLoading || !!error}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
        {/* Report Type Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <ReportTypeSelector
            selectedType={reportType}
            onTypeChange={setReportType}
          />
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={handleClearFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && renderLoading()}
        {!isLoading && error && renderError()}
        {!isLoading && !error && renderReportContent()}
      </div>
    </div>
  )
}

export default EvaluationReports
