'use client';

/**
 * SwipeNavigationContext
 * Provides global configuration and state for swipe navigation
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useViewTransitionsContext } from '@/contexts/ViewTransitionsContext';
import { getNavigationStackManager, RouteDefinition } from '@/utils/navigation-stack-manager';

// ============================================
// TYPES
// ============================================

export interface SwipeNavigationConfig {
  enabled: boolean;
  swipeThreshold: number;        // Distancia mínima para trigger (px)
  velocityThreshold: number;     // Velocidad mínima para quick swipe (px/ms)
  resistanceRatio: number;       // Resistencia al arrastrar (0-1)
  snapBackDuration: number;      // Duración de animación de retorno (ms)
  previewOpacity: number;        // Opacidad de preview de página (0-1)
  enableHaptics: boolean;
  enablePreview: boolean;
  allowedRoutes: string[];       // Rutas donde swipe está habilitado
}

export interface NavigationStackItem {
  path: string;
  title: string;
  category: string;
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
}

export interface SwipeNavigationContextValue {
  config: SwipeNavigationConfig;
  navigationStack: NavigationStackItem[];
  currentIndex: number;
  isSwipeEnabled: boolean;
  updateConfig: (config: Partial<SwipeNavigationConfig>) => void;
  canNavigateLeft: () => boolean;
  canNavigateRight: () => boolean;
  getNextRoute: (direction: 'left' | 'right') => string | null;
  getNextRouteTitle: (direction: 'left' | 'right') => string | null;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: SwipeNavigationConfig = {
  enabled: true,
  swipeThreshold: 100,           // 100px
  velocityThreshold: 0.5,        // 0.5 px/ms
  resistanceRatio: 0.5,          // 50% resistance
  snapBackDuration: 300,         // 300ms
  previewOpacity: 0.3,           // 30% opacity
  enableHaptics: true,
  enablePreview: true,
  allowedRoutes: [],             // Empty = all routes allowed
};

// ============================================
// CONTEXT
// ============================================

const SwipeNavigationContext = createContext<SwipeNavigationContextValue | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export interface SwipeNavigationProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<SwipeNavigationConfig>;
}


export function SwipeNavigationProvider({
  children,
  initialConfig,
}: SwipeNavigationProviderProps) {
  const pathname = usePathname();
  const { capabilities } = useViewTransitionsContext();
  const stackManager = getNavigationStackManager();

  const [config, setConfig] = useState<SwipeNavigationConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const [navigationStack, setNavigationStack] = useState<NavigationStackItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Actualizar stack cuando cambia la ruta
  useEffect(() => {
    const category = stackManager.getCategoryForPath(pathname);
    if (!category) {
      setNavigationStack([]);
      setCurrentIndex(-1);
      return;
    }

    const routes = stackManager.getStackForCategory(category);
    const stack: NavigationStackItem[] = routes.map((route, index) => ({
      path: route.path,
      title: route.title,
      category: route.category,
      canSwipeLeft: index < routes.length - 1,
      canSwipeRight: index > 0,
    }));

    setNavigationStack(stack);

    const index = routes.findIndex(r => r.path === pathname);
    setCurrentIndex(index);
  }, [pathname, stackManager]);

  // Adaptar configuración según capacidades del dispositivo
  useEffect(() => {
    if (!capabilities) return;

    const adaptiveConfig: Partial<SwipeNavigationConfig> = {};

    // Dispositivos de gama baja
    if (capabilities.tier === 'low') {
      adaptiveConfig.enablePreview = false;
      adaptiveConfig.snapBackDuration = 200;
    }

    // Batería baja
    if (capabilities.batteryLevel && capabilities.batteryLevel < 0.2) {
      adaptiveConfig.enableHaptics = false;
      adaptiveConfig.enablePreview = false;
    }

    // Prefers reduced motion
    if (capabilities.prefersReducedMotion) {
      adaptiveConfig.snapBackDuration = 0;
      adaptiveConfig.enablePreview = false;
    }

    // Aplicar configuración adaptativa
    if (Object.keys(adaptiveConfig).length > 0) {
      setConfig(prev => ({ ...prev, ...adaptiveConfig }));
    }
  }, [capabilities]);

  // Deshabilitar en dispositivos sin touch
  const isSwipeEnabled = useCallback((): boolean => {
    if (!config.enabled) return false;
    if (typeof window === 'undefined') return false;
    if (!('ontouchstart' in window)) return false;

    // Verificar si la ruta actual está permitida
    if (config.allowedRoutes.length > 0) {
      return config.allowedRoutes.includes(pathname);
    }

    // Verificar si la ruta tiene swipe habilitado
    return stackManager.isSwipeEnabled(pathname);
  }, [config.enabled, config.allowedRoutes, pathname, stackManager]);

  // Actualizar configuración
  const updateConfig = useCallback((newConfig: Partial<SwipeNavigationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Verificar si puede navegar a la izquierda
  const canNavigateLeft = useCallback((): boolean => {
    if (currentIndex === -1 || currentIndex >= navigationStack.length - 1) {
      return false;
    }
    return navigationStack[currentIndex]?.canSwipeLeft ?? false;
  }, [currentIndex, navigationStack]);

  // Verificar si puede navegar a la derecha
  const canNavigateRight = useCallback((): boolean => {
    if (currentIndex === -1 || currentIndex <= 0) {
      return false;
    }
    return navigationStack[currentIndex]?.canSwipeRight ?? false;
  }, [currentIndex, navigationStack]);

  // Obtener ruta siguiente
  const getNextRoute = useCallback((direction: 'left' | 'right'): string | null => {
    return stackManager.getNextRoute(pathname, direction);
  }, [pathname, stackManager]);

  // Obtener título de ruta siguiente
  const getNextRouteTitle = useCallback((direction: 'left' | 'right'): string | null => {
    return stackManager.getNextRouteTitle(pathname, direction);
  }, [pathname, stackManager]);

  const value: SwipeNavigationContextValue = {
    config,
    navigationStack,
    currentIndex,
    isSwipeEnabled: isSwipeEnabled(),
    updateConfig,
    canNavigateLeft,
    canNavigateRight,
    getNextRoute,
    getNextRouteTitle,
  };

  return (
    <SwipeNavigationContext.Provider value={value}>
      {children}
    </SwipeNavigationContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para acceder al contexto de swipe navigation
 */
export function useSwipeNavigationContext(): SwipeNavigationContextValue {
  const context = useContext(SwipeNavigationContext);

  if (!context) {
    throw new Error('useSwipeNavigationContext must be used within SwipeNavigationProvider');
  }

  return context;
}
