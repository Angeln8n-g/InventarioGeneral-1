'use client'

import React, { useState, useMemo } from 'react'
import { EnhancedMetricCard } from './EnhancedMetricCard'
import { UnifiedChart } from './UnifiedChart'
import { UnifiedDataTable } from './UnifiedDataTable'
import type {
  DrillDownSectionProps,
  LoansSummary,
  ChartData,
  ColumnConfig,
  LoanActivityTrend,
} from '@/types/unified-dashboard'

interface LoansSectionProps extends DrillDownSectionProps {
  summary?: LoansSummary
  loansData?: LoanDetail[]
  activityTrend?: LoanActivityTrend
  loading?: boolean
}

interface LoanDetail {
  id: number
  toolName: string
  userName: string
  userEmail: string
  loanDate: string
  dueDate: string
  returnedDate: string | null
  status: 'active' | 'overdue' | 'returned'
}

// Icons
const ActiveIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const OverdueIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ReturnedIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const TotalIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const statusColors: Record<string, string> = {
  active: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  overdue: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  returned: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  overdue: 'Vencido',
  returned: 'Devuelto',
}

export function LoansSection({
  filters,
  summary,
  loansData = [],
  activityTrend,
  loading = false,
  onDrillDown,
}: LoansSectionProps) {
  const [showTable, setShowTable] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('loanDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const metrics = useMemo(
    () => [
      {
        title: 'Préstamos Activos',
        value: summary?.active ?? 0,
        icon: <ActiveIcon />,
        color: 'blue' as const,
        metric: 'active',
      },
      {
        title: 'Préstamos Vencidos',
        value: summary?.overdue ?? 0,
        icon: <OverdueIcon />,
        color: 'red' as const,
        metric: 'overdue',
      },
      {
        title: 'Devueltos',
        value: summary?.returned ?? 0,
        icon: <ReturnedIcon />,
        color: 'green' as const,
        metric: 'returned',
      },
      {
        title: 'Total Préstamos',
        value: summary?.total ?? 0,
        icon: <TotalIcon />,
        color: 'purple' as const,
        metric: 'total',
      },
    ],
    [summary]
  )

  // Activity trend chart data
  const trendChartData: ChartData = useMemo(() => {
    if (!activityTrend) {
      return {
        labels: [],
        datasets: [
          { label: 'Préstamos', data: [] },
          { label: 'Devoluciones', data: [] },
        ],
      }
    }
    return {
      labels: activityTrend.labels,
      datasets: activityTrend.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
      })),
    }
  }, [activityTrend])

  // Status distribution chart data
  const statusChartData: ChartData = useMemo(
    () => ({
      labels: ['Activos', 'Vencidos', 'Devueltos'],
      datasets: [
        {
          label: 'Préstamos por Estado',
          data: [summary?.active ?? 0, summary?.overdue ?? 0, summary?.returned ?? 0],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(16, 185, 129, 0.8)',
          ],
        },
      ],
    }),
    [summary]
  )

  // Table columns
  const columns: ColumnConfig<LoanDetail>[] = useMemo(
    () => [
      { key: 'toolName', header: 'Herramienta', sortable: true, searchable: true },
      { key: 'userName', header: 'Usuario', sortable: true, searchable: true },
      {
        key: 'loanDate',
        header: 'Fecha Préstamo',
        sortable: true,
        render: (value) => new Date(value as string).toLocaleDateString('es-ES'),
      },
      {
        key: 'dueDate',
        header: 'Fecha Vencimiento',
        sortable: true,
        render: (value) => new Date(value as string).toLocaleDateString('es-ES'),
      },
      {
        key: 'returnedDate',
        header: 'Fecha Devolución',
        sortable: true,
        render: (value) =>
          value ? new Date(value as string).toLocaleDateString('es-ES') : '-',
      },
      {
        key: 'status',
        header: 'Estado',
        sortable: true,
        render: (value) => {
          const status = value as string
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || ''}`}
            >
              {statusLabels[status] || status}
            </span>
          )
        },
      },
    ],
    []
  )

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...loansData]

    // Apply search
    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(
        (item) =>
          item.toolName.toLowerCase().includes(search) ||
          item.userName.toLowerCase().includes(search) ||
          item.userEmail.toLowerCase().includes(search)
      )
    }

    // Apply sort
    data.sort((a, b) => {
      const aVal = a[sortField as keyof LoanDetail]
      const bVal = b[sortField as keyof LoanDetail]

      if (aVal === null && bVal === null) return 0
      if (aVal === null) return sortDirection === 'asc' ? 1 : -1
      if (bVal === null) return sortDirection === 'asc' ? -1 : 1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return 0
    })

    return data
  }, [loansData, tableSearch, sortField, sortDirection])

  const pageSize = 10
  const paginatedData = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, tablePage])

  const handleMetricClick = (metric: string) => {
    setShowTable(true)
    onDrillDown(metric, { filters })
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <EnhancedMetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            loading={loading}
            onClick={() => handleMetricClick(metric.metric)}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UnifiedChart
          type="line"
          data={trendChartData}
          title="Actividad de Préstamos"
          loading={loading}
          height={280}
        />
        <UnifiedChart
          type="doughnut"
          data={statusChartData}
          title="Distribución por Estado"
          loading={loading}
          height={280}
        />
      </div>

      {/* Overdue Alert */}
      {(summary?.overdue ?? 0) > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="text-red-500">
              <OverdueIcon />
            </div>
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">
                Atención: Préstamos Vencidos
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Hay {summary?.overdue} préstamos que han superado su fecha de vencimiento.
              </p>
            </div>
            <button
              onClick={() => handleMetricClick('overdue')}
              className="ml-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}

      {/* Drill-down Table */}
      {showTable && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalle de Préstamos
            </h3>
            <button
              onClick={() => setShowTable(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Ocultar tabla
            </button>
          </div>
          <UnifiedDataTable
            data={paginatedData}
            columns={columns}
            loading={loading}
            searchable
            onSearch={setTableSearch}
            pagination={{
              page: tablePage,
              pageSize,
              total: filteredData.length,
              onPageChange: setTablePage,
            }}
            sorting={{
              field: sortField,
              direction: sortDirection,
              onSort: handleSort,
            }}
            onRowClick={(row) => onDrillDown('loan_detail', row)}
            emptyMessage="No se encontraron préstamos"
          />
        </div>
      )}

      {/* Show Table Button */}
      {!showTable && (
        <button
          onClick={() => setShowTable(true)}
          className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
        >
          Ver tabla detallada de préstamos
        </button>
      )}
    </div>
  )
}
