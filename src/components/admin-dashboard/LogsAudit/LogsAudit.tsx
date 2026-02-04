'use client';

/**
 * LogsAudit Component
 * 
 * An admin dashboard module for viewing audit logs. Displays a searchable,
 * paginated list of log entries with permission-based visibility.
 * 
 * Features:
 * - Permission check for "logs:view"
 * - Collapsible section on mobile, card on desktop
 * - Header with log count
 * - Searchable list with pagination
 * - Uses existing List component from design system
 * 
 * @requirements 12.3 - Require "logs:view" permission
 * @requirements 12.4 - Collapsible section (mobile) / card (desktop)
 * @requirements 12.5 - Display summary count in header
 * @requirements 12.6 - Searchable list with pagination
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import type { LogsAuditProps, LogEntry } from './LogsAudit.types';
import type { ListItemProps } from '@/components/ds/List/List.types';
import { List } from '@/components/ds/List';
import { ErrorState } from '@/components/ds/ErrorState';
import { EmptyState } from '@/components/ds/EmptyState';
import { Skeleton } from '@/components/ds/Skeleton';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, borders } from '@/design-system/tokens';

/**
 * Required permission for viewing logs
 */
const REQUIRED_PERMISSION = 'logs:view';

/**
 * Default page size for pagination
 */
const DEFAULT_PAGE_SIZE = 10;

/**
 * Logs icon for the header
 */
const LogsIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Search icon for the search input
 */
const SearchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Chevron icon for collapsible header
 */
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease-in-out',
    }}
  >
    <path
      d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z"
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
    data-testid={testId ? `${testId}-permission-denied` : 'logs-audit-permission-denied'}
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
      You don&apos;t have permission to view audit logs
    </p>
  </div>
);

/**
 * Loading skeleton for the module
 */
const LoadingSkeleton: React.FC<{ testId?: string }> = ({ testId }) => (
  <div data-testid={testId ? `${testId}-loading` : 'logs-audit-loading'}>
    <div style={{ padding: spacing.lg }}>
      <Skeleton variant="rectangular" width="100%" height={40} />
    </div>
    <div style={{ padding: `0 ${spacing.lg}px ${spacing.lg}px` }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: `${spacing.md}px 0`,
            borderBottom: index < 2 ? `1px solid ${colors.border}` : 'none',
          }}
        >
          <Skeleton variant="circular" width={32} height={32} />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
        </div>
      ))}
    </div>
  </div>
);


/**
 * Pagination component
 */
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  testId?: string;
}> = memo(({ currentPage, totalPages, onPageChange, testId }) => {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.lg,
        borderTop: `1px solid ${colors.border}`,
      }}
      data-testid={testId ? `${testId}-pagination` : 'logs-audit-pagination'}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          backgroundColor: 'transparent',
          border: `1px solid ${colors.border}`,
          borderRadius: borders.radius.button,
          color: currentPage <= 1 ? colors.disabled : colors.textPrimary,
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
        }}
        aria-label="Previous page"
      >
        Previous
      </button>
      <span
        style={{
          color: colors.textSecondary,
          fontSize: '0.875rem',
          padding: `0 ${spacing.md}px`,
        }}
      >
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          backgroundColor: 'transparent',
          border: `1px solid ${colors.border}`,
          borderRadius: borders.radius.button,
          color: currentPage >= totalPages ? colors.disabled : colors.textPrimary,
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
        }}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
});

Pagination.displayName = 'Pagination';

/**
 * Search input component
 */
const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}> = memo(({ value, onChange, testId }) => (
  <div
    style={{
      position: 'relative',
      padding: spacing.lg,
      paddingTop: 0,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: spacing.lg + spacing.md,
        top: '50%',
        transform: 'translateY(-50%)',
        color: colors.textSecondary,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <SearchIcon />
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search logs..."
      style={{
        width: '100%',
        padding: `${spacing.sm}px ${spacing.lg}px ${spacing.sm}px ${spacing.xl + spacing.md}px`,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: borders.radius.button,
        color: colors.textPrimary,
        fontSize: '0.875rem',
        outline: 'none',
        boxSizing: 'border-box',
      }}
      data-testid={testId ? `${testId}-search` : 'logs-audit-search'}
      aria-label="Search logs"
    />
  </div>
));

SearchInput.displayName = 'SearchInput';

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Convert LogEntry to ListItemProps
 */
const logToListItem = (log: LogEntry, onLogClick?: (log: LogEntry) => void): ListItemProps => ({
  id: log.id,
  primary: log.message,
  secondary: [
    log.user && `by ${log.user}`,
    log.action && `[${log.action}]`,
    formatTimestamp(log.timestamp),
  ]
    .filter(Boolean)
    .join(' • '),
  status: log.status,
  onClick: onLogClick ? () => onLogClick(log) : undefined,
});


/**
 * LogsAudit Component
 */
const LogsAuditComponent: React.FC<LogsAuditProps> = ({
  logs = [],
  totalCount,
  loading = false,
  error = null,
  searchQuery = '',
  onSearchChange,
  pagination,
  onPageChange,
  onLogClick,
  onRefresh,
  defaultExpanded = true,
  className,
  style,
  'data-testid': testId = 'logs-audit',
}) => {
  // Permission check - Requirement 12.3
  const { hasAccess, isLoading: permissionLoading } = usePermissionGuard({
    permissions: [REQUIRED_PERMISSION],
  });

  // Responsive hook for mobile/desktop layout - Requirement 12.4
  const { isMobile } = useResponsive();

  // Collapsible state for mobile
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Local search state if no external handler provided
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const effectiveSearchQuery = onSearchChange ? searchQuery : localSearchQuery;
  const handleSearchChange = useCallback(
    (query: string) => {
      if (onSearchChange) {
        onSearchChange(query);
      } else {
        setLocalSearchQuery(query);
      }
    },
    [onSearchChange]
  );

  // Calculate display count - Requirement 12.5
  const displayCount = totalCount ?? logs.length;

  // Filter logs locally if no external search handler
  const filteredLogs = useMemo(() => {
    if (onSearchChange || !effectiveSearchQuery) {
      return logs;
    }
    const query = effectiveSearchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(query) ||
        (log.user && log.user.toLowerCase().includes(query)) ||
        (log.action && log.action.toLowerCase().includes(query)) ||
        (log.details && log.details.toLowerCase().includes(query))
    );
  }, [logs, effectiveSearchQuery, onSearchChange]);

  // Convert logs to list items
  const listItems: ListItemProps[] = useMemo(
    () => filteredLogs.map((log) => logToListItem(log, onLogClick)),
    [filteredLogs, onLogClick]
  );

  // Calculate pagination
  const effectivePagination = pagination ?? {
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: filteredLogs.length,
    totalPages: Math.ceil(filteredLogs.length / DEFAULT_PAGE_SIZE),
  };

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      if (onPageChange) {
        onPageChange(page);
      }
    },
    [onPageChange]
  );

  // Toggle expanded state (mobile only)
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Container styles - Requirement 12.4
  const containerStyles: React.CSSProperties = useMemo(
    () => ({
      backgroundColor: colors.card,
      borderRadius: borders.radius.card,
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      ...style,
    }),
    [style]
  );

  // Header styles
  const headerStyles: React.CSSProperties = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderBottom: isExpanded || !isMobile ? `1px solid ${colors.border}` : 'none',
      cursor: isMobile ? 'pointer' : 'default',
      userSelect: 'none' as const,
    }),
    [isExpanded, isMobile]
  );

  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <div className={className} style={containerStyles} data-testid={testId}>
        <LoadingSkeleton testId={testId} />
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

  // Show error state with retry
  if (error) {
    return (
      <div className={className} style={containerStyles} data-testid={testId}>
        <div style={headerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ color: colors.primary }}>
              <LogsIcon />
            </span>
            <span
              style={{
                color: colors.textPrimary,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Audit Logs
            </span>
          </div>
        </div>
        <ErrorState
          title="Failed to load logs"
          message={error.message || 'Unable to load audit log data. Please try again.'}
          onRetry={onRefresh}
          data-testid={`${testId}-error`}
        />
      </div>
    );
  }

  // Render the module
  return (
    <div className={className} style={containerStyles} data-testid={testId}>
      {/* Header with count - Requirement 12.5 */}
      <div
        style={headerStyles}
        onClick={isMobile ? toggleExpanded : undefined}
        onKeyDown={
          isMobile
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpanded();
                }
              }
            : undefined
        }
        role={isMobile ? 'button' : undefined}
        tabIndex={isMobile ? 0 : undefined}
        aria-expanded={isMobile ? isExpanded : undefined}
        data-testid={`${testId}-header`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ color: colors.primary }}>
            <LogsIcon />
          </span>
          <span
            style={{
              color: colors.textPrimary,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Audit Logs ({displayCount})
          </span>
        </div>
        {isMobile && (
          <span style={{ color: colors.textSecondary }}>
            <ChevronIcon expanded={isExpanded} />
          </span>
        )}
      </div>

      {/* Content - collapsible on mobile, always visible on desktop */}
      {(isExpanded || !isMobile) && (
        <div data-testid={`${testId}-content`}>
          {/* Loading state */}
          {loading ? (
            <LoadingSkeleton testId={testId} />
          ) : (
            <>
              {/* Search input - Requirement 12.6 */}
              <SearchInput
                value={effectiveSearchQuery}
                onChange={handleSearchChange}
                testId={testId}
              />

              {/* Log list */}
              {listItems.length > 0 ? (
                <>
                  <List
                    items={listItems}
                    data-testid={`${testId}-list`}
                    style={{
                      border: 'none',
                      borderRadius: 0,
                    }}
                  />
                  {/* Pagination - Requirement 12.6 */}
                  <Pagination
                    currentPage={effectivePagination.currentPage}
                    totalPages={effectivePagination.totalPages}
                    onPageChange={handlePageChange}
                    testId={testId}
                  />
                </>
              ) : (
                <EmptyState
                  title="No logs found"
                  description={
                    effectiveSearchQuery
                      ? `No logs match "${effectiveSearchQuery}"`
                      : 'There are no audit logs to display'
                  }
                  data-testid={`${testId}-empty`}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Memoized component for optimization
export const LogsAudit = memo(LogsAuditComponent);
LogsAudit.displayName = 'LogsAudit';

export default LogsAudit;
