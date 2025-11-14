'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import ReportFilters from '@/components/reports/ReportFilters'
import ReportMetrics from '@/components/reports/ReportMetrics'
import dynamic from 'next/dynamic'

// Lazy load charts for better performance
const ReportCharts = dynamic(() => import('@/components/reports/ReportCharts'), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-80 animate-pulse"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
        </div>
      ))}
    </div>
  ),
  ssr: false,
})
import ReportTable from '@/components/reports/ReportTable'
import ExportButton from '@/components/reports/ExportButton'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { FileText, Users, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import type {
  LoanReportFilters,
  LoanReportData,
  FilterConfig,
  Metric,
  ChartConfig,
  ColumnConfig,
  LoanWithRelations,
} from '@/types/reports'

export default function LoanReportsPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const token = useSelector((state: RootState) => state.auth.token)

  const [filters, setFilters] = useState<LoanReportFilters>({})
  const [reportData, setReportData] = useState<LoanReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [categories, setCategories] = useState<string[]>([])

  // Fetch categories dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return
      try {
        const response = await fetch('/api/admin/item-types?tools_only=true', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          const uniqueCategories = Array.from(
            new Set(
              data.data
                .map((type: { category?: string }) => type.category)
                .filter((cat: string | undefined): cat is string => !!cat)
            )
          ).sort() as string[]
          setCategories(uniqueCategories)
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [token])

  const availableFilters: FilterConfig[] = [
    {
      type: 'date-range',
      name: 'dateRange',
      label: 'Rango de Fechas',
    },
    {
      type: 'select',
      name: 'status',
      label: 'Estado',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'returned', label: 'Devuelto' },
        { value: 'overdue', label: 'Vencido' },
        { value: 'lost', label: 'Perdido' },
      ],
      placeholder: 'Todos los estados',
    },
    {
      type: 'select',
      name: 'category',
      label: 'Categoría',
      options: categories.map(cat => ({ value: cat, label: cat })),
      placeholder: 'Todas las categorías',
    },
  ]

  const fetchReportData = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.dateRange?.start) params.append('start_date', filters.dateRange.start)
      if (filters.dateRange?.end) params.append('end_date', filters.dateRange.end)
      if (filters.status) params.append('status', filters.status as string)
      if (filters.userId) params.append('user_id', filters.userId.toString())
      if (filters.toolInstanceId)
        params.append('tool_instance_id', filters.toolInstanceId.toString())
      params.append('page', page.toString())
      params.append('page_size', pageSize.toString())

      const response = await fetch(`/api/admin/reports/loans?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al cargar el reporte')
      }

      const data = await response.json()
      setReportData(data.data)
    } catch (err) {
      console.error('Error fetching report:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [token, filters, page, pageSize])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchReportData()
    }
  }, [isAuthenticated, isAdmin, fetchReportData])

  // Debounce filter changes to avoid excessive API calls
  const handleFiltersChange = useCallback((newFilters: LoanReportFilters) => {
    setFilters(newFilters as LoanReportFilters)
    setPage(1) // Reset to first page when filters change
  }, [])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // Memoize metrics to avoid recalculation
  const metrics: Metric[] = useMemo(() => reportData
    ? [
        {
          id: 'total',
          label: 'Total de Préstamos',
          value: reportData.metrics.totalLoans,
          icon: <FileText className="w-6 h-6" />,
          color: 'blue',
          format: 'number',
        },
        {
          id: 'active',
          label: 'Préstamos Activos',
          value: reportData.metrics.activeLoans,
          icon: <Users className="w-6 h-6" />,
          color: 'green',
          format: 'number',
        },
        {
          id: 'overdue',
          label: 'Préstamos Vencidos',
          value: reportData.metrics.overdueLoans,
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'red',
          format: 'number',
        },
        {
          id: 'returnRate',
          label: 'Tasa de Devolución',
          value: reportData.metrics.returnRate,
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'green',
          format: 'percentage',
        },
        {
          id: 'avgDuration',
          label: 'Duración Promedio',
          value: reportData.metrics.avgDuration,
          icon: <Clock className="w-6 h-6" />,
          color: 'blue',
          format: 'duration',
        },
      ]
    : [], [reportData])

  // Prepare charts
  const charts: ChartConfig[] = [
    {
      id: 'loansTrend',
      type: 'line',
      title: 'Tendencia de Préstamos',
      dataKey: 'loansTrend',
      xAxisKey: 'date',
      yAxisKey: 'count',
    },
    {
      id: 'statusDistribution',
      type: 'pie',
      title: 'Distribución por Estado',
      dataKey: 'statusDistribution',
      xAxisKey: 'status',
      yAxisKey: 'count',
    },
    {
      id: 'topTools',
      type: 'bar',
      title: 'Top 10 Herramientas Más Prestadas',
      dataKey: 'topTools',
      xAxisKey: 'tool',
      yAxisKey: 'count',
    },
    {
      id: 'topUsers',
      type: 'bar',
      title: 'Top 10 Usuarios Más Activos',
      dataKey: 'topUsers',
      xAxisKey: 'user',
      yAxisKey: 'count',
    },
  ]

  // Prepare table columns
  const columns: ColumnConfig<LoanWithRelations>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'user',
      label: 'Usuario',
      sortable: true,
      format: (value) => {
        const user = value as LoanWithRelations['user']
        return <span>{user.username}</span>
      },
    },
    {
      key: 'tool_instance',
      label: 'Herramienta',
      format: (value) => {
        const tool = value as LoanWithRelations['tool_instance']
        return (
          <div>
            <div className="font-medium">{tool.item_type.name}</div>
            {tool.item_type.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tool.item_type.description}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'loan_date',
      label: 'Fecha de Préstamo',
      sortable: true,
      format: (value) => <span>{new Date(value as string).toLocaleDateString('es-ES')}</span>,
    },
    {
      key: 'due_date',
      label: 'Fecha de Vencimiento',
      sortable: true,
      format: (value) => <span>{new Date(value as string).toLocaleDateString('es-ES')}</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      format: (value) => {
        const status = value as string
        const statusColors = {
          active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          returned: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
          >
            {status}
          </span>
        )
      },
    },
    {
      key: 'daysOverdue',
      label: 'Días de Retraso',
      format: (value) => {
        const days = value as number | undefined
        if (!days) {
          return <span>-</span>
        }
        return <span className="text-red-600 dark:text-red-400 font-medium">{days} días</span>
      },
    },
  ]

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Historial de Préstamos">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <ProtectedRoute>
      <AppLayout title="Historial de Préstamos">
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Historial de Préstamos
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análisis detallado de préstamos de herramientas
              </p>
            </div>
            <div className="flex gap-2">
              <ExportButton
                reportType="loans"
                filters={filters}
                format="pdf"
              />
              <ExportButton
                reportType="loans"
                filters={filters}
                format="excel"
              />
              <ExportButton
                reportType="loans"
                filters={filters}
                format="csv"
              />
            </div>
          </div>

          {/* Filters */}
          <ReportFilters
            filters={filters}
            onFiltersChange={handleFiltersChange as (filters: import('@/types/reports').ReportFilters) => void}
            availableFilters={availableFilters}
            isLoading={isLoading}
          />

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Metrics */}
          <ReportMetrics metrics={metrics} isLoading={isLoading} />

          {/* Charts */}
          {reportData && (
            <ReportCharts
              charts={charts}
              data={reportData.charts as unknown as Record<string, unknown[]>}
              isLoading={isLoading}
            />
          )}

          {/* Table */}
          {reportData && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Préstamos Detallados
              </h2>
              <ReportTable
                columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                data={reportData.loans as unknown as Record<string, unknown>[]}
                totalCount={reportData.totalCount}
                page={page}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
