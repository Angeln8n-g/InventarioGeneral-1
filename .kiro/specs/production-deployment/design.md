# Design Document - Production Deployment

## Overview

Este documento describe el diseño técnico para desplegar la aplicación de gestión de inventario Next.js 15 en un servidor Ubuntu usando Docker, Nginx como proxy reverso, y Portainer para gestión de contenedores. La arquitectura está diseñada para ser escalable, segura y fácil de mantener.

### Technology Stack

- **Application**: Next.js 15.5.4 con React 19
- **Runtime**: Node.js 20 LTS
- **Containerization**: Docker con multi-stage builds
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx con SSL/TLS (Let's Encrypt)
- **Container Management**: Portainer
- **Database**: PostgreSQL (instancia en el mismo servidor)
- **Server OS**: Ubuntu 20.04 LTS
- **Domain**: inventario.hunykho.com

### Deployment Architecture

```
Internet
    ↓
[Firewall - Ports 80, 443, 9443, 5432]
    ↓
[Nginx Reverse Proxy]
    ↓ (proxy_pass)
[Next.js Container :3000]
    ↓ (database connection)
[PostgreSQL :5432] (host network)

[Portainer :9443] → Manages all containers
```

## Architecture

### Container Architecture

#### Multi-Stage Docker Build

La imagen Docker utiliza un enfoque multi-stage para optimizar el tamaño y la seguridad:

**Stage 1: Dependencies**
- Base: `node:20-alpine`
- Instala dependencias de producción y desarrollo
- Copia package.json y package-lock.json
- Ejecuta `npm ci`

**Stage 2: Builder**
- Copia código fuente
- Ejecuta `next build` con optimizaciones
- Genera archivos estáticos optimizados

**Stage 3: Runner (Production)**
- Base: `node:20-alpine`
- Copia solo dependencias de producción
- Copia build artifacts de stage anterior
- Usuario no-root para seguridad
- Expone puerto 3000
- Health check configurado

### Network Architecture

```mermaid
graph TB
    A[Internet] -->|HTTPS 443| B[Nginx Container]
    A -->|HTTP 80| B
    B -->|Redirect| B
    B -->|proxy_pass :3000| C[Next.js Container]
    C -->|TCP :5432| D[PostgreSQL Server]
    E[Portainer :9443] -.->|Manage| B
    E -.->|Manage| C
    
    subgraph "Docker Network: app-network"
        B
        C
    end
    
    subgraph "Host Network"
        D
    end
```

### File System Structure

```
/opt/inventory-app/
├── docker-compose.yml
├── .env.production
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│       ├── fullchain.pem
│       └── privkey.pem
├── app/
│   └── Dockerfile
└── logs/
    ├── nginx/
    └── app/
```

## Components and Interfaces

### 1. Dockerfile (Next.js Application)


**Purpose**: Containerizar la aplicación Next.js con optimizaciones de producción

**Key Features**:
- Multi-stage build para reducir tamaño de imagen final
- Alpine Linux para imagen base ligera
- Sharp dependencies para procesamiento de imágenes
- Non-root user para seguridad
- Health check endpoint

**Optimizations**:
- Layer caching para dependencies
- `.dockerignore` para excluir archivos innecesarios
- Standalone output de Next.js para reducir tamaño
- Compresión de assets estáticos

**Environment Variables**:
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)
- `POSTGRES_HOST`
- `POSTGRES_PORT=5432`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `PORT=3000`

### 2. Docker Compose Configuration

**Purpose**: Orquestar múltiples servicios y definir infraestructura como código

**Services**:

**a) Next.js Application Service**
- Container name: `inventory-app`
- Build context: `./app`
- Port mapping: `3000:3000`
- Environment: Variables desde `.env.production`
- Extra hosts: `host.docker.internal:host-gateway` (para conectar a PostgreSQL en host)
- Restart policy: `unless-stopped`
- Networks: `app-network`
- Health check: `curl -f http://localhost:3000/api/health`

**b) Nginx Service**
- Container name: `nginx-proxy`
- Image: `nginx:alpine`
- Port mapping: `80:80`, `443:443`
- Volumes: 
  - `./nginx/nginx.conf:/etc/nginx/nginx.conf:ro`
  - `./nginx/ssl:/etc/nginx/ssl:ro`
  - `./logs/nginx:/var/log/nginx`
- Depends on: `inventory-app`
- Restart policy: `unless-stopped`
- Networks: `app-network`

**Networks**:
- `app-network`: Bridge network para comunicación entre contenedores

**Volumes**:
- Logs persistentes para debugging
- Configuración de Nginx montada como read-only
- Certificados SSL montados de forma segura

### 3. Nginx Configuration

**Purpose**: Actuar como proxy reverso, manejar SSL/TLS, y optimizar entrega de contenido

**Configuration Structure**:

```
nginx.conf
├── HTTP Block (Port 80)
│   └── Redirect all to HTTPS
├── HTTPS Block (Port 443)
│   ├── SSL Configuration
│   ├── Security Headers
│   ├── Gzip Compression
│   └── Proxy to Next.js
└── Upstream Definition
    └── inventory-app:3000
```

**Key Directives**:

**SSL/TLS**:
- `server_name`: inventario.hunykho.com
- `ssl_certificate`: Path to fullchain.pem (Let's Encrypt)
- `ssl_certificate_key`: Path to privkey.pem (Let's Encrypt)
- `ssl_protocols`: TLSv1.2 TLSv1.3
- `ssl_ciphers`: Modern cipher suite
- `ssl_prefer_server_ciphers`: on

**Security Headers**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy`: Configured for Next.js

**Proxy Configuration**:
- `proxy_pass`: http://inventory-app:3000
- `proxy_http_version`: 1.1
- `proxy_set_header Upgrade`: $http_upgrade
- `proxy_set_header Connection`: 'upgrade'
- `proxy_set_header Host`: $host
- `proxy_set_header X-Real-IP`: $remote_addr
- `proxy_set_header X-Forwarded-For`: $proxy_add_x_forwarded_for
- `proxy_set_header X-Forwarded-Proto`: $scheme

**Performance**:
- `gzip on`: Compression enabled
- `gzip_types`: text/plain, text/css, application/json, application/javascript
- `client_max_body_size`: 10M (for file uploads)
- `proxy_buffering`: on
- `proxy_buffer_size`: 4k

### 4. Environment Configuration

**Purpose**: Gestionar configuración sensible y específica del entorno

**.env.production Structure**:
```
# Application
NODE_ENV=production
PORT=3000

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/inventory_db
POSTGRES_HOST=host.docker.internal
POSTGRES_PORT=5432
POSTGRES_DB=inventory_db
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=your-secure-password-here

# Security
JWT_SECRET=your-strong-jwt-secret-here

# Optional: Analytics, monitoring, etc.
```

**Security Considerations**:
- Archivo `.env.production` con permisos 600 (solo owner read/write)
- No commitear en Git (incluido en .gitignore)
- Usar secretos fuertes generados con herramientas como `openssl rand -base64 32`
- Rotar secretos periódicamente

### 5. Portainer Integration

**Purpose**: Proporcionar interfaz web para gestión de contenedores

**Setup**:
- Portainer ya instalado en el servidor
- Acceso vía `https://server-ip:9443`
- Crear Stack desde docker-compose.yml

**Management Capabilities**:
- **Deploy**: Crear stack desde compose file
- **Update**: Pull nueva imagen y recrear contenedores
- **Monitor**: Ver logs en tiempo real
- **Configure**: Editar variables de entorno
- **Control**: Start, stop, restart contenedores
- **Inspect**: Ver uso de recursos (CPU, RAM, Network)

**Workflow en Portainer**:
1. Stacks → Add Stack
2. Nombre: `inventory-app-production`
3. Build method: Git repository o Web editor
4. Pegar docker-compose.yml
5. Configurar environment variables
6. Deploy stack

## Data Models

### Configuration Data

**Docker Compose Schema**:
```yaml
version: '3.8'
services:
  app:
    build: ./app
    container_name: inventory-app
    ports: ["3000:3000"]
    environment: []
    restart: unless-stopped
    networks: [app-network]
    healthcheck: {}
  
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports: ["80:80", "443:443"]
    volumes: []
    depends_on: [app]
    restart: unless-stopped
    networks: [app-network]

networks:
  app-network:
    driver: bridge
```

### SSL Certificate Structure

**Let's Encrypt Certificates**:
- Domain: inventario.hunykho.com
- Location: `/opt/inventory-app/nginx/ssl/`
- Files:
  - `fullchain.pem`: Certificate chain
  - `privkey.pem`: Private key
- Renewal: Automated via certbot
- Validity: 90 days
- Certbot command: `certbot certonly --standalone -d inventario.hunykho.com`

## Error Handling

### Container Failures

**Scenario**: Next.js container crashes

**Handling**:
1. Docker restart policy: `unless-stopped` reinicia automáticamente
2. Health check detecta fallo después de 3 intentos fallidos
3. Logs capturados en stdout/stderr
4. Portainer muestra alerta de contenedor unhealthy

**Recovery**:
- Restart automático por Docker
- Si persiste, revisar logs en Portainer
- Rollback a imagen anterior si es necesario

### Nginx Proxy Errors

**Scenario**: Nginx no puede conectar con backend

**Handling**:
1. Nginx retorna 502 Bad Gateway
2. Logs en `/opt/inventory-app/logs/nginx/error.log`
3. Verificar que contenedor Next.js está running
4. Verificar conectividad en red Docker

**Recovery**:
- Verificar health del contenedor app
- Reiniciar contenedor si es necesario
- Verificar configuración de upstream en nginx.conf

### SSL Certificate Expiration

**Scenario**: Certificado SSL expira

**Handling**:
1. Certbot renueva automáticamente 30 días antes
2. Cron job ejecuta certbot renew diariamente
3. Nginx reload después de renovación

**Recovery**:
- Manual renewal: `certbot renew --force-renewal`
- Reload nginx: `docker exec nginx-proxy nginx -s reload`

### Database Connection Issues

**Scenario**: No se puede conectar a PostgreSQL

**Handling**:
1. Aplicación muestra error de conexión
2. Logs muestran timeout o connection refused
3. Verificar variables de entorno (DATABASE_URL, POSTGRES_HOST)
4. Verificar que PostgreSQL está corriendo en el host
5. Verificar que contenedor puede resolver host.docker.internal

**Recovery**:
- Verificar PostgreSQL está activo: `systemctl status postgresql`
- Verificar credenciales en .env.production
- Verificar que PostgreSQL acepta conexiones: `pg_isready -h localhost`
- Verificar configuración pg_hba.conf permite conexiones desde Docker
- Test conexión desde contenedor: `docker exec inventory-app psql $DATABASE_URL -c "SELECT 1"`

### Disk Space Issues

**Scenario**: Disco lleno por logs o imágenes Docker

**Handling**:
1. Docker falla al escribir
2. Monitoreo de disco alerta
3. Logs rotan automáticamente

**Recovery**:
- Limpiar imágenes antiguas: `docker image prune -a`
- Limpiar contenedores stopped: `docker container prune`
- Configurar log rotation en Docker daemon

## Testing Strategy

### Pre-Deployment Testing

**Local Docker Build Test**:
```bash
# Build image locally
docker build -t inventory-app:test ./app

# Run container locally
docker run -p 3000:3000 --env-file .env.local inventory-app:test

# Verify application responds
curl http://localhost:3000
```

**Docker Compose Test**:
```bash
# Start stack locally
docker-compose -f docker-compose.yml up -d

# Check container status
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl http://localhost
```

### Post-Deployment Validation

**Health Checks**:
1. Application health endpoint: `GET /api/health`
2. Nginx status: `curl -I https://your-domain.com`
3. SSL certificate validity: `openssl s_client -connect your-domain.com:443`
4. Database connectivity: `psql $DATABASE_URL -c "SELECT 1"`
5. Application database access: Login to app and verify data loads

**Performance Tests**:
1. Page load time < 3 seconds
2. API response time < 500ms
3. Memory usage stable under load
4. No memory leaks after 24 hours

**Security Tests**:
1. SSL Labs test: Grade A or higher
2. Security headers present
3. No exposed sensitive data in responses
4. Rate limiting functional

### Monitoring and Alerts

**Metrics to Monitor**:
- Container CPU usage (< 80%)
- Container memory usage (< 80%)
- Disk usage (< 85%)
- Response time (< 1s p95)
- Error rate (< 1%)
- SSL certificate expiry (> 30 days)

**Monitoring Tools**:
- Portainer built-in monitoring
- Docker stats command
- Nginx access/error logs
- Application logs via Portainer

## Deployment Workflow

### Initial Deployment

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Repository
    participant Server as Ubuntu Server
    participant Docker as Docker Engine
    participant Portainer as Portainer UI
    
    Dev->>Git: Push code
    Dev->>Server: SSH connect
    Dev->>Server: Clone repository
    Dev->>Server: Create .env.production
    Dev->>Docker: docker-compose build
    Docker->>Docker: Build multi-stage image
    Dev->>Portainer: Create stack
    Portainer->>Docker: Deploy containers
    Docker->>Docker: Start nginx + app
    Dev->>Server: Configure SSL with certbot
    Dev->>Server: Configure PostgreSQL access
    Dev->>Server: Test deployment
```

### Update Deployment

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Registry as Docker Registry
    participant Portainer as Portainer UI
    participant Docker as Docker Engine
    
    Dev->>Registry: Push new image
    Dev->>Portainer: Open stack
    Portainer->>Registry: Pull new image
    Portainer->>Docker: Stop old containers
    Portainer->>Docker: Start new containers
    Docker->>Docker: Health check
    Portainer->>Dev: Deployment complete
```

### Rollback Procedure

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant Portainer as Portainer UI
    participant Docker as Docker Engine
    
    Admin->>Portainer: Detect issue
    Admin->>Portainer: Open stack
    Admin->>Portainer: Edit image tag
    Portainer->>Docker: Pull previous image
    Portainer->>Docker: Recreate containers
    Docker->>Docker: Start with old version
    Admin->>Portainer: Verify rollback
```

## Security Considerations

### Container Security

1. **Non-root User**: Contenedor ejecuta como usuario `node` (UID 1000)
2. **Read-only Filesystem**: Donde sea posible, montar volúmenes como read-only
3. **No Privileged Mode**: Nunca usar `privileged: true`
4. **Resource Limits**: Configurar límites de CPU y memoria
5. **Image Scanning**: Escanear imágenes con herramientas como Trivy

### Network Security

1. **Firewall**: Solo puertos 80, 443, 9443 (Portainer) abiertos
2. **Internal Network**: Contenedores se comunican en red privada
3. **No Direct Exposure**: App no expuesta directamente, solo vía Nginx
4. **Rate Limiting**: Configurar en Nginx para prevenir abuse

### Data Security

1. **Environment Variables**: Nunca en imagen, solo en runtime
2. **Secrets Management**: Usar Docker secrets o variables de entorno
3. **SSL/TLS**: Forzar HTTPS para todo el tráfico
4. **Database**: Supabase maneja encriptación y seguridad

### Access Control

1. **SSH**: Solo key-based authentication, no passwords
2. **Portainer**: Autenticación fuerte, considerar 2FA
3. **Sudo**: Limitar acceso sudo a usuarios necesarios
4. **Logs**: Proteger logs que pueden contener información sensible

## Performance Optimization

### Next.js Optimizations

1. **Standalone Output**: Usar `output: 'standalone'` en next.config.ts
2. **Image Optimization**: Sharp para procesamiento eficiente
3. **Static Generation**: Pre-render páginas donde sea posible
4. **Code Splitting**: Automático con Next.js
5. **Compression**: Gzip/Brotli en Nginx

### Docker Optimizations

1. **Layer Caching**: Ordenar Dockerfile para máximo cache hit
2. **Multi-stage**: Reducir tamaño de imagen final
3. **Alpine Base**: Usar imágenes Alpine cuando sea posible
4. **Dependency Pruning**: Solo dependencias de producción en imagen final

### Nginx Optimizations

1. **Gzip Compression**: Comprimir respuestas text-based
2. **Static Caching**: Cache headers para assets estáticos
3. **Connection Pooling**: Keep-alive connections
4. **Buffer Tuning**: Ajustar tamaños de buffer para carga

## Maintenance and Operations

### Regular Maintenance Tasks

**Daily**:
- Revisar logs de errores
- Verificar health checks
- Monitorear uso de recursos

**Weekly**:
- Revisar métricas de rendimiento
- Verificar espacio en disco
- Revisar logs de acceso para patrones inusuales

**Monthly**:
- Actualizar imágenes base
- Revisar y actualizar dependencias
- Backup de configuración
- Revisar políticas de seguridad

### Update Procedures

**Application Updates**:
1. Build nueva imagen con tag de versión
2. Push a registry
3. Update stack en Portainer con nuevo tag
4. Verificar health checks
5. Monitorear logs por errores
6. Rollback si es necesario

**System Updates**:
1. Actualizar paquetes Ubuntu: `apt update && apt upgrade`
2. Actualizar Docker Engine si hay nueva versión
3. Reiniciar servidor si es necesario (planificar downtime)

**Security Patches**:
1. Rebuild imágenes con bases actualizadas
2. Aplicar patches de sistema operativo
3. Actualizar certificados SSL si es necesario

## Disaster Recovery

### Backup Strategy

**What to Backup**:
1. Docker Compose files
2. Environment files (.env.production)
3. Nginx configuration
4. SSL certificates
5. Application logs (últimos 30 días)

**Backup Frequency**:
- Configuration: Después de cada cambio
- Logs: Diario
- Full backup: Semanal

**Backup Location**:
- Remote storage (S3, Google Cloud Storage)
- Encrypted backups
- Versioned backups

### Recovery Procedures

**Complete Server Failure**:
1. Provision nuevo servidor Ubuntu
2. Instalar Docker y Portainer
3. Restaurar archivos de configuración
4. Restaurar certificados SSL
5. Deploy stack desde backup
6. Verificar conectividad con Supabase
7. Update DNS si IP cambió

**Data Loss**:
- PostgreSQL backups usando pg_dump
- Restaurar desde backup usando pg_restore
- Configurar backups automáticos con cron

**Recovery Time Objective (RTO)**: < 2 horas
**Recovery Point Objective (RPO)**: < 24 horas

## Cost Considerations

### Server Requirements

**Minimum**:
- 2 vCPU
- 4 GB RAM
- 40 GB SSD
- 2 TB bandwidth

**Recommended**:
- 4 vCPU
- 8 GB RAM
- 80 GB SSD
- Unlimited bandwidth

### Estimated Costs

- VPS Server: $10-40/month (DigitalOcean, Linode, Vultr)
- Domain: $10-15/year
- SSL Certificate: Free (Let's Encrypt)
- PostgreSQL: Incluido en servidor (sin costo adicional)
- Total: ~$10-40/month

## Documentation Requirements

### Deployment Documentation

1. **Setup Guide**: Paso a paso para despliegue inicial
2. **Update Guide**: Cómo actualizar la aplicación
3. **Troubleshooting**: Problemas comunes y soluciones
4. **Architecture Diagram**: Visual de la infraestructura
5. **Runbook**: Procedimientos operacionales

### Code Documentation

1. **Dockerfile**: Comentarios explicando cada stage
2. **docker-compose.yml**: Comentarios en configuración
3. **nginx.conf**: Comentarios en directivas importantes
4. **README**: Instrucciones de desarrollo y despliegue
