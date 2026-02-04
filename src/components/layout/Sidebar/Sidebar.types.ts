/**
 * Sidebar Component Types
 * @requirements 2.2, 2.3, 2.5
 */

import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  permission?: string;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  items: NavItem[];
  activeId?: string;
  onNavigate?: (item: NavItem) => void;
}
