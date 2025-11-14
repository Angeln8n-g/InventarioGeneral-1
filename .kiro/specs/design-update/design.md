# Diseño - Actualización de Esquema de Colores

## Arquitectura de Colores

### Sistema de Colores

El nuevo esquema de colores está basado en variables de Tailwind CSS personalizadas que soportan modo claro y oscuro automáticamente.

### Configuración de Tailwind

```javascript
colors: {
  primary: '#8B5CF6',              // Púrpura principal
  'background-light': '#F8FAFC',   // Fondo claro
  'background-dark': '#1A1A2E',    // Fondo oscuro
  'card-light': '#FFFFFF',         // Tarjetas claras
  'card-dark': '#2B2B45',          // Tarjetas oscuras
  'text-light': '#1E293B',         // Texto claro
  'text-dark': '#E0E0E0',          // Texto oscuro
  'text-secondary-light': '#64748B', // Texto secundario claro
  'text-secondary-dark': '#B0B0B0',  // Texto secundario oscuro
  'blue-accent': '#3B82F6',        // Acento azul
  'green-accent': '#22C55E',       // Acento verde
  'yellow-accent': '#EAB308',      // Acento amarillo
  'red-accent': '#EF4444',         // Acento rojo
}
```

## Componentes Actualizados

### 1. Configuración Global

- **Archivo**: `tailwind.config.js`
- **Cambios**: Agregado `darkMode: 'class'` y colores personalizados
- **Fuente**: Roboto como fuente principal

### 2. Estilos Globales

- **Archivo**: `src/app/globals.css`
- **Cambios**:
  - Importación de Google Fonts (Roboto)
  - Importación de Material Icons
  - Clases base para body con soporte dark mode

### 3. Layout Principal

- **Archivo**: `src/app/layout.tsx`
- **Cambios**: Agregada clase `dark` al elemento `<html>`

### 4. Dashboard de Admin

- **Archivo**: `src/app/admin/dashboard/page.tsx`
- **Cambios**:
  - StatsCard actualizado con nuevos colores
  - Fondos de tarjetas con soporte dark mode
  - Iconos con colores de acento

### 5. Header

- **Archivo**: `src/components/layout/Header.tsx`
- **Cambios**:
  - Fondo con `bg-card-light dark:bg-card-dark`
  - Iconos con colores de acento
  - Menú desplegable con soporte dark mode

## Patrones de Uso

### Fondos

```tsx
// Fondo principal
className = "bg-background-light dark:bg-background-dark";

// Tarjetas
className = "bg-card-light dark:bg-card-dark";
```

### Texto

```tsx
// Texto principal
className = "text-text-light dark:text-text-dark";

// Texto secundario
className = "text-text-secondary-light dark:text-text-secondary-dark";
```

### Acentos

```tsx
// Iconos y elementos destacados
className = "text-blue-accent";
className = "text-green-accent";
className = "text-yellow-accent";
className = "text-red-accent";
className = "text-primary";
```

### Fondos de Iconos

```tsx
// Con transparencia para dark mode
className = "bg-blue-100 dark:bg-blue-900/50";
className = "bg-green-100 dark:bg-green-900/50";
className = "bg-yellow-100 dark:bg-yellow-900/50";
className = "bg-red-100 dark:bg-red-900/50";
className = "bg-purple-100 dark:bg-purple-900/50";
```

## ✅ Componentes Completados con Tema Neón

### Dashboard
- ✅ MobileHeader - Efectos neón, iconos Lucide, animaciones
- ✅ ActiveLoansSection - Cards neón, estados con animaciones
- ✅ LoanCard - Gradientes neón, hover effects, iconos Lucide
- ✅ BottomNavigation - Iconos Lucide con colores neón individuales

### Layout
- ✅ Header - Bordes neón, sombras, menú con efectos
- ✅ MobileNavigation - Tema neón aplicado

### UI Components
- ✅ Button - Variantes con gradientes neón

### Estilos Globales
- ✅ globals.css - Clases CSS neón personalizadas
- ✅ tailwind.config.js - Colores, sombras y animaciones neón

## 📋 Próximos Pasos Opcionales

- Actualizar formularios con inputs neón en focus
- Actualizar tablas con hover effects neón
- Actualizar modales con bordes neón
- Agregar toast notifications con efectos neón
- Implementar loading states con spinners neón
