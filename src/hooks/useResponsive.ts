/**
 * useResponsive Hook
 * 
 * Hook for detecting responsive breakpoints and providing
 * device-specific flags for mobile-first responsive design.
 * 
 * Breakpoints:
 * - mobile: 0px - 767px (width < 768)
 * - tablet: 768px - 1023px (768 ≤ width < 1024)
 * - desktop: 1024px+ (width ≥ 1024)
 * 
 * @requirements 2.1, 2.2, 2.3
 */

import { useState, useEffect, useCallback } from 'react';
import { breakpoints } from '@/design-system/tokens/breakpoints';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
}

/**
 * Debounce utility function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Get the current breakpoint based on window width
 * @param width - The viewport width
 * @returns The current breakpoint
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.desktop) {
    return 'desktop';
  }
  if (width >= breakpoints.tablet) {
    return 'tablet';
  }
  return 'mobile';
}

/**
 * Get the responsive state based on the current breakpoint
 * @param breakpoint - The current breakpoint
 * @returns The responsive state with boolean flags
 */
function getResponsiveState(breakpoint: Breakpoint): ResponsiveState {
  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    breakpoint,
  };
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the initial responsive state
 * Defaults to mobile for SSR
 */
function getInitialState(): ResponsiveState {
  if (!isBrowser()) {
    // Default to mobile for SSR
    return getResponsiveState('mobile');
  }
  
  const width = window.innerWidth;
  const breakpoint = getBreakpoint(width);
  return getResponsiveState(breakpoint);
}

/**
 * Hook for detecting responsive breakpoints
 * 
 * @returns ResponsiveState with isMobile, isTablet, isDesktop flags and current breakpoint
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * 
 * return <DesktopLayout />;
 * ```
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(getInitialState);

  const handleResize = useCallback(() => {
    if (!isBrowser()) return;
    
    const width = window.innerWidth;
    const newBreakpoint = getBreakpoint(width);
    
    setState(prevState => {
      // Only update if breakpoint changed to avoid unnecessary re-renders
      if (prevState.breakpoint === newBreakpoint) {
        return prevState;
      }
      return getResponsiveState(newBreakpoint);
    });
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;

    // Set initial state on mount (handles SSR hydration)
    handleResize();

    // Create debounced resize handler (150ms delay)
    const debouncedResize = debounce(handleResize, 150);

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [handleResize]);

  return state;
}

export default useResponsive;
