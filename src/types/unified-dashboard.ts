/**
 * Types and interfaces for the Unified Reports Dashboard
 */

// ============================================================================
// Dashboard Section Types
// ============================================================================

export type DashboardSection = 
  | 'overview' 
  | 'tools' 
  | 'consumables' 
  | 'loans' 
  | 'electronics' 
  | 'classrooms'
  | 'users'
  | 'maintenance';

// ============================================================================
// Global Filters Types
// ============================================================================

export interface DateRange {
  type: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  start?: string;
  end?: string;
}

export interface GlobalFilters {
  dateRange: DateRange;
  category?: string;
}

// ============================================================================
// Alert Types
// ============================================================================

export type UnifiedAlertType = 'low_stock' | 'overdue_loan' | 'maintenance' | 'warning';
export type UnifiedAlertSeverity = 'info' | 'warning' | 'error';

export interface UnifiedAlert {
  id: string;
  type: UnifiedAlertType;
  title: string;
  message: string;
  severity: UnifiedAlertSeverity;
  link?: string;
  count?: number;
  timestamp: string;
}

// ============================================================================
// Dashboard Summary Types
// ============================================================================

export interface ToolsSummary {
  total: number;
  available: number;
  loaned: number;
  maintenance: number;
  byCategory: { category: string; count: number }[];
}

export interface ConsumablesSummary {
  totalTypes: number;
  totalStock: number;
  lowStockCount: number;
  byCategory: { category: string; count: number }[];
}

export interface LoansSummary {
  active: number;
  overdue: number;
  returned: number;
  total: number;
  byStatus: { status: string; count: number }[];
}

export interface ElectronicsSummary {
  total: number;
  assigned: number;
  unassigned: number;
  byBrand: { brand: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export interface ClassroomsSummary {
  total: number;
  withDevices: number;
  totalAssignments: number;
  // Reservation metrics
  totalReservations: number;
  activeReservations: number;
  reservedNow: number;
  availableNow: number;
  reservationsThisMonth: number;
  internetServices: number;
}

export interface UsersSummary {
  total: number;
  active: number;
}

export interface DashboardSummary {
  tools: ToolsSummary;
  consumables: ConsumablesSummary;
  loans: LoansSummary;
  electronics: ElectronicsSummary;
  classrooms: ClassroomsSummary;
  users: UsersSummary;
}

// ============================================================================
// Time Series Data Types
// ============================================================================

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ConsumptionTrend extends TimeSeriesData {
  period: 'daily' | 'weekly' | 'monthly';
  totalConsumption: number;
}

export interface LoanActivityTrend extends TimeSeriesData {
  period: 'daily' | 'weekly' | 'monthly';
  totalLoans: number;
  totalReturns: number;
}

// ============================================================================
// User Activity Types
// ============================================================================

export interface TopUser {
  rank: number;
  userId: number;
  username: string;
  email: string;
  activeLoans: number;
  totalConsumables: number;
  totalCost: number;
  lastActivity: string;
}

export interface UserConsumption {
  userId: number;
  username: string;
  email: string;
  totalQuantity: number;
  totalCost: number;
  byType: {
    typeId: number;
    typeName: string;
    quantity: number;
    cost: number;
  }[];
  trend: {
    period: string;
    quantity: number;
  }[];
}

// ============================================================================
// Device Movement Types
// ============================================================================

export interface DeviceMovement {
  id: number;
  deviceId: number;
  deviceName: string;
  serialNumber: string;
  fromClassroom: {
    id: number;
    name: string;
  } | null;
  toClassroom: {
    id: number;
    name: string;
  };
  transferDate: string;
  responsibleUser: {
    id: number;
    username: string;
  };
  notes?: string;
}

export interface DeviceTransferHistory {
  deviceId: number;
  deviceName: string;
  serialNumber: string;
  currentClassroom: string | null;
  transfers: DeviceMovement[];
}

// ============================================================================
// Classroom Assignment Types
// ============================================================================

export interface ClassroomDevice {
  deviceId: number;
  deviceName: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: string;
  assignedDate: string;
}

export interface ClassroomDeviceAssignment {
  classroomId: number;
  classroomName: string;
  building?: string;
  floor?: string;
  devices: ClassroomDevice[];
  totalDevices: number;
}

// ============================================================================
// Table Column Configuration
// ============================================================================

export interface ColumnConfig<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface SortingConfig {
  field: string;
  direction: 'asc' | 'desc';
  onSort: (field: string) => void;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportSheet {
  name: string;
  data: Record<string, unknown>[];
}

export interface ExportMetadata {
  exportDate: string;
  filters: GlobalFilters;
  generatedBy: string;
}

export interface ExportResult {
  filename: string;
  sheets: ExportSheet[];
  metadata: ExportMetadata;
}

export interface ExportOptions {
  sections: DashboardSection[];
  filters: GlobalFilters;
  format: 'xlsx' | 'csv';
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface GlobalFiltersProps {
  value: GlobalFilters;
  onChange: (filters: GlobalFilters) => void;
  categories: string[];
}

export interface UnifiedDashboardProps {
  initialSection?: DashboardSection;
}

export interface DashboardState {
  activeSection: DashboardSection;
  filters: GlobalFilters;
}

export interface SectionProps {
  filters: GlobalFilters;
}

export interface DrillDownSectionProps extends SectionProps {
  onDrillDown: (metric: string, data: unknown) => void;
}

export interface ClassroomsSectionProps extends SectionProps {
  selectedClassroom?: number;
  onClassroomSelect: (classroomId: number) => void;
}

export interface UserConsumptionSectionProps extends SectionProps {
  sortBy: 'quantity' | 'cost' | 'name';
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
}

export interface ElectronicsMovementProps extends SectionProps {
  classroomFilter?: number;
  deviceFilter?: number;
}

// ============================================================================
// Enhanced MetricCard Props
// ============================================================================

export type MetricCardColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';

export interface MetricTrend {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
}

export interface EnhancedMetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: MetricCardColor;
  trend?: MetricTrend;
  onClick?: () => void;
  loading?: boolean;
}

// ============================================================================
// Chart Props
// ============================================================================

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export interface UnifiedChartProps {
  type: ChartType;
  data: ChartData;
  title: string;
  loading?: boolean;
  height?: number;
}

// ============================================================================
// Data Table Props
// ============================================================================

export interface UnifiedDataTableProps<T extends object> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  searchable?: boolean;
  onSearch?: (term: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

// ============================================================================
// Alerts Panel Props
// ============================================================================

export interface UnifiedAlertsPanelProps {
  alerts: UnifiedAlert[];
  onAlertClick: (alert: UnifiedAlert) => void;
  loading?: boolean;
}

// ============================================================================
// Section Error State
// ============================================================================

export interface SectionErrorState {
  hasError: boolean;
  errorMessage: string;
  retryCount: number;
  lastAttempt: Date;
}


// ============================================================================
// Maintenance and Repair Types
// ============================================================================

export type RepairTechnicianType = 'internal' | 'external';
export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceReport {
  id: number;
  deviceId: number;
  deviceName: string;
  serialNumber: string;
  brand: string;
  model: string;
  issueDescription: string;
  reportDate: string;
  status: RepairStatus;
  technicianType: RepairTechnicianType;
  technicianName: string;
  technicianCompany?: string;
  resolutionDate?: string;
  resolutionNotes?: string;
  cost?: number;
  reportedBy: {
    id: number;
    username: string;
  };
}

export interface MaintenanceSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  byTechnicianType: { type: RepairTechnicianType; count: number }[];
}

export interface DeviceMovementRecord {
  id: number;
  deviceId: number;
  deviceName: string;
  serialNumber: string;
  fromClassroom: {
    id: number;
    name: string;
  } | null;
  toClassroom: {
    id: number;
    name: string;
  } | null;
  movedAt: string;
  movedBy: {
    id: number;
    username: string;
  } | null;
  reason?: string;
}

export interface DeviceCombinationRecord {
  id: number;
  device1: {
    id: number;
    name: string;
    brand: string;
    model: string;
  };
  device2: {
    id: number;
    name: string;
    brand: string;
    model: string;
  };
  combinationType: string;
  classroom: {
    id: number;
    name: string;
  };
  combinedAt: string;
  combinedBy: {
    id: number;
    username: string;
  };
  notes?: string;
}

export interface MaintenanceSectionProps extends SectionProps {
  summary?: MaintenanceSummary;
  maintenanceReports?: MaintenanceReport[];
  deviceMovements?: DeviceMovementRecord[];
  deviceCombinations?: DeviceCombinationRecord[];
  loading?: boolean;
  onDrillDown: (metric: string, data: unknown) => void;
}
