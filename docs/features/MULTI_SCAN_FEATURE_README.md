# Multi-Scan Feature Documentation

## Overview

The Multi-Scan feature allows users to scan multiple items (tools, consumables) consecutively before confirming the operation in a single batch. This significantly improves operational efficiency and user experience.

## Features

### 1. Batch Operations
- **Batch Loans**: Borrow multiple tools at once
- **Batch Returns**: Return multiple tools at once
- **Batch Consumptions**: Consume multiple consumables with quantities

### 2. Smart Scanning
- **Duplicate Detection**: Prevents scanning the same item twice
- **Quantity Accumulation**: For consumables, accumulates quantities instead of creating duplicates
- **Real-time Validation**: Validates availability and stock before adding to list

### 3. Persistence
- **Auto-save**: Automatically saves scanned items to localStorage
- **Session Restore**: Offers to restore unfinished sessions on page load
- **24-hour Expiration**: Automatically clears old saved data

### 4. Progress Tracking
- **Real-time Progress**: Shows "Processing X of Y" during batch operations
- **Partial Success Handling**: Continues processing even if some items fail
- **Detailed Results**: Shows which items succeeded and which failed

## User Guide

### How to Use Multi-Scan Mode

#### For Tools (Loans/Returns)

1. **Navigate to Scanner**
   - Go to Scanner page
   - Choose "Scan Tools" option

2. **Enable Multi-Scan Mode**
   - Toggle the "Multi-Scan Mode" switch
   - The scanner will stay open after each scan

3. **Scan Items**
   - Scan QR codes of tools you want to borrow/return
   - Each scanned item appears in the list below
   - Remove items by clicking the X button

4. **Confirm Batch**
   - Click "Confirm All (X)" button
   - Review the summary
   - Click "Confirm" to process all items

5. **View Results**
   - See success/failure summary
   - Retry failed items if needed

#### For Consumables

1. **Navigate to Consumables Scanner**
   - Go to Consumables > Scan page

2. **Enable Multi-Scan Mode**
   - Toggle the "Multi-Scan Mode" switch

3. **Scan and Set Quantity**
   - Scan consumable QR code
   - Enter quantity in the modal
   - Click "Add" to add to list
   - Scanning the same item again accumulates the quantity

4. **Confirm Batch**
   - Click "Confirm All (X)" button
   - Review items and quantities
   - Click "Confirm" to process

## API Endpoints

### Batch Loans
```
POST /api/loans/batch
Content-Type: application/json

{
  "tool_instance_ids": [1, 2, 3],
  "notes": "Optional notes"
}

Response (201 or 207):
{
  "success": true,
  "data": {
    "created": [...],
    "failed": [...],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
}
```

### Batch Returns
```
PUT /api/loans/batch/return
Content-Type: application/json

{
  "loan_ids": [1, 2, 3],
  "notes": "Optional notes"
}

Response (200 or 207):
{
  "success": true,
  "data": {
    "returned": [...],
    "failed": [...],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0
    }
  }
}
```

### Batch Consumptions
```
POST /api/consumables/batch/consume
Content-Type: application/json

{
  "consumptions": [
    {
      "item_type_id": 1,
      "quantity": 5,
      "notes": "Optional notes"
    },
    {
      "item_type_id": 2,
      "quantity": 3
    }
  ]
}

Response (200 or 207):
{
  "success": true,
  "data": {
    "processed": [...],
    "failed": [...],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

## Technical Details

### Components

#### ScannedItemsList
Displays the list of scanned items with remove functionality.

**Props:**
- `items`: Array of ScannedItem objects
- `onRemove`: Callback when item is removed
- `action`: Type of action ('loan', 'return', 'consume')

#### MultiModeToggle
Toggle switch for enabling/disabling multi-scan mode.

**Props:**
- `isMultiMode`: Current mode state
- `onToggle`: Callback when toggled
- `disabled`: Whether toggle is disabled
- `itemCount`: Number of items in list (shows badge)

#### BatchConfirmation
Modal for confirming batch operations with progress display.

**Props:**
- `items`: Array of items to process
- `action`: Type of action
- `onConfirm`: Callback when confirmed
- `onCancel`: Callback when cancelled
- `isProcessing`: Whether currently processing
- `progress`: Progress object with total, completed, failed counts

#### QuantityModal
Modal for entering quantity for consumables.

**Props:**
- `isOpen`: Whether modal is open
- `itemName`: Name of the item
- `availableStock`: Available stock quantity
- `unitOfMeasure`: Unit of measure
- `initialQuantity`: Initial quantity value
- `onConfirm`: Callback with quantity
- `onCancel`: Callback when cancelled

#### BatchResultSummary
Modal showing results after batch processing.

**Props:**
- `isOpen`: Whether modal is open
- `action`: Type of action
- `successCount`: Number of successful operations
- `failedCount`: Number of failed operations
- `errors`: Array of error objects
- `onClose`: Callback when closed
- `onRetry`: Optional callback to retry failed items

### Services

#### BatchProcessor
Service class for processing batch operations.

**Methods:**
- `processLoans(toolInstanceIds, notes?, onProgress?)`: Process batch loans
- `processReturns(loanIds, notes?, onProgress?)`: Process batch returns
- `processConsumables(consumptions, onProgress?)`: Process batch consumptions

**Features:**
- Parallel processing with concurrency control (max 5 concurrent)
- Retry logic with exponential backoff (3 attempts)
- Progress callbacks for real-time updates
- Graceful handling of partial failures

### Storage

#### LocalStorage Schema
```typescript
{
  action: 'loan' | 'return' | 'consume',
  items: ScannedItem[],
  timestamp: string,
  userId: number
}
```

**Key:** `scanner_multi_mode_state`

**Expiration:** 24 hours

**Functions:**
- `saveScannedItems(action, items, userId)`: Save items to localStorage
- `loadScannedItems(userId)`: Load items from localStorage
- `clearScannedItems()`: Clear items from localStorage
- `hasStoredItems()`: Check if items exist in storage

## Error Handling

### Scan Errors
- Invalid QR code format
- Item not found
- Item not available
- Duplicate item

**Behavior:** Shows error message for 3 seconds, keeps list intact

### Batch Processing Errors
- Network errors
- Validation errors
- Authorization errors
- Partial failures

**Behavior:** Shows detailed error summary, allows retry

### Critical Errors
- Unexpected errors during processing

**Behavior:** Saves state to localStorage, offers recovery on next visit

## Performance Optimizations

### Implemented
- Debounced localStorage saves (500ms)
- Parallel batch processing (max 5 concurrent)
- Non-blocking audit logs and notifications
- Smooth animations with CSS transforms

### Recommended for Large Lists (>50 items)
- List virtualization with react-window
- Memoization with React.memo
- useCallback for event handlers
- useMemo for expensive calculations

## Accessibility

### Keyboard Navigation
- Tab: Navigate between elements
- Enter: Confirm actions
- Escape: Cancel modals

### Screen Reader Support
- ARIA labels on all interactive elements
- Announcements for scan results
- Proper heading hierarchy

### Visual Indicators
- High contrast mode support
- Focus indicators
- Color-blind friendly status colors

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. **Maximum Items**: No hard limit, but performance may degrade with >100 items
2. **LocalStorage Size**: Limited to ~5MB per domain
3. **Camera Access**: Requires HTTPS in production
4. **Concurrent Operations**: Limited to 5 simultaneous API calls

## Future Enhancements

1. **Barcode Scanner Support**: Support for physical barcode scanners
2. **Bulk Import**: Import from CSV/Excel
3. **Smart Suggestions**: Suggest commonly borrowed together items
4. **Offline Mode**: Queue operations when offline, sync when online
5. **Batch Templates**: Save and load common item combinations
6. **Advanced Filtering**: Filter and sort scanned items
7. **Export Results**: Export batch results to PDF/CSV

## Troubleshooting

### Items Not Saving
- Check browser localStorage is enabled
- Verify not in incognito/private mode
- Check localStorage quota not exceeded

### Scanner Not Working
- Verify camera permissions granted
- Check HTTPS connection (required for camera)
- Try different browser
- Check QR code quality

### Batch Processing Slow
- Check network connection
- Reduce number of items per batch
- Check server load

### Items Not Restoring
- Check if more than 24 hours have passed
- Verify same user account
- Check browser localStorage not cleared

## Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Check browser console for errors
4. Contact system administrator

## Version History

### v1.0.0 (Current)
- Initial release
- Batch loans, returns, and consumptions
- Multi-scan mode with persistence
- Progress tracking and error handling
- Quantity management for consumables
