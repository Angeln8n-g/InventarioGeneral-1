# Implementation Plan: Dashboard Modals - Phase 2

## Overview

This implementation plan breaks down the Phase 2 dashboard modals feature into discrete, manageable tasks. Each task builds incrementally on previous work, following test-driven development principles where appropriate.

**Prerequisites**: Phase 1 (Loan Details Modal) must be completed and working.

---

## Task List

- [x] 1. Create shared modal components and utilities





  - Create reusable scanner component for modals
  - Create form validation utilities for modal forms
  - Create success/error notification components for modals
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 2. Implement Request Materials Modal





  - [x] 2.1 Create RequestMaterialsModal component structure


    - Set up modal with Dialog base component
    - Create modal header with title and close button
    - Implement ESC key handler
    - Add focus trap functionality
    - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.2 Implement main view with action options


    - Create "Scan QR" button with icon
    - Create "Browse List" button with icon
    - Add manual code entry input field
    - Implement view state management (main/scan/browse)
    - _Requirements: 1.2, 1.3, 1.4_


  - [x] 2.3 Implement scanner view

    - Integrate scanner component
    - Handle camera permissions
    - Process scanned QR codes
    - Display scan feedback (success/error)
    - Implement cancel/back button
    - _Requirements: 1.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_


  - [x] 2.4 Implement browse list view
    - Fetch available materials from API
    - Display materials in searchable list
    - Implement real-time search filtering
    - Show material details (name, description, stock)
    - Handle loading and error states
    - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3_


  - [x] 2.5 Implement quantity selection

    - Show quantity input when material is selected
    - Validate quantity (positive number, within stock)
    - Display current stock availability
    - Show preview of request
    - _Requirements: 1.6, 5.9, 8.2_



  - [x] 2.6 Implement request submission
    - Create submit handler
    - Disable button during submission
    - Call API endpoint
    - Handle success response
    - Handle error response
    - Update dashboard on success
    - _Requirements: 1.7, 1.8, 1.10, 7.6, 7.7, 10.1, 10.2, 10.9_

  - [x] 2.7 Add mobile responsiveness

    - Adapt layout for mobile screens
    - Optimize scanner for mobile
    - Ensure touch targets are adequate
    - Test on various screen sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 2.8 Add accessibility features
    - Implement ARIA labels


    - Test with screen reader
    - Verify keyboard navigation
    - Ensure focus management
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [-] 3. Implement Return Materials Modal

  - [x] 3.1 Create ReturnMaterialsModal component structure

    - Set up modal with Dialog base component
    - Create modal header

    - Implement ESC key handler
    - Add focus trap functionality
    - _Requirements: 2.1, 5.1, 5.2, 5.3, 5.4, 5.5_


  - [ ] 3.2 Fetch and display returnable materials
    - Call API to get user's consumed materials

    - Display list of materials available for return
    - Show current quantities
    - Handle empty state (no materials to return)
    - _Requirements: 2.2, 2.10, 7.1, 7.2_


  - [ ] 3.3 Implement return form
    - Create material selection dropdown/list

    - Add quantity input with validation
    - Add return reason textarea
    - Validate return quantity <= available quantity
    - Show form preview
    - _Requirements: 2.3, 2.4, 2.5, 5.9, 8.2_


  - [ ] 3.4 Implement return submission
    - Create submit handler

    - Disable button during submission
    - Call API endpoint
    - Handle success response
    - Handle error response
    - Update dashboard on success

    - _Requirements: 2.6, 2.7, 2.9, 7.6, 7.7, 10.1, 10.9_

  - [ ] 3.5 Add mobile responsiveness
    - Adapt layout for mobile screens
    - Optimize form for mobile input


    - Ensure touch targets are adequate
    - Test on various screen sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7, 9.8_

  - [ ]* 3.6 Add accessibility features
    - Implement ARIA labels
    - Test with screen reader
    - Verify keyboard navigation
    - Ensure focus management
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_


- [-] 4. Implement Request Tools Modal

  - [x] 4.1 Create RequestToolsModal component structure

    - Set up modal with Dialog base component
    - Create modal header
    - Implement ESC key handler

    - Add focus trap functionality
    - _Requirements: 3.1, 5.1, 5.2, 5.3, 5.4, 5.5_


  - [ ] 4.2 Implement main view with action options
    - Create "Scan QR" button
    - Create "Browse List" button

    - Add manual code entry input
    - Implement view state management
    - _Requirements: 3.2, 3.3, 3.4_


  - [ ] 4.3 Implement scanner view
    - Integrate scanner component
    - Handle camera permissions
    - Process scanned QR codes
    - Display scan feedback

    - Implement cancel/back button
    - _Requirements: 3.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.4 Implement browse list view

    - Fetch available tools from API
    - Display tools with status indicators
    - Implement real-time search filtering
    - Show tool details (name, description, status)
    - Filter to show only available tools

    - Handle loading and error states
    - _Requirements: 3.4, 3.5, 7.1, 7.2, 7.3_


  - [ ] 4.5 Implement loan duration selection
    - Show loan duration options when tool is selected
    - Display default duration
    - Allow custom duration input
    - Validate duration (positive number, within limits)

    - Show preview of loan
    - _Requirements: 3.6, 5.9, 8.2_


  - [ ] 4.6 Implement loan creation
    - Create submit handler
    - Disable button during submission
    - Call API endpoint
    - Handle success response


    - Handle error response
    - Update active loans section on success

    - _Requirements: 3.7, 3.8, 3.10, 7.6, 7.7, 10.1, 10.9_

  - [ ] 4.7 Add mobile responsiveness
    - Adapt layout for mobile screens
    - Optimize scanner for mobile
    - Ensure touch targets are adequate
    - Test on various screen sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_


  - [ ]* 4.8 Add accessibility features
    - Implement ARIA labels
    - Test with screen reader
    - Verify keyboard navigation
    - Ensure focus management
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_


- [-] 5. Implement Return Tools Modal

  - [x] 5.1 Create ReturnToolsModal component structure

    - Set up modal with Dialog base component
    - Create modal header
    - Implement ESC key handler
    - Add focus trap functionality
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5_


  - [ ] 5.2 Fetch and display loaned tools
    - Call API to get user's active loans
    - Display list of tools on loan
    - Show loan details (date, due date)
    - Handle empty state (no tools to return)
    - _Requirements: 4.2, 4.10, 7.1, 7.2_



  - [ ] 5.3 Implement return form
    - Create tool selection dropdown/list
    - Add condition assessment options
    - Add notes textarea
    - Show loan details for selected tool
    - Show form preview
    - _Requirements: 4.3, 4.4, 4.5, 5.9, 8.2_

  - [x] 5.4 Implement return submission

    - Create submit handler
    - Disable button during submission
    - Call API endpoint
    - Handle success response
    - Handle error response
    - Update active loans section on success
    - _Requirements: 4.6, 4.7, 4.9, 7.6, 7.7, 10.1, 10.9_


  - [ ] 5.5 Add mobile responsiveness


    - Adapt layout for mobile screens
    - Optimize form for mobile input
    - Ensure touch targets are adequate
    - Test on various screen sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7, 9.8_

  - [ ]* 5.6 Add accessibility features
    - Implement ARIA labels
    - Test with screen reader
    - Verify keyboard navigation
    - Ensure focus management
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [-] 6. Integrate modals into dashboard

  - [x] 6.1 Update dashboard action cards

    - Modify "Solicitar Materiales" card to open RequestMaterialsModal
    - Modify "Devolver Materiales" card to open ReturnMaterialsModal
    - Modify "Solicitar Herramientas" card to open RequestToolsModal
    - Modify "Devolver Herramientas" card to open ReturnToolsModal
    - _Requirements: 1.1, 2.1, 3.1, 4.1_


  - [ ] 6.2 Implement modal state management
    - Create state for each modal (open/closed)
    - Create handlers for opening/closing modals
    - Ensure only one modal can be open at a time
    - _Requirements: 5.1, 5.2, 5.3, 5.4_


  - [ ] 6.3 Implement dashboard refresh logic
    - Refresh active loans after tool request/return
    - Refresh relevant data after material request/return
    - Implement optimistic updates where appropriate
    - Handle refresh errors gracefully
    - _Requirements: 1.8, 2.7, 3.7, 4.8, 7.7_


  - [x] 6.4 Add loading and error states

    - Show loading indicators during API calls
    - Display error messages appropriately
    - Implement retry mechanisms
    - _Requirements: 7.2, 7.8, 7.9, 10.1, 10.9_

- [ ] 7. Performance optimization
  - [ ] 7.1 Implement lazy loading
    - Lazy load scanner component
    - Lazy load modal components
    - Optimize bundle size
    - _Requirements: 7.1, 7.10_

  - [ ] 7.2 Optimize API calls
    - Implement request debouncing for search
    - Cache frequently accessed data
    - Minimize redundant API calls
    - _Requirements: 7.3, 7.7, 10.7_

  - [ ] 7.3 Optimize rendering
    - Implement React.memo where appropriate
    - Optimize re-renders
    - Profile and fix performance bottlenecks
    - _Requirements: 7.1, 7.4, 7.10_

- [ ]* 8. Testing and validation
  - [ ]* 8.1 Test Request Materials Modal
    - Test scanner functionality
    - Test browse and search
    - Test form validation
    - Test submission and error handling
    - Test mobile responsiveness
    - _Requirements: All Requirement 1 criteria_

  - [ ]* 8.2 Test Return Materials Modal
    - Test material selection
    - Test form validation
    - Test submission and error handling
    - Test mobile responsiveness
    - _Requirements: All Requirement 2 criteria_

  - [ ]* 8.3 Test Request Tools Modal
    - Test scanner functionality
    - Test browse and search
    - Test form validation
    - Test submission and error handling
    - Test mobile responsiveness
    - _Requirements: All Requirement 3 criteria_

  - [ ]* 8.4 Test Return Tools Modal
    - Test tool selection
    - Test form validation
    - Test submission and error handling
    - Test mobile responsiveness
    - _Requirements: All Requirement 4 criteria_

  - [ ]* 8.5 Test integration
    - Test modal state management
    - Test dashboard refresh logic
    - Test concurrent operations
    - Test error scenarios
    - _Requirements: All Requirement 5 and 10 criteria_

  - [ ]* 8.6 Accessibility testing
    - Test with screen readers
    - Test keyboard navigation
    - Verify ARIA labels
    - Test focus management
    - _Requirements: All Requirement 8 criteria_

  - [ ]* 8.7 Performance testing
    - Measure modal open times
    - Measure API response times
    - Test on slow networks
    - Test on older devices
    - _Requirements: All Requirement 7 criteria_

- [ ] 9. Documentation and cleanup
  - [ ] 9.1 Update component documentation
    - Document new modal components
    - Add usage examples
    - Document props and interfaces
    - _Requirements: All requirements_

  - [ ] 9.2 Update user documentation
    - Create user guide for new modals
    - Add screenshots/videos
    - Document keyboard shortcuts
    - _Requirements: All requirements_

  - [ ] 9.3 Code cleanup
    - Remove unused code
    - Refactor duplicated logic
    - Improve code comments
    - Run linter and fix issues
    - _Requirements: All requirements_

  - [ ] 9.4 Create migration guide
    - Document changes from Phase 1
    - Provide rollback instructions if needed
    - Document any breaking changes
    - _Requirements: All requirements_

---

## Implementation Notes

### Incremental Approach
- Implement one modal at a time
- Test thoroughly before moving to next modal
- Get user feedback after each modal
- Be prepared to adjust based on feedback

### Code Reusability
- Maximize reuse of Dialog base component
- Create shared utilities for common patterns
- Extract reusable form components
- Share validation logic across modals

### Testing Strategy
- Test each modal independently
- Test integration with dashboard
- Test on multiple devices and browsers
- Prioritize critical user paths

### Rollback Plan
- Keep existing pages functional
- Allow easy toggle between modal and page-based flows
- Document rollback procedure
- Monitor user feedback closely

---

## Estimated Effort

- Task 1 (Shared Components): 4-6 hours
- Task 2 (Request Materials): 8-10 hours
- Task 3 (Return Materials): 6-8 hours
- Task 4 (Request Tools): 8-10 hours
- Task 5 (Return Tools): 6-8 hours
- Task 6 (Integration): 4-6 hours
- Task 7 (Performance): 3-4 hours
- Task 8 (Testing): 6-8 hours
- Task 9 (Documentation): 3-4 hours

**Total Estimated Effort**: 48-64 hours

---

## Success Criteria

- [ ] All modals open within 300ms
- [ ] All forms validate correctly
- [ ] All API calls handle errors gracefully
- [ ] All modals work on mobile devices
- [ ] All modals are keyboard accessible
- [ ] Dashboard updates without page reload
- [ ] User feedback is positive
- [ ] No critical bugs in production

---

**Status**: Draft - Pending Requirements Approval
**Created**: October 2025
**Version**: 1.0.0
