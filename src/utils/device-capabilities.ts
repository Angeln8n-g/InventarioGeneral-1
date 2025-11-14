/**
 * Device Capabilities Detector
 * Detects device hardware, network, and battery capabilities
 */

import { DeviceTier } from './view-transitions';

// ============================================
// TYPES
// ============================================

export interface DeviceCapabilities {
  // Browser support
  supportsViewTransitions: boolean;
  prefersReducedMotion: boolean;
  
  // Device hardware
  tier: DeviceTier;
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  isMobile: boolean;
  
  // Network
  connectionSpeed: 'slow' | 'medium' | 'fast';
  saveData: boolean;
  
  // Battery
  batteryLevel: number | undefined;
  isCharging: boolean | undefined;
}

// ============================================
// DEVICE CAPABILITIES DETECTOR
// ============================================

export class DeviceCapabilitiesDetector {
  private static instance: DeviceCapabilitiesDetector;
  private capabilities: DeviceCapabilities | null = null;
  
  private constructor() {}
  
  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): DeviceCapabilitiesDetector {
    if (!DeviceCapabilitiesDetector.instance) {
      DeviceCapabilitiesDetector.instance = new DeviceCapabilitiesDetector();
    }
    return DeviceCapabilitiesDetector.instance;
  }
  
  /**
   * Detecta todas las capacidades del dispositivo
   */
  async detect(): Promise<DeviceCapabilities> {
    // Si ya detectamos, retornar cache
    if (this.capabilities) {
      return this.capabilities;
    }
    
    const capabilities: DeviceCapabilities = {
      // Browser support
      supportsViewTransitions: this.detectViewTransitionsSupport(),
      prefersReducedMotion: this.detectReducedMotion(),
      
      // Device hardware
      tier: this.detectDeviceTier(),
      hardwareConcurrency: this.getHardwareConcurrency(),
      deviceMemory: this.getDeviceMemory(),
      isMobile: this.isMobileDevice(),
      
      // Network
      connectionSpeed: this.getConnectionSpeed(),
      saveData: this.getSaveDataPreference(),
      
      // Battery
      batteryLevel: undefined,
      isCharging: undefined,
    };
    
    // Detectar batería (async)
    try {
      const battery = await this.getBatteryInfo();
      capabilities.batteryLevel = battery.level;
      capabilities.isCharging = battery.charging;
    } catch (error) {
      // Battery API no disponible
    }
    
    this.capabilities = capabilities;
    return capabilities;
  }
  
  /**
   * Fuerza una nueva detección (útil para cambios de red/batería)
   */
  async refresh(): Promise<DeviceCapabilities> {
    this.capabilities = null;
    return this.detect();
  }
  
  // ============================================
  // DETECTION METHODS
  // ============================================
  
  private detectViewTransitionsSupport(): boolean {
    if (typeof document === 'undefined') return false;
    return 'startViewTransition' in document;
  }
  
  private detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  private getHardwareConcurrency(): number {
    if (typeof navigator === 'undefined') return 2;
    return navigator.hardwareConcurrency || 2;
  }
  
  private getDeviceMemory(): number | undefined {
    if (typeof navigator === 'undefined') return undefined;
    return (navigator as any).deviceMemory;
  }
  
  private detectDeviceTier(): DeviceTier {
    if (typeof navigator === 'undefined') return 'medium';
    
    const cores = this.getHardwareConcurrency();
    const memory = this.getDeviceMemory() || 4;
    const connection = this.getConnectionSpeed();
    
    // High-end: 6+ cores, 8GB+ RAM, fast connection
    if (cores >= 6 && memory >= 8 && connection === 'fast') {
      return 'high';
    }
    
    // Low-end: <4 cores, <4GB RAM, slow connection
    if (cores < 4 || memory < 4 || connection === 'slow') {
      return 'low';
    }
    
    return 'medium';
  }
  
  /**
   * Detecta si es un dispositivo móvil
   */
  isMobileDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    // Detectar por user agent
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // Detectar por viewport
    const isMobileViewport = window.innerWidth <= 768;
    
    // Detectar por touch support
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || (isMobileViewport && hasTouchScreen);
  }
  
  private getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator === 'undefined') return 'fast';
    
    const connection = (navigator as any).connection;
    if (!connection) return 'fast';
    
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow';
    }
    
    if (effectiveType === '3g') {
      return 'medium';
    }
    
    return 'fast'; // 4g or better
  }
  
  private getSaveDataPreference(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    const connection = (navigator as any).connection;
    if (!connection) return false;
    
    return connection.saveData === true;
  }
  
  /**
   * Obtiene información de la batería
   */
  async getBatteryInfo(): Promise<{ level: number; charging: boolean }> {
    if (typeof navigator === 'undefined' || !(navigator as any).getBattery) {
      throw new Error('Battery API not supported');
    }
    
    const battery = await (navigator as any).getBattery();
    
    return {
      level: battery.level,
      charging: battery.charging,
    };
  }
  
  /**
   * Obtiene el nivel de batería actual
   */
  async getBatteryLevel(): Promise<number | undefined> {
    try {
      const battery = await this.getBatteryInfo();
      return battery.level;
    } catch (error) {
      return undefined;
    }
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Obtiene las capacidades del dispositivo (singleton)
 */
export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  const detector = DeviceCapabilitiesDetector.getInstance();
  return detector.detect();
}

/**
 * Refresca las capacidades del dispositivo
 */
export async function refreshDeviceCapabilities(): Promise<DeviceCapabilities> {
  const detector = DeviceCapabilitiesDetector.getInstance();
  return detector.refresh();
}

/**
 * Verifica si es un dispositivo móvil
 */
export function isMobileDevice(): boolean {
  const detector = DeviceCapabilitiesDetector.getInstance();
  return detector.isMobileDevice();
}

/**
 * Obtiene el nivel de batería
 */
export async function getBatteryLevel(): Promise<number | undefined> {
  const detector = DeviceCapabilitiesDetector.getInstance();
  return detector.getBatteryLevel();
}
