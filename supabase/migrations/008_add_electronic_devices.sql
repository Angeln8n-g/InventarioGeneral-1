-- Migration: Add electronic_devices table for managing electronic devices
-- This table extends tool_instances with basic device information
-- for electronic devices (laptops, tablets, smartphones, etc.)

-- Create electronic_devices table
CREATE TABLE electronic_devices (
  id SERIAL PRIMARY KEY,
  tool_instance_id INTEGER NOT NULL UNIQUE REFERENCES tool_instances(id) ON DELETE CASCADE,
  
  -- Basic device information
  brand VARCHAR(100),
  model VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  
  -- Constraints
  CONSTRAINT fk_tool_instance FOREIGN KEY (tool_instance_id) 
    REFERENCES tool_instances(id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
CREATE INDEX idx_electronic_devices_tool_instance ON electronic_devices(tool_instance_id);
CREATE INDEX idx_electronic_devices_brand ON electronic_devices(brand);
CREATE INDEX idx_electronic_devices_model ON electronic_devices(model);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_electronic_devices_updated_at 
  BEFORE UPDATE ON electronic_devices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments to table
COMMENT ON TABLE electronic_devices IS 'Stores basic information for electronic devices';
COMMENT ON COLUMN electronic_devices.tool_instance_id IS 'Foreign key to tool_instances table';
COMMENT ON COLUMN electronic_devices.brand IS 'Device brand/manufacturer (e.g., Apple, Dell, Samsung)';
COMMENT ON COLUMN electronic_devices.model IS 'Device model (e.g., MacBook Pro 14", Latitude 5420, Galaxy Tab S8)';
