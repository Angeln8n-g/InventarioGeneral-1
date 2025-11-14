-- Add 'return' to stock_movements movement_type
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_movement_type_check 
CHECK (movement_type IN ('consumption', 'adjustment', 'restock', 'loss', 'damage', 'return'));

-- Create consumable_returns table
CREATE TABLE IF NOT EXISTS consumable_returns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type_id INTEGER NOT NULL REFERENCES item_types(id) ON DELETE CASCADE,
  consumable_stock_id INTEGER NOT NULL REFERENCES consumable_stock(id) ON DELETE CASCADE,
  returned_quantity INTEGER NOT NULL CHECK (returned_quantity > 0),
  original_consumption_date DATE NOT NULL,
  return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consumable_returns_user ON consumable_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_consumable_returns_item_type ON consumable_returns(item_type_id);
CREATE INDEX IF NOT EXISTS idx_consumable_returns_stock ON consumable_returns(consumable_stock_id);
CREATE INDEX IF NOT EXISTS idx_consumable_returns_date ON consumable_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_consumable_returns_consumption_date ON consumable_returns(original_consumption_date);
CREATE INDEX IF NOT EXISTS idx_consumable_returns_status ON consumable_returns(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consumable_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consumable_returns_updated_at
  BEFORE UPDATE ON consumable_returns
  FOR EACH ROW
  EXECUTE FUNCTION update_consumable_returns_updated_at();

-- Add comment to table
COMMENT ON TABLE consumable_returns IS 'Tracks returns of unused consumables by users';
COMMENT ON COLUMN consumable_returns.original_consumption_date IS 'Date when the items were originally consumed';
COMMENT ON COLUMN consumable_returns.return_date IS 'Date and time when the items were returned';
