# Design Document

## Overview

Este documento detalla el diseño de una landing page profesional para "Inventario Academia". La página reemplazará la funcionalidad actual de redirección automática en `/` con una experiencia de bienvenida completa que presenta el sistema, sus características y beneficios.

La landing page seguirá los principios de diseño moderno: limpia, responsive, accesible y con animaciones sutiles que mejoren la experiencia sin distraer. Utilizará el sistema de diseño existente (Tailwind CSS, tema claro/oscuro) para mantener consistencia con el resto de la aplicación.

## Architecture

### Component Structure

```
src/app/page.tsx (Landing Page - reemplaza el actual)
src/components/landing/
  ├── HeroSection.tsx
  ├── FeaturesSection.tsx
  ├── BenefitsSection.tsx
  ├── TechnologySection.tsx
  ├── CTASection.tsx
  ├── Navigation.tsx
  └── Footer.tsx
```

### Routing

- `/` - Landing page (nueva implementación)
- `/login` - Página de login (sin cambios)
- `/dashboard` - Dashboard de usuario (sin cambios)
- `/admin/dashboard` - Dashboard de admin (sin cambios)

La lógica de redirección automática se eliminará. Los usuarios autenticados que visiten `/` verán la landing page con opciones para ir a su dashboard.

## Components and Interfaces

### 1. Navigation Component

**Propósito:** Barra de navegación fija en la parte superior

**Props:**
```typescript
interface NavigationProps {
  // No props necesarios, usa hooks para estado de autenticación
}
```

**Estructura:**
```tsx
<nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b">
  <div className="container mx-auto px-4 py-4 flex justify-between items-center">
    <div className="flex items-center space-x-2">
      <span className="text-2xl">🎓</span>
      <span className="text-xl font-bold">Inventario Academia</span>
    </div>
    <Button href="/login">Iniciar Sesión</Button>
  </div>
</nav>
```

**Comportamiento:**
- Sticky positioning
- Backdrop blur para efecto glassmorphism
- Muestra "Ir al Dashboard" si el usuario está autenticado

### 2. HeroSection Component

**Propósito:** Sección principal con título, descripción y CTAs

**Estructura:**
```tsx
<section className="min-h-screen flex items-center justify-center pt-20 px-4">
  <div className="container mx-auto text-center">
    <h1 className="text-5xl md:text-7xl font-bold mb-6">
      🎓 Inventario Academia
    </h1>
    <h2 className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-4">
      Sistema de Gestión de Inventario
    </h2>
    <p className="text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
      Solución completa para instituciones educativas. Gestiona herramientas,
      consumibles y préstamos de forma eficiente y profesional.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg" href="/login">Iniciar Sesión</Button>
      <Button size="lg" variant="outline" onClick={scrollToFeatures}>
        Conocer Más
      </Button>
    </div>
  </div>
</section>
```

**Animaciones:**
- Fade in del título con delay escalonado
- Slide up de los botones

### 3. FeaturesSection Component

**Propósito:** Mostrar características principales en tarjetas

**Data Structure:**
```typescript
interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <QrCodeIcon />,
    title: "Escaneo QR",
    description: "Préstamos y devoluciones rápidas mediante códigos QR"
  },
  {
    icon: <ChartIcon />,
    title: "Dashboard Intuitivo",
    description: "Visualiza estadísticas y gestiona operaciones fácilmente"
  },
  // ... más características
]
```

**Estructura:**
```tsx
<section className="py-20 px-4">
  <div className="container mx-auto">
    <h2 className="text-4xl font-bold text-center mb-12">
      Características Principales
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  </div>
</section>
```

**FeatureCard Sub-component:**
```tsx
<div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
  <div className="text-primary text-4xl mb-4">{icon}</div>
  <h3 className="text-xl font-bold mb-2">{title}</h3>
  <p className="text-gray-600 dark:text-gray-300">{description}</p>
</div>
```

### 4. BenefitsSection Component

**Propósito:** Mostrar beneficios separados por rol

**Estructura:**
```tsx
<section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
  <div className="container mx-auto">
    <h2 className="text-4xl font-bold text-center mb-12">
      Diseñado para Todos
    </h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <BenefitColumn
        title="Para Usuarios"
        icon="👤"
        benefits={userBenefits}
      />
      <BenefitColumn
        title="Para Administradores"
        icon="👨‍💼"
        benefits={adminBenefits}
      />
    </div>
  </div>
</section>
```

**BenefitColumn Sub-component:**
```tsx
<div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
  <div className="flex items-center mb-6">
    <span className="text-4xl mr-3">{icon}</span>
    <h3 className="text-2xl font-bold">{title}</h3>
  </div>
  <ul className="space-y-4">
    {benefits.map((benefit, index) => (
      <li key={index} className="flex items-start">
        <CheckIcon className="text-green-500 mr-2 mt-1" />
        <span>{benefit}</span>
      </li>
    ))}
  </ul>
</div>
```

### 5. TechnologySection Component

**Propósito:** Mostrar stack tecnológico y aspectos de seguridad

**Estructura:**
```tsx
<section className="py-20 px-4">
  <div className="container mx-auto">
    <h2 className="text-4xl font-bold text-center mb-12">
      Tecnología Confiable
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <h3 className="text-2xl font-bold mb-6">Stack Moderno</h3>
        <div className="grid grid-cols-2 gap-4">
          {technologies.map((tech) => (
            <TechBadge key={tech.name} {...tech} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-6">Seguridad Garantizada</h3>
        <ul className="space-y-4">
          {securityFeatures.map((feature) => (
            <li className="flex items-start">
              <ShieldIcon className="text-green-500 mr-2 mt-1" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</section>
```

### 6. CTASection Component

**Propósito:** Call-to-action final

**Estructura:**
```tsx
<section className="py-20 px-4 bg-primary text-white">
  <div className="container mx-auto text-center">
    <h2 className="text-4xl font-bold mb-6">
      ¿Listo para Optimizar tu Inventario?
    </h2>
    <p className="text-xl mb-8 max-w-2xl mx-auto">
      Únete a las instituciones que ya confían en Inventario Academia
      para gestionar sus recursos de forma eficiente.
    </p>
    <Button size="lg" variant="secondary" href="/login">
      Comenzar Ahora
    </Button>
  </div>
</section>
```

### 7. Footer Component

**Propósito:** Footer con información básica

**Estructura:**
```tsx
<footer className="py-8 px-4 bg-gray-900 text-white">
  <div className="container mx-auto text-center">
    <div className="mb-4">
      <span className="text-2xl">🎓</span>
      <span className="text-xl font-bold ml-2">Inventario Academia</span>
    </div>
    <p className="text-gray-400 mb-2">
      Sistema de Gestión de Inventario para Instituciones Educativas
    </p>
    <p className="text-gray-500 text-sm">
      Versión 10.0 | © 2025 Angel Rosario
    </p>
  </div>
</footer>
```

## Data Models

### Feature Data
```typescript
interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}
```

### Technology Data
```typescript
interface Technology {
  name: string
  icon: string | React.ReactNode
  description?: string
}
```

### Benefit Data
```typescript
type Benefit = string

interface BenefitGroup {
  title: string
  icon: string
  benefits: Benefit[]
}
```

## Styling and Theme

### Color Palette
- **Primary:** Usar variable `--color-primary` del tema existente
- **Background:** `bg-white dark:bg-gray-900`
- **Cards:** `bg-card-light dark:bg-card-dark`
- **Text:** `text-gray-900 dark:text-white`
- **Secondary Text:** `text-gray-600 dark:text-gray-300`

### Typography
- **Hero Title:** `text-5xl md:text-7xl font-bold`
- **Section Titles:** `text-4xl font-bold`
- **Subsection Titles:** `text-2xl font-bold`
- **Body:** `text-base md:text-lg`

### Spacing
- **Section Padding:** `py-20 px-4`
- **Container:** `container mx-auto max-w-7xl`
- **Card Gaps:** `gap-8` (desktop), `gap-4` (mobile)

## Animations

### Scroll Animations
Usar Intersection Observer API para detectar cuando elementos entran en viewport:

```typescript
const useScrollAnimation = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
```

### Animation Classes
```css
.fade-in {
  animation: fadeIn 0.6s ease-in;
}

.slide-up {
  animation: slideUp 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Respecting User Preferences
```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

// Aplicar animaciones solo si el usuario no prefiere movimiento reducido
const animationClass = prefersReducedMotion ? '' : 'fade-in'
```

## Error Handling

No hay manejo de errores complejo ya que es una página estática. Los únicos posibles errores son:
- Navegación fallida: manejada por Next.js router
- Imágenes no cargadas: usar fallbacks o iconos SVG inline

## Testing Strategy

### Manual Testing
1. **Responsive Design:**
   - Probar en mobile (320px, 375px, 414px)
   - Probar en tablet (768px, 1024px)
   - Probar en desktop (1280px, 1920px)

2. **Theme Testing:**
   - Verificar en modo claro
   - Verificar en modo oscuro
   - Verificar transiciones entre temas

3. **Navigation Testing:**
   - Verificar scroll suave
   - Verificar sticky navigation
   - Verificar todos los enlaces

4. **Animation Testing:**
   - Verificar animaciones en scroll
   - Verificar hover effects
   - Verificar con prefers-reduced-motion

5. **Accessibility Testing:**
   - Navegación con teclado (Tab, Enter)
   - Lectores de pantalla (NVDA, JAWS)
   - Contraste de colores (WCAG AA)
   - Orden de lectura lógico

### Browser Compatibility
- Chrome (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Edge (últimas 2 versiones)

### Performance Testing
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1
