-- Function to generate QR code for consumable_stock
CREATE OR REPLACE FUNCTION generate_consumable_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if qr_code is NULL or empty
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'CONSUMABLE-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that fires BEFORE INSERT on consumable_stock
CREATE TRIGGER trigger_generate_consumable_qr
  BEFORE INSERT ON consumable_stock
  FOR EACH ROW
  EXECUTE FUNCTION generate_consumable_qr_code();

-- Trigger that fires BEFORE UPDATE on consumable_stock (only if qr_code is being set to NULL)
CREATE TRIGGER trigger_update_consumable_qr
  BEFORE UPDATE ON consumable_stock
  FOR EACH ROW
  WHEN (NEW.qr_code IS NULL OR NEW.qr_code = '')
  EXECUTE FUNCTION generate_consumable_qr_code();
