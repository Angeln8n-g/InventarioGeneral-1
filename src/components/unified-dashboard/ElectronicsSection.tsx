'use client'

import React, { useState, useMemo } from 'react'
import { EnhancedMetricCard } from './EnhancedMetricCard'
import { UnifiedChart } from './UnifiedChart'
import { UnifiedDataTable } from './UnifiedDataTable'
import type { 
  DrillDownSectionProps, 
  ElectronicsSummary, 
  ChartData,
  ColumnConfig 
} from '@/types/unified-dashboard'

interface ElectronicsSectionProps extends DrillDownSectionProps {
  summary?: ElectronicsSummary
  devicesData?: DeviceDetail[]
  loading?: boolean
}

interface DeviceDetail {
  id: number
  name: string
  brand: string
  model: string
  serialNumber: string
  status: string
  currentClassroom: string | null
  assignedDate: string | null
}

// Icons
const DeviceIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const AssignedIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UnassignedIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
)

const BrandIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

export function ElectronicsSection({
  filters,
  summary,
  devicesData = [],
  loading = false,
  onDrillDown,
}: ElectronicsSectionProps) {
  const [showTable, setShowTable] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Calculate unique brands count
  const uniqueBrandsCount = useMemo(() => {
    return summary?.byBrand?.length ?? 0
  }, [summary])

  const metrics = useMemo(() => [
    {
      title: 'Total Dispositivos',
      value: summary?.total ?? 0,
      icon: <DeviceIcon />,
      color: 'blue' as const,
      metric: 'total',
    },
    {
      title: 'Asignados',
      value: summary?.assigned ?? 0,
      icon: <AssignedIcon />,
      color: 'green' as const,
      metric: 'assigned',
    },
    {
      title: 'Sin Asignar',
      value: summary?.unassigned ?? 0,
      icon: <UnassignedIcon />,
      color: 'yellow' as const,
      metric: 'unassigned',
    },
    {
      title: 'Marcas',
      value: uniqueBrandsCount,
      icon: <BrandIcon />,
      color: 'purple' as const,
      metric: 'brands',
    },
  ], [summary, uniqueBrandsCount])

  // Brand distribution chart data
  const brandChartData: ChartData = useMemo(() => {
    const brands = summary?.byBrand ?? []
    return {
      labels: brands.map(b => b.brand),
      datasets: [{
        label: 'Dispositivos por Marca',
        data: brands.map(b => b.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      }],
    }
  }, [summary])

  // Status distribution chart data
  const statusChartData: ChartData = useMemo(() => {
    const statuses = summary?.byStatus ?? []
    return {
      labels: statuses.map(s => s.status),
      datasets: [{
        label: 'Dispositivos por Estado',
        data: statuses.map(s => s.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      }],
    }
  }, [summary])

  // Table columns
  const columns: ColumnConfig<DeviceDetail>[] = useMemo(() => [
    { key: 'name', header: 'Nombre', sortable: true, searchable: true },
    { key: 'brand', header: 'Marca', sortable: true, searchable: true },
    { key: 'model', header: 'Modelo', sortable: true, searchable: true },
    { key: 'serialNumber', header: 'N° Serie', sortable: true, searchable: true },
    { key: 'status', header: 'Estado', sortable: true, searchable: true },
    { 
      key: 'currentClassroom', 
      header: 'Aula Actual', 
      sortable: true, 
      searchable: true,
      render: (value) => value || 'Sin asignar'
    },
  ], [])

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...devicesData]
    
    // Apply search
    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.brand.toLowerCase().includes(search) ||
        item.model.toLowerCase().includes(search) ||
        item.serialNumber.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search) ||
        (item.currentClassroom?.toLowerCase().includes(search) ?? false)
      )
    }
    
    // Apply sort
    data.sort((a, b) => {
      const aVal = a[sortField as keyof DeviceDetail]
      const bVal = b[sortField as keyof DeviceDetail]
      
      // Handle null values
      if (aVal === null && bVal === null) return 0
      if (aVal === null) return sortDirection === 'asc' ? 1 : -1
      if (bVal === null) return sortDirection === 'asc' ? -1 : 1
      
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
  }, [devicesData, tableSearch, sortField, sortDirection])

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
          data={brandChartData}
          title="Distribución por Marca"
          loading={loading}
          height={280}
        />
        <UnifiedChart
          type="bar"
          data={statusChartData}
          title="Dispositivos por Estado"
          loading={loading}
          height={280}
        />
      </div>

      {/* Drill-down Table */}
      {showTable && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalle de Dispositivos Electrónicos
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
            onRowClick={(row) => onDrillDown('device_detail', row)}
            emptyMessage="No se encontraron dispositivos"
          />
        </div>
      )}

      {/* Show Table Button */}
      {!showTable && (
        <button
          onClick={() => setShowTable(true)}
          className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
        >
          Ver tabla detallada de dispositivos
        </button>
      )}
    </div>
  )
}
