'use client';

/**
 * useStaggerAnimation Hook
 * Automatically applies stagger animations to child elements
 */

import { useEffect, useRef, RefObject } from 'react';
import { StaggerConfig, createStaggerAnimation, removeStaggerAnimation } from '@/utils/stagger-animation';

// ============================================
// TYPES
// ============================================

export interface UseStaggerAnimationOptions extends Partial<StaggerConfig> {
  enabled?: boolean;
  animateOnMount?: boolean;
  animateOnScroll?: boolean;
  threshold?: number; // Intersection observer threshold
  childSelector?: string; // CSS selector for children
}

// ============================================
// HOOK
// ============================================

export function useStaggerAnimation<T extends HTMLElement>(
  options: UseStaggerAnimationOptions = {}
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasAnimatedRef = useRef(false);

  const {
    enabled = true,
    animateOnMount = false,
    animateOnScroll = true,
    threshold = 0.1,
    childSelector = '> *',
    ...staggerConfig
  } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const children = Array.from(
      container.querySelectorAll(childSelector)
    ) as HTMLElement[];

    if (children.length === 0) {
      return;
    }

    // Animate on mount if enabled
    if (animateOnMount && !hasAnimatedRef.current) {
      createStaggerAnimation(children, staggerConfig);
      hasAnimatedRef.current = true;
      return;
    }

    // Animate on scroll if enabled
    if (animateOnScroll && !hasAnimatedRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimatedRef.current) {
              const children = Array.from(
                container.querySelectorAll(childSelector)
              ) as HTMLElement[];
              
              createStaggerAnimation(children, staggerConfig);
              hasAnimatedRef.current = true;

              // Disconnect observer after animation
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        { threshold }
      );

      observerRef.current.observe(container);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Remove animation delays
      const children = Array.from(
        container.querySelectorAll(childSelector)
      ) as HTMLElement[];
      removeStaggerAnimation(children);
    };
  }, [
    enabled,
    animateOnMount,
    animateOnScroll,
    threshold,
    childSelector,
    staggerConfig.delay,
    staggerConfig.maxDelay,
    staggerConfig.direction,
    staggerConfig.easing,
  ]);

  return containerRef;
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * Hook for stagger animation on mount
 */
export function useStaggerOnMount<T extends HTMLElement>(
  config: Partial<StaggerConfig> = {}
): RefObject<T | null> {
  return useStaggerAnimation<T>({
    ...config,
    animateOnMount: true,
    animateOnScroll: false,
  });
}

/**
 * Hook for stagger animation on scroll
 */
export function useStaggerOnScroll<T extends HTMLElement>(
  config: Partial<StaggerConfig> = {},
  threshold: number = 0.1
): RefObject<T | null> {
  return useStaggerAnimation<T>({
    ...config,
    animateOnMount: false,
    animateOnScroll: true,
    threshold,
  });
}
