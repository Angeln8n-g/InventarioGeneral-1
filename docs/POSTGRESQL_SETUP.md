# Configuración de PostgreSQL para Producción

Esta guía detalla cómo configurar PostgreSQL en Ubuntu 20.04 para la aplicación de inventario, incluyendo la configuración necesaria para permitir conexiones desde contenedores Docker.

## Tabla de Contenidos

- [Instalación de PostgreSQL](#instalación-de-postgresql)
- [Configuración Inicial](#configuración-inicial)
- [Crear Base de Datos y Usuario](#crear-base-de-datos-y-usuario)
- [Configurar Acceso desde Docker](#configurar-acceso-desde-docker)
- [Aplicar Migraciones](#aplicar-migraciones)
- [Optimización para Producción](#optimización-para-producción)
- [Backup y Restauración](#backup-y-restauración)
- [Monitoreo](#monitoreo)
- [Troubleshooting](#troubleshooting)

---

## Instalación de PostgreSQL

### Versión Recomendada

Ubuntu 20.04 incluye PostgreSQL 12 por defecto, que es compatible con la aplicación.

### Instalación

```bash
# Actualizar repositorios
sudo apt update

# Instalar PostgreSQL y herramientas adicionales
sudo apt install -y postgresql postgresql-contrib

# Verificar instalación
psql --version
# Debería mostrar: psql (PostgreSQL) 12.x

# Verificar que el servicio está corriendo
sudo systemctl status postgresql

# Habilitar inicio automático
sudo systemctl enable postgresql
```

### Instalación de Versión Más Reciente (Opcional)

Si deseas PostgreSQL 14 o 15:

```bash
# Agregar repositorio oficial de PostgreSQL
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Importar clave de firma
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Actualizar e instalar
sudo apt update
sudo apt install -y postgresql-14

# Verificar versión
psql --version
```

---

## Configuración Inicial

### Acceder a PostgreSQL

```bash
# Cambiar a usuario postgres
sudo -i -u postgres

# Acceder a psql
psql

# Deberías ver el prompt:
# postgres=#
```

### Cambiar Contraseña del Usuario postgres (Recomendado)

```sql
-- Dentro de psql
ALTER USER postgres WITH PASSWORD 'your_secure_postgres_password';

-- Salir
\q
```

### Verificar Configuración

```bash
# Ver archivos de configuración
sudo ls -la /etc/postgresql/12/main/

# Archivos importantes:
# - postgresql.conf: Configuración principal
# - pg_hba.conf: Autenticación y acceso
```

---

## Crear Base de Datos y Usuario

### Paso 1: Crear Base de Datos

```bash
# Como usuario postgres
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE inventory_db;

# Verificar
\l

# Deberías ver inventory_db en la lista
```

### Paso 2: Crear Usuario de Aplicación

```sql
-- Crear usuario con contraseña
CREATE USER inventory_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Otorgar privilegios en la base de datos
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;

-- Conectar a la base de datos
\c inventory_db

-- Otorgar privilegios en el schema public
GRANT ALL ON SCHEMA public TO inventory_user;

-- Otorgar privilegios en todas las tablas (para tablas existentes)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;

-- Otorgar privilegios en tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO inventory_user;

-- Otorgar privilegios en secuencias
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO inventory_user;

-- Salir
\q
```

### Paso 3: Verificar Usuario

```bash
# Probar conexión con nuevo usuario
psql -h localhost -U inventory_user -d inventory_db

# Si pide contraseña y conecta exitosamente, está bien configurado
# Salir con \q
```

---

## Configurar Acceso desde Docker

Los contenedores Docker necesitan conectarse a PostgreSQL en el host. Esto requiere configuración especial.

### Paso 1: Entender la Red de Docker

Docker crea una red bridge (típicamente `172.17.0.0/16`). Los contenedores usan `host.docker.internal` para conectarse al host.

### Paso 2: Configurar pg_hba.conf

Este archivo controla quién puede conectarse a PostgreSQL.

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/12/main/pg_hba.conf
```

Agregar estas líneas **antes** de las líneas existentes:

```conf
# Permitir conexiones desde Docker
# Rango de red Docker bridge
host    all             all             172.16.0.0/12           md5

# Alternativa: permitir desde cualquier IP local (menos seguro)
# host    all             all             0.0.0.0/0               md5
```

**Explicación:**
- `host`: Tipo de conexión (TCP/IP)
- `all`: Todas las bases de datos
- `all`: Todos los usuarios
- `172.16.0.0/12`: Rango de IPs de Docker
- `md5`: Método de autenticación (contraseña encriptada)

### Paso 3: Configurar postgresql.conf

PostgreSQL debe escuchar en interfaces adicionales.

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/12/main/postgresql.conf
```

Buscar y modificar:

```conf
# Buscar esta línea:
#listen_addresses = 'localhost'

# Cambiar a:
listen_addresses = 'localhost,172.17.0.1'

# O para escuchar en todas las interfaces (menos seguro):
# listen_addresses = '*'
```

**Nota:** `172.17.0.1` es la IP del host en la red Docker bridge.

### Paso 4: Reiniciar PostgreSQL

```bash
# Reiniciar servicio
sudo systemctl restart postgresql

# Verificar que está corriendo
sudo systemctl status postgresql

# Ver en qué puertos está escuchando
sudo netstat -tulpn | grep postgres
# Debería mostrar: 0.0.0.0:5432 o 172.17.0.1:5432
```

### Paso 5: Verificar Conectividad desde Docker

```bash
# Ejecutar contenedor temporal para probar
docker run --rm -it postgres:12 psql -h host.docker.internal -U inventory_user -d inventory_db

# Si conecta exitosamente, la configuración es correcta
# Salir con \q
```

---

## Aplicar Migraciones

### Opción 1: Usando Supabase CLI (si aplica)

Si usas Supabase para migraciones:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Aplicar migraciones
supabase db push
```

### Opción 2: Usando Scripts SQL

Si tienes scripts SQL de migración:

```bash
# Aplicar script SQL
psql -h localhost -U inventory_user -d inventory_db -f migrations/001_initial_schema.sql

# O desde archivo
sudo -u postgres psql inventory_db < migrations/001_initial_schema.sql
```

### Opción 3: Desde la Aplicación

Si la aplicación tiene comando de migración:

```bash
# Desde el contenedor
docker exec -it inventory-app npm run migrate

# O si no está en contenedor aún
cd /opt/inventory-app
npm run migrate
```

### Verificar Tablas Creadas

```bash
# Conectar a la base de datos
psql -h localhost -U inventory_user -d inventory_db

# Listar tablas
\dt

# Deberías ver tablas como:
# - users
# - tools
# - tool_instances
# - loans
# - etc.

# Salir
\q
```

---

## Optimización para Producción

### Configuraciones Recomendadas

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/12/main/postgresql.conf
```

Ajustar estos parámetros según los recursos del servidor:

```conf
# Memoria (para servidor con 8GB RAM)
shared_buffers = 2GB                    # 25% de RAM
effective_cache_size = 6GB              # 75% de RAM
maintenance_work_mem = 512MB
work_mem = 16MB

# Conexiones
max_connections = 100

# Checkpoint
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Planner
random_page_cost = 1.1                  # Para SSD
effective_io_concurrency = 200          # Para SSD

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000       # Log queries > 1 segundo

# Autovacuum (limpieza automática)
autovacuum = on
autovacuum_max_workers = 3
```

Reiniciar después de cambios:

```bash
sudo systemctl restart postgresql
```

### Índices

Asegúrate de que las tablas tienen índices apropiados:

```sql
-- Conectar a la base de datos
psql -h localhost -U inventory_user -d inventory_db

-- Verificar índices existentes
\di

-- Crear índices si faltan (ejemplos)
CREATE INDEX IF NOT EXISTS idx_tools_qr_code ON tools(qr_code);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_return_date ON loans(return_date);
```

---

## Backup y Restauración

### Backup Manual

```bash
# Backup completo de la base de datos
sudo -u postgres pg_dump inventory_db > ~/backups/inventory_db-$(date +%Y%m%d-%H%M%S).sql

# Backup comprimido
sudo -u postgres pg_dump inventory_db | gzip > ~/backups/inventory_db-$(date +%Y%m%d-%H%M%S).sql.gz

# Backup de todas las bases de datos
sudo -u postgres pg_dumpall > ~/backups/all_databases-$(date +%Y%m%d-%H%M%S).sql
```

### Backup Automático con Cron

```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-postgres.sh
```

Contenido del script:

```bash
#!/bin/bash

# Script de backup automático de PostgreSQL
BACKUP_DIR="/home/inventory/backups/postgres"
DATE=$(date +%Y%m%d-%H%M%S)
DAYS_TO_KEEP=7

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Hacer backup
sudo -u postgres pg_dump inventory_db | gzip > $BACKUP_DIR/inventory_db-$DATE.sql.gz

# Eliminar backups antiguos
find $BACKUP_DIR -name "inventory_db-*.sql.gz" -mtime +$DAYS_TO_KEEP -delete

# Log
echo "$(date): Backup completado - inventory_db-$DATE.sql.gz" >> /var/log/postgres-backup.log
```

Hacer ejecutable:

```bash
sudo chmod +x /usr/local/bin/backup-postgres.sh
```

Configurar cron:

```bash
# Editar crontab
sudo crontab -e

# Agregar (ejecutar diariamente a las 2 AM)
0 2 * * * /usr/local/bin/backup-postgres.sh
```

### Restauración

```bash
# Restaurar desde backup
sudo -u postgres psql inventory_db < ~/backups/inventory_db-20250122-020000.sql

# O si está comprimido
gunzip -c ~/backups/inventory_db-20250122-020000.sql.gz | sudo -u postgres psql inventory_db

# Restaurar todas las bases de datos
sudo -u postgres psql < ~/backups/all_databases-20250122-020000.sql
```

---

## Monitoreo

### Verificar Estado del Servicio

```bash
# Estado del servicio
sudo systemctl status postgresql

# Ver procesos
ps aux | grep postgres

# Ver conexiones activas
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### Monitorear Conexiones

```sql
-- Conectar a PostgreSQL
sudo -u postgres psql

-- Ver conexiones activas
SELECT 
  datname as database,
  usename as user,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'inventory_db';

-- Contar conexiones por estado
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = 'inventory_db'
GROUP BY state;
```

### Monitorear Tamaño de Base de Datos

```sql
-- Tamaño de la base de datos
SELECT 
  pg_size_pretty(pg_database_size('inventory_db')) as size;

-- Tamaño de cada tabla
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Logs

```bash
# Ver logs recientes
sudo tail -f /var/log/postgresql/postgresql-12-main.log

# Buscar errores
sudo grep ERROR /var/log/postgresql/postgresql-12-main.log

# Buscar queries lentas
sudo grep "duration:" /var/log/postgresql/postgresql-12-main.log
```

---

## Troubleshooting

### Problema: No se puede conectar desde Docker

**Síntomas:**
```
Error: connect ECONNREFUSED
```

**Diagnóstico:**

```bash
# 1. Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# 2. Verificar que escucha en la IP correcta
sudo netstat -tulpn | grep 5432

# 3. Verificar pg_hba.conf
sudo cat /etc/postgresql/12/main/pg_hba.conf | grep 172

# 4. Verificar postgresql.conf
sudo grep listen_addresses /etc/postgresql/12/main/postgresql.conf
```

**Solución:**

```bash
# Asegurar que listen_addresses incluye la IP de Docker
sudo nano /etc/postgresql/12/main/postgresql.conf
# listen_addresses = 'localhost,172.17.0.1'

# Asegurar que pg_hba.conf permite conexiones de Docker
sudo nano /etc/postgresql/12/main/pg_hba.conf
# host    all             all             172.16.0.0/12           md5

# Reiniciar
sudo systemctl restart postgresql
```

### Problema: "password authentication failed"

**Causa:** Contraseña incorrecta o usuario no existe.

**Solución:**

```bash
# Verificar que el usuario existe
sudo -u postgres psql -c "\du"

# Resetear contraseña
sudo -u postgres psql
ALTER USER inventory_user WITH PASSWORD 'new_password';
\q

# Actualizar .env.production con nueva contraseña
```

### Problema: "too many connections"

**Causa:** Se alcanzó el límite de conexiones.

**Diagnóstico:**

```sql
-- Ver conexiones actuales
SELECT count(*) FROM pg_stat_activity;

-- Ver límite
SHOW max_connections;
```

**Solución:**

```bash
# Aumentar max_connections
sudo nano /etc/postgresql/12/main/postgresql.conf
# max_connections = 200

# Reiniciar
sudo systemctl restart postgresql
```

### Problema: Base de datos lenta

**Diagnóstico:**

```sql
-- Ver queries lentas
SELECT 
  pid,
  now() - query_start as duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Ver tablas sin índices
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename 
    FROM pg_indexes 
    WHERE schemaname = 'public'
  );
```

**Solución:**

```sql
-- Crear índices faltantes
CREATE INDEX idx_column_name ON table_name(column_name);

-- Ejecutar VACUUM
VACUUM ANALYZE;

-- Reindexar
REINDEX DATABASE inventory_db;
```

### Problema: Disco lleno

**Diagnóstico:**

```bash
# Ver uso de disco
df -h

# Ver tamaño de PostgreSQL
sudo du -sh /var/lib/postgresql/
```

**Solución:**

```bash
# Limpiar logs antiguos
sudo find /var/log/postgresql/ -name "*.log" -mtime +30 -delete

# Ejecutar VACUUM FULL (libera espacio)
sudo -u postgres psql inventory_db -c "VACUUM FULL;"

# Eliminar backups antiguos
find ~/backups/ -name "*.sql.gz" -mtime +30 -delete
```

---

## Comandos Útiles

```bash
# Iniciar/Detener/Reiniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Conectar a base de datos
psql -h localhost -U inventory_user -d inventory_db

# Ejecutar query desde línea de comandos
psql -h localhost -U inventory_user -d inventory_db -c "SELECT count(*) FROM users;"

# Listar bases de datos
sudo -u postgres psql -l

# Crear backup
sudo -u postgres pg_dump inventory_db > backup.sql

# Restaurar backup
sudo -u postgres psql inventory_db < backup.sql

# Ver versión
psql --version

# Ver configuración activa
sudo -u postgres psql -c "SHOW ALL;"
```

---

## Checklist de Configuración

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `inventory_db` creada
- [ ] Usuario `inventory_user` creado con contraseña segura
- [ ] Privilegios otorgados al usuario
- [ ] `pg_hba.conf` configurado para permitir Docker
- [ ] `postgresql.conf` configurado con `listen_addresses`
- [ ] PostgreSQL reiniciado después de cambios
- [ ] Conectividad desde Docker verificada
- [ ] Migraciones aplicadas
- [ ] Tablas creadas correctamente
- [ ] Índices creados
- [ ] Backup automático configurado
- [ ] Logs configurados
- [ ] Optimizaciones aplicadas

---

## Referencias

- [PostgreSQL Documentation](https://www.postgresql.org/docs/12/)
- [PostgreSQL Ubuntu Installation](https://www.postgresql.org/download/linux/ubuntu/)
- [pg_hba.conf Documentation](https://www.postgresql.org/docs/12/auth-pg-hba-conf.html)

**Última actualización**: 2025-01-22
