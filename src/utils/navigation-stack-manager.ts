/**
 * NavigationStackManager
 * Manages navigation stacks and determines valid routes for swipe navigation
 */

// ============================================
// TYPES
// ============================================

export type RouteCategory = 'dashboard' | 'tools' | 'consumables' | 'profile' | 'admin' | 'other';

export interface RouteDefinition {
  path: string;
  title: string;
  category: RouteCategory;
  order: number;
  swipeEnabled: boolean;
}

// ============================================
// DEFAULT NAVIGATION STACKS
// ============================================

const DEFAULT_NAVIGATION_STACKS: Record<RouteCategory, RouteDefinition[]> = {
  dashboard: [
    { path: '/dashboard', title: 'Dashboard', category: 'dashboard', order: 0, swipeEnabled: true },
    { path: '/my-loans', title: 'My Loans', category: 'dashboard', order: 1, swipeEnabled: true },
    { path: '/consumables', title: 'Consumables', category: 'dashboard', order: 2, swipeEnabled: true },
    { path: '/profile', title: 'Profile', category: 'dashboard', order: 3, swipeEnabled: true },
  ],
  tools: [
    { path: '/tools/scan', title: 'Loan Tools', category: 'tools', order: 0, swipeEnabled: true },
    { path: '/tools/return', title: 'Return Tools', category: 'tools', order: 1, swipeEnabled: true },
  ],
  consumables: [
    { path: '/consumables', title: 'Request Supplies', category: 'consumables', order: 0, swipeEnabled: true },
    { path: '/consumables/scan', title: 'Consume Supplies', category: 'consumables', order: 1, swipeEnabled: true },
    { path: '/consumables/return', title: 'Return Supplies', category: 'consumables', order: 2, swipeEnabled: true },
  ],
  admin: [
    { path: '/admin/dashboard', title: 'Admin Dashboard', category: 'admin', order: 0, swipeEnabled: true },
    { path: '/admin/users', title: 'Users', category: 'admin', order: 1, swipeEnabled: true },
    { path: '/admin/tools', title: 'Tools', category: 'admin', order: 2, swipeEnabled: true },
    { path: '/admin/consumables', title: 'Consumables', category: 'admin', order: 3, swipeEnabled: true },
  ],
  profile: [],
  other: [],
};

// ============================================
// NAVIGATION STACK MANAGER CLASS
// ============================================

export class NavigationStackManager {
  private routes: Map<string, RouteDefinition> = new Map();
  private stacks: Map<RouteCategory, RouteDefinition[]> = new Map();

  constructor() {
    this.initializeDefaultStacks();
  }


  /**
   * Inicializar stacks por defecto
   */
  private initializeDefaultStacks(): void {
    Object.entries(DEFAULT_NAVIGATION_STACKS).forEach(([category, routes]) => {
      this.stacks.set(category as RouteCategory, routes);
      routes.forEach(route => {
        this.routes.set(route.path, route);
      });
    });
  }

  /**
   * Registrar una ruta personalizada
   */
  registerRoute(route: RouteDefinition): void {
    this.routes.set(route.path, route);

    // Agregar al stack de su categoría
    const stack = this.stacks.get(route.category) || [];
    const existingIndex = stack.findIndex(r => r.path === route.path);

    if (existingIndex >= 0) {
      // Actualizar ruta existente
      stack[existingIndex] = route;
    } else {
      // Agregar nueva ruta y ordenar
      stack.push(route);
      stack.sort((a, b) => a.order - b.order);
    }

    this.stacks.set(route.category, stack);
  }

  /**
   * Obtener stack para una categoría
   */
  getStackForCategory(category: RouteCategory): RouteDefinition[] {
    return this.stacks.get(category) || [];
  }

  /**
   * Obtener categoría de una ruta
   */
  getCategoryForPath(path: string): RouteCategory | null {
    const route = this.routes.get(path);
    return route?.category || null;
  }

  /**
   * Obtener ruta siguiente o anterior
   */
  getNextRoute(currentPath: string, direction: 'left' | 'right'): string | null {
    const route = this.routes.get(currentPath);
    if (!route) return null;

    const stack = this.getStackForCategory(route.category);
    const currentIndex = stack.findIndex(r => r.path === currentPath);

    if (currentIndex === -1) return null;

    // Left = siguiente (forward), Right = anterior (backward)
    const targetIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;

    // Verificar bounds
    if (targetIndex < 0 || targetIndex >= stack.length) {
      return null;
    }

    const targetRoute = stack[targetIndex];
    return targetRoute.swipeEnabled ? targetRoute.path : null;
  }

  /**
   * Verificar si swipe está habilitado para una ruta
   */
  isSwipeEnabled(path: string): boolean {
    const route = this.routes.get(path);
    return route?.swipeEnabled ?? false;
  }

  /**
   * Obtener índice de una ruta en su stack
   */
  getRouteIndex(path: string): number {
    const route = this.routes.get(path);
    if (!route) return -1;

    const stack = this.getStackForCategory(route.category);
    return stack.findIndex(r => r.path === path);
  }

  /**
   * Verificar si puede navegar en una dirección
   */
  canNavigate(currentPath: string, direction: 'left' | 'right'): boolean {
    return this.getNextRoute(currentPath, direction) !== null;
  }

  /**
   * Obtener información de una ruta
   */
  getRoute(path: string): RouteDefinition | null {
    return this.routes.get(path) || null;
  }

  /**
   * Obtener todas las rutas
   */
  getAllRoutes(): RouteDefinition[] {
    return Array.from(this.routes.values());
  }

  /**
   * Limpiar todas las rutas personalizadas
   */
  reset(): void {
    this.routes.clear();
    this.stacks.clear();
    this.initializeDefaultStacks();
  }

  /**
   * Habilitar/deshabilitar swipe para una ruta
   */
  setSwipeEnabled(path: string, enabled: boolean): void {
    const route = this.routes.get(path);
    if (route) {
      route.swipeEnabled = enabled;
      this.routes.set(path, route);

      // Actualizar en el stack
      const stack = this.getStackForCategory(route.category);
      const index = stack.findIndex(r => r.path === path);
      if (index >= 0) {
        stack[index].swipeEnabled = enabled;
      }
    }
  }

  /**
   * Obtener título de la ruta siguiente
   */
  getNextRouteTitle(currentPath: string, direction: 'left' | 'right'): string | null {
    const nextPath = this.getNextRoute(currentPath, direction);
    if (!nextPath) return null;

    const route = this.routes.get(nextPath);
    return route?.title || null;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let instance: NavigationStackManager | null = null;

/**
 * Obtener instancia singleton del NavigationStackManager
 */
export function getNavigationStackManager(): NavigationStackManager {
  if (!instance) {
    instance = new NavigationStackManager();
  }
  return instance;
}

/**
 * Resetear instancia singleton (útil para testing)
 */
export function resetNavigationStackManager(): void {
  instance = null;
}
