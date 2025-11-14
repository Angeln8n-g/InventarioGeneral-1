-- Create stock_movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  consumable_stock_id INTEGER REFERENCES consumable_stock(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('consumption', 'adjustment', 'restock', 'loss', 'damage')),
  quantity INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_consumable ON stock_movements(consumable_stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
