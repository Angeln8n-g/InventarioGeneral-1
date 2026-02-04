/**
 * ManageTools Component Types
 * 
 * Type definitions for the ManageTools admin dashboard module.
 * Displays a searchable, paginated list of tools with permission-based visibility.
 * 
 * @requirements 12.2 - Require "tools:manage" permission
 * @requirements 12.4 - Collapsible section (mobile) / card (desktop)
 * @requirements 12.5 - Display summary count in header
 * @requirements 12.6 - Searchable list with pagination
 */

import type { ListItemStatus } from '@/components/ds/List/List.types';

/**
 * Tool data structure for display in the list
 */
export interface ToolData {
  /** Unique identifier for the tool */
  id: string | number;
  /** Tool's display name */
  name: string;
  /** Tool's description or category */
  description?: string;
  /** Tool's category or type */
  category?: string;
  /** Tool's availability status */
  status: ListItemStatus;
  /** Serial number or identifier */
  serialNumber?: string;
  /** Last maintenance date */
  lastMaintenance?: Date | string;
}

/**
 * Pagination state for the tool list
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
 * Props for the ManageTools component
 */
export interface ManageToolsProps {
  /** Array of tools to display */
  tools?: ToolData[];
  /** Total count of tools (may differ from tools array if paginated) */
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
  /** Callback when a tool is clicked */
  onToolClick?: (tool: ToolData) => void;
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
