-- ============================================
-- Script para Arreglar Migraciones Faltantes
-- ============================================
-- Este script agrega solo lo que falta en la base de datos

-- 1. Agregar columna full_name a users (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE users ADD COLUMN full_name VARCHAR(100);
        RAISE NOTICE 'Columna full_name agregada';
    ELSE
        RAISE NOTICE 'Columna full_name ya existe';
    END IF;
END $$;

-- 2. Actualizar usuarios existentes con full_name
UPDATE users SET full_name = username WHERE full_name IS NULL OR full_name = '';

-- 3. Hacer full_name obligatorio
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- 4. Actualizar constraint de roles (si es necesario)
DO $$ 
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
    RAISE NOTICE 'Constraint de roles actualizado';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error actualizando constraint: %', SQLERRM;
END $$;

-- 5. Actualizar roles antiguos a 'user'
UPDATE users SET role = 'user' WHERE role NOT IN ('user', 'admin');

-- 6. Crear tabla notification_preferences (si no existe)
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

-- 7. Crear índice para notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON notification_preferences(user_id);

-- 8. Insertar preferencias por defecto para usuarios existentes
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- 9. Crear trigger para auto-crear preferencias (si no existe)
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

-- 10. Agregar trigger para updated_at en notification_preferences
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at 
BEFORE UPDATE ON notification_preferences 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 11. Verificar que todo esté correcto
DO $$ 
DECLARE
    user_count INTEGER;
    pref_count INTEGER;
    item_count INTEGER;
    tool_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO pref_count FROM notification_preferences;
    SELECT COUNT(*) INTO item_count FROM item_types;
    SELECT COUNT(*) INTO tool_count FROM tool_instances;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificación de Base de Datos:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuarios: %', user_count;
    RAISE NOTICE 'Preferencias de notificación: %', pref_count;
    RAISE NOTICE 'Tipos de items: %', item_count;
    RAISE NOTICE 'Herramientas: %', tool_count;
    RAISE NOTICE '========================================';
    
    IF user_count = 0 THEN
        RAISE NOTICE '⚠️  No hay usuarios. Ejecuta 003_sample_data.sql';
    END IF;
    
    IF pref_count < user_count THEN
        RAISE NOTICE '⚠️  Faltan preferencias para algunos usuarios';
    END IF;
END $$;

-- Comentario final
COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';

-- Mostrar estructura de users para verificar
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
