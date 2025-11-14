-- Create warehouse_qr_codes table for physical verification
CREATE TABLE IF NOT EXISTS warehouse_qr_codes (
  id SERIAL PRIMARY KEY,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  location_description TEXT,
  zone VARCHAR(50), -- e.g., 'tools', 'consumables', 'electronics'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add warehouse_qr_code_id to consumable_reservations for tracking which QR was scanned
ALTER TABLE consumable_reservations 
ADD COLUMN IF NOT EXISTS warehouse_qr_code_id INTEGER REFERENCES warehouse_qr_codes(id) ON DELETE SET NULL;

-- Create index for fast QR code lookup
CREATE INDEX idx_warehouse_qr_codes_qr_code ON warehouse_qr_codes(qr_code);
CREATE INDEX idx_warehouse_qr_codes_is_active ON warehouse_qr_codes(is_active);
CREATE INDEX idx_reservations_warehouse_qr ON consumable_reservations(warehouse_qr_code_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_warehouse_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_warehouse_qr_codes_updated_at
  BEFORE UPDATE ON warehouse_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_qr_codes_updated_at();

-- Add RLS policies
ALTER TABLE warehouse_qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to warehouse QR codes"
  ON warehouse_qr_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to manage warehouse QR codes"
  ON warehouse_qr_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert 5 initial warehouse QR codes
INSERT INTO warehouse_qr_codes (qr_code, location_name, location_description, zone) VALUES
  ('WH-QR-001-ENTRANCE', 'Entrada Principal', 'Código QR ubicado en la entrada principal del almacén', 'general'),
  ('WH-QR-002-TOOLS', 'Zona de Herramientas', 'Código QR en el área de herramientas y equipos', 'tools'),
  ('WH-QR-003-CONSUMABLES', 'Zona de Consumibles', 'Código QR en el área de materiales consumibles', 'consumables'),
  ('WH-QR-004-ELECTRONICS', 'Zona de Electrónicos', 'Código QR en el área de dispositivos electrónicos', 'electronics'),
  ('WH-QR-005-EXIT', 'Salida del Almacén', 'Código QR ubicado cerca de la salida del almacén', 'general')
ON CONFLICT (qr_code) DO NOTHING;

-- Create view for warehouse QR scan statistics
CREATE OR REPLACE VIEW warehouse_qr_scan_stats AS
SELECT 
  wq.id,
  wq.qr_code,
  wq.location_name,
  wq.zone,
  wq.is_active,
  COUNT(cr.id) as total_scans,
  COUNT(CASE WHEN cr.pickup_date >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as scans_last_7_days,
  COUNT(CASE WHEN cr.pickup_date >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as scans_last_30_days,
  MAX(cr.pickup_date) as last_scan_date
FROM warehouse_qr_codes wq
LEFT JOIN consumable_reservations cr ON cr.warehouse_qr_code_id = wq.id
GROUP BY wq.id, wq.qr_code, wq.location_name, wq.zone, wq.is_active;

COMMENT ON TABLE warehouse_qr_codes IS 'QR codes placed throughout the warehouse for physical presence verification';
COMMENT ON COLUMN warehouse_qr_codes.zone IS 'Area of the warehouse where the QR code is located';
COMMENT ON COLUMN warehouse_qr_codes.is_active IS 'Whether this QR code is currently active for scanning';
COMMENT ON COLUMN consumable_reservations.warehouse_qr_code_id IS 'Which warehouse QR code was scanned when fulfilling the reservation';
