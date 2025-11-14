// Report Types and Interfaces

import { Loan, ToolInstance, ConsumableStock, ItemType, User } from './database'

// ============================================================================
// Base Report Types
// ============================================================================

export interface ReportFilters {
  dateRange?: { start: string; end: string }
  status?: string | string[]
  category?: string
  userId?: number
  toolId?: number
  [key: string]: unknown
}

export interface FilterConfig {
  type: 'date-range' | 'select' | 'multi-select' | 'search'
  name: string
  label: string
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

// ============================================================================
// Metric Types
// ============================================================================

export interface Metric {
  id: string
  label: string
  value: number | string
  icon: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  format?: 'number' | 'percentage' | 'currency' | 'duration'
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartConfig {
  id: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'horizontal-bar' | 'stacked-bar'
  title: string
  dataKey: string
  xAxisKey?: string
  yAxisKey?: string
  colors?: string[]
  height?: number
}

// ============================================================================
// Loan Report Types
// ============================================================================

export interface LoanReportFilters extends ReportFilters {
  userId?: number
  toolInstanceId?: number
  status?: 'active' | 'returned' | 'overdue' | 'lost'
}

export interface LoanMetrics {
  totalLoans: number
  activeLoans: number
  overdueLoans: number
  returnRate: number
  avgDuration: number
}

export interface LoanCharts {
  loansTrend: Array<{ date: string; count: number }>
  statusDistribution: Array<{ status: string; count: number }>
  topTools: Array<{ tool: string; count: number }>
  topUsers: Array<{ user: string; count: number }>
}

export interface LoanWithRelations extends Omit<Loan, 'user' | 'tool_instance'> {
  user: Pick<User, 'id' | 'username' | 'email'>
  tool_instance: ToolInstance & {
    item_type: Pick<ItemType, 'id' | 'name' | 'category'>
  }
  daysOverdue?: number
}

export interface LoanReportData {
  metrics: LoanMetrics
  charts: LoanCharts
  loans: LoanWithRelations[]
  totalCount: number
}

export interface LoanReportResponse {
  data: LoanReportData
  message: string
}

// ============================================================================
// Tool Report Types
// ============================================================================

export interface ToolReportFilters extends ReportFilters {
  category?: string
  status?: ToolInstance['status']
}

export interface ToolMetrics {
  totalTools: number
  availableTools: number
  utilizationRate: number
  maintenanceNeeded: number
}

export interface ToolCharts {
  statusDistribution: Array<{ status: string; count: number }>
  categoryDistribution: Array<{ category: string; count: number }>
  utilization: Array<{ tool: string; rate: number }>
  statusTimeline: Array<{ date: string } & Record<string, number>>
}

export interface ToolInstanceWithRelations extends ToolInstance {
  item_type: ItemType
  loanHistory: Array<{
    loanDate: string
    returnDate: string | null
    duration: number
  }>
  utilizationRate: number
}

export interface ToolReportData {
  metrics: ToolMetrics
  charts: ToolCharts
  tools: ToolInstanceWithRelations[]
}

export interface ToolReportResponse {
  data: ToolReportData
  message: string
}

// ============================================================================
// Consumable Report Types
// ============================================================================

export interface ConsumableReportFilters extends ReportFilters {
  search?: string
  category?: string
  stockLevel?: 'all' | 'low' | 'critical' | 'adequate'
  userId?: number
}

export interface ConsumableMetrics {
  totalTypes: number
  lowStockItems: number
  totalConsumption: number
  avgDailyConsumption: number
  totalReturns?: number
  totalReturnedItems?: number
  userConsumption?: Array<{
    userId: number
    username: string
    totalConsumed: number
    itemsConsumed: Array<{
      itemName: string
      quantity: number
    }>
  }>
}

export interface ConsumableCharts {
  consumptionByCategory: Array<{ category: string; amount: number }>
  consumptionTrend: Array<{ date: string; amount: number }>
  lowStockItems: Array<{ item: string; stock: number; min: number }>
  categoryComparison: Array<{ date: string } & Record<string, number>>
  consumptionVsReturns: Array<{ date: string; consumed: number; returned: number }>
  topConsumed: Array<{ itemName: string; quantity: number }>
  topReturned: Array<{ itemName: string; quantity: number }>
  userConsumptionChart: Array<{ username: string; total: number }>
}

export interface CategorySummary {
  category: string
  totalItems: number
  totalStock: number
  consumption: number
  lowStockCount: number
  items: ConsumableStockWithType[]
}

export interface ConsumableStockWithType extends ConsumableStock {
  item_type: ItemType
  consumptionInPeriod: number
  returnsInPeriod: number
  requestsInPeriod: number
  status: 'adequate' | 'low' | 'critical'
}

export interface ConsumableReportData {
  metrics: ConsumableMetrics
  charts: ConsumableCharts
  categories: CategorySummary[]
}

export interface ConsumableReportResponse {
  data: ConsumableReportData
  message: string
}

export interface CategoryDetailData {
  category: string
  metrics: {
    totalItems: number
    totalStock: number
    consumption: number
    avgDailyConsumption: number
    projectedDaysUntilEmpty: number
  }
  items: Array<{
    id: number
    name: string
    currentStock: number
    minimumThreshold: number
    consumption: number
    status: 'adequate' | 'low' | 'critical'
  }>
  consumptionHistory: Array<{ date: string; amount: number }>
}

export interface CategoryDetailResponse {
  data: CategoryDetailData
  message: string
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'pdf' | 'excel' | 'csv'

export type ReportType = 'loans' | 'tools' | 'consumables' | 'reservations'

export interface ExportRequest {
  reportType: ReportType
  format: ExportFormat
  filters: ReportFilters
  filename?: string
}

// ============================================================================
// Error Types
// ============================================================================

export enum ReportErrorCode {
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  EXPORT_FAILED = 'EXPORT_FAILED',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

export interface ReportError {
  code: ReportErrorCode
  message: string
  details?: Record<string, unknown>
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  availableFilters: FilterConfig[]
  isLoading?: boolean
}

export interface ReportMetricsProps {
  metrics: Metric[]
  isLoading?: boolean
}

export interface ReportChartsProps {
  charts: ChartConfig[]
  data: Record<string, unknown[]>
  isLoading?: boolean
}

export interface ReportTableProps<T> {
  columns: ColumnConfig<T>[]
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onRowClick?: (row: T) => void
  isLoading?: boolean
}

export interface ColumnConfig<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  format?: (value: unknown, row?: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface ExportButtonProps {
  reportType: ReportType
  filters: ReportFilters
  format: ExportFormat
  filename?: string
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: Error) => void
}

// ============================================================================
// Reservation Report Types
// ============================================================================

export interface ReservationReportFilters extends ReportFilters {
  status?: 'active' | 'fulfilled' | 'cancelled' | 'expired'
  userId?: number
  itemTypeId?: number
  category?: string
  warehouseQrId?: number
}

export interface ReservationMetrics {
  totalReservations: number
  activeReservations: number
  fulfilledReservations: number
  cancelledReservations: number
  expiredReservations: number
  expiringSoon: number
  totalReservedQuantity: number
  fulfillmentRate: number
  cancellationRate: number
  expirationRate: number
  avgTimeToPickup: number
  reservationsWithQR: number
  qrVerificationRate: number
  qrScanSuccessRate?: number
  totalScanAttempts?: number
  failedScanAttempts?: number
}

export interface ReservationCharts {
  statusDistribution: Array<{ status: string; count: number }>
  reservationsByCategory: Array<{ category: string; count: number }>
  reservationsOverTime: Array<{ date: string; count: number }>
  topReservedItems: Array<{ name: string; count: number; quantity: number }>
  fulfillmentTimeDistribution: Array<{ range: string; count: number }>
}

export interface ReservationDetailData {
  id: number
  user_id: number
  username: string
  email: string
  item_type_id: number
  item_name: string
  item_category: string | null
  reserved_quantity: number
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired'
  reservation_date: string
  expiration_date: string
  pickup_date: string | null
  notes: string | null
  purpose: string | null
  warehouse_qr_code_id: number | null
  warehouse_qr_code: string | null
  warehouse_location: string | null
  warehouse_zone: string | null
  created_at: string
}

export interface WarehouseQRStat {
  id: number
  qr_code: string
  location_name: string
  zone: string
  is_active: boolean
  total_scans: number
  last_scan_date: string | null
}

export interface QRScanAttemptData {
  qr_code_id: number
  location_name: string
  total_attempts: number
  successful_scans: number
  failed_scans: number
  success_rate: number
}

export interface ReservationReportData {
  metrics: ReservationMetrics
  charts: ReservationCharts
  reservations: ReservationDetailData[]
  warehouseStats: WarehouseQRStat[]
  qrScanStats?: QRScanAttemptData[]
}

export interface ReservationReportResponse {
  data: ReservationReportData
  message: string
}
