# 🔴 Solución al Error: "TypeError: fetch failed"

## Problema

Tu aplicación en producción muestra este error al intentar hacer login:

```
TypeError: fetch failed
at node:internal/deps/undici/undici:14900:13
at async Object.getByUsername
```

## Causa

**Las variables de entorno de Supabase NO están configuradas en el servidor de producción.**

La aplicación intenta conectarse a Supabase pero no encuentra las credenciales necesarias.

## Solución Rápida (10 minutos)

### Paso 0: Verificar que node_modules existe

```bash
ssh root@tu-servidor
cd /root/Inventario-Academia-10.0

# Si no existe node_modules, instalar dependencias
ls node_modules || npm install
```

### Paso 1: Conectarse al servidor

```bash
ssh root@tu-servidor
cd /root/Inventario-Academia-10.0
```

### Paso 2: Crear archivo de variables de entorno

```bash
nano .env.production
```

### Paso 3: Agregar estas variables (con TUS valores reales)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
JWT_SECRET=tu-secreto-jwt-seguro
NODE_ENV=production
```

**¿Dónde obtener estos valores?**

1. **NEXT_PUBLIC_SUPABASE_URL** y **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto
   - Ve a Settings → API
   - Copia "Project URL" y "anon public key"

2. **JWT_SECRET**:
   - Genera uno nuevo con: `openssl rand -base64 32`
   - O usa el que tenías en desarrollo (revisa tu `.env.local`)

### Paso 4: Guardar y salir

- Presiona `Ctrl + O` (guardar)
- Presiona `Enter` (confirmar)
- Presiona `Ctrl + X` (salir)

### Paso 5: Rebuild de la aplicación

```bash
# Hacer build de producción
npm run build
```

### Paso 6: Reiniciar la aplicación

```bash
pm2 restart all
```

O si no usas PM2:

```bash
# Si usas systemd
systemctl restart tu-servicio

# Si usas npm directamente
pkill node
npm start
```

### Paso 7: Verificar

```bash
# Ver los logs
pm2 logs

# O ejecutar el script de verificación
npm run verify-env
```

## Verificación Manual

Si quieres verificar que las variables están cargadas:

```bash
# En el servidor
cd /root/Inventario-Academia-10.0
node -e "console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'NO configurada')"
node -e "console.log('JWT:', process.env.JWT_SECRET ? 'Configurado' : 'NO configurado')"
```

## Alternativa: Usar PM2 Ecosystem

Si prefieres usar PM2 con un archivo de configuración:

```bash
# Crear ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inventario-app',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://tu-proyecto.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'tu-clave-anonima',
      JWT_SECRET: 'tu-secreto-jwt',
      PORT: 3000
    }
  }]
}
EOF

# Reiniciar con la nueva configuración
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

## Checklist de Verificación

- [ ] Las variables están en `.env.production` o `ecosystem.config.js`
- [ ] Los valores son correctos (sin espacios extra, sin comillas)
- [ ] La aplicación se reinició después de configurar las variables
- [ ] Los logs no muestran más errores de "fetch failed"
- [ ] Puedes hacer login exitosamente

## Si el Problema Persiste

1. **Verifica que Supabase esté funcionando:**
   ```bash
   curl https://tu-proyecto.supabase.co/rest/v1/
   ```

2. **Revisa el firewall del servidor:**
   ```bash
   # Permitir conexiones salientes
   ufw allow out 443/tcp
   ```

3. **Verifica los logs completos:**
   ```bash
   pm2 logs --lines 200
   ```

4. **Prueba la conexión desde el servidor:**
   ```bash
   curl -X GET "https://tu-proyecto.supabase.co/rest/v1/" \
     -H "apikey: tu-clave-anonima" \
     -H "Authorization: Bearer tu-clave-anonima"
   ```

## Archivos de Ayuda Creados

- `PRODUCTION_SETUP.md` - Guía completa de configuración
- `scripts/verify-env.js` - Script de verificación automática
- `.env.production.example` - Plantilla de variables de entorno

## Comando de Verificación

Después de configurar, ejecuta:

```bash
npm run verify-env
```

Este script te dirá exactamente qué variables faltan o están mal configuradas.
