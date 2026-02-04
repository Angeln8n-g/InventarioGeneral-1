/**
 * AppBar Component
 * 
 * A consistent header component for the Admin Dashboard that displays
 * the application logo, page title, notifications badge, and user menu.
 * 
 * Features:
 * - Responsive height: 56px on mobile, 64px on desktop
 * - Logo on the left side
 * - Title centered on mobile, left-aligned on desktop
 * - Notifications icon with unread count badge
 * - User avatar with dropdown menu
 * 
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import type { AppBarProps, UserMenuProps, NotificationBadgeProps } from './AppBar.types';

// Constants for responsive heights
const MOBILE_HEIGHT = 56;
const DESKTOP_HEIGHT = 64;

/**
 * Format notification count for display
 * Shows "99+" if count exceeds 99
 */
function formatNotificationCount(count: number): string {
  if (count > 99) {
    return '99+';
  }
  return count.toString();
}

/**
 * NotificationBadge Component
 * Displays the notification bell icon with unread count badge
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="notification-badge"
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
      style={{
        position: 'relative',
        padding: spacing.sm,
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* Bell Icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.textPrimary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      
      {/* Badge */}
      {count > 0 && (
        <span
          data-testid="notification-count"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '9px',
            backgroundColor: colors.primary,
            color: colors.textPrimary,
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {formatNotificationCount(count)}
        </span>
      )}
    </button>
  );
};

/**
 * UserMenu Component
 * Dropdown menu for user profile and logout actions
 */
const UserMenu: React.FC<UserMenuProps> = ({
  user,
  isOpen,
  onClose,
  onProfileClick,
  onLogoutClick,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="User menu"
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: spacing.sm,
        minWidth: '200px',
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* User Info */}
      <div
        style={{
          padding: spacing.lg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: colors.textPrimary,
          }}
        >
          {user.name}
        </p>
        {user.email && (
          <p
            style={{
              margin: `${spacing.xs}px 0 0`,
              fontSize: '12px',
              color: colors.textSecondary,
            }}
          >
            {user.email}
          </p>
        )}
      </div>

      {/* Menu Items */}
      <div style={{ padding: spacing.sm }}>
        <button
          role="menuitem"
          onClick={() => {
            onProfileClick?.();
            onClose();
          }}
          style={{
            width: '100%',
            padding: `${spacing.md}px ${spacing.lg}px`,
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: colors.textPrimary,
            fontSize: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.surface;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Profile
        </button>
        
        <button
          role="menuitem"
          onClick={() => {
            onLogoutClick?.();
            onClose();
          }}
          style={{
            width: '100%',
            padding: `${spacing.md}px ${spacing.lg}px`,
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: colors.danger,
            fontSize: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.surface;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

/**
 * Logo Component
 * Displays the application logo
 */
const Logo: React.FC = () => {
  return (
    <div
      data-testid="app-logo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      {/* Logo Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          backgroundColor: colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.textPrimary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
    </div>
  );
};

/**
 * UserAvatar Component
 * Displays user avatar or initials
 */
const UserAvatar: React.FC<{
  user: { name: string; avatarUrl?: string };
  onClick: () => void;
}> = ({ user, onClick }) => {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      aria-label="User menu"
      aria-haspopup="true"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        overflow: 'hidden',
        backgroundColor: colors.primary,
        color: colors.textPrimary,
        fontSize: '14px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
      }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        initials
      )}
    </button>
  );
};

/**
 * AppBar Component
 * Main header component for the Admin Dashboard
 */
export const AppBar: React.FC<AppBarProps> = ({
  title = 'Dashboard',
  showNotifications = true,
  showUserMenu = true,
  onMenuClick,
  notificationCount = 0,
  user,
  onNotificationsClick,
  onProfileClick,
  onLogoutClick,
}) => {
  const { isMobile } = useResponsive();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const height = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

  return (
    <header
      data-testid="appbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: `${height}px`,
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${spacing.lg}px`,
        zIndex: 1000,
      }}
    >
      {/* Left Section: Menu Button (mobile) + Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          flex: isMobile ? 'none' : 1,
        }}
      >
        {/* Menu Button (mobile only) */}
        {isMobile && onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            style={{
              padding: spacing.sm,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.textPrimary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <Logo />

        {/* Title (desktop only - left aligned) */}
        {!isMobile && (
          <h1
            data-testid="appbar-title"
            style={{
              margin: 0,
              marginLeft: spacing.lg,
              fontSize: '18px',
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Center Section: Title (mobile only - centered) */}
      {isMobile && (
        <h1
          data-testid="appbar-title"
          style={{
            flex: 1,
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
      )}

      {/* Right Section: Notifications + User Menu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          position: 'relative',
        }}
      >
        {/* Notifications */}
        {showNotifications && (
          <NotificationBadge
            count={notificationCount}
            onClick={onNotificationsClick}
          />
        )}

        {/* User Menu */}
        {showUserMenu && user && (
          <div style={{ position: 'relative' }}>
            <UserAvatar
              user={user}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            />
            <UserMenu
              user={user}
              isOpen={isUserMenuOpen}
              onClose={() => setIsUserMenuOpen(false)}
              onProfileClick={onProfileClick}
              onLogoutClick={onLogoutClick}
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default AppBar;
