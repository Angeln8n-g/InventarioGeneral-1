# Design Document - View Transitions (Enhanced UI/UX)

## Overview

Este diseño implementa un sistema avanzado de transiciones visuales que va más allá de simples animaciones, creando una experiencia de usuario fluida, contextual e inteligente. Utilizamos la View Transitions API nativa del navegador con fallbacks sofisticados, aplicando principios de diseño de animación profesional y optimizaciones de rendimiento.

### Principios de Diseño

1. **Transiciones Contextuales**: Cada transición comunica la relación entre estados
2. **Performance First**: Nunca sacrificar rendimiento por estética
3. **Accesibilidad Universal**: Respetar preferencias del usuario
4. **Feedback Continuo**: El usuario siempre sabe qué está pasando
5. **Consistencia Inteligente**: Patrones predecibles pero no monótonos

### Objetivos Clave

- Reducir la carga cognitiva mediante transiciones significativas
- Mejorar la percepción de velocidad de la aplicación
- Crear una experiencia premium y pulida
- Mantener 60fps en dispositivos modernos, 30fps mínimo en móviles
- Bundle size < 15KB para todo el sistema de transiciones

## Architecture

### Technology Stack

- **View Transitions API**: API nativa para transiciones (con detección de soporte)
- **React 18+**: Hooks y concurrent features
- **Next.js 15**: App Router con navegación programática
- **Framer Motion**: Fallback para navegadores sin soporte
- **TypeScript**: Type safety completo
- **Tailwind CSS**: Clases de utilidad para animaciones CSS


## Components and Interfaces

### 1. ViewTransitionsProvider (Enhanced)

**Ubicación**: `src/contexts/ViewTransitionsContext.tsx`

**Propósito**: Proveedor de contexto que gestiona configuración global, detecta capacidades del navegador y coordina transiciones.

```typescript
interface ViewTransitionsConfig {
  enabled: boolean
  speeds: {
    instant: number    // 100ms - Tooltips, dropdowns
    fast: number       // 200ms - Feedback inmediato
    normal: number     // 300ms - Navegación estándar
    slow: number       // 400ms - Cambios de contexto
    dramatic: number   // 600ms - Onboarding, celebraciones
  }
  easings: {
    enter: string      // Entrada natural
    exit: string       // Salida natural
    bounce: string     // Rebote sutil
    smooth: string     // Suave y elegante
    sharp: string      // Rápido al inicio
  }
  respectReducedMotion: boolean
  enableHaptics: boolean
  enableSharedElements: boolean
  performanceBudget: {
    maxConcurrentTransitions: number
    maxDuration: number
    minFrameRate: number
  }
}

interface DeviceCapabilities {
  supportsViewTransitions: boolean
  prefersReducedMotion: boolean
  isLowEndDevice: boolean
  isMobile: boolean
  connectionSpeed: 'slow' | 'medium' | 'fast'
  batteryLevel?: number
  hardwareConcurrency: number
}

interface ViewTransitionsContextValue {
  config: ViewTransitionsConfig
  capabilities: DeviceCapabilities
  updateConfig: (config: Partial<ViewTransitionsConfig>) => void
  isTransitioning: boolean
  activeTransitions: Set<string>
}
```

### 2. useViewTransition Hook (Enhanced)

**Ubicación**: `src/hooks/useViewTransition.ts`

**Propósito**: Hook avanzado para ejecutar transiciones contextuales con optimizaciones inteligentes.

```typescript
interface UseViewTransitionOptions {
  speed?: 'instant' | 'fast' | 'normal' | 'slow' | 'dramatic'
  direction?: 'forward' | 'backward' | 'lateral' | 'modal'
  easing?: 'enter' | 'exit' | 'bounce' | 'smooth' | 'sharp'
  skipTransition?: boolean
  enableHaptics?: boolean
  sharedElements?: string[]
  onStart?: () => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface UseViewTransitionReturn {
  startTransition: (callback: () => void | Promise<void>) => Promise<void>
  isTransitioning: boolean
  progress: number
  cancel: () => void
}

function useViewTransition(options?: UseViewTransitionOptions): UseViewTransitionReturn
```

**Características Avanzadas**:
- Detección automática de dirección de navegación
- Optimización según capacidades del dispositivo
- Feedback háptico opcional
- Soporte para shared elements
- Progress tracking
- Cancelación de transiciones

### 3. TransitionLink Component (Enhanced)

**Ubicación**: `src/components/ui/TransitionLink.tsx`

**Propósito**: Link inteligente que determina el tipo de transición según el contexto.

```typescript
interface TransitionLinkProps extends Omit<LinkProps, 'onClick'> {
  children: React.ReactNode
  speed?: 'instant' | 'fast' | 'normal' | 'slow' | 'dramatic'
  direction?: 'auto' | 'forward' | 'backward' | 'lateral'
  className?: string
  enableHaptics?: boolean
  sharedElements?: string[]
  onClick?: (e: React.MouseEvent) => void
}
```

**Lógica de Dirección Automática**:
```typescript
function detectDirection(currentPath: string, targetPath: string): Direction {
  // Analiza la profundidad de las rutas
  const currentDepth = currentPath.split('/').length
  const targetDepth = targetPath.split('/').length
  
  if (targetDepth > currentDepth) return 'forward'
  if (targetDepth < currentDepth) return 'backward'
  return 'lateral'
}
```


### 4. TransitionDialog Component (Enhanced)

**Ubicación**: `src/components/ui/TransitionDialog.tsx`

**Propósito**: Modal con transiciones contextuales según origen y tipo de contenido.

```typescript
interface TransitionDialogProps extends DialogProps {
  speed?: 'instant' | 'fast' | 'normal' | 'slow'
  animationType?: 'auto' | 'fade' | 'scale' | 'slide' | 'slideUp' | 'slideDown'
  origin?: { x: number; y: number } // Para scale desde el elemento que lo activó
  enableHaptics?: boolean
  sharedElements?: string[]
}
```

**Tipos de Animación**:
- **auto**: Detecta automáticamente según dispositivo y origen
- **fade**: Simple fade in/out
- **scale**: Scale + fade (desde centro o desde origin)
- **slide**: Slide horizontal (para navegación lateral)
- **slideUp**: Slide desde abajo (móviles, bottom sheets)
- **slideDown**: Slide desde arriba (notificaciones, alerts)

### 5. RouteAnalyzer Utility

**Ubicación**: `src/utils/route-analyzer.ts`

**Propósito**: Analiza rutas para determinar el tipo de transición apropiado.

```typescript
interface RouteInfo {
  path: string
  depth: number
  category: 'dashboard' | 'profile' | 'tools' | 'consumables' | 'admin' | 'other'
  isModal: boolean
}

interface TransitionRecommendation {
  direction: 'forward' | 'backward' | 'lateral' | 'modal'
  speed: 'instant' | 'fast' | 'normal' | 'slow'
  easing: 'enter' | 'exit' | 'smooth'
  sharedElements?: string[]
}

function analyzeRoute(from: string, to: string): RouteInfo
function recommendTransition(from: RouteInfo, to: RouteInfo): TransitionRecommendation
```

### 6. PerformanceOptimizer

**Ubicación**: `src/utils/performance-optimizer.ts`

**Propósito**: Optimiza transiciones según capacidades del dispositivo.

```typescript
interface PerformanceMetrics {
  fps: number
  duration: number
  dropped: number
  timestamp: number
}

interface OptimizationStrategy {
  reduceDuration: boolean
  simplifyAnimation: boolean
  skipTransition: boolean
  reason: string
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = []
  
  recordMetric(metric: PerformanceMetrics): void
  getAveragePerformance(): PerformanceMetrics
  shouldOptimize(): OptimizationStrategy
  adaptTransition(config: TransitionConfig): TransitionConfig
}
```

**Criterios de Optimización**:
- FPS promedio < 30: Reducir duración 30%
- FPS promedio < 20: Simplificar animación
- FPS promedio < 15: Saltar transiciones
- Batería < 20%: Reducir duración 50%
- Conexión lenta: Simplificar animaciones
- Dispositivo de gama baja: Usar transiciones instant/fast

### 7. HapticFeedback Utility

**Ubicación**: `src/utils/haptic-feedback.ts`

**Propósito**: Proporciona feedback táctil coordinado con transiciones visuales.

```typescript
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

interface HapticConfig {
  enabled: boolean
  intensity: number // 0-1
  patterns: Record<HapticPattern, number[]>
}

class HapticFeedback {
  static trigger(pattern: HapticPattern): void
  static isSupported(): boolean
  static configure(config: Partial<HapticConfig>): void
}

// Patrones predefinidos
const HAPTIC_PATTERNS = {
  light: [10],           // Tap suave
  medium: [20],          // Tap medio
  heavy: [30],           // Tap fuerte
  success: [10, 50, 10], // Doble tap
  warning: [20, 100, 20, 100, 20], // Triple tap
  error: [50, 100, 50],  // Vibración de error
}
```

### 8. SharedElementTransition

**Ubicación**: `src/components/ui/SharedElementTransition.tsx`

**Propósito**: Facilita transiciones de elementos compartidos entre vistas.

```typescript
interface SharedElementProps {
  id: string
  children: React.ReactNode
  className?: string
}

function SharedElement({ id, children, className }: SharedElementProps) {
  return (
    <div 
      style={{ viewTransitionName: id }}
      className={className}
    >
      {children}
    </div>
  )
}

// Uso
<SharedElement id="product-image-123">
  <img src="/product.jpg" alt="Product" />
</SharedElement>
```


### 9. TransitionOrchestrator

**Ubicación**: `src/utils/transition-orchestrator.ts`

**Propósito**: Coordina múltiples transiciones y previene conflictos.

```typescript
interface TransitionTask {
  id: string
  type: 'page' | 'modal' | 'element'
  priority: number
  callback: () => Promise<void>
  config: TransitionConfig
}

class TransitionOrchestrator {
  private queue: TransitionTask[] = []
  private active: Set<string> = new Set()
  private maxConcurrent = 3
  
  enqueue(task: TransitionTask): void
  execute(): Promise<void>
  cancel(id: string): void
  clear(): void
  getActiveCount(): number
}
```

### 10. StaggerAnimation Utility

**Ubicación**: `src/utils/stagger-animation.ts`

**Propósito**: Crea animaciones escalonadas para listas y grupos de elementos.

```typescript
interface StaggerConfig {
  delay: number        // Delay entre elementos (ms)
  maxDelay: number     // Delay máximo total
  direction: 'forward' | 'reverse' | 'center'
  easing: string
}

function createStaggerAnimation(
  elements: HTMLElement[],
  config: StaggerConfig
): Animation[]

// Uso
const items = document.querySelectorAll('.list-item')
createStaggerAnimation(Array.from(items), {
  delay: 50,
  maxDelay: 300,
  direction: 'forward',
  easing: 'ease-out'
})
```

## Data Models

### TransitionConfig (Enhanced)

```typescript
interface TransitionConfig {
  duration: number
  easing: string
  delay?: number
  direction?: 'forward' | 'backward' | 'lateral' | 'modal'
  sharedElements?: string[]
  hapticPattern?: HapticPattern
  skipTransition?: boolean
  priority?: number
}
```

### TransitionState

```typescript
interface TransitionState {
  id: string
  isActive: boolean
  progress: number
  startTime: number
  endTime: number | null
  type: 'page' | 'modal' | 'element'
  direction: 'forward' | 'backward' | 'lateral' | 'modal'
  performance: {
    fps: number
    duration: number
    droppedFrames: number
  }
}
```

### DeviceProfile

```typescript
interface DeviceProfile {
  tier: 'high' | 'medium' | 'low'
  capabilities: DeviceCapabilities
  recommendedConfig: Partial<ViewTransitionsConfig>
  optimizations: string[]
}
```

## CSS Transitions (Enhanced)

### Global Styles

**Archivo**: `src/app/globals.css`

```css
/* ============================================
   VIEW TRANSITIONS - ENHANCED SYSTEM
   ============================================ */

/* Base Configuration */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============================================
   PAGE TRANSITIONS - DIRECTIONAL
   ============================================ */

/* Forward Navigation (profundizar) */
::view-transition-old(page-forward) {
  animation: slide-out-left 0.3s cubic-bezier(0.4, 0, 1, 1);
}

::view-transition-new(page-forward) {
  animation: slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Backward Navigation (regresar) */
::view-transition-old(page-backward) {
  animation: slide-out-right 0.3s cubic-bezier(0.4, 0, 1, 1);
}

::view-transition-new(page-backward) {
  animation: slide-in-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Lateral Navigation (mismo nivel) */
::view-transition-old(page-lateral) {
  animation: fade-out 0.2s ease-out;
}

::view-transition-new(page-lateral) {
  animation: fade-in 0.2s ease-in;
}

/* ============================================
   MODAL TRANSITIONS - CONTEXTUAL
   ============================================ */

/* Scale from Center */
::view-transition-old(modal-scale) {
  animation: modal-scale-out 0.25s cubic-bezier(0.4, 0, 1, 1);
}

::view-transition-new(modal-scale) {
  animation: modal-scale-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Slide Up (Mobile Bottom Sheets) */
::view-transition-old(modal-slide-up) {
  animation: slide-down 0.3s cubic-bezier(0.4, 0, 1, 1);
}

::view-transition-new(modal-slide-up) {
  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Slide Down (Notifications) */
::view-transition-old(modal-slide-down) {
  animation: slide-up-exit 0.25s cubic-bezier(0.4, 0, 1, 1);
}

::view-transition-new(modal-slide-down) {
  animation: slide-down-enter 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============================================
   KEYFRAME ANIMATIONS
   ============================================ */

/* Fade Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Slide Animations - Horizontal */
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-out-left {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-30px);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-out-right {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(30px);
  }
}

/* Slide Animations - Vertical */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-down {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}

@keyframes slide-down-enter {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up-exit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

/* Scale Animations with Anticipation */
@keyframes modal-scale-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modal-scale-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Bounce Animation (Success/Confirmation) */
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Shake Animation (Error) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

/* ============================================
   STAGGER ANIMATIONS
   ============================================ */

.stagger-item {
  animation: fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Delay classes for stagger */
.stagger-delay-1 { animation-delay: 50ms; }
.stagger-delay-2 { animation-delay: 100ms; }
.stagger-delay-3 { animation-delay: 150ms; }
.stagger-delay-4 { animation-delay: 200ms; }
.stagger-delay-5 { animation-delay: 250ms; }
.stagger-delay-6 { animation-delay: 300ms; }

/* ============================================
   ACCESSIBILITY - REDUCED MOTION
   ============================================ */

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
    transition: none !important;
  }
  
  .stagger-item {
    animation: none !important;
  }
}

/* ============================================
   PERFORMANCE OPTIMIZATIONS
   ============================================ */

/* GPU Acceleration */
::view-transition-old(root),
::view-transition-new(root) {
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Contenedor de transiciones */
.transition-container {
  contain: layout style paint;
}
```


## Performance Optimization Strategies

### 1. Device Tier Detection

```typescript
function detectDeviceTier(): 'high' | 'medium' | 'low' {
  const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as any).deviceMemory || 4
  const connection = (navigator as any).connection?.effectiveType || '4g'
  
  // High-end: 6+ cores, 8GB+ RAM, 4G+
  if (cores >= 6 && memory >= 8 && connection === '4g') {
    return 'high'
  }
  
  // Low-end: <4 cores, <4GB RAM, 3G or slower
  if (cores < 4 || memory < 4 || connection === '3g' || connection === '2g') {
    return 'low'
  }
  
  return 'medium'
}
```

### 2. Adaptive Duration

```typescript
function getAdaptiveDuration(
  baseDuration: number,
  deviceTier: 'high' | 'medium' | 'low'
): number {
  const multipliers = {
    high: 1.0,    // Duración completa
    medium: 0.8,  // 20% más rápido
    low: 0.6      // 40% más rápido
  }
  
  return Math.round(baseDuration * multipliers[deviceTier])
}
```

### 3. Connection-Aware Transitions

```typescript
function shouldSimplifyTransition(): boolean {
  const connection = (navigator as any).connection
  
  if (!connection) return false
  
  // Simplificar en conexiones lentas o modo ahorro de datos
  return (
    connection.effectiveType === '2g' ||
    connection.effectiveType === 'slow-2g' ||
    connection.saveData === true
  )
}
```

### 4. Battery-Aware Optimization

```typescript
async function getBatteryOptimization(): Promise<OptimizationStrategy> {
  try {
    const battery = await (navigator as any).getBattery()
    
    if (battery.level < 0.2 && !battery.charging) {
      return {
        reduceDuration: true,
        simplifyAnimation: true,
        skipTransition: false,
        reason: 'Low battery'
      }
    }
    
    if (battery.level < 0.1) {
      return {
        reduceDuration: true,
        simplifyAnimation: true,
        skipTransition: true,
        reason: 'Critical battery'
      }
    }
  } catch (error) {
    // Battery API no disponible
  }
  
  return {
    reduceDuration: false,
    simplifyAnimation: false,
    skipTransition: false,
    reason: 'Normal'
  }
}
```

### 5. Frame Rate Monitoring

```typescript
class FrameRateMonitor {
  private frames: number[] = []
  private lastTime = performance.now()
  
  measure(): void {
    const now = performance.now()
    const delta = now - this.lastTime
    const fps = 1000 / delta
    
    this.frames.push(fps)
    if (this.frames.length > 60) {
      this.frames.shift()
    }
    
    this.lastTime = now
  }
  
  getAverageFPS(): number {
    if (this.frames.length === 0) return 60
    return this.frames.reduce((a, b) => a + b) / this.frames.length
  }
  
  shouldOptimize(): boolean {
    return this.getAverageFPS() < 30
  }
}
```

### 6. Lazy Loading Transitions

```typescript
// Cargar animaciones complejas solo cuando se necesitan
const complexTransitions = {
  bounce: () => import('./animations/bounce'),
  elastic: () => import('./animations/elastic'),
  spring: () => import('./animations/spring'),
}

async function loadTransition(type: string) {
  if (type in complexTransitions) {
    const module = await complexTransitions[type]()
    return module.default
  }
  return null
}
```

## Integration with Existing Code

### 1. Root Layout Integration

**Archivo**: `src/app/layout.tsx`

```typescript
import { ViewTransitionsProvider } from '@/contexts/ViewTransitionsContext'
import { PerformanceMonitor } from '@/components/PerformanceMonitor'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ViewTransitionsProvider>
          <PerformanceMonitor />
          <ThemeProvider>
            <LanguageProvider>
              <Provider store={store}>
                {children}
                <Toaster position="top-center" richColors />
              </Provider>
            </LanguageProvider>
          </ThemeProvider>
        </ViewTransitionsProvider>
      </body>
    </html>
  )
}
```

### 2. Enhanced Navigation Example

```typescript
// Antes
const router = useRouter()
router.push('/dashboard')

// Después - Básico
const { startTransition } = useViewTransition()
startTransition(() => router.push('/dashboard'))

// Después - Avanzado
const { startTransition } = useViewTransition({
  direction: 'forward',
  speed: 'normal',
  enableHaptics: true,
  sharedElements: ['user-avatar'],
  onComplete: () => console.log('Navigation complete')
})

startTransition(() => router.push('/dashboard'))
```

### 3. Enhanced Modal Example

```typescript
// Antes
<Dialog isOpen={isOpen} onClose={onClose}>
  {content}
</Dialog>

// Después - Básico
<TransitionDialog isOpen={isOpen} onClose={onClose}>
  {content}
</TransitionDialog>

// Después - Avanzado
<TransitionDialog 
  isOpen={isOpen} 
  onClose={onClose}
  animationType="auto"
  speed="normal"
  enableHaptics={true}
  origin={buttonPosition}
>
  {content}
</TransitionDialog>
```

### 4. Shared Element Example

```typescript
// Página de lista
<SharedElement id={`product-${product.id}`}>
  <img src={product.image} alt={product.name} />
</SharedElement>

// Página de detalle
<SharedElement id={`product-${product.id}`}>
  <img src={product.image} alt={product.name} className="large" />
</SharedElement>

// La transición automáticamente morphea la imagen
```

### 5. Stagger Animation Example

```typescript
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation'

function ProductList({ products }) {
  const listRef = useRef<HTMLDivElement>(null)
  
  useStaggerAnimation(listRef, {
    delay: 50,
    maxDelay: 300,
    direction: 'forward'
  })
  
  return (
    <div ref={listRef}>
      {products.map(product => (
        <div key={product.id} className="stagger-item">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
```

## Error Handling & Fallbacks

### 1. Graceful Degradation

```typescript
async function executeTransitionSafely(
  callback: () => void | Promise<void>,
  config: TransitionConfig
): Promise<void> {
  try {
    // Intentar con View Transitions API
    if (supportsViewTransitions() && !config.skipTransition) {
      await document.startViewTransition(callback).finished
      return
    }
  } catch (error) {
    console.warn('View Transition failed, using fallback:', error)
  }
  
  try {
    // Fallback a Framer Motion
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      await animateWithFramerMotion(callback, config)
      return
    }
  } catch (error) {
    console.warn('Framer Motion fallback failed:', error)
  }
  
  // Último recurso: ejecutar sin animación
  await callback()
}
```

### 2. Timeout Protection

```typescript
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Transition timeout')), timeoutMs)
    )
  ])
}
```

### 3. Error Recovery

```typescript
class TransitionErrorHandler {
  private failureCount = 0
  private maxFailures = 3
  
  async handleError(error: Error, config: TransitionConfig): Promise<void> {
    this.failureCount++
    
    console.error('Transition error:', error)
    
    // Después de 3 fallos, deshabilitar transiciones temporalmente
    if (this.failureCount >= this.maxFailures) {
      console.warn('Too many transition failures, disabling temporarily')
      config.skipTransition = true
      
      // Rehabilitar después de 30 segundos
      setTimeout(() => {
        this.failureCount = 0
        config.skipTransition = false
      }, 30000)
    }
  }
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
// src/utils/__tests__/view-transitions.test.ts
describe('View Transitions Utils', () => {
  test('detecta soporte de View Transitions API', () => {
    expect(supportsViewTransitions()).toBeDefined()
  })
  
  test('detecta prefers-reduced-motion', () => {
    expect(prefersReducedMotion()).toBeDefined()
  })
  
  test('detecta tier de dispositivo correctamente', () => {
    const tier = detectDeviceTier()
    expect(['high', 'medium', 'low']).toContain(tier)
  })
  
  test('adapta duración según tier', () => {
    const duration = getAdaptiveDuration(300, 'low')
    expect(duration).toBeLessThan(300)
  })
})
```

### 2. Integration Tests

```typescript
// src/hooks/__tests__/useViewTransition.test.tsx
describe('useViewTransition Hook', () => {
  test('ejecuta transición correctamente', async () => {
    const { result } = renderHook(() => useViewTransition())
    const callback = jest.fn()
    
    await act(async () => {
      await result.current.startTransition(callback)
    })
    
    expect(callback).toHaveBeenCalled()
  })
  
  test('respeta prefers-reduced-motion', async () => {
    // Mock prefers-reduced-motion
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))
    
    const { result } = renderHook(() => useViewTransition())
    const callback = jest.fn()
    
    await act(async () => {
      await result.current.startTransition(callback)
    })
    
    // Debe ejecutar sin animación
    expect(callback).toHaveBeenCalled()
  })
})
```

### 3. Component Tests

```typescript
// src/components/ui/__tests__/TransitionDialog.test.tsx
describe('TransitionDialog', () => {
  test('se abre con animación', async () => {
    const { rerender } = render(
      <TransitionDialog isOpen={false} onClose={jest.fn()}>
        Content
      </TransitionDialog>
    )
    
    rerender(
      <TransitionDialog isOpen={true} onClose={jest.fn()}>
        Content
      </TransitionDialog>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
  
  test('aplica animación correcta según tipo', () => {
    render(
      <TransitionDialog 
        isOpen={true} 
        onClose={jest.fn()}
        animationType="scale"
      >
        Content
      </TransitionDialog>
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveStyle({ viewTransitionName: expect.stringContaining('modal-scale') })
  })
})
```

### 4. Performance Tests

```typescript
describe('Performance Monitoring', () => {
  test('mide FPS durante transición', async () => {
    const monitor = new FrameRateMonitor()
    
    // Simular transición
    for (let i = 0; i < 60; i++) {
      monitor.measure()
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    
    const avgFPS = monitor.getAverageFPS()
    expect(avgFPS).toBeGreaterThan(30)
  })
})
```


## Browser Support & Fallback Strategy

### Supported Browsers

| Browser | Version | View Transitions API | Fallback Strategy |
|---------|---------|---------------------|-------------------|
| Chrome | 111+ | ✅ Nativo | - |
| Edge | 111+ | ✅ Nativo | - |
| Safari | 18+ | ✅ Nativo | - |
| Firefox | - | ❌ | Framer Motion → CSS |
| Safari < 18 | - | ❌ | Framer Motion → CSS |
| Chrome < 111 | - | ❌ | Framer Motion → CSS |

### Fallback Hierarchy

```typescript
const FALLBACK_STRATEGY = [
  'view-transitions-api',  // Preferido
  'framer-motion',         // Fallback 1
  'css-animations',        // Fallback 2
  'instant'                // Último recurso
]

function selectTransitionMethod(): string {
  if (supportsViewTransitions()) {
    return 'view-transitions-api'
  }
  
  if (prefersReducedMotion()) {
    return 'instant'
  }
  
  if (typeof window !== 'undefined' && 'animate' in Element.prototype) {
    return 'framer-motion'
  }
  
  return 'css-animations'
}
```

## Accessibility Considerations

### 1. Reduced Motion Support

```typescript
function respectReducedMotion(config: TransitionConfig): TransitionConfig {
  if (prefersReducedMotion()) {
    return {
      ...config,
      duration: 0,
      skipTransition: true
    }
  }
  return config
}
```

### 2. Focus Management

```typescript
async function transitionWithFocusManagement(
  callback: () => void,
  config: TransitionConfig
): Promise<void> {
  const activeElement = document.activeElement as HTMLElement
  const focusableElements = getFocusableElements()
  
  await startTransition(callback, config)
  
  // Restaurar foco o mover a primer elemento focusable
  if (activeElement && document.contains(activeElement)) {
    activeElement.focus()
  } else if (focusableElements.length > 0) {
    focusableElements[0].focus()
  }
}

function getFocusableElements(): HTMLElement[] {
  const selector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  return Array.from(document.querySelectorAll(selector))
}
```

### 3. Screen Reader Announcements

```typescript
function announceTransition(message: string): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Uso
startTransition(() => {
  router.push('/dashboard')
  announceTransition('Navegando al dashboard')
})
```

### 4. Keyboard Navigation

```typescript
// Las transiciones no deben interferir con navegación por teclado
function handleKeyboardNavigation(e: KeyboardEvent): void {
  if (e.key === 'Escape' && isTransitioning) {
    cancelTransition()
  }
  
  // Tab order se mantiene durante transiciones
  if (e.key === 'Tab') {
    // No prevenir default
  }
}
```

## Configuration Examples

### 1. Global Configuration

```typescript
// src/app/layout.tsx
<ViewTransitionsProvider
  config={{
    enabled: true,
    speeds: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 400,
      dramatic: 600
    },
    easings: {
      enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    respectReducedMotion: true,
    enableHaptics: true,
    enableSharedElements: true,
    performanceBudget: {
      maxConcurrentTransitions: 3,
      maxDuration: 500,
      minFrameRate: 30
    }
  }}
>
  {children}
</ViewTransitionsProvider>
```

### 2. Per-Route Configuration

```typescript
// src/app/dashboard/page.tsx
export const transitionConfig = {
  direction: 'forward',
  speed: 'normal',
  sharedElements: ['user-avatar', 'logo']
}
```

### 3. Conditional Transitions

```typescript
const { startTransition } = useViewTransition({
  speed: isMobile ? 'fast' : 'normal',
  enableHaptics: isMobile,
  skipTransition: isSlowConnection
})
```

### 4. Custom Easing

```typescript
<TransitionLink 
  href="/profile"
  speed="normal"
  easing="bounce" // Para confirmaciones exitosas
>
  Save Profile
</TransitionLink>
```

## Monitoring and Debugging

### 1. Performance Dashboard

```typescript
interface PerformanceMetrics {
  totalTransitions: number
  averageDuration: number
  averageFPS: number
  failureRate: number
  optimizationRate: number
}

class PerformanceDashboard {
  private metrics: PerformanceMetrics = {
    totalTransitions: 0,
    averageDuration: 0,
    averageFPS: 0,
    failureRate: 0,
    optimizationRate: 0
  }
  
  recordTransition(state: TransitionState): void {
    this.metrics.totalTransitions++
    this.metrics.averageDuration = 
      (this.metrics.averageDuration + state.performance.duration) / 2
    this.metrics.averageFPS = 
      (this.metrics.averageFPS + state.performance.fps) / 2
  }
  
  getReport(): PerformanceMetrics {
    return { ...this.metrics }
  }
}
```

### 2. Debug Mode

```typescript
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.group('🎬 Transition Debug')
  console.log('Type:', type)
  console.log('Direction:', direction)
  console.log('Duration:', duration)
  console.log('Device Tier:', deviceTier)
  console.log('Optimizations:', optimizations)
  console.groupEnd()
}
```

### 3. Visual Debug Overlay

```typescript
function DebugOverlay() {
  const { isTransitioning, activeTransitions, capabilities } = useViewTransitionsContext()
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
      <div>Transitioning: {isTransitioning ? '✅' : '❌'}</div>
      <div>Active: {activeTransitions.size}</div>
      <div>Device Tier: {capabilities.tier}</div>
      <div>FPS: {capabilities.fps}</div>
      <div>View Transitions: {capabilities.supportsViewTransitions ? '✅' : '❌'}</div>
    </div>
  )
}
```

### 4. Error Tracking

```typescript
function trackTransitionError(error: Error, context: TransitionContext): void {
  // Enviar a servicio de monitoreo (Sentry, LogRocket, etc.)
  console.error('Transition Error:', {
    message: error.message,
    stack: error.stack,
    context: {
      type: context.type,
      direction: context.direction,
      deviceTier: context.deviceTier,
      timestamp: Date.now()
    }
  })
}
```

## Migration Strategy

### Phase 1: Core Infrastructure (Week 1)
**Objetivo**: Establecer fundamentos sin afectar funcionalidad existente

- ✅ Crear utilidades de detección y configuración
- ✅ Implementar ViewTransitionsProvider
- ✅ Implementar useViewTransition hook básico
- ✅ Agregar estilos CSS globales
- ✅ Implementar sistema de fallbacks
- ✅ Tests unitarios de utilidades

**Criterio de Éxito**: Sistema funciona sin errores, fallbacks operativos

### Phase 2: Navigation Transitions (Week 2)
**Objetivo**: Transiciones en navegación principal

- ✅ Crear TransitionLink component
- ✅ Implementar detección de dirección
- ✅ Actualizar Header, BottomNav, MobileNavigation
- ✅ Actualizar páginas principales (Dashboard, Profile, Tools)
- ✅ Implementar RouteAnalyzer
- ✅ Tests de integración de navegación

**Criterio de Éxito**: Navegación fluida entre páginas principales

### Phase 3: Modal Transitions (Week 3)
**Objetivo**: Transiciones contextuales en modales

- ✅ Crear TransitionDialog component
- ✅ Implementar detección de origen
- ✅ Migrar modales críticos (Bag, Cart, Vault)
- ✅ Migrar modales de detalles
- ✅ Migrar modales de formularios
- ✅ Tests de componentes de modales

**Criterio de Éxito**: Todos los modales con transiciones apropiadas

### Phase 4: Advanced Features (Week 4)
**Objetivo**: Características avanzadas y optimizaciones

- ✅ Implementar SharedElement transitions
- ✅ Implementar StaggerAnimation
- ✅ Implementar HapticFeedback
- ✅ Implementar PerformanceOptimizer
- ✅ Implementar TransitionOrchestrator
- ✅ Optimizaciones móviles
- ✅ Tests de performance

**Criterio de Éxito**: Experiencia premium con optimizaciones activas

### Phase 5: Polish & Documentation (Week 5)
**Objetivo**: Refinamiento y documentación

- ✅ Ajustar timings y easings
- ✅ Crear documentación de uso
- ✅ Crear guía de migración
- ✅ Performance audit completo
- ✅ Accessibility audit
- ✅ Tests E2E

**Criterio de Éxito**: Sistema completo, documentado y optimizado

## Design Decisions and Rationale

### 1. Why Contextual Transitions?

**Decisión**: Diferentes transiciones según contexto (forward/backward/lateral)

**Razón**: 
- Comunica la relación espacial entre vistas
- Reduce carga cognitiva del usuario
- Mejora la orientación y navegación
- Basado en patrones de iOS/Android

### 2. Why Adaptive Performance?

**Decisión**: Ajustar transiciones según capacidades del dispositivo

**Razón**:
- Mantener 30fps mínimo en todos los dispositivos
- Mejor experiencia en dispositivos de gama baja
- Respetar batería y conexión del usuario
- Evitar frustración por animaciones lentas

### 3. Why Haptic Feedback?

**Decisión**: Feedback táctil opcional en móviles

**Razón**:
- Refuerza feedback visual
- Mejora percepción de calidad
- Estándar en apps nativas modernas
- Opcional para no molestar usuarios

### 4. Why Shared Elements?

**Decisión**: Soporte para transiciones de elementos compartidos

**Razón**:
- Continuidad visual entre vistas
- Reduce desorientación
- Experiencia premium
- Diferenciador competitivo

### 5. Why Multiple Fallbacks?

**Decisión**: View Transitions API → Framer Motion → CSS → Instant

**Razón**:
- Máxima compatibilidad
- Degradación elegante
- Siempre funcional
- Future-proof

### 6. Why Performance Budget?

**Decisión**: Límites estrictos (3 transiciones, 500ms max, 30fps min)

**Razón**:
- Prevenir sobrecarga
- Mantener responsividad
- Evitar janky animations
- Mejor UX que animaciones lentas

## Future Enhancements

### V2.0 Features

1. **AI-Powered Transition Selection**
   - Machine learning para predecir mejor transición
   - Basado en patrones de uso del usuario

2. **Advanced Shared Elements**
   - Morphing complejo entre elementos
   - Transiciones de layout

3. **Gesture-Based Transitions**
   - Swipe para navegar con transición
   - Pull-to-refresh con animación

4. **Sound Effects**
   - Audio feedback opcional
   - Coordinado con transiciones visuales

5. **Custom Transition Builder**
   - UI para crear transiciones personalizadas
   - Preview en tiempo real

## Conclusion

Este diseño proporciona un sistema de transiciones de clase mundial que:

✅ **Mejora UX**: Transiciones contextuales y significativas
✅ **Optimiza Performance**: Adaptativo según dispositivo
✅ **Accesible**: Respeta preferencias del usuario
✅ **Escalable**: Fácil agregar nuevas transiciones
✅ **Mantenible**: Código limpio y bien documentado
✅ **Future-Proof**: Usa estándares web modernos
✅ **Premium**: Experiencia de app nativa

La implementación en 5 fases permite migración gradual sin romper funcionalidad existente, con criterios de éxito claros en cada fase.
