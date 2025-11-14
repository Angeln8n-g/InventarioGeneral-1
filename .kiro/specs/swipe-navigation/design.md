# Design Document - Swipe Navigation

## Overview

Este diseño implementa un sistema de navegación táctil tipo carrusel que permite a los usuarios móviles navegar entre páginas usando gestos de swipe (deslizar) izquierda/derecha. El sistema se integra perfectamente con el framework de view transitions existente, proporcionando feedback visual continuo, animaciones fluidas y respeto por las preferencias de accesibilidad.

### Principios de Diseño

1. **Gestos Naturales**: Swipe debe sentirse como apps nativas (Instagram, TikTok)
2. **Feedback Continuo**: El usuario ve el resultado del gesto en tiempo real
3. **Cancelación Intuitiva**: Soltar antes del threshold cancela la navegación
4. **Performance 60fps**: Usar hardware acceleration y optimizaciones
5. **Integración Transparente**: No interferir con scroll ni otros gestos

### Objetivos Clave

- Navegación fluida entre páginas con swipe left/right
- Preview de página destino durante el gesto
- Feedback háptico en puntos clave del gesto
- Mantener 60fps en dispositivos modernos
- Respeto a prefers-reduced-motion
- Bundle size < 8KB para todo el sistema

## Architecture

### Technology Stack

- **React 18+**: Hooks para gestión de estado
- **Next.js 15**: App Router con navegación programática
- **Framer Motion**: Animaciones de arrastre y spring physics
- **TypeScript**: Type safety completo
- **View Transitions API**: Integración con sistema existente

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    App Layout (Root)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         ViewTransitionsProvider                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │      SwipeNavigationProvider                 │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │     Page Content                       │  │  │  │
│  │  │  │  ┌─────────────────────────────────┐  │  │  │  │
│  │  │  │  │  SwipeContainer (wrapper)        │  │  │  │  │
│  │  │  │  │  - Detecta gestos touch          │  │  │  │  │
│  │  │  │  │  - Muestra preview de páginas    │  │  │  │  │
│  │  │  │  │  - Coordina transiciones         │  │  │  │  │
│  │  │  │  └─────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### 1. SwipeNavigationProvider

**Ubicación**: `src/contexts/SwipeNavigationContext.tsx`

**Propósito**: Proveedor de contexto que gestiona el estado global de swipe navigation, configuración y stack de navegación.

```typescript
interface SwipeNavigationConfig {
  enabled: boolean
  swipeThreshold: number        // Distancia mínima para trigger (px)
  velocityThreshold: number     // Velocidad mínima para quick swipe (px/ms)
  resistanceRatio: number       // Resistencia al arrastrar (0-1)
  snapBackDuration: number      // Duración de animación de retorno (ms)
  previewOpacity: number        // Opacidad de preview de página (0-1)
  enableHaptics: boolean
  enablePreview: boolean
  allowedRoutes: string[]       // Rutas donde swipe está habilitado
}

interface NavigationStackItem {
  path: string
  title: string
  category: string
  canSwipeLeft: boolean
  canSwipeRight: boolean
}

interface SwipeNavigationContextValue {
  config: SwipeNavigationConfig
  navigationStack: NavigationStackItem[]
  currentIndex: number
  isSwipeEnabled: boolean
  updateConfig: (config: Partial<SwipeNavigationConfig>) => void
  canNavigateLeft: () => boolean
  canNavigateRight: () => boolean
  getNextRoute: (direction: 'left' | 'right') => string | null
}
```

### 2. useSwipeNavigation Hook

**Ubicación**: `src/hooks/useSwipeNavigation.ts`

**Propósito**: Hook principal para implementar swipe navigation en páginas.

```typescript
interface UseSwipeNavigationOptions {
  enabled?: boolean
  onSwipeStart?: () => void
  onSwipeEnd?: (direction: 'left' | 'right' | null) => void
  onNavigate?: (toPath: string) => void
}

interface UseSwipeNavigationReturn {
  // Refs para el contenedor
  containerRef: React.RefObject<HTMLDivElement>
  
  // Estado del swipe
  isSwi ping: boolean
  swipeProgress: number        // 0-1, progreso del swipe
  swipeDirection: 'left' | 'right' | null
  
  // Información de navegación
  canSwipeLeft: boolean
  canSwipeRight: boolean
  nextRouteLeft: string | null
  nextRouteRight: string | null
  
  // Control manual
  triggerSwipe: (direction: 'left' | 'right') => Promise<void>
}
```


### 3. SwipeContainer Component

**Ubicación**: `src/components/ui/SwipeContainer.tsx`

**Propósito**: Componente wrapper que detecta gestos y renderiza previews de páginas.

```typescript
interface SwipeContainerProps {
  children: React.ReactNode
  enabled?: boolean
  className?: string
  onSwipeComplete?: (direction: 'left' | 'right') => void
}

// Uso
<SwipeContainer enabled={true}>
  <YourPageContent />
</SwipeContainer>
```

**Características**:
- Detecta touch events (touchstart, touchmove, touchend)
- Calcula velocidad y distancia del swipe
- Renderiza preview de página destino
- Aplica resistencia al arrastrar
- Anima snap-back si se cancela
- Integra con view transitions para navegación

### 4. NavigationStackManager

**Ubicación**: `src/utils/navigation-stack-manager.ts`

**Propósito**: Gestiona el stack de navegación y determina rutas válidas para swipe.

```typescript
interface RouteDefinition {
  path: string
  title: string
  category: 'dashboard' | 'tools' | 'consumables' | 'profile' | 'admin'
  order: number
  swipeEnabled: boolean
}

class NavigationStackManager {
  private routes: RouteDefinition[] = []
  
  // Registrar rutas
  registerRoute(route: RouteDefinition): void
  
  // Obtener stack para una categoría
  getStackForCategory(category: string): RouteDefinition[]
  
  // Obtener ruta siguiente/anterior
  getNextRoute(currentPath: string, direction: 'left' | 'right'): string | null
  
  // Verificar si swipe está habilitado
  isSwipeEnabled(path: string): boolean
  
  // Obtener índice en el stack
  getRouteIndex(path: string): number
}
```

**Stack de Navegación Predefinido**:

```typescript
const DEFAULT_NAVIGATION_STACKS = {
  dashboard: [
    { path: '/dashboard', title: 'Dashboard', order: 0 },
    { path: '/my-loans', title: 'My Loans', order: 1 },
    { path: '/consumables', title: 'Consumables', order: 2 },
    { path: '/profile', title: 'Profile', order: 3 },
  ],
  tools: [
    { path: '/tools/scan', title: 'Loan Tools', order: 0 },
    { path: '/tools/return', title: 'Return Tools', order: 1 },
  ],
  consumables: [
    { path: '/consumables', title: 'Request Supplies', order: 0 },
    { path: '/consumables/scan', title: 'Consume Supplies', order: 1 },
    { path: '/consumables/return', title: 'Return Supplies', order: 2 },
  ],
  admin: [
    { path: '/admin/dashboard', title: 'Admin Dashboard', order: 0 },
    { path: '/admin/users', title: 'Users', order: 1 },
    { path: '/admin/tools', title: 'Tools', order: 2 },
    { path: '/admin/consumables', title: 'Consumables', order: 3 },
  ],
}
```


### 5. SwipeGestureDetector

**Ubicación**: `src/utils/swipe-gesture-detector.ts`

**Propósito**: Detecta y procesa gestos de swipe con cálculos de física.

```typescript
interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

interface SwipeGesture {
  startPoint: TouchPoint
  currentPoint: TouchPoint
  distance: number
  velocity: number
  direction: 'left' | 'right' | 'vertical' | null
  isValid: boolean
}

class SwipeGestureDetector {
  private startPoint: TouchPoint | null = null
  private currentPoint: TouchPoint | null = null
  private isTracking = false
  
  // Iniciar tracking
  onTouchStart(e: TouchEvent): void
  
  // Actualizar posición
  onTouchMove(e: TouchEvent): SwipeGesture | null
  
  // Finalizar y determinar si es válido
  onTouchEnd(e: TouchEvent): SwipeGesture | null
  
  // Calcular velocidad
  private calculateVelocity(): number
  
  // Determinar dirección
  private determineDirection(): 'left' | 'right' | 'vertical' | null
  
  // Verificar si es swipe horizontal válido
  private isHorizontalSwipe(): boolean
}
```

**Lógica de Detección**:

```typescript
// Determinar si es swipe horizontal
function isHorizontalSwipe(deltaX: number, deltaY: number): boolean {
  const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI)
  // Ángulo < 30° = horizontal
  return angle < 30 || angle > 150
}

// Calcular velocidad
function calculateVelocity(distance: number, time: number): number {
  return Math.abs(distance / time) // px/ms
}

// Determinar si debe navegar
function shouldNavigate(
  distance: number,
  velocity: number,
  threshold: number,
  velocityThreshold: number
): boolean {
  // Navegar si:
  // 1. Distancia > threshold, O
  // 2. Velocidad > velocityThreshold (quick swipe)
  return distance > threshold || velocity > velocityThreshold
}
```


### 6. PagePreviewRenderer

**Ubicación**: `src/components/ui/PagePreviewRenderer.tsx`

**Propósito**: Renderiza preview de la página destino durante el swipe.

```typescript
interface PagePreviewProps {
  path: string
  direction: 'left' | 'right'
  progress: number        // 0-1
  opacity: number
  className?: string
}

// Estrategias de preview
type PreviewStrategy = 'snapshot' | 'placeholder' | 'live'

interface PreviewConfig {
  strategy: PreviewStrategy
  cacheTimeout: number
  maxCacheSize: number
}
```

**Estrategias de Preview**:

1. **Snapshot** (Preferido): Captura screenshot de la página destino
2. **Placeholder**: Muestra placeholder con título y categoría
3. **Live**: Renderiza la página real (más costoso)

```typescript
// Snapshot Strategy
async function capturePageSnapshot(path: string): Promise<string> {
  // Usar html2canvas o similar para capturar
  // Cachear resultado
  return snapshotDataURL
}

// Placeholder Strategy
function renderPlaceholder(route: RouteDefinition): React.ReactNode {
  return (
    <div className="preview-placeholder">
      <h2>{route.title}</h2>
      <p>{route.category}</p>
    </div>
  )
}
```

### 7. SwipePhysics Utility

**Ubicación**: `src/utils/swipe-physics.ts`

**Propósito**: Cálculos de física para animaciones naturales.

```typescript
interface PhysicsConfig {
  mass: number
  tension: number
  friction: number
  velocity: number
}

class SwipePhysics {
  // Calcular resistencia al arrastrar
  static calculateResistance(
    distance: number,
    maxDistance: number,
    ratio: number
  ): number {
    // Resistencia exponencial
    return distance * (1 - Math.pow(distance / maxDistance, ratio))
  }
  
  // Calcular snap-back animation
  static calculateSnapBack(
    currentPosition: number,
    targetPosition: number,
    velocity: number
  ): { duration: number; easing: string } {
    const distance = Math.abs(currentPosition - targetPosition)
    const baseDuration = 300
    
    // Duración basada en distancia y velocidad
    const duration = Math.min(
      baseDuration,
      distance / Math.max(velocity, 0.5)
    )
    
    return {
      duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
  
  // Calcular overshoot (rebote sutil)
  static calculateOvershoot(velocity: number): number {
    // Overshoot proporcional a velocidad
    return Math.min(velocity * 0.1, 20) // Max 20px
  }
}
```


## Data Models

### SwipeState

```typescript
interface SwipeState {
  isActive: boolean
  startX: number
  currentX: number
  deltaX: number
  velocity: number
  direction: 'left' | 'right' | null
  progress: number        // 0-1
  willNavigate: boolean   // true si pasa threshold
  timestamp: number
}
```

### NavigationHistory

```typescript
interface NavigationHistory {
  stack: string[]
  currentIndex: number
  maxSize: number
}

class NavigationHistoryManager {
  private history: NavigationHistory
  
  push(path: string): void
  pop(): string | null
  canGoBack(): boolean
  canGoForward(): boolean
  getCurrentPath(): string
  clear(): void
}
```

## CSS Animations

### Swipe Animations

**Archivo**: `src/app/globals.css`

```css
/* ============================================
   SWIPE NAVIGATION ANIMATIONS
   ============================================ */

/* Container de swipe */
.swipe-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: pan-y; /* Permitir scroll vertical */
}

/* Página actual durante swipe */
.swipe-current-page {
  position: relative;
  width: 100%;
  height: 100%;
  will-change: transform;
  backface-visibility: hidden;
}

/* Preview de página destino */
.swipe-preview-page {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  will-change: transform, opacity;
  backface-visibility: hidden;
  pointer-events: none;
}

.swipe-preview-left {
  left: -100%;
}

.swipe-preview-right {
  right: -100%;
}

/* Animación de snap-back */
@keyframes swipe-snap-back {
  from {
    transform: translateX(var(--swipe-offset));
  }
  to {
    transform: translateX(0);
  }
}

/* Animación de navegación completa */
@keyframes swipe-navigate-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

@keyframes swipe-navigate-right {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

/* Bounce effect en bordes */
@keyframes swipe-bounce-left {
  0% { transform: translateX(0); }
  50% { transform: translateX(20px); }
  100% { transform: translateX(0); }
}

@keyframes swipe-bounce-right {
  0% { transform: translateX(0); }
  50% { transform: translateX(-20px); }
  100% { transform: translateX(0); }
}

/* Indicador visual de threshold */
.swipe-threshold-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60px;
  background: var(--claro-red);
  opacity: 0;
  transition: opacity 0.2s;
}

.swipe-threshold-indicator.left {
  left: 20%;
}

.swipe-threshold-indicator.right {
  right: 20%;
}

.swipe-threshold-indicator.active {
  opacity: 0.6;
}

/* Accessibility - Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .swipe-container,
  .swipe-current-page,
  .swipe-preview-page {
    animation: none !important;
    transition: none !important;
  }
}
```


## Integration with Existing Code

### 1. Root Layout Integration

**Archivo**: `src/app/layout.tsx`

```typescript
import { SwipeNavigationProvider } from '@/contexts/SwipeNavigationContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ViewTransitionsProvider>
          <SwipeNavigationProvider>
            <ThemeProvider>
              <LanguageProvider>
                <Provider store={store}>
                  {children}
                  <Toaster position="top-center" richColors />
                </Provider>
              </LanguageProvider>
            </ThemeProvider>
          </SwipeNavigationProvider>
        </ViewTransitionsProvider>
      </body>
    </html>
  )
}
```

### 2. Page Implementation Example

**Archivo**: `src/app/dashboard/page.tsx`

```typescript
import { SwipeContainer } from '@/components/ui/SwipeContainer'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'

export default function DashboardPage() {
  const { canSwipeLeft, canSwipeRight, nextRouteLeft, nextRouteRight } = useSwipeNavigation()
  
  return (
    <SwipeContainer enabled={true}>
      <ProtectedRoute>
        <AppLayout>
          {/* Existing page content */}
          <div className="dashboard-content">
            {/* ... */}
          </div>
          
          {/* Optional: Visual indicators */}
          {canSwipeLeft && (
            <div className="swipe-hint left">
              ← {nextRouteLeft}
            </div>
          )}
          {canSwipeRight && (
            <div className="swipe-hint right">
              {nextRouteRight} →
            </div>
          )}
        </AppLayout>
      </ProtectedRoute>
    </SwipeContainer>
  )
}
```

### 3. Integration with View Transitions

```typescript
// En useSwipeNavigation hook
const { startTransition } = useViewTransition({
  direction: swipeDirection === 'left' ? 'forward' : 'backward',
  speed: 'fast',
  enableHaptics: true,
})

async function completeSwipeNavigation(toPath: string) {
  await startTransition(() => {
    router.push(toPath)
  })
}
```

### 4. Haptic Feedback Integration

```typescript
import { hapticLight, hapticMedium } from '@/utils/haptic-feedback'

// Durante el swipe
function onSwipeProgress(progress: number) {
  if (progress > 0.5 && !hasTriggeredHaptic) {
    hapticLight() // Feedback al pasar threshold
    setHasTriggeredHaptic(true)
  }
}

// Al completar navegación
function onSwipeComplete() {
  hapticMedium() // Feedback de confirmación
}
```


## Performance Optimization

### 1. Hardware Acceleration

```typescript
// Aplicar transforms con GPU acceleration
function applyHardwareAcceleration(element: HTMLElement) {
  element.style.transform = 'translateZ(0)'
  element.style.willChange = 'transform'
  element.style.backfaceVisibility = 'hidden'
}

// Limpiar después de animación
function cleanupHardwareAcceleration(element: HTMLElement) {
  element.style.willChange = 'auto'
}
```

### 2. Touch Event Optimization

```typescript
// Usar passive listeners para mejor scroll performance
element.addEventListener('touchstart', handler, { passive: true })
element.addEventListener('touchmove', handler, { passive: false }) // Necesita preventDefault
element.addEventListener('touchend', handler, { passive: true })

// Throttle touchmove events
const throttledTouchMove = throttle((e: TouchEvent) => {
  handleTouchMove(e)
}, 16) // ~60fps
```

### 3. Preview Caching

```typescript
class PreviewCache {
  private cache = new Map<string, string>()
  private maxSize = 10
  private accessOrder: string[] = []
  
  set(path: string, snapshot: string): void {
    // LRU cache implementation
    if (this.cache.size >= this.maxSize) {
      const oldest = this.accessOrder.shift()
      if (oldest) this.cache.delete(oldest)
    }
    
    this.cache.set(path, snapshot)
    this.accessOrder.push(path)
  }
  
  get(path: string): string | null {
    const snapshot = this.cache.get(path)
    
    if (snapshot) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(p => p !== path)
      this.accessOrder.push(path)
    }
    
    return snapshot || null
  }
  
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }
}
```

### 4. Adaptive Configuration

```typescript
function getAdaptiveSwipeConfig(capabilities: DeviceCapabilities): Partial<SwipeNavigationConfig> {
  const config: Partial<SwipeNavigationConfig> = {}
  
  // Dispositivos de gama baja
  if (capabilities.tier === 'low') {
    config.enablePreview = false  // Sin preview para mejor performance
    config.snapBackDuration = 200 // Animaciones más rápidas
  }
  
  // Conexión lenta
  if (capabilities.connectionSpeed === 'slow') {
    config.enablePreview = false
  }
  
  // Batería baja
  if (capabilities.batteryLevel && capabilities.batteryLevel < 0.2) {
    config.enableHaptics = false
    config.enablePreview = false
  }
  
  return config
}
```

### 5. Debounce Navigation

```typescript
// Prevenir navegaciones rápidas consecutivas
class NavigationDebouncer {
  private lastNavigation = 0
  private minInterval = 500 // ms
  
  canNavigate(): boolean {
    const now = Date.now()
    if (now - this.lastNavigation < this.minInterval) {
      return false
    }
    this.lastNavigation = now
    return true
  }
}
```


## Error Handling & Edge Cases

### 1. Scroll Conflict Prevention

```typescript
function preventScrollConflict(e: TouchEvent, swipeState: SwipeState) {
  const deltaX = Math.abs(swipeState.deltaX)
  const deltaY = Math.abs(e.touches[0].clientY - swipeState.startY)
  
  // Si es swipe horizontal, prevenir scroll
  if (deltaX > deltaY && deltaX > 10) {
    e.preventDefault()
  }
}
```

### 2. Modal/Overlay Detection

```typescript
function isModalOpen(): boolean {
  // Detectar si hay modales abiertos
  return document.querySelector('[role="dialog"]') !== null ||
         document.querySelector('.modal-open') !== null
}

// Deshabilitar swipe si hay modal
if (isModalOpen()) {
  return // No procesar swipe
}
```

### 3. Boundary Handling

```typescript
function handleBoundary(direction: 'left' | 'right', canNavigate: boolean) {
  if (!canNavigate) {
    // Bounce effect
    const bounceDistance = 20
    const element = containerRef.current
    
    if (element) {
      element.style.transform = `translateX(${direction === 'left' ? bounceDistance : -bounceDistance}px)`
      
      setTimeout(() => {
        element.style.transform = 'translateX(0)'
      }, 150)
    }
    
    // Haptic feedback de error
    hapticError()
  }
}
```

### 4. Navigation Failure Recovery

```typescript
async function safeNavigate(toPath: string) {
  try {
    await router.push(toPath)
  } catch (error) {
    console.error('Navigation failed:', error)
    
    // Snap back to original position
    snapBackToOriginal()
    
    // Show error toast
    toast.error('Navigation failed. Please try again.')
  }
}
```

### 5. Memory Leak Prevention

```typescript
useEffect(() => {
  const container = containerRef.current
  if (!container) return
  
  // Setup event listeners
  container.addEventListener('touchstart', handleTouchStart, { passive: true })
  container.addEventListener('touchmove', handleTouchMove, { passive: false })
  container.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  // Cleanup
  return () => {
    container.removeEventListener('touchstart', handleTouchStart)
    container.removeEventListener('touchmove', handleTouchMove)
    container.removeEventListener('touchend', handleTouchEnd)
    
    // Clear any pending animations
    cancelAnimationFrame(animationFrameRef.current)
    
    // Clear cache
    previewCache.clear()
  }
}, [])
```

## Testing Strategy

### 1. Unit Tests

```typescript
describe('SwipeGestureDetector', () => {
  test('detecta swipe horizontal', () => {
    const detector = new SwipeGestureDetector()
    
    detector.onTouchStart(createTouchEvent(100, 200))
    const gesture = detector.onTouchMove(createTouchEvent(200, 210))
    
    expect(gesture?.direction).toBe('right')
    expect(gesture?.isValid).toBe(true)
  })
  
  test('ignora swipe vertical', () => {
    const detector = new SwipeGestureDetector()
    
    detector.onTouchStart(createTouchEvent(100, 200))
    const gesture = detector.onTouchMove(createTouchEvent(110, 300))
    
    expect(gesture?.direction).toBe('vertical')
    expect(gesture?.isValid).toBe(false)
  })
  
  test('calcula velocidad correctamente', () => {
    const detector = new SwipeGestureDetector()
    
    detector.onTouchStart(createTouchEvent(100, 200))
    // Simular swipe rápido
    const gesture = detector.onTouchEnd(createTouchEvent(300, 200, 100))
    
    expect(gesture?.velocity).toBeGreaterThan(1) // px/ms
  })
})
```

### 2. Integration Tests

```typescript
describe('useSwipeNavigation', () => {
  test('navega a página siguiente con swipe left', async () => {
    const { result } = renderHook(() => useSwipeNavigation())
    
    expect(result.current.canSwipeLeft).toBe(true)
    
    await act(async () => {
      await result.current.triggerSwipe('left')
    })
    
    // Verificar navegación
    expect(mockRouter.push).toHaveBeenCalledWith('/next-page')
  })
  
  test('no navega si está en primera página', async () => {
    const { result } = renderHook(() => useSwipeNavigation())
    
    expect(result.current.canSwipeRight).toBe(false)
    
    await act(async () => {
      await result.current.triggerSwipe('right')
    })
    
    expect(mockRouter.push).not.toHaveBeenCalled()
  })
})
```

### 3. E2E Tests

```typescript
describe('Swipe Navigation E2E', () => {
  test('usuario puede navegar con swipe', async () => {
    await page.goto('/dashboard')
    
    // Simular swipe left
    await page.touchscreen.tap(200, 300)
    await page.touchscreen.move(100, 300)
    await page.touchscreen.release()
    
    // Verificar navegación
    await expect(page).toHaveURL('/my-loans')
  })
  
  test('muestra preview durante swipe', async () => {
    await page.goto('/dashboard')
    
    // Iniciar swipe
    await page.touchscreen.tap(200, 300)
    await page.touchscreen.move(150, 300)
    
    // Verificar preview visible
    const preview = await page.$('.swipe-preview-page')
    expect(preview).toBeTruthy()
  })
})
```

## Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Touch Events | ✅ | ✅ | ✅ | ✅ |
| Framer Motion | ✅ | ✅ | ✅ | ✅ |
| Hardware Acceleration | ✅ | ✅ | ✅ | ✅ |
| Haptic Feedback | ✅ Android | ✅ iOS | ❌ | ✅ |

### Fallback Strategy

```typescript
function getSwipeImplementation(): 'native' | 'polyfill' | 'disabled' {
  // Verificar soporte de touch
  if (!('ontouchstart' in window)) {
    return 'disabled'
  }
  
  // Verificar performance
  if (detectDeviceTier() === 'low') {
    return 'polyfill' // Implementación simplificada
  }
  
  return 'native'
}
```

## Migration Guide

### Enabling Swipe on Existing Pages

```typescript
// Antes
export default function MyPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    </ProtectedRoute>
  )
}

// Después
import { SwipeContainer } from '@/components/ui/SwipeContainer'

export default function MyPage() {
  return (
    <SwipeContainer enabled={true}>
      <ProtectedRoute>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </ProtectedRoute>
    </SwipeContainer>
  )
}
```

### Configuration

```typescript
// En SwipeNavigationProvider
<SwipeNavigationProvider
  initialConfig={{
    swipeThreshold: 100,        // Ajustar sensibilidad
    velocityThreshold: 0.5,     // Ajustar quick swipe
    enablePreview: true,        // Habilitar/deshabilitar preview
    allowedRoutes: [            // Rutas específicas
      '/dashboard',
      '/my-loans',
      '/consumables',
    ]
  }}
>
  {children}
</SwipeNavigationProvider>
```

## Performance Metrics

### Target Metrics

- **Frame Rate**: 60fps durante swipe
- **Touch Response**: < 16ms (1 frame)
- **Navigation Time**: < 300ms total
- **Bundle Size**: < 8KB gzipped
- **Memory Usage**: < 5MB adicional

### Monitoring

```typescript
// Integración con PerformanceMonitor existente
function recordSwipeMetrics(swipeState: SwipeState) {
  recordMetric({
    type: 'swipe-navigation',
    duration: swipeState.duration,
    fps: swipeState.averageFPS,
    direction: swipeState.direction,
    success: swipeState.completed,
  })
}
```

## Security Considerations

1. **Input Validation**: Validar todas las rutas antes de navegar
2. **Rate Limiting**: Limitar navegaciones rápidas consecutivas
3. **Route Protection**: Respetar rutas protegidas y permisos
4. **XSS Prevention**: Sanitizar cualquier contenido de preview

```typescript
function validateRoute(path: string): boolean {
  // Verificar que la ruta es válida
  const validRoutes = navigationStack.map(r => r.path)
  return validRoutes.includes(path)
}

function canAccessRoute(path: string, user: User): boolean {
  // Verificar permisos
  const route = routes.find(r => r.path === path)
  return route?.requiredRole ? user.role === route.requiredRole : true
}
```
