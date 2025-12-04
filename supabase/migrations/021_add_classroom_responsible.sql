-- Migration: Add responsible_person field to classrooms table
-- Description: Adds a field to track who is responsible for each classroom

-- Add responsible_person column to classrooms table
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS responsible_person VARCHAR(255);

-- Create index for filtering by responsible person
CREATE INDEX IF NOT EXISTS idx_classrooms_responsible_person ON classrooms(responsible_person);

-- Comment on the new column
COMMENT ON COLUMN classrooms.responsible_person IS 'Name of the person responsible for the classroom';
