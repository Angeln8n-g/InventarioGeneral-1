-- Rollback Migration: Remove cable marker columns
-- Description: Reverts the changes made by 015_add_cable_markers.sql
-- WARNING: This will remove all marker data. Backup data before running!

DO $$
BEGIN
  -- ============================================================================
  -- PART 1: Drop views
  -- ============================================================================
  
  DROP VIEW IF EXISTS cable_returns_with_segments CASCADE;
  DROP VIEW IF EXISTS cable_consumptions_with_markers CASCADE;
  
  RAISE NOTICE 'Dropped views: cable_returns_with_segments, cable_consumptions_with_markers';
  
  -- ============================================================================
  -- PART 2: Drop helper function
  -- ============================================================================
  
  DROP FUNCTION IF EXISTS cable_segments_overlap(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
  
  RAISE NOTICE 'Dropped function: cable_segments_overlap';
  
  -- ============================================================================
  -- PART 3: Drop constraints
  -- ============================================================================
  
  ALTER TABLE stock_movements 
  DROP CONSTRAINT IF EXISTS chk_markers_valid;
  
  ALTER TABLE consumable_returns 
  DROP CONSTRAINT IF EXISTS chk_segments_valid;
  
  RAISE NOTICE 'Dropped constraints: chk_markers_valid, chk_segments_valid';
  
  -- ============================================================================
  -- PART 4: Drop indexes
  -- ============================================================================
  
  DROP INDEX IF EXISTS idx_stock_movements_markers;
  DROP INDEX IF EXISTS idx_consumable_returns_segments;
  
  RAISE NOTICE 'Dropped indexes: idx_stock_movements_markers, idx_consumable_returns_segments';
  
  -- ============================================================================
  -- PART 5: Drop columns from stock_movements
  -- ============================================================================
  
  ALTER TABLE stock_movements 
  DROP COLUMN IF EXISTS start_marker CASCADE,
  DROP COLUMN IF EXISTS end_marker CASCADE;
  
  RAISE NOTICE 'Dropped columns from stock_movements: start_marker, end_marker';
  
  -- ============================================================================
  -- PART 6: Drop columns from consumable_returns
  -- ============================================================================
  
  ALTER TABLE consumable_returns 
  DROP COLUMN IF EXISTS segment_start CASCADE,
  DROP COLUMN IF EXISTS segment_end CASCADE;
  
  RAISE NOTICE 'Dropped columns from consumable_returns: segment_start, segment_end';

  -- ============================================================================
  -- PART 7: Verification
  -- ============================================================================
  
  -- Verify stock_movements columns are removed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' 
    AND column_name IN ('start_marker', 'end_marker')
  ) THEN
    RAISE EXCEPTION 'Rollback failed: Marker columns still exist in stock_movements';
  END IF;

  -- Verify consumable_returns columns are removed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumable_returns' 
    AND column_name IN ('segment_start', 'segment_end')
  ) THEN
    RAISE EXCEPTION 'Rollback failed: Segment columns still exist in consumable_returns';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rollback of migration 015_add_cable_markers completed successfully';
  RAISE NOTICE 'All marker-related columns, indexes, constraints, functions, and views have been removed';
  RAISE NOTICE '========================================';
END $$;
