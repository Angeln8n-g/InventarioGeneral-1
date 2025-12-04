# Design Document

## Overview

This design document outlines the architecture and implementation approach for creating a dynamic category management system for electronic devices. The system will allow administrators to create, edit, and delete device categories, configure category-specific fields, and manage custom fields. This replaces the current hardcoded category system with a flexible, database-driven approach.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Category    │  │    Field     │  │   Device     │      │
│  │ Management   │  │Configuration │  │Dynamic Forms │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Categories   │  │    Fields    │  │  Migration   │      │
│  │     API      │  │     API      │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Category    │  │    Field     │  │  Migration   │      │
│  │ Operations   │  │  Operations  │  │  Operations  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   device_    │  │   category_  │  │   device_    │      │
│  │  categories  │  │    fields    │  │custom_fields │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Category Management Flow**: Admin creates category → API validates → Database stores → UI updates
2. **Field Configuration Flow**: Admin configures fields → API validates → Database stores → Forms adapt
3. **Dynamic Form Flow**: User selects category → Form loads field config → Shows/hides fields → Validates based on config
4. **Migration Flow**: Admin selects categories → System analyzes compatibility → Migrates devices → Logs actions

## Components and Interfaces

### 1. Device Categories

#### Database Schema

```sql
CREATE TABLE device_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_device_categories_name ON device_categories(LOWER(name));
CREATE INDEX idx_device_categories_active ON device_categories(is_active);
```

#### Type Definitions

```typescript
export interface DeviceCategory {
  id: number
  name: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
  version: number
}

export interface DeviceCategoryWithCount extends DeviceCategory {
  device_count: number
}

export interface CreateDeviceCategoryInput {
  name: string
  description?: string
  icon?: string
}

export interface UpdateDeviceCategoryInput {
  name?: string
  description?: string
  icon?: string
  is_active?: boolean
}
```

### 2. Category Fields Configuration

#### Database Schema

```sql
CREATE TABLE category_fields (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES device_categories(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'boolean')),
  is_required BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  options JSONB,
  validation_rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, field_name)
);

CREATE INDEX idx_category_fields_category ON category_fields(category_id);
CREATE INDEX idx_category_fields_custom ON category_fields(is_custom);
```

#### Type Definitions

```typescript
export interface CategoryField {
  id: number
  category_id: number
  field_name: string
  field_type: 'text' | 'number' | 'select' | 'boolean'
  is_required: boolean
  is_custom: boolean
  display_order: number
  options?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CreateCategoryFieldInput {
  category_id: number
  field_name: string
  field_type: 'text' | 'number' | 'select' | 'boolean'
  is_required?: boolean
  is_custom?: boolean
  display_order?: number
  options?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
}

export interface UpdateCategoryFieldInput {
  field_name?: string
  field_type?: 'text' | 'number' | 'select' | 'boolean'
  is_required?: boolean
  display_order?: number
  options?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
}
```

### 3. Device Custom Fields

#### Database Schema

```sql
CREATE TABLE device_custom_fields (
  id SERIAL PRIMARY KEY,
  electronic_device_id INTEGER NOT NULL REFERENCES electronic_devices(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES category_fields(id) ON DELETE CASCADE,
  field_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(electronic_device_id, field_id)
);

CREATE INDEX idx_device_custom_fields_device ON device_custom_fields(electronic_device_id);
CREATE INDEX idx_device_custom_fields_field ON device_custom_fields(field_id);
```

#### Type Definitions

```typescript
export interface DeviceCustomField {
  id: number
  electronic_device_id: number
  field_id: number
  field_value: unknown
  created_at: string
  updated_at: string
}

export interface DeviceCustomFieldWithDetails extends DeviceCustomField {
  field: CategoryField
}

export interface CreateDeviceCustomFieldInput {
  electronic_device_id: number
  field_id: number
  field_value: unknown
}

export interface UpdateDeviceCustomFieldInput {
  field_value: unknown
}
```

## Data Models

### Category Validation

```typescript
export function validateCategoryInput(
  input: Record<string, unknown>,
  existingCategories: DeviceCategory[]
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Validate name
  if (!input.name || typeof input.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'El nombre es requerido',
      code: 'REQUIRED_FIELD'
    })
  } else {
    if (input.name.length < 1 || input.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'El nombre debe tener entre 1 y 255 caracteres',
        code: 'INVALID_LENGTH'
      })
    }
    
    // Check uniqueness (case-insensitive)
    const duplicate = existingCategories.find(
      c => c.name.toLowerCase() === (input.name as string).toLowerCase() &&
           c.id !== input.id
    )
    if (duplicate) {
      errors.push({
        field: 'name',
        message: 'Ya existe una categoría con este nombre',
        code: 'DUPLICATE_NAME'
      })
    }
  }
  
  // Validate icon (optional)
  if (input.icon && typeof input.icon === 'string') {
    if (input.icon.length > 100) {
      errors.push({
        field: 'icon',
        message: 'El icono no puede exceder 100 caracteres',
        code: 'INVALID_LENGTH'
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### Field Configuration Validation

```typescript
export function validateFieldConfiguration(
  input: Record<string, unknown>,
  existingFields: CategoryField[]
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Validate field_name
  if (!input.field_name || typeof input.field_name !== 'string') {
    errors.push({
      field: 'field_name',
      message: 'El nombre del campo es requerido',
      code: 'REQUIRED_FIELD'
    })
  } else {
    if (input.field_name.length < 1 || input.field_name.length > 255) {
      errors.push({
        field: 'field_name',
        message: 'El nombre del campo debe tener entre 1 y 255 caracteres',
        code: 'INVALID_LENGTH'
      })
    }
    
    // Check uniqueness within category
    const duplicate = existingFields.find(
      f => f.field_name === input.field_name &&
           f.category_id === input.category_id &&
           f.id !== input.id
    )
    if (duplicate) {
      errors.push({
        field: 'field_name',
        message: 'Ya existe un campo con este nombre en esta categoría',
        code: 'DUPLICATE_FIELD_NAME'
      })
    }
  }
  
  // Validate field_type
  const validTypes = ['text', 'number', 'select', 'boolean']
  if (!input.field_type || !validTypes.includes(input.field_type as string)) {
    errors.push({
      field: 'field_type',
      message: 'El tipo de campo debe ser: text, number, select, o boolean',
      code: 'INVALID_FIELD_TYPE'
    })
  }
  
  // Validate options for select type
  if (input.field_type === 'select') {
    if (!input.options || typeof input.options !== 'object') {
      errors.push({
        field: 'options',
        message: 'Los campos de tipo select requieren opciones',
        code: 'REQUIRED_OPTIONS'
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### Dynamic Form Field Resolution

```typescript
export function resolveFieldsForCategory(
  categoryId: number,
  categoryFields: CategoryField[]
): ResolvedField[] {
  const fields = categoryFields.filter(f => f.category_id === categoryId)
  
  return fields
    .sort((a, b) => a.display_order - b.display_order)
    .map(field => ({
      name: field.field_name,
      type: field.field_type,
      required: field.is_required,
      custom: field.is_custom,
      options: field.options,
      validation: field.validation_rules
    }))
}

export function validateDeviceAgainstCategory(
  deviceData: Record<string, unknown>,
  categoryFields: CategoryField[]
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Check required fields
  const requiredFields = categoryFields.filter(f => f.is_required)
  for (const field of requiredFields) {
    if (!deviceData[field.field_name]) {
      errors.push({
        field: field.field_name,
        message: `El campo ${field.field_name} es requerido para esta categoría`,
        code: 'REQUIRED_FIELD'
      })
    }
  }
  
  // Validate field types
  for (const field of categoryFields) {
    const value = deviceData[field.field_name]
    if (value !== undefined && value !== null) {
      if (field.field_type === 'number' && typeof value !== 'number') {
        errors.push({
          field: field.field_name,
          message: `El campo ${field.field_name} debe ser un número`,
          code: 'INVALID_TYPE'
        })
      }
      if (field.field_type === 'boolean' && typeof value !== 'boolean') {
        errors.push({
          field: field.field_name,
          message: `El campo ${field.field_name} debe ser verdadero o falso`,
          code: 'INVALID_TYPE'
        })
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### Category Migration

```typescript
export interface MigrationAnalysis {
  compatibleFields: string[]
  incompatibleFields: string[]
  devicesToMigrate: number
}

export function analyzeCategoryMigration(
  sourceCategory: DeviceCategory,
  targetCategory: DeviceCategory,
  sourceFields: CategoryField[],
  targetFields: CategoryField[]
): MigrationAnalysis {
  const sourceFieldNames = new Set(sourceFields.map(f => f.field_name))
  const targetFieldNames = new Set(targetFields.map(f => f.field_name))
  
  const compatibleFields = sourceFields
    .filter(f => targetFieldNames.has(f.field_name))
    .map(f => f.field_name)
  
  const incompatibleFields = sourceFields
    .filter(f => !targetFieldNames.has(f.field_name))
    .map(f => f.field_name)
  
  return {
    compatibleFields,
    incompatibleFields,
    devicesToMigrate: 0 // Will be populated from database query
  }
}

export async function migrateDeviceCategory(
  deviceId: number,
  targetCategoryId: number,
  fieldMapping: Record<string, unknown>
): Promise<void> {
  // Update device category
  // Preserve compatible field values
  // Clear incompatible field values
  // Log migration action
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Category list completeness
*For any* set of categories in the database, the category management page should display all of them
**Validates: Requirements 1.1**

### Property 2: Category name uniqueness validation
*For any* category creation attempt, the system should reject duplicate names (case-insensitive)
**Validates: Requirements 1.2, 1.3**

### Property 3: Category availability after creation
*For any* successfully created category, it should immediately appear in device form category selectors
**Validates: Requirements 1.4**

### Property 4: Category display completeness
*For any* category, the display should include name, description, icon, and device count
**Validates: Requirements 1.5**

### Property 5: Edit form initialization
*For any* category, opening the edit form should pre-fill all fields with current values
**Validates: Requirements 2.1**

### Property 6: Update validation
*For any* category update with invalid data, the system should reject it with validation errors
**Validates: Requirements 2.2**

### Property 7: Name uniqueness on update
*For any* category name change, the system should ensure the new name is unique
**Validates: Requirements 2.3**

### Property 8: Update propagation to devices
*For any* category update, all devices using that category should reflect the changes
**Validates: Requirements 2.4**

### Property 9: List refresh after update
*For any* successful category update, the category list should immediately reflect the changes
**Validates: Requirements 2.5**

### Property 10: Deletion validation check
*For any* category deletion attempt, the system should check if devices are using it
**Validates: Requirements 3.1**

### Property 11: Deletion prevention with devices
*For any* category with at least one device, deletion should fail with an error message
**Validates: Requirements 3.2**

### Property 12: Deletion success without devices
*For any* category with no devices, deletion should succeed after confirmation
**Validates: Requirements 3.3**

### Property 13: Removal from selection lists
*For any* deleted category, it should no longer appear in device form category selectors
**Validates: Requirements 3.4**

### Property 14: Removal from category list
*For any* deleted category, it should no longer appear in the category management list
**Validates: Requirements 3.5**

### Property 15: Field configuration persistence
*For any* field configuration, the settings should be saved and retrievable
**Validates: Requirements 4.1**

### Property 16: Field type support
*For any* field type (text, number, select, boolean), the system should support it correctly
**Validates: Requirements 4.2**

### Property 17: Required field validation enforcement
*For any* field marked as required, the system should prevent device creation/editing without it
**Validates: Requirements 4.3**

### Property 18: Optional field flexibility
*For any* field marked as optional, devices should be saveable without providing a value
**Validates: Requirements 4.4**

### Property 19: Field visibility based on applicability
*For any* field not applicable to a category, it should be hidden in device forms for that category
**Validates: Requirements 4.5**

### Property 20: Custom field creation validation
*For any* custom field creation, the system should require name, type, and applicability
**Validates: Requirements 5.1**

### Property 21: Custom field name uniqueness
*For any* custom field within a category, the field name should be unique
**Validates: Requirements 5.2**

### Property 22: Custom field display in forms
*For any* category with custom fields, those fields should appear in device forms
**Validates: Requirements 5.3**

### Property 23: Custom field value persistence
*For any* device with custom field values, those values should be stored and retrievable
**Validates: Requirements 5.4**

### Property 24: Custom field display in details
*For any* device with custom fields, those fields should appear alongside standard fields
**Validates: Requirements 5.5**

### Property 25: Category icon display in lists
*For any* device in a list, its category icon should be displayed
**Validates: Requirements 6.3**

### Property 26: Category icon display in details
*For any* device details view, the category icon should be prominently displayed
**Validates: Requirements 6.4**

### Property 27: Default icon fallback
*For any* category without a selected icon, a default icon should be used
**Validates: Requirements 6.5**

### Property 28: Dynamic field visibility
*For any* category selection in a device form, fields should show/hide based on configuration
**Validates: Requirements 7.1**

### Property 29: Required field validation
*For any* form submission with missing required fields, the system should prevent submission
**Validates: Requirements 7.2**

### Property 30: Optional field submission
*For any* form submission with empty optional fields, the system should allow it
**Validates: Requirements 7.3**

### Property 31: Field value preservation on category change
*For any* category change in an edit form, compatible field values should be preserved
**Validates: Requirements 7.4**

### Property 32: Validation error clarity
*For any* validation error, the message should clearly indicate which fields are required
**Validates: Requirements 7.5**

### Property 33: Migration device display
*For any* category migration, all devices in the source category should be displayed
**Validates: Requirements 8.1**

### Property 34: Field compatibility analysis
*For any* target category selection, the system should show which fields are compatible
**Validates: Requirements 8.2**

### Property 35: Compatible field preservation
*For any* device migration, all compatible field values should be preserved
**Validates: Requirements 8.3**

### Property 36: Incompatible field handling
*For any* device migration with incompatible fields, those fields should be cleared or prompt for values
**Validates: Requirements 8.4**

### Property 37: Migration completion and logging
*For any* completed migration, all devices should be updated and the action should be logged
**Validates: Requirements 8.5**

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
- `DUPLICATE_NAME` - Category name already exists
- `DUPLICATE_FIELD_NAME` - Field name already exists in category
- `CATEGORY_IN_USE` - Category cannot be deleted because devices use it
- `INVALID_FIELD_TYPE` - Field type is not supported
- `REQUIRED_OPTIONS` - Select field requires options
- `INCOMPATIBLE_MIGRATION` - Migration would lose data
- `NOT_FOUND` - Resource not found
- `DATABASE_ERROR` - Database operation failed

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality:

1. **Validation Functions**
   - Test category name uniqueness (case-insensitive)
   - Test field configuration validation
   - Test custom field validation
   - Test migration analysis

2. **API Endpoints**
   - Test CRUD operations for categories
   - Test CRUD operations for fields
   - Test migration endpoints
   - Test error responses

3. **Component Behavior**
   - Test dynamic form field rendering
   - Test field visibility based on category
   - Test validation enforcement

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check**:

**Configuration**: Each property test will run a minimum of 100 iterations.

**Test Tagging**: Each property-based test will include: `**Feature: dynamic-device-categories, Property {number}: {property_text}**`

**Property Test Examples**:

1. **Category Uniqueness Property**
   - Generate random category names with various cases
   - Verify duplicates are rejected
   - Verify unique names are accepted

2. **Field Configuration Property**
   - Generate random field configurations
   - Verify required fields are enforced
   - Verify optional fields allow empty values

3. **Dynamic Form Property**
   - Generate random category selections
   - Verify fields show/hide correctly
   - Verify validation matches configuration

4. **Migration Property**
   - Generate random category pairs
   - Verify compatible fields are preserved
   - Verify incompatible fields are handled

## Performance Considerations

### Database Optimization

1. **Indexes**: Create indexes on frequently queried columns
   - `device_categories(LOWER(name))`
   - `category_fields(category_id)`
   - `device_custom_fields(electronic_device_id, field_id)`

2. **Query Optimization**
   - Cache category configurations
   - Use JOINs efficiently
   - Paginate large result sets

### Caching Strategy

1. **Category List**: Cache for 10 minutes
2. **Field Configurations**: Cache for 5 minutes
3. **Invalidation**: Clear cache on create/update/delete

## Security Considerations

### Authentication & Authorization

- All endpoints require admin authentication
- Use JWT token validation
- Require `PERMISSIONS.ADMIN_MANAGE_CATEGORIES` permission
- Audit all operations

### Input Validation

- Validate all inputs server-side
- Sanitize string inputs
- Validate field types and values
- Prevent SQL injection

## Migration Strategy

### Migrating Existing Hardcoded Categories

1. Create migration script to populate `device_categories` table with existing categories
2. Create default field configurations for each category
3. Update existing devices to reference new category IDs
4. Update application code to use dynamic categories
5. Remove hardcoded category definitions

```sql
-- Migration script example
INSERT INTO device_categories (name, description, icon) VALUES
  ('Laptops', 'Computadoras portátiles', 'laptop'),
  ('Tablets', 'Tabletas', 'tablet'),
  ('Smartphones', 'Teléfonos inteligentes', 'smartphone'),
  ('Periféricos', 'Dispositivos periféricos', 'keyboard'),
  ('Digitales', 'Dispositivos digitales', 'camera'),
  ('Otros', 'Otros dispositivos', 'device');

-- Create default field configurations
INSERT INTO category_fields (category_id, field_name, field_type, is_required) 
SELECT id, 'memory_capacity', 'number', false FROM device_categories WHERE name IN ('Laptops', 'Tablets', 'Smartphones');

INSERT INTO category_fields (category_id, field_name, field_type, is_required)
SELECT id, 'memory_unit', 'select', false FROM device_categories WHERE name IN ('Laptops', 'Tablets', 'Smartphones');
```
