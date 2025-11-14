# Implementation Plan - View Transitions (Enhanced)

## Phase 1: Core Infrastructure (Week 1)

- [x] 1. Crear sistema de detección de capacidades del dispositivo

  - Implementar detección de soporte del navegador
  - Implementar detección de tier de dispositivo (high/medium/low)
  - Implementar detección de preferencias de accesibilidad
  - Implementar detección de condiciones de red y batería
  - _Requirements: 1.2, 3.3, 4.1, 4.2_

- [x] 1.1 Implementar utilidades core de view transitions

  - Crear archivo `src/utils/view-transitions.ts`
  - Implementar función `supportsViewTransitions()` para detectar soporte del navegador
  - Implementar función `prefersReducedMotion()` para detectar preferencias de accesibilidad
  - Implementar función `detectDeviceTier()` que analice cores, memoria y conexión
  - Implementar función `executeTransition()` con lógica de fallback completa
  - Implementar función `generateTransitionName()` para nombres únicos
  - Definir constantes expandidas `TRANSITION_SPEEDS` (instant, fast, normal, slow, dramatic)
  - Definir constantes `TRANSITION_EASINGS` (enter, exit, bounce, smooth, sharp)
  - _Requirements: 1.2, 3.3, 4.2_

- [x] 1.2 Implementar DeviceCapabilities detector

  - Crear archivo `src/utils/device-capabilities.ts`
  - Implementar clase `DeviceCapabilitiesDetector`
  - Detectar `hardwareConcurrency` (número de cores)
  - Detectar `deviceMemory` (RAM disponible)
  - Detectar `connection.effectiveType` (velocidad de red)
  - Detectar `connection.saveData` (modo ahorro de datos)
  - Implementar función `getBatteryLevel()` usando Battery API
  - Implementar función `isMobileDevice()` basado en user agent y viewport
  - Crear interface `DeviceCapabilities` con todos los datos
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 1.3 Implementar PerformanceOptimizer

  - Crear archivo `src/utils/performance-optimizer.ts`
  - Implementar clase `PerformanceOptimizer`
  - Implementar función `getAdaptiveDuration()` que ajuste según tier
  - Implementar función `shouldSimplifyTransition()` basado en conexión
  - Implementar función `getBatteryOptimization()` que ajuste según batería
  - Implementar lógica de optimización automática
  - Crear interface `OptimizationStrategy`
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 1.4 Crear ViewTransitionsProvider context mejorado

  - Crear archivo `src/contexts/ViewTransitionsContext.tsx`
  - Definir interface `ViewTransitionsConfig` con speeds y easings expandidos
  - Definir interface `ViewTransitionsContextValue` con capabilities
  - Implementar provider con estado de configuración completo
  - Implementar detección de capacidades al montar
  - Implementar detección de `prefers-reduced-motion`
  - Implementar tracking de transiciones activas con Set
  - Implementar función `updateConfig` para actualizar configuración
  - Exportar hook `useViewTransitionsContext`
  - _Requirements: 3.1, 3.3, 4.2_

- [x] 1.5 Agregar estilos CSS globales mejorados

  - Actualizar archivo `src/app/globals.css`
  - Agregar estilos para transiciones direccionales (forward/backward/lateral)
  - Agregar estilos para modales contextuales (scale/slideUp/slideDown)
  - Definir keyframes para slide horizontal (left/right)
  - Definir keyframes para slide vertical (up/down)
  - Definir keyframes para scale con anticipación
  - Definir keyframes para bounce animation
  - Definir keyframes para shake animation (errores)
  - Agregar estilos para stagger animations
  - Agregar media query para `prefers-reduced-motion`
  - Agregar optimizaciones de GPU (will-change, backface-visibility)
  - _Requirements: 1.1, 2.1, 2.2, 4.2, 5.1, 5.2_

- [x] 2. Implementar sistema de monitoreo de performance

  - Crear FrameRateMonitor para medir FPS
  - Crear PerformanceDashboard para métricas
  - Implementar logging de performance en desarrollo
  - _Requirements: 4.3, 4.4_

- [x] 2.1 Crear FrameRateMonitor

  - Crear archivo `src/utils/frame-rate-monitor.ts`
  - Implementar clase `FrameRateMonitor`
  - Implementar método `measure()` usando performance.now()
  - Implementar método `getAverageFPS()` calculando promedio de últimos 60 frames
  - Implementar método `shouldOptimize()` que retorne true si FPS < 30
  - Mantener buffer circular de últimos 60 frames
  - _Requirements: 4.3, 4.4_

- [x] 2.2 Crear PerformanceDashboard

  - Crear archivo `src/utils/performance-dashboard.ts`
  - Implementar clase `PerformanceDashboard`
  - Definir interface `PerformanceMetrics` con métricas clave
  - Implementar método `recordTransition()` para guardar métricas
  - Implementar método `getReport()` para obtener reporte completo
  - Calcular promedios de duración, FPS, tasa de fallos
  - _Requirements: 4.3, 4.4_

- [x] 2.3 Crear componente DebugOverlay (solo desarrollo)

  - Crear archivo `src/components/PerformanceMonitor.tsx`
  - Mostrar estado de transiciones en tiempo real
  - Mostrar tier de dispositivo y capacidades
  - Mostrar FPS actual y promedio
  - Mostrar número de transiciones activas
  - Solo renderizar en modo desarrollo
  - _Requirements: 3.5_

## Phase 2: Advanced Navigation System (Week 2)

- [x] 3. Implementar RouteAnalyzer para transiciones contextuales

  - Analizar rutas para determinar dirección de navegación
  - Detectar profundidad de rutas
  - Categorizar rutas por tipo
  - Recomendar transiciones apropiadas
  - _Requirements: 1.1, 1.3, 5.1, 5.4_

- [x] 3.1 Crear RouteAnalyzer utility

  - Crear archivo `src/utils/route-analyzer.ts`
  - Definir interface `RouteInfo` con path, depth, category
  - Definir interface `TransitionRecommendation` con direction, speed, easing
  - Implementar función `analyzeRoute()` que extraiga info de ruta
  - Implementar función `detectDirection()` comparando profundidad de rutas
  - Implementar función `recommendTransition()` basado en análisis
  - Detectar categorías: dashboard, profile, tools, consumables, admin
  - _Requirements: 1.1, 1.3, 5.1_

- [x] 3.2 Implementar hook useViewTransition mejorado

  - Crear archivo `src/hooks/useViewTransition.ts`
  - Definir interface `UseViewTransitionOptions` con todas las opciones
  - Definir interface `UseViewTransitionReturn` con startTransition, isTransitioning, progress, cancel
  - Implementar estado `isTransitioning` para prevenir transiciones simultáneas
  - Implementar estado `progress` para tracking de progreso (0-1)
  - Implementar función `startTransition` que use View Transitions API
  - Integrar con RouteAnalyzer para detección automática de dirección
  - Integrar con PerformanceOptimizer para ajustes adaptativos
  - Agregar lógica de fallback: View Transitions → Framer Motion → CSS → Instant
  - Implementar callbacks `onStart`, `onComplete`, `onError`
  - Implementar función `cancel()` para cancelar transiciones
  - Agregar timeout protection (max 500ms)
  - Respetar configuración de `prefers-reduced-motion`
  - Aplicar optimizaciones según tier de dispositivo
  - _Requirements: 1.1, 1.5, 3.1, 3.4, 4.1_

- [x] 3.3 Crear TransitionLink component inteligente

  - Crear archivo `src/components/ui/TransitionLink.tsx`
  - Definir interface `TransitionLinkProps` extendiendo `LinkProps`
  - Usar hook `useViewTransition` internamente
  - Implementar detección automática de dirección con RouteAnalyzer
  - Implementar handler `onClick` que ejecute transición antes de navegar
  - Usar `useRouter` y `usePathname` de Next.js
  - Soportar prop `direction` con valor 'auto' por defecto
  - Soportar prop `speed` para configurar velocidad
  - Soportar prop `enableHaptics` para feedback táctil
  - Soportar prop `sharedElements` para elementos compartidos
  - Mantener compatibilidad con todas las props de Link
  - _Requirements: 1.1, 1.3, 3.2, 5.1_

- [x] 4. Implementar TransitionOrchestrator

  - Coordinar múltiples transiciones simultáneas
  - Implementar sistema de prioridades
  - Implementar cola de transiciones
  - Prevenir más de 3 transiciones concurrentes
  - _Requirements: 1.5, 4.4_

- [x] 4.1 Crear TransitionOrchestrator

  - Crear archivo `src/utils/transition-orchestrator.ts`
  - Definir interface `TransitionTask` con id, type, priority, callback, config
  - Implementar clase `TransitionOrchestrator`
  - Implementar cola de prioridad para tareas
  - Implementar Set de transiciones activas
  - Implementar método `enqueue()` para agregar tareas
  - Implementar método `execute()` que respete límite de 3 concurrentes
  - Implementar método `cancel()` para cancelar transición específica
  - Implementar método `clear()` para limpiar cola
  - Implementar método `getActiveCount()` para obtener número de activas
  - _Requirements: 1.5, 4.4_

- [x] 5. Actualizar componentes de navegación principales

  - Migrar Header a usar TransitionLink
  - Migrar BottomNav a usar TransitionLink
  - Migrar MobileNavigation a usar TransitionLink
  - Aplicar transiciones contextuales
  - _Requirements: 1.1, 1.3, 5.1, 5.4_

- [x] 5.1 Actualizar Header component

  - Modificar archivo `src/components/layout/Header.tsx`
  - Reemplazar uso de `router.push()` con `useViewTransition`
  - Importar y usar hook con detección automática de dirección
  - Aplicar speed 'fast' para navegación rápida
  - Verificar que la navegación funcione correctamente
  - _Requirements: 1.1, 1.3, 5.1_

- [x] 5.2 Actualizar BottomNav component

  - Modificar archivo `src/components/dashboard/BottomNav.tsx`
  - Reemplazar uso de `router.push()` con `useViewTransition`
  - Aplicar transiciones laterales para items del mismo nivel

  - Mantener el estado activo visual durante transiciones
  - Aplicar speed 'normal' para navegación estándar
  - _Requirements: 1.1, 1.3, 5.1, 5.4_

- [x] 5.3 Actualizar MobileNavigation component

  - Modificar archivo `src/components/layout/MobileNavigation.tsx`
  - Reemplazar uso de `router.push()` con `useViewTransition`
  - Aplicar transiciones optimizadas para móvil (speed 'fast')
  - Habilitar haptics en móvil
  - _Requirements: 1.1, 1.3, 4.1, 5.1_

- [x] 6. Migrar páginas principales a usar transiciones

  - Actualizar Dashboard page
  - Actualizar Profile page
  - Actualizar Tools pages
  - Actualizar Consumables pages
  - Actualizar Admin pages
  - _Requirements: 1.1, 1.3, 5.1_

- [x] 6.1 Actualizar Dashboard page

  - Modificar archivo `src/app/dashboard/page.tsx`
  - Reemplazar uso directo de `router.push()` con `useViewTransition`
  - Aplicar transiciones a QuickActionButtons
  - Usar direction 'forward' para profundizar
  - Verificar que todas las navegaciones usen transiciones
  - _Requirements: 1.1, 1.3, 5.1_

- [x] 6.2 Actualizar Profile page

  - Modificar archivo `src/app/profile/page.tsx`
  - Aplicar transiciones a navegación de cambio de contraseña
  - Usar `useViewTransition` para navegación programática
  - Aplicar speed 'normal'
  - _Requirements: 1.1, 1.3_

- [x] 6.3 Actualizar Tools pages

  - Modificar archivos en `src/app/tools/`
  - Aplicar transiciones en páginas de scan y return
  - Usar hook para navegación después de escaneo
  - Aplicar speed 'fast' para feedback inmediato
  - _Requirements: 1.1, 1.3_

- [x] 6.4 Actualizar Consumables pages

  - Modificar archivos en `src/app/consumables/`
  - Aplicar transiciones en páginas de consumibles
  - Usar hook para navegación en flujos de solicitud
  - Aplicar transiciones apropiadas según contexto

  - _Requirements: 1.1, 1.3_

- [x] 6.5 Actualizar Admin pages

  - Modificar archivos en `src/app/admin/`
  - Aplicar transiciones en páginas de administración
  - Usar transiciones laterales para navegación entre secciones
  - _Requirements: 1.1, 1.3_

## Phase 3: Advanced Modal System (Week 3)

- [x] 7. Implementar sistema de modales con transiciones contextuales

  - Crear TransitionDialog con detección de origen
  - Implementar diferentes tipos de animación
  - Integrar con sistema de haptics
  - Soportar shared elements
  - _Requirements: 2.1, 2.2, 2.3, 3.2, 5.2_

- [x] 7.1 Crear TransitionDialog component mejorado

  - Crear archivo `src/components/ui/TransitionDialog.tsx`
  - Definir interface `TransitionDialogProps` extendiendo `DialogProps`
  - Agregar prop `animationType` con opciones: auto, fade, scale, slide, slideUp, slideDown
  - Agregar prop `origin` para scale desde elemento específico
  - Agregar prop `speed` para configurar velocidad
  - Agregar prop `enableHaptics` para feedback táctil
  - Agregar prop `sharedElements` para elementos compartidos
  - Implementar estado interno para manejar mounting/unmounting
  - Implementar detección automática de tipo de animación según dispositivo
  - Usar View Transitions API cuando esté disponible
  - Implementar fallback con Framer Motion
  - Generar `view-transition-name` único para cada modal
  - Aplicar animaciones de entrada al abrir y salida al cerrar
  - Integrar con HapticFeedback para vibración coordinada
  - _Requirements: 2.1, 2.2, 2.3, 3.2, 4.1, 5.2_

- [x] 7.2 Implementar detección de origen para modales

  - Crear función `detectModalOrigin()` en TransitionDialog
  - Capturar posición del elemento que activó el modal
  - Usar posición para animar scale desde ese punto
  - Aplicar transform-origin dinámico
  - _Requirements: 2.1, 5.2_

- [x] 8. Migrar modales críticos a TransitionDialog

  - Migrar BagModal con animación scale
  - Migrar CartModal con animación scale
  - Migrar VaultModal con animación scale
  - Migrar ReturnCartModal con animación scale
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 8.1 Migrar BagModal

  - Modificar archivo `src/components/bag/BagModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Configurar `animationType="scale"` para efecto de zoom
  - Configurar `speed="normal"`
  - Habilitar haptics en móvil
  - Verificar que animaciones funcionen correctamente
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [x] 8.2 Migrar CartModal

  - Modificar archivo `src/components/cart/CartModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Usar animación scale para consistencia
  - Capturar origen desde botón de carrito
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 8.3 Migrar VaultModal

  - Modificar archivo `src/components/vault/VaultModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación scale
  - Configurar speed 'normal'
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 8.4 Migrar ReturnCartModal

  - Modificar archivo `src/components/returns/ReturnCartModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación scale
  - Habilitar haptics para confirmación
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [x] 9. Migrar modales de detalles a TransitionDialog

  - Migrar ToolDetailsModal con fade
  - Migrar ConsumableDetailsModal con fade
  - Migrar LoanDetailsModal con fade
  - Migrar ElectronicDeviceModal con fade
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 9.1 Migrar ToolDetailsModal

  - Modificar archivo `src/components/tools/ToolDetailsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Usar `animationType="fade"` para modales de detalles
  - Configurar speed 'fast' para respuesta rápida
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 9.2 Migrar ConsumableDetailsModal

  - Modificar archivo `src/components/consumables/ConsumableDetailsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación fade
  - Configurar speed 'fast'
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 9.3 Migrar LoanDetailsModal

  - Modificar archivo `src/components/dashboard/LoanDetailsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación fade
  - Configurar speed 'fast'
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 9.4 Migrar ElectronicDeviceModal

  - Modificar archivo `src/components/electronics/ElectronicDeviceModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación fade
  - Configurar speed 'fast'
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 10. Migrar modales de formularios a TransitionDialog

  - Migrar RequestMaterialsModal con slideUp en móvil
  - Migrar RequestToolsModal con slideUp en móvil
  - Migrar ReturnMaterialsModal con slideUp en móvil
  - Migrar ReturnToolsModal con slideUp en móvil
  - Migrar QuantityModal con scale rápido
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [x] 10.1 Migrar RequestMaterialsModal

  - Modificar archivo `src/components/dashboard/RequestMaterialsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Usar `animationType="auto"` para detección automática
  - En móvil: slideUp, en desktop: scale
  - Configurar speed 'normal'
  - Habilitar haptics en móvil
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [ ] 10.2 Migrar RequestToolsModal

  - Modificar archivo `src/components/dashboard/RequestToolsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación auto (slideUp en móvil, scale en desktop)
  - Configurar speed 'normal'

  - Habilitar haptics
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [ ] 10.3 Migrar ReturnMaterialsModal

  - Modificar archivo `src/components/dashboard/ReturnMaterialsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación auto según dispositivo
  - Configurar speed 'normal'

  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [ ] 10.4 Migrar ReturnToolsModal

  - Modificar archivo `src/components/dashboard/ReturnToolsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación auto según dispositivo

  - Configurar speed 'normal'
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [ ] 10.5 Migrar QuantityModal

  - Modificar archivo `src/components/scanner/QuantityModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Usar animación scale con speed 'fast' para modal pequeño
  - Habilitar haptics para feedback inmediato
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [x] 11. Migrar modales de reservas a TransitionDialog

  - Migrar MyReservationsModal
  - Migrar AllReservationsModal
  - Migrar ReservationsHistoryModal
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 11.1 Migrar MyReservationsModal

  - Modificar archivo `src/components/reservations/MyReservationsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación scale
  - Configurar speed 'normal'
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [ ] 11.2 Migrar AllReservationsModal

  - Modificar archivo `src/components/reservations/AllReservationsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación scale
  - Configurar speed 'normal'
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [ ] 11.3 Migrar ReservationsHistoryModal

  - Modificar archivo `src/components/reservations/ReservationsHistoryModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación scale

  - Configurar speed 'normal'
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [ ] 12. Migrar modales de filtros a TransitionDialog

  - Migrar AvailableToolsFilterModal
  - Migrar ActiveLoansFilterModal

  - Migrar AvailableElectronicsModal
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [ ] 12.1 Migrar AvailableToolsFilterModal

  - Modificar archivo `src/components/tools/AvailableToolsFilterModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Usar slideUp en móvil (bottom sheet style)

  - Usar scale en desktop
  - Configurar speed 'fast'
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [ ] 12.2 Migrar ActiveLoansFilterModal

  - Modificar archivo `src/components/loans/ActiveLoansFilterModal.tsx`

  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación auto según dispositivo
  - Configurar speed 'fast'
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

- [ ] 12.3 Migrar AvailableElectronicsModal
  - Modificar archivo `src/components/electronics/AvailableElectronicsModal.tsx`
  - Reemplazar `Dialog` con `TransitionDialog`
  - Aplicar animación auto según dispositivo
  - Configurar speed 'fast'
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2_

## Phase 4: Advanced Features (Week 4)

- [x] 13. Implementar sistema de Haptic Feedback

  - Crear HapticFeedback utility
  - Definir patrones de vibración
  - Integrar con transiciones
  - Detectar soporte del dispositivo
  - _Requirements: 4.1_

- [x] 13.1 Crear HapticFeedback utility

  - Crear archivo `src/utils/haptic-feedback.ts`
  - Definir type `HapticPattern` (light, medium, heavy, success, warning, error)
  - Definir interface `HapticConfig` con enabled, intensity, patterns
  - Implementar clase `HapticFeedback`
  - Implementar método estático `trigger()` que use Vibration API
  - Implementar método estático `isSupported()` para detectar soporte
  - Implementar método estático `configure()` para configuración
  - Definir patrones predefinidos: light [10], medium [20], heavy [30], success [10,50,10], warning [20,100,20,100,20], error [50,100,50]
  - _Requirements: 4.1_

- [x] 13.2 Integrar haptics con transiciones

  - Actualizar `useViewTransition` para soportar haptics
  - Actualizar `TransitionDialog` para soportar haptics
  - Actualizar `TransitionLink` para soportar haptics
  - Trigger haptic 'light' al iniciar navegación
  - Trigger haptic 'medium' al abrir modal
  - Trigger haptic 'success' en confirmaciones
  - _Requirements: 4.1_

- [x] 14. Implementar sistema de Shared Elements

  - Crear SharedElement component
  - Implementar detección automática de elementos compartidos
  - Integrar con View Transitions API
  - Crear ejemplos de uso

  - _Requirements: 2.1, 3.2_

- [x] 14.1 Crear SharedElement component

  - Crear archivo `src/components/ui/SharedElementTransition.tsx`
  - Definir interface `SharedElementProps` con id, children, className
  - Implementar componente que aplique `view-transition-name` dinámico
  - Generar nombres únicos basados en id
  - Soportar múltiples elementos compartidos
  - _Requirements: 2.1, 3.2_

- [ ] 14.2 Implementar ejemplos de shared elements

  - Agregar shared element para avatares de usuario
  - Agregar shared element para imágenes de productos
  - Agregar shared element para logos
  - Documentar patrones de uso

  - _Requirements: 2.1, 3.2_

- [x] 15. Implementar sistema de Stagger Animations

  - Crear StaggerAnimation utility
  - Crear hook useStaggerAnimation
  - Aplicar a listas de productos

  - Aplicar a listas de herramientas
  - _Requirements: 5.4_

- [x] 15.1 Crear StaggerAnimation utility

  - Crear archivo `src/utils/stagger-animation.ts`
  - Definir interface `StaggerConfig` con delay, maxDelay, direction, easing
  - Implementar función `createStaggerAnimation()` que aplique delays escalonados
  - Soportar direcciones: forward, reverse, center
  - Limitar delay máximo para evitar esperas largas
  - _Requirements: 5.4_

- [x] 15.2 Crear hook useStaggerAnimation

  - Crear archivo `src/hooks/useStaggerAnimation.ts`
  - Implementar hook que acepte ref y config
  - Aplicar clases de stagger automáticamente a hijos
  - Usar IntersectionObserver para animar al entrar en viewport
  - Limpiar observers al desmontar
  - _Requirements: 5.4_

- [ ] 15.3 Aplicar stagger a listas principales

  - Aplicar a lista de herramientas en Tools page
  - Aplicar a lista de consumibles en Consumables page
  - Aplicar a lista de préstamos en Dashboard
  - Configurar delay de 50ms entre items
  - Limitar a máximo 300ms de delay total
  - _Requirements: 5.4_

- [x] 16. Implementar optimizaciones avanzadas de performance



  - Implementar lazy loading de animaciones complejas
  - Implementar throttling de transiciones
  - Implementar cancelación de transiciones
  - Optimizar para dispositivos de gama baja
  - _Requirements: 4.1, 4.3, 4.4_


- [x] 16.1 Implementar lazy loading de animaciones


  - Crear archivo `src/utils/lazy-transitions.ts`
  - Implementar carga dinámica de animaciones complejas (bounce, elastic, spring)
  - Cargar solo cuando se necesitan
  - Cachear animaciones cargadas
  - _Requirements: 4.3_


- [ ] 16.2 Implementar throttling de transiciones

  - Actualizar TransitionOrchestrator con throttling
  - Limitar a máximo 3 transiciones concurrentes
  - Implementar cola con prioridades
  - Ejecutar transiciones de alta prioridad primero

  - _Requirements: 4.4_


- [ ] 16.3 Implementar cancelación de transiciones

  - Agregar método `cancel()` a useViewTransition
  - Permitir cancelar con tecla Escape
  - Limpiar recursos al cancelar

  - Ejecutar callback de error al cancelar

  - _Requirements: 1.5_

- [ ] 16.4 Optimizar para dispositivos de gama baja

  - Detectar dispositivos de gama baja (< 4 cores, < 4GB RAM)
  - Reducir duraciones en 40% para tier 'low'
  - Simplificar animaciones (solo fade) en tier 'low'
  - Saltar transiciones si FPS < 15
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 17. Integrar ViewTransitionsProvider en root layout

  - Actualizar layout.tsx con provider
  - Configurar opciones globales
  - Agregar PerformanceMonitor en desarrollo
  - Verificar orden de providers
  - _Requirements: 3.1, 3.3_

- [x] 17.1 Actualizar root layout

  - Modificar archivo `src/app/layout.tsx`
  - Importar `ViewTransitionsProvider`
  - Envolver la aplicación con el provider (antes de ThemeProvider)
  - Configurar speeds y easings globales
  - Habilitar haptics y shared elements
  - Configurar performance budget (max 3 concurrent, max 500ms, min 30fps)
  - Agregar componente `PerformanceMonitor` solo en desarrollo
  - Verificar que el orden de providers sea correcto
  - _Requirements: 3.1, 3.3_

## Phase 5: Testing & Documentation (Week 5)

- [ ] 18. Crear tests unitarios para utilidades

  - Tests para view-transitions utils
  - Tests para device-capabilities
  - Tests para performance-optimizer
  - Tests para route-analyzer
  - Tests para haptic-feedback
  - _Requirements: 3.3_

- [ ] 18.1 Tests para view-transitions utils

  - Crear archivo `src/utils/__tests__/view-transitions.test.ts`
  - Test para `supportsViewTransitions()` con diferentes navegadores
  - Test para `prefersReducedMotion()` con diferentes configuraciones
  - Test para `generateTransitionName()` genera nombres únicos
  - Test para `executeTransition()` con fallbacks
  - Test para constantes de speeds y easings

  - _Requirements: 3.3_

- [ ] 18.2 Tests para device-capabilities

  - Crear archivo `src/utils/__tests__/device-capabilities.test.ts`
  - Test para `detectDeviceTier()` con diferentes configuraciones
  - Test para detección de móvil
  - Test para detección de conexión

  - Mock de navigator APIs
  - _Requirements: 3.3_

- [ ] 18.3 Tests para performance-optimizer

  - Crear archivo `src/utils/__tests__/performance-optimizer.test.ts`
  - Test para `getAdaptiveDuration()` con diferentes tiers
  - Test para `shouldSimplifyTransition()` con conexiones lentas

  - Test para `getBatteryOptimization()` con diferentes niveles
  - Test de estrategias de optimización
  - _Requirements: 3.3_

- [ ] 18.4 Tests para route-analyzer

  - Crear archivo `src/utils/__tests__/route-analyzer.test.ts`
  - Test para `analyzeRoute()` con diferentes rutas
  - Test para `detectDirection()` forward/backward/lateral
  - Test para `recommendTransition()` con diferentes contextos

  - Test de categorización de rutas
  - _Requirements: 3.3_

- [ ] 18.5 Tests para haptic-feedback

  - Crear archivo `src/utils/__tests__/haptic-feedback.test.ts`
  - Test para `isSupported()` con y sin Vibration API
  - Test para `trigger()` con diferentes patrones

  - Test para `configure()` actualiza configuración
  - Mock de Vibration API
  - _Requirements: 3.3_

- [ ] 19. Crear tests de integración para hooks

  - Tests para useViewTransition

  - Tests para useStaggerAnimation
  - Tests de interacción con context
  - _Requirements: 3.1_

- [ ] 19.1 Tests para useViewTransition

  - Crear archivo `src/hooks/__tests__/useViewTransition.test.tsx`
  - Test que hook ejecuta transiciones correctamente
  - Test que hook respeta `prefers-reduced-motion`
  - Test que callbacks `onStart`, `onComplete`, `onError` se ejecutan
  - Test que previene transiciones simultáneas

  - Test de manejo de errores y timeouts
  - Test de cancelación de transiciones
  - Test de progress tracking
  - _Requirements: 3.1_

- [ ] 19.2 Tests para useStaggerAnimation

  - Crear archivo `src/hooks/__tests__/useStaggerAnimation.test.tsx`
  - Test que aplica delays escalonados correctamente
  - Test que respeta maxDelay
  - Test con IntersectionObserver
  - Test de cleanup al desmontar
  - _Requirements: 3.1_

- [ ] 20. Crear tests de componentes

  - Tests para TransitionDialog
  - Tests para TransitionLink
  - Tests para SharedElement
  - _Requirements: 3.2_

- [ ] 20.1 Tests para TransitionDialog

  - Crear archivo `src/components/ui/__tests__/TransitionDialog.test.tsx`
  - Test que modal se abre con animación
  - Test que modal se cierra con animación

  - Test de diferentes tipos de animación (fade, scale, slide, slideUp, slideDown)
  - Test de detección automática de tipo según dispositivo
  - Test de fallback cuando View Transitions API no está disponible
  - Test que respeta configuración de accesibilidad
  - Test de haptic feedback
  - Test de shared elements
  - _Requirements: 3.2_

- [x] 20.2 Tests para TransitionLink

  - Crear archivo `src/components/ui/__tests__/TransitionLink.test.tsx`
  - Test que ejecuta transición al hacer click
  - Test de detección automática de dirección
  - Test con diferentes speeds
  - Test de haptic feedback
  - Test que mantiene props de Link
  - _Requirements: 3.2_

- [x] 20.3 Tests para SharedElement


  - Crear archivo `src/components/ui/__tests__/SharedElementTransition.test.tsx`
  - Test que aplica view-transition-name correctamente
  - Test que genera nombres únicos

  - Test con múltiples elementos compartidos
  - _Requirements: 3.2_

- [ ] 21. Crear tests de performance

  - Tests de FrameRateMonitor
  - Tests de PerformanceDashboard

  - Tests de optimizaciones
  - _Requirements: 4.3, 4.4_

- [ ] 21.1 Tests de FrameRateMonitor

  - Crear archivo `src/utils/__tests__/frame-rate-monitor.test.ts`
  - Test que mide FPS correctamente
  - Test que calcula promedio correctamente

  - Test que detecta cuando optimizar (FPS < 30)
  - Test de buffer circular
  - _Requirements: 4.3, 4.4_

- [ ] 21.2 Tests de PerformanceDashboard

  - Crear archivo `src/utils/__tests__/performance-dashboard.test.ts`
  - Test que registra métricas correctamente
  - Test que calcula promedios
  - Test que genera reportes
  - _Requirements: 4.3, 4.4_

- [x] 22. Crear documentación completa



  - Documentar uso de hooks
  - Documentar uso de componentes
  - Crear guía de migración
  - Documentar patrones y convenciones
  - Crear troubleshooting guide
  - _Requirements: 3.5, 5.5_


- [x] 22.1 Crear documentación principal


  - Crear archivo `src/components/ui/transitions/README.md`
  - Documentar `useViewTransition` hook con ejemplos completos
  - Documentar `TransitionLink` con ejemplos de uso
  - Documentar `TransitionDialog` con todos los tipos de animación
  - Documentar `SharedElement` con ejemplos
  - Documentar `useStaggerAnimation` con ejemplos
  - Incluir ejemplos de configuración personalizada
  - Documentar speeds disponibles (instant, fast, normal, slow, dramatic)
  - Documentar easings disponibles (enter, exit, bounce, smooth, sharp)
  - _Requirements: 3.5, 5.5_


- [-] 22.2 Crear guía de migración




  - Documentar cómo migrar de Dialog a TransitionDialog
  - Documentar cómo migrar de router.push a useViewTransition
  - Documentar cómo migrar de Link a TransitionLink
  - Incluir ejemplos antes/después
  - Documentar breaking changes (ninguno esperado)
  - _Requirements: 3.5_


- [ ] 22.3 Crear guía de convenciones

  - Documentar cuándo usar cada speed
  - Documentar cuándo usar cada tipo de animación
  - Documentar cuándo usar shared elements
  - Documentar cuándo habilitar haptics
  - Documentar performance budget y límites

  - _Requirements: 5.5_

- [ ] 22.4 Crear troubleshooting guide

  - Documentar problemas comunes y soluciones
  - Documentar cómo debuggear transiciones
  - Documentar cómo usar DebugOverlay
  - Documentar cómo interpretar métricas de performance
  - Documentar fallbacks y compatibilidad
  - _Requirements: 3.5_

- [x] 23. Realizar auditoría final



  - Performance audit completo
  - Accessibility audit
  - Browser compatibility testing
  - Mobile testing
  - _Requirements: 4.3, 4.4_

- [x] 23.1 Performance audit


  - Medir FPS en diferentes dispositivos
  - Medir bundle size del sistema de transiciones
  - Verificar que no exceda 15KB
  - Medir tiempo de carga de animaciones lazy
  - Verificar que transiciones completen en < 500ms
  - Verificar que no haya memory leaks
  - _Requirements: 4.3, 4.4_


- [ ] 23.2 Accessibility audit

  - Verificar que respeta prefers-reduced-motion
  - Verificar focus management durante transiciones
  - Verificar que screen readers anuncien cambios
  - Verificar navegación por teclado
  - Verificar contraste y visibilidad durante transiciones
  - _Requirements: 4.2_


- [ ] 23.3 Browser compatibility testing

  - Probar en Chrome 111+ (View Transitions nativo)
  - Probar en Safari 18+ (View Transitions nativo)
  - Probar en Firefox (fallback a Framer Motion)
  - Probar en Safari < 18 (fallback)
  - Verificar que fallbacks funcionen correctamente

  - _Requirements: 1.2_

- [ ] 23.4 Mobile testing
  - Probar en iOS (Safari)
  - Probar en Android (Chrome)
  - Verificar haptic feedback
  - Verificar animaciones optimizadas para móvil
  - Verificar slideUp en bottom sheets
  - Verificar performance en dispositivos de gama baja
  - _Requirements: 4.1, 4.3_
