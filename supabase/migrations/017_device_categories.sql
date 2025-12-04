-- Migration: Create device_categories table
-- Description: Creates the device_categories table to support dynamic category management
-- Date: 2025-01-28

-- Create device_categories table
CREATE TABLE IF NOT EXISTS device_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  
  -- Ensure unique category names (case-insensitive)
  CONSTRAINT device_categories_name_unique UNIQUE (name)
);

-- Create case-insensitive index on name for efficient lookups
CREATE INDEX IF NOT EXISTS idx_device_categories_name_lower ON device_categories(LOWER(name));

-- Create index on is_active for filtering active categories
CREATE INDEX IF NOT EXISTS idx_device_categories_active ON device_categories(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at and version
CREATE TRIGGER device_categories_updated_at
  BEFORE UPDATE ON device_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE device_categories IS 'Stores device category definitions for electronic devices';
COMMENT ON COLUMN device_categories.name IS 'Unique category name (case-insensitive)';
COMMENT ON COLUMN device_categories.description IS 'Optional description of the category';
COMMENT ON COLUMN device_categories.icon IS 'Icon identifier for the category';
COMMENT ON COLUMN device_categories.is_active IS 'Whether the category is active and available for use';
COMMENT ON COLUMN device_categories.version IS 'Optimistic locking version number';
