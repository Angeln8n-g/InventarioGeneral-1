-- Migration: Add cable marker columns for precise cable tracking
-- Description: Adds start_marker and end_marker columns to stock_movements table
--              and segment_start and segment_end columns to consumable_returns table
--              to enable marker-based cable consumption and return tracking

-- ============================================================================
-- PART 1: Add marker columns to stock_movements table
-- ============================================================================

-- Add marker columns for cable consumption tracking
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS start_marker DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS end_marker DECIMAL(10, 2);

-- Add index for efficient querying by markers
CREATE INDEX IF NOT EXISTS idx_stock_movements_markers 
ON stock_movements(start_marker, end_marker) 
WHERE start_marker IS NOT NULL;

-- Add check constraint to ensure marker validity
-- Markers must be both null or both non-null, and end_marker must be greater than start_marker
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS chk_markers_valid;

ALTER TABLE stock_movements
ADD CONSTRAINT chk_markers_valid 
CHECK (
  (start_marker IS NULL AND end_marker IS NULL) OR
  (start_marker IS NOT NULL AND end_marker IS NOT NULL AND end_marker > start_marker)
);

-- Add comments for documentation
COMMENT ON COLUMN stock_movements.start_marker IS 'Starting marker number from cable (for cable-type consumables)';
COMMENT ON COLUMN stock_movements.end_marker IS 'Ending marker number from cable (for cable-type consumables)';

-- ============================================================================
-- PART 2: Add segment columns to consumable_returns table
-- ============================================================================

-- Add segment columns for cable return tracking
ALTER TABLE consumable_returns
ADD COLUMN IF NOT EXISTS segment_start DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS segment_end DECIMAL(10, 2);

-- Add index for efficient overlap detection
CREATE INDEX IF NOT EXISTS idx_consumable_returns_segments 
ON consumable_returns(segment_start, segment_end) 
WHERE segment_start IS NOT NULL;

-- Add check constraint to ensure segment validity
-- Segments must be both null or both non-null, and segment_end must be greater than segment_start
ALTER TABLE consumable_returns
DROP CONSTRAINT IF EXISTS chk_segments_valid;

ALTER TABLE consumable_returns
ADD CONSTRAINT chk_segments_valid 
CHECK (
  (segment_start IS NULL AND segment_end IS NULL) OR
  (segment_start IS NOT NULL AND segment_end IS NOT NULL AND segment_end > segment_start)
);

-- Add comments for documentation
COMMENT ON COLUMN consumable_returns.segment_start IS 'Starting marker of returned cable segment';
COMMENT ON COLUMN consumable_returns.segment_end IS 'Ending marker of returned cable segment';

-- ============================================================================
-- PART 3: Create helper function for overlap detection
-- ============================================================================

-- Function to check if two cable segments overlap
-- Returns true if segments overlap, false otherwise
CREATE OR REPLACE FUNCTION cable_segments_overlap(
  seg1_start DECIMAL,
  seg1_end DECIMAL,
  seg2_start DECIMAL,
  seg2_end DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Segments overlap if: seg1_start < seg2_end AND seg1_end > seg2_start
  RETURN (seg1_start < seg2_end) AND (seg1_end > seg2_start);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION cable_segments_overlap IS 'Checks if two cable segments overlap using mathematical overlap formula';

-- ============================================================================
-- PART 4: Create view for cable consumption with markers
-- ============================================================================

-- View to easily query cable consumptions with marker information
CREATE OR REPLACE VIEW cable_consumptions_with_markers AS
SELECT 
  sm.id,
  sm.consumable_stock_id,
  sm.user_id,
  sm.quantity,
  sm.start_marker,
  sm.end_marker,
  sm.created_at,
  cs.item_type_id,
  cs.unit_of_measure,
  it.name as item_name,
  it.description as item_description,
  u.username,
  u.email
FROM stock_movements sm
JOIN consumable_stock cs ON sm.consumable_stock_id = cs.id
JOIN item_types it ON cs.item_type_id = it.id
LEFT JOIN users u ON sm.user_id = u.id
WHERE sm.movement_type = 'consumption'
  AND sm.start_marker IS NOT NULL
  AND sm.end_marker IS NOT NULL;

COMMENT ON VIEW cable_consumptions_with_markers IS 'View of cable consumptions that include marker information';

-- ============================================================================
-- PART 5: Create view for cable returns with segments
-- ============================================================================

-- View to easily query cable returns with segment information
CREATE OR REPLACE VIEW cable_returns_with_segments AS
SELECT 
  cr.id,
  cr.user_id,
  cr.item_type_id,
  cr.consumable_stock_id,
  cr.returned_quantity,
  cr.segment_start,
  cr.segment_end,
  cr.original_consumption_date,
  cr.return_date,
  cr.notes,
  it.name as item_name,
  it.description as item_description,
  cs.unit_of_measure,
  u.username,
  u.email
FROM consumable_returns cr
JOIN item_types it ON cr.item_type_id = it.id
JOIN consumable_stock cs ON cr.consumable_stock_id = cs.id
LEFT JOIN users u ON cr.user_id = u.id
WHERE cr.segment_start IS NOT NULL
  AND cr.segment_end IS NOT NULL;

COMMENT ON VIEW cable_returns_with_segments IS 'View of cable returns that include segment information';

-- ============================================================================
-- PART 6: Migration verification
-- ============================================================================

-- Verify that columns were added successfully
DO $$
BEGIN
  -- Check stock_movements columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' 
    AND column_name = 'start_marker'
  ) THEN
    RAISE EXCEPTION 'Migration failed: start_marker column not added to stock_movements';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' 
    AND column_name = 'end_marker'
  ) THEN
    RAISE EXCEPTION 'Migration failed: end_marker column not added to stock_movements';
  END IF;

  -- Check consumable_returns columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumable_returns' 
    AND column_name = 'segment_start'
  ) THEN
    RAISE EXCEPTION 'Migration failed: segment_start column not added to consumable_returns';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumable_returns' 
    AND column_name = 'segment_end'
  ) THEN
    RAISE EXCEPTION 'Migration failed: segment_end column not added to consumable_returns';
  END IF;

  RAISE NOTICE 'Migration 015_add_cable_markers completed successfully';
  RAISE NOTICE 'Added marker columns to stock_movements: start_marker, end_marker';
  RAISE NOTICE 'Added segment columns to consumable_returns: segment_start, segment_end';
  RAISE NOTICE 'Created helper function: cable_segments_overlap()';
  RAISE NOTICE 'Created views: cable_consumptions_with_markers, cable_returns_with_segments';
END $$;
