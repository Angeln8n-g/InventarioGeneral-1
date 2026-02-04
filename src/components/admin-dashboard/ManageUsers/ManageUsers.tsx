'use client';

/**
 * ManageUsers Component
 * 
 * An admin dashboard module for managing users. Displays a searchable,
 * paginated list of users with permission-based visibility.
 * 
 * Features:
 * - Permission check for "users:manage"
 * - Collapsible section on mobile, card on desktop
 * - Header with user count
 * - Searchable list with pagination
 * - Uses existing List component from design system
 * 
 * @requirements 12.1 - Require "users:manage" permission
 * @requirements 12.4 - Collapsible section (mobile) / card (desktop)
 * @requirements 12.5 - Display summary count in header
 * @requirements 12.6 - Searchable list with pagination
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import type { ManageUsersProps, UserData } from './ManageUsers.types';
import type { ListItemProps } from '@/components/ds/List/List.types';
import { List } from '@/components/ds/List';
import { ErrorState } from '@/components/ds/ErrorState';
import { EmptyState } from '@/components/ds/EmptyState';
import { Skeleton } from '@/components/ds/Skeleton';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, borders } from '@/design-system/tokens';

/**
 * Required permission for managing users
 */
const REQUIRED_PERMISSION = 'users:manage';

/**
 * Default page size for pagination
 */
const DEFAULT_PAGE_SIZE = 10;

/**
 * User icon for the header
 */
const UsersIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
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
    data-testid={testId ? `${testId}-permission-denied` : 'manage-users-permission-denied'}
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
      You don&apos;t have permission to manage users
    </p>
  </div>
);

/**
 * Loading skeleton for the module
 */
const LoadingSkeleton: React.FC<{ testId?: string }> = ({ testId }) => (
  <div data-testid={testId ? `${testId}-loading` : 'manage-users-loading'}>
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
      data-testid={testId ? `${testId}-pagination` : 'manage-users-pagination'}
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
      placeholder="Search users..."
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
      data-testid={testId ? `${testId}-search` : 'manage-users-search'}
      aria-label="Search users"
    />
  </div>
));

SearchInput.displayName = 'SearchInput';

/**
 * Convert UserData to ListItemProps
 */
const userToListItem = (user: UserData, onUserClick?: (user: UserData) => void): ListItemProps => ({
  id: user.id,
  primary: user.name,
  secondary: user.email + (user.role ? ` • ${user.role}` : ''),
  status: user.status,
  onClick: onUserClick ? () => onUserClick(user) : undefined,
});

/**
 * ManageUsers Component
 */
const ManageUsersComponent: React.FC<ManageUsersProps> = ({
  users = [],
  totalCount,
  loading = false,
  error = null,
  searchQuery = '',
  onSearchChange,
  pagination,
  onPageChange,
  onUserClick,
  onRefresh,
  defaultExpanded = true,
  className,
  style,
  'data-testid': testId = 'manage-users',
}) => {
  // Permission check - Requirement 12.1
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
  const displayCount = totalCount ?? users.length;

  // Filter users locally if no external search handler
  const filteredUsers = useMemo(() => {
    if (onSearchChange || !effectiveSearchQuery) {
      return users;
    }
    const query = effectiveSearchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.role && user.role.toLowerCase().includes(query))
    );
  }, [users, effectiveSearchQuery, onSearchChange]);

  // Convert users to list items
  const listItems: ListItemProps[] = useMemo(
    () => filteredUsers.map((user) => userToListItem(user, onUserClick)),
    [filteredUsers, onUserClick]
  );

  // Calculate pagination
  const effectivePagination = pagination ?? {
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: filteredUsers.length,
    totalPages: Math.ceil(filteredUsers.length / DEFAULT_PAGE_SIZE),
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
              <UsersIcon />
            </span>
            <span
              style={{
                color: colors.textPrimary,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Users
            </span>
          </div>
        </div>
        <ErrorState
          title="Failed to load users"
          message={error.message || 'Unable to load user data. Please try again.'}
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
            <UsersIcon />
          </span>
          <span
            style={{
              color: colors.textPrimary,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Users ({displayCount})
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

              {/* User list */}
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
                  title="No users found"
                  description={
                    effectiveSearchQuery
                      ? `No users match "${effectiveSearchQuery}"`
                      : 'There are no users to display'
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
export const ManageUsers = memo(ManageUsersComponent);
ManageUsers.displayName = 'ManageUsers';

export default ManageUsers;
