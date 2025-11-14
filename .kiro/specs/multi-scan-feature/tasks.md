# Implementation Plan

- [ ] 1. Create batch API endpoints

  - Create batch loan endpoint for processing multiple loans at once
  - Create batch return endpoint for processing multiple returns at once
  - Create batch consumable endpoint for processing multiple consumptions at once
  - Implement parallel processing with error handling for partial failures
  - _Requirements: 1.8, 2.7, 4.6, 6.2, 6.3, 8.2, 8.5_

- [x] 1.1 Implement batch loans API endpoint

  - Create `/api/loans/batch` POST endpoint
  - Accept array of tool_instance_ids in request body
  - Process loans in parallel with Promise.allSettled
  - Return success/failure results for each item
  - Add proper error handling and validation
  - _Requirements: 1.8, 6.2, 8.2_

- [x] 1.2 Implement batch returns API endpoint

  - Create `/api/loans/batch/return` PUT endpoint
  - Accept array of loan_ids in request body
  - Verify each loan belongs to the requesting user
  - Process returns in parallel with Promise.allSettled
  - Return success/failure results for each item
  - _Requirements: 2.7, 6.2, 8.2_

- [x] 1.3 Implement batch consumables API endpoint

  - Create `/api/consumables/batch/consume` POST endpoint
  - Accept array of consumptions with item_type_id and quantity
  - Validate stock availability for each item
  - Process consumptions in parallel with Promise.allSettled
  - Return success/failure results for each item
  - _Requirements: 4.6, 6.2, 8.2_

- [ ]\* 1.4 Add unit tests for batch APIs

  - Test successful batch processing
  - Test partial failure scenarios
  - Test validation errors
  - Test authorization checks
  - _Requirements: 6.2, 6.3_

- [ ] 2. Create batch processor service

  - Create BatchProcessor service class for handling batch operations
  - Implement progress tracking and callbacks
  - Add retry logic for failed items
  - Implement rate limiting and concurrency control
  - _Requirements: 6.3, 8.2, 8.4, 8.5_

- [x] 2.1 Create BatchProcessor service class

  - Create `src/services/batchProcessor.ts` file
  - Define BatchResult interface
  - Implement processLoans method
  - Implement processReturns method
  - Implement processConsumables method
  - _Requirements: 8.2, 8.5_

- [x] 2.2 Add progress tracking to BatchProcessor

  - Implement processWithProgress helper method
  - Add onProgress callback support
  - Track completed, failed, and total counts
  - Emit progress events during processing
  - _Requirements: 8.4_

- [x] 2.3 Add error handling and retry logic

  - Implement retry mechanism for network errors
  - Add exponential backoff for retries
  - Handle partial failures gracefully
  - Collect and return detailed error information
  - _Requirements: 6.3, 6.5_

- [ ]\* 2.4 Add unit tests for BatchProcessor

  - Test progress tracking
  - Test retry logic
  - Test error handling
  - Test concurrency control
  - _Requirements: 6.3_

- [ ] 3. Create UI components for multi-scan mode

  - Create reusable components for multi-scan interface
  - Implement scanned items list with remove functionality
  - Create multi-mode toggle component
  - Build batch confirmation component with progress display
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3_

- [x] 3.1 Create ScannedItemsList component

  - Create `src/components/scanner/ScannedItemsList.tsx`
  - Display list of scanned items with details
  - Add remove button for each item
  - Show item counter badge
  - Implement smooth animations for add/remove
  - Style with dark mode support
  - _Requirements: 3.1, 3.2, 3.3, 5.3_

- [x] 3.2 Create MultiModeToggle component

  - Create `src/components/scanner/MultiModeToggle.tsx`
  - Implement toggle switch UI
  - Add visual indicator when multi-mode is active
  - Show badge with "Multi-Scan Mode" label
  - Add disabled state support
  - _Requirements: 5.1, 5.2_

- [x] 3.3 Create BatchConfirmation component

  - Create `src/components/scanner/BatchConfirmation.tsx`
  - Display summary of items to process
  - Show confirm and cancel buttons
  - Implement progress bar for processing state
  - Display "Processing X of Y" text
  - Show success/error states with animations
  - _Requirements: 5.3, 5.7, 5.8_

- [ ]\* 3.4 Add component unit tests

  - Test ScannedItemsList rendering and interactions
  - Test MultiModeToggle state changes
  - Test BatchConfirmation display states
  - Test accessibility features
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4. Enhance scanner page with multi-mode functionality

  - Add multi-mode state management to scanner page
  - Implement add/remove items from scanned list
  - Add duplicate detection logic
  - Integrate batch confirmation flow
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 3.4, 3.5_

- [x] 4.1 Add multi-mode state to ScannerPage

  - Add isMultiMode state variable
  - Add scannedItems state array
  - Add isProcessing and processingProgress states
  - Create toggleMultiMode function
  - Update scanner to stay open in multi-mode
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 4.2 Implement add item to list functionality

  - Create addScannedItem function
  - Validate item before adding to list
  - Check for duplicates and show warning
  - Verify item availability for loans
  - Verify item is loaned to user for returns
  - Update UI after successful add
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3, 2.4, 2.5_

- [x] 4.3 Implement remove item from list functionality

  - Create removeScannedItem function
  - Remove item by unique ID
  - Update counter badge
  - Hide confirm button if list becomes empty
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 4.4 Implement batch confirmation flow

  - Create confirmAllItems function
  - Show confirmation modal with item summary
  - Call BatchProcessor service
  - Display progress during processing
  - Handle success and error states
  - Show summary screen after completion
  - _Requirements: 1.8, 2.7, 4.6, 5.7, 5.8_

- [x] 4.5 Add duplicate detection

  - Check if QR code already in scanned list
  - Show warning message for duplicates
  - Prevent adding duplicate items
  - _Requirements: 1.5_

- [x] 4.6 Update scanner success handler for multi-mode

  - Modify onScanSuccess to check multi-mode state
  - Keep scanner open in multi-mode
  - Add item to list instead of showing single item view
  - Show success feedback animation
  - _Requirements: 1.2, 2.2, 5.3_

- [ ]\* 4.7 Add integration tests for scanner multi-mode

  - Test complete multi-scan flow
  - Test error handling during scan
  - Test batch confirmation
  - Test duplicate detection
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 5. Implement localStorage persistence

  - Save scanned items list to localStorage automatically
  - Restore list on page load if available
  - Clear stored data after successful confirmation
  - Implement expiration for old stored data
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5.1 Create localStorage utility functions

  - Create `src/utils/scannerStorage.ts` file
  - Implement saveScannedItems function
  - Implement loadScannedItems function
  - Implement clearScannedItems function
  - Add timestamp to stored data
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 5.2 Add auto-save functionality

  - Debounce localStorage saves (500ms)
  - Save on every item add/remove
  - Include action type and user ID in stored data
  - _Requirements: 7.1_

- [x] 5.3 Implement restore on page load

  - Check for stored data on component mount
  - Validate stored data is not expired (24h)
  - Show modal asking user to restore or discard
  - Restore items to scanned list if user confirms
  - _Requirements: 7.2, 7.5_

- [x] 5.4 Clear storage after operations

  - Clear localStorage after successful batch confirmation
  - Clear localStorage when user explicitly cancels
  - Clear localStorage when user declines restore
  - _Requirements: 7.3, 7.4_

- [ ]\* 5.5 Add tests for localStorage persistence

  - Test save and load operations
  - Test expiration logic
  - Test clear operations
  - Test restore flow
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Add error handling and recovery

  - Implement comprehensive error handling for all failure scenarios
  - Show appropriate error messages without losing progress
  - Add retry functionality for network errors
  - Implement recovery options for critical errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 6.1 Implement scan error handling

  - Show error toast for invalid QR codes
  - Display inline error for unavailable items
  - Keep scanner open and list intact on errors
  - Add error state to scanned items if needed
  - _Requirements: 6.1, 5.4_

- [ ] 6.2 Implement batch processing error handling

  - Show modal with partial success/failure results
  - List which items succeeded and which failed
  - Provide option to retry failed items
  - Allow user to remove failed items and continue
  - _Requirements: 6.2, 6.3_

- [ ] 6.3 Add network error handling

  - Detect network errors during batch processing
  - Show retry button with exponential backoff
  - Maintain list state during network issues
  - Show connection status indicator
  - _Requirements: 6.3, 6.4_

- [ ] 6.4 Implement critical error recovery

  - Save current state to localStorage on critical errors
  - Show error modal with recovery options
  - Offer to restore state on next visit
  - Log errors for debugging
  - _Requirements: 6.6_

- [ ]\* 6.5 Add error handling tests

  - Test scan error scenarios
  - Test batch processing errors
  - Test network error recovery
  - Test critical error handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

- [x] 7. Add consumables multi-scan support

  - Extend multi-scan functionality to consumables scanner
  - Add quantity input for each scanned consumable
  - Implement stock validation
  - Handle quantity accumulation for duplicate scans
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.1 Update consumables scanner page

  - Add multi-mode toggle to consumables scanner
  - Implement scanned consumables list
  - Add quantity input modal after scan
  - Show available stock for each item
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 7.2 Implement quantity validation

  - Validate quantity doesn't exceed available stock
  - Show error if stock insufficient
  - Update available stock display after each add
  - _Requirements: 4.3_

- [x] 7.3 Handle duplicate consumable scans

  - Detect duplicate consumable scans
  - Accumulate quantities instead of creating duplicates
  - Show updated quantity in list
  - Validate total quantity against stock
  - _Requirements: 4.4_

- [x] 7.4 Integrate with batch consumables API

  - Call batch consumables endpoint on confirm
  - Pass array of consumptions with quantities
  - Handle partial failures
  - Show success summary
  - _Requirements: 4.6_

- [ ]\* 7.5 Add tests for consumables multi-scan

  - Test quantity input and validation
  - Test duplicate handling
  - Test stock validation
  - Test batch consumption
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [ ] 8. Optimize performance

  - Implement list virtualization for large lists
  - Add memoization for expensive operations
  - Optimize re-renders with React.memo
  - Add loading states and skeletons
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 8.1 Add list virtualization

  - Install and configure react-window
  - Implement virtualized list for > 10 items
  - Maintain smooth scrolling performance
  - Test with large item counts (50+)
  - _Requirements: 8.3_

- [ ] 8.2 Optimize component rendering

  - Wrap components with React.memo
  - Use useMemo for expensive calculations
  - Use useCallback for event handlers
  - Prevent unnecessary re-renders
  - _Requirements: 8.1_

- [ ] 8.3 Add loading states

  - Show skeleton loaders during API calls
  - Add spinner for batch processing
  - Implement smooth transitions
  - Maintain 60fps during animations
  - _Requirements: 8.1, 8.4_

- [ ]\* 8.4 Add performance tests

  - Test rendering performance with large lists
  - Measure batch processing time
  - Verify 60fps during animations
  - Test localStorage operation speed
  - _Requirements: 8.1, 8.3_

- [ ] 9. Add translations and accessibility

  - Add translation keys for all new UI text
  - Implement ARIA labels and roles
  - Add keyboard navigation support
  - Test with screen readers
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 9.1 Add translation keys

  - Add keys for multi-mode toggle
  - Add keys for scanned items list
  - Add keys for batch confirmation
  - Add keys for error messages
  - Add keys for success messages
  - Update language files (en, es)
  - _Requirements: 5.1, 5.2, 5.3, 5.7, 5.8_

- [ ] 9.2 Implement accessibility features

  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation (Tab, Enter, Escape)
  - Add focus management for modals
  - Ensure proper heading hierarchy
  - Add screen reader announcements for scan results
  - Test with NVDA/JAWS screen readers
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9.3 Add high contrast mode support

  - Test UI in high contrast mode
  - Ensure sufficient color contrast ratios
  - Add focus indicators
  - Test with Windows High Contrast
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]\* 9.4 Add accessibility tests

  - Test keyboard navigation
  - Test screen reader compatibility
  - Test ARIA labels
  - Test focus management
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Add monitoring and analytics

  - Implement usage tracking for multi-scan feature
  - Add performance monitoring
  - Log errors and failures
  - Track user behavior metrics
  - _Requirements: 8.2, 8.4_

- [ ] 10.1 Add usage analytics

  - Track multi-mode activation rate
  - Track average items per batch
  - Track most common batch sizes
  - Track cancellation rate
  - Track recovery usage
  - _Requirements: 8.2_

- [ ] 10.2 Add performance monitoring

  - Monitor batch processing time
  - Track API response times
  - Monitor error rates
  - Track retry rates
  - _Requirements: 8.2, 8.4_

- [ ] 10.3 Implement error logging

  - Log batch operation failures
  - Log network errors
  - Log validation errors
  - Include context (user, items, action)
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]\* 10.4 Add analytics tests

  - Test event tracking
  - Test error logging
  - Test performance metrics
  - Verify data accuracy
  - _Requirements: 8.2, 8.4_

- [ ] 11. Integration and end-to-end testing

  - Create comprehensive integration tests
  - Add end-to-end tests for complete flows
  - Test error scenarios and recovery
  - Verify cross-browser compatibility
  - _Requirements: All requirements_

- [ ] 11.1 Create integration tests

  - Test complete loan multi-scan flow
  - Test complete return multi-scan flow
  - Test complete consumable multi-scan flow
  - Test localStorage persistence flow
  - Test error recovery flows
  - _Requirements: 1.1-1.8, 2.1-2.7, 4.1-4.6, 7.1-7.5_

- [ ] 11.2 Create E2E tests

  - Test happy path: scan 5 items and confirm
  - Test error scenario: scan unavailable item
  - Test duplicate detection
  - Test network failure during batch
  - Test partial batch failure
  - Test navigation away and restore
  - _Requirements: All requirements_

- [ ] 11.3 Test cross-browser compatibility

  - Test on Chrome, Firefox, Safari, Edge
  - Test on mobile browsers (iOS Safari, Chrome Mobile)
  - Verify localStorage works across browsers
  - Test QR scanner on different devices
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 11.4 Perform user acceptance testing

  - Test with real users
  - Gather feedback on UX
  - Identify pain points
  - Make adjustments based on feedback
  - _Requirements: 5.1-5.8_

- [ ] 12. Documentation and deployment

  - Update user documentation
  - Create admin guide for monitoring
  - Update API documentation
  - Deploy with feature flag
  - _Requirements: All requirements_

- [ ] 12.1 Update user documentation

  - Document how to use multi-scan mode
  - Add screenshots and examples
  - Explain error messages and recovery
  - Create FAQ section
  - _Requirements: 5.1-5.8_

- [ ] 12.2 Update API documentation

  - Document batch endpoints
  - Add request/response examples
  - Document error codes
  - Add rate limiting information
  - _Requirements: 1.8, 2.7, 4.6_

- [ ] 12.3 Create admin monitoring guide

  - Document metrics to monitor
  - Explain error logs
  - Add troubleshooting guide
  - Document performance benchmarks
  - _Requirements: 8.2, 8.4_

- [ ] 12.4 Deploy with feature flag
  - Add feature flag for multi-scan mode
  - Deploy to staging environment
  - Test in staging
  - Gradual rollout to production
  - Monitor metrics and errors
  - _Requirements: All requirements_
