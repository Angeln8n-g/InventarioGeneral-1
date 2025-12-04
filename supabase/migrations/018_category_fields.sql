-- Migration: Create category_fields table
-- Description: Creates the category_fields table to store field configurations for device categories
-- Date: 2025-01-28

-- Create category_fields table
CREATE TABLE IF NOT EXISTS category_fields (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES device_categories(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  options JSONB,
  validation_rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure field_type is one of the allowed values
  CONSTRAINT category_fields_type_check CHECK (field_type IN ('text', 'number', 'select', 'boolean')),
  
  -- Ensure unique field names within a category
  CONSTRAINT category_fields_unique_name UNIQUE (category_id, field_name)
);

-- Create index on category_id for efficient lookups by category
CREATE INDEX IF NOT EXISTS idx_category_fields_category ON category_fields(category_id);

-- Create index on is_custom for filtering custom vs standard fields
CREATE INDEX IF NOT EXISTS idx_category_fields_custom ON category_fields(is_custom);

-- Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_category_fields_display_order ON category_fields(category_id, display_order);

-- Create trigger function for category_fields (without version)
CREATE OR REPLACE FUNCTION update_category_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER category_fields_updated_at
  BEFORE UPDATE ON category_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_category_fields_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE category_fields IS 'Stores field configuration for device categories';
COMMENT ON COLUMN category_fields.category_id IS 'Reference to the device category';
COMMENT ON COLUMN category_fields.field_name IS 'Name of the field (unique within category)';
COMMENT ON COLUMN category_fields.field_type IS 'Data type of the field: text, number, select, or boolean';
COMMENT ON COLUMN category_fields.is_required IS 'Whether the field is required when creating/editing devices';
COMMENT ON COLUMN category_fields.is_custom IS 'Whether this is a custom field or a standard field';
COMMENT ON COLUMN category_fields.display_order IS 'Order in which the field should be displayed in forms';
COMMENT ON COLUMN category_fields.options IS 'JSON object containing field options (e.g., select options)';
COMMENT ON COLUMN category_fields.validation_rules IS 'JSON object containing validation rules for the field';
