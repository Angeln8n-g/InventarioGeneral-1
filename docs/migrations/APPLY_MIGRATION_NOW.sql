-- ============================================
-- MIGRACIÓN: Tabla de Preferencias de Notificaciones
-- Ejecuta este script en el SQL Editor de Supabase Dashboard
-- ============================================

-- Paso 1: Crear la tabla notification_preferences
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

-- Paso 2: Deshabilitar RLS para desarrollo
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- Paso 3: Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Paso 4: Insertar preferencias por defecto para usuarios existentes
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Paso 5: Crear función para auto-crear preferencias
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;
CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- Paso 7: Agregar comentario
COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la tabla existe
SELECT 'Tabla notification_preferences creada exitosamente' as status;

-- Verificar cuántas preferencias se crearon
SELECT 'Total de preferencias creadas: ' || COUNT(*) as info FROM notification_preferences;

-- Mostrar algunas preferencias
SELECT * FROM notification_preferences LIMIT 5;

-- ============================================
-- ¡MIGRACIÓN COMPLETA!
-- ============================================
