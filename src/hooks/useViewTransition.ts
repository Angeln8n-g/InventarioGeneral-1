'use client';

/**
 * useViewTransition Hook
 * Advanced hook for executing view transitions with automatic optimization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useViewTransitionsContext } from '@/contexts/ViewTransitionsContext';
import { 
  TransitionSpeed, 
  TransitionEasing,
  executeTransition,
  supportsViewTransitions,
  generateTransitionName,
} from '@/utils/view-transitions';
import { 
  NavigationDirection,
  recommendTransition,
  getTransitionName,
  shouldUseHaptics,
} from '@/utils/route-analyzer';
import { getAdaptiveConfig } from '@/utils/performance-optimizer';
import { FrameRateMonitor } from '@/utils/frame-rate-monitor';
import { recordTransition } from '@/utils/performance-dashboard';
import { hapticLight } from '@/utils/haptic-feedback';

// ============================================
// TYPES
// ============================================

export interface UseViewTransitionOptions {
  speed?: TransitionSpeed;
  easing?: TransitionEasing;
  direction?: NavigationDirection | 'auto';
  enableHaptics?: boolean;
  skipTransition?: boolean;
  timeout?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface UseViewTransitionReturn {
  startTransition: (callback: () => void | Promise<void>, toPath?: string) => Promise<void>;
  isTransitioning: boolean;
  progress: number;
  cancel: () => void;
}

// ============================================
// HOOK
// ============================================

export function useViewTransition(
  options: UseViewTransitionOptions = {}
): UseViewTransitionReturn {
  const pathname = usePathname();
  const { config, capabilities, addTransition, removeTransition } = useViewTransitionsContext();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const transitionIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Cancela la transición actual
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    
    if (transitionIdRef.current) {
      removeTransition(transitionIdRef.current);
      transitionIdRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsTransitioning(false);
    setProgress(0);
  }, [removeTransition]);
  
  /**
   * Ejecuta haptic feedback si está disponible
   */
  const triggerHaptics = useCallback(() => {
    hapticLight();
  }, []);
  
  /**
   * Inicia una transición
   */
  const startTransition = useCallback(async (
    callback: () => void | Promise<void>,
    toPath?: string
  ): Promise<void> => {
    // Prevenir transiciones simultáneas
    if (isTransitioning) {
      console.warn('Transition already in progress');
      return;
    }
    
    // Reset estado
    cancelledRef.current = false;
    setIsTransitioning(true);
    setProgress(0);
    
    // Generar ID único
    const transitionId = generateTransitionName('transition');
    transitionIdRef.current = transitionId;
    addTransition(transitionId);
    
    // Determinar configuración
    let speed = options.speed || 'normal';
    let easing = options.easing || 'enter';
    let direction = options.direction || 'auto';
    let transitionType = 'root';
    
    // Auto-detectar dirección si se proporciona toPath
    if (direction === 'auto' && toPath) {
      const recommendation = recommendTransition(pathname, toPath);
      direction = recommendation.direction;
      speed = recommendation.speed;
      easing = recommendation.easing;
      transitionType = recommendation.type;
    }
    
    // Obtener configuración adaptativa
    const adaptiveConfig = capabilities 
      ? await getAdaptiveConfig(speed, capabilities)
      : { duration: config.speeds[speed], shouldSimplify: false, shouldSkip: false };
    
    // Determinar si se debe saltar la transición
    const shouldSkip = 
      options.skipTransition || 
      !config.enabled || 
      adaptiveConfig.shouldSkip ||
      cancelledRef.current;
    
    // Haptic feedback
    if (options.enableHaptics && config.enableHaptics && direction !== 'auto') {
      if (shouldUseHaptics(direction as NavigationDirection)) {
        triggerHaptics();
      }
    }
    
    // Callbacks
    options.onStart?.();
    
    // Iniciar monitoreo de FPS
    const monitor = FrameRateMonitor.getInstance();
    monitor.clear();
    monitor.start();
    
    const startTime = performance.now();
    let success = false;
    let error: Error | undefined;
    
    try {
      // Timeout protection
      const timeout = options.timeout || 500;
      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Transition timeout'));
        }, timeout);
      });
      
      // Ejecutar transición
      if (shouldSkip) {
        // Sin transición
        await callback();
      } else if (supportsViewTransitions() && !adaptiveConfig.shouldSimplify) {
        // View Transitions API nativo
        await Promise.race([
          executeViewTransition(callback, transitionType),
          timeoutPromise,
        ]);
      } else {
        // Fallback: CSS animation
        await Promise.race([
          executeCSSTransition(callback, adaptiveConfig.duration),
          timeoutPromise,
        ]);
      }
      
      success = true;
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Transition error:', error);
      options.onError?.(error);
      
      // Ejecutar callback de todos modos
      try {
        await callback();
      } catch (callbackErr) {
        console.error('Callback error:', callbackErr);
      }
    } finally {
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Detener monitoreo
      monitor.stop();
      const frames = monitor.getFrames();
      const duration = performance.now() - startTime;
      
      // Registrar métricas
      recordTransition(
        transitionId,
        transitionType,
        duration,
        frames,
        success,
        error?.message
      );
      
      // Limpiar estado
      removeTransition(transitionId);
      transitionIdRef.current = null;
      setIsTransitioning(false);
      setProgress(1);
      
      // Callback de completado
      if (success) {
        options.onComplete?.();
      }
    }
  }, [
    isTransitioning,
    pathname,
    config,
    capabilities,
    options,
    addTransition,
    removeTransition,
    triggerHaptics,
  ]);
  
  return {
    startTransition,
    isTransitioning,
    progress,
    cancel,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Ejecuta transición usando View Transitions API
 */
async function executeViewTransition(
  callback: () => void | Promise<void>,
  transitionType: string
): Promise<void> {
  if (!supportsViewTransitions()) {
    await callback();
    return;
  }
  
  // Aplicar clase de transición al root
  document.documentElement.classList.add(`vt-${transitionType}`);
  
  try {
    const transition = (document as any).startViewTransition(async () => {
      await callback();
    });
    
    await transition.finished;
  } finally {
    document.documentElement.classList.remove(`vt-${transitionType}`);
  }
}

/**
 * Ejecuta transición usando CSS animations (fallback)
 */
async function executeCSSTransition(
  callback: () => void | Promise<void>,
  duration: number
): Promise<void> {
  // Aplicar clase de fade out
  document.documentElement.classList.add('vt-transitioning');
  
  // Esperar un frame
  await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
  
  // Ejecutar callback
  await callback();
  
  // Esperar duración de transición
  await new Promise(resolve => setTimeout(resolve, duration));
  
  // Remover clase
  document.documentElement.classList.remove('vt-transitioning');
}
