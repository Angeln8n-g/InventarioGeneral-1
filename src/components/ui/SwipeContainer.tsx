'use client';

/**
 * SwipeContainer Component
 * Wrapper component that enables swipe navigation on pages
 */

import React from 'react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

// ============================================
// TYPES
// ============================================

export interface SwipeContainerProps {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
  onSwipeComplete?: (direction: 'left' | 'right') => void;
  showIndicators?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function SwipeContainer({
  children,
  enabled = true,
  className = '',
  onSwipeComplete,
  showIndicators = false,
}: SwipeContainerProps) {
  const {
    containerRef,
    isSwiping,
    swipeProgress,
    swipeDirection,
    canSwipeLeft,
    canSwipeRight,
    nextRouteLeft,
    nextRouteRight,
  } = useSwipeNavigation({
    enabled,
    onSwipeEnd: (direction) => {
      if (direction) {
        onSwipeComplete?.(direction);
      }
    },
  });

  // Task 7.2: Show visual feedback for boundary attempts
  const isBoundaryAttempt = isSwiping && (
    (swipeDirection === 'left' && !canSwipeLeft) ||
    (swipeDirection === 'right' && !canSwipeRight)
  );

  return (
    <div className="swipe-container-wrapper relative w-full">
      {/* Main content */}
      <div
        ref={containerRef}
        className={`swipe-container ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          touchAction: 'pan-y',
          // Task 6.4: Apply hardware acceleration
          backfaceVisibility: 'hidden',
          // Ensure proper stacking context
          isolation: 'isolate',
        }}
      >
        {children}
      </div>

      {/* Task 7.2: Boundary visual feedback */}
      {isBoundaryAttempt && (
        <div
          className="boundary-indicator"
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 20,
            ...(swipeDirection === 'left' ? { left: '20px' } : { right: '20px' }),
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
      )}

      {/* Swipe indicators */}
      {showIndicators && (
        <>
          {/* Left indicator (next page) */}
          {canSwipeLeft && (
            <div
              className={`swipe-indicator left ${
                isSwiping && swipeDirection === 'left' ? 'active' : ''
              }`}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: isSwiping && swipeDirection === 'left' ? swipeProgress : 0,
                transition: isSwiping ? 'none' : 'opacity 0.2s',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div className="flex items-center gap-2 text-claro-red">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                {nextRouteLeft && (
                  <span className="text-sm font-medium hidden sm:inline">
                    {nextRouteLeft}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Right indicator (previous page) */}
          {canSwipeRight && (
            <div
              className={`swipe-indicator right ${
                isSwiping && swipeDirection === 'right' ? 'active' : ''
              }`}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: isSwiping && swipeDirection === 'right' ? swipeProgress : 0,
                transition: isSwiping ? 'none' : 'opacity 0.2s',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div className="flex items-center gap-2 text-claro-red">
                {nextRouteRight && (
                  <span className="text-sm font-medium hidden sm:inline">
                    {nextRouteRight}
                  </span>
                )}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          )}

          {/* Threshold indicator */}
          {isSwiping && swipeProgress > 0.5 && (
            <div
              className="swipe-threshold-indicator"
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '60px',
                background: 'var(--claro-red)',
                opacity: 0.6,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
                zIndex: 10,
                ...(swipeDirection === 'left'
                  ? { left: '20%' }
                  : { right: '20%' }),
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
