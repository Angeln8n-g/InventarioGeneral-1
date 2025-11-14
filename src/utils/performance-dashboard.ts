/**
 * Performance Dashboard
 * Tracks and reports on transition performance metrics
 */

import { FrameData } from './frame-rate-monitor';

// ============================================
// TYPES
// ============================================

export interface PerformanceMetrics {
  transitionId: string;
  timestamp: number;
  duration: number;
  fps: {
    average: number;
    min: number;
    max: number;
  };
  frames: {
    total: number;
    dropped: number;
    droppedPercentage: number;
  };
  type: string;
  success: boolean;
  error?: string;
}

export interface PerformanceReport {
  totalTransitions: number;
  successfulTransitions: number;
  failedTransitions: number;
  successRate: number;
  averageDuration: number;
  averageFPS: number;
  totalDroppedFrames: number;
  averageDroppedPercentage: number;
  slowestTransition: PerformanceMetrics | null;
  fastestTransition: PerformanceMetrics | null;
  recentMetrics: PerformanceMetrics[];
}

// ============================================
// PERFORMANCE DASHBOARD
// ============================================

export class PerformanceDashboard {
  private static instance: PerformanceDashboard;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 transitions
  
  private constructor() {}
  
  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): PerformanceDashboard {
    if (!PerformanceDashboard.instance) {
      PerformanceDashboard.instance = new PerformanceDashboard();
    }
    return PerformanceDashboard.instance;
  }
  
  /**
   * Registra una transición
   */
  recordTransition(
    transitionId: string,
    type: string,
    duration: number,
    frames: FrameData[],
    success: boolean,
    error?: string
  ): void {
    const droppedFrames = frames.filter(f => f.fps < 30).length;
    const avgFPS = frames.length > 0 
      ? frames.reduce((sum, f) => sum + f.fps, 0) / frames.length 
      : 60;
    
    const metric: PerformanceMetrics = {
      transitionId,
      timestamp: Date.now(),
      duration,
      fps: {
        average: avgFPS,
        min: frames.length > 0 ? Math.min(...frames.map(f => f.fps)) : 60,
        max: frames.length > 0 ? Math.max(...frames.map(f => f.fps)) : 60,
      },
      frames: {
        total: frames.length,
        dropped: droppedFrames,
        droppedPercentage: frames.length > 0 ? (droppedFrames / frames.length) * 100 : 0,
      },
      type,
      success,
      error,
    };
    
    this.metrics.push(metric);
    
    // Mantener solo las últimas N métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      this.logMetric(metric);
    }
  }
  
  /**
   * Log de métrica en consola (solo desarrollo)
   */
  private logMetric(metric: PerformanceMetrics): void {
    const status = metric.success ? '✅' : '❌';
    const fpsColor = metric.fps.average >= 50 ? '🟢' : metric.fps.average >= 30 ? '🟡' : '🔴';
    
    console.group(`${status} Transition: ${metric.transitionId}`);
    console.log(`Type: ${metric.type}`);
    console.log(`Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`${fpsColor} FPS: ${metric.fps.average.toFixed(1)} (min: ${metric.fps.min.toFixed(1)}, max: ${metric.fps.max.toFixed(1)})`);
    console.log(`Frames: ${metric.frames.total} (dropped: ${metric.frames.dropped}, ${metric.frames.droppedPercentage.toFixed(1)}%)`);
    
    if (metric.error) {
      console.error(`Error: ${metric.error}`);
    }
    
    console.groupEnd();
  }
  
  /**
   * Obtiene todas las métricas
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Obtiene métricas recientes (últimas N)
   */
  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }
  
  /**
   * Obtiene métricas por tipo
   */
  getMetricsByType(type: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.type === type);
  }
  
  /**
   * Obtiene un reporte completo
   */
  getReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        totalTransitions: 0,
        successfulTransitions: 0,
        failedTransitions: 0,
        successRate: 0,
        averageDuration: 0,
        averageFPS: 0,
        totalDroppedFrames: 0,
        averageDroppedPercentage: 0,
        slowestTransition: null,
        fastestTransition: null,
        recentMetrics: [],
      };
    }
    
    const successful = this.metrics.filter(m => m.success);
    const failed = this.metrics.filter(m => !m.success);
    
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalFPS = this.metrics.reduce((sum, m) => sum + m.fps.average, 0);
    const totalDropped = this.metrics.reduce((sum, m) => sum + m.frames.dropped, 0);
    const totalDroppedPercentage = this.metrics.reduce((sum, m) => sum + m.frames.droppedPercentage, 0);
    
    const slowest = this.metrics.reduce((max, m) => 
      m.duration > max.duration ? m : max
    );
    
    const fastest = this.metrics.reduce((min, m) => 
      m.duration < min.duration ? m : min
    );
    
    return {
      totalTransitions: this.metrics.length,
      successfulTransitions: successful.length,
      failedTransitions: failed.length,
      successRate: (successful.length / this.metrics.length) * 100,
      averageDuration: totalDuration / this.metrics.length,
      averageFPS: totalFPS / this.metrics.length,
      totalDroppedFrames: totalDropped,
      averageDroppedPercentage: totalDroppedPercentage / this.metrics.length,
      slowestTransition: slowest,
      fastestTransition: fastest,
      recentMetrics: this.getRecentMetrics(10),
    };
  }
  
  /**
   * Obtiene estadísticas por tipo de transición
   */
  getStatsByType(): Record<string, {
    count: number;
    averageDuration: number;
    averageFPS: number;
    successRate: number;
  }> {
    const types = new Set(this.metrics.map(m => m.type));
    const stats: Record<string, any> = {};
    
    types.forEach(type => {
      const typeMetrics = this.getMetricsByType(type);
      const successful = typeMetrics.filter(m => m.success);
      
      stats[type] = {
        count: typeMetrics.length,
        averageDuration: typeMetrics.reduce((sum, m) => sum + m.duration, 0) / typeMetrics.length,
        averageFPS: typeMetrics.reduce((sum, m) => sum + m.fps.average, 0) / typeMetrics.length,
        successRate: (successful.length / typeMetrics.length) * 100,
      };
    });
    
    return stats;
  }
  
  /**
   * Limpia todas las métricas
   */
  clear(): void {
    this.metrics = [];
  }
  
  /**
   * Exporta métricas como JSON
   */
  export(): string {
    return JSON.stringify({
      report: this.getReport(),
      statsByType: this.getStatsByType(),
      allMetrics: this.metrics,
    }, null, 2);
  }
  
  /**
   * Detecta problemas de performance
   */
  detectIssues(): {
    hasIssues: boolean;
    issues: string[];
  } {
    const report = this.getReport();
    const issues: string[] = [];
    
    // FPS bajo
    if (report.averageFPS < 30) {
      issues.push(`Low average FPS: ${report.averageFPS.toFixed(1)}`);
    }
    
    // Muchos frames dropped
    if (report.averageDroppedPercentage > 20) {
      issues.push(`High dropped frames: ${report.averageDroppedPercentage.toFixed(1)}%`);
    }
    
    // Duración muy larga
    if (report.averageDuration > 500) {
      issues.push(`Long average duration: ${report.averageDuration.toFixed(0)}ms`);
    }
    
    // Tasa de fallos alta
    if (report.successRate < 95) {
      issues.push(`Low success rate: ${report.successRate.toFixed(1)}%`);
    }
    
    return {
      hasIssues: issues.length > 0,
      issues,
    };
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Registra una transición
 */
export function recordTransition(
  transitionId: string,
  type: string,
  duration: number,
  frames: FrameData[],
  success: boolean,
  error?: string
): void {
  const dashboard = PerformanceDashboard.getInstance();
  dashboard.recordTransition(transitionId, type, duration, frames, success, error);
}

/**
 * Obtiene el reporte de performance
 */
export function getPerformanceReport(): PerformanceReport {
  const dashboard = PerformanceDashboard.getInstance();
  return dashboard.getReport();
}

/**
 * Obtiene estadísticas por tipo
 */
export function getStatsByType() {
  const dashboard = PerformanceDashboard.getInstance();
  return dashboard.getStatsByType();
}

/**
 * Limpia las métricas
 */
export function clearPerformanceDashboard(): void {
  const dashboard = PerformanceDashboard.getInstance();
  dashboard.clear();
}

/**
 * Exporta métricas
 */
export function exportMetrics(): string {
  const dashboard = PerformanceDashboard.getInstance();
  return dashboard.export();
}

/**
 * Detecta problemas de performance
 */
export function detectPerformanceIssues() {
  const dashboard = PerformanceDashboard.getInstance();
  return dashboard.detectIssues();
}
