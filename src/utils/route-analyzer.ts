/**
 * Route Analyzer
 * Analyzes routes to determine navigation direction and recommend transitions
 */

import { TransitionSpeed, TransitionEasing } from './view-transitions';

// ============================================
// TYPES
// ============================================

export type RouteCategory = 
  | 'dashboard' 
  | 'profile' 
  | 'tools' 
  | 'consumables' 
  | 'admin' 
  | 'auth'
  | 'other';

export type NavigationDirection = 
  | 'forward'    // Profundizar (dashboard → detail)
  | 'backward'   // Regresar (detail → dashboard)
  | 'lateral'    // Mismo nivel (tab → tab)
  | 'modal'      // Abrir modal
  | 'none';      // Sin dirección clara

export interface RouteInfo {
  path: string;
  depth: number;
  category: RouteCategory;
  segments: string[];
  isDynamic: boolean;
  isModal: boolean;
}

export interface TransitionRecommendation {
  direction: NavigationDirection;
  speed: TransitionSpeed;
  easing: TransitionEasing;
  type: string; // CSS class name for transition type
}

// ============================================
// ROUTE PATTERNS
// ============================================

const ROUTE_CATEGORIES: Record<string, RouteCategory> = {
  '/dashboard': 'dashboard',
  '/profile': 'profile',
  '/tools': 'tools',
  '/consumables': 'consumables',
  '/admin': 'admin',
  '/login': 'auth',
  '/register': 'auth',
  '/forgot-password': 'auth',
};

const MODAL_PATTERNS = [
  /\/modal\//,
  /\?modal=/,
  /\/edit$/,
  /\/create$/,
  /\/delete$/,
];

// ============================================
// ROUTE ANALYZER
// ============================================

/**
 * Analiza una ruta y extrae información
 */
export function analyzeRoute(path: string): RouteInfo {
  // Limpiar query params y hash
  const cleanPath = path.split('?')[0].split('#')[0];
  
  // Obtener segmentos
  const segments = cleanPath.split('/').filter(Boolean);
  
  // Calcular profundidad
  const depth = segments.length;
  
  // Detectar si es dinámica (contiene [id] o parámetros)
  const isDynamic = segments.some(seg => 
    seg.startsWith('[') || 
    /^\d+$/.test(seg) || 
    /^[a-f0-9-]{36}$/.test(seg) // UUID
  );
  
  // Detectar si es modal
  const isModal = MODAL_PATTERNS.some(pattern => pattern.test(path));
  
  // Detectar categoría
  const category = detectCategory(cleanPath);
  
  return {
    path: cleanPath,
    depth,
    category,
    segments,
    isDynamic,
    isModal,
  };
}

/**
 * Detecta la categoría de una ruta
 */
function detectCategory(path: string): RouteCategory {
  // Buscar coincidencia exacta
  for (const [pattern, category] of Object.entries(ROUTE_CATEGORIES)) {
    if (path.startsWith(pattern)) {
      return category;
    }
  }
  
  // Buscar por primer segmento
  const firstSegment = path.split('/')[1];
  if (firstSegment) {
    const categoryKey = `/${firstSegment}`;
    if (ROUTE_CATEGORIES[categoryKey]) {
      return ROUTE_CATEGORIES[categoryKey];
    }
  }
  
  return 'other';
}

/**
 * Detecta la dirección de navegación comparando dos rutas
 */
export function detectDirection(
  fromPath: string,
  toPath: string
): NavigationDirection {
  const from = analyzeRoute(fromPath);
  const to = analyzeRoute(toPath);
  
  // Modal siempre es modal
  if (to.isModal) {
    return 'modal';
  }
  
  // Misma ruta = none
  if (from.path === to.path) {
    return 'none';
  }
  
  // Comparar profundidad
  if (to.depth > from.depth) {
    return 'forward';
  }
  
  if (to.depth < from.depth) {
    return 'backward';
  }
  
  // Misma profundidad
  // Si comparten el mismo padre, es lateral
  const fromParent = from.segments.slice(0, -1).join('/');
  const toParent = to.segments.slice(0, -1).join('/');
  
  if (fromParent === toParent) {
    return 'lateral';
  }
  
  // Si son de la misma categoría, es lateral
  if (from.category === to.category) {
    return 'lateral';
  }
  
  // Por defecto, forward
  return 'forward';
}

/**
 * Recomienda una transición basada en el análisis de rutas
 */
export function recommendTransition(
  fromPath: string,
  toPath: string
): TransitionRecommendation {
  const direction = detectDirection(fromPath, toPath);
  const to = analyzeRoute(toPath);
  
  // Transiciones por dirección
  switch (direction) {
    case 'forward':
      return {
        direction,
        speed: 'normal',
        easing: 'enter',
        type: 'page-forward',
      };
      
    case 'backward':
      return {
        direction,
        speed: 'fast',
        easing: 'exit',
        type: 'page-backward',
      };
      
    case 'lateral':
      return {
        direction,
        speed: 'fast',
        easing: 'smooth',
        type: 'page-lateral',
      };
      
    case 'modal':
      // Diferentes tipos de modales
      if (to.path.includes('/edit') || to.path.includes('/create')) {
        return {
          direction,
          speed: 'normal',
          easing: 'enter',
          type: 'modal-slide-up',
        };
      }
      
      return {
        direction,
        speed: 'fast',
        easing: 'bounce',
        type: 'modal-scale',
      };
      
    case 'none':
    default:
      return {
        direction: 'none',
        speed: 'instant',
        easing: 'smooth',
        type: 'modal-fade',
      };
  }
}

/**
 * Recomienda velocidad basada en categoría de ruta
 */
export function recommendSpeed(category: RouteCategory): TransitionSpeed {
  switch (category) {
    case 'dashboard':
      return 'normal';
    case 'profile':
      return 'normal';
    case 'tools':
      return 'fast';
    case 'consumables':
      return 'fast';
    case 'admin':
      return 'slow';
    case 'auth':
      return 'dramatic';
    default:
      return 'normal';
  }
}

/**
 * Recomienda easing basado en categoría de ruta
 */
export function recommendEasing(category: RouteCategory): TransitionEasing {
  switch (category) {
    case 'dashboard':
      return 'smooth';
    case 'profile':
      return 'enter';
    case 'tools':
      return 'sharp';
    case 'consumables':
      return 'sharp';
    case 'admin':
      return 'smooth';
    case 'auth':
      return 'bounce';
    default:
      return 'smooth';
  }
}

/**
 * Determina si dos rutas comparten elementos visuales
 */
export function hasSharedElements(fromPath: string, toPath: string): boolean {
  const from = analyzeRoute(fromPath);
  const to = analyzeRoute(toPath);
  
  // Misma categoría probablemente comparte elementos
  if (from.category === to.category) {
    return true;
  }
  
  // Lista → Detalle probablemente comparte elementos
  if (from.depth < to.depth && to.isDynamic) {
    return true;
  }
  
  return false;
}

/**
 * Obtiene el nombre de transición CSS para view-transition-name
 */
export function getTransitionName(direction: NavigationDirection): string {
  switch (direction) {
    case 'forward':
      return 'page-forward';
    case 'backward':
      return 'page-backward';
    case 'lateral':
      return 'page-lateral';
    case 'modal':
      return 'modal-scale';
    default:
      return 'root';
  }
}

/**
 * Determina si se debe usar haptic feedback
 */
export function shouldUseHaptics(direction: NavigationDirection): boolean {
  // Haptics para acciones importantes
  return direction === 'forward' || direction === 'modal';
}
