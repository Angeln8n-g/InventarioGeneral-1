import * as XLSX from 'xlsx'
import type { LoanReportData, ToolReportData, ConsumableReportData, ReportFilters } from '@/types/reports'

export async function generateLoanReportExcel(
  data: LoanReportData,
  filters: ReportFilters
): Promise<Blob> {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = [
    ['Historial de Préstamos'],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [],
    ['Métricas Clave'],
    ['Total de Préstamos', data.metrics.totalLoans],
    ['Préstamos Activos', data.metrics.activeLoans],
    ['Préstamos Vencidos', data.metrics.overdueLoans],
    ['Tasa de Devolución (%)', data.metrics.returnRate],
    ['Duración Promedio (días)', data.metrics.avgDuration],
  ]
  
  if (filters.dateRange?.start && filters.dateRange?.end) {
    summaryData.splice(2, 0, [
      'Período:',
      `${new Date(filters.dateRange.start).toLocaleDateString('es-ES')} - ${new Date(filters.dateRange.end).toLocaleDateString('es-ES')}`,
    ])
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  
  // Detailed data sheet
  const detailedData = data.loans.map((loan) => ({
    ID: loan.id,
    Usuario: loan.user.username,
    Email: loan.user.email,
    Herramienta: loan.tool_instance.item_type.name,
    'Categoría': loan.tool_instance.item_type.category || 'Sin categoría',
    'Fecha Préstamo': new Date(loan.loan_date).toLocaleDateString('es-ES'),
    'Fecha Vencimiento': new Date(loan.due_date).toLocaleDateString('es-ES'),
    'Fecha Devolución': loan.return_date ? new Date(loan.return_date).toLocaleDateString('es-ES') : '-',
    Estado: loan.status,
    'Días Retraso': loan.daysOverdue || 0,
    Notas: loan.notes || '-',
  }))
  
  const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Préstamos Detallados')
  
  // Convert to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function generateToolReportExcel(
  data: ToolReportData,
  filters: ReportFilters
): Promise<Blob> {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = [
    ['Reporte de Inventario de Herramientas'],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [],
    ['Métricas Clave'],
    ['Total de Herramientas', data.metrics.totalTools],
    ['Herramientas Disponibles', data.metrics.availableTools],
    ['Tasa de Utilización (%)', data.metrics.utilizationRate],
    ['Requieren Mantenimiento', data.metrics.maintenanceNeeded],
  ]
  
  if (filters.category) {
    summaryData.splice(2, 0, ['Categoría:', filters.category])
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  
  // Detailed data sheet
  const detailedData = data.tools.map((tool) => ({
    ID: tool.id,
    Nombre: tool.item_type.name,
    'Categoría': tool.item_type.category || 'Sin categoría',
    'Código QR': tool.qr_code,
    'Número de Serie': tool.serial_number || '-',
    Estado: tool.status,
    'Tasa de Utilización (%)': tool.utilizationRate,
    'Notas de Condición': tool.condition_notes || '-',
    'Fecha Creación': new Date(tool.created_at).toLocaleDateString('es-ES'),
  }))
  
  const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Herramientas Detalladas')
  
  // Convert to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function generateConsumableReportExcel(
  data: ConsumableReportData,
  filters: ReportFilters
): Promise<Blob> {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet with enhanced statistics
  const netConsumption = data.metrics.totalConsumption - (data.metrics.totalReturnedItems || 0)
  const returnRate = data.metrics.totalConsumption > 0 
    ? (((data.metrics.totalReturnedItems || 0) / data.metrics.totalConsumption) * 100).toFixed(1)
    : '0.0'
  
  const summaryData = [
    ['Historial de Materiales'],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [],
    ['Métricas Clave'],
    ['Tipos de Materiales', data.metrics.totalTypes],
    ['Items con Stock Bajo', data.metrics.lowStockItems],
    ['Total Consumido', data.metrics.totalConsumption],
    ['Total Devuelto', data.metrics.totalReturnedItems || 0],
    ['Consumo Neto', netConsumption],
    ['Consumo Diario Promedio', data.metrics.avgDailyConsumption],
    ['Tasa de Devolución (%)', returnRate],
  ]
  
  if (filters.dateRange?.start && filters.dateRange?.end) {
    summaryData.splice(2, 0, [
      'Período:',
      `${new Date(filters.dateRange.start).toLocaleDateString('es-ES')} - ${new Date(filters.dateRange.end).toLocaleDateString('es-ES')}`,
    ])
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  
  // Category summaries sheet
  const categoryData = data.categories.map((cat) => ({
    'Categoría': cat.category,
    'Total Items': cat.totalItems,
    'Stock Total': cat.totalStock,
    'Consumo': cat.consumption,
    'Items con Stock Bajo': cat.lowStockCount,
  }))
  
  const categorySheet = XLSX.utils.json_to_sheet(categoryData)
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Por Categoría')
  
  // Detailed items sheet with returns
  const allItems = data.categories.flatMap((cat) =>
    cat.items.map((item) => {
      const netItemConsumption = item.consumptionInPeriod - item.returnsInPeriod
      return {
        ID: item.id,
        Nombre: item.item_type.name,
        'Categoría': item.item_type.category || 'Sin categoría',
        'Stock Actual': item.current_quantity,
        'Stock Mínimo': item.minimum_threshold,
        'Unidad de Medida': item.unit_of_measure || '-',
        Estado: item.status === 'adequate' ? 'Adecuado' : item.status === 'low' ? 'Bajo' : 'Crítico',
        'Consumo en Período': item.consumptionInPeriod,
        'Devuelto en Período': item.returnsInPeriod,
        'Consumo Neto': netItemConsumption,
      }
    })
  )
  
  const itemsSheet = XLSX.utils.json_to_sheet(allItems)
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items Detallados')
  
  // User consumption sheet (if available)
  if (data.metrics.userConsumption && data.metrics.userConsumption.length > 0) {
    const userConsumptionData = data.metrics.userConsumption.map((user) => ({
      'Usuario': user.username,
      'Total Consumido': user.totalConsumed,
      'Items Diferentes': user.itemsConsumed.length,
    }))
    
    const userSheet = XLSX.utils.json_to_sheet(userConsumptionData)
    XLSX.utils.book_append_sheet(workbook, userSheet, 'Consumo por Usuario')
  }
  
  // Convert to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
