-- Migration: Seed electronic devices with sample data
-- This adds sample electronic devices for testing

-- First, create item types for electronic devices if they don't exist
INSERT INTO item_types (name, description, category, is_consumable, default_loan_duration_days)
VALUES 
  ('MacBook Pro 14"', 'Apple MacBook Pro 14 inch laptop', 'Laptops', false, 7),
  ('iPad Pro 11"', 'Apple iPad Pro 11 inch tablet', 'Tablets', false, 7),
  ('iPhone 13', 'Apple iPhone 13 smartphone', 'Smartphones', false, 7),
  ('Dell Latitude 5420', 'Dell Latitude 5420 business laptop', 'Laptops', false, 7),
  ('Samsung Galaxy Tab S8', 'Samsung Galaxy Tab S8 tablet', 'Tablets', false, 7)
ON CONFLICT (name, category) DO NOTHING;

-- Get the item_type IDs (we'll use them to create tool instances)
DO $$
DECLARE
  macbook_type_id INTEGER;
  ipad_type_id INTEGER;
  iphone_type_id INTEGER;
  dell_type_id INTEGER;
  samsung_type_id INTEGER;
  
  macbook_instance_id INTEGER;
  ipad_instance_id INTEGER;
  iphone_instance_id INTEGER;
  dell_instance_id INTEGER;
  samsung_instance_id INTEGER;
BEGIN
  -- Get item type IDs
  SELECT id INTO macbook_type_id FROM item_types WHERE name = 'MacBook Pro 14"' AND category = 'Laptops';
  SELECT id INTO ipad_type_id FROM item_types WHERE name = 'iPad Pro 11"' AND category = 'Tablets';
  SELECT id INTO iphone_type_id FROM item_types WHERE name = 'iPhone 13' AND category = 'Smartphones';
  SELECT id INTO dell_type_id FROM item_types WHERE name = 'Dell Latitude 5420' AND category = 'Laptops';
  SELECT id INTO samsung_type_id FROM item_types WHERE name = 'Samsung Galaxy Tab S8' AND category = 'Tablets';

  -- Create tool instances for MacBook Pro
  INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status, condition_notes)
  VALUES (macbook_type_id, 'QR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-mbp01', 'C02XJ0AAJGH5', 'available', 'Excellent condition, includes charger')
  RETURNING id INTO macbook_instance_id;

  -- Create electronic device record for MacBook
  INSERT INTO electronic_devices (tool_instance_id, brand, model)
  VALUES (macbook_instance_id, 'Apple', 'MacBook Pro 14" M1 Pro');

  -- Create tool instances for iPad Pro
  INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status, condition_notes)
  VALUES (ipad_type_id, 'QR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-ipad01', 'DMXK2LL/A', 'available', 'Good condition, includes Apple Pencil')
  RETURNING id INTO ipad_instance_id;

  -- Create electronic device record for iPad
  INSERT INTO electronic_devices (tool_instance_id, brand, model)
  VALUES (ipad_instance_id, 'Apple', 'iPad Pro 11" (3rd Gen)');

  -- Create tool instances for iPhone 13
  INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status, condition_notes)
  VALUES (iphone_type_id, 'QR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-iph01', 'F2G3H4J5K6L7', 'available', 'Like new, 128GB')
  RETURNING id INTO iphone_instance_id;

  -- Create electronic device record for iPhone
  INSERT INTO electronic_devices (tool_instance_id, brand, model)
  VALUES (iphone_instance_id, 'Apple', 'iPhone 13 128GB');

  -- Create tool instances for Dell Latitude
  INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status, condition_notes)
  VALUES (dell_type_id, 'QR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-dell01', 'BXYZ123456', 'available', 'Good condition, Windows 11 Pro')
  RETURNING id INTO dell_instance_id;

  -- Create electronic device record for Dell
  INSERT INTO electronic_devices (tool_instance_id, brand, model)
  VALUES (dell_instance_id, 'Dell', 'Latitude 5420 i7');

  -- Create tool instances for Samsung Tab
  INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status, condition_notes)
  VALUES (samsung_type_id, 'QR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-sam01', 'R52N123ABCD', 'loaned', 'Good condition, includes S Pen')
  RETURNING id INTO samsung_instance_id;

  -- Create electronic device record for Samsung
  INSERT INTO electronic_devices (tool_instance_id, brand, model)
  VALUES (samsung_instance_id, 'Samsung', 'Galaxy Tab S8 11"');

  RAISE NOTICE 'Successfully created 5 sample electronic devices';
END $$;

-- Add comment
COMMENT ON TABLE electronic_devices IS 'Electronic devices inventory - seeded with 5 sample devices';
