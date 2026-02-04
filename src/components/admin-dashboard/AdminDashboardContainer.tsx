'use client';

/**
 * AdminDashboardContainer Component
 * 
 * The main container component for the Admin Dashboard that integrates
 * all layout components and dashboard modules with permission-based visibility.
 * 
 * Features:
 * - AppBar at the top
 * - Sidebar on tablet/desktop, BottomNavigation on mobile
 * - Module visibility based on permissions using usePermissionGuard
 * - Automatic reordering of visible modules (visible ones come first)
 * - Empty state when no modules are visible
 * - Responsive layout using useResponsive hook
 * 
 * @requirements 3.1 - Integrate with existing PermissionsContext
 * @requirements 3.2 - Hide modules without permission
 * @requirements 3.3 - Automatically reorder visible modules
 * @requirements 3.4 - Update visible modules when permissions change
 * @requirements 3.5 - Declare required permissions per module
 * @requirements 3.6 - Display empty state when no permissions
 */

import React, { memo, useMemo, useState, useCallback } from 'react';
import { AppBar } from '@/components/layout/AppBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { KPIGrid } from '@/components/admin-dashboard/KPIGrid';
import { ManageUsers } from '@/components/admin-dashboard/ManageUsers';
import { ManageTools } from '@/components/admin-dashboard/ManageTools';
import { LogsAudit } from '@/components/admin-dashboard/LogsAudit';
import { EmptyState } from '@/components/ds/EmptyState';
import { useResponsive } from '@/hooks/useResponsive';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { colors, spacing } from '@/design-system/tokens';
import type { NavItem } from '@/components/layout/Sidebar/Sidebar.types';
import type { KPIData } from '@/components/admin-dashboard/KPIGrid/KPIGrid.types';
import type { UserData } from '@/components/admin-dashboard/ManageUsers/ManageUsers.types';
import type { ToolData } from '@/components/admin-dashboard/ManageTools/ManageTools.types';
import type { LogEntry } from '@/components/admin-dashboard/LogsAudit/LogsAudit.types';

/**
 * Module permission mappings
 */
const MODULE_PERMISSIONS = {
  kpiGrid: 'dashboard:view_kpis',
  manageUsers: 'users:manage',
  manageTools: 'tools:manage',
  logsAudit: 'logs:view',
} as const;

/**
 * All permissions for checking if user has any access
 */
const ALL_PERMISSIONS = Object.values(MODULE_PERMISSIONS);

/**
 * Module order for rendering (visible modules maintain this order)
 */
const MODULE_ORDER = ['kpiGrid', 'manageUsers', 'manageTools', 'logsAudit'] as const;

type ModuleId = typeof MODULE_ORDER[number];

/**
 * Props for AdminDashboardContainer
 */
export interface AdminDashboardContainerProps {
  /** Page title for AppBar */
  title?: string;
  /** User information for AppBar */
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  /** Notification count for AppBar */
  notificationCount?: number;
  /** Navigation items for Sidebar/BottomNavigation */
  navItems?: NavItem[];
  /** Active navigation item ID */
  activeNavId?: string;
  /** KPI data for KPIGrid module */
  kpiData?: KPIData;
  /** KPI loading state */
  kpiLoading?: boolean;
  /** KPI error state */
  kpiError?: Error | null;
  /** KPI refresh callback */
  onKpiRefresh?: () => void;
  /** Users data for ManageUsers module */
  users?: UserData[];
  /** Users total count */
  usersCount?: number;
  /** Users loading state */
  usersLoading?: boolean;
  /** Users error state */
  usersError?: Error | null;
  /** Users refresh callback */
  onUsersRefresh?: () => void;
  /** User click callback */
  onUserClick?: (user: UserData) => void;
  /** Tools data for ManageTools module */
  tools?: ToolData[];
  /** Tools total count */
  toolsCount?: number;
  /** Tools loading state */
  toolsLoading?: boolean;
  /** Tools error state */
  toolsError?: Error | null;
  /** Tools refresh callback */
  onToolsRefresh?: () => void;
  /** Tool click callback */
  onToolClick?: (tool: ToolData) => void;
  /** Logs data for LogsAudit module */
  logs?: LogEntry[];
  /** Logs total count */
  logsCount?: number;
  /** Logs loading state */
  logsLoading?: boolean;
  /** Logs error state */
  logsError?: Error | null;
  /** Logs refresh callback */
  onLogsRefresh?: () => void;
  /** Log click callback */
  onLogClick?: (log: LogEntry) => void;
  /** Callback when notifications icon is clicked */
  onNotificationsClick?: () => void;
  /** Callback when profile is clicked */
  onProfileClick?: () => void;
  /** Callback when logout is clicked */
  onLogoutClick?: () => void;
  /** Callback when navigation item is clicked */
  onNavigate?: (item: NavItem) => void;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Default navigation items
 */
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    href: '/admin/dashboard',
  },
  {
    id: 'users',
    label: 'Users',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    href: '/admin/users',
    permission: 'users:manage',
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    href: '/admin/tools',
    permission: 'tools:manage',
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    href: '/admin/logs',
    permission: 'logs:view',
  },
];

/**
 * No permissions icon for empty state
 */
const NoPermissionsIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
      fill={colors.textSecondary}
      opacity="0.5"
    />
  </svg>
);

/**
 * Layout constants
 */
const APPBAR_HEIGHT_MOBILE = 56;
const APPBAR_HEIGHT_DESKTOP = 64;
const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const BOTTOM_NAV_HEIGHT = 64;

/**
 * AdminDashboardContainer Component
 */
const AdminDashboardContainerComponent: React.FC<AdminDashboardContainerProps> = ({
  title = 'Admin Dashboard',
  user,
  notificationCount = 0,
  navItems = DEFAULT_NAV_ITEMS,
  activeNavId = 'dashboard',
  kpiData,
  kpiLoading = false,
  kpiError = null,
  onKpiRefresh,
  users = [],
  usersCount,
  usersLoading = false,
  usersError = null,
  onUsersRefresh,
  onUserClick,
  tools = [],
  toolsCount,
  toolsLoading = false,
  toolsError = null,
  onToolsRefresh,
  onToolClick,
  logs = [],
  logsCount,
  logsLoading = false,
  logsError = null,
  onLogsRefresh,
  onLogClick,
  onNotificationsClick,
  onProfileClick,
  onLogoutClick,
  onNavigate,
  className,
  style,
  'data-testid': testId = 'admin-dashboard-container',
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Sidebar collapsed state for tablet
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check permissions for each module - Requirement 3.1, 3.2
  const { hasAccess: hasKpiAccess } = usePermissionGuard({
    permissions: [MODULE_PERMISSIONS.kpiGrid],
  });
  const { hasAccess: hasUsersAccess } = usePermissionGuard({
    permissions: [MODULE_PERMISSIONS.manageUsers],
  });
  const { hasAccess: hasToolsAccess } = usePermissionGuard({
    permissions: [MODULE_PERMISSIONS.manageTools],
  });
  const { hasAccess: hasLogsAccess } = usePermissionGuard({
    permissions: [MODULE_PERMISSIONS.logsAudit],
  });

  // Check if user has any permissions at all - Requirement 3.6
  const { hasAccess: hasAnyAccess, isLoading: permissionsLoading } = usePermissionGuard({
    permissions: ALL_PERMISSIONS,
  });

  // Build module visibility map - Requirement 3.2
  const moduleVisibility = useMemo(() => ({
    kpiGrid: hasKpiAccess,
    manageUsers: hasUsersAccess,
    manageTools: hasToolsAccess,
    logsAudit: hasLogsAccess,
  }), [hasKpiAccess, hasUsersAccess, hasToolsAccess, hasLogsAccess]);

  // Get ordered visible modules - Requirement 3.3
  const visibleModules = useMemo(() => {
    return MODULE_ORDER.filter((moduleId) => moduleVisibility[moduleId]);
  }, [moduleVisibility]);

  // Toggle sidebar collapsed state
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((item: NavItem) => {
    onNavigate?.(item);
  }, [onNavigate]);

  // Calculate layout dimensions
  const appBarHeight = isMobile ? APPBAR_HEIGHT_MOBILE : APPBAR_HEIGHT_DESKTOP;
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const showSidebar = isTablet || isDesktop;
  const showBottomNav = isMobile;

  // Main content styles
  const mainContentStyles: React.CSSProperties = useMemo(() => ({
    marginTop: appBarHeight,
    marginLeft: showSidebar ? sidebarWidth : 0,
    marginBottom: showBottomNav ? BOTTOM_NAV_HEIGHT : 0,
    padding: spacing.lg,
    minHeight: `calc(100vh - ${appBarHeight}px - ${showBottomNav ? BOTTOM_NAV_HEIGHT : 0}px)`,
    backgroundColor: colors.background,
    transition: 'margin-left 0.2s ease',
  }), [appBarHeight, showSidebar, sidebarWidth, showBottomNav]);

  // Module container styles
  const moduleContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  };

  // Render module by ID
  const renderModule = useCallback((moduleId: ModuleId) => {
    switch (moduleId) {
      case 'kpiGrid':
        return (
          <KPIGrid
            key="kpiGrid"
            data={kpiData}
            loading={kpiLoading}
            error={kpiError}
            onRefresh={onKpiRefresh}
            data-testid="dashboard-kpi-grid"
          />
        );
      case 'manageUsers':
        return (
          <ManageUsers
            key="manageUsers"
            users={users}
            totalCount={usersCount}
            loading={usersLoading}
            error={usersError}
            onRefresh={onUsersRefresh}
            onUserClick={onUserClick}
            data-testid="dashboard-manage-users"
          />
        );
      case 'manageTools':
        return (
          <ManageTools
            key="manageTools"
            tools={tools}
            totalCount={toolsCount}
            loading={toolsLoading}
            error={toolsError}
            onRefresh={onToolsRefresh}
            onToolClick={onToolClick}
            data-testid="dashboard-manage-tools"
          />
        );
      case 'logsAudit':
        return (
          <LogsAudit
            key="logsAudit"
            logs={logs}
            totalCount={logsCount}
            loading={logsLoading}
            error={logsError}
            onRefresh={onLogsRefresh}
            onLogClick={onLogClick}
            data-testid="dashboard-logs-audit"
          />
        );
      default:
        return null;
    }
  }, [
    kpiData, kpiLoading, kpiError, onKpiRefresh,
    users, usersCount, usersLoading, usersError, onUsersRefresh, onUserClick,
    tools, toolsCount, toolsLoading, toolsError, onToolsRefresh, onToolClick,
    logs, logsCount, logsLoading, logsError, onLogsRefresh, onLogClick,
  ]);

  return (
    <div
      className={className}
      style={style}
      data-testid={testId}
    >
      {/* AppBar - Always at top */}
      <AppBar
        title={title}
        showNotifications
        showUserMenu={!!user}
        user={user}
        notificationCount={notificationCount}
        onMenuClick={isMobile ? handleSidebarToggle : undefined}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
        onLogoutClick={onLogoutClick}
      />

      {/* Sidebar - Tablet/Desktop only */}
      {showSidebar && (
        <Sidebar
          items={navItems}
          activeId={activeNavId}
          collapsed={sidebarCollapsed}
          onToggle={isTablet ? handleSidebarToggle : undefined}
          onNavigate={handleNavigate}
        />
      )}

      {/* Main Content Area */}
      <main style={mainContentStyles} data-testid={`${testId}-main`}>
        {/* Loading state while checking permissions */}
        {permissionsLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
            }}
            data-testid={`${testId}-loading`}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: `3px solid ${colors.border}`,
                borderTopColor: colors.primary,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : !hasAnyAccess ? (
          /* Empty state when no permissions - Requirement 3.6 */
          <EmptyState
            icon={<NoPermissionsIcon />}
            title="No Access"
            description="You don't have permission to view any dashboard modules. Please contact your administrator to request access."
            data-testid={`${testId}-empty-state`}
          />
        ) : (
          /* Render visible modules in order - Requirement 3.3 */
          <div style={moduleContainerStyles} data-testid={`${testId}-modules`}>
            {visibleModules.map((moduleId) => renderModule(moduleId))}
          </div>
        )}
      </main>

      {/* BottomNavigation - Mobile only */}
      {showBottomNav && (
        <BottomNavigation
          items={navItems}
          activeId={activeNavId}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

// Memoized component for optimization
export const AdminDashboardContainer = memo(AdminDashboardContainerComponent);
AdminDashboardContainer.displayName = 'AdminDashboardContainer';

export default AdminDashboardContainer;
