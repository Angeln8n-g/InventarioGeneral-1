'use client'

import React, { useState, useMemo } from 'react'
import { EnhancedMetricCard } from './EnhancedMetricCard'
import { UnifiedChart } from './UnifiedChart'
import { UnifiedDataTable } from './UnifiedDataTable'
import type {
  ClassroomsSectionProps,
  ClassroomsSummary,
  ClassroomDeviceAssignment,
  ClassroomDevice,
  ChartData,
  ColumnConfig,
} from '@/types/unified-dashboard'

interface ClassroomsSectionExtendedProps extends ClassroomsSectionProps {
  summary?: ClassroomsSummary
  classroomAssignments?: ClassroomDeviceAssignment[]
  loading?: boolean
}

// Icons
const ClassroomIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const DevicesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const AssignmentsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const CalendarIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const AvailableIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const WifiIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
)

export function ClassroomsSection({
  filters,
  summary,
  classroomAssignments = [],
  selectedClassroom,
  onClassroomSelect,
  loading = false,
}: ClassroomsSectionExtendedProps) {
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('classroomName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const metrics = useMemo(
    () => [
      {
        title: 'Total Aulas',
        value: summary?.total ?? 0,
        icon: <ClassroomIcon />,
        color: 'blue' as const,
      },
      {
        title: 'Disponibles Ahora',
        value: summary?.availableNow ?? 0,
        icon: <AvailableIcon />,
        color: 'green' as const,
      },
      {
        title: 'Reservadas Ahora',
        value: summary?.reservedNow ?? 0,
        icon: <CalendarIcon />,
        color: 'red' as const,
      },
      {
        title: 'Reservas del Mes',
        value: summary?.reservationsThisMonth ?? 0,
        icon: <CalendarIcon />,
        color: 'purple' as const,
      },
      {
        title: 'Servicios Internet',
        value: summary?.internetServices ?? 0,
        icon: <WifiIcon />,
        color: 'orange' as const,
      },
      {
        title: 'Total Dispositivos',
        value: summary?.totalAssignments ?? 0,
        icon: <DevicesIcon />,
        color: 'yellow' as const,
      },
    ],
    [summary]
  )

  // Device distribution by classroom chart
  const distributionChartData: ChartData = useMemo(() => {
    const sortedAssignments = [...classroomAssignments]
      .sort((a, b) => b.totalDevices - a.totalDevices)
      .slice(0, 10)

    return {
      labels: sortedAssignments.map((c) => c.classroomName),
      datasets: [
        {
          label: 'Dispositivos por Aula',
          data: sortedAssignments.map((c) => c.totalDevices),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
        },
      ],
    }
  }, [classroomAssignments])

  // Classroom table columns
  const classroomColumns: ColumnConfig<ClassroomDeviceAssignment>[] = useMemo(
    () => [
      {
        key: 'classroomName',
        header: 'Aula',
        sortable: true,
        searchable: true,
      },
      { key: 'building', header: 'Edificio', sortable: true, searchable: true },
      { key: 'floor', header: 'Piso', sortable: true },
      { key: 'totalDevices', header: 'Dispositivos', sortable: true },
    ],
    []
  )

  // Device table columns (for selected classroom)
  const deviceColumns: ColumnConfig<ClassroomDevice>[] = useMemo(
    () => [
      {
        key: 'deviceName',
        header: 'Dispositivo',
        sortable: true,
        searchable: true,
      },
      { key: 'brand', header: 'Marca', sortable: true, searchable: true },
      { key: 'model', header: 'Modelo', sortable: true, searchable: true },
      {
        key: 'serialNumber',
        header: 'N° Serie',
        sortable: true,
        searchable: true,
      },
      {
        key: 'status',
        header: 'Estado',
        sortable: true,
        render: (value) => {
          const status = value as string
          const colorMap: Record<string, string> = {
            activo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            inactivo: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
            mantenimiento: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          }
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[status.toLowerCase()] || colorMap.activo}`}>
              {status}
            </span>
          )
        },
      },
      {
        key: 'assignedDate',
        header: 'Fecha Asignación',
        sortable: true,
        render: (value) => {
          if (!value) return '-'
          return new Date(value as string).toLocaleDateString('es-ES')
        },
      },
    ],
    []
  )

  // Filtered and sorted classroom data
  const filteredClassrooms = useMemo(() => {
    let data = [...classroomAssignments]

    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(
        (item) =>
          item.classroomName.toLowerCase().includes(search) ||
          item.building?.toLowerCase().includes(search) ||
          item.floor?.toLowerCase().includes(search)
      )
    }

    data.sort((a, b) => {
      const aVal = a[sortField as keyof ClassroomDeviceAssignment]
      const bVal = b[sortField as keyof ClassroomDeviceAssignment]

      if (aVal === undefined || aVal === null) return sortDirection === 'asc' ? 1 : -1
      if (bVal === undefined || bVal === null) return sortDirection === 'asc' ? -1 : 1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    return data
  }, [classroomAssignments, tableSearch, sortField, sortDirection])

  const pageSize = 10
  const paginatedClassrooms = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return filteredClassrooms.slice(start, start + pageSize)
  }, [filteredClassrooms, tablePage])

  // Get selected classroom data
  const selectedClassroomData = useMemo(() => {
    if (!selectedClassroom) return null
    return classroomAssignments.find((c) => c.classroomId === selectedClassroom)
  }, [classroomAssignments, selectedClassroom])

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <EnhancedMetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            loading={loading}
          />
        ))}
      </div>

      {/* Distribution Chart */}
      <UnifiedChart
        type="bar"
        data={distributionChartData}
        title="Distribución de Dispositivos por Aula (Top 10)"
        loading={loading}
        height={300}
      />

      {/* Classrooms Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lista de Aulas
        </h3>
        <UnifiedDataTable
          data={paginatedClassrooms}
          columns={classroomColumns}
          loading={loading}
          searchable
          onSearch={setTableSearch}
          pagination={{
            page: tablePage,
            pageSize,
            total: filteredClassrooms.length,
            onPageChange: setTablePage,
          }}
          sorting={{
            field: sortField,
            direction: sortDirection,
            onSort: handleSort,
          }}
          onRowClick={(row) => onClassroomSelect(row.classroomId)}
          emptyMessage="No se encontraron aulas"
        />
      </div>

      {/* Selected Classroom Devices */}
      {selectedClassroomData && (
        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dispositivos en {selectedClassroomData.classroomName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedClassroomData.building && `${selectedClassroomData.building} - `}
                {selectedClassroomData.floor && `Piso ${selectedClassroomData.floor}`}
              </p>
            </div>
            <button
              onClick={() => onClassroomSelect(0)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cerrar
            </button>
          </div>
          <UnifiedDataTable
            data={selectedClassroomData.devices}
            columns={deviceColumns}
            loading={loading}
            emptyMessage="No hay dispositivos asignados a esta aula"
          />
        </div>
      )}
    </div>
  )
}
