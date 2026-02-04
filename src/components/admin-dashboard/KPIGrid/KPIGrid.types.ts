/**
 * KPIGrid Component Types
 * 
 * Type definitions for the KPIGrid dashboard module that displays
 * key performance indicators in a responsive grid layout.
 * 
 * @requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import type { TrendDirection } from '@/components/ds/MetricCard/MetricCard.types';

/**
 * KPI data structure containing all dashboard metrics
 */
export interface KPIData {
  /** Total number of loans in the system */
  totalLoans: number;
  /** Number of currently active users */
  activeUsers: number;
  /** Number of pending returns awaiting processing */
  pendingReturns: number;
  /** Number of inventory alerts requiring attention */
  inventoryAlerts: number;
  /** Trend directions for each metric */
  trends: {
    loans: TrendDirection;
    users: TrendDirection;
    returns: TrendDirection;
    alerts: TrendDirection;
  };
  /** Optional trend values for display (e.g., "+12%", "-5%") */
  trendValues?: {
    loans?: string;
    users?: string;
    returns?: string;
    alerts?: string;
  };
}

/**
 * Props for the KPIGrid component
 */
export interface KPIGridProps {
  /** KPI data to display. If undefined, component will show loading state */
  data?: KPIData;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Error object if data failed to load */
  error?: Error | null;
  /** Callback when refresh/retry is triggered */
  onRefresh?: () => void;
  /** Auto-refresh interval in milliseconds. Default is 30000 (30 seconds) */
  refreshInterval?: number;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}
