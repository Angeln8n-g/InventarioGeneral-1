# Implementation Plan

- [x] 1. Database setup and migrations

  - Create `electronic_devices` table with all specification fields
  - Add indexes for performance optimization
  - Create migration script for database setup
  - _Requirements: 1.3, 1.4, 9.2_

- [x] 2. TypeScript types and interfaces

  - [x] 2.1 Define ElectronicDevice interface in types/database.ts

    - Add basic fields (brand, model)

    - Define ElectronicDeviceWithDetails extended interface
    - Add CreateElectronicDeviceInput and UpdateElectronicDeviceInput types
    - Define ElectronicCategory type with all categories
    - _Requirements: 1.4, 8.1, 8.2_

  - [x] 2.2 Add electronics-specific types

    - Create types/electronics.ts file
    - Define filter types for electronics
    - Add validation schemas
    - _Requirements: 2.4, 9.1_

- [x] 3. Backend API implementation

  - [x] 3.1 Create GET /api/admin/electronics route

    - Implement query parameter handling (status, category, search)
    - Join electronic_devices with tool_instances and item_types
    - Add pagination support
    - Include current loan information if exists
    - Apply permission checks (ADMIN_MANAGE_TOOLS)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.5_

  - [x] 3.2 Create POST /api/admin/electronics route

    - Validate input data
    - Create item_type if needed
    - Create tool_instance with generated QR code
    - Create electronic_device with brand and model
    - Register audit log entry
    - Return created device with all details
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3_

  - [x] 3.3 Create GET /api/admin/electronics/[id] route

    - Fetch device with all specifications
    - Include tool_instance and item_type details
    - Include current loan if exists
    - Apply permission checks
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.4 Create PUT /api/admin/electronics/[id] route

    - Validate update data
    - Update tool_instance fields
    - Update electronic_device (brand, model)
    - Handle status changes with validations
    - Register audit log with old and new values
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.5 Create DELETE /api/admin/electronics/[id] route

    - Check for active loans before deletion
    - Delete electronic_device record (cascade will handle tool_instance)
    - Register audit log entry
    - Return confirmation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Frontend components - Base UI

  - [x] 4.1 Create ElectronicDeviceCard component

    - Display device icon based on category
    - Show name, category, brand, model, and serial number
    - Add status badge with appropriate colors
    - Include quick action buttons
    - Make responsive for mobile and desktop
    - _Requirements: 2.1, 2.2, 8.4_

  - [x] 4.2 Create ElectronicDeviceForm component

    - Build form with basic fields (name, category, description, brand, model, serial number)
    - Implement validation with error messages
    - Add category selector with all electronic categories
    - Include status selector
    - Add condition notes textarea
    - Implement form submission handling
    - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 8.1, 8.2, 9.1, 9.3, 9.4, 9.5_

  - [x] 4.3 Create ElectronicDeviceModal component
    - Display all device information in organized sections
    - Show QR code for device
    - Include current loan information if exists
    - Add action buttons (edit, delete, view loan)
    - Implement navigation between devices
    - Add confirmation dialogs for destructive actions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Frontend pages - Main views

  - [x] 5.1 Create /admin/electronics page

    - Implement grid layout for device cards
    - Add statistics cards (total, available, loaned, maintenance)
    - Create filter section (search, category, status)
    - Show active filters with clear buttons
    - Add "Create New Device" button
    - Implement loading and empty states
    - Handle navigation to device details
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3_

  - [x] 5.2 Create /admin/electronics/new page

    - Use ElectronicDeviceForm component
    - Implement form submission to POST API
    - Add success/error notifications
    - Redirect to list after successful creation
    - Add cancel button to return to list
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 5.3 Create /admin/electronics/[id] page
    - Use ElectronicDeviceForm component in edit mode
    - Pre-populate form with existing data
    - Implement update submission to PUT API
    - Add delete functionality with confirmation
    - Show success/error notifications
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Dashboard integration




  - [x] 6.1 Add electronics statistics to dashboard


    - Query total electronics count
    - Add electronics card to stats grid
    - Include icon and color scheme
    - Make card clickable to navigate to electronics page
    - _Requirements: 10.1, 10.2_

  - [x] 6.2 Add electronics to quick actions


    - Add "Manage Electronics" button in quick actions section
    - Use appropriate icon and styling
    - Link to /admin/electronics
    - _Requirements: 10.1, 10.3_


  - [x] 6.3 Update navigation menu


    - Add "Electronics" link in admin navigation
    - Position appropriately in menu structure
    - Add icon for visual identification
    - _Requirements: 10.1, 10.3, 10.4_

- [x] 7. Loan system integration




  - [x] 7.1 Ensure electronics appear in loan system



    - Verify tool_instances with electronic category are loanable
    - Test QR code scanning for electronics
    - Verify status updates when loaned/returned
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_




  - [ ] 7.2 Add electronics-specific loan information
    - Display device brand and model in loan details
    - Show device category in loan history
    - Include device condition notes in loan interface
    - _Requirements: 6.3, 7.5_

- [x] 8. Internationalization



  - [x] 8.1 Add Spanish translations


    - Add all electronics-related keys to LanguageContext
    - Include category names, field labels, messages
    - Add validation error messages
    - _Requirements: All requirements (user-facing text)_


  - [ ] 8.2 Add English translations
    - Add all electronics-related keys to LanguageContext
    - Ensure consistency with existing translations
    - _Requirements: All requirements (user-facing text)_

- [x] 9. Error handling and validation



  - [x] 9.1 Implement frontend validation




    - Add required field validation
    - Validate numeric fields (positive numbers)
    - Add format validation for specific fields
    - Show inline error messages
    - _Requirements: 9.1, 9.3, 9.4, 9.5_




  - [x] 9.2 Implement backend validation


    - Validate all input data types
    - Check for duplicate QR codes
    - Validate business rules (e.g., no delete with active loan)
    - Return appropriate error responses
    - _Requirements: 5.2, 9.1, 9.2, 9.3, 9.4, 9.5_




  - [x] 9.3 Add error boundaries and fallbacks


    - Implement error boundary for electronics pages
    - Add fallback UI for errors
    - Log errors appropriately

    - _Requirements: All requirements (error handling)_



- [x] 10. Testing and quality assurance





  - [x] 10.1 Write API endpoint tests


    - Test all CRUD operations
    - Test permission checks
    - Test validation logic



    - Test error scenarios
    - _Requirements: All backend requirements_


  - [x] 10.2 Write component tests


    - Test ElectronicDeviceCard rendering



    - Test ElectronicDeviceForm validation
    - Test ElectronicDeviceModal interactions
    - _Requirements: All frontend requirements_


  - [x] 10.3 Perform manual testing


    - Test complete create/edit/delete flows
    - Test filtering and search
    - Test loan integration
    - Test on different screen sizes


    - Test in dark mode
    - Verify accessibility
    - _Requirements: All requirements_

- [ ] 11. Documentation and polish

  - [ ] 11.1 Add inline code documentation

    - Document complex functions

    - Add JSDoc comments for components
    - Document API endpoints
    - _Requirements: All requirements_

  - [ ] 11.2 Create user documentation


    - Write guide for managing electronics
    - Document field meanings and requirements
    - Add screenshots of key features
    - _Requirements: All requirements_

  - [ ] 11.3 Final UI polish
    - Verify consistent styling with existing admin pages
    - Optimize loading states
    - Add smooth transitions
    - Verify responsive design
    - _Requirements: 10.4, All UI requirements_
