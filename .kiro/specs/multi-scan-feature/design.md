# Design Document - Multi-Scan Feature

## Overview

El sistema de escaneo múltiple permitirá a los usuarios escanear varios elementos (herramientas, consumibles) de forma consecutiva antes de confirmar la operación. Esta funcionalidad mejorará significativamente la eficiencia operativa al reducir el tiempo necesario para procesar múltiples elementos y mejorar la experiencia del usuario.

La implementación se basará en el componente existente `ScannerPage` y agregará un nuevo estado de "modo múltiple" que mantendrá una lista de elementos escaneados en memoria y localStorage para persistencia.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Scanner Page                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Mode Selector (Single / Multi)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────┐  ┌──────────────────────────────────┐  │
│  │                │  │   Scanned Items List             │  │
│  │   QR Scanner   │  │  ┌────────────────────────────┐  │  │
│  │   Component    │  │  │ Item 1 [Remove]            │  │  │
│  │                │  │  │ Item 2 [Remove]            │  │  │
│  │                │  │  │ Item 3 [Remove]            │  │  │
│  └────────────────┘  │  └────────────────────────────┘  │  │
│                      │                                    │  │
│                      │  [Confirm All] [Cancel]           │  │
│                      └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Batch Processor │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Loans API   │    │ Consumables  │
            │              │    │     API      │
            └──────────────┘    └──────────────┘
```

### State Management

```typescript
interface ScannedItem {
  id: string // Unique identifier for the list
  qr_code: string
  tool_instance_id?: number
  consumable_id?: number
  item_type: {
    name: string
    description?: string
  }
  serial_number?: string
  status?: string
  quantity?: number // For consumables
  available_stock?: number // For consumables
  scanned_at: string
  error?: string
}

interface MultiScanState {
  isMultiMode: boolean
  scannedItems: ScannedItem[]
  isProcessing: boolean
  processingProgress: {
    total: number
    completed: number
    failed: number
  }
}
```

## Components and Interfaces

### 1. Enhanced Scanner Page Component

**File**: `src/app/scanner/page.tsx`

**New State Variables**:
```typescript
const [isMultiMode, setIsMultiMode] = useState(false)
const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
const [isProcessing, setIsProcessing] = useState(false)
const [processingProgress, setProcessingProgress] = useState({ total: 0, completed: 0, failed: 0 })
```

**Key Functions**:
- `toggleMultiMode()`: Activa/desactiva el modo múltiple
- `addScannedItem(item)`: Agrega un elemento a la lista
- `removeScannedItem(id)`: Remueve un elemento de la lista
- `confirmAllItems()`: Procesa todos los elementos en batch
- `saveToLocalStorage()`: Guarda la lista en localStorage
- `restoreFromLocalStorage()`: Restaura la lista guardada

### 2. Scanned Items List Component

**New Component**: `src/components/scanner/ScannedItemsList.tsx`

```typescript
interface ScannedItemsListProps {
  items: ScannedItem[]
  onRemove: (id: string) => void
  action: 'loan' | 'return' | 'consume'
}

export function ScannedItemsList({ items, onRemove, action }: ScannedItemsListProps) {
  // Render list of scanned items with remove buttons
  // Show item details: name, serial, status
  // Display counter badge
}
```

### 3. Multi-Mode Toggle Component

**New Component**: `src/components/scanner/MultiModeToggle.tsx`

```typescript
interface MultiModeToggleProps {
  isMultiMode: boolean
  onToggle: () => void
  disabled?: boolean
}

export function MultiModeToggle({ isMultiMode, onToggle, disabled }: MultiModeToggleProps) {
  // Toggle switch with clear visual indicator
  // Show badge when multi-mode is active
}
```

### 4. Batch Confirmation Component

**New Component**: `src/components/scanner/BatchConfirmation.tsx`

```typescript
interface BatchConfirmationProps {
  items: ScannedItem[]
  action: 'loan' | 'return' | 'consume'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
  progress?: { total: number; completed: number; failed: number }
}

export function BatchConfirmation({ items, action, onConfirm, onCancel, isProcessing, progress }: BatchConfirmationProps) {
  // Show summary of items to process
  // Display progress bar during processing
  // Show confirm/cancel buttons
}
```

### 5. Batch Processing Service

**New File**: `src/services/batchProcessor.ts`

```typescript
interface BatchResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{ itemId: string; error: string }>
}

export class BatchProcessor {
  async processLoans(items: ScannedItem[], userId: number): Promise<BatchResult>
  async processReturns(items: ScannedItem[], userId: number): Promise<BatchResult>
  async processConsumables(items: ScannedItem[], userId: number): Promise<BatchResult>
  
  private async processWithProgress(
    items: ScannedItem[],
    processor: (item: ScannedItem) => Promise<void>,
    onProgress: (completed: number, total: number) => void
  ): Promise<BatchResult>
}
```

## Data Models

### LocalStorage Schema

**Key**: `scanner_multi_mode_state`

```typescript
interface StoredScanState {
  action: 'loan' | 'return' | 'consume'
  items: ScannedItem[]
  timestamp: string
  userId: number
}
```

### API Request/Response Models

**Batch Loan Request**:
```typescript
POST /api/loans/batch
{
  tool_instance_ids: number[]
}

Response:
{
  success: boolean
  data: {
    created: Loan[]
    failed: Array<{ tool_instance_id: number; error: string }>
  }
}
```

**Batch Return Request**:
```typescript
PUT /api/loans/batch/return
{
  loan_ids: number[]
}

Response:
{
  success: boolean
  data: {
    returned: Loan[]
    failed: Array<{ loan_id: number; error: string }>
  }
}
```

**Batch Consumable Request**:
```typescript
POST /api/consumables/batch/consume
{
  consumptions: Array<{
    item_type_id: number
    quantity: number
  }>
}

Response:
{
  success: boolean
  data: {
    processed: ConsumableRequest[]
    failed: Array<{ item_type_id: number; error: string }>
  }
}
```

## Error Handling

### Error Categories

1. **Validation Errors** (400)
   - Duplicate item in list
   - Item not available
   - Insufficient stock
   - Invalid QR code

2. **Authorization Errors** (403)
   - Item not loaned to user (for returns)
   - User not authorized

3. **Network Errors** (500, timeout)
   - Connection lost
   - Server error

### Error Handling Strategy

```typescript
interface ErrorHandler {
  // Show error without clearing list
  handleScanError(error: Error, item: ScannedItem): void
  
  // Show partial success/failure
  handleBatchError(results: BatchResult): void
  
  // Offer retry
  handleNetworkError(error: Error): void
  
  // Save state and offer recovery
  handleCriticalError(error: Error): void
}
```

### Error Display

- **Inline Errors**: Mostrar error en el item específico de la lista
- **Toast Notifications**: Para errores de escaneo individual
- **Modal Dialog**: Para errores críticos durante confirmación batch
- **Summary Screen**: Mostrar resumen de éxitos/fallos después de batch

## Testing Strategy

### Unit Tests

1. **State Management Tests**
   - Add/remove items from list
   - Toggle multi-mode
   - Duplicate detection
   - LocalStorage save/restore

2. **Component Tests**
   - ScannedItemsList rendering
   - MultiModeToggle interaction
   - BatchConfirmation display

3. **Service Tests**
   - BatchProcessor logic
   - Error handling
   - Progress tracking

### Integration Tests

1. **Scanner Flow Tests**
   - Scan multiple items
   - Remove items from list
   - Confirm batch operation
   - Handle errors during batch

2. **API Tests**
   - Batch loan creation
   - Batch return processing
   - Batch consumable consumption
   - Partial failure handling

3. **Persistence Tests**
   - Save state to localStorage
   - Restore state on page load
   - Clear state after success
   - Expire old state

### E2E Tests

1. **Happy Path**
   - Enable multi-mode
   - Scan 5 items
   - Confirm all
   - Verify success

2. **Error Scenarios**
   - Scan unavailable item
   - Scan duplicate item
   - Network failure during batch
   - Partial batch failure

3. **Recovery Scenarios**
   - Navigate away and return
   - Restore saved state
   - Clear expired state

## UI/UX Design

### Visual States

1. **Single Mode** (Default)
   - Standard scanner interface
   - "Enable Multi-Scan" toggle visible

2. **Multi Mode Active**
   - Badge indicator "Multi-Scan Mode"
   - Scanner stays open after scan
   - List appears below scanner
   - Counter badge shows item count

3. **Items in List**
   - Card-based list layout
   - Each item shows: icon, name, serial, status
   - Remove button (X) on each item
   - Smooth animations for add/remove

4. **Processing State**
   - Progress bar with percentage
   - "Processing X of Y" text
   - Disable all interactions
   - Spinner animation

5. **Success State**
   - Checkmark animation
   - Summary: "Successfully processed X items"
   - Auto-redirect after 2 seconds

6. **Error State**
   - Error icon with message
   - List of failed items
   - "Retry" and "Cancel" buttons

### Responsive Design

- **Mobile**: Stack scanner and list vertically
- **Tablet**: Side-by-side layout
- **Desktop**: Optimized spacing, larger touch targets

### Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements for scan results
- High contrast mode support
- Focus management during modal dialogs

## Performance Considerations

### Optimization Strategies

1. **List Virtualization**
   - Use `react-window` for lists > 10 items
   - Render only visible items

2. **Debouncing**
   - Debounce localStorage saves (500ms)
   - Throttle progress updates (100ms)

3. **Parallel Processing**
   - Process batch items in parallel (max 5 concurrent)
   - Use Promise.allSettled for partial failures

4. **Lazy Loading**
   - Code-split batch components
   - Load only when multi-mode enabled

5. **Memoization**
   - Memoize item list rendering
   - Cache duplicate checks

### Performance Targets

- Scan to list add: < 500ms
- Batch processing: < 2s for 10 items
- UI responsiveness: 60fps during animations
- LocalStorage operations: < 50ms

## Security Considerations

1. **Authorization**
   - Verify user owns loans before batch return
   - Check permissions for each item

2. **Validation**
   - Validate all items server-side
   - Prevent duplicate submissions
   - Rate limiting on batch endpoints

3. **Data Sanitization**
   - Sanitize QR codes before storage
   - Validate item counts and quantities

4. **Audit Logging**
   - Log all batch operations
   - Track partial failures
   - Record user actions

## Migration Strategy

### Phase 1: Add Multi-Mode UI
- Add toggle and list components
- No API changes
- Feature flag controlled

### Phase 2: Implement Batch APIs
- Create batch endpoints
- Maintain backward compatibility
- Gradual rollout

### Phase 3: Add Persistence
- Implement localStorage
- Add recovery flow
- Monitor usage

### Phase 4: Optimize
- Add performance improvements
- Implement virtualization
- Fine-tune UX

## Monitoring and Analytics

### Metrics to Track

1. **Usage Metrics**
   - Multi-mode adoption rate
   - Average items per batch
   - Most common batch sizes

2. **Performance Metrics**
   - Batch processing time
   - Error rates
   - Retry rates

3. **User Behavior**
   - Items removed from list
   - Cancellation rate
   - Recovery usage

### Logging

```typescript
// Log batch operations
logger.info('batch_operation_started', {
  action: 'loan',
  itemCount: 5,
  userId: 123
})

logger.info('batch_operation_completed', {
  action: 'loan',
  itemCount: 5,
  successCount: 4,
  failedCount: 1,
  duration: 1500
})
```

## Future Enhancements

1. **Barcode Scanner Support**
   - Support for barcode scanners
   - Bulk import from CSV

2. **Smart Suggestions**
   - Suggest commonly borrowed together items
   - Quick add from history

3. **Offline Mode**
   - Queue operations when offline
   - Sync when connection restored

4. **Advanced Filtering**
   - Filter list by category
   - Sort by name, date, status

5. **Batch Templates**
   - Save common item combinations
   - Quick load templates
