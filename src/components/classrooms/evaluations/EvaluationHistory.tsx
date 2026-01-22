'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  History,
  Calendar,
  Filter,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  X
} from 'lucide-react'
import { ScoreDisplayCompact } from './ScoreDisplay'

/**
 * Evaluation history item from the API
 */
interface EvaluationHistoryItem {
  id: number
  fecha: string
  evaluador: {
    id: number
    username: string
  }
  puntuacion_total: {
    score: number
    max: number
    percentage: number
  }
  puntuaciones_por_categoria: {
    organization: { score: number; max: number; percentage: number }
    cleanliness: { score: number; max: number; percentage: number }
    maintenance: { score: number; max: number; percentage: number }
  }
  estado: 'completed' | 'draft'
  scheduled_evaluation?: {
    scheduled_date: string
    template: {
      id: number
      name: string
      space_type: string
    }
  }
}

/**
 * Classroom info from the API
 */
interface ClassroomInfo {
  id: number
  name: string
  location: string
  responsible_person?: string
}

/**
 * API response structure
 */
interface HistoryApiResponse {
  data: EvaluationHistoryItem[]
  total: number
  classroom: ClassroomInfo
  filters: {
    start_date: string | null
    end_date: string | null
  }
}

/**
 * Props for the EvaluationHistory component
 */
export interface EvaluationHistoryProps {
  /** ID of the classroom to show history for */
  classroomId: number
  /** JWT token for API authentication */
  token: string | null
  /** Callback when user clicks on an evaluation row to view details */
  onViewDetail?: (evaluationId: number) => void
}

// Category labels in Spanish
const CATEGORY_LABELS = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

// Status labels and styles
const STATUS_CONFIG: Record<'completed' | 'draft', { label: string; className: string }> = {
  completed: {
    label: 'Completada',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  },
  draft: {
    label: 'Borrador',
    className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * EvaluationHistory Component
 * 
 * Displays the evaluation history for a specific classroom with filtering capabilities.
 * 
 * Features:
 * - Table showing evaluation history with columns: fecha, evaluador, puntuación total, 
 *   puntuaciones por categoría, estado
 * - Date range filters (start_date, end_date)
 * - Click on row to view evaluation detail
 * - Loading, error, and empty states
 * - Pagination for large datasets
 * - Responsive design for mobile
 * 
 * Validates: Requirements 5.1, 5.2, 5.5
 * - 5.1: Show complete evaluation history ordered by date
 * - 5.2: Show fecha, evaluador, puntuación total, puntuaciones por categoría, estado
 * - 5.5: Filter by date range
 */
export function EvaluationHistory({
  classroomId,
  token,
  onViewDetail
}: EvaluationHistoryProps) {
  // Data state
  const [historyItems, setHistoryItems] = useState<EvaluationHistoryItem[]>([])
  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null)
  const [total, setTotal] = useState(0)

  // Filter state
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  /**
   * Fetches evaluation history from the API
   * Validates: Requirements 5.1, 5.5
   */
  const fetchHistory = useCallback(async () => {
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
        // Set end date to end of day
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        params.append('end_date', endDateTime.toISOString())
      }

      const queryString = params.toString()
      const url = `/api/admin/evaluations/history/${classroomId}${queryString ? `?${queryString}` : ''}`

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Error al cargar el historial')
      }

      const data: HistoryApiResponse = await res.json()
      setHistoryItems(data.data)
      setClassroom(data.classroom)
      setTotal(data.total)
      setCurrentPage(1) // Reset to first page when data changes
    } catch (err) {
      console.error('Error fetching history:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el historial')
    } finally {
      setIsLoading(false)
    }
  }, [classroomId, token, startDate, endDate])

  // Fetch history on mount and when filters change
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  /**
   * Handles clearing all filters
   */
  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  /**
   * Handles row click to view detail
   * Validates: Requirement 5.3 (click to view detail)
   */
  const handleRowClick = (evaluationId: number) => {
    onViewDetail?.(evaluationId)
  }

  // Calculate pagination
  const totalPages = Math.ceil(historyItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = historyItems.slice(startIndex, endIndex)

  /**
   * Renders the loading state
   */
  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando historial...</span>
    </div>
  )

  /**
   * Renders the error state
   * Validates: Requirement 7.7 (descriptive error messages in Spanish)
   */
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
      <button
        onClick={() => {
          setError(null)
          fetchHistory()
        }}
        className="flex items-center gap-2 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  )

  /**
   * Renders the empty state when no evaluations exist
   */
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Sin evaluaciones
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        {startDate || endDate
          ? 'No se encontraron evaluaciones en el rango de fechas seleccionado.'
          : 'Aún no se han completado evaluaciones para este espacio.'}
      </p>
      {(startDate || endDate) && (
        <button
          onClick={handleClearFilters}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </button>
      )}
    </div>
  )

  /**
   * Renders the date range filters
   * Validates: Requirement 5.5 (filter by date range)
   */
  const renderFilters = () => (
    <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              disabled={!startDate && !endDate}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  /**
   * Renders the history table
   * Validates: Requirement 5.2 (show fecha, evaluador, puntuación total, puntuaciones por categoría, estado)
   */
  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
              Fecha
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
              Evaluador
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
              Puntuación Total
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm hidden lg:table-cell">
              {CATEGORY_LABELS.organization}
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm hidden lg:table-cell">
              {CATEGORY_LABELS.cleanliness}
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm hidden lg:table-cell">
              {CATEGORY_LABELS.maintenance}
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((item) => {
            const statusConfig = STATUS_CONFIG[item.estado]
            
            return (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item.id)}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRowClick(item.id)
                  }
                }}
                aria-label={`Ver detalle de evaluación del ${formatDate(item.fecha)}`}
              >
                {/* Fecha */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(item.fecha)}
                    </span>
                  </div>
                </td>

                {/* Evaluador */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.evaluador.username}
                    </span>
                  </div>
                </td>

                {/* Puntuación Total */}
                <td className="py-3 px-4 text-center">
                  <ScoreDisplayCompact
                    totalScore={item.puntuacion_total.score}
                    maxScore={item.puntuacion_total.max}
                  />
                </td>

                {/* Puntuaciones por Categoría - Hidden on mobile */}
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  {item.puntuaciones_por_categoria.organization.max > 0 ? (
                    <ScoreDisplayCompact
                      totalScore={item.puntuaciones_por_categoria.organization.score}
                      maxScore={item.puntuaciones_por_categoria.organization.max}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  {item.puntuaciones_por_categoria.cleanliness.max > 0 ? (
                    <ScoreDisplayCompact
                      totalScore={item.puntuaciones_por_categoria.cleanliness.score}
                      maxScore={item.puntuaciones_por_categoria.cleanliness.max}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  {item.puntuaciones_por_categoria.maintenance.max > 0 ? (
                    <ScoreDisplayCompact
                      totalScore={item.puntuaciones_por_categoria.maintenance.score}
                      maxScore={item.puntuaciones_por_categoria.maintenance.max}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>

                {/* Estado */}
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  /**
   * Renders pagination controls
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Mostrando {startIndex + 1} - {Math.min(endIndex, historyItems.length)} de {historyItems.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Check if filters are active
  const hasActiveFilters = startDate || endDate

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 gap-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-claro-red" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Historial de Evaluaciones
            </h2>
            {classroom && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {classroom.name} - {classroom.location}
              </p>
            )}
          </div>
          {!isLoading && historyItems.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              ({total})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              hasActiveFilters
                ? 'bg-claro-red text-white hover:bg-red-700'
                : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Content */}
      <div>
        {isLoading && renderLoading()}
        {!isLoading && error && renderError()}
        {!isLoading && !error && historyItems.length === 0 && renderEmpty()}
        {!isLoading && !error && historyItems.length > 0 && (
          <>
            {renderTable()}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  )
}

export default EvaluationHistory
