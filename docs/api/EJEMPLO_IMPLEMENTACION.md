# Ejemplo de Implementación de Traducciones

Este documento muestra paso a paso cómo implementar traducciones en una página existente.

## 📝 Ejemplo: Admin Tools Page

### ANTES (Sin traducciones)

```typescript
// src/app/admin/tools/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'

export default function ManageToolsPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin } = useRequireAdmin()
  
  return (
    <ProtectedRoute>
      <AppLayout title="Manage Tools">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Manage Tools</h1>
            <div className="flex space-x-2">
              <Button onClick={() => router.push('/admin/tools/new')}>
                Add New Tool
              </Button>
              <Button onClick={() => router.push('/admin/dashboard')} variant="secondary">
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg p-6">
            <div className="text-sm text-text-secondary-light mb-1">
              Total Tools
            </div>
            <div className="text-3xl font-bold">150</div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name, QR code, or serial number..."
            className="w-full px-4 py-2 border rounded-lg"
          />

          {/* No results */}
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No Tools Found</h3>
            <p className="text-text-secondary-light mb-4">
              No tools match your search criteria.
            </p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
```


### DESPUÉS (Con traducciones)

```typescript
// src/app/admin/tools/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext' // ✅ Importar hook

export default function ManageToolsPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin } = useRequireAdmin()
  const { t } = useLanguage() // ✅ Usar hook de idiomas
  
  return (
    <ProtectedRoute>
      <AppLayout title={t('admin.tools.title')}> {/* ✅ Traducir título */}
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {t('admin.tools.title')} {/* ✅ Traducir */}
            </h1>
            <div className="flex space-x-2">
              <Button onClick={() => router.push('/admin/tools/new')}>
                {t('admin.tools.addNew')} {/* ✅ Traducir */}
              </Button>
              <Button onClick={() => router.push('/admin/dashboard')} variant="secondary">
                {t('admin.tools.backToDashboard')} {/* ✅ Traducir */}
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg p-6">
            <div className="text-sm text-text-secondary-light mb-1">
              {t('admin.tools.totalTools')} {/* ✅ Traducir */}
            </div>
            <div className="text-3xl font-bold">150</div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder={t('admin.tools.searchPlaceholder')} {/* ✅ Traducir placeholder */}
            className="w-full px-4 py-2 border rounded-lg"
          />

          {/* No results */}
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">
              {t('admin.tools.noToolsFound')} {/* ✅ Traducir */}
            </h3>
            <p className="text-text-secondary-light mb-4">
              {t('admin.tools.noToolsMatch')} {/* ✅ Traducir */}
            </p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
```


## 🔄 Cambios Necesarios en LanguageContext.tsx

Agregar las siguientes claves al diccionario:

```typescript
// src/contexts/LanguageContext.tsx

const translations = {
  en: {
    // ... traducciones existentes ...
    
    // ===== ADMIN - TOOLS ===== (AGREGAR ESTA SECCIÓN)
    'admin.tools.title': 'Manage Tools',
    'admin.tools.addNew': 'Add New Tool',
    'admin.tools.backToDashboard': 'Back to Dashboard',
    'admin.tools.totalTools': 'Total Tools',
    'admin.tools.searchPlaceholder': 'Search by name, QR code, or serial number...',
    'admin.tools.noToolsFound': 'No Tools Found',
    'admin.tools.noToolsMatch': 'No tools match your search criteria.',
  },
  es: {
    // ... traducciones existentes ...
    
    // ===== ADMIN - TOOLS ===== (AGREGAR ESTA SECCIÓN)
    'admin.tools.title': 'Gestionar Herramientas',
    'admin.tools.addNew': 'Agregar Nueva Herramienta',
    'admin.tools.backToDashboard': 'Volver al Panel',
    'admin.tools.totalTools': 'Herramientas Totales',
    'admin.tools.searchPlaceholder': 'Buscar por nombre, código QR o número de serie...',
    'admin.tools.noToolsFound': 'No se Encontraron Herramientas',
    'admin.tools.noToolsMatch': 'No hay herramientas que coincidan con tu búsqueda.',
  }
}
```

## ✅ Checklist de Implementación

Para cada página que traduzcas:

1. **Importar el hook**
   ```typescript
   import { useLanguage } from '@/contexts/LanguageContext'
   ```

2. **Usar el hook en el componente**
   ```typescript
   const { t } = useLanguage()
   ```

3. **Reemplazar textos hardcodeados**
   - Títulos: `<h1>{t('key')}</h1>`
   - Botones: `<Button>{t('key')}</Button>`
   - Placeholders: `placeholder={t('key')}`
   - Mensajes: `<p>{t('key')}</p>`

4. **Agregar claves al diccionario**
   - Agregar en sección `en`
   - Agregar en sección `es`

5. **Probar ambos idiomas**
   - Cambiar idioma en el perfil
   - Verificar que todos los textos cambien


## 🎯 Casos Especiales

### 1. Textos con Variables

**Problema:** Necesitas insertar valores dinámicos en el texto

```typescript
// ❌ ANTES
<p>Successfully imported 25 items</p>

// ✅ DESPUÉS
// En el diccionario:
'bulkImport.success': 'Successfully imported {count} items'

// En el componente:
const message = t('bulkImport.success').replace('{count}', count.toString())
<p>{message}</p>
```

### 2. Plurales

**Problema:** El texto cambia según la cantidad

```typescript
// Opción 1: Usar condicional
<p>{count === 1 ? t('bag.item') : t('bag.items')}</p>

// Opción 2: Crear función helper
const pluralize = (count: number, singular: string, plural: string) => {
  return count === 1 ? t(singular) : t(plural)
}

<p>{pluralize(count, 'bag.item', 'bag.items')}</p>
```

### 3. Listas de Opciones

**Problema:** Select options o listas dinámicas

```typescript
// ❌ ANTES
<select>
  <option value="all">All Status</option>
  <option value="available">Available</option>
  <option value="loaned">Loaned</option>
</select>

// ✅ DESPUÉS
<select>
  <option value="all">{t('admin.tools.allStatus')}</option>
  <option value="available">{t('admin.tools.statusAvailable')}</option>
  <option value="loaned">{t('admin.tools.statusLoaned')}</option>
</select>
```

### 4. Mensajes de Error Dinámicos

**Problema:** Mensajes de error del servidor

```typescript
// Crear función para traducir errores comunes
const translateError = (error: string) => {
  const errorMap: Record<string, string> = {
    'Not found': t('common.error.notFound'),
    'Unauthorized': t('common.error.unauthorized'),
    'Invalid credentials': t('login.error'),
  }
  
  return errorMap[error] || error
}

// Usar en catch
catch (error) {
  setError(translateError(error.message))
}
```

### 5. Fechas Localizadas

**Problema:** Formatear fechas según el idioma

```typescript
import { useLanguage } from '@/contexts/LanguageContext'

const { language } = useLanguage()

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat(
    language === 'es' ? 'es-ES' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  ).format(new Date(date))
}

<p>{formatDate(loan.created_at)}</p>
// Inglés: "January 15, 2024"
// Español: "15 de enero de 2024"
```


## 🧪 Testing

### Prueba Manual

1. **Cambiar idioma a Inglés**
   - Ir a Profile
   - Seleccionar "English"
   - Verificar que todos los textos estén en inglés

2. **Cambiar idioma a Español**
   - Ir a Profile
   - Seleccionar "Español"
   - Verificar que todos los textos estén en español

3. **Verificar persistencia**
   - Cambiar idioma
   - Recargar la página
   - Verificar que el idioma se mantenga

### Buscar Textos Sin Traducir

```bash
# Buscar textos hardcodeados en páginas admin
grep -r "className.*>" src/app/admin/ | grep -E '"[A-Z][a-z]+ [A-Z]'

# Buscar claves de traducción usadas
grep -r "t\('" src/app/admin/ | sed "s/.*t('\([^']*\)'.*/\1/" | sort | uniq

# Comparar con claves disponibles en LanguageContext
```

### Verificar Claves Faltantes

Si ves una clave en lugar de texto (ej: "admin.tools.title"), significa que:
1. La clave no existe en el diccionario
2. Hay un typo en la clave
3. La clave está en una sección incorrecta

**Solución:**
```typescript
// Verificar que la clave existe en ambos idiomas
const translations = {
  en: {
    'admin.tools.title': 'Manage Tools', // ✅ Existe
  },
  es: {
    'admin.tools.title': 'Gestionar Herramientas', // ✅ Existe
  }
}
```

## 📊 Progreso de Implementación

Usa esta tabla para trackear tu progreso:

| Página/Componente | Estado | Claves Agregadas | Probado EN | Probado ES |
|-------------------|--------|------------------|------------|------------|
| Admin Tools | ✅ | 35 | ✅ | ✅ |
| Admin Users | ⏳ | 0 | ❌ | ❌ |
| Admin Reports | ⏳ | 0 | ❌ | ❌ |
| Landing Page | ⏳ | 0 | ❌ | ❌ |
| Login Page | ⏳ | 0 | ❌ | ❌ |

**Leyenda:**
- ✅ Completado
- ⏳ En progreso
- ❌ Pendiente

