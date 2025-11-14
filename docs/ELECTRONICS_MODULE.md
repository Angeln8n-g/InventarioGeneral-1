# Electronics Management Module

## Overview
Complete module for managing electronic devices (laptops, tablets, smartphones, etc.) in the inventory system.

## Features
✅ CRUD operations for electronic devices
✅ QR code generation for each device
✅ Device status tracking (available, loaned, damaged, etc.)
✅ Brand and model information
✅ Serial number tracking
✅ Condition notes
✅ Integration with loans system
✅ Filtering and search capabilities

## Database Schema

### Tables
- `electronic_devices` - Main table for electronic device records
- `tool_instances` - Links to tool instances (inherited from tools system)
- `item_types` - Device types and categories

### Relationships
```
electronic_devices
  ├─ tool_instance_id → tool_instances (one-to-one)
  │   └─ item_type_id → item_types (many-to-one)
  └─ current_loan → loans (optional, one-to-one)
```

## API Endpoints

### GET /api/admin/electronics
Fetch all electronic devices with optional filters.

**Query Parameters:**
- `status` - Filter by device status (available, loaned, etc.)
- `category` - Filter by category (Laptops, Tablets, etc.)
- `search` - Search by name, brand, model, or serial number

**Response:**
```json
{
  "data": [...],
  "total": 5,
  "summary": {
    "by_status": { "available": 4, "loaned": 1 },
    "by_category": { "Laptops": 2, "Tablets": 2, "Smartphones": 1 }
  }
}
```

### POST /api/admin/electronics
Create a new electronic device.

**Body:**
```json
{
  "name": "MacBook Pro 14\"",
  "description": "Apple MacBook Pro 14 inch laptop",
  "category": "Laptops",
  "brand": "Apple",
  "model": "MacBook Pro 14\" M1 Pro",
  "serial_number": "C02XJ0AAJGH5",
  "status": "available",
  "condition_notes": "Excellent condition"
}
```

### GET /api/admin/electronics/[id]
Get a specific electronic device by ID.

### PUT /api/admin/electronics/[id]
Update an electronic device.

### DELETE /api/admin/electronics/[id]
Delete an electronic device (only if not currently loaned).

## Components

### ElectronicDeviceCard
Displays device information in a card format.

**Props:**
- `device: ElectronicDeviceWithDetails`
- `onViewDetails: () => void`

### ElectronicDeviceModal
Modal for viewing detailed device information.

**Props:**
- `device: ElectronicDeviceWithDetails`
- `onClose: () => void`
- `onEdit: () => void`
- `onDelete: () => void`
- `isDeleting: boolean`

### ElectronicDeviceForm
Form for creating/editing devices.

**Props:**
- `device?: ElectronicDeviceWithDetails` (optional, for editing)
- `onSubmit: (data) => Promise<void>`
- `onCancel: () => void`
- `isSubmitting: boolean`

## Pages

### /admin/electronics
Main listing page with filters and search.

### /admin/electronics/new
Create new electronic device.

### /admin/electronics/[id]
Edit existing electronic device.

## Migrations

### 008_add_electronic_devices.sql
Creates the `electronic_devices` table with proper relationships.

### 009_seed_electronic_devices.sql
Seeds the database with 5 sample devices for testing.

### 010_fix_duplicate_foreign_key.sql
Removes duplicate foreign key constraint for cleaner queries.

## Usage Examples

### Creating a Device
```typescript
const newDevice = await electronicDeviceOperations.create({
  name: 'iPad Pro 11"',
  category: 'Tablets',
  brand: 'Apple',
  model: 'iPad Pro 11" (3rd Gen)',
  serial_number: 'DMXK2LL/A',
  status: 'available',
  condition_notes: 'Good condition',
})
```

### Fetching Devices with Filters
```typescript
const devices = await electronicDeviceOperations.getAll({
  status: 'available',
  category: 'Laptops',
  search: 'MacBook',
})
```

### Type-Safe Data Extraction
```typescript
import { getDeviceData } from '@/types/electronics'

const { toolInstance, itemType } = getDeviceData(device)
console.log(itemType.name) // Type-safe access
```

## Testing

### Test Connection Page
Navigate to `/admin/test-connection` to:
- Test authentication
- Verify database connectivity
- Test API endpoints
- Seed sample devices

### Sample Data
Use the "🌱 Seed Sample Devices" button to create:
- MacBook Pro 14" (Apple)
- iPad Pro 11" (Apple)
- iPhone 13 (Apple)
- Dell Latitude 5420 (Dell)
- Samsung Galaxy Tab S8 (Samsung)

## Troubleshooting

### "No token provided" Error
**Solution:** Log in at `/login` first.

### "Could not embed because more than one relationship was found"
**Solution:** Run migration `010_fix_duplicate_foreign_key.sql` to remove the duplicate foreign key.

### Empty Device List
**Solution:** Use the seed endpoint or manually create devices.

## Performance Optimizations

1. **Simplified Queries** - After removing duplicate FK, queries are cleaner
2. **Type-Safe Helpers** - `getDeviceData()` provides type safety without `as any`
3. **Client-Side Filtering** - Status and category filters applied in JavaScript for flexibility
4. **Indexed Columns** - Brand, model, and tool_instance_id are indexed

## Security

- All endpoints require admin authentication
- JWT token validation on every request
- Cannot delete devices with active loans
- Audit logs for all CRUD operations

## Future Enhancements

- [ ] Bulk import from CSV
- [ ] Device history tracking
- [ ] Maintenance scheduling
- [ ] Photo uploads
- [ ] Warranty tracking
- [ ] Purchase order integration
