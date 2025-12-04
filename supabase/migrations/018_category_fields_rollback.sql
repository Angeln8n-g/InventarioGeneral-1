-- Rollback: Drop category_fields table
-- Description: Removes the category_fields table and related objects
-- Date: 2025-01-28

-- Drop trigger
DROP TRIGGER IF EXISTS category_fields_updated_at ON category_fields;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_category_fields_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_category_fields_display_order;
DROP INDEX IF EXISTS idx_category_fields_custom;
DROP INDEX IF EXISTS idx_category_fields_category;

-- Drop table
DROP TABLE IF EXISTS category_fields CASCADE;
