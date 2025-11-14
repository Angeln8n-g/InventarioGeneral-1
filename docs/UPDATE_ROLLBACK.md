# Procedimientos de Actualización y Rollback

Esta guía detalla los procedimientos para actualizar la aplicación en producción y realizar rollback en caso de problemas.

## Tabla de Contenidos

- [Preparación](#preparación)
- [Estrategias de Actualización](#estrategias-de-actualización)
- [Procedimiento de Actualización](#procedimiento-de-actualización)
- [Verificación Post-Actualización](#verificación-post-actualización)
- [Procedimiento de Rollback](#procedimiento-de-rollback)
- [Versionado de Imágenes](#versionado-de-imágenes)
- [Checklist de Actualización](#checklist-de-actualización)

---

## Preparación

### Antes de Cualquier Actualización

#### 1. Backup de Configuración

```bash
# Conectar al servidor
ssh user@inventario.hunykho.com

# Ir al directorio de la aplicación
cd /opt/inventory-app

# Crear backup de configuración
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  docker-compose.yml \
  .env.production \
  nginx/nginx.conf \
  nginx/ssl/

# Mover backup a directorio seguro
mv backup-*.tar.gz ~/backups/
```

#### 2. Backup de Base de Datos

```bash
# Crear backup de PostgreSQL
sudo -u postgres pg_dump inventory_db > ~/backups/inventory_db-$(date +%Y%m%d-%H%M%S).sql

# Comprimir backup
gzip ~/backups/inventory_db-*.sql
```

#### 3. Verificar Estado Actual

```bash
# Ver contenedores corriendo
docker-compose ps

# Ver versión actual (si usas tags)
docker images | grep inventory-app

# Verificar logs recientes
docker-compose logs --tail=50 app
```

#### 4. Notificar a Usuarios (Opcional)

Si la actualización requiere downtime:
- Enviar notificación a usuarios
- Programar en horario de bajo tráfico
- Preparar mensaje de mantenimiento

---

## Estrategias de Actualización

### Estrategia 1: Rolling Update (Sin Downtime)

**Ventajas:**
- Sin tiempo de inactividad
- Rollback rápido

**Desventajas:**
- Más complejo
- Requiere múltiples instancias

**Cuándo usar:**
- Actualizaciones menores
- Cambios de código sin cambios de DB

### Estrategia 2: Blue-Green Deployment

**Ventajas:**
- Rollback instantáneo
- Testing en producción antes de switch

**Desventajas:**
- Requiere el doble de recursos
- Más complejo de configurar

**Cuándo usar:**
- Actualizaciones mayores
- Cambios críticos

### Estrategia 3: Simple Restart (Con Downtime Breve)

**Ventajas:**
- Simple y directo
- Fácil de entender

**Desventajas:**
- Downtime de 30-60 segundos

**Cuándo usar:**
- Actualizaciones menores
- Aplicaciones con bajo tráfico
- **Recomendado para este proyecto**

---

## Procedimiento de Actualización

### Método 1: Actualización Estándar (Recomendado)

Este es el método más común y simple.

#### Paso 1: Preparar Nueva Versión

```bash
# Conectar al servidor
ssh user@inventario.hunykho.com

# Ir al directorio
cd /opt/inventory-app

# Ver rama actual
git branch

# Hacer pull de cambios
git pull origin main

# Ver cambios
git log --oneline -5
```

#### Paso 2: Construir Nueva Imagen

```bash
# Construir imagen con tag de versión
docker-compose build

# O construir con tag específico
docker build -t inventory-app:v1.2.0 .

# Verificar imagen creada
docker images | grep inventory-app
```

#### Paso 3: Detener Servicios Actuales

```bash
# Detener contenedores
docker-compose down

# Verificar que se detuvieron
docker-compose ps
```

#### Paso 4: Aplicar Migraciones de Base de Datos (si aplica)

```bash
# Si hay migraciones pendientes, aplicarlas antes de iniciar
# Opción 1: Ejecutar script de migración
docker-compose run --rm app npm run migrate

# Opción 2: Ejecutar manualmente
docker-compose run --rm app node scripts/migrate.js
```

#### Paso 5: Iniciar Nuevos Servicios

```bash
# Iniciar servicios con nueva versión
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

#### Paso 6: Verificar Salud

```bash
# Esperar 30 segundos para que inicie
sleep 30

# Verificar health check
curl http://localhost:3000/api/health

# Verificar desde internet
curl https://inventario.hunykho.com/api/health
```

### Método 2: Actualización con Portainer

#### Paso 1: Preparar en Servidor

```bash
# SSH al servidor
ssh user@inventario.hunykho.com

# Actualizar código
cd /opt/inventory-app
git pull origin main

# Construir imagen
docker-compose build
```

#### Paso 2: Actualizar en Portainer

1. Abrir Portainer: `https://[server-ip]:9443`
2. Ir a **Stacks** → `inventory-app-production`
3. Click en **Editor**
4. Click en **Update the stack**
5. Marcar **Re-pull image and redeploy**
6. Click en **Update**

#### Paso 3: Monitorear

1. Ir a **Containers**
2. Ver estado de `inventory-app`
3. Click en **Logs** para monitorear inicio

### Método 3: Actualización con Zero-Downtime

Para aplicaciones críticas que no pueden tener downtime.

#### Paso 1: Modificar docker-compose.yml

```yaml
services:
  app:
    image: inventory-app:latest
    deploy:
      replicas: 2  # Dos instancias
      update_config:
        parallelism: 1
        delay: 10s
```

#### Paso 2: Usar Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Desplegar stack
docker stack deploy -c docker-compose.yml inventory

# Actualizar servicio
docker service update --image inventory-app:v1.2.0 inventory_app
```

---

## Verificación Post-Actualización

### Checklist de Verificación

#### 1. Verificar Contenedores

```bash
# Ver estado
docker-compose ps

# Todos deberían estar "Up"
```

#### 2. Verificar Logs

```bash
# Ver logs recientes
docker-compose logs --tail=100 app

# Buscar errores
docker-compose logs app | grep -i error
```

#### 3. Verificar Health Endpoint

```bash
# Desde servidor
curl http://localhost:3000/api/health

# Desde internet
curl https://inventario.hunykho.com/api/health

# Debería retornar: {"status":"ok"}
```

#### 4. Verificar Conectividad a Base de Datos

```bash
# Ver logs de conexión
docker-compose logs app | grep -i database

# O ejecutar query de prueba
docker exec inventory-app node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT NOW()', (err, res) => {
    console.log(err ? err : res.rows[0]);
    pool.end();
  });
"
```

#### 5. Verificar Funcionalidad Crítica

Probar manualmente en el navegador:

- ✅ Login funciona
- ✅ Dashboard carga correctamente
- ✅ Crear/editar items funciona
- ✅ Escaneo QR funciona
- ✅ Reportes se generan

#### 6. Verificar SSL

```bash
# Verificar certificado
curl -I https://inventario.hunykho.com

# Debería retornar 200 OK con headers de seguridad
```

#### 7. Monitorear Recursos

```bash
# Ver uso de recursos
docker stats --no-stream

# CPU y memoria deberían estar en rangos normales
```

---

## Procedimiento de Rollback

### Cuándo Hacer Rollback

Hacer rollback inmediatamente si:

- ❌ Aplicación no inicia después de 2 minutos
- ❌ Errores críticos en logs
- ❌ No se puede conectar a base de datos
- ❌ Funcionalidad crítica no funciona
- ❌ Errores 500 en producción

### Método 1: Rollback con Git

#### Paso 1: Identificar Versión Anterior

```bash
# Ver commits recientes
git log --oneline -10

# Identificar el commit anterior a la actualización
```

#### Paso 2: Revertir Código

```bash
# Opción A: Revertir al commit anterior
git checkout <commit-hash>

# Opción B: Revertir último commit
git revert HEAD

# Opción C: Reset hard (cuidado, elimina cambios)
git reset --hard HEAD~1
```

#### Paso 3: Reconstruir y Redesplegar

```bash
# Detener servicios
docker-compose down

# Reconstruir imagen
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar
docker-compose logs -f app
```

### Método 2: Rollback con Imagen Docker Anterior

#### Paso 1: Listar Imágenes Disponibles

```bash
# Ver imágenes
docker images | grep inventory-app

# Deberías ver:
# inventory-app   v1.2.0   ...
# inventory-app   v1.1.0   ...
# inventory-app   latest   ...
```

#### Paso 2: Modificar docker-compose.yml

```bash
# Editar docker-compose.yml
nano docker-compose.yml

# Cambiar:
# image: inventory-app:v1.2.0
# Por:
# image: inventory-app:v1.1.0
```

#### Paso 3: Redesplegar

```bash
# Detener y remover contenedores
docker-compose down

# Iniciar con imagen anterior
docker-compose up -d

# Verificar
docker-compose ps
docker-compose logs -f app
```

### Método 3: Rollback con Backup

Si las opciones anteriores no funcionan:

#### Paso 1: Restaurar Configuración

```bash
# Ir a directorio de backups
cd ~/backups

# Listar backups
ls -lh backup-*.tar.gz

# Extraer backup más reciente
tar -xzf backup-20250122-143000.tar.gz -C /opt/inventory-app/
```

#### Paso 2: Restaurar Base de Datos (si es necesario)

```bash
# Detener aplicación
cd /opt/inventory-app
docker-compose down

# Restaurar base de datos
gunzip ~/backups/inventory_db-20250122-143000.sql.gz
sudo -u postgres psql inventory_db < ~/backups/inventory_db-20250122-143000.sql
```

#### Paso 3: Reiniciar Servicios

```bash
# Iniciar servicios
docker-compose up -d

# Verificar
docker-compose logs -f
```

### Método 4: Rollback de Emergencia

Si todo falla y necesitas restaurar rápidamente:

```bash
# Detener todo
docker-compose down

# Remover contenedores y volúmenes
docker-compose down -v

# Limpiar imágenes problemáticas
docker rmi inventory-app:latest

# Clonar repositorio fresco
cd /opt
mv inventory-app inventory-app-broken
git clone https://github.com/your-username/inventory-system.git inventory-app
cd inventory-app

# Checkout a versión estable conocida
git checkout v1.1.0

# Restaurar .env.production desde backup
cp ~/backups/.env.production .

# Construir y desplegar
docker-compose build
docker-compose up -d
```

---

## Versionado de Imágenes

### Estrategia de Versionado

Usa **Semantic Versioning** (SemVer):

- **MAJOR.MINOR.PATCH** (ej: 1.2.3)
- **MAJOR**: Cambios incompatibles
- **MINOR**: Nueva funcionalidad compatible
- **PATCH**: Bug fixes

### Etiquetar Imágenes

```bash
# Construir con tag de versión
docker build -t inventory-app:v1.2.0 .

# También etiquetar como latest
docker tag inventory-app:v1.2.0 inventory-app:latest

# Ver imágenes
docker images | grep inventory-app
```

### Mantener Historial de Imágenes

```bash
# Listar todas las imágenes
docker images inventory-app

# Mantener últimas 3 versiones, eliminar antiguas
docker rmi inventory-app:v1.0.0
```

### Usar Registry (Opcional)

Para equipos o múltiples servidores:

```bash
# Tag para registry
docker tag inventory-app:v1.2.0 registry.example.com/inventory-app:v1.2.0

# Push a registry
docker push registry.example.com/inventory-app:v1.2.0

# Pull en servidor
docker pull registry.example.com/inventory-app:v1.2.0
```

---

## Checklist de Actualización

### Pre-Actualización

- [ ] Backup de configuración creado
- [ ] Backup de base de datos creado
- [ ] Versión actual documentada
- [ ] Cambios revisados en staging/desarrollo
- [ ] Usuarios notificados (si aplica)
- [ ] Ventana de mantenimiento programada

### Durante Actualización

- [ ] Código actualizado (git pull)
- [ ] Imagen construida exitosamente
- [ ] Migraciones aplicadas (si aplica)
- [ ] Servicios detenidos
- [ ] Servicios iniciados con nueva versión
- [ ] Logs monitoreados durante inicio

### Post-Actualización

- [ ] Contenedores corriendo (docker-compose ps)
- [ ] Health check responde OK
- [ ] Logs sin errores críticos
- [ ] Conexión a base de datos funciona
- [ ] Login funciona
- [ ] Funcionalidad crítica verificada
- [ ] SSL funciona correctamente
- [ ] Recursos (CPU/RAM) en rangos normales
- [ ] Monitoreo activo por 1 hora

### Si Hay Problemas

- [ ] Logs capturados para análisis
- [ ] Rollback ejecutado
- [ ] Versión anterior verificada
- [ ] Incidente documentado
- [ ] Causa raíz identificada

---

## Mejores Prácticas

### 1. Siempre Hacer Backup

Nunca actualices sin backup de configuración y base de datos.

### 2. Probar en Desarrollo Primero

Prueba actualizaciones en entorno de desarrollo antes de producción.

### 3. Actualizaciones Incrementales

Actualiza frecuentemente con cambios pequeños en lugar de grandes actualizaciones poco frecuentes.

### 4. Documentar Cambios

Mantén un changelog de qué cambió en cada versión.

### 5. Monitoreo Post-Actualización

Monitorea la aplicación por al menos 1 hora después de actualizar.

### 6. Horarios de Bajo Tráfico

Programa actualizaciones en horarios de bajo tráfico (madrugada, fines de semana).

### 7. Plan de Rollback Listo

Siempre ten un plan de rollback preparado antes de actualizar.

### 8. Comunicación

Comunica actualizaciones al equipo y usuarios cuando sea necesario.

---

## Automatización (Avanzado)

### Script de Actualización

Crear script `update.sh`:

```bash
#!/bin/bash

# Script de actualización automatizada
set -e

echo "=== Iniciando actualización ==="

# Backup
echo "Creando backup..."
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz docker-compose.yml .env.production nginx/

# Actualizar código
echo "Actualizando código..."
git pull origin main

# Construir imagen
echo "Construyendo imagen..."
docker-compose build

# Detener servicios
echo "Deteniendo servicios..."
docker-compose down

# Iniciar servicios
echo "Iniciando servicios..."
docker-compose up -d

# Esperar inicio
echo "Esperando inicio..."
sleep 30

# Verificar health
echo "Verificando health..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ Actualización exitosa"
else
    echo "❌ Error en health check, considerar rollback"
    exit 1
fi

echo "=== Actualización completada ==="
```

Hacer ejecutable:

```bash
chmod +x update.sh
```

Usar:

```bash
./update.sh
```

---

## Contacto

Para problemas durante actualizaciones, contactar al equipo de desarrollo inmediatamente.

**Última actualización**: 2025-01-22
