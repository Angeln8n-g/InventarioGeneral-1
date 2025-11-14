-- Rollback: Remove sample electronic devices

-- Delete electronic devices (this will cascade to tool_instances due to ON DELETE CASCADE)
DELETE FROM electronic_devices 
WHERE tool_instance_id IN (
  SELECT id FROM tool_instances 
  WHERE qr_code LIKE 'QR-%mbp01' 
     OR qr_code LIKE 'QR-%ipad01'
     OR qr_code LIKE 'QR-%iph01'
     OR qr_code LIKE 'QR-%dell01'
     OR qr_code LIKE 'QR-%sam01'
);

-- Delete tool instances
DELETE FROM tool_instances 
WHERE qr_code LIKE 'QR-%mbp01' 
   OR qr_code LIKE 'QR-%ipad01'
   OR qr_code LIKE 'QR-%iph01'
   OR qr_code LIKE 'QR-%dell01'
   OR qr_code LIKE 'QR-%sam01';

-- Optionally delete the item types if they were only created for testing
-- Uncomment the following lines if you want to remove the item types as well
/*
DELETE FROM item_types 
WHERE name IN (
  'MacBook Pro 14"',
  'iPad Pro 11"',
  'iPhone 13',
  'Dell Latitude 5420',
  'Samsung Galaxy Tab S8'
) AND category IN ('Laptops', 'Tablets', 'Smartphones');
*/

-- Add comment
COMMENT ON TABLE electronic_devices IS 'Electronic devices inventory - sample data removed';
