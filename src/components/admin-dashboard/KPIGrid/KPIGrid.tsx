'use client';

/**
 * KPIGrid Component
 * 
 * A dashboard module that displays key performance indicators in a responsive grid.
 * Shows 4 MetricCards: total loans, active users, pending returns, and inventory alerts.
 * 
 * Features:
 * - Permission check for "dashboard:view_kpis"
 * - Error state with retry functionality
 * - Auto-refresh every 30 seconds (configurable)
 * - Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
 * 
 * @requirements 11.1 - Display MetricCards in responsive grid
 * @requirements 11.2 - Require "dashboard:view_kpis" permission
 * @requirements 11.3 - Display metrics for total loans, active users, pending returns, inventory alerts
 * @requirements 11.4 - Display error state with retry button when data fails to load
 * @requirements 11.5 - Refresh data automatically every 30 seconds
 */

import React, { memo, useEffect, useCallback, useRef } from 'react';
import type { KPIGridProps } from './KPIGrid.types';
import { MetricCard } from '@/components/ds/MetricCard';
import { ErrorState } from '@/components/ds/ErrorState';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { colors, spacing } from '@/design-system/tokens';

/**
 * Default auto-refresh interval (30 seconds)
 */
const DEFAULT_REFRESH_INTERVAL = 30000;

/**
 * Required permission for viewing KPIs
 */
const REQUIRED_PERMISSION = 'dashboard:view_kpis';

/**
 * Icons for each metric card
 */
const LoanIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z"
      fill="currentColor"
    />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
      fill="currentColor"
    />
  </svg>
);

const ReturnIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13H4C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13C20 8.58 16.42 5 12 5Z"
      fill="currentColor"
    />
  </svg>
);

const AlertIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Permission denied state component
 */
const PermissionDenied: React.FC<{ testId?: string }> = ({ testId }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
      textAlign: 'center',
    }}
    data-testid={testId ? `${testId}-permission-denied` : 'kpi-grid-permission-denied'}
  >
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginBottom: spacing.lg }}
    >
      <path
        d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
        fill={colors.textSecondary}
      />
    </svg>
    <p
      style={{
        color: colors.textSecondary,
        fontSize: '0.875rem',
        margin: 0,
      }}
    >
      You don&apos;t have permission to view KPIs
    </p>
  </div>
);

/**
 * Loading state component - shows 4 skeleton MetricCards
 */
const LoadingState: React.FC<{ testId?: string }> = ({ testId }) => (
  <ResponsiveGrid data-testid={testId ? `${testId}-loading` : 'kpi-grid-loading'}>
    <MetricCard title="Total Loans" value={0} loading data-testid="metric-total-loans" />
    <MetricCard title="Active Users" value={0} loading data-testid="metric-active-users" />
    <MetricCard title="Pending Returns" value={0} loading data-testid="metric-pending-returns" />
    <MetricCard title="Inventory Alerts" value={0} loading data-testid="metric-inventory-alerts" />
  </ResponsiveGrid>
);

/**
 * KPIGrid Component
 */
const KPIGridComponent: React.FC<KPIGridProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  className,
  style,
  'data-testid': testId = 'kpi-grid',
}) => {
  // Permission check - Requirement 11.2
  const { hasAccess, isLoading: permissionLoading } = usePermissionGuard({
    permissions: [REQUIRED_PERMISSION],
  });

  // Ref to track retry count for error state
  const retryCountRef = useRef(0);

  // Auto-refresh effect - Requirement 11.5
  useEffect(() => {
    if (!hasAccess || !onRefresh || error) {
      return;
    }

    const intervalId = setInterval(() => {
      onRefresh();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasAccess, onRefresh, refreshInterval, error]);

  // Handle retry with count tracking
  const handleRetry = useCallback(() => {
    retryCountRef.current += 1;
    onRefresh?.();
  }, [onRefresh]);

  // Reset retry count when data loads successfully
  useEffect(() => {
    if (data && !error) {
      retryCountRef.current = 0;
    }
  }, [data, error]);

  // Container styles
  const containerStyles: React.CSSProperties = {
    ...style,
  };

  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <div className={className} style={containerStyles} data-testid={testId}>
        <LoadingState testId={testId} />
      </div>
    );
  }

  // Show permission denied if user lacks access
  if (!hasAccess) {
    return (
      <div className={className} style={containerStyles} data-testid={testId}>
        <PermissionDenied testId={testId} />
      </div>
    );
  }

  // Show error state with retry - Requirement 11.4
  if (error) {
    return (
      <div className={className} style={containerStyles} data-testid={testId}>
        <ErrorState
          title="Failed to load KPIs"
          message={error.message || 'Unable to load dashboard metrics. Please try again.'}
          onRetry={onRefresh ? handleRetry : undefined}
          retryCount={retryCountRef.current}
          data-testid={`${testId}-error`}
        />
      </div>
    );
  }

  // Show loading state
  if (loading || !data) {
    return (
      <div className={className} style={containerStyles} data-testid={testId}>
        <LoadingState testId={testId} />
      </div>
    );
  }

  // Render KPI grid with 4 MetricCards - Requirements 11.1, 11.3
  return (
    <div className={className} style={containerStyles} data-testid={testId}>
      <ResponsiveGrid data-testid={`${testId}-grid`}>
        {/* Total Loans */}
        <MetricCard
          title="Total Loans"
          value={data.totalLoans.toLocaleString()}
          icon={<LoanIcon />}
          trend={
            data.trends.loans !== 'neutral'
              ? {
                  direction: data.trends.loans,
                  value: data.trendValues?.loans || '',
                }
              : undefined
          }
          data-testid="metric-total-loans"
        />

        {/* Active Users */}
        <MetricCard
          title="Active Users"
          value={data.activeUsers.toLocaleString()}
          icon={<UserIcon />}
          trend={
            data.trends.users !== 'neutral'
              ? {
                  direction: data.trends.users,
                  value: data.trendValues?.users || '',
                }
              : undefined
          }
          data-testid="metric-active-users"
        />

        {/* Pending Returns */}
        <MetricCard
          title="Pending Returns"
          value={data.pendingReturns.toLocaleString()}
          icon={<ReturnIcon />}
          trend={
            data.trends.returns !== 'neutral'
              ? {
                  direction: data.trends.returns,
                  value: data.trendValues?.returns || '',
                }
              : undefined
          }
          data-testid="metric-pending-returns"
        />

        {/* Inventory Alerts */}
        <MetricCard
          title="Inventory Alerts"
          value={data.inventoryAlerts.toLocaleString()}
          icon={<AlertIcon />}
          trend={
            data.trends.alerts !== 'neutral'
              ? {
                  direction: data.trends.alerts,
                  value: data.trendValues?.alerts || '',
                }
              : undefined
          }
          data-testid="metric-inventory-alerts"
        />
      </ResponsiveGrid>
    </div>
  );
};

// Memoized component for optimization
export const KPIGrid = memo(KPIGridComponent);
KPIGrid.displayName = 'KPIGrid';

export default KPIGrid;
