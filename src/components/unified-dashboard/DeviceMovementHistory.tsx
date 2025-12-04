'use client'

import React, { useState, useMemo } from 'react'
import { UnifiedDataTable } from './UnifiedDataTable'
import type { 
  DeviceMovement, 
  DeviceTransferHistory,
  ColumnConfig,
  GlobalFilters 
} from '@/types/unified-dashboard'

interface DeviceMovementHistoryProps {
  filters: GlobalFilters
  deviceHistory?: DeviceTransferHistory
  movements?: DeviceMovement[]
  loading?: boolean
  onDeviceSelect?: (deviceId: number) => void
}

// Icons
const TransferIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

export function DeviceMovementHistory({
  filters,
  deviceHistory,
  movements = [],
  loading = false,
  onDeviceSelect,
}: DeviceMovementHistoryProps) {
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('transferDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Table columns for movements list
  const columns: ColumnConfig<DeviceMovement>[] = useMemo(() => [
    { 
      key: 'deviceName', 
      header: 'Dispositivo', 
      sortable: true, 
      searchable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{row.deviceName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.serialNumber}</div>
        </div>
      )
    },
    { 
      key: 'fromClassroom', 
      header: 'Origen', 
      sortable: true, 
      searchable: true,
      render: (value) => {
        const classroom = value as DeviceMovement['fromClassroom']
        return classroom ? (
          <span className="flex items-center gap-1">
            <LocationIcon />
            {classroom.name}
          </span>
        ) : (
          <span className="text-gray-400 italic">Nuevo ingreso</span>
        )
      }
    },
    {
      key: 'transfer',
      header: '',
      render: () => <ArrowRightIcon />
    },
    { 
      key: 'toClassroom', 
      header: 'Destino', 
      sortable: true, 
      searchable: true,
      render: (value) => {
        const classroom = value as DeviceMovement['toClassroom']
        return (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <LocationIcon />
            {classroom.name}
          </span>
        )
      }
    },
    { 
      key: 'transferDate', 
      header: 'Fecha', 
      sortable: true,
      render: (value) => formatDate(value as string)
    },
    { 
      key: 'responsibleUser', 
      header: 'Responsable', 
      sortable: true, 
      searchable: true,
      render: (value) => {
        const user = value as DeviceMovement['responsibleUser']
        return user.username
      }
    },
  ], [])

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...movements]
    
    // Apply date range filter from global filters
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      data = data.filter(item => {
        const transferDate = new Date(item.transferDate)
        return transferDate >= startDate && transferDate <= endDate
      })
    }
    
    // Apply search
    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(item => 
        item.deviceName.toLowerCase().includes(search) ||
        item.serialNumber.toLowerCase().includes(search) ||
        item.fromClassroom?.name.toLowerCase().includes(search) ||
        item.toClassroom.name.toLowerCase().includes(search) ||
        item.responsibleUser.username.toLowerCase().includes(search) ||
        (item.notes?.toLowerCase().includes(search) ?? false)
      )
    }
    
    // Apply sort
    data.sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null
      
      switch (sortField) {
        case 'deviceName':
          aVal = a.deviceName
          bVal = b.deviceName
          break
        case 'fromClassroom':
          aVal = a.fromClassroom?.name ?? ''
          bVal = b.fromClassroom?.name ?? ''
          break
        case 'toClassroom':
          aVal = a.toClassroom.name
          bVal = b.toClassroom.name
          break
        case 'transferDate':
          aVal = new Date(a.transferDate).getTime()
          bVal = new Date(b.transferDate).getTime()
          break
        case 'responsibleUser':
          aVal = a.responsibleUser.username
          bVal = b.responsibleUser.username
          break
        default:
          return 0
      }
      
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
  }, [movements, filters, tableSearch, sortField, sortDirection])

  const pageSize = 10
  const paginatedData = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, tablePage])

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
      {/* Device Info Header (when viewing single device history) */}
      {deviceHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TransferIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {deviceHistory.deviceName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                S/N: {deviceHistory.serialNumber}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación actual</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {deviceHistory.currentClassroom ?? 'Sin asignar'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline View for Single Device */}
      {deviceHistory && deviceHistory.transfers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Transferencias
          </h4>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            
            {/* Timeline items */}
            <div className="space-y-4">
              {deviceHistory.transfers.map((transfer, index) => (
                <div key={transfer.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                    index === 0 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                  }`} />
                  
                  {/* Content */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {transfer.fromClassroom 
                          ? `${transfer.fromClassroom.name} → ${transfer.toClassroom.name}`
                          : `Asignado a ${transfer.toClassroom.name}`
                        }
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(transfer.transferDate)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Por: {transfer.responsibleUser.username}
                    </p>
                    {transfer.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        {transfer.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Movements Table (for all movements view) */}
      {!deviceHistory && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de Movimientos de Dispositivos
          </h3>
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
            onRowClick={(row) => onDeviceSelect?.(row.deviceId)}
            emptyMessage="No se encontraron movimientos de dispositivos"
          />
        </div>
      )}

      {/* Empty state for single device with no transfers */}
      {deviceHistory && deviceHistory.transfers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <TransferIcon />
          <p className="mt-2">Este dispositivo no tiene historial de transferencias</p>
        </div>
      )}
    </div>
  )
}
