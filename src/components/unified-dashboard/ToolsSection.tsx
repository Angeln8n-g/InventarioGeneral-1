'use client'

import React, { useState, useMemo } from 'react'
import { EnhancedMetricCard } from './EnhancedMetricCard'
import { UnifiedChart } from './UnifiedChart'
import { UnifiedDataTable } from './UnifiedDataTable'
import type { 
  DrillDownSectionProps, 
  ToolsSummary, 
  ChartData,
  ColumnConfig 
} from '@/types/unified-dashboard'

interface ToolsSectionProps extends DrillDownSectionProps {
  summary?: ToolsSummary
  toolsData?: ToolDetail[]
  loading?: boolean
}

interface ToolDetail {
  id: number
  name: string
  category: string
  status: string
  totalInstances: number
  availableInstances: number
  loanedInstances: number
}

// Icons
const ToolsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const AvailableIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LoanedIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const MaintenanceIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
)

export function ToolsSection({
  filters,
  summary,
  toolsData = [],
  loading = false,
  onDrillDown,
}: ToolsSectionProps) {
  const [showTable, setShowTable] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const metrics = useMemo(() => [
    {
      title: 'Total Herramientas',
      value: summary?.total ?? 0,
      icon: <ToolsIcon />,
      color: 'blue' as const,
      metric: 'total',
    },
    {
      title: 'Disponibles',
      value: summary?.available ?? 0,
      icon: <AvailableIcon />,
      color: 'green' as const,
      metric: 'available',
    },
    {
      title: 'Prestadas',
      value: summary?.loaned ?? 0,
      icon: <LoanedIcon />,
      color: 'purple' as const,
      metric: 'loaned',
    },
    {
      title: 'En Mantenimiento',
      value: summary?.maintenance ?? 0,
      icon: <MaintenanceIcon />,
      color: 'yellow' as const,
      metric: 'maintenance',
    },
  ], [summary])

  // Status distribution chart data
  const statusChartData: ChartData = useMemo(() => ({
    labels: ['Disponibles', 'Prestadas', 'Mantenimiento'],
    datasets: [{
      label: 'Herramientas por Estado',
      data: [
        summary?.available ?? 0,
        summary?.loaned ?? 0,
        summary?.maintenance ?? 0,
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
      ],
    }],
  }), [summary])

  // Category breakdown chart data
  const categoryChartData: ChartData = useMemo(() => {
    const categories = summary?.byCategory ?? []
    return {
      labels: categories.map(c => c.category),
      datasets: [{
        label: 'Herramientas por Categoría',
        data: categories.map(c => c.count),
      }],
    }
  }, [summary])

  // Table columns
  const columns: ColumnConfig<ToolDetail>[] = useMemo(() => [
    { key: 'name', header: 'Nombre', sortable: true, searchable: true },
    { key: 'category', header: 'Categoría', sortable: true, searchable: true },
    { key: 'status', header: 'Estado', sortable: true, searchable: true },
    { key: 'totalInstances', header: 'Total', sortable: true },
    { key: 'availableInstances', header: 'Disponibles', sortable: true },
    { key: 'loanedInstances', header: 'Prestadas', sortable: true },
  ], [])

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...toolsData]
    
    // Apply search
    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search)
      )
    }
    
    // Apply sort
    data.sort((a, b) => {
      const aVal = a[sortField as keyof ToolDetail]
      const bVal = b[sortField as keyof ToolDetail]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      return 0
    })
    
    return data
  }, [toolsData, tableSearch, sortField, sortDirection])

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
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
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
          type="doughnut"
          data={statusChartData}
          title="Distribución por Estado"
          loading={loading}
          height={280}
        />
        <UnifiedChart
          type="bar"
          data={categoryChartData}
          title="Herramientas por Categoría"
          loading={loading}
          height={280}
        />
      </div>

      {/* Drill-down Table */}
      {showTable && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalle de Herramientas
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
            onRowClick={(row) => onDrillDown('tool_detail', row)}
            emptyMessage="No se encontraron herramientas"
          />
        </div>
      )}

      {/* Show Table Button */}
      {!showTable && (
        <button
          onClick={() => setShowTable(true)}
          className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
        >
          Ver tabla detallada de herramientas
        </button>
      )}
    </div>
  )
}
