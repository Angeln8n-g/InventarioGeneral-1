-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Create item_types table
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

-- Create tool_instances table
CREATE TABLE tool_instances (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  qr_code VARCHAR(255) UNIQUE NOT NULL, -- Stores UUID for security
  serial_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'loaned', 'out-of-service', 'lost', 'damaged')),
  condition_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Create consumable_stock table
CREATE TABLE consumable_stock (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  current_quantity INTEGER DEFAULT 0 CHECK (current_quantity >= 0),
  minimum_threshold INTEGER DEFAULT 5 CHECK (minimum_threshold >= 0),
  unit_of_measure VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Create loans table
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

-- Create consumable_requests table
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

-- Create audit_logs table
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

-- Create notifications table
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

-- Create indexes for performance optimization
CREATE INDEX idx_tool_instances_qr_code ON tool_instances(qr_code);
CREATE INDEX idx_tool_instances_status ON tool_instances(status);
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_types_updated_at BEFORE UPDATE ON item_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tool_instances_updated_at BEFORE UPDATE ON tool_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consumable_stock_updated_at BEFORE UPDATE ON consumable_stock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();