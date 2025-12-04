# 🚀 Guía Completa de Despliegue en Servidor

## Problema Actual

Tu servidor muestra dos errores:

1. **`sh: 1: next: not found`** - Las dependencias no están instaladas
2. **`TypeError: fetch failed`** - Las variables de entorno no están configuradas

## Solución Paso a Paso

### 1. Conectarse al Servidor

```bash
ssh root@vmi2724180.contaboserver.net
cd /root/Inventario-Academia-10.0
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# Esto instalará todos los paquetes necesarios incluyendo Next.js
```

**Tiempo estimado:** 2-5 minutos

### 3. Configurar Variables de Entorno

```bash
# Crear archivo de variables de entorno
nano .env.production
```

Pega este contenido (reemplaza con TUS valores reales):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
JWT_SECRET=tu-secreto-jwt-aqui
NODE_ENV=production
PORT=3000
```

**¿Dónde obtener estos valores?**

#### Supabase (CRÍTICO):

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a Settings → API
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### JWT Secret (CRÍTICO):

Genera uno nuevo:

```bash
openssl rand -base64 32
```

Guarda el archivo:

- `Ctrl + O` (guardar)
- `Enter` (confirmar)
- `Ctrl + X` (salir)

### 4. Verificar Configuración

```bash
# Ejecutar script de verificación
npm run verify-env
```

Si todo está bien, verás: ✅ CONFIGURACIÓN CORRECTA

### 5. Compilar la Aplicación

```bash
# Build de producción
npm run build
```

**Tiempo estimado:** 1-3 minutos

Si ves errores de módulos faltantes, ejecuta `npm install` nuevamente.

### 6. Iniciar la Aplicación

#### Opción A: Con PM2 (Recomendado)

```bash
# Instalar PM2 si no lo tienes
npm install -g pm2

# Detener procesos anteriores
pm2 stop all
pm2 delete all

# Iniciar aplicación
pm2 start npm --name "inventario-app" -- start

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

#### Opción B: Sin PM2

```bash
# Iniciar en background
nohup npm start > app.log 2>&1 &

# Ver el proceso
ps aux | grep node
```

### 7. Verificar que Funciona

```bash
# Ver logs en tiempo real
pm2 logs

# O si no usas PM2
tail -f app.log
```

Deberías ver algo como:

```
✓ Ready in 2.3s
○ Local:        http://localhost:3000
```

### 8. Probar en el Navegador

Abre tu navegador y ve a:

```
http://tu-servidor-ip:3000
```

O si tienes un dominio configurado:

```
https://tu-dominio.com
```

Intenta hacer login con tus credenciales.

## Script Automático de Despliegue

Para facilitar futuros despliegues, usa el script automático:

```bash
# Dar permisos de ejecución
chmod +x scripts/deploy-production.sh

# Ejecutar
bash scripts/deploy-production.sh
```

Este script hace todo automáticamente:

- ✅ Verifica el entorno
- ✅ Instala dependencias
- ✅ Verifica variables de entorno
- ✅ Compila la aplicación
- ✅ Reinicia el servicio

## Comandos Útiles

### Ver Estado de la Aplicación

```bash
pm2 status
```

### Ver Logs

```bash
pm2 logs
pm2 logs --lines 100
```

### Reiniciar Aplicación

```bash
pm2 restart all
```

### Detener Aplicación

```bash
pm2 stop all
```

### Ver Uso de Recursos

```bash
pm2 monit
```

## Configuración de Nginx (Opcional)

Si quieres usar un dominio y HTTPS:

```bash
# Instalar Nginx
apt update
apt install nginx

# Crear configuración
nano /etc/nginx/sites-available/inventario
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar:

```bash
ln -s /etc/nginx/sites-available/inventario /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Para HTTPS con Let's Encrypt:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

## Troubleshooting

### Error: "next: not found"

**Solución:** Ejecuta `npm install`

### Error: "TypeError: fetch failed"

**Solución:** Configura las variables de entorno en `.env.production`

### Error: "Port 3000 already in use"

**Solución:**

```bash
# Encontrar el proceso
lsof -i :3000

# Matar el proceso
kill -9 <PID>
```

### La aplicación se detiene al cerrar SSH

**Solución:** Usa PM2 o nohup

### No puedo acceder desde el navegador

**Solución:** Verifica el firewall

```bash
ufw allow 3000/tcp
ufw status
```

## Checklist Final

- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas (`.env.production`)
- [ ] Build exitoso (`npm run build`)
- [ ] Aplicación iniciada (PM2 o npm start)
- [ ] Logs sin errores (`pm2 logs`)
- [ ] Login funciona en el navegador
- [ ] Firewall permite el puerto 3000
- [ ] (Opcional) Nginx configurado
- [ ] (Opcional) HTTPS configurado

## Soporte

Si después de seguir todos estos pasos aún tienes problemas:

1. Ejecuta el diagnóstico completo:

   ```bash
   npm run verify-env
   pm2 logs --lines 200
   ```

2. Revisa los archivos de documentación:

   - `SOLUCION_ERROR_PRODUCCION.md`
   - `PRODUCTION_SETUP.md`
   - `MIGRATION_NOTES.md`

3. Verifica que Supabase esté funcionando:
   ```bash
   curl https://tu-proyecto.supabase.co/rest/v1/
   ```
