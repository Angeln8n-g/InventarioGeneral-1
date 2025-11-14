/**
 * SwipePhysics
 * Physics calculations for natural swipe animations
 */

// ============================================
// TYPES
// ============================================

export interface PhysicsConfig {
  mass: number;
  tension: number;
  friction: number;
  velocity: number;
}

export interface SnapBackConfig {
  duration: number;
  easing: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_SNAP_BACK_DURATION = 300; // ms
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const MAX_OVERSHOOT = 20; // px

// ============================================
// SWIPE PHYSICS CLASS
// ============================================

export class SwipePhysics {
  /**
   * Calcular resistencia al arrastrar (rubber band effect)
   * Usa una curva exponencial para crear resistencia natural
   */
  static calculateResistance(
    distance: number,
    maxDistance: number,
    ratio: number = 0.5
  ): number {
    if (distance <= 0 || maxDistance <= 0) return 0;

    // Resistencia exponencial: más resistencia cuanto más lejos
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const resistance = distance * (1 - Math.pow(normalizedDistance, ratio));

    return resistance;
  }

  /**
   * Calcular configuración de animación snap-back
   * Duración basada en distancia y velocidad
   */
  static calculateSnapBack(
    currentPosition: number,
    targetPosition: number,
    velocity: number
  ): SnapBackConfig {
    const distance = Math.abs(currentPosition - targetPosition);

    // Duración basada en distancia y velocidad
    // Velocidad alta = duración más corta
    const velocityFactor = Math.max(velocity, 0.5);
    const calculatedDuration = Math.min(
      DEFAULT_SNAP_BACK_DURATION,
      distance / velocityFactor
    );

    // Asegurar duración mínima de 150ms
    const duration = Math.max(150, calculatedDuration);

    return {
      duration,
      easing: DEFAULT_EASING,
    };
  }

  /**
   * Calcular overshoot (rebote sutil al final de la animación)
   * Proporcional a la velocidad del swipe
   */
  static calculateOvershoot(velocity: number): number {
    // Overshoot proporcional a velocidad, con máximo
    const overshoot = velocity * 0.1;
    return Math.min(overshoot, MAX_OVERSHOOT);
  }

  /**
   * Calcular bounce effect para boundaries
   * Retorna la distancia del bounce basada en la velocidad
   */
  static calculateBounce(velocity: number, maxBounce: number = 30): number {
    // Bounce proporcional a velocidad, con máximo
    const bounce = velocity * 20; // Factor de escala
    return Math.min(bounce, maxBounce);
  }

  /**
   * Aplicar damping (amortiguación) a la velocidad
   * Reduce la velocidad gradualmente
   */
  static applyDamping(velocity: number, dampingFactor: number = 0.9): number {
    return velocity * dampingFactor;
  }

  /**
   * Calcular spring animation parameters
   * Para animaciones más naturales con física de resorte
   */
  static calculateSpring(
    mass: number = 1,
    tension: number = 170,
    friction: number = 26
  ): PhysicsConfig {
    return {
      mass,
      tension,
      friction,
      velocity: 0,
    };
  }

  /**
   * Interpolar entre dos valores con easing
   */
  static interpolate(
    start: number,
    end: number,
    progress: number,
    easing: (t: number) => number = SwipePhysics.easeOutCubic
  ): number {
    const easedProgress = easing(progress);
    return start + (end - start) * easedProgress;
  }

  /**
   * Easing functions
   */
  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calcular la distancia efectiva con resistencia aplicada
 */
export function calculateEffectiveDistance(
  rawDistance: number,
  screenWidth: number,
  resistanceRatio: number = 0.5
): number {
  return SwipePhysics.calculateResistance(
    Math.abs(rawDistance),
    screenWidth,
    resistanceRatio
  ) * Math.sign(rawDistance);
}

/**
 * Determinar si el swipe debe completar la navegación
 */
export function shouldCompleteNavigation(
  distance: number,
  velocity: number,
  threshold: number,
  velocityThreshold: number
): boolean {
  const absDistance = Math.abs(distance);
  return absDistance > threshold || velocity > velocityThreshold;
}

/**
 * Calcular duración de animación basada en distancia
 */
export function calculateAnimationDuration(
  distance: number,
  baseSpeed: number = 0.5 // px/ms
): number {
  const duration = Math.abs(distance) / baseSpeed;
  // Limitar entre 200ms y 500ms
  return Math.max(200, Math.min(duration, 500));
}
