import { electronicDeviceOperations } from '../supabase-client'
import type { ElectronicDeviceWithDetails, ToolInstance } from '@/types/database'

export interface ElectronicsReportData {
  devices: ElectronicDeviceWithDetails[]
  totalDevices: number
  byStatus: Record<ToolInstance['status'], number>
  byCategory: Record<string, number>
  byBrand: Record<string, number>
  availableDevices: number
  loanedDevices: number
  maintenanceDevices: number
  utilizationRate: number
  topBrands: Array<{ brand: string; count: number }>
  topCategories: Array<{ category: string; count: number }>
}

export async function generateElectronicsReport(
  filters?: {
    status?: ToolInstance['status']
    category?: string
    brand?: string
    startDate?: string
    endDate?: string
  }
): Promise<ElectronicsReportData> {
  // Fetch all devices
  const devices = await electronicDeviceOperations.getAll(filters)

  // Calculate statistics
  const byStatus: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  const byBrand: Record<string, number> = {}

  devices.forEach((device) => {
    const toolInstance = device.tool_instance as any
    const itemType = toolInstance?.item_type || {}

    // Count by status
    const status = toolInstance.status
    byStatus[status] = (byStatus[status] || 0) + 1

    // Count by category
    const category = itemType.category || 'Unknown'
    byCategory[category] = (byCategory[category] || 0) + 1

    // Count by brand
    const brand = device.brand || 'Unknown'
    byBrand[brand] = (byBrand[brand] || 0) + 1
  })

  // Calculate key metrics
  const totalDevices = devices.length
  const availableDevices = byStatus['available'] || 0
  const loanedDevices = byStatus['loaned'] || 0
  const maintenanceDevices = (byStatus['out-of-service'] || 0) + (byStatus['damaged'] || 0)
  const utilizationRate = totalDevices > 0 ? (loanedDevices / totalDevices) * 100 : 0

  // Get top brands
  const topBrands = Object.entries(byBrand)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Get top categories
  const topCategories = Object.entries(byCategory)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    devices,
    totalDevices,
    byStatus: byStatus as Record<ToolInstance['status'], number>,
    byCategory,
    byBrand,
    availableDevices,
    loanedDevices,
    maintenanceDevices,
    utilizationRate,
    topBrands,
    topCategories,
  }
}

export function exportElectronicsReportToCSV(data: ElectronicsReportData): string {
  const headers = [
    'ID',
    'Name',
    'Category',
    'Brand',
    'Model',
    'Serial Number',
    'Status',
    'Condition Notes',
    'QR Code',
    'Created At',
  ]

  const rows = data.devices.map((device) => {
    const toolInstance = device.tool_instance as any
    const itemType = toolInstance?.item_type || {}

    return [
      device.id,
      itemType.name || 'Unknown',
      itemType.category || 'Unknown',
      device.brand || '',
      device.model || '',
      toolInstance.serial_number || '',
      toolInstance.status,
      toolInstance.condition_notes || '',
      toolInstance.qr_code || '',
      new Date(toolInstance.created_at).toLocaleDateString(),
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

export function exportElectronicsReportToPDF(data: ElectronicsReportData): string {
  // This would integrate with a PDF library like jsPDF
  // For now, return a formatted text representation
  const report = `
ELECTRONICS INVENTORY REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Devices: ${data.totalDevices}
Available: ${data.availableDevices}
Loaned: ${data.loanedDevices}
Maintenance: ${data.maintenanceDevices}
Utilization Rate: ${data.utilizationRate.toFixed(1)}%

BY STATUS
---------
${Object.entries(data.byStatus)
  .map(([status, count]) => `${status}: ${count}`)
  .join('\n')}

BY CATEGORY
-----------
${Object.entries(data.byCategory)
  .map(([category, count]) => `${category}: ${count}`)
  .join('\n')}

TOP BRANDS
----------
${data.topBrands.map((b, i) => `${i + 1}. ${b.brand}: ${b.count} devices`).join('\n')}

DEVICES
-------
${data.devices
  .map((device) => {
    const toolInstance = device.tool_instance as any
    const itemType = toolInstance?.item_type || {}
    return `${itemType.name} (${device.brand || 'N/A'} ${device.model || ''}) - ${toolInstance.status}`
  })
  .join('\n')}
  `

  return report
}
