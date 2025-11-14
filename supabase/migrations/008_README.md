# Migration 008: Electronic Devices Table

## Overview

This migration adds support for managing electronic devices with basic device information. It creates the `electronic_devices` table that extends the existing `tool_instances` table with brand and model fields for electronic devices like laptops, tablets, smartphones, and peripherals.

## What This Migration Does

1. **Creates `electronic_devices` table** with the following fields:
   - Brand (manufacturer)
   - Model (device model)

2. **Creates performance indexes** on:
   - `tool_instance_id` (foreign key)
   - `brand`
   - `model`

3. **Sets up automatic timestamp updates** via trigger

4. **Adds table and column comments** for documentation

## Database Schema

```sql
electronic_devices
├── id (SERIAL PRIMARY KEY)
├── tool_instance_id (INTEGER UNIQUE, FK to tool_instances)
├── brand (VARCHAR 100)
├── model (VARCHAR 255)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── version (INTEGER)
```

## Relationships

- **One-to-One** with `tool_instances`: Each electronic device record corresponds to exactly one tool instance
- **Cascade Delete**: When a tool instance is deleted, the corresponding electronic device record is automatically deleted

## How to Apply

### Option 1: Using the Migration Script (Recommended)

```bash
node scripts/apply-electronic-devices-migration.js
```

This script will:
- Connect to your database
- Apply the migration
- Verify table and index creation
- Display confirmation

### Option 2: Manual Application

If you're using Supabase CLI:

```bash
supabase db push
```

Or apply directly via psql:

```bash
psql $DATABASE_URL -f supabase/migrations/008_add_electronic_devices.sql
```

## How to Rollback

If you need to undo this migration:

```bash
psql $DATABASE_URL -f supabase/migrations/008_add_electronic_devices_rollback.sql
```

**Warning**: This will permanently delete all electronic device data!

## Verification

After applying the migration, verify it worked:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'electronic_devices';

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'electronic_devices';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'electronic_devices';

-- Check foreign key constraint
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'electronic_devices';
```

## Example Usage

### Creating an Electronic Device

```sql
-- First, create a tool instance
INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status)
VALUES (1, 'uuid-here', 'LAPTOP-001', 'available')
RETURNING id;

-- Then, create the electronic device record
INSERT INTO electronic_devices (
  tool_instance_id,
  brand,
  model
) VALUES (
  1, -- tool_instance_id from above
  'Dell',
  'Latitude 5420'
);
```

### Querying Electronic Devices

```sql
-- Get all laptops with their tool instance details
SELECT 
  ed.*,
  ti.qr_code,
  ti.serial_number,
  ti.status,
  it.name as device_name,
  it.category
FROM electronic_devices ed
JOIN tool_instances ti ON ed.tool_instance_id = ti.id
JOIN item_types it ON ti.item_type_id = it.id
WHERE it.category = 'Laptops';
```

## Requirements Addressed

This migration addresses the following requirements from the specification:

- **Requirement 1.3**: Generate QR code automatically (via tool_instances)
- **Requirement 1.4**: Register detailed specifications (processor, RAM, storage, etc.)
- **Requirement 9.2**: Validate unique QR codes and data integrity

## Performance Considerations

- Indexes are created on frequently queried fields (brand, model)
- The `tool_instance_id` index ensures fast joins with the tool_instances table
- All text fields use appropriate VARCHAR lengths to optimize storage
- The one-to-one relationship prevents data duplication

## Notes

- Brand and model fields are optional (nullable) to accommodate different device types
- The `updated_at` timestamp is automatically maintained via trigger
- The table uses the same versioning pattern as other tables in the system
- Additional device information (serial number, condition notes) is stored in the tool_instances table
