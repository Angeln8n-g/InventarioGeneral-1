/**
 * MetricCard Component Types
 * 
 * Type definitions for the MetricCard component used to display
 * key metrics with optional trend indicators and icons.
 * 
 * @requirements 6.1, 6.4, 6.5, 6.6, 6.7
 */

import React from 'react';

/**
 * Direction of the trend indicator
 * - 'up': Positive trend (displayed in Accent color)
 * - 'down': Negative trend (displayed in Danger color)
 * - 'neutral': No change (no arrow displayed)
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Trend information for the metric
 */
export interface MetricTrend {
  /** Direction of the trend */
  direction: TrendDirection;
  /** Display value for the trend (e.g., "+12%", "-5%") */
  value: string;
}

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps {
  /** Title of the metric (e.g., "Total Loans") */
  title: string;
  /** Value to display (can be string or number) */
  value: string | number;
  /** Optional trend indicator with direction and value */
  trend?: MetricTrend;
  /** Optional icon to display (rendered in Primary color) */
  icon?: React.ReactNode;
  /** Whether the card is in loading state (shows skeleton) */
  loading?: boolean;
  /** Whether the card is in error state */
  error?: boolean;
  /** Callback when retry button is clicked (only shown in error state) */
  onRetry?: () => void;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}
