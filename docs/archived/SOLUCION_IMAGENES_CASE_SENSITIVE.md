# Solución: Error 404 en Imágenes de Fondo

## 🐛 Problema
```
GET /images/Solicitar-materiales-background.jpg 404 in 326ms
⨯ The requested resource isn't a valid image
```

## 🔍 Causa
**Case sensitivity en nombres de archivo**

- **Windows**: No distingue entre mayúsculas/minúsculas
  - `Solicitar-materiales-background.jpg` = `solicitar-materiales-background.jpg`
  
- **Linux (Producción)**: Distingue entre mayúsculas/minúsculas
  - `Solicitar-materiales-background.jpg` ≠ `solicitar-materiales-background.jpg`

## ✅ Solución Aplicada

### Archivos Corregidos

1. **src/app/layout.tsx**
   ```diff
   - <link rel="preload" as="image" href="/images/Solicitar-materiales-background.jpg" />
   + <link rel="preload" as="image" href="/images/solicitar-materiales-background.jpg" />
   ```

2. **src/app/my-loans/page.tsx**
   ```diff
   - src="/images/Solicitar-materiales-background.jpg"
   + src="/images/solicitar-materiales-background.jpg"
   ```

### Nombres de Archivo Correctos

| Archivo en public/images | Usado en Código |
|--------------------------|-----------------|
| `login-background.jpg` | ✅ Correcto |
| `Solicitar-herramientas-background.jpg` | ✅ Correcto (con mayúscula) |
| `Devoluciones-background.jpg` | ✅ Correcto (con mayúscula) |
| `solicitar-materiales-background.jpg` | ✅ Corregido (minúsculas) |
| `materiales-reservas-background.jpg` | ✅ Correcto |

## 🧪 Verificación

### Script de Verificación
```bash
node scripts/verify-image-paths.js
```

### Verificación Manual
```bash
# En el servidor
ls -la public/images/*.jpg

# Verificar acceso HTTP
curl -I http://localhost:3000/images/solicitar-materiales-background.jpg
```

## 📝 Lecciones Aprendidas

1. **Siempre usar minúsculas** en nombres de archivo para evitar problemas
2. **Probar en Linux** antes de desplegar (o usar WSL en Windows)
3. **Usar el script de verificación** antes de cada deploy

## 🚀 Próximos Pasos

1. Rebuild de la aplicación:
   ```bash
   npm run build
   ```

2. Reiniciar el servidor:
   ```bash
   pm2 restart inventario-academia
   ```

3. Verificar en producción:
   ```bash
   curl -I https://tu-dominio.com/images/solicitar-materiales-background.jpg
   ```

## 🔧 Prevención Futura

Agregar al package.json:
```json
{
  "scripts": {
    "verify:images": "node scripts/verify-image-paths.js",
    "prebuild": "npm run verify:images"
  }
}
```

Esto verificará las imágenes automáticamente antes de cada build.
