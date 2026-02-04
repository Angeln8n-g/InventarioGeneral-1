/**
 * List Component Type Definitions
 * 
 * Type definitions for the Design System List component.
 * Supports status indicators, action slots, and virtualization.
 * 
 * @requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { ReactNode } from 'react';

/**
 * Status types for list items
 * - active: Displayed with Accent (#4ADE80) indicator
 * - pending: Displayed with Warning (#F59E0B) indicator
 * - error: Displayed with Danger (#EF4444) indicator
 * - inactive: No status indicator displayed
 */
export type ListItemStatus = 'active' | 'pending' | 'error' | 'inactive';

/**
 * Individual list item props
 */
export interface ListItemProps {
  /** Unique identifier for the list item */
  id: string | number;
  /** Primary text content */
  primary: string;
  /** Secondary text content (optional) */
  secondary?: string;
  /** Status indicator type (optional) */
  status?: ListItemStatus;
  /** Action element to display on the right side (optional) */
  action?: ReactNode;
  /** Click handler for the list item (optional) */
  onClick?: () => void;
}

/**
 * List component props
 */
export interface ListProps {
  /** Array of list items to display */
  items: ListItemProps[];
  /** Whether the list is in a loading state */
  loading?: boolean;
  /** Custom empty state element to display when items array is empty */
  emptyState?: ReactNode;
  /** Whether to enable virtualization (auto-enabled for lists > 50 items) */
  virtualized?: boolean;
  /** Callback when a list item is clicked */
  onItemClick?: (item: ListItemProps) => void;
  /** Height of each list item in pixels (used for virtualization) */
  itemHeight?: number;
  /** Maximum height of the list container in pixels (used for virtualization) */
  maxHeight?: number;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}

/**
 * Internal ListItem component props (includes additional internal props)
 */
export interface ListItemInternalProps extends ListItemProps {
  /** Whether this is the last item in the list (no border) */
  isLast?: boolean;
  /** Callback when item is clicked (from parent List) */
  onItemClick?: (item: ListItemProps) => void;
}
