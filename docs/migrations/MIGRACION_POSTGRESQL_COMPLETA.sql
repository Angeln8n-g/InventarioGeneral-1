-- ============================================================================
-- MIGRACIÓN COMPLETA A POSTGRESQL
-- Sistema de Gestión de Inventario - Academia
-- ============================================================================
-- 
-- Este script consolida TODAS las migraciones necesarias para crear
-- la base de datos completa desde cero en PostgreSQL.
--
-- IMPORTANTE: Ejecutar en orden. No omitir secciones.
--
-- Tiempo estimado: 2-3 minutos
-- Versión: 1.0.0
-- Fecha: Octubre 2025
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: ESQUEMA INICIAL
-- ============================================================================

-- Crear tabla de usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Crear tabla de tipos de items (herramientas y consumibles)
CREATE TABLE item_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_consumable BOOLEAN DEFAULT FALSE,
  default_loan_duration_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de instancias de herramientas
CREATE TABLE tool_instances (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  serial_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'loaned', 'out-of-service', 'lost', 'damaged')),
  condition_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Crear tabla de stock de consumibles
CREATE TABLE consumable_stock (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  current_quantity INTEGER DEFAULT 0 CHECK (current_quantity >= 0),
  minimum_threshold INTEGER DEFAULT 5 CHECK (minimum_threshold >= 0),
  unit_of_measure VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Crear tabla de préstamos
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tool_instance_id INTEGER REFERENCES tool_instances(id) ON DELETE CASCADE,
  loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  return_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de solicitudes de consumibles
CREATE TABLE consumable_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
  fulfilled_quantity INTEGER DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'partial', 'cancelled')),
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulfilled_date TIMESTAMP,
  notes TEXT
);

-- Crear tabla de movimientos de stock
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  consumable_stock_id INTEGER REFERENCES consumable_stock(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('consumption', 'adjustment', 'restock', 'loss', 'damage', 'return')),
  quantity INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de devoluciones de consumibles
CREATE TABLE consumable_returns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type_id INTEGER NOT NULL REFERENCES item_types(id) ON DELETE CASCADE,
  consumable_stock_id INTEGER NOT NULL REFERENCES consumable_stock(id) ON DELETE CASCADE,
  returned_quantity INTEGER NOT NULL CHECK (returned_quantity > 0),
  original_consumption_date DATE NOT NULL,
  return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de logs de auditoría
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de notificaciones
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- Crear tabla de preferencias de notificaciones
CREATE TABLE notification_preferences (
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

-- ============================================================================
-- SECCIÓN 2: ÍNDICES PARA OPTIMIZACIÓN DE RENDIMIENTO
-- ============================================================================

-- Índices para tool_instances
CREATE INDEX idx_tool_instances_qr_code ON tool_instances(qr_code);
CREATE INDEX idx_tool_instances_status ON tool_instances(status);
CREATE INDEX idx_tool_instances_item_type ON tool_instances(item_type_id);

-- Índices para consumable_stock
CREATE INDEX idx_consumable_stock_qr_code ON consumable_stock(qr_code);
CREATE INDEX idx_consumable_stock_item_type ON consumable_stock(item_type_id);

-- Índices para loans
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_tool_instance ON loans(tool_instance_id);

-- Índices para stock_movements
CREATE INDEX idx_stock_movements_consumable ON stock_movements(consumable_stock_id);
CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

-- Índices para consumable_returns
CREATE INDEX idx_consumable_returns_user ON consumable_returns(user_id);
CREATE INDEX idx_consumable_returns_item_type ON consumable_returns(item_type_id);
CREATE INDEX idx_consumable_returns_stock ON consumable_returns(consumable_stock_id);
CREATE INDEX idx_consumable_returns_date ON consumable_returns(return_date);
CREATE INDEX idx_consumable_returns_consumption_date ON consumable_returns(original_consumption_date);
CREATE INDEX idx_consumable_returns_status ON consumable_returns(status);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Índices para notification_preferences
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- SECCIÓN 3: FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at en tablas principales
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_types_updated_at 
  BEFORE UPDATE ON item_types 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_instances_updated_at 
  BEFORE UPDATE ON tool_instances 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumable_stock_updated_at 
  BEFORE UPDATE ON consumable_stock 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at 
  BEFORE UPDATE ON loans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumable_returns_updated_at
  BEFORE UPDATE ON consumable_returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para crear preferencias de notificación por defecto
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear preferencias automáticamente al crear usuario
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================================================
-- SECCIÓN 4: COMENTARIOS EN TABLAS (DOCUMENTACIÓN)
-- ============================================================================

COMMENT ON TABLE users IS 'Usuarios del sistema (estudiantes, profesores, administradores)';
COMMENT ON TABLE item_types IS 'Tipos de items (herramientas y consumibles)';
COMMENT ON TABLE tool_instances IS 'Instancias individuales de herramientas';
COMMENT ON TABLE consumable_stock IS 'Stock de materiales consumibles';
COMMENT ON TABLE loans IS 'Préstamos de herramientas';
COMMENT ON TABLE consumable_requests IS 'Solicitudes de consumibles';
COMMENT ON TABLE stock_movements IS 'Movimientos de stock de consumibles';
COMMENT ON TABLE consumable_returns IS 'Devoluciones de consumibles no utilizados';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de todas las acciones';
COMMENT ON TABLE notifications IS 'Notificaciones del sistema para usuarios';
COMMENT ON TABLE notification_preferences IS 'Preferencias de notificación por usuario';

COMMENT ON COLUMN consumable_returns.original_consumption_date IS 'Fecha cuando los items fueron originalmente consumidos';
COMMENT ON COLUMN consumable_returns.return_date IS 'Fecha y hora cuando los items fueron devueltos';

-- ============================================================================
-- SECCIÓN 5: DATOS INICIALES (OPCIONAL - COMENTADO)
-- ============================================================================

-- Descomentar si deseas crear un usuario administrador inicial
/*
-- Crear usuario administrador (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES (
  'admin',
  'admin@academia.edu',
  '$2a$10$YourHashedPasswordHere', -- Cambiar por hash real
  'Administrador del Sistema',
  'admin'
);
*/

-- ============================================================================
-- SECCIÓN 6: VERIFICACIÓN
-- ============================================================================

-- Verificar que todas las tablas fueron creadas
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE 'Total de tablas creadas: %', table_count;
  
  IF table_count >= 11 THEN
    RAISE NOTICE '✅ Migración completada exitosamente';
  ELSE
    RAISE WARNING '⚠️ Algunas tablas pueden no haberse creado correctamente';
  END IF;
END $$;

-- Listar todas las tablas creadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- NOTAS IMPORTANTES:
-- 1. Este script crea TODAS las tablas necesarias desde cero
-- 2. Incluye índices para optimización de rendimiento
-- 3. Incluye triggers para actualización automática de timestamps
-- 4. NO incluye políticas RLS (Row Level Security) - ver siguiente sección
-- 5. Para producción, considera agregar un usuario administrador inicial
--
-- PRÓXIMOS PASOS:
-- 1. Ejecutar este script en tu base de datos PostgreSQL
-- 2. Crear usuario administrador inicial
-- 3. Configurar variables de entorno en tu aplicación
-- 4. Probar conexión desde la aplicación
-- 5. Importar datos existentes (si aplica)
--
-- TIEMPO ESTIMADO: 2-3 minutos
-- ============================================================================
