-- Migration: Add cost tracking columns for statistics
-- Description: Adds unit_cost to item_types and estimated_value to tool_instances
-- Date: 2025-01-27

-- Add unit_cost column to item_types table
ALTER TABLE item_types
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to explain the column
COMMENT ON COLUMN item_types.unit_cost IS 'Unit cost for consumables or estimated value for tools/electronics';

-- Add estimated_value column to tool_instances table
ALTER TABLE tool_instances
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to explain the column
COMMENT ON COLUMN tool_instances.estimated_value IS 'Estimated monetary value of this specific tool instance';

-- Update existing data with default values (can be updated later by admins)
-- For consumables, set a default unit cost of $10
UPDATE item_types
SET unit_cost = 10.00
WHERE is_consumable = TRUE AND unit_cost = 0.00;

-- For tools and electronics, set a default unit cost of $100
UPDATE item_types
SET unit_cost = 100.00
WHERE is_consumable = FALSE AND unit_cost = 0.00;

-- For tool instances, inherit the estimated value from item_types
UPDATE tool_instances ti
SET estimated_value = it.unit_cost
FROM item_types it
WHERE ti.item_type_id = it.id AND ti.estimated_value = 0.00;

-- Create index for better query performance on cost-related queries
CREATE INDEX IF NOT EXISTS idx_item_types_unit_cost ON item_types(unit_cost);
CREATE INDEX IF NOT EXISTS idx_tool_instances_estimated_value ON tool_instances(estimated_value);

-- Add constraint to ensure costs are non-negative
ALTER TABLE item_types
ADD CONSTRAINT check_unit_cost_non_negative CHECK (unit_cost >= 0);

ALTER TABLE tool_instances
ADD CONSTRAINT check_estimated_value_non_negative CHECK (estimated_value >= 0);
