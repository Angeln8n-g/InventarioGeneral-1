-- Add QR code column to consumable_stock table
ALTER TABLE consumable_stock ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255) UNIQUE;

-- Generate QR codes for existing consumables (using item_type_id as base)
UPDATE consumable_stock 
SET qr_code = 'CONSUMABLE-' || item_type_id 
WHERE qr_code IS NULL;

-- Make qr_code NOT NULL after populating
ALTER TABLE consumable_stock ALTER COLUMN qr_code SET NOT NULL;

-- Create index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_consumable_stock_qr_code ON consumable_stock(qr_code);
