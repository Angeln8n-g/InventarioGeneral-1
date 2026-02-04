/**
 * EmptyState Component Type Definitions
 * 
 * Type definitions for the Design System EmptyState component.
 * Used to display helpful empty states when lists or sections have no data.
 * 
 * @requirements 14.1, 14.2, 14.3, 14.4
 */

import type { ReactNode } from 'react';

/**
 * Action configuration for the EmptyState component
 */
export interface EmptyStateAction {
  /** Label text for the action button */
  label: string;
  /** Click handler for the action button */
  onClick: () => void;
}

/**
 * EmptyState component props interface
 */
export interface EmptyStateProps {
  /** Optional illustrative icon to display */
  icon?: ReactNode;
  /** Title text describing the empty state */
  title: string;
  /** Optional description providing more context */
  description?: string;
  /** Optional call-to-action button configuration */
  action?: EmptyStateAction;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional test ID for testing */
  'data-testid'?: string;
}
