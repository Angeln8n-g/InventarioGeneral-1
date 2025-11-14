/**
 * Performance Optimizer
 * Optimizes transitions based on device capabilities and performance metrics
 */

import { DeviceTier, TransitionSpeed, TRANSITION_SPEEDS } from './view-transitions';
import { DeviceCapabilities } from './device-capabilities';

// ============================================
// TYPES
// ============================================

export interface OptimizationStrategy {
  reduceDuration: boolean;
  simplifyAnimation: boolean;
  skipTransition: boolean;
  reason: string;
}

export interface PerformanceMetrics {
  fps: number;
  duration: number;
  dropped: number;
  timestamp: number;
}

export interface AdaptiveConfig {
  duration: number;
  shouldSimplify: boolean;
  shouldSkip: boolean;
}

// ============================================
// PERFORMANCE OPTIMIZER
// ============================================

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 30; // Keep last 30 transitions
  
  private constructor() {}
  
  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }
  
  /**
   * Registra métricas de una transición
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Mantener solo las últimas N métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
  
  /**
   * Obtiene el promedio de performance
   */
  getAveragePerformance(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        fps: 60,
        duration: 0,
        dropped: 0,
        timestamp: Date.now(),
      };
    }
    
    const sum = this.metrics.reduce(
      (acc, metric) => ({
        fps: acc.fps + metric.fps,
        duration: acc.duration + metric.duration,
        dropped: acc.dropped + metric.dropped,
        timestamp: acc.timestamp,
      }),
      { fps: 0, duration: 0, dropped: 0, timestamp: Date.now() }
    );
    
    return {
      fps: sum.fps / this.metrics.length,
      duration: sum.duration / this.metrics.length,
      dropped: sum.dropped / this.metrics.length,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Determina si se debe optimizar basado en métricas
   */
  shouldOptimize(): OptimizationStrategy {
    const avg = this.getAveragePerformance();
    
    // FPS crítico: saltar transiciones
    if (avg.fps < 15) {
      return {
        reduceDuration: true,
        simplifyAnimation: true,
        skipTransition: true,
        reason: 'Critical FPS (< 15)',
      };
    }
    
    // FPS bajo: simplificar animaciones
    if (avg.fps < 20) {
      return {
        reduceDuration: true,
        simplifyAnimation: true,
        skipTransition: false,
        reason: 'Low FPS (< 20)',
      };
    }
    
    // FPS moderado: reducir duración
    if (avg.fps < 30) {
      return {
        reduceDuration: true,
        simplifyAnimation: false,
        skipTransition: false,
        reason: 'Moderate FPS (< 30)',
      };
    }
    
    // Performance buena
    return {
      reduceDuration: false,
      simplifyAnimation: false,
      skipTransition: false,
      reason: 'Good performance',
    };
  }
  
  /**
   * Limpia las métricas
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// ============================================
// OPTIMIZATION FUNCTIONS
// ============================================

/**
 * Obtiene una duración adaptativa según el tier del dispositivo
 */
export function getAdaptiveDuration(
  baseDuration: number,
  deviceTier: DeviceTier
): number {
  const multipliers: Record<DeviceTier, number> = {
    high: 1.0,    // Duración completa
    medium: 0.8,  // 20% más rápido
    low: 0.6,     // 40% más rápido
  };
  
  return Math.round(baseDuration * multipliers[deviceTier]);
}

/**
 * Determina si se debe simplificar la transición basado en la conexión
 */
export function shouldSimplifyTransition(capabilities: DeviceCapabilities): boolean {
  // Simplificar en conexiones lentas
  if (capabilities.connectionSpeed === 'slow') {
    return true;
  }
  
  // Simplificar si el usuario tiene modo ahorro de datos
  if (capabilities.saveData) {
    return true;
  }
  
  // Simplificar en dispositivos de gama baja
  if (capabilities.tier === 'low') {
    return true;
  }
  
  return false;
}

/**
 * Obtiene optimizaciones basadas en el nivel de batería
 */
export async function getBatteryOptimization(
  batteryLevel?: number,
  isCharging?: boolean
): Promise<OptimizationStrategy> {
  // Si no hay info de batería, no optimizar
  if (batteryLevel === undefined) {
    return {
      reduceDuration: false,
      simplifyAnimation: false,
      skipTransition: false,
      reason: 'Battery info not available',
    };
  }
  
  // Si está cargando, no optimizar
  if (isCharging) {
    return {
      reduceDuration: false,
      simplifyAnimation: false,
      skipTransition: false,
      reason: 'Device charging',
    };
  }
  
  // Batería crítica: saltar transiciones
  if (batteryLevel < 0.1) {
    return {
      reduceDuration: true,
      simplifyAnimation: true,
      skipTransition: true,
      reason: 'Critical battery (< 10%)',
    };
  }
  
  // Batería baja: simplificar y reducir
  if (batteryLevel < 0.2) {
    return {
      reduceDuration: true,
      simplifyAnimation: true,
      skipTransition: false,
      reason: 'Low battery (< 20%)',
    };
  }
  
  // Batería moderada: solo reducir duración
  if (batteryLevel < 0.3) {
    return {
      reduceDuration: true,
      simplifyAnimation: false,
      skipTransition: false,
      reason: 'Moderate battery (< 30%)',
    };
  }
  
  return {
    reduceDuration: false,
    simplifyAnimation: false,
    skipTransition: false,
    reason: 'Good battery level',
  };
}

/**
 * Calcula la configuración adaptativa completa
 */
export async function getAdaptiveConfig(
  speed: TransitionSpeed,
  capabilities: DeviceCapabilities
): Promise<AdaptiveConfig> {
  const baseDuration = TRANSITION_SPEEDS[speed];
  
  // Ajustar duración según tier
  let duration = getAdaptiveDuration(baseDuration, capabilities.tier);
  
  // Verificar si se debe simplificar
  const shouldSimplify = shouldSimplifyTransition(capabilities);
  
  // Verificar optimizaciones de batería
  const batteryOpt = await getBatteryOptimization(
    capabilities.batteryLevel,
    capabilities.isCharging
  );
  
  // Aplicar reducción de batería
  if (batteryOpt.reduceDuration) {
    duration = Math.round(duration * 0.5); // 50% más rápido
  }
  
  // Determinar si se debe saltar
  const shouldSkip = batteryOpt.skipTransition || capabilities.prefersReducedMotion;
  
  return {
    duration,
    shouldSimplify: shouldSimplify || batteryOpt.simplifyAnimation,
    shouldSkip,
  };
}

/**
 * Obtiene la estrategia de optimización completa
 */
export async function getOptimizationStrategy(
  capabilities: DeviceCapabilities
): Promise<OptimizationStrategy> {
  // Verificar prefers-reduced-motion
  if (capabilities.prefersReducedMotion) {
    return {
      reduceDuration: true,
      simplifyAnimation: true,
      skipTransition: true,
      reason: 'User prefers reduced motion',
    };
  }
  
  // Verificar batería
  const batteryOpt = await getBatteryOptimization(
    capabilities.batteryLevel,
    capabilities.isCharging
  );
  
  if (batteryOpt.skipTransition) {
    return batteryOpt;
  }
  
  // Verificar performance histórica
  const optimizer = PerformanceOptimizer.getInstance();
  const perfOpt = optimizer.shouldOptimize();
  
  if (perfOpt.skipTransition) {
    return perfOpt;
  }
  
  // Combinar optimizaciones
  return {
    reduceDuration: batteryOpt.reduceDuration || perfOpt.reduceDuration,
    simplifyAnimation: batteryOpt.simplifyAnimation || perfOpt.simplifyAnimation || shouldSimplifyTransition(capabilities),
    skipTransition: false,
    reason: 'Combined optimizations',
  };
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Registra métricas de performance
 */
export function recordPerformanceMetric(metric: PerformanceMetrics): void {
  const optimizer = PerformanceOptimizer.getInstance();
  optimizer.recordMetric(metric);
}

/**
 * Obtiene el promedio de performance
 */
export function getAveragePerformance(): PerformanceMetrics {
  const optimizer = PerformanceOptimizer.getInstance();
  return optimizer.getAveragePerformance();
}

/**
 * Limpia las métricas de performance
 */
export function clearPerformanceMetrics(): void {
  const optimizer = PerformanceOptimizer.getInstance();
  optimizer.clearMetrics();
}
