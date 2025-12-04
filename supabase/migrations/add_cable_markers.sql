-- Migration: Add cable marker columns for Cable Measurement Calculator
-- This migration adds start_marker and end_marker columns to stock_movements
-- and segment_start and segment_end columns to consumable_returns

-- ============================================================================
-- 1. Add marker columns to stock_movements table
-- ============================================================================

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS start_marker DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS end_marker DECIMAL(10, 2);

-- Add index for querying by markers
CREATE INDEX IF NOT EXISTS idx_stock_movements_markers 
ON stock_movements(start_marker, end_marker) 
WHERE start_marker IS NOT NULL;

-- Add check constraint to ensure end > start when markers are provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_movements_markers_valid'
  ) THEN
    ALTER TABLE stock_movements
    ADD CONSTRAINT chk_stock_movements_markers_valid 
    CHECK (
      (start_marker IS NULL AND end_marker IS NULL) OR
      (start_marker IS NOT NULL AND end_marker IS NOT NULL AND end_marker > start_marker)
    );
  END IF;
END $$;

COMMENT ON COLUMN stock_movements.start_marker IS 'Starting marker number for cable consumptions';
COMMENT ON COLUMN stock_movements.end_marker IS 'Ending marker number for cable consumptions';

-- ============================================================================
-- 2. Add segment columns to consumable_returns table
-- ============================================================================

ALTER TABLE consumable_returns
ADD COLUMN IF NOT EXISTS segment_start DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS segment_end DECIMAL(10, 2);

-- Add index for overlap detection
CREATE INDEX IF NOT EXISTS idx_consumable_returns_segments 
ON consumable_returns(segment_start, segment_end) 
WHERE segment_start IS NOT NULL;

-- Add check constraint to ensure end > start when segments are provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_consumable_returns_segments_valid'
  ) THEN
    ALTER TABLE consumable_returns
    ADD CONSTRAINT chk_consumable_returns_segments_valid 
    CHECK (
      (segment_start IS NULL AND segment_end IS NULL) OR
      (segment_start IS NOT NULL AND segment_end IS NOT NULL AND segment_end > segment_start)
    );
  END IF;
END $$;

COMMENT ON COLUMN consumable_returns.segment_start IS 'Starting marker number for cable segment returns';
COMMENT ON COLUMN consumable_returns.segment_end IS 'Ending marker number for cable segment returns';

-- ============================================================================
-- 3. Verification
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check stock_movements columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' AND column_name = 'start_marker'
  ) THEN
    RAISE EXCEPTION 'Column start_marker was not added to stock_movements';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' AND column_name = 'end_marker'
  ) THEN
    RAISE EXCEPTION 'Column end_marker was not added to stock_movements';
  END IF;
  
  -- Check consumable_returns columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumable_returns' AND column_name = 'segment_start'
  ) THEN
    RAISE EXCEPTION 'Column segment_start was not added to consumable_returns';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumable_returns' AND column_name = 'segment_end'
  ) THEN
    RAISE EXCEPTION 'Column segment_end was not added to consumable_returns';
  END IF;
  
  RAISE NOTICE 'Cable marker columns added successfully!';
END $$;
