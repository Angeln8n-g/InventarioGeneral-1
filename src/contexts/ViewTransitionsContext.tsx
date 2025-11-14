'use client';

/**
 * View Transitions Context
 * Provides global configuration and state for view transitions
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSITION_SPEEDS, TRANSITION_EASINGS, TransitionSpeed, TransitionEasing } from '@/utils/view-transitions';
import { DeviceCapabilities, getDeviceCapabilities } from '@/utils/device-capabilities';

// ============================================
// TYPES
// ============================================

export interface ViewTransitionsConfig {
  enabled: boolean;
  speeds: Record<TransitionSpeed, number>;
  easings: Record<TransitionEasing, string>;
  respectReducedMotion: boolean;
  enableHaptics: boolean;
  enableSharedElements: boolean;
  performanceBudget: {
    maxConcurrentTransitions: number;
    maxDuration: number;
    minFrameRate: number;
  };
}

export interface ViewTransitionsContextValue {
  config: ViewTransitionsConfig;
  capabilities: DeviceCapabilities | null;
  updateConfig: (config: Partial<ViewTransitionsConfig>) => void;
  isTransitioning: boolean;
  activeTransitions: Set<string>;
  addTransition: (id: string) => void;
  removeTransition: (id: string) => void;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: ViewTransitionsConfig = {
  enabled: true,
  speeds: { ...TRANSITION_SPEEDS },
  easings: { ...TRANSITION_EASINGS },
  respectReducedMotion: true,
  enableHaptics: true,
  enableSharedElements: true,
  performanceBudget: {
    maxConcurrentTransitions: 3,
    maxDuration: 500,
    minFrameRate: 30,
  },
};

// ============================================
// CONTEXT
// ============================================

const ViewTransitionsContext = createContext<ViewTransitionsContextValue | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export interface ViewTransitionsProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<ViewTransitionsConfig>;
}

export function ViewTransitionsProvider({ 
  children, 
  initialConfig 
}: ViewTransitionsProviderProps) {
  const [config, setConfig] = useState<ViewTransitionsConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [activeTransitions, setActiveTransitions] = useState<Set<string>>(new Set());
  
  // Detectar capacidades al montar
  useEffect(() => {
    async function detectCapabilities() {
      try {
        const caps = await getDeviceCapabilities();
        setCapabilities(caps);
        
        // Ajustar config según capacidades
        if (caps.prefersReducedMotion && config.respectReducedMotion) {
          setConfig(prev => ({
            ...prev,
            enabled: false,
          }));
        }
        
        // Ajustar speeds según tier del dispositivo
        if (caps.tier === 'low') {
          setConfig(prev => ({
            ...prev,
            speeds: {
              instant: Math.round(prev.speeds.instant * 0.6),
              fast: Math.round(prev.speeds.fast * 0.6),
              normal: Math.round(prev.speeds.normal * 0.6),
              slow: Math.round(prev.speeds.slow * 0.6),
              dramatic: Math.round(prev.speeds.dramatic * 0.6),
            },
          }));
        } else if (caps.tier === 'medium') {
          setConfig(prev => ({
            ...prev,
            speeds: {
              instant: Math.round(prev.speeds.instant * 0.8),
              fast: Math.round(prev.speeds.fast * 0.8),
              normal: Math.round(prev.speeds.normal * 0.8),
              slow: Math.round(prev.speeds.slow * 0.8),
              dramatic: Math.round(prev.speeds.dramatic * 0.8),
            },
          }));
        }
      } catch (error) {
        console.error('Failed to detect device capabilities:', error);
      }
    }
    
    detectCapabilities();
  }, []);
  
  // Escuchar cambios en prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (config.respectReducedMotion) {
        setConfig(prev => ({
          ...prev,
          enabled: !e.matches,
        }));
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [config.respectReducedMotion]);
  
  // Actualizar configuración
  const updateConfig = useCallback((newConfig: Partial<ViewTransitionsConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
    }));
  }, []);
  
  // Agregar transición activa
  const addTransition = useCallback((id: string) => {
    setActiveTransitions(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  
  // Remover transición activa
  const removeTransition = useCallback((id: string) => {
    setActiveTransitions(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  
  const value: ViewTransitionsContextValue = {
    config,
    capabilities,
    updateConfig,
    isTransitioning: activeTransitions.size > 0,
    activeTransitions,
    addTransition,
    removeTransition,
  };
  
  return (
    <ViewTransitionsContext.Provider value={value}>
      {children}
    </ViewTransitionsContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para acceder al contexto de view transitions
 */
export function useViewTransitionsContext(): ViewTransitionsContextValue {
  const context = useContext(ViewTransitionsContext);
  
  if (!context) {
    throw new Error('useViewTransitionsContext must be used within ViewTransitionsProvider');
  }
  
  return context;
}
