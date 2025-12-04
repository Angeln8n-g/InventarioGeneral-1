# Electronics Management Module

## Overview
Complete module for managing electronic devices (laptops, tablets, smartphones, etc.) in the inventory system. This module includes memory capacity tracking, classroom management, device assignments, device combinations, and comprehensive reporting.

## Features
✅ CRUD operations for electronic devices
✅ QR code generation for each device
✅ Device status tracking (available, loaned, damaged, etc.)
✅ Brand and model information
✅ Serial number tracking
✅ Condition notes
✅ Integration with loans system
✅ Filtering and search capabilities
✅ **Memory capacity tracking** (GB/TB for applicable devices)
✅ **Edit modal for quick device updates**
✅ **Classroom management system**
✅ **Device assignment to classrooms**
✅ **Device combinations (workstations)**
✅ **Assignment history tracking**
✅ **Classroom equipment reports**

---

## Memory Capacity Feature

### Overview
Track memory capacity (RAM/Storage) for electronic devices where applicable. Memory fields are only shown for device categories where memory is relevant.

### Applicable Categories
- **Laptops** - RAM and storage capacity
- **Tablets** - Storage capacity
- **Smartphones** - Storage capacity

### Memory Units
- **GB** (Gigabytes) - For most devices
- **TB** (Terabytes) - For high-capacity storage

### Usage
1. When creating or editing a Laptop, Tablet, or Smartphone, the memory capacity field appears
2. Enter a numeric value (e.g., 16)
3. Select the unit (GB or TB)
4. The system displays formatted values like "16 GB" or "1 TB"

### API Fields
```typescript
{
  memory_capacity?: number  // e.g., 16, 256, 1
  memory_unit?: 'GB' | 'TB' // Unit of measurement
}
```

---

## Edit Modal

### Overview
Quick inline editing of electronic devices without navigating away from the list view.

### How to Use
1. Navigate to **Admin > Electrónicos**
2. Find the device you want to edit
3. Click the **Edit** button on the device card
4. Modify the fields in the modal dialog
5. Click **Guardar** to save changes or **Cancelar** to discard

### Editable Fields
- Name
- Category
- Description
- Brand
- Model
- Serial Number
- Memory Capacity (for applicable categories)
- Status
- Condition Notes

### Validation
- Required fields must be filled
- Memory capacity must be a positive number
- Changes are validated before submission

---

## Classroom Management

### Overview
Manage physical spaces (classrooms/aulas) where electronic equipment is assigned and used.

### Navigation
**Admin Dashboard > Aulas** or `/admin/classrooms`

### Classroom Properties
| Field | Description | Required |
|-------|-------------|----------|
| Name | Classroom identifier (e.g., "Aula 101") | Yes |
| Location | Physical location (e.g., "Edificio A, Piso 2") | Yes |
| Status | Operational state | Yes |
| Responsible Person | Person in charge of the classroom | No |
| Description | Additional notes | No |

### Status Values
- **active** - Classroom is operational
- **inactive** - Classroom is not in use
- **maintenance** - Classroom is under maintenance

### Operations

#### Create Classroom
1. Go to **Admin > Aulas**
2. Click **Crear Aula**
3. Fill in the required fields
4. Click **Guardar**

#### Edit Classroom
1. Go to **Admin > Aulas**
2. Click **Ver** on the classroom row
3. Click **Editar**
4. Modify fields and save

#### Delete Classroom
1. Go to **Admin > Aulas**
2. Click **Ver** on the classroom row
3. Click **Eliminar**
4. Confirm deletion

**Note:** Classrooms with assigned devices cannot be deleted. Remove all device assignments first.

### Uniqueness Constraint
Classroom names must be unique within the same location. You can have "Aula 101" in "Edificio A" and "Aula 101" in "Edificio B".

---

## Device Assignment System

### Overview
Link electronic devices to specific classrooms to track equipment location and usage.

### Navigation
**Admin Dashboard > Asignaciones** or `/admin/assignments`

### Assignment Page Layout
The page is divided into sections:
1. **Classrooms Panel** (left) - Select a classroom to manage
2. **Available Devices** - Devices not assigned to any classroom
3. **Devices in Other Classrooms** - Shows where other devices are located
4. **Assigned Devices** - Devices in the selected classroom
5. **Device Combinations** - Paired devices in the classroom
6. **Summary Statistics** - Quick overview of counts

### Assigning a Device
1. Select a classroom from the left panel
2. Find the device in "Dispositivos Disponibles"
3. Click **Asignar**
4. The device moves to "Dispositivos Asignados"

### Removing an Assignment
1. Select the classroom containing the device
2. Find the device in "Dispositivos Asignados"
3. Click **Remover**
4. Confirm the removal
5. The device returns to "Dispositivos Disponibles"

### Filtering Devices
- **Search** - Filter by name, serial number, brand, or model
- **Category** - Filter by device category (Laptops, Tablets, etc.)
- **Status** - Show active, removed, or all assignments

---

## Device Combinations (Workstations)

### Overview
Combine two devices that work together as a unit (e.g., a monitor with a CPU, or a laptop with a docking station).

### Requirements
- Both devices must be assigned to the **same classroom**
- Only 2 devices can be combined at a time
- Devices can only be in one active combination

### Creating a Combination
1. Go to **Admin > Asignaciones**
2. Select the classroom
3. In "Dispositivos Asignados", check the boxes for 2 devices
4. Click **Combinar dispositivos seleccionados**
5. The combination appears in "Combinaciones de Dispositivos"

### Removing a Combination
1. Find the combination in "Combinaciones de Dispositivos"
2. Click **Desenlazar**
3. Confirm the removal
4. Both devices remain assigned to the classroom (only the link is removed)

### Visual Indicators
- Combined devices show a link icon (🔗)
- Combinations display both device names together
- The combination type (e.g., "Workstation") is shown

---

## Assignment History

### Overview
Track when and where devices have been located over time, including who made the assignments.

### Device History
View a device's assignment history:
1. Go to **Admin > Electrónicos**
2. Click on a device to view details
3. The "Historial de Asignaciones" section shows:
   - Current assignment (if any)
   - Past assignments with dates
   - Administrator who made each assignment

### Classroom History
View a classroom's device history:
1. Go to **Admin > Aulas**
2. Click **Ver** on a classroom
3. The detail page shows:
   - Currently assigned devices
   - Historical assignments
   - Assignment and removal dates

### History Record Fields
| Field | Description |
|-------|-------------|
| Assigned Date | When the device was assigned |
| Removed Date | When the device was removed (if applicable) |
| Classroom | The classroom name and location |
| Assigned By | Administrator who created the assignment |
| Removed By | Administrator who removed the assignment |

---

## Classroom Equipment Reports

### Overview
Generate comprehensive reports on device distribution across classrooms.

### Navigation
**Admin Dashboard > Reportes > Equipos por Aula** or `/admin/reports/classroom-equipment`

### Report Contents

#### Summary Statistics
- Total classrooms
- Total devices assigned
- Total combinations
- Classrooms with devices
- Empty classrooms
- Incomplete workstations

#### Per-Classroom Details
- Classroom name and location
- Status (active/inactive/maintenance)
- Total device count
- Devices by category breakdown
- Incomplete workstation count
- Expandable device list

### Incomplete Workstations
The report identifies devices that should be paired but aren't. For example:
- A monitor without a CPU
- A CPU without a monitor
- A laptop without a docking station

### Export Options
- **CSV Export** - Download report data as a CSV file
- Click **Exportar CSV** to download

### Expanding Details
Click on any classroom row to expand and see:
- Full device list
- Device names, categories, brands
- Serial numbers
- Combination status

---

## Database Schema

### Tables
- `electronic_devices` - Main table for electronic device records
- `classrooms` - Physical spaces for equipment
- `device_assignments` - Links devices to classrooms
- `device_combinations` - Pairs of related devices

### Relationships
```
electronic_devices
  ├─ tool_instance_id → tool_instances (one-to-one)
  │   └─ item_type_id → item_types (many-to-one)
  ├─ current_loan → loans (optional, one-to-one)
  └─ device_assignments → classrooms (many-to-many through assignments)

classrooms
  └─ device_assignments → electronic_devices (one-to-many)

device_combinations
  ├─ device_1_id → electronic_devices
  └─ device_2_id → electronic_devices
```

---

## API Endpoints

### Electronics API

#### GET /api/admin/electronics
Fetch all electronic devices with optional filters.

**Query Parameters:**
- `status` - Filter by device status
- `category` - Filter by category
- `search` - Search by name, brand, model, or serial number

**Response includes:**
- Memory capacity and unit (if set)
- Device details and relationships

#### POST /api/admin/electronics
Create a new electronic device.

**Body (with memory):**
```json
{
  "name": "MacBook Pro 14\"",
  "category": "Laptops",
  "brand": "Apple",
  "model": "MacBook Pro 14\" M1 Pro",
  "serial_number": "C02XJ0AAJGH5",
  "status": "available",
  "memory_capacity": 16,
  "memory_unit": "GB"
}
```

#### PUT /api/admin/electronics/[id]
Update an electronic device (including memory fields).

### Classrooms API

#### GET /api/admin/classrooms
List all classrooms with device counts.

#### POST /api/admin/classrooms
Create a new classroom.

#### GET /api/admin/classrooms/[id]
Get classroom details with assignments.

#### PUT /api/admin/classrooms/[id]
Update a classroom.

#### DELETE /api/admin/classrooms/[id]
Delete a classroom (fails if devices are assigned).

### Device Assignments API

#### GET /api/admin/device-assignments
List all assignments with filters.

**Query Parameters:**
- `status` - Filter by active/removed
- `classroom_id` - Filter by classroom
- `device_id` - Filter by device

#### POST /api/admin/device-assignments
Create a new assignment.

```json
{
  "electronic_device_id": 1,
  "classroom_id": 5,
  "notes": "Assigned for training room"
}
```

#### DELETE /api/admin/device-assignments/[id]
Remove an assignment (soft delete - preserves history).

#### GET /api/admin/device-assignments/by-classroom/[classroomId]
Get all assignments for a specific classroom.

#### GET /api/admin/device-assignments/by-device/[deviceId]
Get assignment history for a specific device.

### Device Combinations API

#### GET /api/admin/device-combinations
List all device combinations.

#### POST /api/admin/device-combinations
Create a new combination.

```json
{
  "device_1_id": 1,
  "device_2_id": 2,
  "combination_type": "Workstation",
  "notes": "Monitor and CPU pair"
}
```

#### DELETE /api/admin/device-combinations/[id]
Remove a combination (preserves individual assignments).

#### GET /api/admin/device-combinations/by-classroom/[classroomId]
Get all combinations in a specific classroom.

### Reports API

#### GET /api/admin/reports/classroom-equipment
Generate classroom equipment report.

**Response:**
```json
{
  "data": [...],
  "summary": {
    "total_classrooms": 10,
    "total_devices_assigned": 45,
    "total_combinations": 12,
    "classrooms_with_devices": 8,
    "classrooms_without_devices": 2,
    "total_incomplete_workstations": 3
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

## Security

- All endpoints require admin authentication
- JWT token validation on every request
- Permission checks for all operations
- Audit logs for create/update/delete operations
- Cannot delete classrooms with assigned devices
- Cannot delete devices with active loans

---

## Troubleshooting

### "No token provided" Error
**Solution:** Log in at `/login` first.

### "Classroom has assigned devices" Error
**Solution:** Remove all device assignments before deleting the classroom.

### "Device already assigned" Error
**Solution:** A device can only be assigned to one classroom at a time. Remove the existing assignment first.

### "Devices must be in same classroom" Error
**Solution:** Both devices must be assigned to the same classroom before creating a combination.

### Memory fields not showing
**Solution:** Memory fields only appear for Laptops, Tablets, and Smartphones categories.

---

## Performance Optimizations

1. **Indexed Columns** - Classroom status, location, and assignment foreign keys are indexed
2. **Soft Deletes** - Assignments use `is_active` flag to preserve history
3. **Pagination** - Large lists are paginated
4. **Client-Side Filtering** - Quick filters applied in JavaScript
5. **Lazy Loading** - Assignment history loaded on demand

---

## Future Enhancements

- [ ] Bulk device assignment
- [ ] Device transfer between classrooms
- [ ] Maintenance scheduling per classroom
- [ ] Equipment value tracking
- [ ] PDF report export
- [ ] Email notifications for assignments
- [ ] QR code scanning for quick assignment
