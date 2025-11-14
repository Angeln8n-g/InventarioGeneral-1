/**
 * Types and interfaces for the Statistics Dashboard
 * 
 * This file contains all TypeScript type definitions for the statistics
 * feature, including data models, API responses, and component props.
 */

// ============================================================================
// Time Range Types
// ============================================================================

/**
 * Represents different time range options for filtering statistics
 */
export type TimeRange = 
  | { type: 'today' }
  | { type: 'week' }
  | { type: 'month' }
  | { type: 'quarter' }
  | { type: 'year' }
  | { type: 'custom'; start: string; end: string };

// ============================================================================
// Alert Types
// ============================================================================

/**
 * Severity levels for system alerts
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Types of alerts that can be generated
 */
export type AlertType = 'critical_stock' | 'overdue_loans' | 'low_availability';

/**
 * Represents a system alert
 */
export interface Alert {
  id: number;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  link?: string;
  timestamp: string;
}

// ============================================================================
// Consumption Data Types
// ============================================================================

/**
 * Represents consumption data for a specific period
 */
export interface ConsumptionData {
  period: string;
  consumables: {
    [key: string]: number;
  };
  total: number;
}

/**
 * Grouping options for consumption data
 */
export type ConsumptionGroupBy = 'month' | 'user' | 'category';

// ============================================================================
// Usage Data Types
// ============================================================================

/**
 * Represents usage statistics for tools and electronics
 */
export interface UsageData {
  name: string;
  totalLoans: number;
  activeLoans: number;
  availability: number;
  avgLoanDuration: number;
}

/**
 * Types of equipment for usage statistics
 */
export type UsageType = 'tools' | 'electronics' | 'both';

// ============================================================================
// Inventory Types
// ============================================================================

/**
 * Status levels for inventory items
 */
export type InventoryStatus = 'critical' | 'low' | 'normal' | 'high';

/**
 * Represents an inventory item with stock information
 */
export interface InventoryItem {
  id: number;
  name: string;
  currentStock: number;
  minimumThreshold: number;
  status: InventoryStatus;
  daysUntilEmpty: number | null;
  unitOfMeasure: string;
  category?: string;
}

// ============================================================================
// Return Rate Types
// ============================================================================

/**
 * Represents return rate statistics for a specific user
 */
export interface UserReturnRate {
  userId: number;
  username: string;
  returnRate: number;
  lateReturns: number;
}

/**
 * Represents overall return rate data
 */
export interface ReturnRateData {
  totalLoans: number;
  onTimeReturns: number;
  lateReturns: number;
  returnRate: number;
  avgDelayDays: number;
  byUser?: UserReturnRate[];
}

/**
 * Grouping options for return rate data
 */
export type ReturnRateGroupBy = 'global' | 'user' | 'category';

// ============================================================================
// Trend Data Types
// ============================================================================

/**
 * Represents trend data for a specific period
 */
export interface TrendData {
  period: string;
  consumablesUsed: number;
  loansCreated: number;
  avgLoanDuration: number;
  costs: number;
}

/**
 * Represents comparison between two periods
 */
export interface TrendComparison {
  current: TrendData;
  previous: TrendData;
  change: {
    consumablesUsed: number;
    loansCreated: number;
    avgLoanDuration: number;
    costs: number;
  };
}

// ============================================================================
// Top Users Types
// ============================================================================

/**
 * Represents a top user in the system
 */
export interface TopUser {
  userId: number;
  username: string;
  email: string;
  activeLoans: number;
  totalConsumables: number;
  totalCost: number;
  rank: number;
}

/**
 * Filter options for top users
 */
export type TopUsersFilterBy = 'loans' | 'consumables' | 'both';

// ============================================================================
// Cost Data Types
// ============================================================================

/**
 * Represents cost breakdown by category
 */
export interface CostData {
  category: string;
  cost: number;
  percentage: number;
  items: number;
}

/**
 * Grouping options for cost data
 */
export type CostGroupBy = 'category' | 'user' | 'month';

/**
 * Chart type options for cost visualization
 */
export type CostChartType = 'pie' | 'bar';

// ============================================================================
// Dashboard Statistics (Aggregate Type)
// ============================================================================

/**
 * Summary statistics for the dashboard
 */
export interface StatisticsSummary {
  totalConsumablesUsed: number;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  lowStockItems: number;
  totalCost: number;
}

/**
 * Complete dashboard statistics data
 * This is the main aggregate type that combines all statistics
 */
export interface DashboardStatistics {
  summary: StatisticsSummary;
  consumption: ConsumptionData[];
  usage: UsageData[];
  inventory: InventoryItem[];
  returnRate: ReturnRateData;
  trends: TrendData[];
  topUsers: TopUser[];
  costs: CostData[];
  alerts: Alert[];
}

// ============================================================================
// API Query Parameters
// ============================================================================

/**
 * Query parameters for statistics API endpoints
 */
export interface StatisticsQueryParams {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  groupBy?: string;
  type?: string;
  limit?: number;
  filterBy?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for MetricCard component
 */
export interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
}

/**
 * Props for AlertPanel component
 */
export interface AlertPanelProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

/**
 * Props for ConsumptionChart component
 */
export interface ConsumptionChartProps {
  data: ConsumptionData[];
  timeRange: TimeRange;
  groupBy: ConsumptionGroupBy;
}

/**
 * Props for UsageChart component
 */
export interface UsageChartProps {
  data: UsageData[];
  type: UsageType;
}

/**
 * Props for InventoryStatus component
 */
export interface InventoryStatusProps {
  items: InventoryItem[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Props for ReturnRateChart component
 */
export interface ReturnRateChartProps {
  data: ReturnRateData;
  groupBy: ReturnRateGroupBy;
}

/**
 * Props for TrendComparison component
 */
export interface TrendComparisonProps {
  currentPeriod: TrendData;
  previousPeriod: TrendData;
  metrics: string[];
}

/**
 * Props for TopUsersTable component
 */
export interface TopUsersTableProps {
  users: TopUser[];
  limit?: number;
  filterBy?: TopUsersFilterBy;
  onUserClick: (userId: number) => void;
}

/**
 * Props for CostBreakdown component
 */
export interface CostBreakdownProps {
  data: CostData[];
  chartType: CostChartType;
}

/**
 * Props for StatisticsLayout component
 */
export interface StatisticsLayoutProps {
  children: React.ReactNode;
  onTimeRangeChange: (range: TimeRange) => void;
  onCategoryChange: (category: string) => void;
  timeRange: TimeRange;
  category: string;
}

/**
 * Props for TimeRangeFilter component
 */
export interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

/**
 * Props for CategoryFilter component
 */
export interface CategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
  options: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Response type for summary endpoint
 */
export type SummaryResponse = ApiResponse<StatisticsSummary>;

/**
 * Response type for consumption endpoint
 */
export type ConsumptionResponse = ApiResponse<ConsumptionData[]>;

/**
 * Response type for usage endpoint
 */
export type UsageResponse = ApiResponse<UsageData[]>;

/**
 * Response type for inventory endpoint
 */
export type InventoryResponse = ApiResponse<InventoryItem[]>;

/**
 * Response type for return rate endpoint
 */
export type ReturnRateResponse = ApiResponse<ReturnRateData>;

/**
 * Response type for trends endpoint
 */
export type TrendsResponse = ApiResponse<TrendComparison>;

/**
 * Response type for top users endpoint
 */
export type TopUsersResponse = ApiResponse<TopUser[]>;

/**
 * Response type for costs endpoint
 */
export type CostsResponse = ApiResponse<CostData[]>;

/**
 * Response type for alerts endpoint
 */
export type AlertsResponse = ApiResponse<Alert[]>;
