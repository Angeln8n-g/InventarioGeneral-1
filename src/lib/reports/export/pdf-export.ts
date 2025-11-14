import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { LoanReportData, ToolReportData, ConsumableReportData, ReportFilters } from '@/types/reports'

export async function generateLoanReportPDF(
  data: LoanReportData,
  filters: ReportFilters
): Promise<Blob> {
  const doc = new jsPDF()
  
  // Add header
  doc.setFontSize(20)
  doc.text('Historial de Préstamos', 14, 20)
  
  // Add date
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)
  
  // Add filters
  if (filters.dateRange?.start && filters.dateRange?.end) {
    doc.text(
      `Período: ${new Date(filters.dateRange.start).toLocaleDateString('es-ES')} - ${new Date(filters.dateRange.end).toLocaleDateString('es-ES')}`,
      14,
      34
    )
  }
  
  // Add metrics
  doc.setFontSize(14)
  doc.text('Métricas Clave', 14, 45)
  
  doc.setFontSize(10)
  const metricsY = 52
  doc.text(`Total de Préstamos: ${data.metrics.totalLoans}`, 14, metricsY)
  doc.text(`Préstamos Activos: ${data.metrics.activeLoans}`, 14, metricsY + 6)
  doc.text(`Préstamos Vencidos: ${data.metrics.overdueLoans}`, 14, metricsY + 12)
  doc.text(`Tasa de Devolución: ${data.metrics.returnRate}%`, 14, metricsY + 18)
  doc.text(`Duración Promedio: ${data.metrics.avgDuration} días`, 14, metricsY + 24)
  
  // Add table
  const tableData = data.loans.map((loan) => [
    loan.id,
    loan.user.username,
    loan.tool_instance.item_type.name,
    new Date(loan.loan_date).toLocaleDateString('es-ES'),
    new Date(loan.due_date).toLocaleDateString('es-ES'),
    loan.status,
    loan.daysOverdue ? `${loan.daysOverdue} días` : '-',
  ])
  
  autoTable(doc, {
    startY: metricsY + 35,
    head: [['ID', 'Usuario', 'Herramienta', 'Fecha Préstamo', 'Fecha Vencimiento', 'Estado', 'Días Retraso']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })
  
  return doc.output('blob')
}

export async function generateToolReportPDF(
  data: ToolReportData,
  filters: ReportFilters
): Promise<Blob> {
  const doc = new jsPDF()
  
  // Add header
  doc.setFontSize(20)
  doc.text('Reporte de Inventario de Herramientas', 14, 20)
  
  // Add date
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)
  
  // Add filters
  if (filters.category) {
    doc.text(`Categoría: ${filters.category}`, 14, 34)
  }
  
  // Add metrics
  doc.setFontSize(14)
  doc.text('Métricas Clave', 14, 45)
  
  doc.setFontSize(10)
  const metricsY = 52
  doc.text(`Total de Herramientas: ${data.metrics.totalTools}`, 14, metricsY)
  doc.text(`Herramientas Disponibles: ${data.metrics.availableTools}`, 14, metricsY + 6)
  doc.text(`Tasa de Utilización: ${data.metrics.utilizationRate}%`, 14, metricsY + 12)
  doc.text(`Requieren Mantenimiento: ${data.metrics.maintenanceNeeded}`, 14, metricsY + 18)
  
  // Add table
  const tableData = data.tools.map((tool) => [
    tool.id,
    tool.item_type.name,
    tool.item_type.category || 'Sin categoría',
    tool.status,
    `${tool.utilizationRate}%`,
    new Date(tool.created_at).toLocaleDateString('es-ES'),
  ])
  
  autoTable(doc, {
    startY: metricsY + 30,
    head: [['ID', 'Nombre', 'Categoría', 'Estado', 'Utilización', 'Fecha Creación']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
  })
  
  return doc.output('blob')
}

export async function generateConsumableReportPDF(
  data: ConsumableReportData,
  filters: ReportFilters
): Promise<Blob> {
  const doc = new jsPDF()
  
  // Add header
  doc.setFontSize(20)
  doc.text('Historial de Materiales', 14, 20)
  
  // Add date
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)
  
  // Add filters
  if (filters.dateRange?.start && filters.dateRange?.end) {
    doc.text(
      `Período: ${new Date(filters.dateRange.start).toLocaleDateString('es-ES')} - ${new Date(filters.dateRange.end).toLocaleDateString('es-ES')}`,
      14,
      34
    )
  }
  
  // Add metrics with enhanced statistics
  doc.setFontSize(14)
  doc.text('Métricas Clave', 14, 45)
  
  const netConsumption = data.metrics.totalConsumption - (data.metrics.totalReturnedItems || 0)
  const returnRate = data.metrics.totalConsumption > 0 
    ? (((data.metrics.totalReturnedItems || 0) / data.metrics.totalConsumption) * 100).toFixed(1)
    : '0.0'
  
  doc.setFontSize(10)
  const metricsY = 52
  doc.text(`Tipos de Materiales: ${data.metrics.totalTypes}`, 14, metricsY)
  doc.text(`Items con Stock Bajo: ${data.metrics.lowStockItems}`, 14, metricsY + 6)
  doc.text(`Total Consumido: ${data.metrics.totalConsumption}`, 14, metricsY + 12)
  doc.text(`Total Devuelto: ${data.metrics.totalReturnedItems || 0}`, 14, metricsY + 18)
  doc.text(`Consumo Neto: ${netConsumption}`, 14, metricsY + 24)
  doc.text(`Consumo Diario Promedio: ${data.metrics.avgDailyConsumption}`, 14, metricsY + 30)
  doc.text(`Tasa de Devolución: ${returnRate}%`, 14, metricsY + 36)
  
  // Add category summaries
  doc.setFontSize(14)
  doc.text('Resumen por Categoría', 14, metricsY + 48)
  
  const categoryData = data.categories.map((cat) => [
    cat.category,
    cat.totalItems,
    cat.totalStock,
    cat.consumption,
    cat.lowStockCount,
  ])
  
  autoTable(doc, {
    startY: metricsY + 55,
    head: [['Categoría', 'Total Items', 'Stock Total', 'Consumo', 'Stock Bajo']],
    body: categoryData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [245, 158, 11] },
  })
  
  // Add detailed items table on new page if there are many items
  const allItems = data.categories.flatMap((cat) =>
    cat.items.map((item) => {
      const netItemConsumption = item.consumptionInPeriod - item.returnsInPeriod
      return [
        item.id,
        item.item_type.name,
        item.item_type.category || 'Sin categoría',
        item.current_quantity,
        item.consumptionInPeriod,
        item.returnsInPeriod,
        netItemConsumption,
        item.status === 'adequate' ? 'Adecuado' : item.status === 'low' ? 'Bajo' : 'Crítico',
      ]
    })
  )
  
  if (allItems.length > 0) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Detalle de Materiales', 14, 20)
    
    autoTable(doc, {
      startY: 27,
      head: [['ID', 'Nombre', 'Categoría', 'Stock', 'Consumido', 'Devuelto', 'Neto', 'Estado']],
      body: allItems,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [245, 158, 11] },
    })
  }
  
  // Add user consumption section if available
  if (data.metrics.userConsumption && data.metrics.userConsumption.length > 0) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Consumo por Usuario', 14, 20)
    
    // Summary table
    const userSummaryData = data.metrics.userConsumption.map((user) => [
      user.username,
      user.totalConsumed,
      user.itemsConsumed.length,
      data.metrics.totalConsumption > 0 
        ? `${((user.totalConsumed / data.metrics.totalConsumption) * 100).toFixed(1)}%`
        : '0%',
    ])
    
    autoTable(doc, {
      startY: 27,
      head: [['Usuario', 'Total Consumido', 'Items Diferentes', '% del Total']],
      body: userSummaryData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    })
    
    // Detailed consumption by user (Top 5 users)
    const topUsers = data.metrics.userConsumption.slice(0, 5)
    if (topUsers.length > 0) {
      // Get the final Y position from the previous table
      const finalY = (doc as any).lastAutoTable.finalY || 100
      
      doc.setFontSize(12)
      doc.text('Detalle de Items por Usuario (Top 5)', 14, finalY + 15)
      
      let currentY = finalY + 22
      
      topUsers.forEach((user, index) => {
        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage()
          currentY = 20
        }
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${user.username} (Total: ${user.totalConsumed})`, 14, currentY)
        doc.setFont('helvetica', 'normal')
        
        const userItemsData = user.itemsConsumed.map((item) => [
          item.itemName,
          item.quantity,
          user.totalConsumed > 0 
            ? `${((item.quantity / user.totalConsumed) * 100).toFixed(1)}%`
            : '0%',
        ])
        
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Material', 'Cantidad', '% del Usuario']],
          body: userItemsData,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [156, 163, 175] },
          margin: { left: 20 },
        })
        
        currentY = (doc as any).lastAutoTable.finalY + 10
      })
    }
  }
  
  return doc.output('blob')
}
