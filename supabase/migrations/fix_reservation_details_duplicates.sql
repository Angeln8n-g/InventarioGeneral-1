-- Fix reservation_details view to avoid duplicates when multiple consumable_stock records exist
-- for the same item_type_id

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
  r.required_qr_code_id,
  wq_scanned.qr_code as warehouse_qr_code,
  wq_scanned.location_name as warehouse_location,
  wq_scanned.zone as warehouse_zone,
  wq_required.qr_code as required_qr_code,
  wq_required.location_name as required_location,
  wq_required.zone as required_zone,
  -- Use subquery to get unit_of_measure from first matching stock record
  (SELECT cs.unit_of_measure FROM consumable_stock cs WHERE cs.item_type_id = r.item_type_id LIMIT 1) as unit_of_measure,
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
LEFT JOIN warehouse_qr_codes wq_scanned ON r.warehouse_qr_code_id = wq_scanned.id
LEFT JOIN warehouse_qr_codes wq_required ON r.required_qr_code_id = wq_required.id;

COMMENT ON VIEW reservation_details IS 
'Detailed view of reservations including both scanned and required warehouse QR information. Fixed to avoid duplicates.';
