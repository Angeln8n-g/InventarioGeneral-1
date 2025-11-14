-- Update reservation_details view to include warehouse QR information
-- This migration updates the view to show which warehouse QR code was scanned

DROP VIEW IF EXISTS reservation_details;

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
  wq.qr_code as warehouse_qr_code,
  wq.location_name as warehouse_location,
  wq.zone as warehouse_zone,
  cs.unit_of_measure,
  r.created_at,
  r.updated_at,
  -- Calculate days until expiration
  EXTRACT(DAY FROM (r.expiration_date - CURRENT_TIMESTAMP)) as days_until_expiration,
  -- Check if expired
  CASE 
    WHEN r.expiration_date < CURRENT_TIMESTAMP AND r.status = 'active' THEN true
    ELSE false
  END as is_expired
FROM consumable_reservations r
JOIN users u ON r.user_id = u.id
JOIN item_types it ON r.item_type_id = it.id
LEFT JOIN consumable_stock cs ON cs.item_type_id = r.item_type_id
LEFT JOIN warehouse_qr_codes wq ON r.warehouse_qr_code_id = wq.id;

COMMENT ON VIEW reservation_details IS 'Detailed view of reservations including warehouse QR verification information';
