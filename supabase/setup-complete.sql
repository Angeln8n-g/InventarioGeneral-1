-- ============================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN
-- Ejecuta este archivo completo en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- PARTE 1: SCHEMA INICIAL
-- ============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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

-- Create item_types table (name UNIQUE to support ON CONFLICT)
CREATE TABLE IF NOT EXISTS item_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  is_consumable BOOLEAN DEFAULT FALSE,
  default_loan_duration_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tool_instances table
CREATE TABLE IF NOT EXISTS tool_instances (
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

-- Create consumable_stock table (one row per item_type -> enforce UNIQUE(item_type_id))
CREATE TABLE IF NOT EXISTS consumable_stock (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE UNIQUE,
  current_quantity INTEGER DEFAULT 0 CHECK (current_quantity >= 0),
  minimum_threshold INTEGER DEFAULT 5 CHECK (minimum_threshold >= 0),
  unit_of_measure VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
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

-- Create consumable_requests table
CREATE TABLE IF NOT EXISTS consumable_requests (
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

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_tool_instances_qr_code ON tool_instances(qr_code);
CREATE INDEX IF NOT EXISTS idx_tool_instances_status ON tool_instances(status);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_item_types_updated_at ON item_types;
CREATE TRIGGER update_item_types_updated_at BEFORE UPDATE ON item_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tool_instances_updated_at ON tool_instances;
CREATE TRIGGER update_tool_instances_updated_at BEFORE UPDATE ON tool_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consumable_stock_updated_at ON consumable_stock;
CREATE TRIGGER update_consumable_stock_updated_at BEFORE UPDATE ON consumable_stock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 2: DESHABILITAR RLS PARA DESARROLLO
-- ============================================

-- Deshabilitar RLS en todas las tablas para desarrollo
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS item_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tool_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consumable_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consumable_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 3: DATOS DE EJEMPLO
-- ============================================

-- Insert sample users (password: password123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@example.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQj', 'Administrator', 'admin'),
('user1', 'user1@example.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQj', 'User One', 'user'),
('user2', 'user2@example.com', '$2b$10$rOzJqQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQj', 'User Two', 'user')
ON CONFLICT (username) DO NOTHING;

-- Insert sample item types (name is UNIQUE)
INSERT INTO item_types (name, description, category, is_consumable, default_loan_duration_days) VALUES
('Laptop', 'Educational laptops for classroom use', 'Electronics', false, 7),
('Projector', 'Portable projectors for presentations', 'Electronics', false, 3),
('Microscope', 'Digital microscopes for science classes', 'Science Equipment', false, 14),
('Calculator', 'Scientific calculators', 'Mathematics', false, 30),
('Whiteboard Markers', 'Dry erase markers for whiteboards', 'Supplies', true, 0),
('Copy Paper', 'A4 copy paper for printing', 'Supplies', true, 0),
('Batteries', 'AA batteries for devices', 'Supplies', true, 0)
ON CONFLICT (name) DO NOTHING;

-- Insert sample tool instances
INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status) VALUES
(1, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'LAP001', 'available'),
(1, 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 'LAP002', 'available'),
(1, 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'LAP003', 'loaned'),
(2, 'f47ac10b-58cc-4372-a567-0e02b2c3d482', 'PROJ001', 'available'),
(2, 'f47ac10b-58cc-4372-a567-0e02b2c3d483', 'PROJ002', 'available'),
(3, 'f47ac10b-58cc-4372-a567-0e02b2c3d484', 'MIC001', 'available'),
(3, 'f47ac10b-58cc-4372-a567-0e02b2c3d485', 'MIC002', 'out-of-service'),
(4, 'f47ac10b-58cc-4372-a567-0e02b2c3d486', 'CALC001', 'available'),
(4, 'f47ac10b-58cc-4372-a567-0e02b2c3d487', 'CALC002', 'available'),
(4, 'f47ac10b-58cc-4372-a567-0e02b2c3d488', 'CALC003', 'available')
ON CONFLICT (qr_code) DO NOTHING;

-- Insert sample consumable stock (item_type_id has UNIQUE constraint)
INSERT INTO consumable_stock (item_type_id, current_quantity, minimum_threshold, unit_of_measure) VALUES
(5, 50, 10, 'pieces'),
(6, 100, 20, 'sheets'),
(7, 25, 5, 'pieces')
ON CONFLICT (item_type_id) DO UPDATE
  SET current_quantity = EXCLUDED.current_quantity;

-- Insert sample loans (no unique constraint targeted, use plain insert)
INSERT INTO loans (user_id, tool_instance_id, due_date, status, notes) VALUES
(2, 3, CURRENT_TIMESTAMP + INTERVAL '7 days', 'active', 'For computer science class'),
(3, 7, CURRENT_TIMESTAMP - INTERVAL '2 days', 'overdue', 'Microscope for biology lab');

-- Insert sample consumable requests
INSERT INTO consumable_requests (user_id, item_type_id, requested_quantity, fulfilled_quantity, status, notes) VALUES
(2, 5, 10, 10, 'fulfilled', 'For math class whiteboard'),
(3, 6, 50, 0, 'pending', 'Need paper for student worksheets');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, delivery_status) VALUES
(2, 'loan_reminder', 'Loan Due Soon', 'Your laptop loan is due in 2 days. Please return it on time.', 'delivered'),
(3, 'overdue_notice', 'Overdue Item', 'Your microscope loan is overdue. Please return it immediately.', 'delivered'),
(3, 'backorder_fulfilled', 'Request Fulfilled', 'Your request for copy paper has been fulfilled and is ready for pickup.', 'pending');

-- ============================================
-- CONFIGURACIÓN COMPLETA
-- ============================================

SELECT 'Database setup complete!' as status;
SELECT 'Total users: ' || COUNT(*) as info FROM users;
SELECT 'Total item types: ' || COUNT(*) as info FROM item_types;
SELECT 'Total tool instances: ' || COUNT(*) as info FROM tool_instances;
SELECT 'Total consumable stock items: ' || COUNT(*) as info FROM consumable_stock;
