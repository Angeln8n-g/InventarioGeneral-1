-- Migration: Add building and floor columns to classrooms table
-- Description: Adds building and floor fields for better classroom organization

-- Add building column
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS building VARCHAR(255);

-- Add floor column
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS floor VARCHAR(50);

-- Add responsible_person column if not exists
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS responsible_person VARCHAR(255);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_classrooms_building ON classrooms(building);
CREATE INDEX IF NOT EXISTS idx_classrooms_floor ON classrooms(floor);

-- Add comments
COMMENT ON COLUMN classrooms.building IS 'Building name or identifier where the classroom is located';
COMMENT ON COLUMN classrooms.floor IS 'Floor number or identifier within the building';
COMMENT ON COLUMN classrooms.responsible_person IS 'Person responsible for the classroom';

-- Verify columns were added
DO $$
BEGIN
  RAISE NOTICE 'Migration 027 completed: building, floor, and responsible_person columns added to classrooms';
END $$;
