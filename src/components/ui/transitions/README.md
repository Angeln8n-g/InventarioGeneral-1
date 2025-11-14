# View Transitions System

Sistema completo de transiciones de vista para la aplicación, proporcionando animaciones suaves, contextuales y optimizadas.

## Tabla de Contenidos

- [Hooks](#hooks)
- [Componentes](#componentes)
- [Utilidades](#utilidades)
- [Configuración](#configuración)
- [Ejemplos](#ejemplos)

## Hooks

### useViewTransition

Hook principal para ejecutar transiciones de navegación.

```tsx
import { useViewTransition } from '@/hooks/useViewTransition';

function MyComponent() {
  const { startTransition, isTransitioning } = useViewTransition({
    speed: 'normal',
    direction: 'forward',
    enableHaptics: true,
  });

  const handleNavigate = () => {
    startTransition(() => router.push('/next-page'));
  };

  return (
    <button onClick={handleNavigate} disabled={isTransitioning}>
      Navegar
    </button>
  );
}
```

**Opciones:**
- `speed`: 'instant' | 'fast' | 'normal' | 'slow' | 'dramatic'
- `direction`: 'forward' | 'backward' | 'lateral' | 'auto'
- `enableHaptics`: boolean - Habilita feedback háptico
- `onStart`, `onComplete`, `onError`: Callbacks

### useStaggerAnimation

Hook para aplicar animaciones escalonadas a listas.

```tsx
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';

function ProductList() {
  const containerRef = useStaggerAnimation<HTMLDivElement>({
    delay: 50,
    maxDelay: 300,
    direction: 'forward',
    animateOnScroll: true,
  });

  return (
    <div ref={containerRef}>
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
```

## Componentes

### TransitionDialog

Modal con transiciones contextuales.

```tsx
import { TransitionDialog } from '@/components/ui/TransitionDialog';

function MyModal({ isOpen, onClose }) {
  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="scale"
      speed="normal"
      enableHaptics={true}
      title="Mi Modal"
    >
      <div className="p-6">
        Contenido del modal
      </div>
    </TransitionDialog>
  );
}
```

**Tipos de Animación:**
- `auto`: Detecta automáticamente (slideUp en móvil, scale en desktop)
- `fade`: Desvanecimiento simple
- `scale`: Escala desde el centro (o desde origen si se proporciona)
- `slide`: Deslizamiento horizontal
- `slideUp`: Deslizamiento desde abajo (bottom sheet)
- `slideDown`: Deslizamiento desde arriba

### TransitionLink

Link con transiciones automáticas.

```tsx
import { TransitionLink } from '@/components/ui/TransitionLink';

function Navigation() {
  return (
    <TransitionLink
      href="/dashboard"
      speed="fast"
      direction="auto"
      enableHaptics={true}
    >
      Dashboard
    </TransitionLink>
  );
}
```

### SharedElementTransition

Componente para elementos compartidos entre vistas.

```tsx
import { SharedElementTransition } from '@/components/ui/SharedElementTransition';

function ProductCard({ product }) {
  return (
    <SharedElementTransition id={`product-${product.id}`}>
      <img src={product.image} alt={product.name} />
    </SharedElementTransition>
  );
}
```

## Utilidades

### Haptic Feedback

```tsx
import { 
  hapticLight, 
  hapticMedium, 
  hapticSuccess,
  HapticFeedback 
} from '@/utils/haptic-feedback';

// Uso simple
hapticLight(); // Vibración ligera
hapticMedium(); // Vibración media
hapticSuccess(); // Patrón de éxito

// Configuración avanzada
HapticFeedback.configure({
  enabled: true,
  intensity: 0.8,
});
```

### Stagger Animations

```tsx
import { createStaggerAnimation } from '@/utils/stagger-animation';

const elements = document.querySelectorAll('.item');
createStaggerAnimation(Array.from(elements), {
  delay: 50,
  maxDelay: 300,
  direction: 'forward',
});
```

## Configuración

### Speeds Disponibles

- **instant** (0ms): Sin animación
- **fast** (150ms): Feedback inmediato
- **normal** (250ms): Transiciones estándar
- **slow** (400ms): Transiciones enfatizadas
- **dramatic** (600ms): Transiciones dramáticas

### Easings Disponibles

- **enter**: cubic-bezier(0.4, 0, 0.2, 1) - Entrada suave
- **exit**: cubic-bezier(0.4, 0, 1, 1) - Salida rápida
- **bounce**: cubic-bezier(0.68, -0.55, 0.265, 1.55) - Rebote
- **smooth**: cubic-bezier(0.4, 0, 0.2, 1) - Suave
- **sharp**: cubic-bezier(0.4, 0, 0.6, 1) - Afilado

## Ejemplos

### Navegación con Transición

```tsx
function Dashboard() {
  const { startTransition } = useViewTransition({ 
    speed: 'fast',
    direction: 'forward' 
  });

  const handleNavigate = (path: string) => {
    startTransition(() => router.push(path));
  };

  return (
    <div>
      <button onClick={() => handleNavigate('/profile')}>
        Ver Perfil
      </button>
    </div>
  );
}
```

### Modal con Origen

```tsx
function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { origin, captureOrigin, resetOrigin } = useModalOrigin();

  return (
    <>
      {products.map(product => (
        <button
          key={product.id}
          onClick={(e) => {
            captureOrigin(e);
            setSelectedProduct(product);
          }}
        >
          {product.name}
        </button>
      ))}

      <TransitionDialog
        open={!!selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          resetOrigin();
        }}
        animationType="scale"
        origin={origin}
      >
        {/* Contenido */}
      </TransitionDialog>
    </>
  );
}
```

### Lista con Stagger

```tsx
function ToolsList() {
  const listRef = useStaggerAnimation<HTMLDivElement>({
    delay: 50,
    maxDelay: 300,
    animateOnScroll: true,
    threshold: 0.1,
  });

  return (
    <div ref={listRef} className="grid grid-cols-3 gap-4">
      {tools.map(tool => (
        <ToolCard key={tool.id} {...tool} />
      ))}
    </div>
  );
}
```

## Performance

El sistema incluye optimizaciones automáticas:

- **Detección de dispositivo**: Ajusta duraciones según capacidades
- **Throttling**: Limita transiciones concurrentes a 3
- **Lazy loading**: Carga animaciones complejas bajo demanda
- **FPS monitoring**: Simplifica animaciones si FPS < 30
- **Reduced motion**: Respeta preferencias de accesibilidad

## Accesibilidad

- Respeta `prefers-reduced-motion`
- Mantiene focus management
- Proporciona feedback háptico opcional
- Timeouts de seguridad (500ms máximo)

## Troubleshooting

### Las transiciones no funcionan

1. Verifica que `ViewTransitionsProvider` esté en el layout raíz
2. Comprueba que el navegador soporte View Transitions API
3. Revisa que `prefers-reduced-motion` no esté activado

### Transiciones lentas

1. Verifica el FPS con `PerformanceMonitor` (solo desarrollo)
2. Reduce el número de transiciones concurrentes
3. Usa speeds más rápidos ('fast' o 'instant')

### Modales no animan

1. Asegúrate de usar `TransitionDialog` en lugar de `Dialog`
2. Verifica que `animationType` sea válido
3. Comprueba que el modal esté dentro de `ViewTransitionsProvider`
