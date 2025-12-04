-- Rollback: 022_maintenance_reports.sql
-- Description: Remove maintenance reports table

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_maintenance_reports_updated_at ON maintenance_reports;

-- Drop function
DROP FUNCTION IF EXISTS update_maintenance_reports_updated_at();

-- Drop policies
DROP POLICY IF EXISTS maintenance_reports_select_all ON maintenance_reports;
DROP POLICY IF EXISTS maintenance_reports_insert_all ON maintenance_reports;
DROP POLICY IF EXISTS maintenance_reports_update_all ON maintenance_reports;
DROP POLICY IF EXISTS maintenance_reports_delete_all ON maintenance_reports;

-- Drop indexes
DROP INDEX IF EXISTS idx_maintenance_reports_device;
DROP INDEX IF EXISTS idx_maintenance_reports_status;
DROP INDEX IF EXISTS idx_maintenance_reports_date;
DROP INDEX IF EXISTS idx_maintenance_reports_technician_type;

-- Drop table
DROP TABLE IF EXISTS maintenance_reports;
