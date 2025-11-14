# Configuración de la Base de Datos

## Problema Actual

La aplicación está mostrando errores porque faltan migraciones en la base de datos:
- ❌ Campo `full_name` falta en la tabla `users`
- ❌ Tabla `notification_preferences` no existe
- ❌ No hay datos de ejemplo en la base de datos

## ✅ Solución Rápida (2 Pasos)

### Paso 1: Arreglar Estructura de la Base de Datos

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/wiahwghuzxmuytxaydok
2. En el menú lateral, haz clic en **SQL Editor**
3. Copia y pega el contenido completo del archivo: `supabase/fix_missing_migrations.sql`
4. Haz clic en **Run** (o presiona Ctrl+Enter)

### Paso 2: Agregar Datos de Ejemplo

1. En el mismo **SQL Editor**
2. Copia y pega el contenido completo del archivo: `supabase/add_sample_data_safe.sql`
3. Haz clic en **Run** (o presiona Ctrl+Enter)

¡Listo! Ahora recarga la aplicación en tu navegador.

---

## Solución Alternativa: Script Todo-en-Uno

Si prefieres ejecutar todo de una vez, copia y pega este SQL completo:

```sql
-- PASO 1: Arreglar estructura
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
UPDATE users SET full_name = username WHERE full_name IS NULL OR full_name = '';
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- PASO 2: Crear tabla de preferencias
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_confirmation BOOLEAN DEFAULT true,
  return_confirmation BOOLEAN DEFAULT true,
  loan_reminder BOOLEAN DEFAULT true,
  overdue_notice BOOLEAN DEFAULT true,
  consumable_fulfilled BOOLEAN DEFAULT true,
  consumable_backorder BOOLEAN DEFAULT true,
  system_announcement BOOLEAN DEFAULT true,
  stock_alert BOOLEAN DEFAULT true,
  system_maintenance BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- PASO 3: Crear preferencias para usuarios existentes
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- PASO 4: Trigger para nuevos usuarios
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;
CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- PASO 5: Agregar datos de ejemplo
INSERT INTO users (username, email, password_hash, role, full_name) 
VALUES 
  ('admin', 'admin@example.com', '$2b$10$gMYsALBi1HngVRHzOcPivOidKXhCuYTt8RAh9EKpddTJVwC.r8ala', 'admin', 'Administrador'),
  ('teacher1', 'teacher1@example.com', '$2b$10$JnqD2jnIIbTL5LKQD6vJie0jMhV2fNfUJlSZIa3duMZn8bMZSCMlC', 'user', 'Profesor Uno'),
  ('teacher2', 'teacher2@example.com', '$2b$10$u1jcRaurZU/MRd/Y2EFAT./KJZ064fw8AY0vij.aPsU4YEGwDyXNO', 'user', 'Profesor Dos')
ON CONFLICT (username) DO NOTHING;

INSERT INTO item_types (name, description, category, is_consumable, default_loan_duration_days) 
VALUES
  ('Laptop', 'Educational laptops for classroom use', 'Electronics', false, 7),
  ('Projector', 'Portable projectors for presentations', 'Electronics', false, 3),
  ('Microscope', 'Digital microscopes for science classes', 'Science Equipment', false, 14),
  ('Calculator', 'Scientific calculators', 'Mathematics', false, 30),
  ('Whiteboard Markers', 'Dry erase markers for whiteboards', 'Supplies', true, 0),
  ('Copy Paper', 'A4 copy paper for printing', 'Supplies', true, 0),
  ('Batteries', 'AA batteries for devices', 'Supplies', true, 0)
ON CONFLICT DO NOTHING;

-- Verificar
SELECT 'Usuarios:' as tabla, COUNT(*) as total FROM users
UNION ALL
SELECT 'Tipos de items:', COUNT(*) FROM item_types
UNION ALL
SELECT 'Preferencias:', COUNT(*) FROM notification_preferences;
```

---

## Opción Detallada: Usando el Dashboard de Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/wiahwghuzxmuytxaydok

2. En el menú lateral, haz clic en **SQL Editor**

3. Aplica las siguientes migraciones en orden:

#### Migración 1: Schema Inicial
```sql
-- Copia y pega el contenido de: supabase/migrations/001_initial_schema.sql
```

#### Migración 2: Políticas RLS
```sql
-- Copia y pega el contenido de: supabase/migrations/002_rls_policies.sql
```

#### Migración 3: Datos de Ejemplo
```sql
-- Copia y pega el contenido de: supabase/migrations/003_sample_data.sql
```

#### Migración 4: Agregar full_name
```sql
-- Copia y pega el contenido de: supabase/migrations/004_add_full_name_and_update_roles.sql
```

#### Migración 5: Preferencias de Notificaciones
```sql
-- Copia y pega el contenido de: supabase/migrations/20250106_notification_preferences.sql
```

### Opción 2: Script Rápido (Todo en Uno)

Ejecuta este SQL en el SQL Editor de Supabase para aplicar todo de una vez:

```sql
-- 1. Verificar si las tablas ya existen
DO $$ 
BEGIN
    -- Si la tabla users no existe, crear el schema completo
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        RAISE NOTICE 'Creando schema inicial...';
    END IF;
END $$;

-- 2. Agregar columna full_name si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- 3. Actualizar usuarios existentes
UPDATE users SET full_name = username WHERE full_name IS NULL;

-- 4. Hacer full_name obligatorio
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- 5. Crear tabla de preferencias de notificaciones si no existe
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  loan_reminders BOOLEAN DEFAULT TRUE,
  overdue_notices BOOLEAN DEFAULT TRUE,
  backorder_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Crear preferencias por defecto para usuarios existentes
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL);

-- 7. Verificar que todo esté correcto
SELECT 'Usuarios:', COUNT(*) FROM users;
SELECT 'Preferencias:', COUNT(*) FROM notification_preferences;
```

### Opción 3: Resetear Base de Datos Completa

Si prefieres empezar desde cero:

1. Ve al SQL Editor en Supabase
2. Ejecuta este comando para limpiar todo:

```sql
-- ⚠️ CUIDADO: Esto eliminará TODOS los datos
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

3. Luego aplica las migraciones en orden (Opción 1)

## Verificar que Funciona

Después de aplicar las migraciones, ejecuta esto para verificar:

```sql
-- Verificar estructura de users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Verificar que hay datos
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_items FROM item_types;
SELECT COUNT(*) as total_tools FROM tool_instances;

-- Verificar preferencias de notificaciones
SELECT COUNT(*) as total_preferences FROM notification_preferences;
```

## Usuarios de Prueba

Después de aplicar las migraciones, puedes usar estos usuarios:

- **Admin**: 
  - Usuario: `admin`
  - Email: `admin@example.com`
  - Contraseña: `password123`

- **Usuario 1**: 
  - Usuario: `teacher1`
  - Email: `teacher1@example.com`
  - Contraseña: `password123`

- **Usuario 2**: 
  - Usuario: `teacher2`
  - Email: `teacher2@example.com`
  - Contraseña: `password123`
