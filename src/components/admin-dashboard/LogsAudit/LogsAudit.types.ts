/**
 * LogsAudit Component Types
 * 
 * Type definitions for the LogsAudit admin dashboard module.
 * Displays a searchable, paginated list of audit logs with permission-based visibility.
 * 
 * @requirements 12.3 - Require "logs:view" permission
 * @requirements 12.4 - Collapsible section (mobile) / card (desktop)
 * @requirements 12.5 - Display summary count in header
 * @requirements 12.6 - Searchable list with pagination
 */

import type { ListItemStatus } from '@/components/ds/List/List.types';

/**
 * Log severity levels
 */
export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Log entry data structure for display in the list
 */
export interface LogEntry {
  /** Unique identifier for the log entry */
  id: string | number;
  /** Log message or action description */
  message: string;
  /** User who performed the action (if applicable) */
  user?: string;
  /** Timestamp of the log entry */
  timestamp: Date | string;
  /** Log severity level */
  severity?: LogSeverity;
  /** Status for display in the list */
  status: ListItemStatus;
  /** Action type or category */
  action?: string;
  /** Additional details or metadata */
  details?: string;
  /** IP address (if applicable) */
  ipAddress?: string;
}

/**
 * Pagination state for the log list
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Props for the LogsAudit component
 */
export interface LogsAuditProps {
  /** Array of log entries to display */
  logs?: LogEntry[];
  /** Total count of logs (may differ from logs array if paginated) */
  totalCount?: number;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Error object if data failed to load */
  error?: Error | null;
  /** Current search query */
  searchQuery?: string;
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;
  /** Pagination state */
  pagination?: PaginationState;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when a log entry is clicked */
  onLogClick?: (log: LogEntry) => void;
  /** Callback when refresh/retry is triggered */
  onRefresh?: () => void;
  /** Whether the section is initially expanded (mobile only) */
  defaultExpanded?: boolean;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}
