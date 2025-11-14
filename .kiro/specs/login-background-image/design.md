# Design Document

## Overview

Este diseño implementa una imagen de fondo personalizada en la página de login del sistema "Inventario Academia". La solución utiliza CSS moderno con Tailwind para crear una experiencia visual atractiva mientras mantiene la funcionalidad, legibilidad y rendimiento del formulario de login.

La imagen muestra un gradiente de colores (coral a azul) con una ilustración de trabajadores industriales y un almacén, proporcionando contexto visual relevante para un sistema de gestión de inventario.

## Architecture

### Component Structure

La página de login está implementada como un componente cliente de Next.js en `src/app/login/page.tsx`. La arquitectura actual se mantendrá, agregando únicamente:

1. **Imagen de fondo**: Se guardará en `/public/images/login-background.jpg`
2. **Capa de contenedor**: El div principal se modificará para incluir la imagen de fondo
3. **Overlay opcional**: Se agregará un overlay semi-transparente para mejorar el contraste del formulario

### File Structure

```
public/
  └── images/
      └── login-background.jpg  (nueva imagen)
src/
  └── app/
      └── login/
          └── page.tsx  (modificado)
```

## Components and Interfaces

### LoginPage Component - Estructura Actualizada

**Cambios en el contenedor principal:**

```tsx
// ANTES
<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div className="max-w-md w-full">
    {/* Formulario */}
  </div>
</div>

// DESPUÉS
<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-cover bg-center bg-no-repeat"
     style={{ backgroundImage: 'url(/images/login-background.jpg)' }}>
  {/* Overlay para mejorar contraste */}
  <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
  
  {/* Contenedor del formulario con z-index para estar sobre el overlay */}
  <div className="max-w-md w-full relative z-10">
    {/* Formulario con fondo más opaco */}
    <div className="bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-2xl p-8 backdrop-blur-sm">
      {/* Contenido del formulario */}
    </div>
  </div>
</div>
```

### Styling Strategy

#### 1. Background Image
- **Clase**: `bg-cover bg-center bg-no-repeat`
- **Inline Style**: `backgroundImage: 'url(/images/login-background.jpg)'`
- **Razón**: Next.js Image component no es ideal para backgrounds, usar CSS es más simple y efectivo

#### 2. Overlay Layer
- **Clase**: `bg-black/20 dark:bg-black/40`
- **Propósito**: Oscurecer ligeramente la imagen para mejorar el contraste del formulario
- **Responsive**: Más oscuro en modo oscuro para mantener coherencia visual

#### 3. Form Container Enhancement
- **Antes**: `bg-card-light dark:bg-card-dark`
- **Después**: `bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm`
- **Mejoras**:
  - Opacidad 95% para ver sutilmente el fondo
  - `backdrop-blur-sm` para efecto glassmorphism
  - `shadow-2xl` para mayor profundidad visual

#### 4. Z-Index Management
- Overlay: `z-0` (implícito)
- Form container: `z-10` (explícito)
- Asegura que el formulario esté siempre sobre el overlay

### Responsive Design

La imagen se adaptará automáticamente a diferentes tamaños de pantalla:

- **Desktop**: Imagen completa visible con formulario centrado
- **Tablet**: Imagen adaptada con `bg-cover`, formulario centrado
- **Mobile**: Imagen adaptada, formulario ocupa la mayoría del ancho disponible

El `bg-cover` asegura que la imagen siempre cubra el contenedor sin distorsión.

## Data Models

No se requieren cambios en los modelos de datos. Esta es una actualización puramente visual.

## Error Handling

### Image Loading Fallback

Si la imagen no carga, el navegador mostrará el color de fondo definido en las clases de Tailwind:

```tsx
className="min-h-screen ... bg-gradient-to-br from-red-400 via-purple-400 to-blue-500"
```

Este gradiente CSS replica los colores de la imagen como fallback.

### Error States del Formulario

Los mensajes de error existentes se mantendrán sin cambios. El fondo más opaco del formulario asegura que sean legibles.

## Performance Optimization

### Image Optimization

1. **Formato**: Convertir la imagen a WebP para mejor compresión
2. **Tamaño**: Optimizar a máximo 1920x1080px (Full HD)
3. **Compresión**: Calidad 80-85% para balance entre calidad y tamaño
4. **Tamaño objetivo**: < 200KB

### Loading Strategy

```tsx
// Agregar preload en el head (opcional, para mejor rendimiento)
<link rel="preload" as="image" href="/images/login-background.jpg" />
```

Esto se puede agregar en un `<Head>` component si se nota lag en la carga.

### CSS Optimization

Las clases de Tailwind se compilarán en el bundle CSS, sin overhead adicional.

## Accessibility

### Implementación

1. **Decorative Image**: La imagen de fondo es decorativa, no requiere alt text
2. **Contrast Ratio**: El overlay y el fondo opaco del formulario aseguran contraste adecuado
3. **Keyboard Navigation**: No se afecta, el formulario mantiene su orden de tabulación
4. **Screen Readers**: La imagen no interfiere con la lectura del contenido

### Contrast Testing

Verificar que todos los elementos de texto cumplan con WCAG 2.1 AA:
- Texto normal: ratio mínimo 4.5:1
- Texto grande: ratio mínimo 3:1

El fondo `bg-white/95` sobre el overlay oscuro proporciona contraste suficiente.

## Theme Compatibility

### Light Mode
```tsx
<div className="bg-black/20">  {/* Overlay sutil */}
  <div className="bg-white/95">  {/* Formulario casi opaco */}
```

### Dark Mode
```tsx
<div className="dark:bg-black/40">  {/* Overlay más oscuro */}
  <div className="dark:bg-gray-900/95">  {/* Formulario oscuro casi opaco */}
```

La transición entre temas es manejada automáticamente por Tailwind.

## Testing Strategy

### Visual Testing Checklist

1. **Desktop (1920x1080)**
   - Verificar que la imagen cubra toda la pantalla
   - Verificar que el formulario esté centrado
   - Verificar legibilidad en ambos temas

2. **Tablet (768x1024)**
   - Verificar adaptación de la imagen
   - Verificar que el formulario sea accesible
   - Verificar espaciado adecuado

3. **Mobile (375x667)**
   - Verificar que la imagen se adapte sin distorsión
   - Verificar que el formulario sea usable
   - Verificar que todos los elementos sean táctiles

### Functional Testing

1. **Login Flow**
   - Verificar que el login funcione correctamente
   - Verificar que los errores se muestren claramente
   - Verificar redirección después del login

2. **Theme Switching**
   - Cambiar entre tema claro y oscuro
   - Verificar transición suave
   - Verificar contraste en ambos temas

3. **Performance**
   - Medir tiempo de carga de la página
   - Verificar que sea < 2 segundos en conexión 3G
   - Verificar que la imagen no bloquee la interacción

### Browser Compatibility

Probar en:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Accessibility Testing

1. **Contrast Checker**: Usar herramientas como WebAIM Contrast Checker
2. **Screen Reader**: Probar con NVDA/JAWS (Windows) o VoiceOver (Mac)
3. **Keyboard Navigation**: Verificar que Tab/Shift+Tab funcionen correctamente
4. **Zoom**: Probar con zoom del navegador al 200%

## Implementation Notes

### Step-by-Step Process

1. Guardar la imagen en `/public/images/login-background.jpg`
2. Optimizar la imagen (convertir a WebP si es posible)
3. Modificar el componente LoginPage con las nuevas clases
4. Probar en ambos temas
5. Verificar responsive en diferentes dispositivos
6. Validar accesibilidad y contraste

### Rollback Plan

Si hay problemas, simplemente revertir los cambios en `page.tsx`. La imagen en `/public` no afecta nada si no se referencia.

## Alternative Approaches Considered

### 1. Next.js Image Component
**Rechazado**: No es ideal para backgrounds, requiere más código y no ofrece ventajas significativas para este caso.

### 2. CSS Background en archivo separado
**Rechazado**: Tailwind inline es más mantenible y permite fácil ajuste de responsive.

### 3. Video Background
**Rechazado**: Overhead de rendimiento innecesario para una página de login.

### 4. Gradiente CSS puro (sin imagen)
**Considerado como fallback**: Implementado como backup si la imagen no carga.
