-- Migration: 022_maintenance_reports.sql
-- Description: Create maintenance reports table for tracking device repairs
-- Date: 2024-12-02

-- Create maintenance_reports table
CREATE TABLE IF NOT EXISTS maintenance_reports (
    id SERIAL PRIMARY KEY,
    electronic_device_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    technician_type VARCHAR(20) NOT NULL CHECK (technician_type IN ('internal', 'external')),
    technician_name VARCHAR(255) NOT NULL,
    technician_company VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolution_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    cost DECIMAL(10, 2),
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_device ON maintenance_reports(electronic_device_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_status ON maintenance_reports(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_date ON maintenance_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_technician_type ON maintenance_reports(technician_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maintenance_reports_updated_at ON maintenance_reports;
CREATE TRIGGER trigger_maintenance_reports_updated_at
    BEFORE UPDATE ON maintenance_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_reports_updated_at();

-- Enable RLS
ALTER TABLE maintenance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Using simple policies that don't require auth.uid() casting
-- Drop existing policies if they exist
DROP POLICY IF EXISTS maintenance_reports_admin_all ON maintenance_reports;
DROP POLICY IF EXISTS maintenance_reports_user_select ON maintenance_reports;

-- Allow all authenticated users to read maintenance reports
CREATE POLICY maintenance_reports_select_all ON maintenance_reports
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all authenticated users to insert maintenance reports
CREATE POLICY maintenance_reports_insert_all ON maintenance_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow all authenticated users to update maintenance reports
CREATE POLICY maintenance_reports_update_all ON maintenance_reports
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow all authenticated users to delete maintenance reports
CREATE POLICY maintenance_reports_delete_all ON maintenance_reports
    FOR DELETE
    TO authenticated
    USING (true);

-- Add comment to table
COMMENT ON TABLE maintenance_reports IS 'Stores maintenance and repair reports for electronic devices';
