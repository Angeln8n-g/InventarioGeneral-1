-- Migration: 023_device_movements.sql
-- Description: Create device_movements table for tracking device location changes
-- Date: 2024-12-02

-- Create device_movements table
CREATE TABLE IF NOT EXISTS device_movements (
    id SERIAL PRIMARY KEY,
    electronic_device_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
    from_classroom_id INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
    to_classroom_id INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
    moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_device_movements_device ON device_movements(electronic_device_id);
CREATE INDEX IF NOT EXISTS idx_device_movements_from ON device_movements(from_classroom_id);
CREATE INDEX IF NOT EXISTS idx_device_movements_to ON device_movements(to_classroom_id);
CREATE INDEX IF NOT EXISTS idx_device_movements_date ON device_movements(moved_at);

-- Enable RLS
ALTER TABLE device_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY device_movements_select_all ON device_movements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY device_movements_insert_all ON device_movements
    FOR INSERT TO authenticated WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE device_movements IS 'Stores history of device location changes between classrooms';
