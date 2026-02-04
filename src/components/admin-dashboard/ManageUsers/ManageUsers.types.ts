/**
 * ManageUsers Component Types
 * 
 * Type definitions for the ManageUsers admin dashboard module.
 * Displays a searchable, paginated list of users with permission-based visibility.
 * 
 * @requirements 12.1 - Require "users:manage" permission
 * @requirements 12.4 - Collapsible section (mobile) / card (desktop)
 * @requirements 12.5 - Display summary count in header
 * @requirements 12.6 - Searchable list with pagination
 */

import type { ListItemStatus } from '@/components/ds/List/List.types';

/**
 * User data structure for display in the list
 */
export interface UserData {
  /** Unique identifier for the user */
  id: string | number;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** User's role or position */
  role?: string;
  /** User's account status */
  status: ListItemStatus;
  /** Last activity timestamp */
  lastActive?: Date | string;
}

/**
 * Pagination state for the user list
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
 * Props for the ManageUsers component
 */
export interface ManageUsersProps {
  /** Array of users to display */
  users?: UserData[];
  /** Total count of users (may differ from users array if paginated) */
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
  /** Callback when a user is clicked */
  onUserClick?: (user: UserData) => void;
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
