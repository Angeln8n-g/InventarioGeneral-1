# Multi-Scan Feature - Code Examples

## API Usage Examples

### 1. Batch Loans API

#### Request
```typescript
const response = await fetch('/api/loans/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    tool_instance_ids: [101, 102, 103],
    notes: 'Batch loan for project X'
  })
})

const result = await response.json()
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "created": [
      {
        "id": 1,
        "user_id": 5,
        "tool_instance_id": 101,
        "due_date": "2025-02-10T00:00:00.000Z",
        "status": "active"
      },
      {
        "id": 2,
        "user_id": 5,
        "tool_instance_id": 102,
        "due_date": "2025-02-10T00:00:00.000Z",
        "status": "active"
      },
      {
        "id": 3,
        "user_id": 5,
        "tool_instance_id": 103,
        "due_date": "2025-02-10T00:00:00.000Z",
        "status": "active"
      }
    ],
    "failed": [],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0
    }
  },
  "message": "Loan created successfully"
}
```

#### Partial Success Response (207)
```json
{
  "success": false,
  "data": {
    "created": [
      {
        "id": 1,
        "user_id": 5,
        "tool_instance_id": 101,
        "due_date": "2025-02-10T00:00:00.000Z",
        "status": "active"
      }
    ],
    "failed": [
      {
        "tool_instance_id": 102,
        "error": "Tool is loaned, not available for loan"
      },
      {
        "tool_instance_id": 103,
        "error": "Tool not found"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 1,
      "failed": 2
    }
  },
  "message": "Processed 1 of 3 loans successfully"
}
```

### 2. Batch Returns API

#### Request
```typescript
const response = await fetch('/api/loans/batch/return', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    loan_ids: [1, 2, 3],
    notes: 'Batch return after project completion'
  })
})

const result = await response.json()
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "returned": [
      {
        "id": 1,
        "status": "returned",
        "return_date": "2025-01-10T15:30:00.000Z"
      },
      {
        "id": 2,
        "status": "returned",
        "return_date": "2025-01-10T15:30:00.000Z"
      },
      {
        "id": 3,
        "status": "returned",
        "return_date": "2025-01-10T15:30:00.000Z"
      }
    ],
    "failed": [],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0
    }
  },
  "message": "Tool returned successfully"
}
```

### 3. Batch Consumables API

#### Request
```typescript
const response = await fetch('/api/consumables/batch/consume', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    consumptions: [
      {
        item_type_id: 10,
        quantity: 5,
        notes: 'Used for assembly'
      },
      {
        item_type_id: 11,
        quantity: 3,
        notes: 'Used for testing'
      }
    ]
  })
})

const result = await response.json()
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "processed": [
      {
        "item_type": {
          "id": 10,
          "name": "Screws M4",
          "category": "Hardware"
        },
        "previous_quantity": 100,
        "consumed_quantity": 5,
        "remaining_quantity": 95,
        "unit_of_measure": "units",
        "is_low_stock": false
      },
      {
        "item_type": {
          "id": 11,
          "name": "Washers",
          "category": "Hardware"
        },
        "previous_quantity": 50,
        "consumed_quantity": 3,
        "remaining_quantity": 47,
        "unit_of_measure": "units",
        "is_low_stock": false
      }
    ],
    "failed": [],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  },
  "message": "Successfully consumed 2 item(s)"
}
```

## BatchProcessor Service Examples

### 1. Process Loans with Progress Tracking

```typescript
import { batchProcessor } from '@/services/batchProcessor'

const toolInstanceIds = [101, 102, 103, 104, 105]

const result = await batchProcessor.processLoans(
  toolInstanceIds,
  'Batch loan for workshop',
  (completed, total, failed) => {
    console.log(`Progress: ${completed}/${total} (${failed} failed)`)
    // Update UI with progress
    setProgress({ completed, total, failed })
  }
)

if (result.success) {
  console.log(`Successfully processed ${result.processed} loans`)
} else {
  console.log(`Processed ${result.processed}, failed ${result.failed}`)
  console.log('Errors:', result.errors)
}
```

### 2. Process Returns with Error Handling

```typescript
import { batchProcessor } from '@/services/batchProcessor'

try {
  const result = await batchProcessor.processReturns(
    [1, 2, 3],
    'Batch return',
    (completed, total, failed) => {
      setProcessingProgress({ completed, total, failed })
    }
  )

  if (result.success) {
    showSuccessMessage(`Returned ${result.processed} items`)
  } else {
    showPartialSuccessMessage(
      `Returned ${result.processed} items, ${result.failed} failed`
    )
    // Show errors to user
    result.errors.forEach(error => {
      console.error(`Item ${error.itemId}: ${error.error}`)
    })
  }
} catch (error) {
  showErrorMessage('Failed to process returns')
  console.error(error)
}
```

### 3. Process Consumables with Retry

```typescript
import { batchProcessor } from '@/services/batchProcessor'

const consumptions = [
  { item_type_id: 10, quantity: 5, notes: 'Project A' },
  { item_type_id: 11, quantity: 3, notes: 'Project A' },
]

// First attempt
let result = await batchProcessor.processConsumables(
  consumptions,
  (completed, total, failed) => {
    updateProgressBar(completed, total)
  }
)

// Retry failed items
if (result.failed > 0) {
  const failedIds = result.errors.map(e => e.itemId)
  const retryConsumptions = consumptions.filter(c => 
    failedIds.includes(c.item_type_id)
  )
  
  console.log(`Retrying ${retryConsumptions.length} failed items...`)
  
  const retryResult = await batchProcessor.processConsumables(
    retryConsumptions,
    (completed, total, failed) => {
      updateProgressBar(completed, total)
    }
  )
  
  console.log(`Retry result: ${retryResult.processed} succeeded`)
}
```

## Component Usage Examples

### 1. ScannedItemsList Component

```typescript
import { ScannedItemsList } from '@/components/scanner/ScannedItemsList'
import { ScannedItem } from '@/utils/scannerStorage'

function MyScanner() {
  const [items, setItems] = useState<ScannedItem[]>([])

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <ScannedItemsList
      items={items}
      onRemove={handleRemove}
      action="loan"
    />
  )
}
```

### 2. MultiModeToggle Component

```typescript
import { MultiModeToggle } from '@/components/scanner/MultiModeToggle'

function MyScanner() {
  const [isMultiMode, setIsMultiMode] = useState(false)
  const [items, setItems] = useState([])

  const handleToggle = () => {
    if (isMultiMode && items.length > 0) {
      const confirmed = confirm('Exit multi-mode? Items will be cleared.')
      if (!confirmed) return
      setItems([])
    }
    setIsMultiMode(!isMultiMode)
  }

  return (
    <MultiModeToggle
      isMultiMode={isMultiMode}
      onToggle={handleToggle}
      disabled={false}
      itemCount={items.length}
    />
  )
}
```

### 3. BatchConfirmation Component

```typescript
import { BatchConfirmation } from '@/components/scanner/BatchConfirmation'

function MyScanner() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ total: 0, completed: 0, failed: 0 })

  const handleConfirm = async () => {
    setIsProcessing(true)
    
    const result = await batchProcessor.processLoans(
      toolIds,
      'Batch loan',
      (completed, total, failed) => {
        setProgress({ total, completed, failed })
      }
    )
    
    setIsProcessing(false)
    setShowConfirmation(false)
    // Handle result...
  }

  return (
    <BatchConfirmation
      items={scannedItems}
      action="loan"
      onConfirm={handleConfirm}
      onCancel={() => setShowConfirmation(false)}
      isProcessing={isProcessing}
      progress={progress}
    />
  )
}
```

### 4. QuantityModal Component

```typescript
import { QuantityModal } from '@/components/scanner/QuantityModal'

function ConsumableScanner() {
  const [showModal, setShowModal] = useState(false)
  const [pendingItem, setPendingItem] = useState(null)

  const handleQuantityConfirm = (quantity: number) => {
    addItemToList(pendingItem, quantity)
    setShowModal(false)
    setPendingItem(null)
  }

  return (
    <QuantityModal
      isOpen={showModal}
      itemName={pendingItem?.name || ''}
      availableStock={pendingItem?.stock || 0}
      unitOfMeasure={pendingItem?.unit || 'units'}
      initialQuantity={1}
      onConfirm={handleQuantityConfirm}
      onCancel={() => setShowModal(false)}
    />
  )
}
```

### 5. BatchResultSummary Component

```typescript
import { BatchResultSummary } from '@/components/scanner/BatchResultSummary'

function MyScanner() {
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)

  const handleRetry = () => {
    // Retry failed items
    const failedIds = results.errors.map(e => e.itemId)
    // Process only failed items...
  }

  return (
    <BatchResultSummary
      isOpen={showResults}
      action="loan"
      successCount={results?.processed || 0}
      failedCount={results?.failed || 0}
      errors={results?.errors || []}
      onClose={() => setShowResults(false)}
      onRetry={handleRetry}
    />
  )
}
```

## LocalStorage Utilities Examples

### 1. Save Scanned Items

```typescript
import { saveScannedItems, ScannedItem } from '@/utils/scannerStorage'

const items: ScannedItem[] = [
  {
    id: '1',
    qr_code: 'uuid-1',
    tool_instance_id: 101,
    item_type: { id: 1, name: 'Hammer' },
    serial_number: 'H001',
    status: 'available',
    scanned_at: new Date().toISOString()
  }
]

saveScannedItems('loan', items, userId)
```

### 2. Load and Restore Items

```typescript
import { loadScannedItems } from '@/utils/scannerStorage'

useEffect(() => {
  if (user) {
    const stored = loadScannedItems(user.id)
    
    if (stored && stored.action === 'loan') {
      // Ask user if they want to restore
      const restore = confirm(
        `You have ${stored.items.length} unsaved items. Restore?`
      )
      
      if (restore) {
        setScannedItems(stored.items)
        setIsMultiMode(true)
      } else {
        clearScannedItems()
      }
    }
  }
}, [user])
```

### 3. Auto-save with Debouncing

```typescript
import { debounce, saveScannedItems } from '@/utils/scannerStorage'

const debouncedSave = useCallback(
  debounce<(items: ScannedItem[]) => void>((items) => {
    if (user && items.length > 0) {
      saveScannedItems('loan', items, user.id)
    }
  }, 500),
  [user]
)

useEffect(() => {
  if (isMultiMode && scannedItems.length > 0) {
    debouncedSave(scannedItems)
  }
}, [scannedItems, isMultiMode, debouncedSave])
```

### 4. Clear Storage After Success

```typescript
import { clearScannedItems } from '@/utils/scannerStorage'

const handleBatchConfirm = async () => {
  const result = await batchProcessor.processLoans(toolIds)
  
  if (result.processed > 0) {
    // Clear storage on success
    clearScannedItems()
    setScannedItems([])
    
    // Redirect to success page
    router.push('/dashboard?success=batch_loan_completed')
  }
}
```

## Complete Integration Example

```typescript
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MultiModeToggle } from '@/components/scanner/MultiModeToggle'
import { ScannedItemsList } from '@/components/scanner/ScannedItemsList'
import { BatchConfirmation } from '@/components/scanner/BatchConfirmation'
import { 
  ScannedItem, 
  saveScannedItems, 
  loadScannedItems, 
  clearScannedItems,
  debounce 
} from '@/utils/scannerStorage'
import { batchProcessor } from '@/services/batchProcessor'

export default function MyScanner() {
  const router = useRouter()
  const { user } = useAuth()
  
  // State
  const [isMultiMode, setIsMultiMode] = useState(false)
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ 
    total: 0, completed: 0, failed: 0 
  })
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Debounced save
  const debouncedSave = useCallback(
    debounce<(items: ScannedItem[]) => void>((items) => {
      if (user && items.length > 0) {
        saveScannedItems('loan', items, user.id)
      }
    }, 500),
    [user]
  )

  // Load saved items on mount
  useEffect(() => {
    if (user) {
      const stored = loadScannedItems(user.id)
      if (stored && stored.action === 'loan' && stored.items.length > 0) {
        const restore = confirm('Restore previous session?')
        if (restore) {
          setScannedItems(stored.items)
          setIsMultiMode(true)
        } else {
          clearScannedItems()
        }
      }
    }
  }, [user])

  // Auto-save
  useEffect(() => {
    if (isMultiMode && scannedItems.length > 0) {
      debouncedSave(scannedItems)
    }
  }, [scannedItems, isMultiMode, debouncedSave])

  // Handlers
  const toggleMultiMode = () => {
    if (isMultiMode && scannedItems.length > 0) {
      const confirmed = confirm('Exit multi-mode? Items will be cleared.')
      if (!confirmed) return
      setScannedItems([])
      clearScannedItems()
    }
    setIsMultiMode(!isMultiMode)
  }

  const addScannedItem = (item: ScannedItem) => {
    const isDuplicate = scannedItems.some(i => i.qr_code === item.qr_code)
    if (isDuplicate) {
      alert('Item already scanned')
      return
    }
    setScannedItems(prev => [...prev, item])
  }

  const removeScannedItem = (id: string) => {
    setScannedItems(prev => prev.filter(item => item.id !== id))
  }

  const handleBatchConfirm = async () => {
    if (!user) return

    setIsProcessing(true)
    setProcessingProgress({ 
      total: scannedItems.length, 
      completed: 0, 
      failed: 0 
    })

    try {
      const toolIds = scannedItems
        .map(item => item.tool_instance_id)
        .filter((id): id is number => id !== undefined)

      const result = await batchProcessor.processLoans(
        toolIds,
        'Batch loan via multi-scan',
        (completed, total, failed) => {
          setProcessingProgress({ total, completed, failed })
        }
      )

      if (result.processed > 0) {
        clearScannedItems()
        setScannedItems([])
        setTimeout(() => {
          router.push(`/dashboard?success=batch_loan&count=${result.processed}`)
        }, 1500)
      }
    } catch (error) {
      console.error('Batch processing error:', error)
      alert('Failed to process batch')
    } finally {
      setIsProcessing(false)
      setShowConfirmation(false)
    }
  }

  return (
    <div className="p-4">
      <MultiModeToggle
        isMultiMode={isMultiMode}
        onToggle={toggleMultiMode}
        disabled={isProcessing}
        itemCount={scannedItems.length}
      />

      {isMultiMode && (
        <>
          <ScannedItemsList
            items={scannedItems}
            onRemove={removeScannedItem}
            action="loan"
          />

          {scannedItems.length > 0 && (
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={isProcessing}
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg"
            >
              Confirm All ({scannedItems.length})
            </button>
          )}
        </>
      )}

      {showConfirmation && (
        <BatchConfirmation
          items={scannedItems}
          action="loan"
          onConfirm={handleBatchConfirm}
          onCancel={() => setShowConfirmation(false)}
          isProcessing={isProcessing}
          progress={processingProgress}
        />
      )}
    </div>
  )
}
```

## Testing Examples

### 1. Manual Testing Checklist

```markdown
## Multi-Scan Feature Testing

### Loans
- [ ] Enable multi-mode
- [ ] Scan 3 valid tools
- [ ] Verify all appear in list
- [ ] Try scanning duplicate - should show error
- [ ] Remove one item from list
- [ ] Confirm batch with 2 items
- [ ] Verify progress shows correctly
- [ ] Verify success message
- [ ] Check database - 2 loans created

### Returns
- [ ] Enable multi-mode
- [ ] Scan 3 loaned tools
- [ ] Verify all appear in list
- [ ] Confirm batch
- [ ] Verify all returned successfully

### Consumables
- [ ] Enable multi-mode
- [ ] Scan consumable A, enter quantity 5
- [ ] Scan consumable B, enter quantity 3
- [ ] Scan consumable A again, enter quantity 2
- [ ] Verify quantity accumulated to 7
- [ ] Confirm batch
- [ ] Verify stock updated correctly

### Persistence
- [ ] Scan 3 items in multi-mode
- [ ] Refresh page
- [ ] Verify restore modal appears
- [ ] Click restore
- [ ] Verify items restored
- [ ] Complete batch
- [ ] Refresh page
- [ ] Verify no restore modal (cleared)
```

### 2. Error Scenarios to Test

```markdown
## Error Testing

### Validation Errors
- [ ] Scan unavailable tool in loan mode
- [ ] Scan non-loaned tool in return mode
- [ ] Enter quantity > available stock
- [ ] Try to confirm with empty list

### Network Errors
- [ ] Disconnect network during batch
- [ ] Verify retry logic works
- [ ] Verify items not lost

### Partial Failures
- [ ] Mix valid and invalid items
- [ ] Verify partial success handling
- [ ] Verify error details shown
```

---

**Note:** These examples demonstrate the complete usage of the multi-scan feature. Adapt them to your specific needs and requirements.
