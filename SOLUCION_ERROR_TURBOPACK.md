# Solución: Error de Configuración Turbopack

## 🐛 Problema
```
⚠ The config property `experimental.turbo` is deprecated. 
Move this setting to `config.turbopack` or run 
`npx @next/codemod@latest next-experimental-turbo-to-turbopack .`

[TypeError: routesManifest.dataRoutes is not iterable]
```

## 🔍 Causa
La configuración `experimental.turbo` está **deprecada** en las versiones recientes de Next.js y causa errores en producción.

## ✅ Solución Aplicada

### Cambio en next.config.ts

**Antes:**
```typescript
experimental: {
  turbo: {
    resolveAlias: {
      '@': './src',
    },
  },
},
```

**Después:**
```typescript
// Configuración removida - no es necesaria en producción
// El alias '@' ya está configurado en tsconfig.json
```

## 📝 Explicación

1. **Turbopack es solo para desarrollo**: La configuración `turbo` solo se usa con `next dev --turbo`
2. **No afecta producción**: En builds de producción se usa Webpack, no Turbopack
3. **Alias ya configurado**: El alias `@` ya está definido en `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

## 🚀 Pasos para Aplicar

1. **Limpiar builds anteriores:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

2. **Rebuild:**
   ```bash
   npm run build
   ```

3. **Reiniciar en producción:**
   ```bash
   pm2 restart inventario-academia
   ```

## ✅ Verificación

Después del rebuild, NO deberías ver:
- ❌ Warnings sobre `experimental.turbo`
- ❌ Errores de `routesManifest.dataRoutes`

Deberías ver:
- ✅ Build exitoso sin warnings de configuración
- ✅ Aplicación iniciando correctamente

## 📚 Referencias

- [Next.js Turbopack Docs](https://nextjs.org/docs/architecture/turbopack)
- [Next.js Configuration](https://nextjs.org/docs/app/api-reference/next-config-js)

## 🔧 Configuración Final

El `next.config.ts` ahora solo incluye:
- ✅ `output: 'standalone'` - Para deployment
- ✅ `images` - Configuración de optimización de imágenes
- ✅ `webpack` - Optimización de chunks para producción
- ✅ `eslint` y `typescript` - Configuración de builds

**No incluye:**
- ❌ `experimental.turbo` - Deprecado y solo para dev
