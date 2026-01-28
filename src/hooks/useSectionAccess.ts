/**
 * useSectionAccess Hook
 * 
 * This hook provides section access control functionality for React components.
 * It integrates with the PermissionsContext to check if the current user
 * has access to specific sections of the application.
 * 
 * @see Requirements 4.2 - Redirect to access denied page if no permission
 * @see Requirements 4.3 - Hide navigation items without access
 * @see Requirements 4.5 - Filter navigation in less than 100ms
 */

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from './usePermissions';
import {
  hasAccessToSection,
  getRequiredPermissionForPath,
  filterNavigationByPermissions,
  getAccessibleSections,
  getSectionInfo,
  isPublicPath,
  isAdminSection,
  NavigationItem,
  SECTION_CONFIG,
} from '@/lib/section-access';

/**
 * Return type for the useSectionAccess hook
 */
export interface UseSectionAccessReturn {
  /** Check if user has access to a specific path */
  hasAccess: (path: string) => boolean;
  
  /** Check if user has access to the current path */
  hasAccessToCurrentPath: boolean;
  
  /** Get the required permission for a path */
  getRequiredPermission: (path: string) => string | null;
  
  /** Filter navigation items based on user permissions */
  filterNavigation: (items: NavigationItem[]) => NavigationItem[];
  
  /** Get all accessible sections for the user */
  accessibleSections: string[];
  
  /** Get all accessible admin sections for the user */
  accessibleAdminSections: string[];
  
  /** Check if current path is an admin section */
  isCurrentPathAdmin: boolean;
  
  /** Redirect to access denied page if no access */
  redirectIfNoAccess: () => void;
  
  /** Check if a path is public (no auth required) */
  isPublic: (path: string) => boolean;
  
  /** Loading state from permissions context */
  isLoading: boolean;
  
  /** Get section info for a path */
  getSectionInfo: (path: string) => { requiredPermission: string; isAdminSection: boolean; name: string } | null;
}

/**
 * Hook for section access control
 * 
 * Provides utilities for checking and enforcing section access based on
 * user permissions. Uses memoization for performance optimization.
 * 
 * @returns UseSectionAccessReturn object with access control utilities
 * @see Requirements 4.5 - Navigation filtering in less than 100ms
 */
export function useSectionAccess(): UseSectionAccessReturn {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    hasPermission, 
    isLoading, 
    isAdmin
  } = usePermissions();
  
  /**
   * Check if user has access to a specific path
   * Uses hasPermission from usePermissions hook which handles both dynamic and static permissions
   * Admin users always have access to everything
   */
  const hasAccess = useCallback((path: string): boolean => {
    // Admin users have access to everything
    if (isAdmin) {
      return true;
    }
    
    // Public paths are always accessible
    if (isPublicPath(path)) {
      return true;
    }
    
    const requiredPermission = getRequiredPermissionForPath(path);
    
    // If no permission required, allow access
    if (!requiredPermission) {
      return true;
    }
    
    // Use hasPermission from usePermissions hook
    // This automatically handles both dynamic and static permissions
    return hasPermission(requiredPermission as any);
  }, [hasPermission, isAdmin]);
  
  /**
   * Check if user has access to the current path
   */
  const hasAccessToCurrentPath = useMemo(() => {
    if (!pathname) return true;
    return hasAccess(pathname);
  }, [pathname, hasAccess]);
  
  /**
   * Get the required permission for a path
   */
  const getRequiredPermission = useCallback((path: string): string | null => {
    return getRequiredPermissionForPath(path);
  }, []);
  
  /**
   * Filter navigation items based on user permissions
   * @see Requirements 4.3
   */
  const filterNavigation = useCallback((items: NavigationItem[]): NavigationItem[] => {
    // Admin users see everything
    if (isAdmin) {
      return items;
    }
    
    // Filter using hasPermission
    return items.filter(item => {
      if (!item.requiredPermission) return true;
      return hasPermission(item.requiredPermission as any);
    });
  }, [hasPermission, isAdmin]);
  
  /**
   * Get all accessible sections for the user
   */
  const accessibleSections = useMemo(() => {
    // Admin users have access to all sections
    if (isAdmin) {
      return Object.keys(SECTION_CONFIG);
    }
    
    // Check each section using hasPermission
    return Object.entries(SECTION_CONFIG)
      .filter(([, config]) => hasPermission(config.requiredPermission as any))
      .map(([path]) => path);
  }, [hasPermission, isAdmin]);
  
  /**
   * Get all accessible admin sections for the user
   */
  const accessibleAdminSections = useMemo(() => {
    return accessibleSections.filter(path => isAdminSection(path));
  }, [accessibleSections]);
  
  /**
   * Check if current path is an admin section
   */
  const isCurrentPathAdmin = useMemo(() => {
    if (!pathname) return false;
    return isAdminSection(pathname);
  }, [pathname]);
  
  /**
   * Redirect to access denied page if user doesn't have access
   * @see Requirements 4.2
   */
  const redirectIfNoAccess = useCallback(() => {
    if (!isLoading && !hasAccessToCurrentPath && pathname && !isPublicPath(pathname)) {
      router.replace('/access-denied');
    }
  }, [isLoading, hasAccessToCurrentPath, pathname, router]);
  
  /**
   * Check if a path is public
   */
  const isPublic = useCallback((path: string): boolean => {
    return isPublicPath(path);
  }, []);
  
  /**
   * Get section info for a path
   */
  const getSectionInfoForPath = useCallback((path: string) => {
    return getSectionInfo(path);
  }, []);
  
  return {
    hasAccess,
    hasAccessToCurrentPath,
    getRequiredPermission,
    filterNavigation,
    accessibleSections,
    accessibleAdminSections,
    isCurrentPathAdmin,
    redirectIfNoAccess,
    isPublic,
    isLoading,
    getSectionInfo: getSectionInfoForPath,
  };
}

export default useSectionAccess;
