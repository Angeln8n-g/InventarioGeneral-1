-- Migration: Create device_custom_fields table
-- Description: Creates the device_custom_fields table to store custom field values for electronic devices
-- Date: 2025-01-28

-- Create device_custom_fields table
CREATE TABLE IF NOT EXISTS device_custom_fields (
  id SERIAL PRIMARY KEY,
  electronic_device_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES category_fields(id) ON DELETE CASCADE,
  field_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure unique field values per device (one value per field per device)
  CONSTRAINT device_custom_fields_unique UNIQUE (electronic_device_id, field_id)
);

-- Create index on electronic_device_id for efficient lookups by device
CREATE INDEX IF NOT EXISTS idx_device_custom_fields_device ON device_custom_fields(electronic_device_id);

-- Create index on field_id for efficient lookups by field
CREATE INDEX IF NOT EXISTS idx_device_custom_fields_field ON device_custom_fields(field_id);

-- Create trigger function for device_custom_fields (without version)
CREATE OR REPLACE FUNCTION update_device_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER device_custom_fields_updated_at
  BEFORE UPDATE ON device_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_device_custom_fields_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE device_custom_fields IS 'Stores custom field values for electronic devices';
COMMENT ON COLUMN device_custom_fields.electronic_device_id IS 'Reference to the electronic device';
COMMENT ON COLUMN device_custom_fields.field_id IS 'Reference to the category field definition';
COMMENT ON COLUMN device_custom_fields.field_value IS 'JSON value of the custom field (supports any data type)';
