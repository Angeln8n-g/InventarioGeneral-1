/**
 * Frame Rate Monitor
 * Monitors FPS during transitions to detect performance issues
 */

// ============================================
// TYPES
// ============================================

export interface FrameData {
  timestamp: number;
  delta: number;
  fps: number;
}

// ============================================
// FRAME RATE MONITOR
// ============================================

export class FrameRateMonitor {
  private static instance: FrameRateMonitor;
  private frames: FrameData[] = [];
  private maxFrames = 60; // Keep last 60 frames
  private lastTimestamp: number | null = null;
  private isMonitoring = false;
  private animationFrameId: number | null = null;
  
  private constructor() {}
  
  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): FrameRateMonitor {
    if (!FrameRateMonitor.instance) {
      FrameRateMonitor.instance = new FrameRateMonitor();
    }
    return FrameRateMonitor.instance;
  }
  
  /**
   * Inicia el monitoreo de FPS
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTimestamp = performance.now();
    this.measureFrame();
  }
  
  /**
   * Detiene el monitoreo de FPS
   */
  stop(): void {
    this.isMonitoring = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Mide un frame individual
   */
  private measureFrame = (): void => {
    if (!this.isMonitoring) return;
    
    const currentTimestamp = performance.now();
    
    if (this.lastTimestamp !== null) {
      const delta = currentTimestamp - this.lastTimestamp;
      const fps = delta > 0 ? 1000 / delta : 60;
      
      this.frames.push({
        timestamp: currentTimestamp,
        delta,
        fps,
      });
      
      // Mantener solo los últimos N frames
      if (this.frames.length > this.maxFrames) {
        this.frames.shift();
      }
    }
    
    this.lastTimestamp = currentTimestamp;
    this.animationFrameId = requestAnimationFrame(this.measureFrame);
  };
  
  /**
   * Mide FPS durante una transición específica
   */
  async measure(callback: () => Promise<void>): Promise<FrameData[]> {
    this.clear();
    this.start();
    
    try {
      await callback();
    } finally {
      // Esperar un frame más para capturar el último
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      this.stop();
    }
    
    return [...this.frames];
  }
  
  /**
   * Obtiene el FPS promedio
   */
  getAverageFPS(): number {
    if (this.frames.length === 0) return 60;
    
    const sum = this.frames.reduce((acc, frame) => acc + frame.fps, 0);
    return sum / this.frames.length;
  }
  
  /**
   * Obtiene el FPS mínimo
   */
  getMinFPS(): number {
    if (this.frames.length === 0) return 60;
    
    return Math.min(...this.frames.map(frame => frame.fps));
  }
  
  /**
   * Obtiene el FPS máximo
   */
  getMaxFPS(): number {
    if (this.frames.length === 0) return 60;
    
    return Math.max(...this.frames.map(frame => frame.fps));
  }
  
  /**
   * Obtiene el número de frames dropped (< 30 FPS)
   */
  getDroppedFrames(): number {
    return this.frames.filter(frame => frame.fps < 30).length;
  }
  
  /**
   * Determina si se debe optimizar basado en FPS
   */
  shouldOptimize(): boolean {
    const avgFPS = this.getAverageFPS();
    const droppedFrames = this.getDroppedFrames();
    const droppedPercentage = this.frames.length > 0 
      ? (droppedFrames / this.frames.length) * 100 
      : 0;
    
    // Optimizar si FPS promedio < 30 o más del 20% de frames dropped
    return avgFPS < 30 || droppedPercentage > 20;
  }
  
  /**
   * Obtiene todos los frames registrados
   */
  getFrames(): FrameData[] {
    return [...this.frames];
  }
  
  /**
   * Limpia los frames registrados
   */
  clear(): void {
    this.frames = [];
    this.lastTimestamp = null;
  }
  
  /**
   * Obtiene un reporte completo de performance
   */
  getReport(): {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    droppedFrames: number;
    totalFrames: number;
    droppedPercentage: number;
    shouldOptimize: boolean;
  } {
    const droppedFrames = this.getDroppedFrames();
    const totalFrames = this.frames.length;
    
    return {
      averageFPS: this.getAverageFPS(),
      minFPS: this.getMinFPS(),
      maxFPS: this.getMaxFPS(),
      droppedFrames,
      totalFrames,
      droppedPercentage: totalFrames > 0 ? (droppedFrames / totalFrames) * 100 : 0,
      shouldOptimize: this.shouldOptimize(),
    };
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Mide FPS durante una transición
 */
export async function measureFPS(callback: () => Promise<void>): Promise<FrameData[]> {
  const monitor = FrameRateMonitor.getInstance();
  return monitor.measure(callback);
}

/**
 * Obtiene el FPS promedio actual
 */
export function getAverageFPS(): number {
  const monitor = FrameRateMonitor.getInstance();
  return monitor.getAverageFPS();
}

/**
 * Determina si se debe optimizar
 */
export function shouldOptimizeFPS(): boolean {
  const monitor = FrameRateMonitor.getInstance();
  return monitor.shouldOptimize();
}

/**
 * Obtiene un reporte de FPS
 */
export function getFPSReport() {
  const monitor = FrameRateMonitor.getInstance();
  return monitor.getReport();
}

/**
 * Limpia las métricas de FPS
 */
export function clearFPSMetrics(): void {
  const monitor = FrameRateMonitor.getInstance();
  monitor.clear();
}
