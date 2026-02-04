'use client';

/**
 * MetricCard Component
 * 
 * A card component for displaying key metrics with optional trend indicators
 * and icons. Supports loading and error states.
 * 
 * @requirements 6.1 - Display title, value, and optional trend indicator
 * @requirements 6.2 - Use Card (#1E2430) background with Border (#2A3242) border
 * @requirements 6.3 - Use 12px border radius
 * @requirements 6.4 - Display up arrow in Accent (#4ADE80) for positive trend
 * @requirements 6.5 - Display down arrow in Danger (#EF4444) for negative trend
 * @requirements 6.6 - Display skeleton placeholder when loading
 * @requirements 6.7 - Support optional icon in Primary (#E50914) color
 */

import React, { memo, useMemo } from 'react';
import type { MetricCardProps, TrendDirection } from './MetricCard.types';
import { Skeleton } from '@/components/ds/Skeleton';
import { colors, borders, spacing } from '@/design-system/tokens';

/**
 * Up arrow SVG icon for positive trends
 */
const UpArrowIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M8 3L13 8L11.59 9.41L9 6.83V13H7V6.83L4.41 9.41L3 8L8 3Z"
      fill={color}
    />
  </svg>
);

/**
 * Down arrow SVG icon for negative trends
 */
const DownArrowIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M8 13L3 8L4.41 6.59L7 9.17V3H9V9.17L11.59 6.59L13 8L8 13Z"
      fill={color}
    />
  </svg>
);

/**
 * Get the appropriate color for a trend direction
 */
const getTrendColor = (direction: TrendDirection): string => {
  switch (direction) {
    case 'up':
      return colors.accent; // #4ADE80
    case 'down':
      return colors.danger; // #EF4444
    case 'neutral':
    default:
      return colors.textSecondary; // #9CA3AF
  }
};

/**
 * Trend indicator component
 */
const TrendIndicator: React.FC<{
  direction: TrendDirection;
  value: string;
}> = ({ direction, value }) => {
  const color = getTrendColor(direction);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
      }}
      data-testid="trend-indicator"
    >
      {direction === 'up' && <UpArrowIcon color={color} />}
      {direction === 'down' && <DownArrowIcon color={color} />}
      <span
        style={{
          color,
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * Loading skeleton for MetricCard
 */
const MetricCardSkeleton: React.FC<{ testId?: string }> = ({ testId }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
    }}
    data-testid={testId ? `${testId}-skeleton` : 'metric-card-skeleton'}
  >
    {/* Title skeleton */}
    <Skeleton variant="text" width="60%" height={16} data-testid="skeleton-title" />
    {/* Value skeleton */}
    <Skeleton variant="text" width="40%" height={32} data-testid="skeleton-value" />
    {/* Trend skeleton */}
    <Skeleton variant="text" width="30%" height={16} data-testid="skeleton-trend" />
  </div>
);

/**
 * Error state for MetricCard
 */
const MetricCardError: React.FC<{
  onRetry?: () => void;
  testId?: string;
}> = ({ onRetry, testId }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    }}
    data-testid={testId ? `${testId}-error` : 'metric-card-error'}
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
        fill={colors.danger}
      />
    </svg>
    <span
      style={{
        color: colors.textSecondary,
        fontSize: '0.875rem',
        textAlign: 'center',
      }}
    >
      Failed to load
    </span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${colors.danger}`,
          borderRadius: borders.radius.button,
          color: colors.danger,
          padding: `${spacing.xs}px ${spacing.md}px`,
          fontSize: '0.75rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${colors.danger}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        data-testid="retry-button"
      >
        Retry
      </button>
    )}
  </div>
);

/**
 * MetricCard Component
 * 
 * Displays a metric with title, value, optional trend indicator, and optional icon.
 * Supports loading and error states.
 */
const MetricCardComponent: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  loading = false,
  error = false,
  onRetry,
  className,
  style,
  'data-testid': testId = 'metric-card',
}) => {
  // Card container styles - Requirements 6.2, 6.3
  const cardStyles: React.CSSProperties = useMemo(
    () => ({
      backgroundColor: colors.card, // #1E2430
      border: `1px solid ${colors.border}`, // #2A3242
      borderRadius: borders.radius.card, // 12px
      padding: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sm,
      minHeight: 120,
      ...style,
    }),
    [style]
  );

  // Icon wrapper styles - Requirement 6.7
  const iconWrapperStyles: React.CSSProperties = {
    color: colors.primary, // #E50914
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: borders.radius.button,
    backgroundColor: `${colors.primary}15`, // Primary with 15% opacity
    marginBottom: spacing.xs,
  };

  // Render loading state - Requirement 6.6
  if (loading) {
    return (
      <div
        className={className}
        style={cardStyles}
        data-testid={testId}
        data-loading="true"
        role="article"
        aria-busy="true"
        aria-label={`Loading ${title}`}
      >
        <MetricCardSkeleton testId={testId} />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div
        className={className}
        style={cardStyles}
        data-testid={testId}
        data-error="true"
        role="article"
        aria-label={`Error loading ${title}`}
      >
        <MetricCardError onRetry={onRetry} testId={testId} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={cardStyles}
      data-testid={testId}
      role="article"
      aria-label={`${title}: ${value}`}
    >
      {/* Optional icon - Requirement 6.7 */}
      {icon && (
        <div style={iconWrapperStyles} data-testid="metric-icon">
          {icon}
        </div>
      )}

      {/* Title - Requirement 6.1 */}
      <span
        style={{
          color: colors.textSecondary,
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
        data-testid="metric-title"
      >
        {title}
      </span>

      {/* Value - Requirement 6.1 */}
      <span
        style={{
          color: colors.textPrimary,
          fontSize: '1.75rem',
          fontWeight: 600,
          lineHeight: 1.2,
        }}
        data-testid="metric-value"
      >
        {value}
      </span>

      {/* Trend indicator - Requirements 6.4, 6.5 */}
      {trend && (
        <TrendIndicator direction={trend.direction} value={trend.value} />
      )}
    </div>
  );
};

// Memoized component for performance
export const MetricCard = memo(MetricCardComponent);

// Display name for debugging
MetricCard.displayName = 'MetricCard';

export default MetricCard;
