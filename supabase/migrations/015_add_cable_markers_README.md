# Migration 015: Add Cable Markers

## Overview

This migration adds support for marker-based cable tracking, enabling precise consumption and return management for cable-type consumables (measured in meters or feet).

## Changes

### 1. Stock Movements Table
- **Added columns:**
  - `start_marker` (DECIMAL(10, 2)): Starting marker number from cable
  - `end_marker` (DECIMAL(10, 2)): Ending marker number from cable
- **Added index:** `idx_stock_movements_markers` for efficient querying
- **Added constraint:** `chk_markers_valid` to ensure marker validity

### 2. Consumable Returns Table
- **Added columns:**
  - `segment_start` (DECIMAL(10, 2)): Starting marker of returned segment
  - `segment_end` (DECIMAL(10, 2)): Ending marker of returned segment
- **Added index:** `idx_consumable_returns_segments` for overlap detection
- **Added constraint:** `chk_segments_valid` to ensure segment validity

### 3. Helper Functions
- **`cable_segments_overlap()`**: Function to detect if two cable segments overlap

### 4. Views
- **`cable_consumptions_with_markers`**: View of cable consumptions with marker data
- **`cable_returns_with_segments`**: View of cable returns with segment data

## Backward Compatibility

✅ **Fully backward compatible**
- All new columns are nullable
- Existing records without markers continue to work
- Legacy consumption/return workflows unaffected

## Usage Examples

### Consumption with Markers

```sql
-- Record cable consumption with markers
INSERT INTO stock_movements (
  consumable_stock_id,
  movement_type,
  quantity,
  user_id,
  start_marker,
  end_marker,
  notes
) VALUES (
  1,                    -- consumable_stock_id
  'consumption',        -- movement_type
  50.5,                 -- quantity (calculated: 200.5 - 150)
  5,                    -- user_id
  150.0,                -- start_marker
  200.5,                -- end_marker
  'Cable for project X'
);
```

### Return with Segments

```sql
-- Record cable return with segment markers
INSERT INTO consumable_returns (
  user_id,
  item_type_id,
  consumable_stock_id,
  returned_quantity,
  segment_start,
  segment_end,
  original_consumption_date,
  notes
) VALUES (
  5,                    -- user_id
  1,                    -- item_type_id
  1,                    -- consumable_stock_id
  20.0,                 -- returned_quantity (calculated: 170 - 150)
  150.0,                -- segment_start
  170.0,                -- segment_end
  '2025-01-15',         -- original_consumption_date
  'Unused portion returned'
);
```

### Check for Overlapping Segments

```sql
-- Check if a new return segment overlaps with existing returns
SELECT cable_segments_overlap(
  150.0,  -- new segment start
  170.0,  -- new segment end
  160.0,  -- existing segment start
  180.0   -- existing segment end
) AS overlaps;  -- Returns: true
```

### Query Cable Consumptions with Markers

```sql
-- Get all cable consumptions with marker information
SELECT 
  item_name,
  username,
  start_marker,
  end_marker,
  quantity,
  unit_of_measure,
  created_at
FROM cable_consumptions_with_markers
WHERE user_id = 5
ORDER BY created_at DESC;
```

### Query Cable Returns with Segments

```sql
-- Get all cable returns with segment information
SELECT 
  item_name,
  username,
  segment_start,
  segment_end,
  returned_quantity,
  return_date
FROM cable_returns_with_segments
WHERE user_id = 5
ORDER BY return_date DESC;
```

## Validation Rules

### Marker Constraints
1. Both `start_marker` and `end_marker` must be NULL, or both must be NOT NULL
2. When both are present, `end_marker` must be greater than `start_marker`
3. Markers can have up to 2 decimal places

### Segment Constraints
1. Both `segment_start` and `segment_end` must be NULL, or both must be NOT NULL
2. When both are present, `segment_end` must be greater than `segment_start`
3. Segments can have up to 2 decimal places

## Rollback

If you need to rollback this migration:

```sql
-- Drop views
DROP VIEW IF EXISTS cable_returns_with_segments;
DROP VIEW IF EXISTS cable_consumptions_with_markers;

-- Drop function
DROP FUNCTION IF EXISTS cable_segments_overlap;

-- Drop constraints
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS chk_markers_valid;
ALTER TABLE consumable_returns DROP CONSTRAINT IF EXISTS chk_segments_valid;

-- Drop indexes
DROP INDEX IF EXISTS idx_stock_movements_markers;
DROP INDEX IF EXISTS idx_consumable_returns_segments;

-- Drop columns
ALTER TABLE stock_movements 
DROP COLUMN IF EXISTS start_marker,
DROP COLUMN IF EXISTS end_marker;

ALTER TABLE consumable_returns 
DROP COLUMN IF EXISTS segment_start,
DROP COLUMN IF EXISTS segment_end;
```

## Testing

After applying this migration, verify:

1. ✅ Columns exist in both tables
2. ✅ Indexes are created
3. ✅ Constraints work correctly
4. ✅ Helper function works
5. ✅ Views return data correctly
6. ✅ Legacy records still work

```sql
-- Test marker insertion
INSERT INTO stock_movements (consumable_stock_id, movement_type, quantity, start_marker, end_marker)
VALUES (1, 'consumption', 50, 100, 150);

-- Test invalid markers (should fail)
INSERT INTO stock_movements (consumable_stock_id, movement_type, quantity, start_marker, end_marker)
VALUES (1, 'consumption', 50, 150, 100);  -- ERROR: end_marker must be > start_marker

-- Test segment overlap detection
SELECT cable_segments_overlap(100, 150, 120, 180);  -- Returns: true
SELECT cable_segments_overlap(100, 150, 160, 200);  -- Returns: false
```

## Related Files

- **Migration SQL**: `015_add_cable_markers.sql`
- **Design Document**: `.kiro/specs/cable-measurement-calculator/design.md`
- **Requirements**: `.kiro/specs/cable-measurement-calculator/requirements.md`

## Notes

- This migration is part of the Cable Measurement Calculator feature
- Enables precise tracking of cable consumption and returns
- Prevents overlapping segment returns
- Maintains full backward compatibility with existing data
