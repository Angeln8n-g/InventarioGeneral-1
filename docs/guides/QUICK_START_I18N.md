# 🚀 Quick Start - Implementación de Idiomas

## Inicio Rápido (5 minutos)

### Paso 1: Abrir el archivo de traducciones
```bash
code src/contexts/LanguageContext.tsx
```

### Paso 2: Agregar nuevas claves
Copia las traducciones de `TRADUCCIONES_COMPLETAS.md` y pégalas en las secciones correspondientes:

```typescript
const translations = {
  en: {
    // ... traducciones existentes ...
    
    // ===== PEGAR AQUÍ LAS NUEVAS TRADUCCIONES EN INGLÉS =====
    'admin.tools.title': 'Manage Tools',
    'admin.tools.addNew': 'Add New Tool',
    // ... etc
  },
  es: {
    // ... traducciones existentes ...
    
    // ===== PEGAR AQUÍ LAS NUEVAS TRADUCCIONES EN ESPAÑOL =====
    'admin.tools.title': 'Gestionar Herramientas',
    'admin.tools.addNew': 'Agregar Nueva Herramienta',
    // ... etc
  }
}
```

### Paso 3: Implementar en una página
Ejemplo con Admin Tools:

```typescript
// 1. Importar
import { useLanguage } from '@/contexts/LanguageContext'

// 2. Usar hook
const { t } = useLanguage()

// 3. Reemplazar textos
<h1>{t('admin.tools.title')}</h1>
```

### Paso 4: Probar
1. Ir a `/profile`
2. Cambiar idioma
3. Verificar que los textos cambien

## 📋 Orden Recomendado de Implementación

### Semana 1: Páginas Admin (Prioridad Alta)
```
Día 1-2: Diccionario completo (270 claves)
Día 3: Admin Tools + Admin Users
Día 4: Admin Reports + Admin Consumables
Día 5: Admin Loans + Admin Audit
```

### Semana 2: Componentes (Prioridad Media)
```
Día 1: Bag/Cart/Vault components
Día 2: Scanner components
Día 3: Bulk Import + Reports components
Día 4: Testing y fixes
Día 5: Buffer
```

### Semana 3: Landing y Detalles (Prioridad Baja)
```
Día 1-2: Landing page components
Día 3: Login page
Día 4-5: Páginas de detalle
```


## 🎯 Implementación por Prioridad

### ALTA PRIORIDAD (Hacer primero)

**1. Admin Tools** (`src/app/admin/tools/page.tsx`)
- Claves: 35
- Tiempo: 1 hora
- Impacto: Alto (página muy usada)

**2. Admin Users** (`src/app/admin/users/page.tsx`)
- Claves: 18
- Tiempo: 45 min
- Impacto: Alto

**3. Admin Reports** (`src/app/admin/reports/page.tsx`)
- Claves: 25
- Tiempo: 1 hora
- Impacto: Medio-Alto

### MEDIA PRIORIDAD

**4. Bag/Cart/Vault Components**
- Claves: 40
- Tiempo: 2 horas
- Impacto: Medio (mejora UX)

**5. Scanner Components**
- Claves: 25
- Tiempo: 1.5 horas
- Impacto: Medio

### BAJA PRIORIDAD

**6. Landing Page**
- Claves: 45
- Tiempo: 2 horas
- Impacto: Bajo (usuarios ya registrados)

**7. Páginas de Detalle**
- Claves: Variable
- Tiempo: 3-4 horas
- Impacto: Bajo

## 🛠️ Comandos Útiles

### Buscar textos sin traducir
```bash
# Buscar textos hardcodeados en admin
grep -rn "className.*\"[A-Z]" src/app/admin/ | grep -v "t('"

# Buscar placeholders sin traducir
grep -rn "placeholder=\"" src/app/admin/
```

### Contar claves de traducción
```bash
# Contar claves en inglés
grep -o "'[a-z.]*':" src/contexts/LanguageContext.tsx | wc -l

# Ver todas las claves usadas en admin
grep -roh "t('[^']*')" src/app/admin/ | sort | uniq
```

### Verificar claves faltantes
```bash
# Extraer claves usadas
grep -roh "t('[^']*')" src/app/admin/ | sed "s/t('//g" | sed "s/')//g" | sort | uniq > used_keys.txt

# Comparar con claves disponibles
# (manual: revisar LanguageContext.tsx)
```


## 💡 Tips y Mejores Prácticas

### 1. Organización de Claves
```typescript
// ✅ BUENO: Claves organizadas jerárquicamente
'admin.tools.title'
'admin.tools.addNew'
'admin.tools.search'

// ❌ MALO: Claves sin estructura
'manageTools'
'addTool'
'searchTools'
```

### 2. Nombres Descriptivos
```typescript
// ✅ BUENO: Nombre claro y específico
'admin.tools.searchPlaceholder'
'admin.tools.noToolsFound'

// ❌ MALO: Nombre genérico
'placeholder'
'notFound'
```

### 3. Reutilización
```typescript
// ✅ BUENO: Reutilizar claves comunes
'common.loading'
'common.error'
'common.success'

// ❌ MALO: Duplicar para cada página
'admin.tools.loading'
'admin.users.loading'
'admin.reports.loading'
```

### 4. Consistencia
```typescript
// ✅ BUENO: Mismo patrón en ambos idiomas
en: 'admin.tools.title': 'Manage Tools'
es: 'admin.tools.title': 'Gestionar Herramientas'

// ❌ MALO: Estructura diferente
en: 'admin.tools.title': 'Manage Tools'
es: 'titulo.herramientas': 'Gestionar Herramientas'
```

## 🐛 Troubleshooting

### Problema: Veo la clave en lugar del texto
```
Síntoma: "admin.tools.title" aparece en la UI
Causa: La clave no existe en el diccionario
Solución: Agregar la clave en ambos idiomas (en y es)
```

### Problema: El idioma no cambia
```
Síntoma: Al cambiar idioma, los textos no se actualizan
Causa: El componente no está usando useLanguage()
Solución: Importar y usar el hook correctamente
```

### Problema: Algunos textos cambian, otros no
```
Síntoma: Algunos textos están traducidos, otros no
Causa: Textos hardcodeados mezclados con traducciones
Solución: Buscar y reemplazar todos los textos hardcodeados
```

### Problema: El idioma no persiste al recargar
```
Síntoma: Al recargar la página, vuelve al idioma por defecto
Causa: localStorage no está funcionando
Solución: Verificar que el navegador permita localStorage
```

## ✅ Checklist Final

Antes de considerar completada la implementación:

- [ ] Todas las claves agregadas al diccionario (en y es)
- [ ] Todos los componentes usan `useLanguage()`
- [ ] No hay textos hardcodeados visibles
- [ ] Placeholders traducidos
- [ ] Mensajes de error traducidos
- [ ] Botones traducidos
- [ ] Títulos y headers traducidos
- [ ] Probado en inglés
- [ ] Probado en español
- [ ] Idioma persiste al recargar
- [ ] No hay claves faltantes (no se ven claves en la UI)
- [ ] Layout no se rompe con textos largos
- [ ] Fechas formateadas según idioma
- [ ] Números formateados según idioma

