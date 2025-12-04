# Design Document

## Overview

This design document outlines the architecture and implementation approach for enhancing the electronics management module with memory capacity tracking, edit modal functionality, classroom management, and device assignment capabilities. The enhancements will integrate seamlessly with the existing electronics module while introducing new database tables and API endpoints for classroom and assignment management.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Electronics  │  │  Classroom   │  │   Device     │      │
│  │ Edit Modal   │  │  Management  │  │  Assignment  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Electronics  │  │  Classrooms  │  │ Assignments  │      │
│  │     API      │  │     API      │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Electronic   │  │  Classroom   │  │  Assignment  │      │
│  │ Operations   │  │  Operations  │  │  Operations  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ electronic_  │  │  classrooms  │  │   device_    │      │
│  │   devices    │  │              │  │ assignments  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                    ┌──────────────┐                          │
│                    │   device_    │                          │
│                    │ combinations │                          │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Electronics Edit Flow**: User clicks edit → Modal opens → User modifies → API validates → Database updates → UI refreshes
2. **Classroom Management Flow**: User creates/edits classroom → API validates uniqueness → Database persists → List refreshes
3. **Device Assignment Flow**: User selects classroom → Selects device → API creates assignment → Database links → View updates
4. **Device Combination Flow**: User selects two devices → API validates same classroom → Database creates combination → UI shows pairing

## Components and Interfaces

### 1. Memory Capacity Enhancement

#### Database Schema Addition

```sql
ALTER TABLE electronic_devices 
ADD COLUMN memory_capacity NUMERIC(10, 2),
ADD COLUMN memory_unit VARCHAR(10) CHECK (memory_unit IN ('GB', 'TB'));
```

#### Type Definitions

```typescript
export interface ElectronicDevice {
  // ... existing fields
  memory_capacity?: number
  memory_unit?: 'GB' | 'TB'
}

export interface CreateElectronicDeviceInput {
  // ... existing fields
  memory_capacity?: number
  memory_unit?: 'GB' | 'TB'
}

export interface UpdateElectronicDeviceInput {
  // ... existing fields
  memory_capacity?: number
  memory_unit?: 'GB' | 'TB'
}
```

### 2. Edit Modal Component

#### Component Structure

```typescript
interface EditElectronicDeviceModalProps {
  device: ElectronicDeviceWithDetails
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditElectronicDeviceModal({
  device,
  isOpen,
  onClose,
  onSuccess
}: EditElectronicDeviceModalProps)
```

#### Form Fields
- Name (text, required)
- Category (select, required)
- Description (textarea, optional)
- Brand (text, optional)
- Model (text, optional)
- Serial Number (text, optional)
- Memory Capacity (number, optional, conditional)
- Memory Unit (select: GB/TB, optional, conditional)
- Status (select, required)
- Condition Notes (textarea, optional)

### 3. Classroom Management

#### Database Schema

```sql
CREATE TABLE classrooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  UNIQUE(name, location)
);

CREATE INDEX idx_classrooms_status ON classrooms(status);
CREATE INDEX idx_classrooms_location ON classrooms(location);
```

#### Type Definitions

```typescript
export interface Classroom {
  id: number
  name: string
  location: string
  status: 'active' | 'inactive' | 'maintenance'
  description?: string
  created_at: string
  updated_at: string
  version: number
}

export interface CreateClassroomInput {
  name: string
  location: string
  status: 'active' | 'inactive' | 'maintenance'
  description?: string
}

export interface UpdateClassroomInput {
  name?: string
  location?: string
  status?: 'active' | 'inactive' | 'maintenance'
  description?: string
}

export interface ClassroomWithDeviceCount extends Classroom {
  device_count: number
}
```

#### API Endpoints

- `GET /api/admin/classrooms` - List all classrooms with device counts
- `POST /api/admin/classrooms` - Create new classroom
- `GET /api/admin/classrooms/[id]` - Get classroom details
- `PUT /api/admin/classrooms/[id]` - Update classroom
- `DELETE /api/admin/classrooms/[id]` - Delete classroom (if no devices assigned)

### 4. Device Assignment System

#### Database Schema

```sql
CREATE TABLE device_assignments (
  id SERIAL PRIMARY KEY,
  electronic_device_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_date TIMESTAMP WITH TIME ZONE,
  assigned_by INTEGER REFERENCES users(id),
  removed_by INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(electronic_device_id, is_active) WHERE is_active = TRUE
);

CREATE TABLE device_combinations (
  id SERIAL PRIMARY KEY,
  device_1_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  device_2_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  combination_type VARCHAR(100),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  removed_date TIMESTAMP WITH TIME ZONE,
  removed_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (device_1_id != device_2_id),
  UNIQUE(device_1_id, device_2_id, is_active) WHERE is_active = TRUE
);

CREATE INDEX idx_device_assignments_classroom ON device_assignments(classroom_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_assignments_device ON device_assignments(electronic_device_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_combinations_device1 ON device_combinations(device_1_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_combinations_device2 ON device_combinations(device_2_id) WHERE is_active = TRUE;
```

#### Type Definitions

```typescript
export interface DeviceAssignment {
  id: number
  electronic_device_id: number
  classroom_id: number
  assigned_date: string
  removed_date?: string
  assigned_by?: number
  removed_by?: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DeviceAssignmentWithDetails extends DeviceAssignment {
  device: ElectronicDeviceWithDetails
  classroom: Classroom
  assigned_by_user?: User
  removed_by_user?: User
}

export interface DeviceCombination {
  id: number
  device_1_id: number
  device_2_id: number
  combination_type?: string
  created_date: string
  created_by?: number
  removed_date?: string
  removed_by?: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface DeviceCombinationWithDetails extends DeviceCombination {
  device_1: ElectronicDeviceWithDetails
  device_2: ElectronicDeviceWithDetails
  created_by_user?: User
  removed_by_user?: User
}

export interface CreateDeviceAssignmentInput {
  electronic_device_id: number
  classroom_id: number
  notes?: string
}

export interface CreateDeviceCombinationInput {
  device_1_id: number
  device_2_id: number
  combination_type?: string
  notes?: string
}
```

#### API Endpoints

**Device Assignments:**
- `GET /api/admin/device-assignments` - List all assignments (with filters)
- `POST /api/admin/device-assignments` - Create new assignment
- `GET /api/admin/device-assignments/[id]` - Get assignment details
- `DELETE /api/admin/device-assignments/[id]` - Remove assignment (soft delete)
- `GET /api/admin/device-assignments/by-classroom/[classroomId]` - Get assignments for a classroom
- `GET /api/admin/device-assignments/by-device/[deviceId]` - Get assignment history for a device

**Device Combinations:**
- `GET /api/admin/device-combinations` - List all combinations
- `POST /api/admin/device-combinations` - Create new combination
- `GET /api/admin/device-combinations/[id]` - Get combination details
- `DELETE /api/admin/device-combinations/[id]` - Remove combination (soft delete)
- `GET /api/admin/device-combinations/by-classroom/[classroomId]` - Get combinations in a classroom

## Data Models

### Memory Capacity Validation

```typescript
export function validateMemoryCapacity(
  capacity?: number,
  unit?: 'GB' | 'TB'
): ValidationResult {
  const errors: ValidationError[] = []
  
  if (capacity !== undefined) {
    if (capacity <= 0) {
      errors.push({
        field: 'memory_capacity',
        message: 'La capacidad de memoria debe ser mayor que 0',
        code: 'INVALID_VALUE'
      })
    }
    
    if (capacity > 10000) {
      errors.push({
        field: 'memory_capacity',
        message: 'La capacidad de memoria es demasiado grande',
        code: 'INVALID_VALUE'
      })
    }
    
    if (!unit) {
      errors.push({
        field: 'memory_unit',
        message: 'La unidad de memoria es requerida cuando se especifica capacidad',
        code: 'REQUIRED_FIELD'
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### Classroom Validation

```typescript
export function validateClassroomInput(
  input: Record<string, unknown>
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Validate name
  if (!input.name || typeof input.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'El nombre es requerido',
      code: 'REQUIRED_FIELD'
    })
  } else if (input.name.length < 1 || input.name.length > 255) {
    errors.push({
      field: 'name',
      message: 'El nombre debe tener entre 1 y 255 caracteres',
      code: 'INVALID_LENGTH'
    })
  }
  
  // Validate location
  if (!input.location || typeof input.location !== 'string') {
    errors.push({
      field: 'location',
      message: 'La localidad es requerida',
      code: 'REQUIRED_FIELD'
    })
  } else if (input.location.length < 1 || input.location.length > 255) {
    errors.push({
      field: 'location',
      message: 'La localidad debe tener entre 1 y 255 caracteres',
      code: 'INVALID_LENGTH'
    })
  }
  
  // Validate status
  const validStatuses = ['active', 'inactive', 'maintenance']
  if (!input.status || !validStatuses.includes(input.status as string)) {
    errors.push({
      field: 'status',
      message: 'El estatus debe ser: active, inactive, o maintenance',
      code: 'INVALID_VALUE'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### Device Assignment Validation

```typescript
export function validateDeviceAssignment(
  deviceId: number,
  classroomId: number,
  existingAssignments: DeviceAssignment[]
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Check if device already has an active assignment
  const activeAssignment = existingAssignments.find(
    a => a.electronic_device_id === deviceId && a.is_active
  )
  
  if (activeAssignment) {
    errors.push({
      field: 'electronic_device_id',
      message: 'El dispositivo ya está asignado a un aula',
      code: 'ALREADY_ASSIGNED'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function validateDeviceCombination(
  device1Id: number,
  device2Id: number,
  assignments: DeviceAssignment[]
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  
  // Check if both devices are in the same classroom
  const device1Assignment = assignments.find(
    a => a.electronic_device_id === device1Id && a.is_active
  )
  const device2Assignment = assignments.find(
    a => a.electronic_device_id === device2Id && a.is_active
  )
  
  if (!device1Assignment) {
    errors.push({
      field: 'device_1_id',
      message: 'El primer dispositivo debe estar asignado a un aula',
      code: 'NOT_ASSIGNED'
    })
  }
  
  if (!device2Assignment) {
    errors.push({
      field: 'device_2_id',
      message: 'El segundo dispositivo debe estar asignado a un aula',
      code: 'NOT_ASSIGNED'
    })
  }
  
  if (device1Assignment && device2Assignment) {
    if (device1Assignment.classroom_id !== device2Assignment.classroom_id) {
      errors.push({
        field: 'devices',
        message: 'Ambos dispositivos deben estar en la misma aula',
        code: 'DIFFERENT_CLASSROOMS'
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Memory field availability matches device category
*For any* electronic device, the memory capacity field should be available if and only if the device category is Laptops, Tablets, or Smartphones
**Validates: Requirements 1.1, 1.5**

### Property 2: Memory capacity validation accepts valid inputs
*For any* positive numeric value with a valid unit (GB or TB), the system should accept the memory capacity input
**Validates: Requirements 1.2**

### Property 3: Memory capacity display includes recorded values
*For any* electronic device with memory capacity set, displaying the device details should include the memory capacity information
**Validates: Requirements 1.3**

### Property 4: Memory capacity formatting is consistent
*For any* device with memory capacity, the formatted display should match the pattern "{number} {unit}" (e.g., "16 GB", "1 TB")
**Validates: Requirements 1.4**

### Property 5: Edit action availability
*For any* list of electronic devices, each device should have an accessible edit action
**Validates: Requirements 2.1**

### Property 6: Edit modal initialization
*For any* electronic device, opening the edit modal should pre-fill all fields with the device's current values
**Validates: Requirements 2.2, 2.3**

### Property 7: Edit validation prevents invalid submissions
*For any* invalid device data, the edit modal should prevent submission and display validation errors
**Validates: Requirements 2.4**

### Property 8: Successful edit updates and closes
*For any* valid device update, submitting should update the device in the database and close the modal
**Validates: Requirements 2.5**

### Property 9: Cancel discards changes
*For any* changes made in the edit modal, canceling should not persist any modifications to the device
**Validates: Requirements 2.6**

### Property 10: List refresh after update
*For any* successful device update, the device list should reflect the new values
**Validates: Requirements 2.7**

### Property 11: Classroom list completeness
*For any* set of classrooms in the database, the classroom management page should display all of them
**Validates: Requirements 3.1**

### Property 12: Classroom creation requires all fields
*For any* classroom creation attempt without name, location, or status, the system should reject it with validation errors
**Validates: Requirements 3.2**

### Property 13: Classroom name uniqueness per location
*For any* location, attempting to create two classrooms with the same name should fail with a uniqueness error
**Validates: Requirements 3.3**

### Property 14: Classroom update capability
*For any* classroom, updating its name, location, or status should persist the changes
**Validates: Requirements 3.4**

### Property 15: Deletion check for assigned devices
*For any* classroom deletion attempt, the system should first check if devices are assigned to it
**Validates: Requirements 3.5**

### Property 16: Deletion prevention with assignments
*For any* classroom with at least one assigned device, deletion should fail with an error message
**Validates: Requirements 3.6**

### Property 17: Deletion success without assignments
*For any* classroom with no assigned devices, deletion should succeed after confirmation
**Validates: Requirements 3.7**

### Property 18: Classroom display completeness
*For any* classroom, the display should include name, location, status, and assigned device count
**Validates: Requirements 3.8**

### Property 19: Assignment page data loading
*For any* access to the device assignment page, both available classrooms and unassigned devices should be displayed
**Validates: Requirements 4.1**

### Property 20: Classroom selection filtering
*For any* classroom selection, the system should display only devices assigned to that specific classroom
**Validates: Requirements 4.2**

### Property 21: Device assignment creates record
*For any* device and classroom, creating an assignment should result in a database record linking them
**Validates: Requirements 4.3**

### Property 22: Assignment removal deletes record
*For any* active device assignment, removing it should delete or deactivate the assignment record
**Validates: Requirements 4.4**

### Property 23: Device combination creates link
*For any* two devices in the same classroom, creating a combination should result in a database record linking them
**Validates: Requirements 4.5**

### Property 24: Combination validation requires same classroom
*For any* two devices in different classrooms, attempting to create a combination should fail with a validation error
**Validates: Requirements 4.6**

### Property 25: Combination display shows relationship
*For any* device combination, the display should show both devices with a visual indicator of their pairing
**Validates: Requirements 4.7**

### Property 26: Combination removal preserves assignments
*For any* device combination, removing it should delete the combination record while keeping both devices assigned to their classroom
**Validates: Requirements 4.8**

### Property 27: Assignment updates device status
*For any* device assignment, the device should reflect its assigned location in its status or metadata
**Validates: Requirements 4.9**

### Property 28: Assignment filtering works correctly
*For any* filter combination (classroom, device type, assignment status), the results should match all filter criteria
**Validates: Requirements 4.10**

### Property 29: Assignment audit trail completeness
*For any* device assignment, the record should include assignment date and the administrator who created it
**Validates: Requirements 5.1**

### Property 30: Removal preserves history
*For any* device assignment removal, the system should set the removal date while keeping the historical record
**Validates: Requirements 5.2**

### Property 31: Device history display
*For any* device, viewing its details should show both current assignment and complete assignment history
**Validates: Requirements 5.3**

### Property 32: Classroom history display
*For any* classroom, viewing its details should show both current and historical device assignments
**Validates: Requirements 5.4**

### Property 33: History record completeness
*For any* historical assignment, the display should include assignment date, removal date (if applicable), classroom, and administrator
**Validates: Requirements 5.5**

### Property 34: Report includes all classrooms
*For any* classroom equipment report request, the generated report should include all classrooms with their device summaries
**Validates: Requirements 6.1**

### Property 35: Report category breakdown
*For any* classroom in the report, device counts should be broken down by category
**Validates: Requirements 6.2**

### Property 36: Report identifies incomplete workstations
*For any* classroom with devices that should be paired but aren't, the report should flag them as incomplete workstations
**Validates: Requirements 6.3**

### Property 37: Report calculates equipment value
*For any* classroom where devices have assigned values, the report should calculate and display the total equipment value
**Validates: Requirements 6.4**

## Error Handling

### API Error Responses

All API endpoints will follow a consistent error response format:

```typescript
interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - User not authenticated
- `AUTHORIZATION_ERROR` - User lacks required permissions
- `NOT_FOUND` - Resource not found
- `ALREADY_ASSIGNED` - Device already assigned to a classroom
- `DIFFERENT_CLASSROOMS` - Devices in different classrooms cannot be combined
- `HAS_ASSIGNED_DEVICES` - Classroom cannot be deleted because it has assigned devices
- `DUPLICATE_NAME` - Classroom name already exists in the location
- `DATABASE_ERROR` - Database operation failed

### Error Handling Strategies

1. **Validation Errors**: Return 400 with detailed field-level errors
2. **Authentication Errors**: Return 401 and redirect to login
3. **Authorization Errors**: Return 403 with permission requirements
4. **Not Found Errors**: Return 404 with resource information
5. **Constraint Violations**: Return 409 with conflict details
6. **Database Errors**: Return 500 with generic message (log details server-side)

### Client-Side Error Handling

```typescript
try {
  const response = await fetch('/api/admin/classrooms', {
    method: 'POST',
    body: JSON.stringify(classroomData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    
    if (error.error.code === 'VALIDATION_ERROR') {
      // Display field-level errors
      setFieldErrors(error.error.details)
    } else if (error.error.code === 'DUPLICATE_NAME') {
      // Show duplicate name error
      toast.error('Ya existe un aula con ese nombre en esta localidad')
    } else {
      // Generic error
      toast.error(error.error.message)
    }
    return
  }
  
  // Success handling
  const data = await response.json()
  toast.success('Aula creada exitosamente')
  onSuccess(data.data)
} catch (error) {
  // Network or unexpected errors
  toast.error('Error de conexión. Por favor intente nuevamente.')
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality and edge cases:

1. **Validation Functions**
   - Test memory capacity validation with valid/invalid inputs
   - Test classroom input validation with missing/invalid fields
   - Test assignment validation with various scenarios
   - Test combination validation with same/different classrooms

2. **API Endpoints**
   - Test successful CRUD operations
   - Test error responses for invalid inputs
   - Test authentication/authorization checks
   - Test constraint violations (uniqueness, foreign keys)

3. **Component Behavior**
   - Test edit modal opening/closing
   - Test form field initialization
   - Test form submission and cancellation
   - Test list filtering and sorting

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using **fast-check** (JavaScript/TypeScript property testing library):

**Configuration**: Each property test will run a minimum of 100 iterations to ensure thorough coverage.

**Test Tagging**: Each property-based test will include a comment explicitly referencing the correctness property from this design document using the format: `**Feature: electronics-enhancements, Property {number}: {property_text}**`

**Property Test Examples**:

1. **Memory Capacity Validation Property**
   - Generate random device categories and memory values
   - Verify memory field availability matches category rules
   - Verify valid inputs are accepted and invalid inputs are rejected

2. **Classroom Uniqueness Property**
   - Generate random classroom names and locations
   - Verify duplicate name+location combinations are rejected
   - Verify unique combinations are accepted

3. **Assignment Validation Property**
   - Generate random device and classroom assignments
   - Verify devices can only have one active assignment
   - Verify assignment removal properly deactivates records

4. **Combination Validation Property**
   - Generate random device pairs and classroom assignments
   - Verify combinations only work for devices in same classroom
   - Verify combination removal preserves assignments

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Assignment Workflow**
   - Create classroom → Assign device → Verify assignment → Remove assignment → Verify history

2. **Device Combination Workflow**
   - Create classroom → Assign two devices → Combine devices → Verify combination → Remove combination

3. **Classroom Deletion Workflow**
   - Create classroom → Attempt deletion (should succeed) → Assign device → Attempt deletion (should fail)

4. **Edit Modal Workflow**
   - Open edit modal → Modify fields → Submit → Verify update → Verify list refresh

### Test Data Generation

For property-based tests, we'll use generators for:

```typescript
// Device category generator
const deviceCategoryArb = fc.constantFrom(
  'Laptops', 'Tablets', 'Smartphones', 'Periféricos', 'Digitales', 'Otros'
)

// Memory capacity generator
const memoryCapacityArb = fc.record({
  capacity: fc.float({ min: 0.1, max: 2048, noNaN: true }),
  unit: fc.constantFrom('GB', 'TB')
})

// Classroom generator
const classroomArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  location: fc.string({ minLength: 1, maxLength: 255 }),
  status: fc.constantFrom('active', 'inactive', 'maintenance')
})

// Device assignment generator
const deviceAssignmentArb = fc.record({
  electronic_device_id: fc.integer({ min: 1, max: 1000 }),
  classroom_id: fc.integer({ min: 1, max: 100 }),
  notes: fc.option(fc.string({ maxLength: 500 }))
})
```

## Performance Considerations

### Database Optimization

1. **Indexes**: Create indexes on frequently queried columns
   - `classrooms(status, location)`
   - `device_assignments(classroom_id, is_active)`
   - `device_assignments(electronic_device_id, is_active)`
   - `device_combinations(device_1_id, device_2_id, is_active)`

2. **Query Optimization**
   - Use selective queries with WHERE clauses
   - Limit JOIN depth to avoid N+1 queries
   - Use pagination for large result sets

3. **Soft Deletes**: Use `is_active` flag instead of hard deletes to preserve history

### Caching Strategy

1. **Classroom List**: Cache for 5 minutes (low change frequency)
2. **Device Assignments**: Cache for 1 minute (moderate change frequency)
3. **Device Combinations**: Cache for 1 minute (moderate change frequency)
4. **Invalidation**: Clear cache on create/update/delete operations

### UI Performance

1. **Lazy Loading**: Load assignment history on demand
2. **Pagination**: Paginate device and classroom lists
3. **Debouncing**: Debounce search inputs (300ms)
4. **Optimistic Updates**: Update UI immediately, rollback on error

## Security Considerations

### Authentication & Authorization

- All endpoints require admin authentication
- Use JWT token validation via `withPermission` middleware
- Require `PERMISSIONS.ADMIN_MANAGE_TOOLS` permission
- Audit all create/update/delete operations

### Input Validation

- Validate all inputs server-side (never trust client)
- Sanitize string inputs to prevent SQL injection
- Validate numeric ranges for memory capacity
- Enforce uniqueness constraints at database level

### Data Integrity

- Use foreign key constraints to maintain referential integrity
- Use CHECK constraints for enum values
- Use UNIQUE constraints for business rules
- Use transactions for multi-step operations

## Migration Strategy

### Database Migrations

1. **Migration 1**: Add memory capacity columns to `electronic_devices`
2. **Migration 2**: Create `classrooms` table
3. **Migration 3**: Create `device_assignments` table
4. **Migration 4**: Create `device_combinations` table
5. **Migration 5**: Add indexes for performance

### Rollback Plan

Each migration will include a rollback script:
- Drop new tables in reverse order
- Remove new columns
- Drop new indexes

### Data Migration

No data migration needed as these are new features. Existing electronic devices will have NULL memory capacity (optional field).

## Deployment Considerations

### Feature Flags

Consider using feature flags for gradual rollout:
- `ENABLE_MEMORY_CAPACITY` - Enable memory tracking
- `ENABLE_CLASSROOM_MANAGEMENT` - Enable classroom features
- `ENABLE_DEVICE_ASSIGNMENTS` - Enable assignment features

### Monitoring

Monitor key metrics:
- API response times for new endpoints
- Database query performance
- Error rates for validation failures
- User adoption of new features

### Documentation

Update user documentation:
- How to add memory capacity to devices
- How to manage classrooms
- How to assign devices to classrooms
- How to combine devices
- How to generate equipment reports
