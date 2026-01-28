'use client';

/**
 * SectionGuard Component
 * 
 * A guard component that protects routes based on section permissions.
 * It checks if the current user has access to the section and either
 * renders the children or redirects to the access denied page.
 * 
 * @see Requirements 4.2 - Redirect to access denied page if no permission
 */

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSectionAccess } from '@/hooks/useSectionAccess';
import { useAuth } from '@/hooks/useAuth';

interface SectionGuardProps {
  /** The content to render if user has access */
  children: React.ReactNode;
  
  /** Optional custom path to check (defaults to current path) */
  path?: string;
  
  /** Optional fallback component to show while loading */
  fallback?: React.ReactNode;
  
  /** Optional callback when access is denied */
  onAccessDenied?: () => void;
  
  /** Whether to redirect on access denied (default: true) */
  redirectOnDenied?: boolean;
}

/**
 * Default loading fallback component
 */
const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-claro-red"></div>
  </div>
);

/**
 * SectionGuard component for protecting routes based on section permissions
 * 
 * Usage:
 * ```tsx
 * <SectionGuard>
 *   <ProtectedContent />
 * </SectionGuard>
 * ```
 * 
 * Or with custom path:
 * ```tsx
 * <SectionGuard path="/admin/tools">
 *   <ToolsAdmin />
 * </SectionGuard>
 * ```
 */
export const SectionGuard: React.FC<SectionGuardProps> = ({
  children,
  path,
  fallback,
  onAccessDenied,
  redirectOnDenied = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: permissionsLoading, isPublic } = useSectionAccess();
  
  // Determine which path to check
  const pathToCheck = path || pathname || '';
  
  // Check if the path is public
  const isPublicPath = isPublic(pathToCheck);
  
  // Check if user has access
  const userHasAccess = hasAccess(pathToCheck);
  
  // Combined loading state
  const isLoading = authLoading || permissionsLoading;
  
  useEffect(() => {
    // Skip checks for public paths
    if (isPublicPath) {
      return;
    }
    
    // Wait for loading to complete
    if (isLoading) {
      return;
    }
    
    // If not authenticated, redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // If no access, handle denial
    if (!userHasAccess) {
      // Call custom callback if provided
      if (onAccessDenied) {
        onAccessDenied();
      }
      
      // Redirect if enabled
      if (redirectOnDenied) {
        router.replace('/access-denied');
      }
    }
  }, [isLoading, user, userHasAccess, isPublicPath, router, onAccessDenied, redirectOnDenied]);
  
  // Show loading state
  if (isLoading) {
    return <>{fallback || <DefaultLoadingFallback />}</>;
  }
  
  // Public paths are always accessible
  if (isPublicPath) {
    return <>{children}</>;
  }
  
  // If not authenticated, show loading (will redirect)
  if (!user) {
    return <>{fallback || <DefaultLoadingFallback />}</>;
  }
  
  // If no access and not redirecting, render nothing
  if (!userHasAccess && !redirectOnDenied) {
    return null;
  }
  
  // If no access and redirecting, show loading (will redirect)
  if (!userHasAccess) {
    return <>{fallback || <DefaultLoadingFallback />}</>;
  }
  
  // User has access, render children
  return <>{children}</>;
};

/**
 * Higher-order component version of SectionGuard
 * 
 * Usage:
 * ```tsx
 * const ProtectedPage = withSectionGuard(MyPage);
 * // or with options
 * const ProtectedPage = withSectionGuard(MyPage, { path: '/admin/tools' });
 * ```
 */
export function withSectionGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<SectionGuardProps, 'children'>
): React.FC<P> {
  const WithSectionGuard: React.FC<P> = (props) => (
    <SectionGuard {...options}>
      <WrappedComponent {...props} />
    </SectionGuard>
  );
  
  WithSectionGuard.displayName = `withSectionGuard(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithSectionGuard;
}

export default SectionGuard;
