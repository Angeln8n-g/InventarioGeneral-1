'use client'

// Updated: consumablesDetailData now includes totalConsumed - v2
import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { GlobalFilters } from './GlobalFilters'
import { OverviewSection } from './OverviewSection'
import { ToolsSection } from './ToolsSection'
import { ConsumablesSection } from './ConsumablesSection'
import { LoansSection } from './LoansSection'
import { ElectronicsSection } from './ElectronicsSection'
import { ClassroomsSection } from './ClassroomsSection'
import { TopUsersSection } from './TopUsersSection'
import { UserConsumptionSection } from './UserConsumptionSection'
import { MaintenanceSection } from './MaintenanceSection'
import {
  useGetDashboardStatsQuery,
  useGetAlertsStatisticsQuery,
  useGetTopUsersStatisticsQuery,
  useGetClassroomsQuery,
  useGetElectronicsQuery,
  useGetDeviceAssignmentsQuery,
  useGetConsumablesQuery,
  useGetAllActiveLoansQuery,
  useGetInventoryStatisticsQuery,
  useGetUserConsumptionQuery,
  useGetDeviceCombinationsQuery,
  useGetMaintenanceReportsQuery,
  useCreateMaintenanceReportMutation,
  useUpdateMaintenanceReportMutation,
  useGetDeviceMovementHistoryQuery,
  useCreateDeviceMovementMutation,
  useGetAvailableToolsQuery,
} from '@/services/api'
import type {
  DashboardSection,
  GlobalFilters as GlobalFiltersType,
  UnifiedDashboardProps,
  DashboardSummary,
  UnifiedAlert,
} from '@/types/unified-dashboard'

// Tab configuration
const tabs: { id: DashboardSection; label: string; icon: React.ReactNode }[] = [
  {
    id: 'overview',
    label: 'Resumen',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'tools',
    label: 'Herramientas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'consumables',
    label: 'Consumibles',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'loans',
    label: 'Préstamos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    id: 'electronics',
    label: 'Electrónicos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'classrooms',
    label: 'Aulas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'maintenance',
    label: 'Mantenimiento',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const defaultFilters: GlobalFiltersType = {
  dateRange: { type: 'month' },
  category: undefined,
}

export function UnifiedDashboardContainer({ initialSection = 'overview' }: UnifiedDashboardProps) {
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const [activeSection, setActiveSection] = useState<DashboardSection>(initialSection)
  const [filters, setFilters] = useState<GlobalFiltersType>(defaultFilters)
  const [selectedClassroom, setSelectedClassroom] = useState<number | undefined>()

  // Fetch dashboard data
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery()
  const { data: alertsData, isLoading: alertsLoading } = useGetAlertsStatisticsQuery()
  const { data: topUsersData, isLoading: topUsersLoading } = useGetTopUsersStatisticsQuery({
    limit: 20,
    filterBy: 'all',
  })
  const { data: classroomsData, isLoading: classroomsLoading } = useGetClassroomsQuery()
  const { data: electronicsData, isLoading: electronicsLoading } = useGetElectronicsQuery()
  const { data: assignmentsData } = useGetDeviceAssignmentsQuery()
  const { data: consumablesData, isLoading: consumablesLoading } = useGetConsumablesQuery()
  const { data: loansData, isLoading: loansLoading } = useGetAllActiveLoansQuery()
  const { data: inventoryData, isLoading: inventoryLoading } = useGetInventoryStatisticsQuery()
  const { data: userConsumptionData, isLoading: userConsumptionLoading } = useGetUserConsumptionQuery({ filters })
  const { data: combinationsData, isLoading: combinationsLoading } = useGetDeviceCombinationsQuery()
  const { data: maintenanceData, isLoading: maintenanceLoading, refetch: refetchMaintenance } = useGetMaintenanceReportsQuery({})
  const { data: movementsData, isLoading: movementsLoading, refetch: refetchMovements } = useGetDeviceMovementHistoryQuery({})
  const { data: toolsData, isLoading: toolsLoading } = useGetAvailableToolsQuery()
  const [createMaintenanceReport] = useCreateMaintenanceReportMutation()
  const [updateMaintenanceReport] = useUpdateMaintenanceReportMutation()
  const [createDeviceMovement] = useCreateDeviceMovementMutation()

  // Transform electronics data for summary
  const electronicsSummary = React.useMemo(() => {
    if (!electronicsData?.data) return { total: 0, assigned: 0, unassigned: 0, byBrand: [], byStatus: [] }
    
    const devices = electronicsData.data
    const assigned = devices.filter(d => (d as any).current_assignment).length
    
    // Group by brand
    const brandCounts: Record<string, number> = {}
    devices.forEach(d => {
      const brand = d.brand || 'Sin marca'
      brandCounts[brand] = (brandCounts[brand] || 0) + 1
    })
    const byBrand = Object.entries(brandCounts).map(([brand, count]) => ({ brand, count }))
    
    // Group by status
    const statusCounts: Record<string, number> = {}
    devices.forEach(d => {
      const status = d.tool_instance?.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    
    return {
      total: devices.length,
      assigned,
      unassigned: devices.length - assigned,
      byBrand,
      byStatus,
    }
  }, [electronicsData])

  // Transform classrooms data for summary
  const classroomsSummary = React.useMemo(() => {
    if (!classroomsData?.data) return { 
      total: 0, 
      withDevices: 0, 
      totalAssignments: 0,
      totalReservations: 0,
      activeReservations: 0,
      reservedNow: 0,
      availableNow: 0,
      reservationsThisMonth: 0,
      internetServices: 0,
    }
    
    const classrooms = classroomsData.data
    
    // Count classrooms with devices based on electronics data
    const classroomsWithDevicesSet = new Set<number>()
    electronicsData?.data?.forEach(d => {
      if ((d as any).current_assignment?.classroom?.id) {
        classroomsWithDevicesSet.add((d as any).current_assignment.classroom.id)
      }
    })
    
    const withDevices = classroomsWithDevicesSet.size
    const totalAssignments = assignmentsData?.count || electronicsData?.data?.filter(d => (d as any).current_assignment).length || 0
    
    // Get reservation metrics from classrooms data (if available)
    const reservedNow = classrooms.filter((c: any) => c.is_reserved).length
    const availableNow = classrooms.length - reservedNow
    
    return {
      total: classrooms.length,
      withDevices,
      totalAssignments,
      totalReservations: (classroomsData as any).reservationStats?.total || 0,
      activeReservations: (classroomsData as any).reservationStats?.active || 0,
      reservedNow,
      availableNow,
      reservationsThisMonth: (classroomsData as any).reservationStats?.thisMonth || 0,
      internetServices: (classroomsData as any).internetServicesCount || 0,
    }
  }, [classroomsData, assignmentsData, electronicsData])

  // Transform classroom assignments for the ClassroomsSection
  const classroomAssignments = React.useMemo(() => {
    if (!classroomsData?.data) return []
    
    return classroomsData.data.map(classroom => {
      // Get devices assigned to this classroom
      const classroomDevices = electronicsData?.data?.filter(
        d => (d as any).current_assignment?.classroom?.id === classroom.id
      ) || []
      
      return {
        classroomId: classroom.id,
        classroomName: classroom.name,
        building: classroom.building || '',
        floor: classroom.floor || '',
        totalDevices: classroomDevices.length,
        devices: classroomDevices.map(d => ({
          deviceId: d.id,
          deviceName: d.tool_instance?.item_type?.name || 'Dispositivo',
          brand: d.brand,
          model: d.model,
          serialNumber: d.serial_number,
          status: d.tool_instance?.status || 'unknown',
          assignedDate: new Date().toISOString(),
        })),
      }
    })
  }, [classroomsData, electronicsData])

  // Transform electronics data for the ElectronicsSection
  const devicesData = React.useMemo(() => {
    if (!electronicsData?.data) return []
    
    return electronicsData.data.map(d => ({
      id: d.id,
      name: d.tool_instance?.item_type?.name || 'Dispositivo',
      brand: d.brand,
      model: d.model,
      serialNumber: d.serial_number,
      status: d.tool_instance?.status || 'unknown',
      currentClassroom: (d as any).current_assignment?.classroom?.name || null,
      currentClassroomId: (d as any).current_assignment?.classroom?.id || null,
      assignedDate: null,
    }))
  }, [electronicsData])

  // Transform consumables data for the ConsumablesSection
  // Transform tools data for the ToolsSection
  const toolsDetailData = React.useMemo(() => {
    if (!toolsData?.data) return []
    
    // Get loaned counts from active loans
    const loanedByType: Record<number, number> = {}
    loansData?.data?.forEach(loan => {
      const typeId = loan.tool_instance?.item_type?.id
      if (typeId && !loan.return_date) {
        loanedByType[typeId] = (loanedByType[typeId] || 0) + 1
      }
    })
    
    return toolsData.data.map(tool => ({
      id: tool.item_type_id,
      name: tool.name,
      category: tool.category || 'Sin categoría',
      status: tool.available_count > 0 ? 'Disponible' : 'Sin stock',
      totalInstances: tool.available_count + (loanedByType[tool.item_type_id] || 0),
      availableInstances: tool.available_count,
      loanedInstances: loanedByType[tool.item_type_id] || 0,
    }))
  }, [toolsData, loansData])

  const consumablesDetailData = React.useMemo(() => {
    if (!inventoryData?.data) return []
    
    return inventoryData.data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category || 'Sin categoría',
      currentStock: item.currentStock,
      minimumThreshold: item.minimumThreshold,
      unitOfMeasure: item.unitOfMeasure,
      status: item.status,
      totalConsumed: item.totalConsumed || 0,
      avgDailyConsumption: item.avgDailyConsumption || 0,
    }))
  }, [inventoryData])

  // Transform loans data for the LoansSection
  const loansDetailData = React.useMemo(() => {
    if (!loansData?.data) return []
    
    return loansData.data.map(loan => {
      const now = new Date()
      const dueDate = new Date(loan.due_date)
      const isOverdue = !loan.return_date && dueDate < now
      
      return {
        id: loan.id,
        toolName: loan.tool_instance?.item_type?.name || 'Herramienta',
        userName: loan.user?.username || 'Usuario',
        userEmail: loan.user?.email || '',
        loanDate: loan.loan_date,
        dueDate: loan.due_date,
        returnedDate: loan.return_date || null,
        status: loan.return_date ? 'returned' : (isOverdue ? 'overdue' : 'active') as 'active' | 'overdue' | 'returned',
      }
    })
  }, [loansData])

  // Transform user consumption data
  const usersConsumptionData = React.useMemo(() => {
    if (!userConsumptionData?.data) return []
    
    return userConsumptionData.data.map(user => ({
      userId: user.userId,
      username: user.username,
      email: user.email,
      totalQuantity: user.totalQuantity,
      totalCost: user.totalCost,
      byType: user.byType || [],
      trend: user.trend || [],
    }))
  }, [userConsumptionData])

  // Transform maintenance data - use real API data or fallback to device status
  const maintenanceReports = React.useMemo(() => {
    // If we have real maintenance reports from API, use them
    if (maintenanceData?.data && maintenanceData.data.length > 0) {
      return maintenanceData.data.map(report => ({
        id: report.id,
        deviceId: report.deviceId,
        deviceName: report.deviceName,
        serialNumber: report.serialNumber,
        brand: report.brand,
        model: report.model,
        issueDescription: report.issueDescription,
        reportDate: report.reportDate,
        status: report.status,
        technicianType: report.technicianType,
        technicianName: report.technicianName,
        technicianCompany: report.technicianCompany,
        resolutionDate: report.resolutionDate,
        resolutionNotes: report.resolutionNotes,
        cost: report.cost,
        reportedBy: { id: 0, username: report.createdBy },
      }))
    }
    
    // Fallback: generate reports from devices with out-of-service or damaged status
    if (!electronicsData?.data) return []
    
    return electronicsData.data
      .filter(d => d.tool_instance?.status === 'out-of-service' || d.tool_instance?.status === 'damaged')
      .map(d => ({
        id: d.id,
        deviceId: d.id,
        deviceName: d.tool_instance?.item_type?.name || 'Dispositivo',
        serialNumber: d.serial_number,
        brand: d.brand,
        model: d.model,
        issueDescription: d.tool_instance?.status === 'damaged' ? 'Equipo dañado' : 'Fuera de servicio',
        reportDate: new Date().toISOString(),
        status: 'pending' as const,
        technicianType: 'internal' as const,
        technicianName: 'Por asignar',
        reportedBy: { id: 0, username: 'Sistema' },
      }))
  }, [maintenanceData, electronicsData])

  // Maintenance summary
  const maintenanceSummary = React.useMemo(() => {
    const total = maintenanceReports.length
    const pending = maintenanceReports.filter(r => r.status === 'pending').length
    const inProgress = maintenanceReports.filter(r => r.status === 'in_progress').length
    const completed = maintenanceReports.filter(r => r.status === 'completed').length
    
    // Count by technician type
    const internalCount = maintenanceReports.filter(r => r.technicianType === 'internal').length
    const externalCount = maintenanceReports.filter(r => r.technicianType === 'external').length
    
    return {
      total,
      pending,
      inProgress,
      completed,
      byTechnicianType: [
        { type: 'internal' as const, count: internalCount },
        { type: 'external' as const, count: externalCount },
      ],
    }
  }, [maintenanceReports])

  // Transform device combinations
  const deviceCombinationsData = React.useMemo(() => {
    if (!combinationsData?.data) return []
    
    return combinationsData.data.map(c => ({
      id: c.id,
      device1: {
        id: c.device_1_id,
        name: c.device_1?.tool_instance?.item_type?.name || 'Dispositivo 1',
        brand: c.device_1?.brand || '',
        model: c.device_1?.model || '',
      },
      device2: {
        id: c.device_2_id,
        name: c.device_2?.tool_instance?.item_type?.name || 'Dispositivo 2',
        brand: c.device_2?.brand || '',
        model: c.device_2?.model || '',
      },
      combinationType: c.combination_type || 'Estación',
      classroom: c.classroom || { id: 0, name: 'Sin aula' },
      combinedAt: c.created_at,
      combinedBy: c.creator || { id: 0, username: 'Sistema' },
      notes: c.notes,
    }))
  }, [combinationsData])

  // Transform device movements data
  const deviceMovementsData = React.useMemo(() => {
    if (!movementsData?.data) return []
    
    return movementsData.data.map(m => ({
      id: m.id,
      deviceId: m.deviceId,
      deviceName: m.deviceName,
      serialNumber: m.serialNumber,
      fromClassroom: m.fromClassroom,
      toClassroom: m.toClassroom,
      movedAt: m.movedAt,
      movedBy: m.movedBy,
      reason: m.reason || '',
    }))
  }, [movementsData])

  // Transform stats to DashboardSummary format
  const dashboardSummary: DashboardSummary | undefined = statsData?.data ? {
    tools: {
      total: statsData.data.totalTools,
      available: statsData.data.availableTools,
      loaned: statsData.data.loanedTools,
      maintenance: statsData.data.maintenanceTools || 0,
      byCategory: statsData.data.toolsByCategory || [],
    },
    consumables: {
      totalTypes: statsData.data.consumableTypes,
      totalStock: statsData.data.totalConsumables,
      lowStockCount: statsData.data.lowStockItems,
      byCategory: statsData.data.consumablesByCategory || [],
    },
    loans: {
      active: statsData.data.activeLoans,
      overdue: statsData.data.overdueLoans,
      returned: 0,
      total: statsData.data.activeLoans + statsData.data.overdueLoans,
      byStatus: [],
    },
    electronics: electronicsSummary,
    classrooms: classroomsSummary,
    users: {
      total: statsData.data.totalUsers,
      active: statsData.data.totalUsers,
    },
  } : undefined

  // Transform alerts to UnifiedAlert format
  const unifiedAlerts: UnifiedAlert[] = alertsData?.data?.map((alert) => ({
    id: alert.id.toString(),
    type: alert.type === 'critical_stock' ? 'low_stock' : 
          alert.type === 'overdue_loans' ? 'overdue_loan' : 'warning',
    title: alert.title,
    message: alert.message,
    severity: alert.severity === 'critical' ? 'error' : alert.severity,
    link: alert.link,
    timestamp: alert.timestamp,
  })) ?? []

  // Transform top users
  const topUsers = topUsersData?.data?.map((user, index) => ({
    rank: user.rank || index + 1,
    userId: user.userId,
    username: user.username,
    email: user.email,
    activeLoans: user.activeLoans,
    totalConsumables: user.totalConsumables,
    totalCost: user.totalCost,
    lastActivity: new Date().toISOString(),
  })) ?? []

  // Section error states for isolation
  const [sectionErrors, setSectionErrors] = useState<Record<DashboardSection, boolean>>({
    overview: false,
    tools: false,
    consumables: false,
    loans: false,
    electronics: false,
    classrooms: false,
    users: false,
    maintenance: false,
  })

  const isLoading = statsLoading || alertsLoading || classroomsLoading || electronicsLoading

  const handleDrillDown = useCallback((metric: string, data: unknown) => {
    console.log('Drill down:', metric, data)
    // Handle drill-down navigation while preserving filters
  }, [])

  const handleSectionError = useCallback((section: DashboardSection, hasError: boolean) => {
    setSectionErrors((prev) => ({ ...prev, [section]: hasError }))
  }, [])

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection 
            filters={filters} 
            summary={dashboardSummary}
            alerts={unifiedAlerts}
            loading={isLoading}
            onNavigateToSection={setActiveSection}
          />
        )
      case 'tools':
        return (
          <ToolsSection 
            filters={filters} 
            summary={dashboardSummary?.tools}
            toolsData={toolsDetailData}
            loading={statsLoading || toolsLoading}
            onDrillDown={handleDrillDown} 
          />
        )
      case 'consumables':
        return (
          <ConsumablesSection 
            filters={filters} 
            summary={dashboardSummary?.consumables}
            consumablesData={consumablesDetailData}
            loading={statsLoading || consumablesLoading || inventoryLoading}
            onDrillDown={handleDrillDown} 
          />
        )
      case 'loans':
        return (
          <LoansSection 
            filters={filters} 
            summary={dashboardSummary?.loans}
            loansData={loansDetailData}
            loading={statsLoading || loansLoading}
            onDrillDown={handleDrillDown} 
          />
        )
      case 'electronics':
        return (
          <ElectronicsSection 
            filters={filters} 
            summary={dashboardSummary?.electronics}
            devicesData={devicesData}
            loading={statsLoading || electronicsLoading}
            onDrillDown={handleDrillDown} 
          />
        )
      case 'classrooms':
        return (
          <ClassroomsSection
            filters={filters}
            summary={dashboardSummary?.classrooms}
            classroomAssignments={classroomAssignments}
            loading={statsLoading || classroomsLoading || electronicsLoading}
            selectedClassroom={selectedClassroom}
            onClassroomSelect={setSelectedClassroom}
          />
        )
      case 'users':
        return (
          <div className="space-y-8">
            <TopUsersSection 
              filters={filters} 
              topUsers={topUsers}
              loading={topUsersLoading}
            />
            <UserConsumptionSection 
              filters={filters} 
              usersData={usersConsumptionData}
              loading={userConsumptionLoading}
            />
          </div>
        )
      case 'maintenance':
        return (
          <MaintenanceSection
            filters={filters}
            summary={maintenanceSummary}
            maintenanceReports={maintenanceReports}
            deviceMovements={deviceMovementsData}
            deviceCombinations={deviceCombinationsData}
            availableDevices={devicesData.map(d => ({
              id: d.id,
              name: d.name,
              brand: d.brand,
              model: d.model,
              serialNumber: d.serialNumber,
              currentClassroomId: d.currentClassroomId || undefined,
              currentClassroomName: d.currentClassroom || undefined,
            }))}
            availableClassrooms={classroomsData?.data?.map(c => ({
              id: c.id,
              name: c.name,
              building: (c as any).location || (c as any).building || undefined,
            })) || []}
            loading={electronicsLoading || combinationsLoading || maintenanceLoading || movementsLoading}
            onDrillDown={handleDrillDown}
            onCreateReport={async (data) => {
              try {
                await createMaintenanceReport(data).unwrap()
                refetchMaintenance()
              } catch (error) {
                console.error('Error creating maintenance report:', error)
                throw error
              }
            }}
            onUpdateStatus={async (data) => {
              try {
                await updateMaintenanceReport(data).unwrap()
                refetchMaintenance()
              } catch (error) {
                console.error('Error updating maintenance report:', error)
                throw error
              }
            }}
            onCreateMovement={async (data) => {
              try {
                await createDeviceMovement({
                  deviceId: parseInt(data.deviceId),
                  fromClassroomId: data.fromClassroomId ? parseInt(data.fromClassroomId) : undefined,
                  toClassroomId: parseInt(data.toClassroomId),
                  reason: data.reason,
                  movedBy: currentUser?.id,
                }).unwrap()
                refetchMovements()
              } catch (error) {
                console.error('Error creating device movement:', error)
                throw error
              }
            }}
          />
        )
      default:
        return (
          <OverviewSection 
            filters={filters} 
            summary={dashboardSummary}
            alerts={unifiedAlerts}
            loading={isLoading}
            onNavigateToSection={setActiveSection}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Volver al Dashboard</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Unificado de Reportes
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Vista consolidada de estadísticas y reportes del sistema de inventario
            </p>
          </div>

          {/* Global Filters */}
          <div className="pb-4">
            <GlobalFilters value={filters} onChange={setFilters} categories={[]} />
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeSection === tab.id
                const hasError = sectionErrors[tab.id]

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                      ${
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                      ${hasError ? 'text-red-500' : ''}
                    `}
                  >
                    {tab.icon}
                    {tab.label}
                    {hasError && (
                      <span className="w-2 h-2 bg-red-500 rounded-full" title="Error en esta sección" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSection()}
      </main>
    </div>
  )
}
