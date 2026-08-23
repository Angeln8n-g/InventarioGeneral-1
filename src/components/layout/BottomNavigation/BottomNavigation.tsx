'use client';

/**
 * BottomNavigation Component
 * @requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import React, { useCallback, memo } from 'react';
import { colors, spacing } from '@/design-system/tokens';
import { useResponsive } from '@/hooks/useResponsive';
import type { BottomNavigationProps, NavItem } from './BottomNavigation.types';

const MAX_ITEMS = 5;
const NAV_HEIGHT = 64;

function triggerHapticFeedback(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

const NavItemButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: (item: NavItem) => void;
}> = memo(({ item, isActive, onClick }) => {
  const handleClick = useCallback(() => {
    triggerHapticFeedback();
    onClick(item);
  }, [item, onClick]);

  const color = isActive ? colors.primary : colors.textSecondary;

  return (
    <button
      data-testid={`nav-item-${item.id}`}
      onClick={handleClick}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        padding: `${spacing.sm}px ${spacing.xs}px`,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: color,
        transition: 'color 0.2s ease',
        minWidth: 0,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, color }}>
        {item.icon}
      </span>
      <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {item.label}
      </span>
    </button>
  );
});

NavItemButton.displayName = 'NavItemButton';

const BottomNavigationComponent: React.FC<BottomNavigationProps> = ({ items, activeId, onNavigate }) => {
  const { isMobile } = useResponsive();

  const handleItemClick = useCallback((item: NavItem) => {
    onNavigate?.(item);
  }, [onNavigate]);

  if (!isMobile) return null;

  const displayItems = items.slice(0, MAX_ITEMS);

  return (
    <nav
      data-testid="bottom-navigation"
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${NAV_HEIGHT}px`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: colors.surface,
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
      }}
    >
      {displayItems.map((item) => (
        <NavItemButton key={item.id} item={item} isActive={item.id === activeId} onClick={handleItemClick} />
      ))}
    </nav>
  );
};

export const BottomNavigation = memo(BottomNavigationComponent);
BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;
