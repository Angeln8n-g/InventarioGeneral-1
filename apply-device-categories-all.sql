-- =====================================================
-- MIGRATION: Device Categories System
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 017: Create device_categories table
-- =====================================================

CREATE TABLE IF NOT EXISTS device_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  CONSTRAINT device_categories_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_device_categories_name_lower ON device_categories(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_device_categories_active ON device_categories(is_active);

-- =====================================================
-- 018: Create category_fields table
-- =====================================================

CREATE TABLE IF NOT EXISTS category_fields (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES device_categories(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'boolean')),
  is_required BOOLEAN DEFAULT FALSE NOT NULL,
  is_custom BOOLEAN DEFAULT TRUE NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT category_fields_unique_name UNIQUE (category_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_category_fields_category ON category_fields(category_id);
CREATE INDEX IF NOT EXISTS idx_category_fields_order ON category_fields(category_id, display_order);

-- =====================================================
-- 019: Create device_custom_fields table
-- =====================================================

CREATE TABLE IF NOT EXISTS device_custom_fields (
  id SERIAL PRIMARY KEY,
  electronic_device_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES category_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT device_custom_fields_unique UNIQUE (electronic_device_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_device_custom_fields_device ON device_custom_fields(electronic_device_id);
CREATE INDEX IF NOT EXISTS idx_device_custom_fields_field ON device_custom_fields(field_id);

-- =====================================================
-- 020: Add category_id to item_types and populate data
-- =====================================================

-- Add category_id column to item_types if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'item_types' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE item_types ADD COLUMN category_id INTEGER REFERENCES device_categories(id);
    CREATE INDEX idx_item_types_category ON item_types(category_id);
  END IF;
END $$;

-- Insert default categories
INSERT INTO device_categories (name, description, icon, is_active) VALUES
  ('Laptops', 'Computadoras portátiles', '💻', true),
  ('Tablets', 'Tabletas electrónicas', '📱', true),
  ('Proyectores', 'Proyectores y equipos de presentación', '📽️', true),
  ('Monitores', 'Pantallas y monitores', '🖥️', true),
  ('Impresoras', 'Impresoras y equipos de impresión', '🖨️', true),
  ('Cámaras', 'Cámaras fotográficas y de video', '📷', true),
  ('Audio', 'Equipos de audio y sonido', '🔊', true),
  ('Redes', 'Equipos de red y conectividad', '🌐', true),
  ('Almacenamiento', 'Dispositivos de almacenamiento', '💾', true),
  ('Otros', 'Otros dispositivos electrónicos', '📦', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Enable RLS policies
-- =====================================================

ALTER TABLE device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_custom_fields ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for device_categories
DROP POLICY IF EXISTS "Allow read access to device_categories" ON device_categories;
CREATE POLICY "Allow read access to device_categories" ON device_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write access to device_categories" ON device_categories;
CREATE POLICY "Allow admin write access to device_categories" ON device_categories
  FOR ALL USING (true);

-- Create RLS policies for category_fields
DROP POLICY IF EXISTS "Allow read access to category_fields" ON category_fields;
CREATE POLICY "Allow read access to category_fields" ON category_fields
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write access to category_fields" ON category_fields;
CREATE POLICY "Allow admin write access to category_fields" ON category_fields
  FOR ALL USING (true);

-- Create RLS policies for device_custom_fields
DROP POLICY IF EXISTS "Allow read access to device_custom_fields" ON device_custom_fields;
CREATE POLICY "Allow read access to device_custom_fields" ON device_custom_fields
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write access to device_custom_fields" ON device_custom_fields;
CREATE POLICY "Allow admin write access to device_custom_fields" ON device_custom_fields
  FOR ALL USING (true);

-- =====================================================
-- Done! Verify the tables were created
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: device_categories, category_fields, device_custom_fields';
  RAISE NOTICE 'Column category_id added to item_types';
END $$;

SELECT 'device_categories' as table_name, COUNT(*) as row_count FROM device_categories
UNION ALL
SELECT 'category_fields', COUNT(*) FROM category_fields
UNION ALL
SELECT 'device_custom_fields', COUNT(*) FROM device_custom_fields;
