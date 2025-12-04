// Unified Dashboard Components
export { GlobalFilters } from './GlobalFilters'
export { EnhancedMetricCard } from './EnhancedMetricCard'
export { UnifiedChart } from './UnifiedChart'
export { UnifiedDataTable } from './UnifiedDataTable'
export { UnifiedAlertsPanel } from './UnifiedAlertsPanel'
export { OverviewSection } from './OverviewSection'
export { ToolsSection } from './ToolsSection'
export { ConsumablesSection } from './ConsumablesSection'
export { LoansSection } from './LoansSection'
export { UserConsumptionSection } from './UserConsumptionSection'
export { ElectronicsSection } from './ElectronicsSection'
export { DeviceMovementHistory } from './DeviceMovementHistory'
export { ClassroomsSection } from './ClassroomsSection'
export { TopUsersSection } from './TopUsersSection'
export { UnifiedDashboardContainer } from './UnifiedDashboardContainer'

// Hooks
export { useExportDashboard } from './hooks/useExportDashboard'

// Re-export types
export type {
  DashboardSection,
  GlobalFilters as GlobalFiltersType,
  DateRange,
  UnifiedAlert,
  DashboardSummary,
  ChartData,
  ChartType,
  ColumnConfig,
  PaginationConfig,
  SortingConfig,
} from '@/types/unified-dashboard'
