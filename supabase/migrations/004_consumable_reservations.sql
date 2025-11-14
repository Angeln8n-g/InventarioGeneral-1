-- Create consumable_reservations table
CREATE TABLE IF NOT EXISTS consumable_reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type_id INTEGER NOT NULL REFERENCES item_types(id) ON DELETE CASCADE,
  reserved_quantity INTEGER NOT NULL CHECK (reserved_quantity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
  reservation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP NOT NULL,
  pickup_date TIMESTAMP,
  notes TEXT,
  purpose TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_reservations_user_id ON consumable_reservations(user_id);
CREATE INDEX idx_reservations_item_type_id ON consumable_reservations(item_type_id);
CREATE INDEX idx_reservations_status ON consumable_reservations(status);
CREATE INDEX idx_reservations_expiration_date ON consumable_reservations(expiration_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consumable_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consumable_reservations_updated_at
  BEFORE UPDATE ON consumable_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_consumable_reservations_updated_at();

-- Add RLS (Row Level Security) policies
-- Note: RLS is enabled but policies are permissive for API-based authentication
-- Authentication is handled at the API layer with JWT tokens
ALTER TABLE consumable_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated operations (authentication handled by API)
CREATE POLICY "Allow all operations for authenticated users"
  ON consumable_reservations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create view for reservation details with user and item info
CREATE OR REPLACE VIEW reservation_details AS
SELECT 
  r.id,
  r.user_id,
  u.username,
  u.email,
  r.item_type_id,
  it.name as item_name,
  it.category as item_category,
  r.reserved_quantity,
  r.status,
  r.reservation_date,
  r.expiration_date,
  r.pickup_date,
  r.notes,
  r.purpose,
  cs.unit_of_measure,
  r.created_at,
  r.updated_at,
  -- Calculate days until expiration
  EXTRACT(DAY FROM (r.expiration_date - CURRENT_TIMESTAMP)) as days_until_expiration,
  -- Check if expired
  CASE 
    WHEN r.expiration_date < CURRENT_TIMESTAMP AND r.status = 'active' THEN true
    ELSE false
  END as is_expired
FROM consumable_reservations r
JOIN users u ON r.user_id = u.id
JOIN item_types it ON r.item_type_id = it.id
LEFT JOIN consumable_stock cs ON cs.item_type_id = r.item_type_id;

-- Function to auto-expire reservations
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS void AS $$
BEGIN
  UPDATE consumable_reservations
  SET status = 'expired',
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'active'
    AND expiration_date < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run expiration check (requires pg_cron extension)
-- Note: This needs to be enabled in Supabase dashboard or run manually
-- SELECT cron.schedule('expire-reservations', '0 * * * *', 'SELECT expire_old_reservations()');

COMMENT ON TABLE consumable_reservations IS 'Stores reservations for consumable items';
COMMENT ON COLUMN consumable_reservations.status IS 'active: reservation is active, fulfilled: items picked up, cancelled: user cancelled, expired: time limit passed';
COMMENT ON COLUMN consumable_reservations.expiration_date IS 'Date when reservation expires and stock is released';
COMMENT ON COLUMN consumable_reservations.pickup_date IS 'Date when items were actually picked up';
