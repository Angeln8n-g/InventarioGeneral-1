# Solución: Error de Carga de Chunks en Turbopack

## 🔴 Error Original

```
Failed to load chunk /_next/static/chunks/Desktop_Develop_Web%20all%20projects_Inventario%20Academia%2010_0_src_c910f3e0._.js
```

## 🎯 Causa del Problema

Este error ocurre en Next.js 15.5.4 con Turbopack cuando:
1. La ruta del proyecto contiene **espacios** (ej: `Inventario Academia 10.0`)
2. Turbopack genera nombres de chunks con caracteres codificados (`%20`)
3. Los imports dinámicos no están optimizados para Turbopack

## ✅ Soluciones Aplicadas

### 1. **Configuración de Next.js Mejorada**

Actualizado `next.config.ts` con:

```typescript
experimental: {
  turbo: {
    resolveAlias: {
      '@': './src',
    },
  },
},
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };
  }
  return config;
}
```

**Beneficios:**
- Mejor resolución de módulos con alias
- Chunks optimizados y nombrados consistentemente
- Separación clara entre vendor y código común

### 2. **Imports Dinámicos Optimizados**

Agregado `ssr: false` a todos los imports dinámicos:

**Antes:**
```typescript
const CartModal = dynamic(() => import('@/components/cart/CartModal'), {
  loading: ModalSpinner
})
```

**Después:**
```typescript
const CartModal = dynamic(() => import('@/components/cart/CartModal'), {
  loading: ModalSpinner,
  ssr: false  // ← Nuevo
})
```

**Beneficios:**
- Evita problemas de hidratación
- Mejor compatibilidad con Turbopack
- Carga más predecible en el cliente

### 3. **Scripts de Limpieza**

Agregados nuevos scripts en `package.json`:

```json
{
  "scripts": {
    "clean": "rimraf .next .turbo node_modules/.cache",
    "dev:clean": "npm run clean && next dev --turbopack",
    "clean:all": "rimraf .next .turbo node_modules/.cache node_modules && npm install"
  }
}
```

**Uso:**
```bash
# Limpiar caché y reiniciar
npm run dev:clean

# Limpieza completa (incluye node_modules)
npm run clean:all
```

### 4. **Script PowerShell de Limpieza**

Creado `scripts/clean-restart.ps1`:

```powershell
# Elimina .next, .turbo, y caché de node_modules
# Luego inicia el servidor automáticamente
```

**Uso:**
```powershell
.\scripts\clean-restart.ps1
```

## 🚀 Pasos para Resolver el Error

### Opción 1: Limpieza Rápida (Recomendado)

```bash
# 1. Detener el servidor (Ctrl+C)

# 2. Limpiar caché
npm run clean

# 3. Reiniciar servidor
npm run dev
```

### Opción 2: Limpieza Completa

```bash
# 1. Detener el servidor

# 2. Limpieza completa
npm run clean:all

# 3. El script reinstalará node_modules automáticamente
# 4. Iniciar servidor
npm run dev
```

### Opción 3: PowerShell Script

```powershell
# Ejecutar script de limpieza y reinicio automático
.\scripts\clean-restart.ps1
```

### Opción 4: Manual

```bash
# 1. Detener servidor
# 2. Eliminar carpetas manualmente
rm -rf .next .turbo node_modules/.cache

# 3. Reiniciar
npm run dev
```

## 🔍 Verificación

Después de aplicar las soluciones, verifica que:

1. ✅ El servidor inicia sin errores
2. ✅ Las páginas cargan correctamente
3. ✅ Los modales se abren sin problemas
4. ✅ No hay errores de chunks en la consola

## 🛡️ Prevención Futura

### 1. **Evitar Espacios en Rutas**

**Problema:**
```
C:\Users\angel\Desktop\Develop\Web all projects\Inventario Academia 10.0\
                                    ↑ espacios ↑        ↑ espacios ↑
```

**Solución:**
```
C:\Users\angel\Desktop\Develop\web-projects\inventario-academia-10\
                                ↑ guiones ↑    ↑ guiones ↑
```

### 2. **Limpiar Caché Regularmente**

Agregar al workflow:
```bash
# Antes de cada sesión de desarrollo
npm run clean
npm run dev
```

### 3. **Usar .gitignore Apropiado**

Asegurar que `.gitignore` incluya:
```
.next/
.turbo/
node_modules/.cache/
```

### 4. **Actualizar Next.js**

Mantener Next.js actualizado:
```bash
npm update next
```

## 📊 Comparación de Soluciones

| Solución | Tiempo | Efectividad | Cuándo Usar |
|----------|--------|-------------|-------------|
| `npm run clean` | 10s | Alta | Error ocasional |
| `npm run dev:clean` | 15s | Alta | Inicio de sesión |
| `npm run clean:all` | 2-5min | Muy Alta | Error persistente |
| Script PowerShell | 15s | Alta | Windows users |
| Manual | Variable | Media | Troubleshooting |

## 🐛 Troubleshooting Adicional

### Si el error persiste:

1. **Verificar versión de Node.js**
   ```bash
   node --version  # Debe ser >= 18.17.0
   ```

2. **Verificar versión de Next.js**
   ```bash
   npm list next  # Debe ser 15.5.4
   ```

3. **Limpiar caché de npm**
   ```bash
   npm cache clean --force
   ```

4. **Reinstalar dependencias**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Verificar permisos de archivos**
   - Asegurar que tienes permisos de escritura en la carpeta del proyecto

6. **Desactivar antivirus temporalmente**
   - Algunos antivirus bloquean la creación de archivos en `.next`

### Si nada funciona:

1. **Usar Webpack en lugar de Turbopack**
   ```json
   // package.json
   {
     "scripts": {
       "dev": "next dev",  // Sin --turbopack
       "build": "next build"  // Sin --turbopack
     }
   }
   ```

2. **Mover proyecto a ruta sin espacios**
   ```bash
   # Mover de:
   C:\Users\angel\Desktop\Develop\Web all projects\Inventario Academia 10.0\
   
   # A:
   C:\Users\angel\Desktop\Develop\inventario-academia\
   ```

## 📝 Notas Importantes

- **Turbopack** es experimental en Next.js 15
- Los espacios en rutas pueden causar problemas en Windows
- Siempre limpiar caché después de cambios en configuración
- `ssr: false` en dynamic imports es seguro para modales
- Los chunks se regeneran en cada build

## 🔗 Referencias

- [Next.js Turbopack Docs](https://nextjs.org/docs/architecture/turbopack)
- [Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Next.js Issue Tracker](https://github.com/vercel/next.js/issues)

## ✨ Resultado Esperado

Después de aplicar estas soluciones:
- ✅ Sin errores de carga de chunks
- ✅ Modales cargan correctamente
- ✅ Performance mejorada
- ✅ Build más estable
- ✅ Desarrollo más fluido
