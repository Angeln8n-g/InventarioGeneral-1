'use client'

import React, { useState, useMemo } from 'react'
import { EnhancedMetricCard } from './EnhancedMetricCard'
import { UnifiedChart } from './UnifiedChart'
import { UnifiedDataTable } from './UnifiedDataTable'
import type {
  MaintenanceSectionProps,
  MaintenanceReport,
  DeviceMovementRecord,
  DeviceCombinationRecord,
  ChartData,
  ColumnConfig,
} from '@/types/unified-dashboard'

type ActiveTab = 'maintenance' | 'movements' | 'combinations'

// Icons
const MaintenanceIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const PendingIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const InProgressIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const CompletedIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const MovementIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const technicianTypeLabels: Record<string, string> = {
  internal: 'Interno',
  external: 'Externo',
}


// Add icon for creating new report
const PlusIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface CreateReportFormData {
  deviceId: string
  issueDescription: string
  technicianType: 'internal' | 'external'
  technicianName: string
  technicianCompany: string
}

interface DeviceOption {
  id: number
  name: string
  brand: string
  model: string
  serialNumber: string
  currentClassroomId?: number
  currentClassroomName?: string
}

interface UpdateStatusData {
  id: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  resolutionNotes?: string
  cost?: number
}

interface CreateMovementFormData {
  deviceId: string
  fromClassroomId: string
  toClassroomId: string
  reason: string
}

interface ClassroomOption {
  id: number
  name: string
  building?: string
}

interface ExtendedMaintenanceSectionProps extends MaintenanceSectionProps {
  availableDevices?: DeviceOption[]
  availableClassrooms?: ClassroomOption[]
  onCreateReport?: (data: CreateReportFormData) => Promise<void>
  onUpdateStatus?: (data: UpdateStatusData) => Promise<void>
  onCreateMovement?: (data: CreateMovementFormData) => Promise<void>
}

export function MaintenanceSection({
  filters,
  summary,
  maintenanceReports = [],
  deviceMovements = [],
  deviceCombinations = [],
  availableDevices = [],
  availableClassrooms = [],
  loading = false,
  onDrillDown,
  onCreateReport,
  onUpdateStatus,
  onCreateMovement,
}: ExtendedMaintenanceSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('maintenance')
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('reportDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<MaintenanceReport | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState<CreateReportFormData>({
    deviceId: '',
    issueDescription: '',
    technicianType: 'internal',
    technicianName: '',
    technicianCompany: '',
  })
  const [statusFormData, setStatusFormData] = useState<{
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    resolutionNotes: string
    cost: string
  }>({
    status: 'pending',
    resolutionNotes: '',
    cost: '',
  })
  const [movementFormData, setMovementFormData] = useState<CreateMovementFormData>({
    deviceId: '',
    fromClassroomId: '',
    toClassroomId: '',
    reason: '',
  })

  const metrics = useMemo(() => [
    {
      title: 'Total Reportes',
      value: summary?.total ?? 0,
      icon: <MaintenanceIcon />,
      color: 'blue' as const,
      metric: 'total',
    },
    {
      title: 'Pendientes',
      value: summary?.pending ?? 0,
      icon: <PendingIcon />,
      color: 'yellow' as const,
      metric: 'pending',
    },
    {
      title: 'En Progreso',
      value: summary?.inProgress ?? 0,
      icon: <InProgressIcon />,
      color: 'purple' as const,
      metric: 'in_progress',
    },
    {
      title: 'Completados',
      value: summary?.completed ?? 0,
      icon: <CompletedIcon />,
      color: 'green' as const,
      metric: 'completed',
    },
  ], [summary])

  // Status distribution chart
  const statusChartData: ChartData = useMemo(() => ({
    labels: ['Pendientes', 'En Progreso', 'Completados'],
    datasets: [{
      label: 'Reportes por Estado',
      data: [summary?.pending ?? 0, summary?.inProgress ?? 0, summary?.completed ?? 0],
      backgroundColor: [
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
      ],
    }],
  }), [summary])

  // Technician type chart
  const technicianChartData: ChartData = useMemo(() => {
    const byType = summary?.byTechnicianType ?? []
    return {
      labels: byType.map(t => technicianTypeLabels[t.type] || t.type),
      datasets: [{
        label: 'Por Tipo de Técnico',
        data: byType.map(t => t.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      }],
    }
  }, [summary])

  // Handle opening status modal
  const handleOpenStatusModal = (report: MaintenanceReport) => {
    setSelectedReport(report)
    setStatusFormData({
      status: report.status,
      resolutionNotes: '',
      cost: '',
    })
    setShowStatusModal(true)
  }

  // Handle status update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onUpdateStatus || !selectedReport) return

    setIsSubmitting(true)
    try {
      await onUpdateStatus({
        id: selectedReport.id,
        status: statusFormData.status,
        resolutionNotes: statusFormData.resolutionNotes || undefined,
        cost: statusFormData.cost ? parseFloat(statusFormData.cost) : undefined,
      })
      setSubmitMessage({ type: 'success', text: 'Estado actualizado exitosamente' })
      setShowStatusModal(false)
      setSelectedReport(null)
      setTimeout(() => setSubmitMessage(null), 5000)
    } catch (error) {
      console.error('Error updating status:', error)
      setSubmitMessage({ type: 'error', text: 'Error al actualizar el estado' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Maintenance reports columns
  const maintenanceColumns: ColumnConfig<MaintenanceReport>[] = useMemo(() => [
    { key: 'deviceName', header: 'Dispositivo', sortable: true, searchable: true },
    { key: 'brand', header: 'Marca', sortable: true, searchable: true },
    { key: 'issueDescription', header: 'Problema', sortable: true, searchable: true },
    {
      key: 'reportDate',
      header: 'Fecha Reporte',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString('es-ES'),
    },
    { key: 'technicianName', header: 'Técnico', sortable: true, searchable: true },
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
    {
      key: 'id',
      header: 'Acciones',
      render: (value, row) => {
        const report = row as MaintenanceReport
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleOpenStatusModal(report)
            }}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            Cambiar Estado
          </button>
        )
      },
    },
  ], [])

  // Device movements columns
  const movementColumns: ColumnConfig<DeviceMovementRecord>[] = useMemo(() => [
    { key: 'deviceName', header: 'Dispositivo', sortable: true, searchable: true },
    { key: 'serialNumber', header: 'N° Serie', sortable: true, searchable: true },
    {
      key: 'fromClassroom',
      header: 'Desde',
      render: (value) => {
        const classroom = value as DeviceMovementRecord['fromClassroom']
        return classroom?.name || 'Sin asignar'
      },
    },
    {
      key: 'toClassroom',
      header: 'Hacia',
      render: (value) => {
        const classroom = value as DeviceMovementRecord['toClassroom']
        return classroom?.name || '-'
      },
    },
    {
      key: 'movedAt',
      header: 'Fecha',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString('es-ES'),
    },
    {
      key: 'movedBy',
      header: 'Movido Por',
      render: (value) => {
        const user = value as DeviceMovementRecord['movedBy']
        return user?.username || '-'
      },
    },
    { key: 'reason', header: 'Razón', searchable: true },
  ], [])

  // Device combinations columns
  const combinationColumns: ColumnConfig<DeviceCombinationRecord>[] = useMemo(() => [
    {
      key: 'device1',
      header: 'Dispositivo 1',
      render: (value) => {
        const device = value as DeviceCombinationRecord['device1']
        return `${device.name} (${device.brand})`
      },
    },
    {
      key: 'device2',
      header: 'Dispositivo 2',
      render: (value) => {
        const device = value as DeviceCombinationRecord['device2']
        return `${device.name} (${device.brand})`
      },
    },
    { key: 'combinationType', header: 'Tipo', sortable: true },
    {
      key: 'classroom',
      header: 'Aula',
      render: (value) => {
        const classroom = value as DeviceCombinationRecord['classroom']
        return classroom?.name || '-'
      },
    },
    {
      key: 'combinedAt',
      header: 'Fecha',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString('es-ES'),
    },
    {
      key: 'combinedBy',
      header: 'Combinado Por',
      render: (value) => {
        const user = value as DeviceCombinationRecord['combinedBy']
        return user?.username || '-'
      },
    },
  ], [])

  // Filter and sort data based on active tab
  const filteredData = useMemo(() => {
    let data: unknown[] = []
    
    switch (activeTab) {
      case 'maintenance':
        data = [...maintenanceReports]
        break
      case 'movements':
        data = [...deviceMovements]
        break
      case 'combinations':
        data = [...deviceCombinations]
        break
    }

    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter((item: unknown) => {
        const record = item as Record<string, unknown>
        return Object.values(record).some(val => 
          String(val).toLowerCase().includes(search)
        )
      })
    }

    return data
  }, [activeTab, maintenanceReports, deviceMovements, deviceCombinations, tableSearch])

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

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setTablePage(1)
    setTableSearch('')
  }

  const handleFormChange = (field: keyof CreateReportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onCreateReport) return
    
    setIsSubmitting(true)
    setSubmitMessage(null)
    try {
      await onCreateReport(formData)
      setSubmitMessage({ type: 'success', text: 'Reporte de mantenimiento creado exitosamente' })
      setShowCreateModal(false)
      setFormData({
        deviceId: '',
        issueDescription: '',
        technicianType: 'internal',
        technicianName: '',
        technicianCompany: '',
      })
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitMessage(null), 5000)
    } catch (error) {
      console.error('Error creating report:', error)
      setSubmitMessage({ type: 'error', text: 'Error al crear el reporte. Por favor intente de nuevo.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      deviceId: '',
      issueDescription: '',
      technicianType: 'internal',
      technicianName: '',
      technicianCompany: '',
    })
    setShowCreateModal(false)
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
            onClick={() => onDrillDown(metric.metric, { filters })}
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
          data={technicianChartData}
          title="Por Tipo de Técnico"
          loading={loading}
          height={280}
        />
      </div>

      {/* Success/Error Message */}
      {submitMessage && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          submitMessage.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {submitMessage.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{submitMessage.text}</span>
          </div>
          <button 
            onClick={() => setSubmitMessage(null)}
            className="text-current hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowMovementModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <MovementIcon />
          Registrar Movimiento
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusIcon />
          Crear Reporte de Avería
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4">
          {[
            { id: 'maintenance' as ActiveTab, label: 'Equipos Averiados', icon: <MaintenanceIcon /> },
            { id: 'movements' as ActiveTab, label: 'Historial de Movimientos', icon: <MovementIcon /> },
            { id: 'combinations' as ActiveTab, label: 'Combinaciones', icon: <CompletedIcon /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="w-5 h-5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Data Table */}
      <div className="space-y-4">
        <UnifiedDataTable
          data={paginatedData as MaintenanceReport[] | DeviceMovementRecord[] | DeviceCombinationRecord[]}
          columns={
            activeTab === 'maintenance' 
              ? maintenanceColumns as ColumnConfig<MaintenanceReport | DeviceMovementRecord | DeviceCombinationRecord>[]
              : activeTab === 'movements'
              ? movementColumns as ColumnConfig<MaintenanceReport | DeviceMovementRecord | DeviceCombinationRecord>[]
              : combinationColumns as ColumnConfig<MaintenanceReport | DeviceMovementRecord | DeviceCombinationRecord>[]
          }
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
          onRowClick={(row) => onDrillDown(`${activeTab}_detail`, row)}
          emptyMessage={
            activeTab === 'maintenance' 
              ? 'No hay reportes de mantenimiento'
              : activeTab === 'movements'
              ? 'No hay movimientos registrados'
              : 'No hay combinaciones registradas'
          }
        />
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowStatusModal(false)}
            />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Actualizar Estado del Reporte
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Dispositivo:</span> {selectedReport.deviceName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Problema:</span> {selectedReport.issueDescription}
                </p>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nuevo Estado *
                  </label>
                  <select
                    value={statusFormData.status}
                    onChange={(e) => setStatusFormData(prev => ({ 
                      ...prev, 
                      status: e.target.value as UpdateStatusData['status']
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                {statusFormData.status === 'completed' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notas de Resolución
                      </label>
                      <textarea
                        value={statusFormData.resolutionNotes}
                        onChange={(e) => setStatusFormData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                        rows={3}
                        placeholder="Describa cómo se resolvió el problema..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Costo de Reparación ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={statusFormData.cost}
                        onChange={(e) => setStatusFormData(prev => ({ ...prev, cost: e.target.value }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={resetForm}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Crear Reporte de Equipo Averiado
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                {/* Device Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dispositivo *
                  </label>
                  <select
                    value={formData.deviceId}
                    onChange={(e) => handleFormChange('deviceId', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar dispositivo...</option>
                    {availableDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name} - {device.brand} {device.model} ({device.serialNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Issue Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción del Problema *
                  </label>
                  <textarea
                    value={formData.issueDescription}
                    onChange={(e) => handleFormChange('issueDescription', e.target.value)}
                    required
                    rows={3}
                    placeholder="Describa el problema del equipo..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Technician Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Técnico *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="technicianType"
                        value="internal"
                        checked={formData.technicianType === 'internal'}
                        onChange={(e) => handleFormChange('technicianType', e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Interno</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="technicianType"
                        value="external"
                        checked={formData.technicianType === 'external'}
                        onChange={(e) => handleFormChange('technicianType', e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Externo</span>
                    </label>
                  </div>
                </div>

                {/* Technician Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Técnico *
                  </label>
                  <input
                    type="text"
                    value={formData.technicianName}
                    onChange={(e) => handleFormChange('technicianName', e.target.value)}
                    required
                    placeholder="Nombre del técnico asignado"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Company (for external technicians) */}
                {formData.technicianType === 'external' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Empresa del Técnico
                    </label>
                    <input
                      type="text"
                      value={formData.technicianCompany}
                      onChange={(e) => handleFormChange('technicianCompany', e.target.value)}
                      placeholder="Nombre de la empresa"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Reporte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => {
                setShowMovementModal(false)
                setMovementFormData({ deviceId: '', fromClassroomId: '', toClassroomId: '', reason: '' })
              }}
            />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registrar Movimiento de Dispositivo
                </h3>
                <button
                  onClick={() => {
                    setShowMovementModal(false)
                    setMovementFormData({ deviceId: '', fromClassroomId: '', toClassroomId: '', reason: '' })
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!onCreateMovement) return
                
                setIsSubmitting(true)
                try {
                  await onCreateMovement(movementFormData)
                  setSubmitMessage({ type: 'success', text: 'Movimiento registrado exitosamente' })
                  setShowMovementModal(false)
                  setMovementFormData({ deviceId: '', fromClassroomId: '', toClassroomId: '', reason: '' })
                  setTimeout(() => setSubmitMessage(null), 5000)
                } catch (error) {
                  console.error('Error creating movement:', error)
                  setSubmitMessage({ type: 'error', text: 'Error al registrar el movimiento' })
                } finally {
                  setIsSubmitting(false)
                }
              }} className="space-y-4">
                {/* Device Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dispositivo *
                  </label>
                  <select
                    value={movementFormData.deviceId}
                    onChange={(e) => {
                      const selectedDeviceId = e.target.value
                      const selectedDevice = availableDevices.find(d => d.id.toString() === selectedDeviceId)
                      setMovementFormData(prev => ({
                        ...prev,
                        deviceId: selectedDeviceId,
                        fromClassroomId: selectedDevice?.currentClassroomId?.toString() || '',
                      }))
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar dispositivo...</option>
                    {availableDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name} - {device.brand} {device.model} ({device.serialNumber})
                        {device.currentClassroomName ? ` - ${device.currentClassroomName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* From Classroom - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aula de Origen
                  </label>
                  <input
                    type="text"
                    value={
                      movementFormData.fromClassroomId
                        ? availableClassrooms.find(c => c.id.toString() === movementFormData.fromClassroomId)?.name || 'Aula no encontrada'
                        : 'Sin asignar / Almacén'
                    }
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El aula de origen se determina automáticamente según la ubicación actual del dispositivo
                  </p>
                </div>

                {/* To Classroom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aula de Destino *
                  </label>
                  <select
                    value={movementFormData.toClassroomId}
                    onChange={(e) => setMovementFormData(prev => ({ ...prev, toClassroomId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar aula destino...</option>
                    {availableClassrooms
                      .filter(c => c.id.toString() !== movementFormData.fromClassroomId)
                      .map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} {classroom.building ? `(${classroom.building})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Razón del Movimiento *
                  </label>
                  <textarea
                    value={movementFormData.reason}
                    onChange={(e) => setMovementFormData(prev => ({ ...prev, reason: e.target.value }))}
                    required
                    rows={3}
                    placeholder="Describa la razón del movimiento..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMovementModal(false)
                      setMovementFormData({ deviceId: '', fromClassroomId: '', toClassroomId: '', reason: '' })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
