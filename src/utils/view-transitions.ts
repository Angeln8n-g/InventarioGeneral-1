/**
 * View Transitions Core Utilities
 * Provides core functionality for view transitions with fallback support
 */

// ============================================
// CONSTANTS
// ============================================

export const TRANSITION_SPEEDS = {
  instant: 100,    // Tooltips, dropdowns
  fast: 200,       // Feedback inmediato
  normal: 300,     // Navegación estándar
  slow: 400,       // Cambios de contexto
  dramatic: 600,   // Onboarding, celebraciones
} as const;

export const TRANSITION_EASINGS = {
  enter: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Entrada natural
  exit: 'cubic-bezier(0.4, 0, 1, 1)',         // Salida natural
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Rebote sutil
  smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',     // Suave y elegante
  sharp: 'cubic-bezier(0.4, 0, 1, 1)',        // Rápido al inicio
} as const;

export type TransitionSpeed = keyof typeof TRANSITION_SPEEDS;
export type TransitionEasing = keyof typeof TRANSITION_EASINGS;

// ============================================
// TYPES
// ============================================

export interface TransitionConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  skipTransition?: boolean;
}

// ============================================
// BROWSER SUPPORT DETECTION
// ============================================

/**
 * Detecta si el navegador soporta View Transitions API
 */
export function supportsViewTransitions(): boolean {
  if (typeof document === 'undefined') return false;
  
  return (
    'startViewTransition' in document &&
    typeof (document as any).startViewTransition === 'function'
  );
}

/**
 * Detecta si el usuario prefiere movimiento reducido
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================
// DEVICE TIER DETECTION
// ============================================

export type DeviceTier = 'high' | 'medium' | 'low';

/**
 * Detecta el tier del dispositivo basado en hardware y conexión
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof navigator === 'undefined') return 'medium';
  
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4;
  const connection = (navigator as any).connection?.effectiveType || '4g';
  
  // High-end: 6+ cores, 8GB+ RAM, 4G+
  if (cores >= 6 && memory >= 8 && connection === '4g') {
    return 'high';
  }
  
  // Low-end: <4 cores, <4GB RAM, 3G or slower
  if (cores < 4 || memory < 4 || connection === '3g' || connection === '2g' || connection === 'slow-2g') {
    return 'low';
  }
  
  return 'medium';
}

// ============================================
// TRANSITION EXECUTION
// ============================================

/**
 * Ejecuta una transición con fallback automático
 */
export async function executeTransition(
  callback: () => void | Promise<void>,
  config: TransitionConfig = {}
): Promise<void> {
  // Si las transiciones están deshabilitadas, ejecutar directamente
  if (config.skipTransition || prefersReducedMotion()) {
    await callback();
    return;
  }
  
  // Intentar con View Transitions API
  if (supportsViewTransitions()) {
    try {
      const transition = (document as any).startViewTransition(async () => {
        await callback();
      });
      
      await transition.finished;
      return;
    } catch (error) {
      console.warn('View Transition failed, executing without animation:', error);
    }
  }
  
  // Fallback: ejecutar sin animación
  await callback();
}

/**
 * Ejecuta una transición con timeout protection
 */
export async function executeTransitionWithTimeout(
  callback: () => void | Promise<void>,
  config: TransitionConfig = {},
  timeoutMs: number = 500
): Promise<void> {
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error('Transition timeout')), timeoutMs);
  });
  
  try {
    await Promise.race([
      executeTransition(callback, config),
      timeoutPromise
    ]);
  } catch (error) {
    console.warn('Transition timeout, executing callback directly:', error);
    await callback();
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

let transitionCounter = 0;

/**
 * Genera un nombre único para view-transition-name
 */
export function generateTransitionName(prefix: string = 'transition'): string {
  transitionCounter++;
  return `${prefix}-${transitionCounter}-${Date.now()}`;
}

/**
 * Resetea el contador de transiciones (útil para testing)
 */
export function resetTransitionCounter(): void {
  transitionCounter = 0;
}

/**
 * Obtiene la duración de una transición según el speed
 */
export function getTransitionDuration(speed: TransitionSpeed): number {
  return TRANSITION_SPEEDS[speed];
}

/**
 * Obtiene el easing de una transición
 */
export function getTransitionEasing(easing: TransitionEasing): string {
  return TRANSITION_EASINGS[easing];
}
