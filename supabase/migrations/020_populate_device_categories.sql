-- Migration: Populate device_categories with existing categories
-- Description: Migrates hardcoded categories to the new device_categories table and creates default field configurations
-- Date: 2025-01-28

-- Step 1: Insert existing electronic device categories into device_categories
INSERT INTO device_categories (name, description, icon, is_active) VALUES
  ('Laptops', 'Computadoras portátiles para trabajo y estudio', 'laptop', true),
  ('Tablets', 'Tabletas para uso móvil y presentaciones', 'tablet', true),
  ('Smartphones', 'Teléfonos inteligentes para comunicación', 'smartphone', true),
  ('Periféricos', 'Dispositivos periféricos como teclados, ratones, etc.', 'keyboard', true),
  ('Digitales', 'Dispositivos digitales como cámaras, grabadoras, etc.', 'camera', true),
  ('Otros', 'Otros dispositivos electrónicos no clasificados', 'device', true)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create standard field configurations for categories that support memory
-- These are the fields that currently exist in the electronic_devices table

-- Get category IDs for categories that should have memory fields
DO $$
DECLARE
  laptop_id INTEGER;
  tablet_id INTEGER;
  smartphone_id INTEGER;
BEGIN
  -- Get category IDs
  SELECT id INTO laptop_id FROM device_categories WHERE name = 'Laptops';
  SELECT id INTO tablet_id FROM device_categories WHERE name = 'Tablets';
  SELECT id INTO smartphone_id FROM device_categories WHERE name = 'Smartphones';
  
  -- Create memory_capacity field for Laptops
  IF laptop_id IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_type, is_required, is_custom, display_order)
    VALUES (laptop_id, 'memory_capacity', 'number', false, false, 10)
    ON CONFLICT (category_id, field_name) DO NOTHING;
    
    INSERT INTO category_fields (category_id, field_name, field_type, is_required, is_custom, display_order, options)
    VALUES (laptop_id, 'memory_unit', 'select', false, false, 11, '{"options": ["GB", "TB"]}'::jsonb)
    ON CONFLICT (category_id, field_name) DO NOTHING;
  END IF;
  
  -- Create memory_capacity field for Tablets
  IF tablet_id IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_type, is_required, is_custom, display_order)
    VALUES (tablet_id, 'memory_capacity', 'number', false, false, 10)
    ON CONFLICT (category_id, field_name) DO NOTHING;
    
    INSERT INTO category_fields (category_id, field_name, field_type, is_required, is_custom, display_order, options)
    VALUES (tablet_id, 'memory_unit', 'select', false, false, 11, '{"options": ["GB", "TB"]}'::jsonb)
    ON CONFLICT (category_id, field_name) DO NOTHING;
  END IF;
  
  -- Create memory_capacity field for Smartphones
  IF smartphone_id IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_type, is_required, is_custom, display_order)
    VALUES (smartphone_id, 'memory_capacity', 'number', false, false, 10)
    ON CONFLICT (category_id, field_name) DO NOTHING;
    
    INSERT INTO category_fields (category_id, field_name, field_type, is_required, is_custom, display_order, options)
    VALUES (smartphone_id, 'memory_unit', 'select', false, false, 11, '{"options": ["GB", "TB"]}'::jsonb)
    ON CONFLICT (category_id, field_name) DO NOTHING;
  END IF;
END $$;

-- Step 3: Add category_id column to item_types table to reference device_categories
-- This allows us to link existing item_types to the new category system
ALTER TABLE item_types ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES device_categories(id) ON DELETE SET NULL;

-- Create index on category_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_item_types_category_id ON item_types(category_id);

-- Step 4: Update existing item_types to reference the new category_id
-- Map the old category string to the new category_id
-- Temporarily disable the trigger to avoid version field issues
ALTER TABLE item_types DISABLE TRIGGER update_item_types_updated_at;

UPDATE item_types 
SET category_id = dc.id
FROM device_categories dc
WHERE item_types.category = dc.name;

-- Re-enable the trigger
ALTER TABLE item_types ENABLE TRIGGER update_item_types_updated_at;

-- Add comment to the new column
COMMENT ON COLUMN item_types.category_id IS 'Reference to device_categories table (replaces category string)';

-- Note: We keep the old 'category' column for backward compatibility during transition
-- It can be removed in a future migration once all code is updated to use category_id
