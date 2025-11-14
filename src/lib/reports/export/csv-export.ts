import type { LoanReportData, ToolReportData, ConsumableReportData } from '@/types/reports'

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function arrayToCSV(data: unknown[][]): string {
  return data.map((row) => row.map(escapeCSV).join(',')).join('\n')
}

export async function generateLoanReportCSV(data: LoanReportData): Promise<Blob> {
  const headers = [
    'ID',
    'Usuario',
    'Email Usuario',
    'Herramienta',
    'Categoría',
    'Fecha Préstamo',
    'Fecha Vencimiento',
    'Fecha Devolución',
    'Estado',
    'Días Retraso',
    'Notas',
  ]
  
  const rows = data.loans.map((loan) => [
    loan.id,
    loan.user.username,
    loan.user.email,
    loan.tool_instance.item_type.name,
    loan.tool_instance.item_type.category || 'Sin categoría',
    new Date(loan.loan_date).toLocaleDateString('es-ES'),
    new Date(loan.due_date).toLocaleDateString('es-ES'),
    loan.return_date ? new Date(loan.return_date).toLocaleDateString('es-ES') : '-',
    loan.status,
    loan.daysOverdue || 0,
    loan.notes || '-',
  ])
  
  const csvContent = arrayToCSV([headers, ...rows])
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

export async function generateToolReportCSV(data: ToolReportData): Promise<Blob> {
  const headers = [
    'ID',
    'Nombre',
    'Categoría',
    'Código QR',
    'Número de Serie',
    'Estado',
    'Tasa de Utilización (%)',
    'Notas de Condición',
    'Fecha Creación',
  ]
  
  const rows = data.tools.map((tool) => [
    tool.id,
    tool.item_type.name,
    tool.item_type.category || 'Sin categoría',
    tool.qr_code,
    tool.serial_number || '-',
    tool.status,
    tool.utilizationRate,
    tool.condition_notes || '-',
    new Date(tool.created_at).toLocaleDateString('es-ES'),
  ])
  
  const csvContent = arrayToCSV([headers, ...rows])
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

export async function generateConsumableReportCSV(data: ConsumableReportData): Promise<Blob> {
  // Estadísticas generales
  const statsHeaders = ['Métrica', 'Valor']
  const statsRows = [
    ['Total de Tipos de Materiales', data.metrics.totalTypes],
    ['Items con Stock Bajo', data.metrics.lowStockItems],
    ['Total Consumido', data.metrics.totalConsumption],
    ['Total Devuelto', data.metrics.totalReturnedItems || 0],
    ['Consumo Neto', data.metrics.totalConsumption - (data.metrics.totalReturnedItems || 0)],
    ['Promedio Diario de Consumo', data.metrics.avgDailyConsumption],
    ['Tasa de Devolución (%)', data.metrics.totalConsumption > 0 ? (((data.metrics.totalReturnedItems || 0) / data.metrics.totalConsumption) * 100).toFixed(1) : '0.0'],
  ]
  
  // Detalle de materiales
  const headers = [
    'ID',
    'Nombre',
    'Categoría',
    'Stock Actual',
    'Stock Mínimo',
    'Unidad de Medida',
    'Estado',
    'Consumo en Período',
    'Devuelto en Período',
    'Consumo Neto',
  ]
  
  const allItems = data.categories.flatMap((cat) =>
    cat.items.map((item) => {
      const netConsumption = item.consumptionInPeriod - item.returnsInPeriod
      return [
        item.id,
        item.item_type.name,
        item.item_type.category || 'Sin categoría',
        item.current_quantity,
        item.minimum_threshold,
        item.unit_of_measure || '-',
        item.status === 'adequate' ? 'Adecuado' : item.status === 'low' ? 'Bajo' : 'Crítico',
        item.consumptionInPeriod,
        item.returnsInPeriod,
        netConsumption,
      ]
    })
  )
  
  // Consumo por usuario
  let userConsumptionSection = ''
  if (data.metrics.userConsumption && data.metrics.userConsumption.length > 0) {
    const userHeaders = ['Usuario', 'Total Consumido', 'Items Diferentes']
    const userRows = data.metrics.userConsumption.map((user) => [
      user.username,
      user.totalConsumed,
      user.itemsConsumed.length,
    ])
    
    userConsumptionSection = 
      '\n\n=== CONSUMO POR USUARIO ===\n' +
      arrayToCSV([userHeaders, ...userRows])
    
    // Detalle de items por usuario (Top 5 usuarios)
    const topUsers = data.metrics.userConsumption.slice(0, 5)
    if (topUsers.length > 0) {
      userConsumptionSection += '\n\n=== DETALLE DE ITEMS POR USUARIO (Top 5) ===\n'
      
      topUsers.forEach((user) => {
        userConsumptionSection += `\n${user.username} (Total: ${user.totalConsumed})\n`
        const itemHeaders = ['Material', 'Cantidad']
        const itemRows = user.itemsConsumed.map((item) => [item.itemName, item.quantity])
        userConsumptionSection += arrayToCSV([itemHeaders, ...itemRows]) + '\n'
      })
    }
  }
  
  // Combinar todas las secciones
  const csvContent = 
    '=== ESTADÍSTICAS GENERALES ===\n' +
    arrayToCSV([statsHeaders, ...statsRows]) +
    '\n\n=== DETALLE DE MATERIALES ===\n' +
    arrayToCSV([headers, ...allItems]) +
    userConsumptionSection
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}
