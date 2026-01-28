/**
 * Section Access Control Module
 * 
 * This module provides utilities for controlling access to system sections
 * based on user permissions. It includes:
 * - Section configuration with required permissions
 * - Middleware helpers for route protection
 * - Navigation filtering based on user permissions
 * 
 * @see Requirements 4.2 - Redirect to access denied page if no permission
 * @see Requirements 4.3 - Hide navigation items without access
 */

import { Section } from '@/types/permissions';

/**
 * Static section configuration for client-side use
 * This mirrors the database sections table for fast client-side lookups
 * 
 * @see Requirements 4.1 - 17 controllable sections
 */
export const SECTION_CONFIG: Record<string, { requiredPermission: string; isAdminSection: boolean; name: string }> = {
  // User sections (non-admin)
  '/dashboard': { requiredPermission: 'sections:dashboard', isAdminSection: false, name: 'Dashboard' },
  '/tools': { requiredPermission: 'sections:tools', isAdminSection: false, name: 'Herramientas' },
  '/consumables': { requiredPermission: 'sections:consumables', isAdminSection: false, name: 'Consumibles' },
  '/my-loans': { requiredPermission: 'sections:my_loans', isAdminSection: false, name: 'Mis Préstamos' },
  '/my-spaces': { requiredPermission: 'sections:my_spaces', isAdminSection: false, name: 'Mis Espacios' },
  '/profile': { requiredPermission: 'sections:profile', isAdminSection: false, name: 'Perfil' },
  
  // Admin sections
  '/admin/dashboard': { requiredPermission: 'admin:view_dashboard', isAdminSection: true, name: 'Admin Dashboard' },
  '/admin/tools': { requiredPermission: 'admin:manage_tools', isAdminSection: true, name: 'Admin Herramientas' },
  '/admin/consumables': { requiredPermission: 'admin:manage_consumables', isAdminSection: true, name: 'Admin Consumibles' },
  '/admin/electronics': { requiredPermission: 'admin:manage_electronics', isAdminSection: true, name: 'Admin Electrónicos' },
  '/admin/classrooms': { requiredPermission: 'admin:manage_classrooms', isAdminSection: true, name: 'Admin Aulas' },
  '/admin/assignments': { requiredPermission: 'admin:manage_assignments', isAdminSection: true, name: 'Admin Asignaciones' },
  '/admin/users': { requiredPermission: 'users:manage', isAdminSection: true, name: 'Admin Usuarios' },
  '/admin/categories': { requiredPermission: 'admin:manage_categories', isAdminSection: true, name: 'Admin Categorías' },
  '/admin/reports': { requiredPermission: 'reports:view', isAdminSection: true, name: 'Admin Reportes' },
  '/admin/audit': { requiredPermission: 'audit:view', isAdminSection: true, name: 'Admin Auditoría' },
  '/admin/permissions': { requiredPermission: 'admin:manage_permissions', isAdminSection: true, name: 'Admin Permisos' },
};

/**
 * Navigation item interface for filtered navigation
 */
export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  requiredPermission: string;
  isAdminSection: boolean;
}

/**
 * Get the required permission for a given path
 * Handles both exact matches and prefix matches for nested routes
 * 
 * @param path - The URL path to check
 * @returns The required permission string, or null if no protection needed
 */
export function getRequiredPermissionForPath(path: string): string | null {
  // First try exact match
  if (SECTION_CONFIG[path]) {
    return SECTION_CONFIG[path].requiredPermission;
  }
  
  // Try prefix match for nested routes (e.g., /admin/tools/123 -> /admin/tools)
  const sortedPaths = Object.keys(SECTION_CONFIG).sort((a, b) => b.length - a.length);
  
  for (const configPath of sortedPaths) {
    if (path.startsWith(configPath + '/') || path === configPath) {
      return SECTION_CONFIG[configPath].requiredPermission;
    }
  }
  
  return null;
}

/**
 * Check if a path is an admin section
 * 
 * @param path - The URL path to check
 * @returns true if the path is an admin section
 */
export function isAdminSection(path: string): boolean {
  // Check exact match first
  if (SECTION_CONFIG[path]) {
    return SECTION_CONFIG[path].isAdminSection;
  }
  
  // Check prefix for nested routes
  return path.startsWith('/admin');
}

/**
 * Check if a user has access to a specific section
 * 
 * @param path - The URL path to check
 * @param userPermissions - Array of user's effective permissions
 * @returns true if user has access, false otherwise
 * @see Requirements 4.2
 */
export function hasAccessToSection(path: string, userPermissions: string[]): boolean {
  const requiredPermission = getRequiredPermissionForPath(path);
  
  // If no permission required, allow access
  if (!requiredPermission) {
    return true;
  }
  
  // Check if user has the required permission
  return userPermissions.includes(requiredPermission);
}

/**
 * Filter navigation items based on user permissions
 * Returns only the items the user has access to
 * 
 * @param items - Array of navigation items to filter
 * @param userPermissions - Array of user's effective permissions
 * @returns Filtered array of navigation items
 * @see Requirements 4.3
 */
export function filterNavigationByPermissions(
  items: NavigationItem[],
  userPermissions: string[]
): NavigationItem[] {
  return items.filter(item => {
    // If no permission required, include the item
    if (!item.requiredPermission) {
      return true;
    }
    
    // Check if user has the required permission
    return userPermissions.includes(item.requiredPermission);
  });
}

/**
 * Get all accessible sections for a user
 * 
 * @param userPermissions - Array of user's effective permissions
 * @param includeAdminSections - Whether to include admin sections
 * @returns Array of accessible section paths
 * @see Requirements 4.3
 */
export function getAccessibleSections(
  userPermissions: string[],
  includeAdminSections: boolean = true
): string[] {
  return Object.entries(SECTION_CONFIG)
    .filter(([, config]) => {
      // Filter out admin sections if not requested
      if (!includeAdminSections && config.isAdminSection) {
        return false;
      }
      
      // Check if user has the required permission
      return userPermissions.includes(config.requiredPermission);
    })
    .map(([path]) => path);
}

/**
 * Get section info by path
 * 
 * @param path - The URL path
 * @returns Section configuration or null if not found
 */
export function getSectionInfo(path: string): { requiredPermission: string; isAdminSection: boolean; name: string } | null {
  // Try exact match first
  if (SECTION_CONFIG[path]) {
    return SECTION_CONFIG[path];
  }
  
  // Try prefix match for nested routes
  const sortedPaths = Object.keys(SECTION_CONFIG).sort((a, b) => b.length - a.length);
  
  for (const configPath of sortedPaths) {
    if (path.startsWith(configPath + '/') || path === configPath) {
      return SECTION_CONFIG[configPath];
    }
  }
  
  return null;
}

/**
 * Paths that don't require authentication or permission checks
 */
export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/access-denied',
  '/',
];

/**
 * Check if a path is public (doesn't require authentication)
 * 
 * @param path - The URL path to check
 * @returns true if the path is public
 */
export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );
}

/**
 * API paths that should be protected by section permissions
 * Maps API routes to their corresponding section permissions
 */
export const API_SECTION_PERMISSIONS: Record<string, string> = {
  '/api/admin/tools': 'admin:manage_tools',
  '/api/admin/consumables': 'admin:manage_consumables',
  '/api/admin/electronics': 'admin:manage_electronics',
  '/api/admin/classrooms': 'admin:manage_classrooms',
  '/api/admin/assignments': 'admin:manage_assignments',
  '/api/admin/users': 'users:manage',
  '/api/admin/categories': 'admin:manage_categories',
  '/api/admin/reports': 'reports:view',
  '/api/admin/audit': 'audit:view',
  '/api/admin/permissions': 'admin:manage_permissions',
  '/api/admin/roles': 'admin:manage_permissions',
};

/**
 * Get the required permission for an API path
 * 
 * @param path - The API path to check
 * @returns The required permission string, or null if no protection needed
 */
export function getRequiredPermissionForApiPath(path: string): string | null {
  // Try exact match first
  if (API_SECTION_PERMISSIONS[path]) {
    return API_SECTION_PERMISSIONS[path];
  }
  
  // Try prefix match for nested API routes
  const sortedPaths = Object.keys(API_SECTION_PERMISSIONS).sort((a, b) => b.length - a.length);
  
  for (const configPath of sortedPaths) {
    if (path.startsWith(configPath + '/') || path === configPath) {
      return API_SECTION_PERMISSIONS[configPath];
    }
  }
  
  return null;
}
