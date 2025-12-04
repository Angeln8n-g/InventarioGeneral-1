'use client'

import React, { useState, useMemo } from 'react'
import { EnhancedMetricCard } from './EnhancedMetricCard'
import { UnifiedChart } from './UnifiedChart'
import { UnifiedDataTable } from './UnifiedDataTable'
import type { 
  DrillDownSectionProps, 
  ConsumablesSummary, 
  ChartData,
  ColumnConfig,
  ConsumptionTrend
} from '@/types/unified-dashboard'

interface ConsumablesSectionProps extends DrillDownSectionProps {
  summary?: ConsumablesSummary
  consumablesData?: ConsumableDetail[]
  consumptionTrend?: ConsumptionTrend
  loading?: boolean
}

interface ConsumableDetail {
  id: number
  name: string
  category: string
  currentStock: number
  minimumThreshold: number
  unitOfMeasure: string
  status: 'critical' | 'low' | 'normal' | 'high'
}

// Icons
const TypesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const StockIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const LowStockIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const CategoriesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const statusColors: Record<string, string> = {
  critical: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  low: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  normal: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  high: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
}

const statusLabels: Record<string, string> = {
  critical: 'Crítico',
  low: 'Bajo',
  normal: 'Normal',
  high: 'Alto',
}

export function ConsumablesSection({
  filters,
  summary,
  consumablesData = [],
  consumptionTrend,
  loading = false,
  onDrillDown,
}: ConsumablesSectionProps) {
  const [showTable, setShowTable] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const metrics = useMemo(() => [
    {
      title: 'Tipos de Consumibles',
      value: summary?.totalTypes ?? 0,
      icon: <TypesIcon />,
      color: 'blue' as const,
      metric: 'types',
    },
    {
      title: 'Stock Total',
      value: summary?.totalStock ?? 0,
      icon: <StockIcon />,
      color: 'green' as const,
      metric: 'stock',
    },
    {
      title: 'Stock Bajo',
      value: summary?.lowStockCount ?? 0,
      icon: <LowStockIcon />,
      color: 'red' as const,
      metric: 'low_stock',
    },
    {
      title: 'Categorías',
      value: summary?.byCategory?.length ?? 0,
      icon: <CategoriesIcon />,
      color: 'purple' as const,
      metric: 'categories',
    },
  ], [summary])

  // Consumption trend chart data
  const trendChartData: ChartData = useMemo(() => {
    if (!consumptionTrend) {
      return {
        labels: [],
        datasets: [{
          label: 'Consumo',
          data: [],
        }],
      }
    }
    return {
      labels: consumptionTrend.labels,
      datasets: consumptionTrend.datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
      })),
    }
  }, [consumptionTrend])

  // Category distribution chart data
  const categoryChartData: ChartData = useMemo(() => {
    const categories = summary?.byCategory ?? []
    return {
      labels: categories.map(c => c.category),
      datasets: [{
        label: 'Consumibles por Categoría',
        data: categories.map(c => c.count),
      }],
    }
  }, [summary])

  // Table columns
  const columns: ColumnConfig<ConsumableDetail>[] = useMemo(() => [
    { key: 'name', header: 'Nombre', sortable: true, searchable: true },
    { key: 'category', header: 'Categoría', sortable: true, searchable: true },
    { 
      key: 'currentStock', 
      header: 'Stock Actual', 
      sortable: true,
      render: (value, row) => (
        <span className="font-medium">
          {value as number} {row.unitOfMeasure}
        </span>
      ),
    },
    { 
      key: 'minimumThreshold', 
      header: 'Mínimo', 
      sortable: true,
      render: (value, row) => (
        <span className="text-gray-500 dark:text-gray-400">
          {value as number} {row.unitOfMeasure}
        </span>
      ),
    },
    { 
      key: 'status', 
      header: 'Estado', 
      sortable: true,
      render: (value) => {
        const status = value as string
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || ''}`}>
            {statusLabels[status] || status}
          </span>
        )
      },
    },
  ], [])

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...consumablesData]
    
    // Apply search
    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
      )
    }
    
    // Apply sort
    data.sort((a, b) => {
      const aVal = a[sortField as keyof ConsumableDetail]
      const bVal = b[sortField as keyof ConsumableDetail]
      
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
  }, [consumablesData, tableSearch, sortField, sortDirection])

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
          type="line"
          data={trendChartData}
          title="Tendencia de Consumo"
          loading={loading}
          height={280}
        />
        <UnifiedChart
          type="pie"
          data={categoryChartData}
          title="Distribución por Categoría"
          loading={loading}
          height={280}
        />
      </div>

      {/* Low Stock Alert */}
      {(summary?.lowStockCount ?? 0) > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="text-yellow-500">
              <LowStockIcon />
            </div>
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Atención: Stock Bajo
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Hay {summary?.lowStockCount} consumibles con stock por debajo del mínimo requerido.
              </p>
            </div>
            <button
              onClick={() => handleMetricClick('low_stock')}
              className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
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
              Detalle de Consumibles
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
            onRowClick={(row) => onDrillDown('consumable_detail', row)}
            emptyMessage="No se encontraron consumibles"
          />
        </div>
      )}

      {/* Show Table Button */}
      {!showTable && (
        <button
          onClick={() => setShowTable(true)}
          className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
        >
          Ver tabla detallada de consumibles
        </button>
      )}
    </div>
  )
}
