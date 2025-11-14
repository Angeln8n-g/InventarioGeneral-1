# 🚀 Guía de Despliegue de Actualizaciones

## Problema: Fondo no carga en producción

### Causas Posibles

1. **Imagen no subida al servidor** - La carpeta `public/images` no se sincronizó
2. **Optimización de Next.js** - Next.js no procesó la imagen correctamente
3. **Permisos de archivos** - El servidor no tiene permisos para leer la imagen
4. **Build incompleto** - El build no incluyó los assets estáticos

### Solución Rápida

#### Opción 1: Verificar y subir la imagen manualmente

```bash
# En tu máquina local, verifica que la imagen existe
ls public/images/Solicitar-materiales-background.jpg

# Conecta al servidor
ssh root@tu-servidor
cd /root/Inventario-Academia-10.0

# Verifica si existe la imagen en el servidor
ls public/images/Solicitar-materiales-background.jpg

# Si no existe, súbela desde tu máquina local
# En tu máquina local (nueva terminal):
scp public/images/Solicitar-materiales-background.jpg root@tu-servidor:/root/Inventario-Academia-10.0/public/images/
```

#### Opción 2: Usar Git para sincronizar todo

```bash
# En tu máquina local
git add .
git commit -m "Fix: Actualizar diseño y agregar imágenes faltantes"
git push origin main

# En el servidor
ssh root@tu-servidor
cd /root/Inventario-Academia-10.0
git pull origin main
```

## Despliegue Completo de Actualizaciones

### Paso 1: Preparar en Local

```bash
# 1. Asegúrate de que todo está commiteado
git status

# 2. Verifica que el build funciona localmente
npm run build

# 3. Verifica que todas las imágenes están en public/images
ls public/images/

# 4. Commit y push
git add .
git commit -m "Update: Mejoras de diseño y correcciones"
git push origin main
```

### Paso 2: Desplegar en el Servidor

```bash
# Conectar al servidor
ssh root@tu-servidor
cd /root/Inventario-Academia-10.0

# Detener la aplicación
pm2 stop all

# Hacer backup (opcional pero recomendado)
cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S)

# Obtener últimos cambios
git pull origin main

# Verificar que las imágenes están presentes
ls -la public/images/

# Instalar dependencias (si hay cambios en package.json)
npm install

# Limpiar build anterior
rm -rf .next

# Hacer nuevo build
npm run build

# Reiniciar aplicación
pm2 restart all

# Ver logs para verificar
pm2 logs --lines 50
```

### Paso 3: Verificar el Despliegue

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs

# Verificar que el servidor responde
curl http://localhost:3000

# Verificar que la imagen es accesible
curl -I http://localhost:3000/images/Solicitar-materiales-background.jpg
```

## Script Automático de Despliegue

Crea este archivo en el servidor para facilitar futuros despliegues:

```bash
# En el servidor
nano ~/deploy-inventario.sh
```

Contenido del script:

```bash
#!/bin/bash

echo "🚀 Iniciando despliegue de Inventario Academia..."

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Directorio del proyecto
PROJECT_DIR="/root/Inventario-Academia-10.0"
cd $PROJECT_DIR

# Función para imprimir mensajes
print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Detener aplicación
print_step "Deteniendo aplicación..."
pm2 stop all

# 2. Hacer backup del build
print_step "Creando backup..."
if [ -d ".next" ]; then
    BACKUP_NAME=".next.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r .next $BACKUP_NAME
    print_step "Backup creado: $BACKUP_NAME"
fi

# 3. Obtener cambios
print_step "Obteniendo últimos cambios..."
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    print_error "Error al obtener cambios de Git"
    pm2 restart all
    exit 1
fi

# 4. Verificar imágenes
print_step "Verificando imágenes..."
if [ ! -f "public/images/Solicitar-materiales-background.jpg" ]; then
    print_warning "Imagen de fondo no encontrada"
fi
if [ ! -f "public/images/materiales-reservas-background.jpg" ]; then
    print_warning "Imagen de materiales no encontrada"
fi

# 5. Instalar dependencias
print_step "Instalando dependencias..."
npm ci --production=false

# 6. Limpiar build anterior
print_step "Limpiando build anterior..."
rm -rf .next

# 7. Hacer nuevo build
print_step "Compilando aplicación..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Error en el build"
    print_warning "Restaurando backup..."
    if [ -d "$BACKUP_NAME" ]; then
        rm -rf .next
        mv $BACKUP_NAME .next
    fi
    pm2 restart all
    exit 1
fi

# 8. Reiniciar aplicación
print_step "Reiniciando aplicación..."
pm2 restart all

# 9. Verificar estado
sleep 3
print_step "Verificando estado..."
pm2 status

echo ""
echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo ""
echo "Comandos útiles:"
echo "  pm2 logs       - Ver logs en tiempo real"
echo "  pm2 status     - Ver estado de la aplicación"
echo "  pm2 monit      - Monitor de recursos"
```

Dar permisos de ejecución:

```bash
chmod +x ~/deploy-inventario.sh
```

Usar el script:

```bash
~/deploy-inventario.sh
```

## Solución Específica para Imágenes Faltantes

Si las imágenes no están en el servidor:

### Método 1: Subir todas las imágenes

```bash
# Desde tu máquina local
cd /ruta/a/tu/proyecto
scp -r public/images/* root@tu-servidor:/root/Inventario-Academia-10.0/public/images/
```

### Método 2: Verificar y crear estructura

```bash
# En el servidor
cd /root/Inventario-Academia-10.0

# Crear directorio si no existe
mkdir -p public/images

# Verificar permisos
chmod 755 public/images
ls -la public/images/

# Si las imágenes están pero no cargan, verificar permisos
chmod 644 public/images/*.jpg
```

## Troubleshooting

### La imagen no carga después del despliegue

1. **Verificar que existe:**
   ```bash
   ls -la public/images/Solicitar-materiales-background.jpg
   ```

2. **Verificar permisos:**
   ```bash
   chmod 644 public/images/Solicitar-materiales-background.jpg
   ```

3. **Verificar que Next.js la encuentra:**
   ```bash
   # Buscar en el build
   find .next -name "*Solicitar-materiales*"
   ```

4. **Verificar en el navegador:**
   - Abre: `http://tu-servidor:3000/images/Solicitar-materiales-background.jpg`
   - Si da 404, la imagen no está en public/images

### El build falla

```bash
# Ver logs detallados
npm run build 2>&1 | tee build.log

# Verificar espacio en disco
df -h

# Limpiar caché
rm -rf .next node_modules/.cache
npm install
npm run build
```

### La aplicación no inicia después del despliegue

```bash
# Ver logs de PM2
pm2 logs --lines 100

# Reiniciar completamente
pm2 delete all
pm2 start npm --name "inventario-app" -- start
pm2 save

# Verificar puerto
netstat -tulpn | grep 3000
```

## Checklist de Despliegue

- [ ] Código commiteado y pusheado a Git
- [ ] Build exitoso en local
- [ ] Imágenes verificadas en public/images
- [ ] Variables de entorno configuradas en servidor
- [ ] Backup del build anterior creado
- [ ] Git pull ejecutado en servidor
- [ ] Dependencias instaladas (npm install)
- [ ] Build exitoso en servidor
- [ ] Aplicación reiniciada
- [ ] Logs verificados sin errores
- [ ] Aplicación accesible en el navegador
- [ ] Imágenes cargando correctamente

## Comandos Rápidos de Referencia

```bash
# Despliegue rápido (después de git push)
ssh root@tu-servidor "cd /root/Inventario-Academia-10.0 && git pull && npm install && npm run build && pm2 restart all"

# Ver logs
ssh root@tu-servidor "pm2 logs --lines 50"

# Verificar estado
ssh root@tu-servidor "pm2 status"

# Subir solo imágenes
scp -r public/images/* root@tu-servidor:/root/Inventario-Academia-10.0/public/images/
```

## Notas Importantes

1. **Siempre haz backup** antes de desplegar
2. **Verifica el build localmente** antes de desplegar
3. **Revisa los logs** después del despliegue
4. **Mantén Git actualizado** - es la forma más segura de desplegar
5. **Documenta cambios** en los commits para facilitar rollbacks

## Rollback en Caso de Problemas

Si algo sale mal:

```bash
# En el servidor
cd /root/Inventario-Academia-10.0

# Detener aplicación
pm2 stop all

# Restaurar backup del build
rm -rf .next
mv .next.backup.YYYYMMDD_HHMMSS .next

# O hacer rollback de Git
git log --oneline -5  # Ver últimos commits
git reset --hard COMMIT_HASH  # Volver a un commit anterior

# Reiniciar
pm2 restart all
```
