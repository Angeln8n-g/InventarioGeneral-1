# Guía de Configuración en Producción

## Error Actual: `TypeError: fetch failed`

Este error indica que la aplicación no puede conectarse a Supabase. La causa más común es que las variables de entorno no están configuradas correctamente en el servidor de producción.

## Variables de Entorno Requeridas

Asegúrate de que estas variables estén configuradas en tu servidor de producción:

### 1. Variables de Supabase (CRÍTICAS)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```

**Cómo obtenerlas:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a Settings > API
3. Copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Project API keys > anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Variable de JWT (CRÍTICA)

```bash
JWT_SECRET=tu-secreto-jwt-seguro-aqui
```

**Cómo generarla:**
```bash
openssl rand -base64 32
```

### 3. Variables Opcionales

```bash
NODE_ENV=production
PORT=3000
```

## Pasos para Configurar en Producción

### Opción 1: Usando archivo .env en el servidor

1. Conéctate a tu servidor:
```bash
ssh usuario@tu-servidor
```

2. Ve al directorio del proyecto:
```bash
cd /root/Inventario-Academia-10.0
```

3. Crea o edita el archivo `.env.production`:
```bash
nano .env.production
```

4. Agrega las variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
JWT_SECRET=tu-secreto-jwt
NODE_ENV=production
```

5. Guarda el archivo (Ctrl+O, Enter, Ctrl+X)

6. Reinicia la aplicación:
```bash
pm2 restart all
# O si usas otro gestor de procesos:
systemctl restart tu-servicio
```

### Opción 2: Variables de entorno del sistema

Si usas PM2:

```bash
pm2 stop all
pm2 delete all

pm2 start npm --name "inventario-app" -- start \
  --env NEXT_PUBLIC_SUPABASE_URL=https://owqwqjexxeymvecxczxy.supabase.co \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cXdxamV4eGV5bXZlY3hjenh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQyODU2NywiZXhwIjoyMDc1MDA0NTY3fQ.gBBDn8TDX8fAcuoKWbs80xSueQo_effNqz1PBQW0na4 \
  --env JWT_SECRET=H@xuelPruebaTodo22MarisolCanta21 \
  --env NODE_ENV=production
```

O crea un archivo `ecosystem.config.js`:

```javascript
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
```

Luego ejecuta:
```bash
pm2 start ecosystem.config.js
```

### Opción 3: Variables en Docker

Si usas Docker, agrega al `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
      - JWT_SECRET=tu-secreto-jwt
      - NODE_ENV=production
```

## Verificación

### 1. Verificar que las variables están cargadas

Crea un endpoint temporal para verificar (ELIMINAR DESPUÉS):

```bash
# En el servidor
cd /root/Inventario-Academia-10.0
node -e "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### 2. Verificar logs de la aplicación

```bash
# Si usas PM2:
pm2 logs

# Si usas systemd:
journalctl -u tu-servicio -f

# O revisa los logs de Next.js:
tail -f .next/server/app-paths-manifest.json
```

### 3. Probar la conexión a Supabase

Desde el servidor, ejecuta:

```bash
curl -X GET "https://tu-proyecto.supabase.co/rest/v1/" \
  -H "apikey: tu-clave-anonima" \
  -H "Authorization: Bearer tu-clave-anonima"
```

Si esto funciona, el problema es solo de configuración de variables.

## Checklist de Troubleshooting

- [ ] Las variables de entorno están configuradas en el servidor
- [ ] El archivo `.env.production` existe y tiene los valores correctos
- [ ] Las URLs de Supabase son correctas (sin espacios ni caracteres extra)
- [ ] La aplicación se reinició después de configurar las variables
- [ ] El firewall permite conexiones salientes a Supabase
- [ ] No hay proxies o VPNs bloqueando la conexión

## Comandos Útiles

```bash
# Ver variables de entorno del proceso
pm2 env 0

# Reiniciar aplicación
pm2 restart all

# Ver logs en tiempo real
pm2 logs --lines 100

# Verificar estado
pm2 status

# Rebuild de la aplicación
npm run build
pm2 restart all
```

## Solución Rápida

Si tienes acceso SSH al servidor:

```bash
# 1. Ir al directorio
cd /root/Inventario-Academia-10.0

# 2. Crear archivo .env.production
cat > .env.production << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=TU_URL_AQUI
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_KEY_AQUI
JWT_SECRET=TU_SECRET_AQUI
NODE_ENV=production
EOF

# 3. Reiniciar
pm2 restart all

# 4. Ver logs
pm2 logs
```

## Contacto de Soporte

Si el problema persiste después de verificar todo lo anterior:

1. Verifica que Supabase esté funcionando: https://status.supabase.com
2. Revisa los logs completos del servidor
3. Verifica la configuración de red/firewall del servidor
