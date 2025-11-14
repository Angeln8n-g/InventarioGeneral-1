'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import ReportFilters from '@/components/reports/ReportFilters'
import ReportMetrics from '@/components/reports/ReportMetrics'
import ReportCharts from '@/components/reports/ReportCharts'
import ReportTable from '@/components/reports/ReportTable'
import ExportButton from '@/components/reports/ExportButton'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { Wrench, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react'
import type {
  ToolReportFilters,
  ToolReportData,
  FilterConfig,
  Metric,
  ChartConfig,
  ColumnConfig,
  ToolInstanceWithRelations,
} from '@/types/reports'

export default function ToolReportsPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const token = useSelector((state: RootState) => state.auth.token)

  const [filters, setFilters] = useState<ToolReportFilters>({})
  const [reportData, setReportData] = useState<ToolReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      type: 'select',
      name: 'category',
      label: 'Categoría',
      options: categories.map(cat => ({ value: cat, label: cat })),
      placeholder: 'Todas las categorías',
    },
    {
      type: 'select',
      name: 'status',
      label: 'Estado',
      options: [
        { value: 'available', label: 'Disponible' },
        { value: 'loaned', label: 'Prestado' },
        { value: 'out-of-service', label: 'Fuera de Servicio' },
        { value: 'lost', label: 'Perdido' },
        { value: 'damaged', label: 'Dañado' },
      ],
      placeholder: 'Todos los estados',
    },
  ]

  const fetchReportData = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status as string)

      const response = await fetch(`/api/admin/reports/tools?${params.toString()}`, {
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
  }, [token, filters])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchReportData()
    }
  }, [isAuthenticated, isAdmin, fetchReportData])

  const handleFiltersChange = (newFilters: ToolReportFilters) => {
    setFilters(newFilters as ToolReportFilters)
  }

  // Prepare metrics
  const metrics: Metric[] = reportData
    ? [
        {
          id: 'total',
          label: 'Total de Herramientas',
          value: reportData.metrics.totalTools,
          icon: <Wrench className="w-6 h-6" />,
          color: 'blue',
          format: 'number',
        },
        {
          id: 'available',
          label: 'Herramientas Disponibles',
          value: reportData.metrics.availableTools,
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'green',
          format: 'number',
        },
        {
          id: 'utilization',
          label: 'Tasa de Utilización',
          value: reportData.metrics.utilizationRate,
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'blue',
          format: 'percentage',
        },
        {
          id: 'maintenance',
          label: 'Requieren Mantenimiento',
          value: reportData.metrics.maintenanceNeeded,
          icon: <AlertTriangle className="w-6 h-6" />,
          color: 'yellow',
          format: 'number',
        },
      ]
    : []

  // Prepare charts
  const charts: ChartConfig[] = [
    {
      id: 'statusDistribution',
      type: 'pie',
      title: 'Distribución por Estado',
      dataKey: 'statusDistribution',
      xAxisKey: 'status',
      yAxisKey: 'count',
    },
    {
      id: 'categoryDistribution',
      type: 'bar',
      title: 'Distribución por Categoría',
      dataKey: 'categoryDistribution',
      xAxisKey: 'category',
      yAxisKey: 'count',
    },
    {
      id: 'utilization',
      type: 'horizontal-bar',
      title: 'Top 10 Herramientas por Utilización',
      dataKey: 'utilization',
      yAxisKey: 'tool',
      xAxisKey: 'rate',
    },
    {
      id: 'statusTimeline',
      type: 'stacked-bar',
      title: 'Evolución de Estados (Últimos 30 Días)',
      dataKey: 'statusTimeline',
      xAxisKey: 'date',
    },
  ]

  // Prepare table columns
  const columns: ColumnConfig<ToolInstanceWithRelations>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'item_type.name',
      label: 'Nombre',
      sortable: true,
      format: (value, row) => {
        const itemType = (row as ToolInstanceWithRelations).item_type
        return <span>{itemType?.name || '-'}</span>
      },
    },
    {
      key: 'item_type.description',
      label: 'Descripción',
      format: (value, row) => {
        const itemType = (row as ToolInstanceWithRelations).item_type
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {itemType?.description || (
              <span className="italic text-gray-400 dark:text-gray-500">Sin descripción</span>
            )}
          </span>
        )
      },
    },
    {
      key: 'item_type.category',
      label: 'Categoría',
      format: (value, row) => {
        const itemType = (row as ToolInstanceWithRelations).item_type
        return <span>{itemType?.category || 'Sin categoría'}</span>
      },
    },
    {
      key: 'qr_code',
      label: 'Código QR',
      format: (value) => (
        <span className="font-mono text-xs">{(value as string).substring(0, 12)}...</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      format: (value) => {
        const status = value as string
        const statusColors = {
          available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          loaned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          'out-of-service':
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          damaged: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        }
        const statusLabels = {
          available: 'Disponible',
          loaned: 'Prestado',
          'out-of-service': 'Fuera de Servicio',
          lost: 'Perdido',
          damaged: 'Dañado',
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
          >
            {statusLabels[status as keyof typeof statusLabels] || status}
          </span>
        )
      },
    },
    {
      key: 'utilizationRate',
      label: 'Tasa de Utilización',
      sortable: true,
      format: (value) => {
        const rate = value as number
        const color =
          rate > 70
            ? 'text-green-600 dark:text-green-400'
            : rate > 40
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
        return <span className={`font-medium ${color}`}>{rate.toFixed(1)}%</span>
      },
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      sortable: true,
      format: (value) => <span>{new Date(value as string).toLocaleDateString('es-ES')}</span>,
    },
  ]

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Reportes de Herramientas">
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
      <AppLayout title="Reportes de Herramientas">
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reportes de Inventario de Herramientas
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análisis detallado del inventario y utilización de herramientas
              </p>
            </div>
            <div className="flex gap-2">
              <ExportButton reportType="tools" filters={filters} format="pdf" />
              <ExportButton reportType="tools" filters={filters} format="excel" />
              <ExportButton reportType="tools" filters={filters} format="csv" />
            </div>
          </div>

          {/* Filters */}
          <ReportFilters
            filters={filters}
            onFiltersChange={
              handleFiltersChange as (filters: import('@/types/reports').ReportFilters) => void
            }
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
                Herramientas Detalladas
              </h2>
              <ReportTable
                columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                data={reportData.tools as unknown as Record<string, unknown>[]}
                totalCount={reportData.tools.length}
                page={1}
                pageSize={reportData.tools.length}
                onPageChange={() => {}}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
