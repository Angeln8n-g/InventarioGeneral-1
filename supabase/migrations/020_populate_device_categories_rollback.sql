-- Rollback: Remove device category population and item_types changes
-- Description: Removes the category_id column from item_types and clears populated data
-- Date: 2025-01-28

-- Drop index
DROP INDEX IF EXISTS idx_item_types_category_id;

-- Remove category_id column from item_types
ALTER TABLE item_types DROP COLUMN IF EXISTS category_id;

-- Clear populated data from category_fields
DELETE FROM category_fields WHERE category_id IN (
  SELECT id FROM device_categories WHERE name IN ('Laptops', 'Tablets', 'Smartphones', 'Periféricos', 'Digitales', 'Otros')
);

-- Clear populated data from device_categories
DELETE FROM device_categories WHERE name IN ('Laptops', 'Tablets', 'Smartphones', 'Periféricos', 'Digitales', 'Otros');
