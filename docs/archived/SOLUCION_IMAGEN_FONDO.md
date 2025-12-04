# 🖼️ Solución: Imagen de Fondo No Carga en Producción

## Diagnóstico Rápido

El fondo no carga en producción porque probablemente **la imagen no se subió al servidor** o **no se incluyó en el build**.

## Solución Inmediata (5 minutos)

### Paso 1: Verificar localmente

```bash
# En tu máquina local
npm run verify-images
```

Si todo está bien, verás: ✅ TODAS LAS IMÁGENES ESTÁN PRESENTES

### Paso 2: Subir imagen al servidor

```bash
# Opción A: Subir solo la imagen faltante
scp public/images/Solicitar-materiales-background.jpg root@tu-servidor:/root/Inventario-Academia-10.0/public/images/

# Opción B: Subir todas las imágenes
scp -r public/images/* root@tu-servidor:/root/Inventario-Academia-10.0/public/images/
```

### Paso 3: Verificar en el servidor

```bash
# Conectar al servidor
ssh root@tu-servidor

# Ir al proyecto
cd /root/Inventario-Academia-10.0

# Verificar que la imagen existe
ls -la public/images/Solicitar-materiales-background.jpg

# Si existe, verificar permisos
chmod 644 public/images/*.jpg

# Reiniciar aplicación
pm2 restart all
```

### Paso 4: Probar en el navegador

Abre en tu navegador:
```
http://tu-servidor:3000/images/Solicitar-materiales-background.jpg
```

Si ves la imagen, el problema está resuelto. Si no, continúa con el diagnóstico avanzado.

## Despliegue Completo de Cambios

Para desplegar TODOS los cambios que has hecho:

### Método 1: Usando Git (Recomendado)

```bash
# 1. En tu máquina local - Commit y push
git add .
git commit -m "Update: Mejoras de diseño y correcciones de imágenes"
git push origin main

# 2. En el servidor - Pull y rebuild
ssh root@tu-servidor
cd /root/Inventario-Academia-10.0
git pull origin main
npm install
npm run build
pm2 restart all
```

### Método 2: Script Automático

```bash
# En el servidor, ejecuta el script de despliegue
~/deploy-inventario.sh
```

Si no tienes el script, créalo siguiendo la guía en `GUIA_DESPLIEGUE_ACTUALIZACION.md`

## Diagnóstico Avanzado

### Problema: La imagen existe pero no carga

```bash
# En el servidor
cd /root/Inventario-Academia-10.0

# 1. Verificar que Next.js puede acceder a la imagen
ls -la public/images/

# 2. Verificar permisos
chmod 755 public/images
chmod 644 public/images/*.jpg

# 3. Verificar que el build incluyó los assets
find .next -name "*background*"

# 4. Limpiar y rebuildar
rm -rf .next
npm run build
pm2 restart all
```

### Problema: Error 404 en la imagen

La ruta en el código es:
```typescript
src="/images/Solicitar-materiales-background.jpg"
```

Esto busca la imagen en: `public/images/Solicitar-materiales-background.jpg`

Verifica:
1. ✅ La imagen está en `public/images/` (no en `src/images/`)
2. ✅ El nombre es exactamente: `Solicitar-materiales-background.jpg` (case-sensitive)
3. ✅ La extensión es `.jpg` (no `.jpeg` o `.png`)

### Problema: La imagen es muy grande

Si la imagen es muy pesada (>1MB), Next.js puede tener problemas optimizándola:

```bash
# Verificar tamaño
ls -lh public/images/Solicitar-materiales-background.jpg

# Si es muy grande, optimízala localmente
# Usa herramientas como:
# - TinyPNG (https://tinypng.com/)
# - ImageOptim (Mac)
# - Squoosh (https://squoosh.app/)
```

## Checklist de Verificación

- [ ] La imagen existe en `public/images/` localmente
- [ ] El nombre del archivo es correcto (case-sensitive)
- [ ] La imagen se subió al servidor
- [ ] Los permisos son correctos (644)
- [ ] El build se completó sin errores
- [ ] La aplicación se reinició
- [ ] La imagen es accesible directamente en el navegador

## Comandos Útiles

```bash
# Verificar imágenes localmente
npm run verify-images

# Subir imágenes al servidor
scp -r public/images/* root@servidor:/root/Inventario-Academia-10.0/public/images/

# Verificar en servidor
ssh root@servidor "ls -la /root/Inventario-Academia-10.0/public/images/"

# Rebuild en servidor
ssh root@servidor "cd /root/Inventario-Academia-10.0 && npm run build && pm2 restart all"

# Ver logs
ssh root@servidor "pm2 logs --lines 50"
```

## Alternativa: Usar URL Externa

Si sigues teniendo problemas, puedes usar una URL externa temporalmente:

```typescript
// En src/app/my-loans/page.tsx
<Image
  src="https://tu-cdn.com/imagen.jpg"  // URL externa
  alt="Background"
  fill
  className="object-cover"
  priority
  quality={75}
/>
```

Pero esto no es recomendado para producción.

## Prevención Futura

1. **Siempre verifica las imágenes antes de desplegar:**
   ```bash
   npm run verify-images
   ```

2. **Incluye las imágenes en Git:**
   ```bash
   git add public/images/
   git commit -m "Add background images"
   ```

3. **Documenta las imágenes necesarias** en el README

4. **Usa el script de despliegue automático** que verifica todo

## Soporte

Si después de seguir todos estos pasos el problema persiste:

1. Verifica los logs del servidor: `pm2 logs`
2. Verifica los logs del navegador (F12 > Console)
3. Verifica que Next.js está sirviendo archivos estáticos correctamente
4. Considera usar un CDN para las imágenes
