# Migration 016: Classrooms and Device Assignments

## Overview

This migration adds comprehensive support for classroom management and device assignment tracking to the inventory system. It enables administrators to:

1. Manage physical classrooms/spaces
2. Assign electronic devices to classrooms
3. Track assignment history
4. Combine complementary devices (e.g., monitor + CPU)
5. Track memory capacity for applicable devices

## Related Specification

This migration implements the database schema defined in:
- `.kiro/specs/electronics-enhancements/requirements.md`
- `.kiro/specs/electronics-enhancements/design.md`

## What's Included

### New Tables

#### 1. `classrooms`
Stores information about physical spaces where equipment is used.

**Columns:**
- `id` - Primary key
- `name` - Classroom name (e.g., "Salón A")
- `location` - Physical location (e.g., "Centro de Capacitación")
- `status` - Operational status: `active`, `inactive`, or `maintenance`
- `description` - Optional description
- `created_at`, `updated_at`, `version` - Standard metadata

**Constraints:**
- `UNIQUE(name, location)` - Prevents duplicate classroom names per location

**Indexes:**
- `idx_classrooms_status` - For filtering by status
- `idx_classrooms_location` - For filtering by location
- `idx_classrooms_name` - For searching by name

#### 2. `device_assignments`
Tracks assignment of electronic devices to classrooms with full history.

**Columns:**
- `id` - Primary key
- `electronic_device_id` - Foreign key to `electronic_devices`
- `classroom_id` - Foreign key to `classrooms`
- `assigned_date` - When the assignment was created
- `removed_date` - When the assignment was removed (NULL if active)
- `assigned_by` - User who created the assignment
- `removed_by` - User who removed the assignment
- `notes` - Optional notes
- `is_active` - TRUE for current assignment, FALSE for history
- `created_at`, `updated_at` - Standard metadata

**Constraints:**
- `EXCLUDE (electronic_device_id WITH =) WHERE (is_active = TRUE)` - Ensures each device has only one active assignment

**Indexes:**
- `idx_device_assignments_classroom` - For querying by classroom (active only)
- `idx_device_assignments_device` - For querying by device (active only)
- `idx_device_assignments_active` - For filtering active assignments
- `idx_device_assignments_assigned_date` - For sorting by date

#### 3. `device_combinations`
Tracks pairing of complementary devices (e.g., monitor with CPU).

**Columns:**
- `id` - Primary key
- `device_1_id` - First device in the combination
- `device_2_id` - Second device in the combination
- `combination_type` - Type of combination (e.g., "Monitor-CPU")
- `created_date` - When the combination was created
- `created_by` - User who created the combination
- `removed_date` - When the combination was removed (NULL if active)
- `removed_by` - User who removed the combination
- `is_active` - TRUE for current combination, FALSE for history
- `notes` - Optional notes
- `created_at`, `updated_at` - Standard metadata

**Constraints:**
- `CHECK (device_1_id != device_2_id)` - Prevents self-combinations
- `EXCLUDE (device_1_id WITH =, device_2_id WITH =) WHERE (is_active = TRUE)` - Prevents duplicate active combinations

**Indexes:**
- `idx_device_combinations_device1` - For querying by first device (active only)
- `idx_device_combinations_device2` - For querying by second device (active only)
- `idx_device_combinations_active` - For filtering active combinations

### Modified Tables

#### `electronic_devices`
Added columns for memory capacity tracking:
- `memory_capacity` - Numeric value (e.g., 16, 512)
- `memory_unit` - Unit of measurement: `GB` or `TB`

### Helper Functions

#### `get_classroom_device_count(classroom_id INTEGER)`
Returns the number of active device assignments for a classroom.

**Usage:**
```sql
SELECT name, get_classroom_device_count(id) as device_count
FROM classrooms;
```

#### `can_combine_devices(device1_id INTEGER, device2_id INTEGER)`
Checks if two devices can be combined (must be in the same classroom).

**Usage:**
```sql
SELECT can_combine_devices(1, 2); -- Returns TRUE or FALSE
```

### Triggers

All three tables have `updated_at` triggers that automatically update the timestamp on any UPDATE operation.

## Sample Data

The migration includes sample classrooms:
- Salón A (Centro de Capacitación) - Active
- Salón B (Centro de Capacitación) - Active
- Laboratorio 1 (Edificio Técnico) - Active
- Sala de Conferencias (Edificio Principal) - Maintenance

## How to Apply

### Using Supabase CLI:
```bash
supabase db push
```

### Using psql:
```bash
psql -h your-host -U your-user -d your-database -f 016_add_classrooms_and_assignments.sql
```

### Using Node.js script:
```bash
node apply-migration.js 016_add_classrooms_and_assignments.sql
```

## How to Rollback

**WARNING:** Rollback will delete all classroom and assignment data!

```bash
psql -h your-host -U your-user -d your-database -f 016_add_classrooms_and_assignments_rollback.sql
```

## Verification

After applying the migration, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('classrooms', 'device_assignments', 'device_combinations');

-- Check sample data
SELECT * FROM classrooms;

-- Check memory columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'electronic_devices' 
  AND column_name IN ('memory_capacity', 'memory_unit');
```

## Usage Examples

### Create a classroom
```sql
INSERT INTO classrooms (name, location, status, description)
VALUES ('Salón C', 'Centro de Capacitación', 'active', 'Nueva sala de capacitación');
```

### Assign a device to a classroom
```sql
INSERT INTO device_assignments (electronic_device_id, classroom_id, assigned_by, notes)
VALUES (1, 1, 1, 'Asignado para curso de programación');
```

### Combine two devices
```sql
INSERT INTO device_combinations (device_1_id, device_2_id, combination_type, created_by)
VALUES (1, 2, 'Monitor-CPU', 1);
```

### Query devices in a classroom
```sql
SELECT 
  ed.id,
  ed.brand,
  ed.model,
  ti.qr_code,
  da.assigned_date
FROM device_assignments da
JOIN electronic_devices ed ON da.electronic_device_id = ed.id
JOIN tool_instances ti ON ed.tool_instance_id = ti.id
WHERE da.classroom_id = 1 AND da.is_active = TRUE;
```

### Get classroom with device count
```sql
SELECT 
  c.*,
  get_classroom_device_count(c.id) as device_count
FROM classrooms c
ORDER BY c.name;
```

## Dependencies

This migration depends on:
- Migration 008: `electronic_devices` table must exist
- Migration 001: `users` table must exist (for foreign keys)

## Next Steps

After applying this migration:

1. Update the TypeScript types in `src/types/classrooms.ts` (already done)
2. Implement API endpoints in `src/app/api/admin/classrooms/`
3. Implement API endpoints in `src/app/api/admin/device-assignments/`
4. Implement API endpoints in `src/app/api/admin/device-combinations/`
5. Create UI components for classroom management
6. Create UI components for device assignment

See the implementation tasks in `.kiro/specs/electronics-enhancements/tasks.md`

## Security Considerations

- All tables have proper foreign key constraints with CASCADE deletes
- Permissions are granted to `authenticated` and `service_role`
- Consider adding Row Level Security (RLS) policies if needed
- Audit logging should be implemented at the application level

## Performance Notes

- Indexes are created on frequently queried columns
- Partial indexes on `is_active = TRUE` improve query performance
- The `EXCLUDE` constraints ensure data integrity without performance overhead
- Consider adding more indexes if specific query patterns emerge

## Troubleshooting

### Error: "relation already exists"
The migration checks for existing tables and columns. If you see this error, the migration may have been partially applied. Check which tables exist and manually drop them if needed.

### Error: "violates foreign key constraint"
Ensure that:
- The `electronic_devices` table exists
- The `users` table exists
- Referenced IDs are valid

### Error: "violates unique constraint"
This means you're trying to:
- Create a classroom with a duplicate name in the same location
- Assign a device that already has an active assignment
- Create a combination that already exists

## Support

For questions or issues:
1. Check the spec documents in `.kiro/specs/electronics-enhancements/`
2. Review the TypeScript operations in `src/lib/supabase-client.ts`
3. Check the API implementation in `src/app/api/admin/`
