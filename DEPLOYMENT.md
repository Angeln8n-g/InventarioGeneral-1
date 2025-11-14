# Guía de Despliegue a Producción

Esta guía proporciona instrucciones paso a paso para desplegar la aplicación de gestión de inventario en un servidor Ubuntu 20.04 usando Docker, Nginx y Portainer.

## Tabla de Contenidos

- [Requisitos del Servidor](#requisitos-del-servidor)
- [Configuración Inicial del Servidor](#configuración-inicial-del-servidor)
- [Instalación de Dependencias](#instalación-de-dependencias)
- [Configuración de PostgreSQL](#configuración-de-postgresql)
- [Configuración del Dominio](#configuración-del-dominio)
- [Scripts de Despliegue Automatizado](#scripts-de-despliegue-automatizado)
- [Despliegue de la Aplicación](#despliegue-de-la-aplicación)
- [Configuración de SSL](#configuración-de-ssl)
- [Verificación del Despliegue](#verificación-del-despliegue)
- [Actualización de la Aplicación](#actualización-de-la-aplicación)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## Requisitos del Servidor

### Especificaciones Mínimas

- **Sistema Operativo**: Ubuntu 20.04 LTS
- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Disco**: 40 GB SSD
- **Ancho de banda**: 2 TB/mes

### Especificaciones Recomendadas

- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Disco**: 80 GB SSD
- **Ancho de banda**: Ilimitado

### Software Requerido

- Docker Engine 20.10+
- Docker Compose 2.0+
- Nginx (via Docker)
- PostgreSQL 12+
- Certbot (para SSL)
- Git

---

## Configuración Inicial del Servidor

### 1. Conectar al Servidor

```bash
ssh root@your-server-ip
# O si tienes un usuario no-root:
ssh your-username@your-server-ip
```

### 2. Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Crear Usuario para la Aplicación (Opcional pero Recomendado)

```bash
# Crear usuario
sudo adduser inventory

# Agregar al grupo sudo
sudo usermod -aG sudo inventory

# Cambiar a nuevo usuario
su - inventory
```

### 4. Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow OpenSSH

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir Portainer (opcional, solo si necesitas acceso externo)
sudo ufw allow 9443/tcp

# Verificar estado
sudo ufw status
```

---

## Instalación de Dependencias

### 1. Instalar Docker

```bash
# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Agregar clave GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio de Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Verificar instalación
docker --version

# Agregar usuario al grupo docker (para ejecutar sin sudo)
sudo usermod -aG docker $USER

# Aplicar cambios de grupo (o cerrar sesión y volver a entrar)
newgrp docker
```

### 2. Instalar Docker Compose

```bash
# Descargar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

### 3. Instalar Git

```bash
sudo apt install -y git
git --version
```

### 4. Instalar Certbot (para SSL)

```bash
sudo apt install -y certbot
certbot --version
```

---

## Configuración de PostgreSQL

### 1. Instalar PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Verificar que está corriendo
sudo systemctl status postgresql

# Habilitar inicio automático
sudo systemctl enable postgresql
```

### 2. Crear Base de Datos y Usuario

```bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar:
CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;

# Salir de psql
\q
```

### 3. Configurar PostgreSQL para Aceptar Conexiones desde Docker

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Agregar esta línea al final del archivo:
# host    all             all             172.16.0.0/12           md5

# Editar postgresql.conf
sudo nano /etc/postgresql/12/main/postgresql.conf

# Buscar y modificar:
# listen_addresses = 'localhost,172.17.0.1'

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 4. Verificar Conectividad

```bash
# Probar conexión local
psql -h localhost -U inventory_user -d inventory_db

# Si funciona, salir con \q
```

---

## Configuración del Dominio

### 1. Configurar DNS

En tu proveedor de DNS (donde compraste el dominio), crea un registro A:

```
Tipo: A
Nombre: inventario
Dominio: hunykho.com
Valor: [IP de tu servidor]
TTL: 3600 (o automático)
```

Resultado: `inventario.hunykho.com` → `[IP del servidor]`

### 2. Verificar Propagación DNS

```bash
# Desde tu computadora local
nslookup inventario.hunykho.com

# O usar herramientas online:
# https://dnschecker.org
```

Espera a que el DNS se propague (puede tomar de 5 minutos a 48 horas).

---

## Despliegue de la Aplicación

### 1. Crear Directorio de la Aplicación

```bash
# Crear directorio
sudo mkdir -p /opt/inventory-app
sudo chown $USER:$USER /opt/inventory-app
cd /opt/inventory-app
```

### 2. Clonar el Repositorio

```bash
# Clonar repositorio
git clone https://github.com/your-username/inventory-system.git .

# O si usas SSH:
git clone git@github.com:your-username/inventory-system.git .
```

### 3. Crear Archivo de Variables de Entorno

```bash
# Copiar template
cp .env.production.example .env.production

# Editar con tus valores reales
nano .env.production
```

Configuración mínima requerida en `.env.production`:

```bash
NODE_ENV=production
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://inventory_user:your_secure_password@host.docker.internal:5432/inventory_db
POSTGRES_HOST=host.docker.internal
POSTGRES_PORT=5432
POSTGRES_DB=inventory_db
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=your_secure_password_here

# Supabase (si aplica)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret (generar con: openssl rand -base64 32)
JWT_SECRET=your_generated_secret_here
```

### 4. Proteger el Archivo de Variables de Entorno

```bash
# Cambiar permisos para que solo el owner pueda leer/escribir
chmod 600 .env.production
```

### 5. Crear Directorios Necesarios

```bash
# Crear directorios para logs y SSL
mkdir -p logs/nginx
mkdir -p nginx/ssl
```

---

## Configuración de SSL

### 1. Detener Nginx Temporalmente (si está corriendo)

```bash
docker-compose down
```

### 2. Obtener Certificado SSL con Certbot

```bash
# Obtener certificado usando modo standalone
sudo certbot certonly --standalone -d inventario.hunykho.com

# Seguir las instrucciones en pantalla:
# - Ingresar email
# - Aceptar términos de servicio
# - Decidir si compartir email con EFF
```

### 3. Copiar Certificados al Directorio de Nginx

```bash
# Copiar certificados
sudo cp /etc/letsencrypt/live/inventario.hunykho.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/inventario.hunykho.com/privkey.pem nginx/ssl/

# Cambiar permisos
sudo chown $USER:$USER nginx/ssl/*.pem
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem
```

### 4. Configurar Renovación Automática

```bash
# Crear script de renovación
sudo nano /etc/cron.d/certbot-renew
```

Agregar:

```bash
0 3 * * * root certbot renew --quiet --deploy-hook "cp /etc/letsencrypt/live/inventario.hunykho.com/*.pem /opt/inventory-app/nginx/ssl/ && docker exec nginx-proxy nginx -s reload"
```

---

## Despliegue de la Aplicación

### Opción 1: Despliegue Automatizado con Script (Recomendado)

El proyecto incluye scripts de despliegue automatizado que simplifican el proceso:

#### En Linux/Ubuntu (Servidor de Producción)

```bash
# Desde /opt/inventory-app
cd /opt/inventory-app

# Dar permisos de ejecución al script
chmod +x deploy.sh

# Ejecutar despliegue completo (build + deploy + health checks)
./deploy.sh --all

# O ejecutar pasos individuales:
./deploy.sh --build              # Solo construir imágenes
./deploy.sh --deploy             # Solo desplegar
./deploy.sh --check              # Solo verificar salud

# Ver ayuda
./deploy.sh --help
```

#### En Windows (Desarrollo Local)

```powershell
# Desde el directorio del proyecto
cd C:\path\to\inventory-app

# Ejecutar despliegue completo
.\deploy.ps1 -All

# O ejecutar pasos individuales:
.\deploy.ps1 -Build              # Solo construir imágenes
.\deploy.ps1 -Deploy             # Solo desplegar
.\deploy.ps1 -Check              # Solo verificar salud
```

#### Características del Script de Despliegue

El script automatiza:
- ✅ Verificación de prerequisitos (Docker, Docker Compose)
- ✅ Construcción de imágenes Docker
- ✅ Despliegue de contenedores
- ✅ Health checks automáticos
- ✅ Verificación de estado de contenedores
- ✅ Verificación de endpoint de salud
- ✅ Verificación de Nginx
- ✅ Reporte de estado final

### Opción 2: Despliegue Manual

Si prefieres ejecutar los comandos manualmente:

```bash
# Desde /opt/inventory-app
cd /opt/inventory-app

# Construir imagen
docker-compose build

# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 2. Verificar que los Contenedores Están Corriendo

```bash
docker-compose ps

# Deberías ver:
# - inventory-app (running)
# - nginx-proxy (running)
```

### 3. Aplicar Migraciones de Base de Datos (si aplica)

```bash
# Ejecutar migraciones dentro del contenedor
docker exec -it inventory-app npm run migrate

# O si usas otro comando de migración
docker exec -it inventory-app npm run db:migrate
```

---

## Verificación del Despliegue

### 1. Verificar Health Check

```bash
# Desde el servidor
curl http://localhost:3000/api/health

# Debería retornar: {"status":"ok"}
```

### 2. Verificar Nginx

```bash
# Verificar que Nginx está corriendo
docker exec nginx-proxy nginx -t

# Ver logs de Nginx
docker-compose logs nginx
```

### 3. Verificar Acceso Externo

Desde tu navegador, visita:

```
https://inventario.hunykho.com
```

Deberías ver la aplicación funcionando con SSL válido.

### 4. Verificar Conexión a Base de Datos

```bash
# Ver logs de la aplicación
docker-compose logs app

# Buscar mensajes de conexión exitosa a PostgreSQL
```

---

## Actualización de la Aplicación

### Método 1: Actualización con Script (Recomendado)

```bash
# 1. Ir al directorio de la aplicación
cd /opt/inventory-app

# 2. Hacer pull de los últimos cambios
git pull origin main

# 3. Ejecutar script de despliegue
./deploy.sh --all

# El script automáticamente:
# - Construye la nueva imagen
# - Detiene contenedores antiguos
# - Inicia nuevos contenedores
# - Verifica que todo funcione correctamente
```

### Método 2: Actualización Manual

```bash
# 1. Ir al directorio de la aplicación
cd /opt/inventory-app

# 2. Hacer pull de los últimos cambios
git pull origin main

# 3. Reconstruir imagen
docker-compose build

# 4. Recrear contenedores
docker-compose up -d

# 5. Verificar logs
docker-compose logs -f app
```

### Método 2: Usando Portainer

1. Abrir Portainer: `https://your-server-ip:9443`
2. Ir a **Stacks** → **inventory-app-production**
3. Click en **Pull and redeploy**
4. Confirmar la acción
5. Monitorear logs en tiempo real

---

## Rollback

Si algo sale mal después de una actualización:

### Método 1: Rollback con Script (Recomendado)

```bash
# Rollback a una versión específica
./deploy.sh --rollback --version v1.0.0

# El script automáticamente:
# - Detiene contenedores actuales
# - Despliega la versión especificada
# - Verifica que funcione correctamente
```

### Método 2: Rollback con Git

```bash
# Ver commits recientes
git log --oneline -5

# Volver a commit anterior
git checkout <commit-hash>

# Reconstruir y redesplegar
docker-compose build
docker-compose up -d

# O usar el script
./deploy.sh --all
```

### Método 2: Usar Imagen Docker Anterior

```bash
# Listar imágenes
docker images

# Editar docker-compose.yml para usar tag anterior
nano docker-compose.yml

# Cambiar:
# image: inventory-app:v1.0.1
# Por:
# image: inventory-app:v1.0.0

# Redesplegar
docker-compose up -d
```

---

## Troubleshooting

### Problema: Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs app

# Ver estado del contenedor
docker-compose ps

# Reiniciar contenedor
docker-compose restart app
```

### Problema: Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar conectividad desde contenedor
docker exec -it inventory-app ping host.docker.internal

# Probar conexión a PostgreSQL
docker exec -it inventory-app psql $DATABASE_URL -c "SELECT 1"

# Verificar pg_hba.conf
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Verificar logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

### Problema: Error 502 Bad Gateway

```bash
# Verificar que app está corriendo
docker-compose ps app

# Verificar health check
curl http://localhost:3000/api/health

# Ver logs de Nginx
docker-compose logs nginx

# Verificar configuración de Nginx
docker exec nginx-proxy nginx -t
```

### Problema: Certificado SSL expirado

```bash
# Renovar manualmente
sudo certbot renew --force-renewal

# Copiar certificados
sudo cp /etc/letsencrypt/live/inventario.hunykho.com/*.pem /opt/inventory-app/nginx/ssl/

# Recargar Nginx
docker exec nginx-proxy nginx -s reload
```

### Problema: Disco lleno

```bash
# Ver uso de disco
df -h

# Limpiar imágenes Docker antiguas
docker image prune -a

# Limpiar contenedores detenidos
docker container prune

# Limpiar volúmenes no usados
docker volume prune
```

### Problema: Alto uso de memoria

```bash
# Ver uso de recursos
docker stats

# Reiniciar contenedores
docker-compose restart

# Si persiste, considerar aumentar RAM del servidor
```

---

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo de app
docker-compose logs -f app

# Reiniciar todos los servicios
docker-compose restart

# Detener todos los servicios
docker-compose down

# Reconstruir sin cache
docker-compose build --no-cache

# Ejecutar comando dentro del contenedor
docker exec -it inventory-app sh

# Ver uso de recursos
docker stats

# Limpiar sistema Docker
docker system prune -a
```

---

## Contacto y Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.

**Última actualización**: 2025-01-22
