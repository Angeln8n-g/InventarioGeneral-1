-- Migration 016: Add Classrooms and Device Assignments
-- This migration adds support for classroom management and device assignments
-- Created: 2025-01-XX
-- Related to: electronics-enhancements spec

-- ============================================================================
-- 1. Create classrooms table
-- ============================================================================

CREATE TABLE IF NOT EXISTS classrooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  -- Ensure unique classroom names per location
  CONSTRAINT unique_classroom_per_location UNIQUE(name, location)
);

-- Create indexes for classrooms
CREATE INDEX idx_classrooms_status ON classrooms(status);
CREATE INDEX idx_classrooms_location ON classrooms(location);
CREATE INDEX idx_classrooms_name ON classrooms(name);

-- Add comment
COMMENT ON TABLE classrooms IS 'Physical spaces where electronic equipment can be assigned';
COMMENT ON COLUMN classrooms.status IS 'Operational status: active, inactive, or maintenance';
COMMENT ON CONSTRAINT unique_classroom_per_location ON classrooms IS 'Prevents duplicate classroom names within the same location';

-- ============================================================================
-- 2. Create device_assignments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_assignments (
  id SERIAL PRIMARY KEY,
  electronic_device_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_date TIMESTAMP WITH TIME ZONE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  removed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a device can only have one active assignment at a time
  CONSTRAINT unique_active_device_assignment 
    EXCLUDE (electronic_device_id WITH =) 
    WHERE (is_active = TRUE)
);

-- Create indexes for device_assignments
CREATE INDEX idx_device_assignments_classroom ON device_assignments(classroom_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_assignments_device ON device_assignments(electronic_device_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_assignments_active ON device_assignments(is_active);
CREATE INDEX idx_device_assignments_assigned_date ON device_assignments(assigned_date);

-- Add comments
COMMENT ON TABLE device_assignments IS 'Tracks assignment of electronic devices to classrooms with history';
COMMENT ON COLUMN device_assignments.is_active IS 'TRUE for current assignment, FALSE for historical records';
COMMENT ON COLUMN device_assignments.assigned_by IS 'User who created the assignment';
COMMENT ON COLUMN device_assignments.removed_by IS 'User who removed the assignment';
COMMENT ON CONSTRAINT unique_active_device_assignment ON device_assignments IS 'Ensures each device has only one active assignment';

-- ============================================================================
-- 3. Create device_combinations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_combinations (
  id SERIAL PRIMARY KEY,
  device_1_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  device_2_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  combination_type VARCHAR(100),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  removed_date TIMESTAMP WITH TIME ZONE,
  removed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent self-combinations
  CONSTRAINT no_self_combination CHECK (device_1_id != device_2_id),
  
  -- Ensure unique active combinations (prevent duplicates)
  CONSTRAINT unique_active_combination 
    EXCLUDE (device_1_id WITH =, device_2_id WITH =) 
    WHERE (is_active = TRUE)
);

-- Create indexes for device_combinations
CREATE INDEX idx_device_combinations_device1 ON device_combinations(device_1_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_combinations_device2 ON device_combinations(device_2_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_combinations_active ON device_combinations(is_active);

-- Add comments
COMMENT ON TABLE device_combinations IS 'Tracks pairing of complementary devices (e.g., monitor + CPU)';
COMMENT ON COLUMN device_combinations.combination_type IS 'Type of combination (e.g., "Monitor-CPU", "Keyboard-Mouse")';
COMMENT ON COLUMN device_combinations.is_active IS 'TRUE for current combination, FALSE for historical records';
COMMENT ON CONSTRAINT no_self_combination ON device_combinations IS 'Prevents combining a device with itself';
COMMENT ON CONSTRAINT unique_active_combination ON device_combinations IS 'Prevents duplicate active combinations';

-- ============================================================================
-- 4. Add memory capacity columns to electronic_devices
-- ============================================================================

-- Add memory capacity fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'electronic_devices' AND column_name = 'memory_capacity'
  ) THEN
    ALTER TABLE electronic_devices 
    ADD COLUMN memory_capacity NUMERIC(10, 2),
    ADD COLUMN memory_unit VARCHAR(10) CHECK (memory_unit IN ('GB', 'TB'));
    
    COMMENT ON COLUMN electronic_devices.memory_capacity IS 'Amount of RAM or storage memory';
    COMMENT ON COLUMN electronic_devices.memory_unit IS 'Unit of measurement: GB or TB';
  END IF;
END $$;

-- ============================================================================
-- 5. Create helper functions
-- ============================================================================

-- Function to get device count for a classroom
CREATE OR REPLACE FUNCTION get_classroom_device_count(classroom_id_param INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM device_assignments
    WHERE classroom_id = classroom_id_param
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_classroom_device_count IS 'Returns the number of active device assignments for a classroom';

-- Function to check if a device can be combined with another
CREATE OR REPLACE FUNCTION can_combine_devices(device1_id INTEGER, device2_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  device1_classroom INTEGER;
  device2_classroom INTEGER;
BEGIN
  -- Get classroom assignments for both devices
  SELECT classroom_id INTO device1_classroom
  FROM device_assignments
  WHERE electronic_device_id = device1_id AND is_active = TRUE
  LIMIT 1;
  
  SELECT classroom_id INTO device2_classroom
  FROM device_assignments
  WHERE electronic_device_id = device2_id AND is_active = TRUE
  LIMIT 1;
  
  -- Both devices must be assigned to the same classroom
  RETURN device1_classroom IS NOT NULL 
    AND device2_classroom IS NOT NULL 
    AND device1_classroom = device2_classroom;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION can_combine_devices IS 'Checks if two devices can be combined (must be in same classroom)';

-- ============================================================================
-- 6. Create triggers for updated_at
-- ============================================================================

-- Trigger for classrooms
CREATE OR REPLACE FUNCTION update_classroom_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_classroom_timestamp
  BEFORE UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_classroom_timestamp();

-- Trigger for device_assignments
CREATE OR REPLACE FUNCTION update_device_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_assignment_timestamp
  BEFORE UPDATE ON device_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_device_assignment_timestamp();

-- Trigger for device_combinations
CREATE OR REPLACE FUNCTION update_device_combination_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_combination_timestamp
  BEFORE UPDATE ON device_combinations
  FOR EACH ROW
  EXECUTE FUNCTION update_device_combination_timestamp();

-- ============================================================================
-- 7. Insert sample data (optional - for testing)
-- ============================================================================

-- Sample classrooms
INSERT INTO classrooms (name, location, status, description) VALUES
  ('Salón A', 'Centro de Capacitación', 'active', 'Sala principal de capacitación'),
  ('Salón B', 'Centro de Capacitación', 'active', 'Sala secundaria de capacitación'),
  ('Laboratorio 1', 'Edificio Técnico', 'active', 'Laboratorio de computación'),
  ('Sala de Conferencias', 'Edificio Principal', 'maintenance', 'En mantenimiento')
ON CONFLICT (name, location) DO NOTHING;

-- ============================================================================
-- 8. Grant permissions
-- ============================================================================

-- Grant permissions to authenticated users (adjust as needed)
GRANT SELECT ON classrooms TO authenticated;
GRANT SELECT ON device_assignments TO authenticated;
GRANT SELECT ON device_combinations TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON classrooms TO service_role;
GRANT ALL ON device_assignments TO service_role;
GRANT ALL ON device_combinations TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE classrooms_id_seq TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE device_assignments_id_seq TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE device_combinations_id_seq TO authenticated, service_role;

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'classrooms') = 1,
    'classrooms table was not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'device_assignments') = 1,
    'device_assignments table was not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'device_combinations') = 1,
    'device_combinations table was not created';
  
  RAISE NOTICE 'Migration 016 completed successfully';
END $$;
