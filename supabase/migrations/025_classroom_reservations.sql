-- Migration: Add classroom reservations table
-- Description: Allows users to reserve classrooms for specific time slots

-- Create classroom_reservations table
CREATE TABLE IF NOT EXISTS classroom_reservations (
    id SERIAL PRIMARY KEY,
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    attendees_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end time is after start time
    CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_classroom_reservations_classroom_id ON classroom_reservations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_reservations_user_id ON classroom_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_reservations_status ON classroom_reservations(status);
CREATE INDEX IF NOT EXISTS idx_classroom_reservations_datetime ON classroom_reservations(start_datetime, end_datetime);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_classroom_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_classroom_reservation_updated_at ON classroom_reservations;
CREATE TRIGGER trigger_classroom_reservation_updated_at
    BEFORE UPDATE ON classroom_reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_classroom_reservation_updated_at();

-- Enable RLS
ALTER TABLE classroom_reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to view all reservations
CREATE POLICY "Users can view all classroom reservations"
    ON classroom_reservations FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to create their own reservations
CREATE POLICY "Users can create their own reservations"
    ON classroom_reservations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text OR EXISTS (
        SELECT 1 FROM users WHERE id = user_id AND role IN ('admin', 'warehouse')
    ));

-- Allow users to update their own reservations or admins to update any
CREATE POLICY "Users can update own reservations or admins any"
    ON classroom_reservations FOR UPDATE
    TO authenticated
    USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'warehouse'))
    );

-- Allow users to delete their own reservations or admins to delete any
CREATE POLICY "Users can delete own reservations or admins any"
    ON classroom_reservations FOR DELETE
    TO authenticated
    USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'warehouse'))
    );

-- Comment on table
COMMENT ON TABLE classroom_reservations IS 'Stores classroom reservation requests and their status';
