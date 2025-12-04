# Implementation Plan: Cable Measurement Calculator

## Task List

- [x] 1. Database schema updates and migrations



  - Add marker columns to stock_movements and consumable_returns tables
  - Create indexes for efficient querying
  - Add check constraints for data integrity
  - _Requirements: 2.5, 3.5, 6.1, 6.2_

- [x] 1.1 Create database migration script


  - Write SQL migration for stock_movements table (add start_marker, end_marker columns)
  - Write SQL migration for consumable_returns table (add segment_start, segment_end columns)
  - Add indexes on marker columns
  - Add check constraints to ensure end > start
  - Test migration on development database
  - _Requirements: 6.1, 6.2_

- [x] 1.2 Update TypeScript database types


  - Extend StockMovement interface with marker fields
  - Extend ConsumableReturn interface with segment fields
  - Create new request/response types for marker-based operations
  - Update API service types

  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Core utility functions
  - Implement cable detection, marker validation, and segment overlap utilities

  - Ensure all utilities are pure functions with no side effects
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 7.1, 7.3_

- [x] 2.2 Write property test for cable detection
  - **Property 1: Cable Unit Detection Consistency**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - Test that all cable unit variations are correctly identified
  - Test that non-cable units are correctly rejected
  - Use fast-check to generate various unit strings
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.4 Write property test for marker validation
  - **Property 2: Length Calculation Accuracy**
  - **Property 3: Invalid Marker Rejection**
  - **Property 10: Numeric Input Validation**
  - **Validates: Requirements 2.2, 2.3, 3.2, 3.3, 4.1, 4.4**
  - Test calculation accuracy with random marker pairs
  - Test rejection of invalid markers (end <= start)
  - Test numeric validation with various input types
  - _Requirements: 2.2, 2.3, 3.2, 3.3, 4.1, 4.4_

- [x] 2.6 Write property test for segment overlap
  - **Property 13: Segment Overlap Detection**
  - **Property 14: Overlap Prevention**
  - **Property 15: Non-overlapping Segment Acceptance**
  - **Validates: Requirements 7.1, 7.3, 7.4**
  - Test overlap detection with random segment pairs
  - Test that overlapping returns are rejected
  - Test that non-overlapping returns are accepted
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 2.7 Write unit tests for utility functions
  - Test cable detection with various unit formats
  - Test marker validation edge cases
  - Test segment overlap with known configurations
  - Test calculation precision
  - _Requirements: 1.1, 2.2, 4.1, 7.3_

- [x] 3. Backend API updates

  - Update consumption and return endpoints to handle marker data
  - Add validation logic for markers and segments
  - Implement overlap detection in return endpoint
  - _Requirements: 2.5, 2.6, 3.5, 3.6, 7.1, 7.2_

- [x] 3.1 Update consume consumable endpoint


  - Modify `POST /api/consumables/consume` to accept start_marker and end_marker
  - Add server-side validation for marker values
  - Calculate length from markers if provided
  - Store markers in stock_movements table
  - Maintain backward compatibility (markers optional)
  - _Requirements: 2.5, 2.6, 6.1_

- [x] 3.2 Update return consumable endpoint







  - Modify `POST /api/consumables/return` to accept segment_start and segment_end
  - Add server-side validation for segment values
  - Implement overlap detection logic
  - Query existing returns to check for overlaps
  - Store segments in consumable_returns table
  - Return detailed error for overlapping segments
  - _Requirements: 3.5, 3.6, 6.2, 7.1, 7.2_

- [x] 3.3 Update consumption history endpoint





  - Modify `GET /api/consumables/my-consumption` to include marker data
  - Include returned_segments array for each consumption item
  - Handle null markers for legacy records
  - _Requirements: 6.3, 8.1, 8.2_

- [x] 3.4 Write API integration tests



  - Test consume endpoint with valid markers
  - Test consume endpoint with invalid markers (should fail)
  - Test return endpoint with valid segments
  - Test return endpoint with overlapping segments (should fail)
  - Test consumption history includes marker data
  - _Requirements: 2.5, 3.5, 6.3, 7.1_

- [x] 4. CableMeasurementCalculator component
  - Create reusable calculator component for both consumption and return
  - Implement real-time calculation and validation
  - Add visual feedback for valid/invalid states
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.5, 5.1, 5.2, 5.3, 5.4_

- [x] 4.1 Create CableMeasurementCalculator component
  - Create `src/components/consumables/CableMeasurementCalculator.tsx`
  - Define component props interface (mode, unitOfMeasure, callbacks, etc.)
  - Implement component state management (markers, errors, calculated length)
  - Create MarkerInput sub-component for individual marker fields
  - Add calculator icon and visual indicators
  - _Requirements: 5.1, 5.2_

- [x] 4.2 Implement real-time calculation logic
  - Add onChange handlers for marker inputs
  - Calculate length in real-time as user types
  - Display calculated result with proper formatting
  - Update validation state on every change
  - Debounce calculations to prevent excessive re-renders
  - _Requirements: 2.2, 3.2, 4.5, 5.3_

- [x] 4.3 Implement validation and error display
  - Integrate marker validation utility
  - Display field-level errors below inputs
  - Display form-level errors at top of calculator
  - Show warnings for unusual values (>1000)
  - Add visual cues (colors, icons) for valid/invalid states
  - Clear errors automatically when user corrects input
  - _Requirements: 2.3, 3.3, 4.1, 4.2, 4.3, 5.4, 10.2_

- [x] 4.4 Add internationalization support
  - Add translation keys for all calculator text
  - Support English and Spanish error messages
  - Use i18n hooks for dynamic language switching
  - Add example text in both languages
  - _Requirements: 10.1, 10.3_

- [x] 4.5 Implement help and guidance features
  - Add "¿Cómo funciona?" help button
  - Create help modal explaining marker system
  - Add example marker formats near inputs
  - Show confirmation prompt for unusually large values
  - _Requirements: 10.3, 10.4, 10.5_

- [x] 4.6 Write component unit tests
  - Test component rendering with different props
  - Test real-time calculation updates
  - Test error display and clearing
  - Test validation state changes
  - Test internationalization
  - _Requirements: 2.2, 4.5, 5.3, 10.1, 10.2_

- [x] 4.7 Write property test for real-time calculation
  - **Property 11: Real-time Calculation Update**
  - **Validates: Requirements 4.5, 5.3**
  - Test that calculated length updates immediately on input change
  - Test with random marker values
  - _Requirements: 4.5, 5.3_

- [x] 5. Integration with consumption workflow
  - Integrate calculator into ConsumableQuantityModal
  - Add conditional rendering based on cable detection
  - Update API calls to include marker data
  - _Requirements: 1.2, 2.1, 2.5, 2.6_

- [x] 5.1 Import and integrate CableMeasurementCalculator
  - Add cable detection logic using isCableUnit()
  - Conditionally render calculator vs standard quantity input
  - Pass appropriate props to calculator (mode='consumption')
  - _Requirements: 1.2, 2.1_

- [x] 5.2 Update consumption submission logic
  - Modify form submission to handle marker data
  - Update API call to include start_marker and end_marker
  - Use calculated length as quantity
  - Handle validation errors from calculator
  - Show success message with marker information
  - _Requirements: 2.5, 2.6_

- [x] 5.3 Write property test for consumption stock invariant
  - **Property 6: Consumption Stock Invariant**
  - **Validates: Requirements 2.6**
  - Test that stock decreases by calculated length
  - Test with random initial stock and marker values
  - _Requirements: 2.6_

- [x] 5.4 Write integration test for consumption flow
  - Test end-to-end consumption with cable markers
  - Verify calculator appears for cable items
  - Verify standard input appears for non-cable items
  - Verify stock updates correctly
  - _Requirements: 1.2, 2.5, 2.6_

- [x] 6. Integration with return workflow
  - Integrate calculator into ReturnableItemsList
  - Add segment validation and overlap detection
  - Update API calls to include segment data
  - _Requirements: 1.2, 3.1, 3.5, 3.6, 7.1, 7.4_

- [x] 6.1 Update ReturnableItemsList component
  - Import and integrate CableMeasurementCalculator
  - Add cable detection for return items
  - Conditionally render calculator vs standard quantity input
  - Pass appropriate props to calculator (mode='return', maxReturnableLength)
  - Pass consumed markers to calculator for reference
  - _Requirements: 1.2, 3.1_

- [x] 6.2 Update return submission logic
  - Modify return form to handle segment data
  - Update API call to include segment_start and segment_end
  - Use calculated length as returned_quantity
  - Handle overlap validation errors from backend
  - Show success message with segment information
  - _Requirements: 3.5, 3.6, 7.1_

- [x] 6.3 Add visual segment display
  - Show previously returned segments for each consumption
  - Display segment ranges in a clear format
  - Highlight overlapping segments in validation errors
  - Add tooltip showing consumed range vs returned segments
  - _Requirements: 7.5, 8.1_

- [x] 6.4 Write property test for return stock invariant
  - **Property 9: Return Stock Invariant**
  - **Validates: Requirements 3.6**
  - Test that stock increases by calculated return length
  - Test with random initial stock and segment values
  - _Requirements: 3.6_

- [x] 6.5 Write property test for return length constraint
  - **Property 7: Return Length Constraint**
  - **Validates: Requirements 3.4**
  - Test that returns exceeding consumed length are rejected
  - Test with random consumption and return values
  - _Requirements: 3.4_

- [x] 6.6 Write integration test for return flow
  - Test end-to-end return with cable segments
  - Test overlap detection (should fail)
  - Test non-overlapping segments (should succeed)
  - Verify stock updates correctly
  - _Requirements: 3.5, 3.6, 7.1, 7.4_

- [x] 7. Backward compatibility and legacy support
  - Ensure system handles legacy records without markers
  - Add conditional display logic for marker data
  - Test mixed scenarios (legacy + new records)
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 7.1 Implement legacy record handling
  - Add null checks for marker fields in all components
  - Display quantity-only for legacy consumption records
  - Allow quantity-based returns for legacy consumptions
  - Add visual indicator distinguishing legacy vs marker-based records
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 7.2 Write property tests for backward compatibility
  - **Property 16: Backward Compatibility - Display**
  - **Property 17: Backward Compatibility - Returns**
  - **Validates: Requirements 8.1, 8.2, 8.3**
  - Test display logic with null markers
  - Test return processing for legacy records
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 7.3 Write integration test for mixed scenarios
  - Test user with both legacy and marker-based consumptions
  - Test returning from legacy consumption (quantity-based)
  - Test returning from marker-based consumption (segment-based)
  - Verify correct behavior in both cases
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 8. Mobile responsiveness and accessibility
  - Ensure calculator works well on mobile devices
  - Add proper touch targets and keyboard support
  - Implement accessibility features (ARIA labels, screen reader support)
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 8.1 Implement mobile-specific optimizations
  - Add responsive CSS for calculator on small screens
  - Set inputMode="decimal" for numeric keyboards on mobile
  - Ensure touch targets are minimum 44x44px
  - Test on various mobile viewport sizes (320px+)
  - Add mobile-specific validation feedback
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 8.2 Implement accessibility features
  - Add ARIA labels to all calculator inputs
  - Add ARIA live regions for calculation results
  - Add ARIA alerts for validation errors
  - Ensure keyboard navigation works (Tab, Enter)
  - Add focus indicators for all interactive elements
  - Test with screen reader (NVDA/JAWS)
  - _Requirements: 9.1, 9.5_

- [x] 8.3 Write accessibility tests
  - Test keyboard navigation
  - Test ARIA labels presence
  - Test focus management
  - Test screen reader announcements
  - _Requirements: 9.1, 9.5_

- [x] 9. Internationalization and translations
  - Add all translation keys for calculator
  - Translate error messages and help text
  - Test language switching
  - _Requirements: 10.1, 10.3_

- [x] 9.1 Add translation keys
  - Add Spanish translations to `src/locales/es.json`
  - Add English translations to `src/locales/en.json`
  - Include all calculator labels, errors, warnings, and help text
  - Test translation key coverage
  - _Requirements: 10.1, 10.3_

- [x] 9.2 Write property test for internationalization
  - **Property 18: Internationalization Consistency**
  - **Validates: Requirements 10.1**
  - Test that all error messages exist in both languages
  - Test language switching updates all text
  - _Requirements: 10.1_

- [x] 10. Documentation and user guidance
  - Create user documentation for cable calculator
  - Add inline help and tooltips
  - Create admin guide for cable management
  - _Requirements: 10.3, 10.5_

- [x] 10.1 Create user documentation
  - Write user guide explaining marker system
  - Add screenshots of calculator interface
  - Provide examples of consumption and return workflows
  - Explain how to read cable markers
  - Document error messages and solutions
  - _Requirements: 10.3, 10.5_

- [x] 10.2 Add inline help features
  - Implement help modal with detailed explanation
  - Add tooltips to marker input fields
  - Add example text showing marker format
  - Create visual guide showing cable marker locations
  - _Requirements: 10.3, 10.5_

- [x] 11. Testing and quality assurance
  - Run all property-based tests
  - Run integration tests
  - Perform manual testing on various devices
  - Test edge cases and error scenarios
  - _Requirements: All_

- [x] 11.1 Execute comprehensive test suite
  - Run all unit tests (utilities, components)
  - Run all property-based tests (minimum 100 iterations each)
  - Run all integration tests (consumption, return, mixed)
  - Run accessibility tests
  - Verify test coverage >80%
  - _Requirements: All_

- [ ] 11.2 Perform manual testing
  - Test on desktop browsers (Chrome, Firefox, Safari, Edge)
  - Test on mobile devices (iOS Safari, Android Chrome)
  - Test with various cable consumables
  - Test error scenarios (invalid markers, overlaps, stock limits)
  - Test backward compatibility with legacy records
  - Test language switching
  - _Requirements: All_

- [ ] 11.3 User acceptance testing
  - Conduct UAT with actual users
  - Gather feedback on calculator usability
  - Test with real cable inventory data
  - Verify marker system matches physical cables
  - Document any issues or improvement suggestions
  - _Requirements: All_

- [ ] 12. Deployment and monitoring
  - Deploy database migrations
  - Deploy backend changes
  - Deploy frontend changes with feature flag
  - Monitor for errors and performance issues
  - _Requirements: All_

- [ ] 12.1 Deploy to staging environment
  - Run database migrations on staging
  - Deploy backend API changes
  - Deploy frontend with feature flag disabled
  - Verify deployment successful
  - Run smoke tests
  - _Requirements: All_

- [ ] 12.2 Enable feature flag for testing
  - Enable calculator for admin users only
  - Test all workflows in staging
  - Monitor logs for errors
  - Verify performance metrics
  - Gather initial feedback
  - _Requirements: All_

- [ ] 12.3 Production deployment
  - Run database migrations on production
  - Deploy backend and frontend to production
  - Enable feature flag for all users
  - Monitor error rates and performance
  - Set up alerts for critical issues
  - _Requirements: All_

- [ ] 12.4 Post-deployment monitoring
  - Monitor API response times
  - Track calculator usage metrics
  - Monitor error rates for marker validation
  - Track overlap detection frequency
  - Gather user feedback
  - Document any issues for future improvements
  - _Requirements: All_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
