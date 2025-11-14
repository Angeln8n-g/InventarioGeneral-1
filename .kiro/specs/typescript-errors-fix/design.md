# Design Document

## Overview

Este documento describe el enfoque sistemático para corregir todos los errores de TypeScript y ESLint en el proyecto Inventario Academia. La estrategia se basa en corregir errores por categoría y por archivo, priorizando los archivos más críticos (API routes y tipos base) antes de los componentes de UI.

## Architecture

### Categorización de Errores

Los errores se agrupan en 5 categorías principales:

1. **Errores de tipo `any`** (~80 instancias)
   - Parámetros de función sin tipo
   - Bloques catch con `any`
   - Respuestas de API sin tipo
   - Tipos genéricos sin especificar

2. **Variables no utilizadas** (~20 instancias)
   - Imports no usados
   - Variables declaradas pero no usadas
   - Parámetros de función no usados

3. **Caracteres sin escapar en JSX** (~10 instancias)
   - Apóstrofes en texto
   - Comillas en texto

4. **Dependencias de hooks** (1 instancia)
   - useEffect con dependencias faltantes

5. **Configuración obsoleta** (2 warnings)
   - next.config.js con opciones deprecadas

### Estrategia de Corrección

#### Fase 1: Tipos Base y Utilidades
Corregir primero los archivos de tipos y utilidades que son usados por todo el proyecto:
- `src/types/database.ts`
- `src/lib/supabase.ts`
- `src/lib/auth-middleware.ts`
- `src/services/api.ts`

#### Fase 2: API Routes
Corregir las rutas de API en orden de dependencia:
- Auth routes (login, logout, profile, register)
- Admin routes (tools, consumables, notifications, audit, overdue)
- User routes (loans, consumables, notifications, tools)

#### Fase 3: Componentes y Páginas
Corregir componentes y páginas de UI:
- Hooks personalizados
- Componentes de layout
- Páginas de usuario
- Páginas de admin

#### Fase 4: Configuración
Actualizar archivos de configuración:
- next.config.js
- Limpieza final

## Components and Interfaces

### Tipos de Reemplazo para `any`

#### 1. Error Handling
```typescript
// Antes
catch (error: any) {
  console.error(error)
}

// Después
catch (error: unknown) {
  console.error(error instanceof Error ? error.message : 'Unknown error')
}
```

#### 2. API Responses
```typescript
// Antes
const response: any = await fetch(...)

// Después
interface ApiResponse<T> {
  data: T
  message?: string
}
const response: ApiResponse<User> = await fetch(...)
```

#### 3. Database Queries
```typescript
// Antes
const { data, error }: any = await supabase.from('users').select()

// Después
const { data, error }: { data: User[] | null; error: PostgrestError | null } = 
  await supabase.from('users').select()
```

#### 4. Event Handlers
```typescript
// Antes
const handleSubmit = (e: any) => { ... }

// Después
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { ... }
```

#### 5. Generic Functions
```typescript
// Antes
function processData(data: any) { ... }

// Después
function processData<T extends Record<string, unknown>>(data: T): T { ... }
```

### Tipos Específicos del Proyecto

Usar los tipos ya definidos en `src/types/database.ts`:
- `User`, `ItemType`, `ToolInstance`, `ConsumableStock`
- `Loan`, `ConsumableRequest`, `Notification`, `AuditLog`
- Input types: `CreateXInput`, `UpdateXInput`
- Response types: `ApiResponse<T>`, `ApiError`

### Variables No Utilizadas

#### Estrategias:
1. **Eliminar** si no es necesaria
2. **Usar** si debería estar en uso
3. **Prefijo `_`** si es requerida por la firma pero no se usa
4. **Comentar** con `// eslint-disable-next-line` si es intencional

### Caracteres JSX

Reemplazos estándar:
- `'` → `&apos;` o usar comillas dobles en el string
- `"` → `&quot;` o usar comillas simples en el string
- Alternativamente, usar template literals cuando sea apropiado

## Data Models

### Tipos de Error por Archivo

Los archivos se clasifican según la cantidad y tipo de errores:

**Críticos (>10 errores):**
- `src/services/api.ts` (12 errores any)
- `src/app/api/admin/consumables/backorders/route.ts` (7 errores any)
- `src/app/api/admin/consumables/route.ts` (4 errores any)

**Moderados (5-10 errores):**
- `src/app/admin/audit/page.tsx` (5 errores any)
- `src/app/scanner/page.tsx` (8 errores any)
- `src/lib/supabase.ts` (4 errores any)

**Menores (<5 errores):**
- Resto de archivos con 1-4 errores cada uno

## Error Handling

### Manejo de Errores en Bloques Catch

Patrón estándar a usar en todo el proyecto:

```typescript
try {
  // código
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  console.error('Context:', errorMessage)
  
  return NextResponse.json(
    { error: { code: 'ERROR_CODE', message: errorMessage } },
    { status: 500 }
  )
}
```

### Validación de Tipos en Runtime

Para datos externos (API, DB), agregar validación:

```typescript
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'username' in data
  )
}
```

## Testing Strategy

### Verificación por Fase

Después de cada fase:
1. Ejecutar `npx next build` para verificar errores
2. Revisar que no se introdujeron nuevos errores
3. Verificar que la funcionalidad no se rompió

### Validación Final

Al completar todas las correcciones:
1. Build completo sin errores: `npx next build`
2. Verificar que el servidor inicia: `npx next dev`
3. Probar funcionalidades clave:
   - Login
   - Dashboard
   - Crear préstamo
   - Ver notificaciones

### Rollback Plan

Si alguna corrección rompe funcionalidad:
1. Identificar el archivo problemático
2. Revertir cambios específicos
3. Buscar tipo alternativo más permisivo pero seguro
4. Documentar la decisión

## Implementation Notes

### Orden de Archivos a Corregir

**Fase 1: Tipos Base (4 archivos)**
1. `src/types/database.ts`
2. `src/lib/supabase.ts`
3. `src/lib/auth-middleware.ts`
4. `src/services/api.ts`

**Fase 2: API Routes (20 archivos)**
- Auth: login, logout, profile, register
- Admin: tools, consumables, notifications, audit, overdue, item-types
- User: loans, consumables, notifications, tools

**Fase 3: UI Components (15 archivos)**
- Hooks: useAuth
- Components: Header, MobileNavigation, RoleGuard, ProtectedRoute
- Pages: login, dashboard, scanner, my-loans, my-requests, consumables
- Admin pages: audit, consumables, dashboard

**Fase 4: Configuración (1 archivo)**
- next.config.js

### Consideraciones Especiales

1. **Supabase Types**: Usar tipos de `@supabase/supabase-js` cuando sea posible
2. **Next.js Types**: Usar tipos de Next.js para Request/Response
3. **React Types**: Usar tipos de React para eventos y componentes
4. **Mantener compatibilidad**: No cambiar interfaces públicas existentes

### Métricas de Éxito

- ✅ 0 errores de compilación
- ✅ 0 errores de ESLint
- ✅ Warnings reducidos a 0 o mínimo necesario
- ✅ Todas las funcionalidades operativas
- ✅ Build exitoso en menos de 30 segundos
