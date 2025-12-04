# How to Apply Device Categories Migration

## Overview

This guide explains how to apply the device categories migration (migrations 017-020) to your Supabase database.

## Prerequisites

- Access to your Supabase project dashboard
- Admin access to the SQL Editor in Supabase

## Migration Files

The following migration files need to be applied in order:

1. `017_device_categories.sql` - Creates the device_categories table
2. `018_category_fields.sql` - Creates the category_fields table
3. `019_device_custom_fields.sql` - Creates the device_custom_fields table
4. `020_populate_device_categories.sql` - Populates tables with default data

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor

1. Go to your Supabase project: https://app.supabase.com/project/wiahwghuzxmuytxaydok
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Apply Migration 017

1. Open the file `supabase/migrations/017_device_categories.sql`
2. Copy the entire content
3. Paste it into the SQL Editor
4. Click "Run" or press Ctrl+Enter
5. Verify success message

### Step 3: Apply Migration 018

1. Open the file `supabase/migrations/018_category_fields.sql`
2. Copy the entire content
3. Paste it into the SQL Editor
4. Click "Run" or press Ctrl+Enter
5. Verify success message

### Step 4: Apply Migration 019

1. Open the file `supabase/migrations/019_device_custom_fields.sql`
2. Copy the entire content
3. Paste it into the SQL Editor
4. Click "Run" or press Ctrl+Enter
5. Verify success message

### Step 5: Apply Migration 020

1. Open the file `supabase/migrations/020_populate_device_categories.sql`
2. Copy the entire content
3. Paste it into the SQL Editor
4. Click "Run" or press Ctrl+Enter
5. Verify success message

### Step 6: Verify Migration

Run the following SQL to verify the migration was successful:

```sql
-- Check device_categories
SELECT COUNT(*) as category_count FROM device_categories;
SELECT * FROM device_categories ORDER BY name;

-- Check category_fields
SELECT COUNT(*) as field_count FROM category_fields;
SELECT 
  dc.name as category_name,
  cf.field_name,
  cf.field_type,
  cf.is_required
FROM category_fields cf
JOIN device_categories dc ON cf.category_id = dc.id
ORDER BY dc.name, cf.display_order;

-- Check item_types have category_id
SELECT COUNT(*) as items_with_category 
FROM item_types 
WHERE category_id IS NOT NULL;

-- Check device_custom_fields table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'device_custom_fields'
) as table_exists;
```

Expected results:
- 6 categories (Laptops, Tablets, Smartphones, Periféricos, Digitales, Otros)
- 6 field configurations (memory_capacity and memory_unit for 3 categories)
- All electronic device item_types should have a category_id
- device_custom_fields table should exist

## Method 2: Using Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref wiahwghuzxmuytxaydok

# Apply migrations
supabase db push
```

## Method 3: Using psql (Advanced)

If you have direct PostgreSQL access:

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.wiahwghuzxmuytxaydok.supabase.co:5432/postgres"

# Run migrations
\i supabase/migrations/017_device_categories.sql
\i supabase/migrations/018_category_fields.sql
\i supabase/migrations/019_device_custom_fields.sql
\i supabase/migrations/020_populate_device_categories.sql
```

## Rollback Instructions

If you need to rollback the migrations, run the rollback scripts in reverse order:

```sql
-- In Supabase SQL Editor, run these in order:
\i supabase/migrations/020_populate_device_categories_rollback.sql
\i supabase/migrations/019_device_custom_fields_rollback.sql
\i supabase/migrations/018_category_fields_rollback.sql
\i supabase/migrations/017_device_categories_rollback.sql
```

## Troubleshooting

### Error: "relation already exists"

This means the table was already created. You can safely ignore this error or drop the table first:

```sql
DROP TABLE IF EXISTS device_categories CASCADE;
```

Then re-run the migration.

### Error: "column already exists"

This means the column was already added. You can safely ignore this error.

### Error: "duplicate key value violates unique constraint"

This means the data was already inserted. You can safely ignore this error or clear the data first:

```sql
DELETE FROM device_categories;
```

Then re-run the migration.

## Next Steps

After successfully applying the migrations:

1. ✅ Update TypeScript types in `src/types/electronics.ts`
2. ✅ Create API endpoints for category management
3. ✅ Update device forms to use dynamic fields
4. ✅ Implement category management UI

See `tasks.md` for the complete implementation plan.

## Support

If you encounter any issues:

1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have admin privileges
4. Review the migration files for syntax errors

For more information, see:
- `supabase/migrations/017-020_README.md` - Detailed migration documentation
- `.kiro/specs/dynamic-device-categories/design.md` - Design specifications
