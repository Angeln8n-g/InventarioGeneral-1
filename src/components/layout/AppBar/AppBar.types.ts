/**
 * AppBar Component Types
 * 
 * Type definitions for the AppBar header component.
 * 
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

export interface AppBarProps {
  /** Page title to display */
  title?: string;
  /** Whether to show the notifications icon with badge */
  showNotifications?: boolean;
  /** Whether to show the user menu */
  showUserMenu?: boolean;
  /** Callback when the menu button is clicked (for mobile sidebar toggle) */
  onMenuClick?: () => void;
  /** Number of unread notifications (for badge display) */
  notificationCount?: number;
  /** User information for the avatar and menu */
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  /** Callback when notifications icon is clicked */
  onNotificationsClick?: () => void;
  /** Callback when profile is clicked */
  onProfileClick?: () => void;
  /** Callback when logout is clicked */
  onLogoutClick?: () => void;
}

export interface UserMenuProps {
  user: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
}

export interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
}
