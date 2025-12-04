'use client'

import { useCallback } from 'react'
import * as XLSX from 'xlsx'
import type {
  ExportOptions,
  ExportResult,
  ExportSheet,
  GlobalFilters,
  DashboardSection,
  DashboardSummary,
  TopUser,
  ClassroomDeviceAssignment,
  DeviceMovement,
  UserConsumption,
} from '@/types/unified-dashboard'

interface DashboardData {
  summary?: DashboardSummary
  topUsers?: TopUser[]
  classroomAssignments?: ClassroomDeviceAssignment[]
  deviceMovements?: DeviceMovement[]
  userConsumptions?: UserConsumption[]
}

interface UseExportDashboardProps {
  data: DashboardData
  filters: GlobalFilters
  username?: string
}

// Helper to format date for filename
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

// Helper to format date range for display
function formatDateRange(filters: GlobalFilters): string {
  if (filters.dateRange.type === 'custom' && filters.dateRange.start && filters.dateRange.end) {
    return `${filters.dateRange.start} - ${filters.dateRange.end}`
  }
  return filters.dateRange.type
}

// Generate metadata sheet
function generateMetadataSheet(filters: GlobalFilters, generatedBy: string): Record<string, unknown>[] {
  return [
    { Campo: 'Fecha de Exportación', Valor: new Date().toLocaleString('es-ES') },
    { Campo: 'Rango de Fechas', Valor: formatDateRange(filters) },
    { Campo: 'Categoría', Valor: filters.category || 'Todas' },
    { Campo: 'Generado Por', Valor: generatedBy },
  ]
}

// Generate tools sheet
function generateToolsSheet(summary?: DashboardSummary): Record<string, unknown>[] {
  if (!summary?.tools) return []

  const data: Record<string, unknown>[] = [
    { Métrica: 'Total Herramientas', Valor: summary.tools.total },
    { Métrica: 'Disponibles', Valor: summary.tools.available },
    { Métrica: 'Prestadas', Valor: summary.tools.loaned },
    { Métrica: 'En Mantenimiento', Valor: summary.tools.maintenance },
    { Métrica: '', Valor: '' },
    { Métrica: 'Por Categoría', Valor: '' },
  ]

  summary.tools.byCategory.forEach((cat) => {
    data.push({ Métrica: cat.category, Valor: cat.count })
  })

  return data
}

// Generate consumables sheet
function generateConsumablesSheet(summary?: DashboardSummary): Record<string, unknown>[] {
  if (!summary?.consumables) return []

  const data: Record<string, unknown>[] = [
    { Métrica: 'Total Tipos', Valor: summary.consumables.totalTypes },
    { Métrica: 'Stock Total', Valor: summary.consumables.totalStock },
    { Métrica: 'Bajo Stock', Valor: summary.consumables.lowStockCount },
    { Métrica: '', Valor: '' },
    { Métrica: 'Por Categoría', Valor: '' },
  ]

  summary.consumables.byCategory.forEach((cat) => {
    data.push({ Métrica: cat.category, Valor: cat.count })
  })

  return data
}

// Generate loans sheet
function generateLoansSheet(summary?: DashboardSummary): Record<string, unknown>[] {
  if (!summary?.loans) return []

  const data: Record<string, unknown>[] = [
    { Métrica: 'Préstamos Activos', Valor: summary.loans.active },
    { Métrica: 'Vencidos', Valor: summary.loans.overdue },
    { Métrica: 'Devueltos', Valor: summary.loans.returned },
    { Métrica: 'Total', Valor: summary.loans.total },
    { Métrica: '', Valor: '' },
    { Métrica: 'Por Estado', Valor: '' },
  ]

  summary.loans.byStatus.forEach((status) => {
    data.push({ Métrica: status.status, Valor: status.count })
  })

  return data
}

// Generate electronics sheet
function generateElectronicsSheet(summary?: DashboardSummary): Record<string, unknown>[] {
  if (!summary?.electronics) return []

  const data: Record<string, unknown>[] = [
    { Métrica: 'Total Dispositivos', Valor: summary.electronics.total },
    { Métrica: 'Asignados', Valor: summary.electronics.assigned },
    { Métrica: 'Sin Asignar', Valor: summary.electronics.unassigned },
    { Métrica: '', Valor: '' },
    { Métrica: 'Por Marca', Valor: '' },
  ]

  summary.electronics.byBrand.forEach((brand) => {
    data.push({ Métrica: brand.brand, Valor: brand.count })
  })

  data.push({ Métrica: '', Valor: '' })
  data.push({ Métrica: 'Por Estado', Valor: '' })

  summary.electronics.byStatus.forEach((status) => {
    data.push({ Métrica: status.status, Valor: status.count })
  })

  return data
}

// Generate classrooms sheet
function generateClassroomsSheet(
  summary?: DashboardSummary,
  assignments?: ClassroomDeviceAssignment[]
): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = []

  if (summary?.classrooms) {
    data.push(
      { Aula: 'RESUMEN', Edificio: '', Piso: '', Dispositivos: '' },
      { Aula: 'Total Aulas', Edificio: '', Piso: '', Dispositivos: summary.classrooms.total },
      { Aula: 'Con Dispositivos', Edificio: '', Piso: '', Dispositivos: summary.classrooms.withDevices },
      { Aula: 'Total Asignaciones', Edificio: '', Piso: '', Dispositivos: summary.classrooms.totalAssignments },
      { Aula: '', Edificio: '', Piso: '', Dispositivos: '' },
      { Aula: 'DETALLE', Edificio: '', Piso: '', Dispositivos: '' }
    )
  }

  assignments?.forEach((classroom) => {
    data.push({
      Aula: classroom.classroomName,
      Edificio: classroom.building || '',
      Piso: classroom.floor || '',
      Dispositivos: classroom.totalDevices,
    })
  })

  return data
}

// Generate top users sheet
function generateTopUsersSheet(topUsers?: TopUser[]): Record<string, unknown>[] {
  if (!topUsers?.length) return []

  return topUsers.map((user) => ({
    Ranking: user.rank,
    Usuario: user.username,
    Email: user.email,
    'Préstamos Activos': user.activeLoans,
    Consumibles: user.totalConsumables,
    'Costo Total': user.totalCost,
    'Última Actividad': user.lastActivity,
  }))
}

// Generate user consumption sheet
function generateUserConsumptionSheet(consumptions?: UserConsumption[]): Record<string, unknown>[] {
  if (!consumptions?.length) return []

  return consumptions.map((user) => ({
    Usuario: user.username,
    Email: user.email,
    'Cantidad Total': user.totalQuantity,
    'Costo Total': user.totalCost,
  }))
}

export function useExportDashboard({ data, filters, username = 'Admin' }: UseExportDashboardProps) {
  const generateExport = useCallback(
    (options: ExportOptions): ExportResult => {
      const sheets: ExportSheet[] = []
      const { sections } = options

      // Always add metadata sheet
      sheets.push({
        name: 'Información',
        data: generateMetadataSheet(filters, username),
      })

      // Add section-specific sheets
      if (sections.includes('overview') || sections.includes('tools')) {
        sheets.push({
          name: 'Herramientas',
          data: generateToolsSheet(data.summary),
        })
      }

      if (sections.includes('overview') || sections.includes('consumables')) {
        sheets.push({
          name: 'Consumibles',
          data: generateConsumablesSheet(data.summary),
        })
      }

      if (sections.includes('overview') || sections.includes('loans')) {
        sheets.push({
          name: 'Préstamos',
          data: generateLoansSheet(data.summary),
        })
      }

      if (sections.includes('overview') || sections.includes('electronics')) {
        sheets.push({
          name: 'Electrónicos',
          data: generateElectronicsSheet(data.summary),
        })
      }

      if (sections.includes('overview') || sections.includes('classrooms')) {
        sheets.push({
          name: 'Aulas',
          data: generateClassroomsSheet(data.summary, data.classroomAssignments),
        })
      }

      if (sections.includes('users')) {
        sheets.push({
          name: 'Top Usuarios',
          data: generateTopUsersSheet(data.topUsers),
        })

        if (data.userConsumptions?.length) {
          sheets.push({
            name: 'Consumo por Usuario',
            data: generateUserConsumptionSheet(data.userConsumptions),
          })
        }
      }

      const filename = `dashboard_report_${formatDateForFilename(new Date())}.xlsx`

      return {
        filename,
        sheets,
        metadata: {
          exportDate: new Date().toISOString(),
          filters,
          generatedBy: username,
        },
      }
    },
    [data, filters, username]
  )

  const exportToExcel = useCallback(
    (sections: DashboardSection[] = ['overview']) => {
      const result = generateExport({ sections, filters, format: 'xlsx' })

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Add sheets
      result.sheets.forEach((sheet) => {
        if (sheet.data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(sheet.data)
          XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31)) // Excel sheet name limit
        }
      })

      // Download file
      XLSX.writeFile(wb, result.filename)

      return result
    },
    [generateExport, filters]
  )

  const exportSection = useCallback(
    (section: DashboardSection) => {
      return exportToExcel([section])
    },
    [exportToExcel]
  )

  const exportAll = useCallback(() => {
    return exportToExcel(['overview', 'tools', 'consumables', 'loans', 'electronics', 'classrooms', 'users'])
  }, [exportToExcel])

  return {
    generateExport,
    exportToExcel,
    exportSection,
    exportAll,
  }
}
