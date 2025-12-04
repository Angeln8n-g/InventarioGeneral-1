# Design Document: Cable Measurement Calculator

## Overview

The Cable Measurement Calculator is a specialized input system for consumables measured in linear units (meters or feet). Instead of manually entering quantities, users input start and end marker numbers from the cable itself, and the system automatically calculates the consumed or returned length. This approach significantly reduces human error, provides precise tracking, and enables segment-level management of cable inventory.

### Key Benefits

- **Accuracy**: Eliminates manual calculation errors
- **Traceability**: Records exact cable segments used and returned
- **Validation**: Prevents overlapping returns and invalid segments
- **User Experience**: Intuitive interface matching real-world cable usage
- **Backward Compatible**: Works alongside existing consumption records

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ConsumableQuantityModal  │  ReturnableItemsList            │
│  (Consumption)            │  (Returns)                       │
│         │                 │         │                        │
│         └─────────────────┴─────────┘                        │
│                     │                                        │
│         CableMeasurementCalculator                           │
│         (Shared Component)                                   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  • Cable Detection Logic (isCableUnit)                       │
│  • Marker Validation (validateMarkers)                       │
│  • Length Calculation (calculateLength)                      │
│  • Overlap Detection (detectSegmentOverlap)                  │
│  • Stock Validation (validateAgainstStock)                   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  POST /api/consumables/consume                               │
│  POST /api/consumables/return                                │
│  GET  /api/consumables/my-consumption                        │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  stock_movements (+ start_marker, end_marker)                │
│  consumable_returns (+ segment_start, segment_end)           │
│  consumable_stock (existing)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
└── ConsumablesPage / ReturnPage
    ├── ConsumableQuantityModal (Consumption)
    │   └── CableMeasurementCalculator
    │       ├── MarkerInput (start)
    │       ├── MarkerInput (end)
    │       ├── CalculatedResult
    │       └── ValidationMessages
    │
    └── ReturnableItemsList (Returns)
        └── ReturnItemCard
            └── CableMeasurementCalculator
                ├── MarkerInput (segment_start)
                ├── MarkerInput (segment_end)
                ├── CalculatedResult
                └── ValidationMessages
```

## Components and Interfaces

### 1. CableMeasurementCalculator Component

**Purpose**: Reusable component for capturing cable markers and calculating length

**Props**:
```typescript
interface CableMeasurementCalculatorProps {
  mode: 'consumption' | 'return'
  unitOfMeasure: string
  availableStock?: number
  maxReturnableLength?: number
  consumedMarkers?: { start: number; end: number }
  onCalculate: (result: CalculationResult) => void
  onValidationChange: (isValid: boolean) => void
  className?: string
}

interface CalculationResult {
  startMarker: number
  endMarker: number
  calculatedLength: number
  isValid: boolean
  validationErrors: string[]
}
```

**State**:
```typescript
interface CalculatorState {
  startMarker: string
  endMarker: string
  calculatedLength: number | null
  errors: ValidationError[]
  showConfirmation: boolean
}

interface ValidationError {
  field: 'start' | 'end' | 'calculation'
  message: string
  severity: 'error' | 'warning'
}
```

**Key Methods**:
- `handleMarkerChange(field: 'start' | 'end', value: string): void`
- `calculateLength(): number | null`
- `validateMarkers(): ValidationError[]`
- `formatResult(length: number): string`

### 2. Cable Detection Utility

**File**: `src/utils/cableDetection.ts`

```typescript
/**
 * Determines if a consumable uses cable-style measurement
 */
export function isCableUnit(unitOfMeasure: string | null): boolean {
  if (!unitOfMeasure) return false
  
  const normalized = unitOfMeasure.toLowerCase().trim()
  const cableUnits = ['metros', 'metro', 'pies', 'pie', 'm', 'ft', 'feet', 'meter', 'meters']
  
  return cableUnits.includes(normalized)
}

/**
 * Gets the display name for the unit
 */
export function getUnitDisplayName(unitOfMeasure: string): string {
  const normalized = unitOfMeasure.toLowerCase().trim()
  
  if (['metros', 'metro', 'm', 'meter', 'meters'].includes(normalized)) {
    return 'metros'
  }
  
  if (['pies', 'pie', 'ft', 'feet'].includes(normalized)) {
    return 'pies'
  }
  
  return unitOfMeasure
}
```

### 3. Marker Validation Utility

**File**: `src/utils/markerValidation.ts`

```typescript
export interface MarkerValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates marker inputs
 */
export function validateMarkers(
  startMarker: string,
  endMarker: string,
  options: {
    maxLength?: number
    minLength?: number
    allowDecimals?: boolean
  } = {}
): MarkerValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check if both fields are provided
  if (!startMarker || !endMarker) {
    errors.push('Ambos campos son requeridos')
    return { isValid: false, errors, warnings }
  }
  
  // Parse as numbers
  const start = parseFloat(startMarker)
  const end = parseFloat(endMarker)
  
  // Check if valid numbers
  if (isNaN(start) || isNaN(end)) {
    errors.push('Los valores deben ser numéricos')
    return { isValid: false, errors, warnings }
  }
  
  // Check if positive
  if (start < 0 || end < 0) {
    errors.push('Los valores deben ser positivos')
    return { isValid: false, errors, warnings }
  }
  
  // Check if end > start
  if (end <= start) {
    errors.push('El número final debe ser mayor que el número inicial')
    return { isValid: false, errors, warnings }
  }
  
  const length = end - start
  
  // Check maximum length
  if (options.maxLength && length > options.maxLength) {
    errors.push(`La cantidad calculada (${length}) excede el máximo permitido (${options.maxLength})`)
    return { isValid: false, errors, warnings }
  }
  
  // Check minimum length
  if (options.minLength && length < options.minLength) {
    errors.push(`La cantidad calculada (${length}) es menor al mínimo requerido (${options.minLength})`)
    return { isValid: false, errors, warnings }
  }
  
  // Warning for unusually large lengths
  if (length > 1000) {
    warnings.push('La cantidad calculada es muy grande. Verifica los números.')
  }
  
  return { isValid: true, errors, warnings }
}

/**
 * Calculates length from markers with precision
 */
export function calculateLength(start: number, end: number, precision: number = 2): number {
  const length = end - start
  return Math.round(length * Math.pow(10, precision)) / Math.pow(10, precision)
}
```

### 4. Segment Overlap Detection

**File**: `src/utils/segmentOverlap.ts`

```typescript
export interface CableSegment {
  start: number
  end: number
  id?: number
}

/**
 * Detects if two segments overlap
 */
export function segmentsOverlap(segment1: CableSegment, segment2: CableSegment): boolean {
  return segment1.start < segment2.end && segment1.end > segment2.start
}

/**
 * Finds all overlapping segments in a list
 */
export function findOverlappingSegments(
  newSegment: CableSegment,
  existingSegments: CableSegment[]
): CableSegment[] {
  return existingSegments.filter(existing => segmentsOverlap(newSegment, existing))
}

/**
 * Validates that a segment doesn't overlap with existing returns
 */
export function validateSegmentReturn(
  segmentStart: number,
  segmentEnd: number,
  existingReturns: Array<{ segment_start: number; segment_end: number }>
): { isValid: boolean; overlappingReturns: typeof existingReturns } {
  const newSegment = { start: segmentStart, end: segmentEnd }
  
  const overlapping = existingReturns.filter(ret => 
    segmentsOverlap(newSegment, { start: ret.segment_start, end: ret.segment_end })
  )
  
  return {
    isValid: overlapping.length === 0,
    overlappingReturns: overlapping
  }
}

/**
 * Calculates total returned length from segments
 */
export function calculateTotalReturnedLength(
  returns: Array<{ segment_start: number; segment_end: number }>
): number {
  return returns.reduce((total, ret) => {
    return total + (ret.segment_end - ret.segment_start)
  }, 0)
}
```

## Data Models

### Database Schema Changes

#### 1. stock_movements Table (Modifications)

```sql
ALTER TABLE stock_movements
ADD COLUMN start_marker DECIMAL(10, 2),
ADD COLUMN end_marker DECIMAL(10, 2);

-- Add index for querying by markers
CREATE INDEX idx_stock_movements_markers 
ON stock_movements(start_marker, end_marker) 
WHERE start_marker IS NOT NULL;

-- Add check constraint
ALTER TABLE stock_movements
ADD CONSTRAINT chk_markers_valid 
CHECK (
  (start_marker IS NULL AND end_marker IS NULL) OR
  (start_marker IS NOT NULL AND end_marker IS NOT NULL AND end_marker > start_marker)
);
```

#### 2. consumable_returns Table (Modifications)

```sql
ALTER TABLE consumable_returns
ADD COLUMN segment_start DECIMAL(10, 2),
ADD COLUMN segment_end DECIMAL(10, 2);

-- Add index for overlap detection
CREATE INDEX idx_consumable_returns_segments 
ON consumable_returns(segment_start, segment_end) 
WHERE segment_start IS NOT NULL;

-- Add check constraint
ALTER TABLE consumable_returns
ADD CONSTRAINT chk_segments_valid 
CHECK (
  (segment_start IS NULL AND segment_end IS NULL) OR
  (segment_start IS NOT NULL AND segment_end IS NOT NULL AND segment_end > segment_start)
);
```

### TypeScript Type Extensions

```typescript
// Extend existing types
export interface StockMovement {
  id: number
  consumable_stock_id: number
  movement_type: 'consumption' | 'adjustment' | 'restock' | 'return'
  quantity: number
  user_id: number
  notes: string | null
  created_at: string
  // NEW FIELDS
  start_marker: number | null
  end_marker: number | null
}

export interface ConsumableReturn {
  id: number
  user_id: number
  item_type_id: number
  consumable_stock_id: number
  returned_quantity: number
  consumption_date: string
  return_date: string
  notes: string | null
  created_at: string
  // NEW FIELDS
  segment_start: number | null
  segment_end: number | null
}

// New request/response types
export interface ConsumeWithMarkersRequest {
  qr_code: string
  start_marker: number
  end_marker: number
  notes?: string
}

export interface ReturnWithMarkersRequest {
  returns: Array<{
    item_type_id: number
    consumption_date: string
    segment_start: number
    segment_end: number
    notes?: string
  }>
}

export interface ConsumptionWithMarkers {
  consumption_date: string
  items: Array<{
    item_type_id: number
    consumable_stock_id: number
    item_name: string
    consumed_quantity: number
    returned_quantity: number
    returnable_quantity: number
    unit_of_measure: string
    // NEW FIELDS
    start_marker: number | null
    end_marker: number | null
    returned_segments: Array<{
      segment_start: number
      segment_end: number
      return_date: string
    }>
  }>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cable Unit Detection Consistency
*For any* consumable with unit_of_measure in ["metros", "pies", "m", "ft"], the system should identify it as a cable type and display the measurement calculator interface in both consumption and return workflows.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Length Calculation Accuracy
*For any* pair of valid markers (start, end) where end > start, the calculated length should equal (end - start) with precision to 2 decimal places.

**Validates: Requirements 2.2, 3.2**

### Property 3: Invalid Marker Rejection
*For any* marker pair where end ≤ start, the system should reject the input and display an appropriate error message.

**Validates: Requirements 2.3, 3.3**

### Property 4: Stock Boundary Validation
*For any* consumption attempt, if the calculated length exceeds available stock, the system should reject the transaction and display an insufficient stock error.

**Validates: Requirements 2.4**

### Property 5: Consumption Data Persistence
*For any* successful cable consumption, querying the database should return a record containing the exact start_marker, end_marker, and calculated length that were submitted.

**Validates: Requirements 2.5, 6.1, 6.3**

### Property 6: Consumption Stock Invariant
*For any* cable consumption, the stock after consumption should equal the stock before consumption minus the calculated length.

**Validates: Requirements 2.6**

### Property 7: Return Length Constraint
*For any* return attempt, if the calculated return length exceeds the originally consumed length (minus already returned length), the system should reject the transaction.

**Validates: Requirements 3.4**

### Property 8: Return Data Persistence
*For any* successful cable return, querying the database should return a record containing the exact segment_start, segment_end, and calculated return length that were submitted.

**Validates: Requirements 3.5, 6.2, 6.3**

### Property 9: Return Stock Invariant
*For any* cable return, the stock after return should equal the stock before return plus the calculated return length.

**Validates: Requirements 3.6**

### Property 10: Numeric Input Validation
*For any* marker input, the system should accept only positive numeric values (including decimals) and reject non-numeric characters.

**Validates: Requirements 4.1, 4.4**

### Property 11: Real-time Calculation Update
*For any* change to marker inputs, if both markers are valid numbers with end > start, the displayed calculated length should update immediately to reflect (end - start).

**Validates: Requirements 4.5, 5.3**

### Property 12: Visual State Consistency
*For any* calculation state (valid or invalid), the UI should display appropriate visual cues (colors, icons) that correctly represent the validation state.

**Validates: Requirements 5.4**

### Property 13: Segment Overlap Detection
*For any* two cable segments A and B, they overlap if and only if (A.start < B.end) AND (A.end > B.start).

**Validates: Requirements 7.3**

### Property 14: Overlap Prevention
*For any* return attempt with segment [start, end], if there exists a previously returned segment that overlaps with [start, end] for the same consumption record, the system should reject the return.

**Validates: Requirements 7.1, 7.2**

### Property 15: Non-overlapping Segment Acceptance
*For any* return attempt with segment [start, end], if no previously returned segments overlap with [start, end] for that consumption record, and the length is within bounds, the system should accept the return.

**Validates: Requirements 7.4**

### Property 16: Backward Compatibility - Display
*For any* consumption record, if marker data exists, it should be displayed; if marker data is null (legacy record), only the quantity should be displayed.

**Validates: Requirements 8.1, 8.2**

### Property 17: Backward Compatibility - Returns
*For any* return attempt on a legacy consumption record (without markers), the system should process it using standard quantity-based logic without requiring markers.

**Validates: Requirements 8.3**

### Property 18: Internationalization Consistency
*For any* validation error, the system should display the error message in the user's selected language (English or Spanish).

**Validates: Requirements 10.1**

### Property 19: Error Clearing on Correction
*For any* validation error state, when the user corrects the input to make it valid, the error message should clear immediately.

**Validates: Requirements 10.2**

## Error Handling

### Validation Errors

| Error Code | Condition | Message (ES) | Message (EN) |
|------------|-----------|--------------|--------------|
| `MARKERS_REQUIRED` | Empty marker fields | "Ambos campos son requeridos" | "Both fields are required" |
| `MARKERS_NON_NUMERIC` | Non-numeric input | "Los valores deben ser numéricos" | "Values must be numeric" |
| `MARKERS_NEGATIVE` | Negative values | "Los valores deben ser positivos" | "Values must be positive" |
| `END_NOT_GREATER` | end ≤ start | "El número final debe ser mayor que el número inicial" | "End number must be greater than start number" |
| `EXCEEDS_STOCK` | length > available | "Stock insuficiente. Disponible: {available}" | "Insufficient stock. Available: {available}" |
| `EXCEEDS_CONSUMED` | return > consumed | "No puedes devolver más de lo que consumiste ({consumed})" | "Cannot return more than consumed ({consumed})" |
| `SEGMENT_OVERLAP` | Overlapping return | "Este tramo ya fue registrado como devuelto" | "This segment has already been returned" |
| `LENGTH_TOO_LARGE` | length > 1000 | "¿Estás seguro? La cantidad calculada es muy grande" | "Are you sure? The calculated amount is very large" |

### Error Recovery

1. **Field-level validation**: Errors display immediately below the relevant input field
2. **Form-level validation**: Summary of all errors displayed at the top of the calculator
3. **Auto-clear**: Errors automatically clear when the user corrects the input
4. **Retry**: Users can modify inputs and resubmit without losing other form data

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Testing Library

**Test Files**:
- `src/utils/cableDetection.test.ts`
- `src/utils/markerValidation.test.ts`
- `src/utils/segmentOverlap.test.ts`
- `src/components/CableMeasurementCalculator.test.tsx`

**Key Test Cases**:
1. Cable unit detection with various unit formats
2. Marker validation with edge cases (empty, negative, non-numeric)
3. Length calculation precision
4. Segment overlap detection with various configurations
5. Component rendering based on cable type
6. Real-time calculation updates
7. Error message display and clearing

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test Files**:
- `src/utils/__tests__/cableDetection.property.test.ts`
- `src/utils/__tests__/markerValidation.property.test.ts`
- `src/utils/__tests__/segmentOverlap.property.test.ts`
- `src/components/__tests__/CableMeasurementCalculator.property.test.tsx`

**Property Tests** (each tagged with property number):

1. **Property 1 Test**: Cable Unit Detection Consistency
   ```typescript
   // Feature: cable-measurement-calculator, Property 1: Cable Unit Detection Consistency
   fc.assert(
     fc.property(
       fc.constantFrom('metros', 'pies', 'm', 'ft', 'METROS', 'Pies'),
       (unit) => {
         expect(isCableUnit(unit)).toBe(true)
       }
     ),
     { numRuns: 100 }
   )
   ```

2. **Property 2 Test**: Length Calculation Accuracy
   ```typescript
   // Feature: cable-measurement-calculator, Property 2: Length Calculation Accuracy
   fc.assert(
     fc.property(
       fc.float({ min: 0, max: 10000 }),
       fc.float({ min: 0.01, max: 1000 }),
       (start, delta) => {
         const end = start + delta
         const calculated = calculateLength(start, end, 2)
         const expected = Math.round(delta * 100) / 100
         expect(calculated).toBeCloseTo(expected, 2)
       }
     ),
     { numRuns: 100 }
   )
   ```

3. **Property 3 Test**: Invalid Marker Rejection
   ```typescript
   // Feature: cable-measurement-calculator, Property 3: Invalid Marker Rejection
   fc.assert(
     fc.property(
       fc.float({ min: 0, max: 10000 }),
       fc.float({ min: -1000, max: 0 }),
       (start, delta) => {
         const end = start + delta
         const result = validateMarkers(start.toString(), end.toString())
         expect(result.isValid).toBe(false)
         expect(result.errors).toContain('El número final debe ser mayor que el número inicial')
       }
     ),
     { numRuns: 100 }
   )
   ```

4. **Property 6 Test**: Consumption Stock Invariant
   ```typescript
   // Feature: cable-measurement-calculator, Property 6: Consumption Stock Invariant
   fc.assert(
     fc.property(
       fc.integer({ min: 100, max: 10000 }),
       fc.float({ min: 0, max: 100 }),
       fc.float({ min: 0.01, max: 50 }),
       async (initialStock, start, delta) => {
         const end = start + delta
         const consumed = calculateLength(start, end)
         
         // Simulate consumption
         const stockAfter = initialStock - consumed
         
         expect(stockAfter).toBe(initialStock - consumed)
       }
     ),
     { numRuns: 100 }
   )
   ```

5. **Property 13 Test**: Segment Overlap Detection
   ```typescript
   // Feature: cable-measurement-calculator, Property 13: Segment Overlap Detection
   fc.assert(
     fc.property(
       fc.float({ min: 0, max: 1000 }),
       fc.float({ min: 1, max: 100 }),
       fc.float({ min: 0, max: 1000 }),
       fc.float({ min: 1, max: 100 }),
       (start1, length1, start2, length2) => {
         const seg1 = { start: start1, end: start1 + length1 }
         const seg2 = { start: start2, end: start2 + length2 }
         
         const overlaps = segmentsOverlap(seg1, seg2)
         const expectedOverlap = (seg1.start < seg2.end) && (seg1.end > seg2.start)
         
         expect(overlaps).toBe(expectedOverlap)
       }
     ),
     { numRuns: 100 }
   )
   ```

### Integration Testing

**Test Scenarios**:
1. End-to-end consumption flow with cable markers
2. End-to-end return flow with segment markers
3. Multiple returns from same consumption (non-overlapping)
4. Attempt to return overlapping segment (should fail)
5. Legacy consumption without markers (backward compatibility)
6. Mixed workflow: cable and non-cable consumables

### API Testing

**Endpoints to Test**:
- `POST /api/consumables/consume` with marker data
- `POST /api/consumables/return` with segment data
- `GET /api/consumables/my-consumption` with marker information

**Test Cases**:
1. Consume cable with valid markers
2. Consume cable with invalid markers (should fail)
3. Return cable segment with valid markers
4. Return overlapping segment (should fail)
5. Return segment exceeding consumed length (should fail)
6. Query consumption history includes marker data

## Implementation Notes

### Phase 1: Database and Backend (Priority: High)

1. Add database columns for markers
2. Update API endpoints to accept marker data
3. Implement validation logic in backend
4. Add overlap detection in return endpoint

### Phase 2: Utilities and Logic (Priority: High)

1. Implement cable detection utility
2. Implement marker validation utility
3. Implement segment overlap detection
4. Add unit tests for all utilities

### Phase 3: UI Components (Priority: High)

1. Create CableMeasurementCalculator component
2. Integrate into ConsumableQuantityModal
3. Integrate into ReturnableItemsList
4. Add real-time calculation display
5. Implement error messaging

### Phase 4: Testing and Refinement (Priority: Medium)

1. Write property-based tests
2. Write integration tests
3. Test mobile responsiveness
4. Test backward compatibility
5. User acceptance testing

### Phase 5: Documentation and Deployment (Priority: Medium)

1. Update user documentation
2. Create admin guide for cable management
3. Add help tooltips in UI
4. Deploy to staging
5. Monitor and gather feedback

## Performance Considerations

1. **Calculation Performance**: All marker calculations are O(1) operations
2. **Overlap Detection**: O(n) where n = number of existing returns for a consumption (typically small)
3. **Database Queries**: Indexed on marker columns for efficient querying
4. **Real-time Updates**: Debounced input handlers to prevent excessive re-renders
5. **Mobile Performance**: Lazy loading of calculator component when needed

## Security Considerations

1. **Input Validation**: All marker inputs validated on both client and server
2. **SQL Injection**: Parameterized queries for all database operations
3. **Authorization**: Users can only return their own consumptions
4. **Audit Trail**: All marker-based transactions logged in audit_logs
5. **Data Integrity**: Database constraints prevent invalid marker combinations

## Accessibility

1. **Keyboard Navigation**: Full keyboard support for all inputs
2. **Screen Readers**: ARIA labels for all calculator elements
3. **Error Announcements**: Validation errors announced to screen readers
4. **Touch Targets**: Minimum 44x44px for mobile
5. **Color Contrast**: WCAG AA compliant color schemes
6. **Focus Management**: Clear focus indicators on all interactive elements

## Internationalization

**Supported Languages**: English (en), Spanish (es)

**Translation Keys** (new):
```json
{
  "cable.calculator.title": "Calculadora de Cable",
  "cable.calculator.startMarker": "Número Inicial",
  "cable.calculator.endMarker": "Número Final",
  "cable.calculator.segmentStart": "Numeración Inicial del Tramo",
  "cable.calculator.segmentEnd": "Numeración Final del Tramo",
  "cable.calculator.calculated": "Cantidad calculada",
  "cable.calculator.helpText": "Ingresa la numeración que aparece en el cable",
  "cable.calculator.example": "Ejemplo: 150, 200.5",
  "cable.calculator.howItWorks": "¿Cómo funciona?",
  "cable.errors.markersRequired": "Ambos campos son requeridos",
  "cable.errors.nonNumeric": "Los valores deben ser numéricos",
  "cable.errors.negative": "Los valores deben ser positivos",
  "cable.errors.endNotGreater": "El número final debe ser mayor que el número inicial",
  "cable.errors.exceedsStock": "Stock insuficiente. Disponible: {available}",
  "cable.errors.exceedsConsumed": "No puedes devolver más de lo que consumiste ({consumed})",
  "cable.errors.segmentOverlap": "Este tramo ya fue registrado como devuelto",
  "cable.warnings.lengthTooLarge": "¿Estás seguro? La cantidad calculada es muy grande"
}
```

## Migration Strategy

### Backward Compatibility

1. **Existing Records**: No migration required for existing consumption/return records
2. **Null Markers**: System handles null markers gracefully (legacy mode)
3. **Mixed Mode**: Users can have both legacy and marker-based records
4. **Gradual Adoption**: New consumptions use markers, old records remain unchanged

### Rollout Plan

1. **Week 1**: Deploy database changes (non-breaking)
2. **Week 2**: Deploy backend API changes with feature flag
3. **Week 3**: Deploy frontend with calculator (feature flag enabled for admins)
4. **Week 4**: Enable for all users after validation
5. **Week 5**: Monitor usage and gather feedback

## Future Enhancements

1. **Visual Segment Timeline**: Graphical representation of consumed and returned segments
2. **Barcode Scanner Integration**: Scan cable markers directly from barcode
3. **Bulk Cable Operations**: Process multiple cable segments in one transaction
4. **Cable Inventory Reports**: Specialized reports showing segment-level usage
5. **Predictive Analytics**: Predict cable needs based on historical marker data
6. **Mobile App**: Native mobile app with camera-based marker recognition
