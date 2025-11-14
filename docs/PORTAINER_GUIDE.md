# Guía de Gestión con Portainer

Esta guía explica cómo usar Portainer para gestionar, monitorear y actualizar la aplicación de inventario en producción.

## Tabla de Contenidos

- [Acceso a Portainer](#acceso-a-portainer)
- [Crear Stack Inicial](#crear-stack-inicial)
- [Gestión de Contenedores](#gestión-de-contenedores)
- [Actualización de la Aplicación](#actualización-de-la-aplicación)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Gestión de Variables de Entorno](#gestión-de-variables-de-entorno)
- [Troubleshooting](#troubleshooting)

---

## Acceso a Portainer

### URL de Acceso

```
https://[IP-del-servidor]:9443
```

Por ejemplo: `https://192.168.1.100:9443`

### Primer Acceso

1. Abre tu navegador y ve a la URL de Portainer
2. Acepta el certificado autofirmado (es normal en la primera instalación)
3. Crea tu cuenta de administrador:
   - **Username**: admin
   - **Password**: [contraseña segura de al menos 12 caracteres]
4. Click en **Create user**

### Conectar al Entorno Local

1. Selecciona **Get Started**
2. Portainer detectará automáticamente el Docker Engine local
3. Click en **local** para acceder al entorno

---

## Crear Stack Inicial

Un "Stack" en Portainer es equivalente a un proyecto de Docker Compose.

### Método 1: Desde Docker Compose File

#### Paso 1: Ir a Stacks

1. En el menú lateral, click en **Stacks**
2. Click en **+ Add stack**

#### Paso 2: Configurar Stack

1. **Name**: `inventory-app-production`
2. **Build method**: Selecciona **Web editor**

#### Paso 3: Pegar Docker Compose

Copia y pega el contenido de tu `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: inventory-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.production
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    networks:
      - app-network
    depends_on:
      - app

networks:
  app-network:
    driver: bridge
```

#### Paso 4: Configurar Variables de Entorno (Opcional)

Si no usas `env_file`, puedes agregar variables de entorno directamente:

1. Scroll down a **Environment variables**
2. Click en **+ add an environment variable**
3. Agregar cada variable:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `postgresql://...`
   - etc.

#### Paso 5: Deploy Stack

1. Click en **Deploy the stack**
2. Espera a que se construyan y levanten los contenedores
3. Verás el estado de cada servicio

### Método 2: Desde Repositorio Git

#### Paso 1: Configurar Stack

1. **Name**: `inventory-app-production`
2. **Build method**: Selecciona **Git Repository**

#### Paso 2: Configurar Repositorio

1. **Repository URL**: `https://github.com/your-username/inventory-system`
2. **Repository reference**: `refs/heads/main`
3. **Compose path**: `docker-compose.yml`

#### Paso 3: Autenticación (si es repositorio privado)

1. Marca **Authentication**
2. **Username**: tu usuario de GitHub
3. **Personal Access Token**: tu token de GitHub

#### Paso 4: Deploy

1. Click en **Deploy the stack**
2. Portainer clonará el repo y desplegará automáticamente

---

## Gestión de Contenedores

### Ver Estado de Contenedores

1. En el menú lateral, click en **Containers**
2. Verás lista de todos los contenedores:
   - `inventory-app` - Aplicación Next.js
   - `nginx-proxy` - Proxy reverso

### Información de Cada Contenedor

Click en el nombre del contenedor para ver:

- **Stats**: CPU, memoria, red, I/O
- **Logs**: Logs en tiempo real
- **Inspect**: Configuración detallada
- **Console**: Acceso a terminal

### Acciones Rápidas

Desde la lista de contenedores, puedes:

- **Start**: Iniciar contenedor detenido
- **Stop**: Detener contenedor
- **Restart**: Reiniciar contenedor
- **Kill**: Forzar detención
- **Remove**: Eliminar contenedor

### Acceder a la Consola

1. Click en el contenedor (ej: `inventory-app`)
2. Click en **Console**
3. Selecciona **Command**: `/bin/sh` (para Alpine) o `/bin/bash`
4. Click en **Connect**

Ahora puedes ejecutar comandos dentro del contenedor:

```bash
# Ver archivos
ls -la

# Ver variables de entorno
env

# Probar conexión a base de datos
node -e "console.log(process.env.DATABASE_URL)"
```

---

## Actualización de la Aplicación

### Método 1: Pull and Redeploy (Recomendado)

Este método es el más simple para actualizaciones.

#### Paso 1: Preparar Nueva Versión

Desde tu servidor, actualiza el código:

```bash
cd /opt/inventory-app
git pull origin main
docker-compose build
```

#### Paso 2: Actualizar en Portainer

1. Ve a **Stacks**
2. Click en `inventory-app-production`
3. Click en **Editor**
4. Si no hay cambios en docker-compose.yml, solo click en **Update the stack**
5. Marca **Re-pull image and redeploy**
6. Click en **Update**

Portainer:
- Detendrá los contenedores actuales
- Descargará las nuevas imágenes
- Recreará los contenedores
- Iniciará los nuevos contenedores

#### Paso 3: Verificar

1. Ve a **Containers**
2. Verifica que los contenedores están **running**
3. Click en `inventory-app` → **Logs** para ver que inició correctamente

### Método 2: Actualizar Stack Completo

Si cambiaste el `docker-compose.yml`:

#### Paso 1: Editar Stack

1. Ve a **Stacks** → `inventory-app-production`
2. Click en **Editor**
3. Modifica el contenido del docker-compose.yml
4. Click en **Update the stack**

#### Paso 2: Opciones de Actualización

- ✅ **Prune services**: Eliminar servicios que ya no están en el compose
- ✅ **Re-pull images**: Descargar imágenes actualizadas

#### Paso 3: Deploy

Click en **Update** y espera a que se complete.

### Método 3: Recrear Contenedor Individual

Para actualizar solo un contenedor:

#### Paso 1: Detener Contenedor

1. Ve a **Containers**
2. Selecciona el contenedor (ej: `inventory-app`)
3. Click en **Stop**

#### Paso 2: Recrear

1. Click en **Recreate**
2. Marca **Pull latest image**
3. Click en **Recreate**

---

## Monitoreo y Logs

### Ver Logs en Tiempo Real

#### Desde Lista de Contenedores

1. Ve a **Containers**
2. Click en el icono de logs (📄) junto al contenedor
3. Los logs se mostrarán en tiempo real

#### Desde Detalle del Contenedor

1. Click en el nombre del contenedor
2. Click en **Logs**
3. Opciones disponibles:
   - **Auto-refresh**: Actualización automática
   - **Wrap lines**: Ajustar líneas largas
   - **Timestamps**: Mostrar timestamps
   - **Fetch**: Número de líneas a mostrar

#### Buscar en Logs

1. Usa Ctrl+F (Cmd+F en Mac) en el navegador
2. Busca términos específicos como "error", "warning", etc.

### Monitorear Recursos

#### Stats de Contenedor Individual

1. Click en el contenedor
2. Ve a **Stats**
3. Verás gráficos en tiempo real de:
   - CPU usage
   - Memory usage
   - Network I/O
   - Block I/O

#### Dashboard General

1. Ve a **Dashboard** en el menú lateral
2. Verás resumen de:
   - Contenedores running/stopped
   - Imágenes
   - Volúmenes
   - Redes

### Alertas y Notificaciones

Portainer Business Edition incluye alertas, pero en la versión Community puedes:

1. Monitorear manualmente
2. Configurar health checks en docker-compose.yml
3. Usar herramientas externas (Prometheus, Grafana)

---

## Gestión de Variables de Entorno

### Ver Variables de Entorno

#### Método 1: Desde Contenedor

1. Click en el contenedor
2. Ve a **Inspect**
3. Busca la sección **Env**

#### Método 2: Desde Console

1. Accede a la consola del contenedor
2. Ejecuta: `env`

### Modificar Variables de Entorno

⚠️ **Importante**: Cambiar variables requiere recrear el contenedor.

#### Paso 1: Editar Stack

1. Ve a **Stacks** → `inventory-app-production`
2. Click en **Editor**

#### Paso 2: Modificar Variables

Opción A - En docker-compose.yml:

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - NEW_VARIABLE=new_value
```

Opción B - Usar env_file:

```yaml
services:
  app:
    env_file:
      - .env.production
```

Luego edita `.env.production` en el servidor:

```bash
ssh user@server
cd /opt/inventory-app
nano .env.production
# Hacer cambios
```

#### Paso 3: Actualizar Stack

1. Click en **Update the stack**
2. Marca **Re-pull and redeploy**
3. Click en **Update**

### Variables Sensibles

⚠️ **Nunca** pongas credenciales directamente en el docker-compose.yml visible en Portainer.

Usa siempre `env_file` para variables sensibles:

```yaml
env_file:
  - .env.production  # Este archivo está en el servidor, no en Portainer
```

---

## Troubleshooting

### Problema: Contenedor no inicia

#### Diagnóstico

1. Ve a **Containers**
2. Click en el contenedor con problema
3. Ve a **Logs** para ver el error

#### Soluciones Comunes

**Error de puerto en uso:**
```
Error: bind: address already in use
```
Solución: Detén el servicio que usa ese puerto o cambia el puerto en docker-compose.yml

**Error de variables de entorno:**
```
Error: DATABASE_URL is not defined
```
Solución: Verifica que `.env.production` existe y tiene las variables correctas

**Error de permisos:**
```
Error: EACCES: permission denied
```
Solución: Verifica permisos de archivos y volúmenes

### Problema: No puedo ver logs

#### Solución

1. Verifica que el contenedor está corriendo
2. Si está stopped, inícialo primero
3. Los logs solo están disponibles para contenedores running

### Problema: Stack no se actualiza

#### Solución

1. Ve a **Stacks** → tu stack
2. Click en **Stop**
3. Espera a que se detenga completamente
4. Click en **Start**
5. O elimina el stack y créalo de nuevo

### Problema: "Cannot connect to Docker daemon"

#### Solución

1. Verifica que Docker está corriendo en el servidor:
   ```bash
   sudo systemctl status docker
   ```

2. Reinicia Docker si es necesario:
   ```bash
   sudo systemctl restart docker
   ```

3. Reinicia Portainer:
   ```bash
   docker restart portainer
   ```

### Problema: Portainer no responde

#### Solución

```bash
# Verificar que Portainer está corriendo
docker ps | grep portainer

# Si no está corriendo, iniciarlo
docker start portainer

# Ver logs de Portainer
docker logs portainer

# Reiniciar Portainer
docker restart portainer
```

---

## Comandos Útiles

### Desde la Consola de Portainer

Dentro del contenedor `inventory-app`:

```bash
# Ver versión de Node
node --version

# Ver variables de entorno
env | grep DATABASE

# Probar conexión a base de datos
node -e "console.log('Testing DB connection...')"

# Ver archivos de la aplicación
ls -la /app

# Ver logs de la aplicación (si se guardan en archivo)
tail -f /app/logs/app.log
```

### Desde el Servidor (SSH)

```bash
# Ver contenedores gestionados por Portainer
docker ps

# Ver logs de un contenedor
docker logs inventory-app

# Ejecutar comando en contenedor
docker exec -it inventory-app sh

# Ver uso de recursos
docker stats

# Reiniciar contenedor
docker restart inventory-app
```

---

## Mejores Prácticas

### 1. Backups Regulares

Antes de actualizaciones importantes:

1. Ve a **Stacks** → tu stack
2. Copia el contenido del docker-compose.yml
3. Guárdalo en un archivo local

### 2. Monitoreo Constante

- Revisa logs diariamente
- Monitorea uso de recursos
- Configura health checks

### 3. Actualizaciones Graduales

- Prueba actualizaciones en desarrollo primero
- Haz actualizaciones en horarios de bajo tráfico
- Ten un plan de rollback

### 4. Documentación

- Documenta cambios en variables de entorno
- Mantén registro de versiones desplegadas
- Documenta problemas y soluciones

### 5. Seguridad

- Usa contraseñas fuertes para Portainer
- Limita acceso a Portainer (firewall)
- No expongas Portainer a internet sin VPN
- Actualiza Portainer regularmente

---

## Recursos Adicionales

- [Portainer Documentation](https://docs.portainer.io/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)

**Última actualización**: 2025-01-22
