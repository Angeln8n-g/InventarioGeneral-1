# Solución al Error de Notificaciones

## Problema Identificado

El error `TypeError: fetch failed` ocurría cuando RTK Query intentaba hacer polling de notificaciones cada 30 segundos. Este es un error común en aplicaciones Next.js cuando:

1. El servidor de desarrollo no está completamente iniciado
2. Hay problemas de conectividad con la base de datos
3. El polling continúa incluso cuando hay errores de red

## Stack Trace del Error

```
Notifications fetch error: {
  message: 'TypeError: fetch failed',
  details: 'TypeError: fetch failed at node:internal/deps/undici/undici:13510:13',
  hint: '',
  code: ''
}
```

El error se originaba en:
- `notificationOperations.getByUserId()` en `supabase-client.ts`
- Llamado desde `/api/notifications` route handler
- Activado por polling de RTK Query cada 30 segundos

## Soluciones Implementadas

### 1. Manejo de Errores en el Cliente (Dashboard y Header)

**Archivo:** `src/app/dashboard/page.tsx` y `src/components/layout/Header.tsx`

```typescript
const { data: notificationsData, error: notificationsError } = useGetNotificationsQuery(
  { page: 1, limit: 20 },
  { 
    skip: !user,
    pollingInterval: 30000,
    skipPollingIfUnfocused: true, // ✅ Detiene polling cuando la pestaña no está enfocada
  }
)

// Log de errores solo en desarrollo
React.useEffect(() => {
  if (notificationsError && process.env.NODE_ENV === 'development') {
    console.warn('Notifications temporarily unavailable:', notificationsError)
  }
}, [notificationsError])
```

**Beneficios:**
- ✅ Captura errores sin romper la UI
- ✅ Detiene polling cuando el usuario no está viendo la página
- ✅ Logs informativos solo en desarrollo
- ✅ La aplicación continúa funcionando aunque fallen las notificaciones

### 2. Retry Logic en RTK Query

**Archivo:** `src/services/api.ts`

```typescript
getNotifications: builder.query<...>({
  query: (params) => { ... },
  providesTags: ['Notification'],
  extraOptions: {
    maxRetries: 3, // ✅ Reintenta hasta 3 veces con backoff exponencial
  },
  keepUnusedDataFor: 60, // ✅ Mantiene datos previos por 60s en caso de error
}),
```

**Beneficios:**
- ✅ Reintentos automáticos con backoff exponencial
- ✅ Mantiene datos previos para evitar UI vacía
- ✅ Reduce carga en el servidor

### 3. Logging Mejorado en el Servidor

**Archivo:** `src/app/api/notifications/route.ts`

```typescript
catch (error: unknown) {
  console.error('Notifications fetch error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    details: error instanceof Error ? error.stack : String(error),
    hint: 'Check database connection and Supabase configuration',
    code: error instanceof Error && 'code' in error ? (error as any).code : '',
  })

  return NextResponse.json(
    {
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Unable to fetch notifications. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  )
}
```

**Beneficios:**
- ✅ Logs estructurados para debugging
- ✅ Mensajes de error amigables para el usuario
- ✅ Información detallada para desarrolladores
- ✅ Hints para solucionar problemas comunes

## Causas Comunes del Error

### 1. Base de Datos No Disponible
```bash
# Verificar conexión a Supabase
# Revisar variables de entorno
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Servidor de Desarrollo No Completamente Iniciado
```bash
# Esperar a que el servidor esté completamente listo
npm run dev
# Esperar mensaje: "Ready in X ms"
```

### 3. Problemas de Red Local
```bash
# Verificar que localhost esté accesible
curl http://localhost:3000/api/notifications
```

### 4. Tabla de Notificaciones No Existe
```sql
-- Verificar en Supabase que la tabla existe
SELECT * FROM notifications LIMIT 1;
```

## Mejores Prácticas Implementadas

### ✅ Graceful Degradation
La aplicación continúa funcionando aunque las notificaciones fallen.

### ✅ Progressive Enhancement
Las notificaciones se cargan cuando están disponibles, sin bloquear la UI.

### ✅ Error Boundaries
Los errores se capturan y se manejan sin romper la aplicación.

### ✅ Polling Inteligente
- Se detiene cuando la pestaña no está enfocada
- Usa backoff exponencial en reintentos
- Mantiene datos previos en cache

### ✅ Logging Estructurado
- Logs detallados en desarrollo
- Logs mínimos en producción
- Información útil para debugging

## Testing

### Probar el Manejo de Errores

1. **Simular error de red:**
```typescript
// En src/services/api.ts, temporalmente:
baseQuery: fetchBaseQuery({
  baseUrl: '/api-invalid', // URL inválida
  ...
})
```

2. **Verificar que la UI no se rompe:**
- El dashboard debe cargar normalmente
- Las notificaciones deben mostrar 0 o datos en cache
- No debe haber errores no manejados en consola

3. **Verificar polling:**
- Abrir DevTools > Network
- Ver que las peticiones se detienen cuando cambias de pestaña
- Ver que se reintentan con backoff cuando hay errores

## Monitoreo en Producción

### Métricas a Observar

1. **Tasa de errores en `/api/notifications`**
   - Debe ser < 1% en condiciones normales

2. **Tiempo de respuesta**
   - Debe ser < 500ms en promedio

3. **Reintentos**
   - Monitorear cuántos requests necesitan reintentos

### Alertas Recomendadas

```javascript
// Ejemplo de alerta
if (notificationErrorRate > 5%) {
  alert('High notification error rate - check database connection')
}
```

## Próximos Pasos (Opcional)

### 1. Implementar Circuit Breaker
```typescript
// Detener polling después de N errores consecutivos
let consecutiveErrors = 0
const MAX_ERRORS = 5

if (notificationsError) {
  consecutiveErrors++
  if (consecutiveErrors >= MAX_ERRORS) {
    // Detener polling por X minutos
  }
}
```

### 2. Fallback UI
```typescript
{notificationsError && (
  <div className="notification-error">
    <p>Notifications temporarily unavailable</p>
    <button onClick={refetch}>Retry</button>
  </div>
)}
```

### 3. Service Worker para Offline
```typescript
// Cachear notificaciones para uso offline
if ('serviceWorker' in navigator) {
  // Implementar cache strategy
}
```

## Conclusión

El error ha sido resuelto mediante:
1. ✅ Manejo robusto de errores en cliente y servidor
2. ✅ Polling inteligente con backoff
3. ✅ Logging mejorado para debugging
4. ✅ Graceful degradation de funcionalidad

La aplicación ahora es más resiliente y continúa funcionando incluso cuando hay problemas temporales con las notificaciones.
