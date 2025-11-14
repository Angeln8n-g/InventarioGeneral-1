# Design Document

## Overview

Este documento detalla las soluciones para tres bugs identificados:
1. Tema oscuro no aplicado correctamente en la página del scanner
2. Falta de favicon en la aplicación
3. Lógica de notificaciones no funcional (el botón no abre el dropdown)

## Architecture

No se requieren cambios arquitectónicos. Las soluciones son correcciones puntuales en componentes existentes.

## Components and Interfaces

### 1. Scanner Page - Corrección de Tema Oscuro

**Problema Identificado:**
La página del scanner (`src/app/scanner/page.tsx`) ya tiene clases de tema oscuro implementadas correctamente. El problema puede estar en:
- Estilos CSS globales que no se están aplicando
- Clases de Tailwind que necesitan ajustes
- El header rojo que no se adapta al tema oscuro

**Solución:**
Revisar y ajustar las clases específicas que no se están aplicando correctamente. Las tarjetas ya usan:
- `dark:bg-card-elevated` - Correcto
- `dark:neon-border` - Correcto
- `dark:text-neon-cyan` - Correcto

El problema principal parece estar en el fondo general de la página. Necesitamos asegurar que el contenedor principal tenga:
```tsx
className="min-h-screen bg-background-light dark:bg-background-dark"
```

### 2. Favicon Implementation

**Problema Identificado:**
- No existe favicon configurado
- Error en consola: `GET /favicon.ico 404`
- Next.js busca automáticamente `favicon.ico` en la carpeta `public` o `app`

**Solución:**
Next.js 15 soporta múltiples formas de agregar favicons:

**Opción 1: Usar emoji como favicon (Recomendado para MVP)**
Crear archivo `src/app/icon.tsx`:
```tsx
import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#E30613',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}
      >
        🎓
      </div>
    ),
    {
      ...size,
    }
  )
}
```

**Opción 2: Usar archivo estático**
Colocar `favicon.ico` en la carpeta `public/` o `src/app/`

### 3. Notifications Dropdown - Corrección de Lógica

**Problema Identificado:**
El botón de notificaciones en el Header no tiene funcionalidad de click. Solo muestra el contador pero no abre ningún dropdown.

**Análisis del código actual:**
```tsx
<button className="relative p-2 rounded-full hover:bg-red-700 transition-all">
  {/* No tiene onClick handler */}
</button>
```

**Solución:**
1. Agregar estado para controlar el dropdown
2. Importar y usar el componente `NotificationsDropdown` existente
3. Implementar handlers para marcar notificaciones como leídas
4. Agregar lógica de cierre al hacer click fuera

**Código actualizado:**
```tsx
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown'

// Agregar estado
const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)

// Agregar handlers
const handleMarkAsRead = async (id: number) => {
  try {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    // Refetch notifications
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

const handleMarkAllAsRead = async () => {
  try {
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    // Refetch notifications
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

// Actualizar botón
<button 
  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
  className="relative p-2 rounded-full hover:bg-red-700 transition-all"
>
  {/* ... */}
</button>

// Agregar dropdown
<NotificationsDropdown
  isOpen={showNotificationsDropdown}
  onClose={() => setShowNotificationsDropdown(false)}
  notifications={notifications.map(n => ({
    id: n.id,
    type: n.type || 'info',
    title: n.title,
    message: n.message,
    timestamp: n.created_at,
    read: n.is_read,
  }))}
  onMarkAsRead={handleMarkAsRead}
  onMarkAllAsRead={handleMarkAllAsRead}
/>
```

## Data Models

### Notification Interface (ya existe)
```typescript
interface Notification {
  id: number
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}
```

## Error Handling

### Scanner Theme
- Si las clases de tema oscuro no se aplican, verificar que el ThemeProvider esté correctamente configurado
- Asegurar que Tailwind esté compilando las clases dark:*

### Favicon
- Si el favicon no se muestra, limpiar caché del navegador
- Verificar que Next.js esté generando el archivo correctamente

### Notifications
- Si la API falla, mostrar error en consola pero no romper la UI
- Si no hay notificaciones, mostrar mensaje apropiado
- Manejar errores de red con try/catch

## Testing Strategy

### Manual Testing

**Scanner Theme:**
1. Activar modo oscuro desde el menú de usuario
2. Navegar a `/scanner`
3. Verificar que el fondo sea oscuro
4. Verificar que las tarjetas tengan bordes neón
5. Verificar que el texto sea legible
6. Verificar que los iconos tengan colores neón

**Favicon:**
1. Abrir la aplicación en el navegador
2. Verificar que aparezca el emoji 🎓 en la pestaña
3. Agregar a favoritos y verificar que el icono aparezca
4. Verificar en diferentes navegadores (Chrome, Firefox, Safari, Edge)
5. Verificar que no haya errores 404 en consola

**Notifications:**
1. Iniciar sesión con un usuario que tenga notificaciones
2. Verificar que el contador muestre el número correcto
3. Hacer click en el botón de notificaciones
4. Verificar que se abra el dropdown
5. Hacer click en una notificación
6. Verificar que se marque como leída
7. Verificar que el contador se actualice
8. Hacer click en "Mark all as read"
9. Verificar que todas se marquen como leídas
10. Hacer click fuera del dropdown
11. Verificar que se cierre
12. Navegar a otra página
13. Verificar que el estado persista

### Browser Compatibility
- Chrome (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Edge (últimas 2 versiones)

### Accessibility
- Verificar que el botón de notificaciones sea accesible por teclado
- Verificar que el dropdown sea navegable con Tab
- Verificar que los lectores de pantalla anuncien el contador
- Verificar contraste de colores en ambos temas
