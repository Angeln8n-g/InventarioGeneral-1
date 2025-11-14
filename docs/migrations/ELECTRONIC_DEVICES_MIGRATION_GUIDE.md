# Electronic Devices Migration Guide

This guide explains how to set up the database for the Electronic Devices Management feature.

## Overview

The electronic devices feature requires a new database table (`electronic_devices`) that stores basic device information (brand and model) for electronic devices like laptops, tablets, smartphones, and peripherals.

## Prerequisites

- Database access (Supabase or PostgreSQL)
- Environment variables configured in `.env.local`
- Node.js installed

## Migration Files

- **Migration SQL**: `supabase/migrations/008_add_electronic_devices.sql`
- **Rollback SQL**: `supabase/migrations/008_add_electronic_devices_rollback.sql`
- **Apply Script**: `scripts/apply-electronic-devices-migration.js`
- **Check Script**: `scripts/check-electronic-devices-migration.js`
- **Documentation**: `supabase/migrations/008_README.md`

## How to Apply the Migration

### Option 1: Supabase Studio (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/008_add_electronic_devices.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

This will automatically apply all pending migrations.

### Option 3: Migration Script

Run the provided Node.js script:

```bash
node scripts/apply-electronic-devices-migration.js
```

**Note**: This script will guide you through the process and show you the SQL to execute if direct execution is not possible.

## Verify the Migration

After applying the migration, verify it was successful:

```bash
node scripts/check-electronic-devices-migration.js
```

This script will:
- ✅ Check if the `electronic_devices` table exists
- ✅ Verify dependencies (tool_instances table)
- ✅ Show any existing electronic devices
- ✅ Confirm the system is ready to use

## What Gets Created

### Table: `electronic_devices`

A new table with the following structure:

```sql
electronic_devices
├── id (Primary Key)
├── tool_instance_id (Foreign Key → tool_instances)
├── brand (VARCHAR 100)
├── model (VARCHAR 255)
└── Metadata (timestamps, version)
```

### Indexes

Performance indexes on:
- `tool_instance_id` (foreign key)
- `brand`
- `model`

### Triggers

- Automatic `updated_at` timestamp update trigger

## Rollback

If you need to undo the migration:

```bash
# Via Supabase Studio SQL Editor
# Copy and run: supabase/migrations/008_add_electronic_devices_rollback.sql
```

⚠️ **Warning**: This will permanently delete all electronic device data!

## Testing the Migration

After applying the migration, you can test it with SQL:

```sql
-- Insert a test device
INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status)
VALUES (1, 'test-uuid-123', 'TEST-001', 'available')
RETURNING id;

-- Insert electronic device info (use the id from above)
INSERT INTO electronic_devices (
  tool_instance_id,
  brand,
  model
) VALUES (
  1, -- Replace with actual tool_instance_id
  'Dell',
  'Latitude 5420'
);

-- Query the device
SELECT * FROM electronic_devices WHERE tool_instance_id = 1;

-- Clean up test data
DELETE FROM tool_instances WHERE serial_number = 'TEST-001';
```

## Troubleshooting

### Error: "relation electronic_devices does not exist"

The migration hasn't been applied yet. Follow one of the application methods above.

### Error: "permission denied"

You need admin/service role access to create tables. Use Supabase Studio or ensure you have the correct credentials.

### Error: "already exists"

The migration was already applied. This is normal and safe to ignore.

### Can't connect to database

Check your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

## Next Steps

After successfully applying the migration:

1. ✅ Verify with the check script
2. 📝 Continue with Task 2: TypeScript types and interfaces
3. 🔧 Implement the backend API routes
4. 🎨 Build the frontend components

## Requirements Addressed

This migration addresses:
- **Requirement 1.3**: QR code generation (via tool_instances)
- **Requirement 1.4**: Detailed specification storage
- **Requirement 9.2**: Data validation and integrity

## Support

For detailed technical information, see:
- `supabase/migrations/008_README.md` - Detailed migration documentation
- `.kiro/specs/electronics-management/design.md` - System design
- `.kiro/specs/electronics-management/requirements.md` - Requirements

## Summary

```bash
# Quick start:
1. Apply migration via Supabase Studio SQL Editor
2. Run: node scripts/check-electronic-devices-migration.js
3. Verify: ✅ Table exists and ready to use
4. Continue to next task: TypeScript types
```
