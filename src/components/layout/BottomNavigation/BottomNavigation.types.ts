/**
 * BottomNavigation Component Types
 * @requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  permission?: string;
}

export interface BottomNavigationProps {
  items: NavItem[];
  activeId?: string;
  onNavigate?: (item: NavItem) => void;
}
