# 🎨 Guía de Desarrollo - Tema Neón

## 📚 Índice
1. [Clases CSS Disponibles](#clases-css-disponibles)
2. [Patrones de Uso](#patrones-de-uso)
3. [Componentes Pendientes](#componentes-pendientes)
4. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Clases CSS Disponibles

### Colores Neón (Tailwind)
```css
/* Colores de texto/fondo */
text-neon-cyan      bg-neon-cyan
text-neon-purple    bg-neon-purple
text-neon-pink      bg-neon-pink
text-neon-green     bg-neon-green
text-neon-blue      bg-neon-blue
text-neon-orange    bg-neon-orange
text-neon-yellow    bg-neon-yellow
```

### Sombras Neón (Tailwind)
```css
shadow-neon-cyan
shadow-neon-purple
shadow-neon-pink
shadow-neon-green
shadow-neon-blue
```

### Bordes Neón (Custom CSS)
```css
.neon-border          /* Cyan por defecto */
.neon-border-purple
.neon-border-pink
.neon-border-green
```

### Texto con Glow (Custom CSS)
```css
.neon-text-cyan
.neon-text-purple
.neon-text-pink
.neon-text-green
```

### Gradientes Neón (Custom CSS)
```css
.neon-gradient-cyan-purple    /* Cyan → Purple */
.neon-gradient-pink-orange    /* Pink → Orange */
.neon-gradient-green          /* Green → Cyan */
```

### Efectos Hover (Custom CSS)
```css
.hover-glow-cyan
.hover-glow-purple
.hover-glow-green
```

### Animaciones (Custom CSS)
```css
.animate-pulse-icon      /* Pulse en iconos */
.animate-border-glow     /* Glow en bordes */
.animate-pulse-glow      /* Pulse general (Tailwind) */
.animate-shimmer         /* Efecto shimmer para loading */
```

### Cards Especiales (Custom CSS)
```css
.neon-card              /* Card con borde superior animado */
```

---

## 🔧 Patrones de Uso

### 1. Card Básico con Efecto Neón
```tsx
<div className="
  bg-card-light dark:bg-card-elevated
  border border-gray-200 dark:neon-border
  rounded-xl p-4
  neon-card
  hover-glow-cyan
  transition-all duration-300
">
  {/* Contenido */}
</div>
```

### 2. Título con Efecto Neón
```tsx
<h2 className="
  text-xl font-bold
  text-text-light dark:neon-text-cyan
">
  Título Brillante
</h2>
```

### 3. Badge con Animación
```tsx
<span className="
  px-3 py-1
  text-sm font-semibold
  text-white bg-neon-purple
  rounded-full
  shadow-neon-purple
  animate-pulse
">
  {count}
</span>
```

### 4. Botón Primario
```tsx
<button className="
  neon-gradient-cyan-purple
  text-white
  px-6 py-3
  rounded-lg
  font-medium
  hover:shadow-neon-cyan
  transition-all duration-300
  disabled:opacity-50
">
  Acción Principal
</button>
```

### 5. Botón Secundario
```tsx
<button className="
  bg-card-light dark:bg-card-elevated
  border dark:neon-border
  text-text-light dark:text-neon-cyan
  px-6 py-3
  rounded-lg
  font-medium
  hover:shadow-neon-cyan
  transition-all duration-300
">
  Acción Secundaria
</button>
```

### 6. Icono Activo con Animación
```tsx
<Home className="
  w-6 h-6
  text-neon-cyan
  neon-text-cyan
  animate-pulse-icon
" />
```

### 7. Input con Efecto Neón en Focus
```tsx
<input className="
  w-full px-4 py-2
  bg-white dark:bg-card-elevated
  border border-gray-300 dark:neon-border
  rounded-lg
  text-text-light dark:text-text-dark
  focus:ring-2 focus:ring-neon-cyan
  focus:border-neon-cyan
  focus:shadow-neon-cyan
  transition-all duration-300
" />
```

### 8. Estado de Alerta/Error
```tsx
<div className="
  bg-red-50 dark:bg-red-900/20
  border dark:neon-border-pink
  text-red-600 dark:text-neon-pink
  px-4 py-3
  rounded-lg
">
  ⚠️ Mensaje de error
</div>
```

### 9. Estado de Éxito
```tsx
<div className="
  bg-green-50 dark:bg-green-900/20
  border dark:neon-border-green
  text-green-600 dark:text-neon-green
  px-4 py-3
  rounded-lg
">
  ✓ Operación exitosa
</div>
```

### 10. Loading Skeleton
```tsx
<div className="
  bg-card-light dark:bg-card-elevated
  border dark:neon-border
  rounded-xl p-4
  animate-pulse
">
  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 animate-shimmer" />
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-shimmer" />
</div>
```

---

## 📋 Componentes Pendientes de Actualizar

### Alta Prioridad
- [ ] **Formularios de Login/Registro**
  - Inputs con focus neón
  - Botones con gradientes
  - Mensajes de error con bordes neón

- [ ] **Modales/Dialogs**
  - Overlay con backdrop blur
  - Bordes neón en el modal
  - Botones con efectos neón

- [ ] **Tablas de Datos**
  - Headers con fondo neón sutil
  - Rows con hover glow
  - Bordes neón en la tabla

### Prioridad Media
- [ ] **Toast Notifications**
  - Diferentes colores según tipo
  - Animación de entrada/salida
  - Bordes neón según severidad

- [ ] **Dropdowns/Select**
  - Menú con fondo card-elevated
  - Bordes neón
  - Items con hover glow

- [ ] **Tabs/Pestañas**
  - Tab activo con borde inferior neón
  - Animación de transición
  - Hover effects

### Prioridad Baja
- [ ] **Tooltips**
  - Fondo card-elevated
  - Borde neón sutil
  - Animación fade-in

- [ ] **Progress Bars**
  - Barra con gradiente neón
  - Animación de progreso
  - Glow effect

- [ ] **Switches/Toggles**
  - Estado activo con color neón
  - Animación suave
  - Glow en estado activo

---

## ✅ Mejores Prácticas

### 1. Uso de Colores
```tsx
// ✅ CORRECTO: Usar colores neón solo en modo oscuro
className="text-gray-900 dark:text-neon-cyan"

// ❌ INCORRECTO: Usar colores neón en modo claro
className="text-neon-cyan"
```

### 2. Animaciones
```tsx
// ✅ CORRECTO: Animaciones sutiles
className="animate-pulse-icon"  // 2s loop

// ❌ INCORRECTO: Animaciones muy rápidas o invasivas
className="animate-spin"  // Puede marear
```

### 3. Contraste
```tsx
// ✅ CORRECTO: Alto contraste en modo oscuro
className="bg-card-elevated text-text-dark"

// ❌ INCORRECTO: Bajo contraste
className="bg-gray-800 text-gray-700"
```

### 4. Transiciones
```tsx
// ✅ CORRECTO: Transiciones suaves
className="transition-all duration-300"

// ❌ INCORRECTO: Sin transiciones
className=""  // Cambios abruptos
```

### 5. Jerarquía Visual
```tsx
// ✅ CORRECTO: Usar diferentes niveles de elevación
<div className="bg-background-dark">
  <div className="bg-card-dark">
    <div className="bg-card-elevated">
      {/* Contenido */}
    </div>
  </div>
</div>

// ❌ INCORRECTO: Todo al mismo nivel
<div className="bg-card-dark">
  <div className="bg-card-dark">
    {/* Sin jerarquía */}
  </div>
</div>
```

### 6. Efectos Hover
```tsx
// ✅ CORRECTO: Hover sutil pero visible
className="hover-glow-cyan transition-all"

// ❌ INCORRECTO: Hover muy intenso
className="hover:shadow-[0_0_100px_rgba(0,240,255,1)]"
```

### 7. Accesibilidad
```tsx
// ✅ CORRECTO: Mantener legibilidad
className="text-text-light dark:text-text-dark"

// ❌ INCORRECTO: Texto difícil de leer
className="text-neon-cyan"  // Puede ser difícil de leer en párrafos largos
```

---

## 🎨 Paleta de Colores por Contexto

### Navegación
- **Activo**: Cyan (`#00F0FF`)
- **Hover**: Cyan con glow
- **Inactivo**: Gris secundario

### Acciones
- **Primaria**: Gradiente Cyan-Purple
- **Secundaria**: Borde Cyan
- **Peligro**: Gradiente Pink-Orange
- **Éxito**: Gradiente Green-Cyan

### Estados
- **Info**: Blue (`#4D4DFF`)
- **Success**: Green (`#39FF14`)
- **Warning**: Orange (`#FF9500`)
- **Error**: Pink (`#FF006E`)

### Categorías
- **Home**: Cyan
- **Scanner**: Purple
- **Loans**: Green
- **Consumables**: Orange
- **Profile**: Pink

---

## 🚀 Ejemplo Completo: Actualizar un Componente

### Antes (Sin tema neón):
```tsx
export function MyComponent() {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Título
      </h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Acción
      </button>
    </div>
  )
}
```

### Después (Con tema neón):
```tsx
export function MyComponent() {
  return (
    <div className="
      bg-card-light dark:bg-card-elevated
      p-4 rounded-lg
      border border-gray-200 dark:neon-border
      neon-card
      hover-glow-cyan
      transition-all duration-300
    ">
      <h2 className="
        text-xl font-bold
        text-text-light dark:neon-text-cyan
        mb-4
      ">
        Título
      </h2>
      <button className="
        neon-gradient-cyan-purple
        text-white
        px-4 py-2
        rounded-lg
        font-medium
        hover:shadow-neon-cyan
        transition-all duration-300
      ">
        Acción
      </button>
    </div>
  )
}
```

---

## 📝 Checklist para Actualizar un Componente

- [ ] Cambiar `bg-white` por `bg-card-light`
- [ ] Cambiar `dark:bg-gray-800` por `dark:bg-card-elevated`
- [ ] Agregar `dark:neon-border` a los bordes
- [ ] Usar `neon-text-cyan` para títulos importantes
- [ ] Agregar `hover-glow-cyan` a elementos interactivos
- [ ] Incluir `transition-all duration-300` para suavidad
- [ ] Usar gradientes neón en botones primarios
- [ ] Agregar `neon-card` a cards principales
- [ ] Implementar animaciones sutiles donde sea apropiado
- [ ] Verificar contraste y legibilidad
- [ ] Probar en modo claro y oscuro

---

**💡 Tip**: Siempre prueba los cambios en ambos modos (claro y oscuro) para asegurar una experiencia consistente.

**🎯 Objetivo**: Crear una interfaz moderna y futurista sin sacrificar usabilidad y accesibilidad.
