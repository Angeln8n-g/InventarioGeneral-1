-- Migration 013: Specific QR Code Verification System
-- This migration adds support for requiring users to scan a specific QR code
-- instead of allowing any of the 5 warehouse QR codes.

-- ============================================================================
-- 1. Add required_qr_code_id to consumable_reservations
-- ============================================================================

-- Add column to track which QR code was required for this reservation
ALTER TABLE consumable_reservations 
ADD COLUMN IF NOT EXISTS required_qr_code_id INTEGER REFERENCES warehouse_qr_codes(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reservations_required_qr 
ON consumable_reservations(required_qr_code_id);

COMMENT ON COLUMN consumable_reservations.required_qr_code_id IS 
'The specific QR code that was required to be scanned for this reservation. NULL for legacy reservations.';

-- ============================================================================
-- 2. Create qr_scan_attempts table
-- ============================================================================

-- Table to log all QR scan attempts (successful and failed)
CREATE TABLE IF NOT EXISTS qr_scan_attempts (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES consumable_reservations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  required_qr_code_id INTEGER NOT NULL REFERENCES warehouse_qr_codes(id),
  scanned_qr_code_id INTEGER REFERENCES warehouse_qr_codes(id),
  scanned_qr_code_text VARCHAR(255),  -- For invalid QR codes that don't exist in our system
  is_successful BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,  -- Store error details for failed attempts
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_reservation 
ON qr_scan_attempts(reservation_id);

CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_user 
ON qr_scan_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_date 
ON qr_scan_attempts(attempt_date);

CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_success 
ON qr_scan_attempts(is_successful);

CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_required_qr 
ON qr_scan_attempts(required_qr_code_id);

COMMENT ON TABLE qr_scan_attempts IS 
'Logs all QR code scan attempts for reservations, including both successful and failed attempts';

COMMENT ON COLUMN qr_scan_attempts.scanned_qr_code_id IS 
'The QR code that was actually scanned. NULL if the scanned code was not a valid warehouse QR code.';

COMMENT ON COLUMN qr_scan_attempts.scanned_qr_code_text IS 
'Raw text of the scanned QR code, useful when the code is not in our system';

COMMENT ON COLUMN qr_scan_attempts.is_successful IS 
'TRUE if the scanned QR code matched the required QR code';

-- ============================================================================
-- 3. Create qr_scan_statistics view
-- ============================================================================

-- View to easily query QR code usage statistics
CREATE OR REPLACE VIEW qr_scan_statistics AS
SELECT 
  wq.id as qr_code_id,
  wq.qr_code,
  wq.location_name,
  wq.zone,
  wq.is_active,
  -- Times this QR code was required
  COUNT(DISTINCT qsa.reservation_id) as times_required,
  -- Successful scans
  COUNT(CASE WHEN qsa.is_successful THEN 1 END) as successful_scans,
  -- Failed scans
  COUNT(CASE WHEN NOT qsa.is_successful THEN 1 END) as failed_scans,
  -- Total attempts
  COUNT(qsa.id) as total_attempts,
  -- Success rate
  ROUND(
    COALESCE(
      COUNT(CASE WHEN qsa.is_successful THEN 1 END)::numeric / 
      NULLIF(COUNT(qsa.id)::numeric, 0) * 100,
      0
    ),
    2
  ) as success_rate_percentage,
  -- Last scan attempt
  MAX(qsa.attempt_date) as last_scan_attempt,
  -- Average attempts per reservation
  ROUND(
    COALESCE(
      COUNT(qsa.id)::numeric / 
      NULLIF(COUNT(DISTINCT qsa.reservation_id)::numeric, 0),
      0
    ),
    2
  ) as avg_attempts_per_reservation
FROM warehouse_qr_codes wq
LEFT JOIN qr_scan_attempts qsa ON qsa.required_qr_code_id = wq.id
GROUP BY wq.id, wq.qr_code, wq.location_name, wq.zone, wq.is_active
ORDER BY times_required DESC;

COMMENT ON VIEW qr_scan_statistics IS 
'Statistics about QR code usage, including success rates and attempt counts';

-- ============================================================================
-- 4. Update reservation_details view to include required QR info
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS reservation_details;

-- Recreate with required QR information
CREATE OR REPLACE VIEW reservation_details AS
SELECT 
  r.id,
  r.user_id,
  u.username,
  u.email,
  r.item_type_id,
  it.name as item_name,
  it.category as item_category,
  r.reserved_quantity,
  r.status,
  r.reservation_date,
  r.expiration_date,
  r.pickup_date,
  r.notes,
  r.purpose,
  r.warehouse_qr_code_id,
  r.required_qr_code_id,
  wq_scanned.qr_code as warehouse_qr_code,
  wq_scanned.location_name as warehouse_location,
  wq_scanned.zone as warehouse_zone,
  wq_required.qr_code as required_qr_code,
  wq_required.location_name as required_location,
  wq_required.zone as required_zone,
  cs.unit_of_measure,
  r.created_at,
  r.updated_at,
  -- Calculate days until expiration
  EXTRACT(DAY FROM (r.expiration_date - CURRENT_TIMESTAMP)) as days_until_expiration,
  -- Check if expired
  CASE 
    WHEN r.expiration_date < CURRENT_TIMESTAMP AND r.status = 'active' THEN true
    ELSE false
  END as is_expired,
  -- Check if QR codes matched (for fulfilled reservations)
  CASE
    WHEN r.status = 'fulfilled' AND r.required_qr_code_id IS NOT NULL THEN
      r.warehouse_qr_code_id = r.required_qr_code_id
    ELSE NULL
  END as qr_codes_matched
FROM consumable_reservations r
JOIN users u ON r.user_id = u.id
JOIN item_types it ON r.item_type_id = it.id
LEFT JOIN consumable_stock cs ON cs.item_type_id = r.item_type_id
LEFT JOIN warehouse_qr_codes wq_scanned ON r.warehouse_qr_code_id = wq_scanned.id
LEFT JOIN warehouse_qr_codes wq_required ON r.required_qr_code_id = wq_required.id;

COMMENT ON VIEW reservation_details IS 
'Detailed view of reservations including both scanned and required warehouse QR information';

-- ============================================================================
-- 5. Create helper function to get recent failed attempts
-- ============================================================================

-- Function to check recent failed attempts for rate limiting
CREATE OR REPLACE FUNCTION get_recent_failed_attempts(
  p_reservation_id INTEGER,
  p_minutes INTEGER DEFAULT 5
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM qr_scan_attempts
    WHERE reservation_id = p_reservation_id
      AND NOT is_successful
      AND attempt_date >= CURRENT_TIMESTAMP - (p_minutes || ' minutes')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recent_failed_attempts IS 
'Returns the count of failed scan attempts for a reservation within the specified time window';

-- ============================================================================
-- 6. Create helper function to get active QR codes
-- ============================================================================

-- Function to get all active warehouse QR codes
CREATE OR REPLACE FUNCTION get_active_warehouse_qr_codes()
RETURNS TABLE (
  id INTEGER,
  qr_code VARCHAR(255),
  location_name VARCHAR(100),
  location_description TEXT,
  zone VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wq.id,
    wq.qr_code,
    wq.location_name,
    wq.location_description,
    wq.zone
  FROM warehouse_qr_codes wq
  WHERE wq.is_active = TRUE
  ORDER BY wq.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_warehouse_qr_codes IS 
'Returns all active warehouse QR codes available for selection';

-- ============================================================================
-- 7. Add RLS policies for new table
-- ============================================================================

-- Enable RLS on qr_scan_attempts
ALTER TABLE qr_scan_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (authentication handled by API)
CREATE POLICY "Allow all operations for authenticated users"
  ON qr_scan_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 8. Create audit trigger for qr_scan_attempts
-- ============================================================================

-- This helps track when scan attempts are logged
CREATE OR REPLACE FUNCTION notify_failed_scan_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a failed attempt and it's the 5th or more in recent time
  IF NOT NEW.is_successful THEN
    DECLARE
      recent_failures INTEGER;
    BEGIN
      recent_failures := get_recent_failed_attempts(NEW.reservation_id, 5);
      
      -- Log warning if too many failures
      IF recent_failures >= 5 THEN
        RAISE WARNING 'User % has % failed scan attempts for reservation %', 
          NEW.user_id, recent_failures, NEW.reservation_id;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_failed_scan_attempt
  AFTER INSERT ON qr_scan_attempts
  FOR EACH ROW
  EXECUTE FUNCTION notify_failed_scan_attempt();

COMMENT ON FUNCTION notify_failed_scan_attempt IS 
'Trigger function to log warnings when users have too many failed scan attempts';

-- ============================================================================
-- 9. Insert sample data for testing (optional, comment out for production)
-- ============================================================================

-- Uncomment the following lines to insert test data
/*
-- Example: Log a successful scan attempt
INSERT INTO qr_scan_attempts (
  reservation_id,
  user_id,
  required_qr_code_id,
  scanned_qr_code_id,
  is_successful,
  ip_address,
  user_agent
) VALUES (
  1,  -- Replace with actual reservation_id
  1,  -- Replace with actual user_id
  3,  -- WH-QR-003-CONSUMABLES
  3,  -- Same as required
  TRUE,
  '192.168.1.1'::INET,
  'Mozilla/5.0...'
);

-- Example: Log a failed scan attempt
INSERT INTO qr_scan_attempts (
  reservation_id,
  user_id,
  required_qr_code_id,
  scanned_qr_code_id,
  is_successful,
  error_message,
  ip_address,
  user_agent
) VALUES (
  1,  -- Replace with actual reservation_id
  1,  -- Replace with actual user_id
  3,  -- WH-QR-003-CONSUMABLES (required)
  1,  -- WH-QR-001-ENTRANCE (scanned wrong one)
  FALSE,
  'Wrong QR code scanned. Required: Zona de Consumibles, Scanned: Entrada Principal',
  '192.168.1.1'::INET,
  'Mozilla/5.0...'
);
*/

-- ============================================================================
-- 10. Verification queries
-- ============================================================================

-- Run these queries to verify the migration was successful:

-- Check that the column was added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'consumable_reservations' 
--   AND column_name = 'required_qr_code_id';

-- Check that the table was created
-- SELECT COUNT(*) FROM qr_scan_attempts;

-- Check that the view was created
-- SELECT * FROM qr_scan_statistics;

-- Check that the functions were created
-- SELECT get_recent_failed_attempts(1, 5);
-- SELECT * FROM get_active_warehouse_qr_codes();

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Summary of changes:
-- 1. Added required_qr_code_id column to consumable_reservations
-- 2. Created qr_scan_attempts table with indexes
-- 3. Created qr_scan_statistics view
-- 4. Updated reservation_details view
-- 5. Created helper functions for rate limiting and QR selection
-- 6. Added RLS policies
-- 7. Created audit trigger for failed attempts
-- 8. Added comprehensive comments and documentation

COMMENT ON SCHEMA public IS 
'Schema updated with specific QR verification system - Migration 013';
