/**
 * SwipeGestureDetector
 * Detects and processes touch-based swipe gestures with physics calculations
 */

// ============================================
// TYPES
// ============================================

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  startPoint: TouchPoint;
  currentPoint: TouchPoint;
  distance: number;
  velocity: number;
  direction: 'left' | 'right' | 'vertical' | null;
  isValid: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const HORIZONTAL_ANGLE_THRESHOLD = 30; // degrees
const MIN_DISTANCE_FOR_DIRECTION = 10; // px

// ============================================
// SWIPE GESTURE DETECTOR CLASS
// ============================================

export class SwipeGestureDetector {
  private startPoint: TouchPoint | null = null;
  private currentPoint: TouchPoint | null = null;
  private isTracking = false;

  /**
   * Iniciar tracking del gesto
   */
  onTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    this.currentPoint = { ...this.startPoint };
    this.isTracking = true;
  }


  /**
   * Actualizar posición durante el movimiento
   */
  onTouchMove(e: TouchEvent): SwipeGesture | null {
    if (!this.isTracking || !this.startPoint || e.touches.length !== 1) {
      return null;
    }

    const touch = e.touches[0];
    this.currentPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    return this.buildGesture();
  }

  /**
   * Finalizar tracking y determinar si es válido
   */
  onTouchEnd(e: TouchEvent): SwipeGesture | null {
    if (!this.isTracking || !this.startPoint) {
      return null;
    }

    // Si hay un touch restante, usar su posición
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      this.currentPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };
    }

    const gesture = this.buildGesture();
    this.reset();
    return gesture;
  }

  /**
   * Resetear el detector
   */
  reset(): void {
    this.startPoint = null;
    this.currentPoint = null;
    this.isTracking = false;
  }

  /**
   * Construir objeto de gesto con todos los datos calculados
   */
  private buildGesture(): SwipeGesture {
    if (!this.startPoint || !this.currentPoint) {
      return {
        startPoint: { x: 0, y: 0, timestamp: 0 },
        currentPoint: { x: 0, y: 0, timestamp: 0 },
        distance: 0,
        velocity: 0,
        direction: null,
        isValid: false,
      };
    }

    const deltaX = this.currentPoint.x - this.startPoint.x;
    const deltaY = this.currentPoint.y - this.startPoint.y;
    const distance = Math.abs(deltaX);
    const velocity = this.calculateVelocity();
    const direction = this.determineDirection(deltaX, deltaY);
    const isValid = this.isHorizontalSwipe(deltaX, deltaY);

    return {
      startPoint: this.startPoint,
      currentPoint: this.currentPoint,
      distance,
      velocity,
      direction,
      isValid,
    };
  }

  /**
   * Calcular velocidad del swipe (px/ms)
   */
  private calculateVelocity(): number {
    if (!this.startPoint || !this.currentPoint) return 0;

    const deltaX = this.currentPoint.x - this.startPoint.x;
    const deltaTime = this.currentPoint.timestamp - this.startPoint.timestamp;

    if (deltaTime === 0) return 0;

    return Math.abs(deltaX / deltaTime);
  }

  /**
   * Determinar dirección del swipe
   */
  private determineDirection(
    deltaX: number,
    deltaY: number
  ): 'left' | 'right' | 'vertical' | null {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // No hay movimiento suficiente
    if (absDeltaX < MIN_DISTANCE_FOR_DIRECTION && absDeltaY < MIN_DISTANCE_FOR_DIRECTION) {
      return null;
    }

    // Determinar si es vertical u horizontal
    if (absDeltaY > absDeltaX) {
      return 'vertical';
    }

    // Horizontal: determinar izquierda o derecha
    return deltaX > 0 ? 'right' : 'left';
  }

  /**
   * Verificar si es un swipe horizontal válido
   */
  private isHorizontalSwipe(deltaX: number, deltaY: number): boolean {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // No hay movimiento suficiente
    if (absDeltaX < MIN_DISTANCE_FOR_DIRECTION) {
      return false;
    }

    // Calcular ángulo
    const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);

    // Ángulo < 30° o > 150° = horizontal
    return angle < HORIZONTAL_ANGLE_THRESHOLD || angle > (180 - HORIZONTAL_ANGLE_THRESHOLD);
  }

  /**
   * Obtener estado actual del tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Obtener punto de inicio
   */
  getStartPoint(): TouchPoint | null {
    return this.startPoint;
  }

  /**
   * Obtener punto actual
   */
  getCurrentPoint(): TouchPoint | null {
    return this.currentPoint;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Determinar si debe navegar basado en distancia y velocidad
 */
export function shouldNavigate(
  distance: number,
  velocity: number,
  distanceThreshold: number,
  velocityThreshold: number
): boolean {
  // Navegar si:
  // 1. Distancia > threshold, O
  // 2. Velocidad > velocityThreshold (quick swipe)
  return distance > distanceThreshold || velocity > velocityThreshold;
}

/**
 * Calcular progreso del swipe (0-1)
 */
export function calculateSwipeProgress(
  distance: number,
  maxDistance: number
): number {
  return Math.min(Math.max(distance / maxDistance, 0), 1);
}
