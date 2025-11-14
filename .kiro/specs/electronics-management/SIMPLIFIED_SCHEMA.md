# Simplified Electronic Devices Schema

## Overview

The electronic devices management system has been simplified to focus on essential information only. Instead of storing detailed technical specifications (CPU, RAM, storage, GPU, etc.), the system now stores only the basic device information.

## Schema Design

### electronic_devices Table

```sql
CREATE TABLE electronic_devices (
  id SERIAL PRIMARY KEY,
  tool_instance_id INTEGER NOT NULL UNIQUE,
  brand VARCHAR(100),
  model VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  version INTEGER
);
```

### Fields Explanation

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | SERIAL | Primary key | 1, 2, 3... |
| `tool_instance_id` | INTEGER | Links to tool_instances (1:1) | 42 |
| `brand` | VARCHAR(100) | Device manufacturer | "Dell", "Apple", "Samsung" |
| `model` | VARCHAR(255) | Device model | "Latitude 5420", "MacBook Pro 14\"" |
| `created_at` | TIMESTAMP | Creation timestamp | 2025-01-15 10:30:00 |
| `updated_at` | TIMESTAMP | Last update timestamp | 2025-01-15 14:20:00 |
| `version` | INTEGER | Optimistic locking version | 1, 2, 3... |

## Additional Information Storage

Other device information is stored in related tables:

### tool_instances Table
- `serial_number` - Device serial number
- `qr_code` - Unique QR code for scanning
- `status` - Current status (available, loaned, in-repair, etc.)
- `condition_notes` - Notes about device condition

### item_types Table
- `name` - Device name/title
- `description` - Device description
- `category` - Device category (Laptops, Tablets, Smartphones, etc.)

## Benefits of Simplified Schema

1. **Easier to Maintain**: Less fields means less complexity
2. **Faster Queries**: Fewer indexes and simpler joins
3. **Flexible**: Can accommodate any device type without schema changes
4. **Focused**: Stores only what's essential for inventory management
5. **Extensible**: Can add more fields later if needed

## Example Data

```sql
-- Device 1: Dell Laptop
INSERT INTO electronic_devices (tool_instance_id, brand, model)
VALUES (1, 'Dell', 'Latitude 5420');

-- Device 2: Apple Tablet
INSERT INTO electronic_devices (tool_instance_id, brand, model)
VALUES (2, 'Apple', 'iPad Pro 12.9"');

-- Device 3: Samsung Phone
INSERT INTO electronic_devices (tool_instance_id, brand, model)
VALUES (3, 'Samsung', 'Galaxy S23 Ultra');

-- Device 4: Generic Peripheral
INSERT INTO electronic_devices (tool_instance_id, brand, model)
VALUES (4, 'Logitech', 'MX Master 3S');
```

## Query Examples

### Get all devices with full details
```sql
SELECT 
  ed.id,
  ed.brand,
  ed.model,
  ti.serial_number,
  ti.qr_code,
  ti.status,
  ti.condition_notes,
  it.name,
  it.category,
  it.description
FROM electronic_devices ed
JOIN tool_instances ti ON ed.tool_instance_id = ti.id
JOIN item_types it ON ti.item_type_id = it.id;
```

### Filter by brand
```sql
SELECT * FROM electronic_devices
WHERE brand = 'Dell';
```

### Search by model
```sql
SELECT * FROM electronic_devices
WHERE model ILIKE '%MacBook%';
```

### Get available devices
```sql
SELECT ed.*, ti.status
FROM electronic_devices ed
JOIN tool_instances ti ON ed.tool_instance_id = ti.id
WHERE ti.status = 'available';
```

## Migration Path

If you need to add more fields in the future:

```sql
-- Example: Add warranty information
ALTER TABLE electronic_devices
ADD COLUMN warranty_expiry DATE,
ADD COLUMN purchase_date DATE,
ADD COLUMN purchase_price DECIMAL(10,2);

-- Example: Add technical notes
ALTER TABLE electronic_devices
ADD COLUMN technical_notes TEXT;
```

## Comparison: Before vs After

### Before (Complex)
- 24 specification fields
- 5 indexes
- Complex forms with many sections
- Difficult to maintain
- Specific to certain device types

### After (Simplified)
- 2 main fields (brand, model)
- 3 indexes
- Simple, focused forms
- Easy to maintain
- Works for all device types

## Conclusion

The simplified schema provides everything needed for basic inventory management while remaining flexible and easy to use. Additional details can be stored in the `condition_notes` field of `tool_instances` or added as new fields if specific requirements emerge.
