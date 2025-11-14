'use client';

/**
 * SharedElementTransition Component
 * Enables shared element transitions between views
 */

import React, { useEffect, useRef } from 'react';
import { generateTransitionName, supportsViewTransitions } from '@/utils/view-transitions';

// ============================================
// TYPES
// ============================================

export interface SharedElementProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function SharedElementTransition({
  id,
  children,
  className = '',
  enabled = true,
}: SharedElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const transitionName = useRef(generateTransitionName(`shared-${id}`));

  useEffect(() => {
    if (!enabled || !supportsViewTransitions()) {
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Apply view-transition-name
    element.style.viewTransitionName = transitionName.current;

    // Cleanup
    return () => {
      if (element) {
        element.style.viewTransitionName = '';
      }
    };
  }, [enabled, id]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// ============================================
// HOOK FOR PROGRAMMATIC USAGE
// ============================================

export function useSharedElement(id: string, enabled: boolean = true) {
  const elementRef = useRef<HTMLElement | null>(null);
  const transitionName = useRef(generateTransitionName(`shared-${id}`));

  useEffect(() => {
    if (!enabled || !supportsViewTransitions()) {
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Apply view-transition-name
    element.style.viewTransitionName = transitionName.current;

    // Cleanup
    return () => {
      if (element) {
        element.style.viewTransitionName = '';
      }
    };
  }, [enabled, id]);

  return {
    ref: elementRef,
    transitionName: transitionName.current,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Apply shared element transition to an element
 */
export function applySharedElement(element: HTMLElement, id: string): () => void {
  if (!supportsViewTransitions()) {
    return () => {};
  }

  const transitionName = generateTransitionName(`shared-${id}`);
  element.style.viewTransitionName = transitionName;

  // Return cleanup function
  return () => {
    element.style.viewTransitionName = '';
  };
}

/**
 * Remove shared element transition from an element
 */
export function removeSharedElement(element: HTMLElement): void {
  element.style.viewTransitionName = '';
}
