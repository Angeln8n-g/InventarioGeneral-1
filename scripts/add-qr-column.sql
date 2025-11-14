-- Add QR code column to consumable_stock table
ALTER TABLE consumable_stock ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255);

-- Create index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_consumable_stock_qr_code ON consumable_stock(qr_code);

-- Note: Run this SQL in your Supabase SQL Editor
-- After running this, execute: node scripts/generate-consumable-qr.js
