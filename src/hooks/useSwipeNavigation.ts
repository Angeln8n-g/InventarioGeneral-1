'use client';

/**
 * useSwipeNavigation Hook
 * Main hook for implementing swipe navigation on pages
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSwipeNavigationContext } from '@/contexts/SwipeNavigationContext';
import { SwipeGestureDetector, shouldNavigate } from '@/utils/swipe-gesture-detector';
import { SwipePhysics, calculateEffectiveDistance } from '@/utils/swipe-physics';
import { hapticLight, hapticMedium, hapticError } from '@/utils/haptic-feedback';
import { getNavigationDebouncer } from '@/utils/navigation-debouncer';

// ============================================
// TYPES
// ============================================

export interface UseSwipeNavigationOptions {
  enabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: 'left' | 'right' | null) => void;
  onNavigate?: (toPath: string) => void;
}

export interface UseSwipeNavigationReturn {
  // Refs para el contenedor
  containerRef: React.RefObject<HTMLDivElement | null>;
  
  // Estado del swipe
  isSwiping: boolean;
  swipeProgress: number;        // 0-1, progreso del swipe
  swipeDirection: 'left' | 'right' | null;
  
  // Información de navegación
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  nextRouteLeft: string | null;
  nextRouteRight: string | null;
  
  // Control manual
  triggerSwipe: (direction: 'left' | 'right') => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useSwipeNavigation(
  options: UseSwipeNavigationOptions = {}
): UseSwipeNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const {
    config,
    isSwipeEnabled,
    canNavigateLeft,
    canNavigateRight,
    getNextRoute,
  } = useSwipeNavigationContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const gestureDetectorRef = useRef<SwipeGestureDetector>(new SwipeGestureDetector());
  const animationFrameRef = useRef<number | null>(null);
  const hasTriggeredThresholdHaptic = useRef(false);
  const navigationDebouncerRef = useRef(getNavigationDebouncer());
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [startY, setStartY] = useState(0);

  // Información de navegación
  const canSwipeLeft = canNavigateLeft();
  const canSwipeRight = canNavigateRight();
  const nextRouteLeft = getNextRoute('left');
  const nextRouteRight = getNextRoute('right');

  // Verificar si swipe está habilitado
  const enabled = options.enabled !== false && isSwipeEnabled && config.enabled;


  /**
   * Check if modal or overlay is open (Task 7.1 - Conflict Prevention)
   */
  const isModalOpen = useCallback((): boolean => {
    if (typeof document === 'undefined') return false;
    
    // Check for common modal/dialog patterns
    const hasDialog = document.querySelector('[role="dialog"]') !== null;
    const hasModal = document.querySelector('.modal-open') !== null;
    const hasOverlay = document.querySelector('[data-modal-open="true"]') !== null;
    
    // Check for fixed overlays (common in modals)
    const hasFixedOverlay = document.querySelector('.fixed.inset-0.bg-black') !== null ||
                           document.querySelector('.fixed.inset-0.bg-gray-900') !== null;
    
    // Check for cart modal specifically
    const hasCartModal = document.querySelector('[data-cart-modal="true"]') !== null;
    
    return hasDialog || hasModal || hasOverlay || hasFixedOverlay || hasCartModal;
  }, []);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    // Task 7.1: Prevent swipe during modal/overlay
    if (isModalOpen()) {
      return;
    }

    const detector = gestureDetectorRef.current;
    detector.onTouchStart(e);

    setStartY(e.touches[0].clientY);
    setIsSwiping(false);
    setSwipeProgress(0);
    setSwipeDirection(null);
    hasTriggeredThresholdHaptic.current = false;

    // Haptic feedback al iniciar
    if (config.enableHaptics) {
      hapticLight();
    }

    options.onSwipeStart?.();
  }, [enabled, isModalOpen, config.enableHaptics, options]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    // Task 7.1: Prevent swipe during modal/overlay
    if (isModalOpen()) {
      return;
    }

    const detector = gestureDetectorRef.current;
    const gesture = detector.onTouchMove(e);

    if (!gesture || !gesture.isValid) return;

    // Task 7.1: Detect horizontal vs vertical swipe intent and prevent scroll
    const deltaY = Math.abs(e.touches[0].clientY - startY);
    const deltaX = gesture.distance;
    
    // If horizontal swipe is detected, prevent scroll
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }

    // Verificar si puede navegar en esta dirección
    const canNavigate = gesture.direction === 'left' ? canSwipeLeft : canSwipeRight;
    if (!canNavigate) {
      // Task 7.2: Boundary handling with resistance
      const screenWidth = window.innerWidth;
      const resistance = SwipePhysics.calculateResistance(
        gesture.distance,
        screenWidth * 0.3,
        0.8
      );
      const progress = Math.min(resistance / screenWidth, 0.2);
      setSwipeProgress(progress);
      if (gesture.direction !== 'vertical') {
        setSwipeDirection(gesture.direction);
      }
      setIsSwiping(true);

      // Task 7.2: Haptic feedback de error en boundary
      if (config.enableHaptics && gesture.distance > 50 && !hasTriggeredThresholdHaptic.current) {
        hapticError();
        hasTriggeredThresholdHaptic.current = true;
      }

      // Task 6.4: Apply hardware acceleration for boundary bounce
      if (containerRef.current) {
        const translateX = gesture.direction === 'left' ? -resistance : resistance;
        containerRef.current.style.transform = `translateX(${translateX}px) translateZ(0)`;
        containerRef.current.style.willChange = 'transform';
      }
      return;
    }

    // Calcular progreso con resistencia
    const screenWidth = window.innerWidth;
    const effectiveDistance = calculateEffectiveDistance(
      gesture.distance,
      screenWidth,
      config.resistanceRatio
    );
    const progress = Math.min(Math.abs(effectiveDistance) / screenWidth, 1);

    setIsSwiping(true);
    setSwipeProgress(progress);
    if (gesture.direction !== 'vertical') {
      setSwipeDirection(gesture.direction);
    }

    // Haptic feedback al pasar 50% threshold
    if (config.enableHaptics && progress > 0.5 && !hasTriggeredThresholdHaptic.current) {
      hapticLight();
      hasTriggeredThresholdHaptic.current = true;
    }

    // Task 6.4: Actualizar transform del contenedor con hardware acceleration
    if (containerRef.current) {
      const translateX = gesture.direction === 'left' ? -effectiveDistance : effectiveDistance;
      containerRef.current.style.transform = `translateX(${translateX}px) translateZ(0)`;
      containerRef.current.style.willChange = 'transform';
    }
  }, [enabled, isModalOpen, startY, canSwipeLeft, canSwipeRight, config.resistanceRatio, config.enableHaptics]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!enabled) return;

    const detector = gestureDetectorRef.current;
    const gesture = detector.onTouchEnd(e);

    if (!gesture || !gesture.isValid) {
      setIsSwiping(false);
      setSwipeProgress(0);
      setSwipeDirection(null);
      // Task 6.4: Clean up will-change after gesture
      if (containerRef.current) {
        containerRef.current.style.willChange = 'auto';
      }
      return;
    }

    const direction = gesture.direction as 'left' | 'right';
    const canNavigate = direction === 'left' ? canSwipeLeft : canSwipeRight;

    // Task 7.2: Handle boundary - show bounce effect
    if (!canNavigate) {
      handleBoundaryBounce(direction);
      options.onSwipeEnd?.(null);
      return;
    }

    // Determinar si debe completar la navegación
    const shouldComplete = shouldNavigate(
      gesture.distance,
      gesture.velocity,
      config.swipeThreshold,
      config.velocityThreshold
    );

    if (shouldComplete && canNavigate) {
      // Completar navegación
      const nextRoute = getNextRoute(direction);
      if (nextRoute) {
        // Haptic feedback de confirmación
        if (config.enableHaptics) {
          hapticMedium();
        }
        options.onSwipeEnd?.(direction);
        await triggerSwipe(direction);
      }
    } else {
      // Snap back
      options.onSwipeEnd?.(null);
      snapBack();
    }
  }, [enabled, canSwipeLeft, canSwipeRight, config, getNextRoute, options]);

  /**
   * Task 7.2: Handle boundary bounce effect
   */
  const handleBoundaryBounce = useCallback((direction: 'left' | 'right') => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const bounceDistance = 20;
    const translateX = direction === 'left' ? -bounceDistance : bounceDistance;

    // Apply bounce animation
    container.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
    container.style.transform = `translateX(${translateX}px) translateZ(0)`;

    // Snap back to original
    setTimeout(() => {
      container.style.transform = 'translateX(0) translateZ(0)';
      
      setTimeout(() => {
        container.style.transition = '';
        container.style.willChange = 'auto';
        setIsSwiping(false);
        setSwipeProgress(0);
        setSwipeDirection(null);
      }, 150);
    }, 150);

    // Haptic feedback for boundary
    if (config.enableHaptics) {
      hapticError();
    }
  }, [config.enableHaptics]);

  /**
   * Snap back to original position
   */
  const snapBack = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentTransform = container.style.transform;
    const match = currentTransform.match(/translateX\(([^)]+)\)/);
    const currentX = match ? parseFloat(match[1]) : 0;

    if (currentX === 0) {
      setIsSwiping(false);
      setSwipeProgress(0);
      setSwipeDirection(null);
      // Task 6.4: Clean up will-change
      container.style.willChange = 'auto';
      return;
    }

    // Calcular configuración de snap-back
    const snapConfig = SwipePhysics.calculateSnapBack(currentX, 0, 0.5);

    container.style.transition = `transform ${snapConfig.duration}ms ${snapConfig.easing}`;
    container.style.transform = 'translateX(0) translateZ(0)';

    // Task 6.4: Clean up after animation
    cleanupTimeoutRef.current = setTimeout(() => {
      container.style.transition = '';
      container.style.willChange = 'auto';
      setIsSwiping(false);
      setSwipeProgress(0);
      setSwipeDirection(null);
    }, snapConfig.duration);
  }, []);

  /**
   * Trigger swipe programmatically
   */
  const triggerSwipe = useCallback(async (direction: 'left' | 'right'): Promise<void> => {
    const nextRoute = getNextRoute(direction);
    if (!nextRoute) return;

    const canNavigate = direction === 'left' ? canSwipeLeft : canSwipeRight;
    if (!canNavigate) return;

    // Task 6.3: Check navigation debouncer
    const debouncer = navigationDebouncerRef.current;
    if (!debouncer.canNavigate()) {
      console.log('Navigation debounced, too soon after last navigation');
      snapBack();
      return;
    }

    // Task 7.3: Wrap navigation in try-catch for error recovery
    try {
      // Animar salida
      if (containerRef.current) {
        const screenWidth = window.innerWidth;
        const targetX = direction === 'left' ? -screenWidth : screenWidth;

        // Task 6.4: Apply hardware acceleration
        containerRef.current.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';
        containerRef.current.style.transform = `translateX(${targetX}px) translateZ(0)`;
        containerRef.current.style.willChange = 'transform';

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Task 6.3: Record navigation
      debouncer.recordNavigation();

      // Navegar
      options.onNavigate?.(nextRoute);
      router.push(nextRoute);

      // Reset estado
      setIsSwiping(false);
      setSwipeProgress(0);
      setSwipeDirection(null);

      // Task 6.4: Clean up after navigation
      if (containerRef.current) {
        containerRef.current.style.transition = '';
        containerRef.current.style.transform = '';
        containerRef.current.style.willChange = 'auto';
      }
    } catch (error) {
      // Task 7.3: Error recovery - snap back on failure
      console.error('Navigation failed:', error);
      
      // Show error haptic
      if (config.enableHaptics) {
        hapticError();
      }

      // Snap back to original position
      snapBack();

      // Optional: Show error toast (if toast system is available)
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Navigation failed. Please try again.', 'error');
      }
    }
  }, [getNextRoute, canSwipeLeft, canSwipeRight, router, config.enableHaptics, snapBack, options]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      // Task 7.4: Memory leak prevention - Clean up event listeners
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);

      // Task 7.4: Cancel pending animations
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Task 7.4: Clear pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      // Task 7.4: Remove will-change properties
      if (container) {
        container.style.willChange = 'auto';
        container.style.transform = '';
        container.style.transition = '';
      }

      // Task 7.4: Reset state
      setIsSwiping(false);
      setSwipeProgress(0);
      setSwipeDirection(null);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isSwiping,
    swipeProgress,
    swipeDirection,
    canSwipeLeft,
    canSwipeRight,
    nextRouteLeft,
    nextRouteRight,
    triggerSwipe,
  };
}
