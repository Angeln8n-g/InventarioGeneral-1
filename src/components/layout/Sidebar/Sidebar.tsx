'use client';

/**
 * Sidebar Component
 * @requirements 2.2, 2.3, 2.5
 */

import React, { useCallback, memo } from 'react';
import { colors, spacing, borders } from '@/design-system/tokens';
import { useResponsive } from '@/hooks/useResponsive';
import type { SidebarProps, NavItem } from './Sidebar.types';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

const NavItemButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: (item: NavItem) => void;
}> = memo(({ item, isActive, collapsed, onClick }) => {
  const handleClick = useCallback(() => onClick(item), [item, onClick]);

  return (
    <button
      data-testid={`sidebar-item-${item.id}`}
      onClick={handleClick}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        width: '100%',
        background: isActive ? `${colors.primary}15` : 'transparent',
        border: 'none',
        borderRadius: borders.radius.button,
        cursor: 'pointer',
        color: isActive ? colors.primary : colors.textSecondary,
        transition: 'all 0.2s ease',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0 }}>
        {item.icon}
      </span>
      {!collapsed && (
        <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
      )}
    </button>
  );
});

NavItemButton.displayName = 'NavItemButton';

const SidebarComponent: React.FC<SidebarProps> = ({ collapsed = false, onToggle, items, activeId, onNavigate }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const handleItemClick = useCallback((item: NavItem) => {
    onNavigate?.(item);
  }, [onNavigate]);

  // Don't render on mobile (use BottomNavigation instead)
  if (isMobile) return null;

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <aside
      data-testid="sidebar"
      role="navigation"
      aria-label="Sidebar navigation"
      style={{
        position: 'fixed',
        top: isDesktop ? 64 : 64, // Below AppBar
        left: 0,
        bottom: 0,
        width: `${width}px`,
        backgroundColor: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: spacing.md,
        gap: spacing.xs,
        transition: 'width 0.2s ease',
        zIndex: 900,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Toggle button for tablet */}
      {isTablet && onToggle && (
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.sm,
            marginBottom: spacing.md,
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: borders.radius.button,
            cursor: 'pointer',
            color: colors.textSecondary,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M13 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      )}

      {/* Navigation items */}
      {items.map((item) => (
        <NavItemButton
          key={item.id}
          item={item}
          isActive={item.id === activeId}
          collapsed={collapsed}
          onClick={handleItemClick}
        />
      ))}
    </aside>
  );
};

export const Sidebar = memo(SidebarComponent);
Sidebar.displayName = 'Sidebar';

export default Sidebar;
