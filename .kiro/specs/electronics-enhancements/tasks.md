# Implementation Plan

- [ ] 1. Database schema and migrations
- [ ] 1.1 Create migration for memory capacity fields
  - Add `memory_capacity` and `memory_unit` columns to `electronic_devices` table
  - Add CHECK constraint for memory_unit values
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Create classrooms table migration
  - Create `classrooms` table with all required fields
  - Add UNIQUE constraint on (name, location)
  - Add CHECK constraint for status values
  - Create indexes on status and location
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 1.3 Create device_assignments table migration
  - Create `device_assignments` table with foreign keys
  - Add UNIQUE constraint for active assignments per device
  - Create indexes on classroom_id and electronic_device_id
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 1.4 Create device_combinations table migration
  - Create `device_combinations` table with foreign keys
  - Add CHECK constraint to prevent self-combinations
  - Add UNIQUE constraint for active combinations
  - Create indexes on both device ID columns
  - _Requirements: 4.5, 4.6_

- [ ] 1.5 Apply all migrations to database
  - Run migrations in order
  - Verify schema changes
  - Test rollback scripts
  - _Requirements: All database-related requirements_

- [ ] 2. Update type definitions and validation
- [ ] 2.1 Extend electronic device types
  - Add memory_capacity and memory_unit to ElectronicDevice interface
  - Update CreateElectronicDeviceInput and UpdateElectronicDeviceInput
  - Add memory validation function
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 Create classroom types
  - Define Classroom interface
  - Define CreateClassroomInput and UpdateClassroomInput
  - Define ClassroomWithDeviceCount interface
  - Create classroom validation function
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 2.3 Create device assignment types
  - Define DeviceAssignment interface
  - Define DeviceAssignmentWithDetails interface
  - Define CreateDeviceAssignmentInput
  - Create assignment validation function
  - _Requirements: 4.1, 4.3, 5.1_

- [ ] 2.4 Create device combination types
  - Define DeviceCombination interface
  - Define DeviceCombinationWithDetails interface
  - Define CreateDeviceCombinationInput
  - Create combination validation function
  - _Requirements: 4.5, 4.6_

- [ ] 3. Implement database operations layer
- [ ] 3.1 Extend electronic device operations
  - Update create operation to handle memory fields
  - Update update operation to handle memory fields
  - Update getAll to include memory in queries
  - Update getById to include memory in queries
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3.2 Implement classroom operations
  - Create classroomOperations.create()
  - Create classroomOperations.getAll() with device counts
  - Create classroomOperations.getById()
  - Create classroomOperations.update()
  - Create classroomOperations.delete() with assignment check
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3.3 Implement device assignment operations
  - Create assignmentOperations.create() with validation
  - Create assignmentOperations.getAll() with filters
  - Create assignmentOperations.getById()
  - Create assignmentOperations.getByClassroom()
  - Create assignmentOperations.getByDevice()
  - Create assignmentOperations.remove() (soft delete)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

- [ ] 3.4 Implement device combination operations
  - Create combinationOperations.create() with validation
  - Create combinationOperations.getAll()
  - Create combinationOperations.getById()
  - Create combinationOperations.getByClassroom()
  - Create combinationOperations.remove() (soft delete)
  - _Requirements: 4.5, 4.6, 4.7, 4.8_

- [ ] 4. Create API endpoints for classrooms
- [ ] 4.1 Implement GET /api/admin/classrooms
  - List all classrooms with device counts
  - Support filtering and sorting
  - Include summary statistics
  - Add authentication and authorization
  - _Requirements: 3.1, 3.8_

- [ ] 4.2 Implement POST /api/admin/classrooms
  - Validate input data
  - Check name uniqueness per location
  - Create classroom record
  - Create audit log
  - Return created classroom
  - _Requirements: 3.2, 3.3_

- [ ] 4.3 Implement GET /api/admin/classrooms/[id]
  - Fetch classroom by ID
  - Include device count and assignments
  - Handle not found errors
  - _Requirements: 3.1, 3.8_

- [ ] 4.4 Implement PUT /api/admin/classrooms/[id]
  - Validate input data
  - Check name uniqueness if name/location changed
  - Update classroom record
  - Create audit log
  - Return updated classroom
  - _Requirements: 3.4_

- [ ] 4.5 Implement DELETE /api/admin/classrooms/[id]
  - Check for assigned devices
  - Prevent deletion if devices exist
  - Delete classroom if no devices
  - Create audit log
  - _Requirements: 3.5, 3.6, 3.7_

- [x] 5. Create API endpoints for device assignments


- [x] 5.1 Implement GET /api/admin/device-assignments


  - List all assignments with filters
  - Support filtering by classroom, device, status
  - Include device and classroom details
  - Add pagination support
  - _Requirements: 4.1, 4.10_

- [x] 5.2 Implement POST /api/admin/device-assignments

  - Validate device and classroom exist
  - Check device not already assigned
  - Create assignment record
  - Update device status/location
  - Create audit log
  - _Requirements: 4.3, 4.9, 5.1_

- [x] 5.3 Implement GET /api/admin/device-assignments/[id]


  - Fetch assignment by ID
  - Include full device and classroom details
  - Include user information
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 5.4 Implement DELETE /api/admin/device-assignments/[id]

  - Soft delete assignment (set removed_date)
  - Record removing administrator
  - Preserve historical record
  - Create audit log
  - _Requirements: 4.4, 5.2_

- [x] 5.5 Implement GET /api/admin/device-assignments/by-classroom/[classroomId]


  - Fetch all assignments for a classroom
  - Include current and historical assignments
  - Include device details
  - _Requirements: 4.2, 5.4_

- [x] 5.6 Implement GET /api/admin/device-assignments/by-device/[deviceId]


  - Fetch assignment history for a device
  - Include current and past assignments
  - Include classroom and user details
  - _Requirements: 5.3, 5.5_

- [x] 6. Create API endpoints for device combinations


- [x] 6.1 Implement GET /api/admin/device-combinations


  - List all combinations
  - Support filtering by classroom
  - Include both device details
  - _Requirements: 4.7_

- [x] 6.2 Implement POST /api/admin/device-combinations

  - Validate both devices exist
  - Validate both in same classroom
  - Create combination record
  - Create audit log
  - _Requirements: 4.5, 4.6_

- [x] 6.3 Implement GET /api/admin/device-combinations/[id]


  - Fetch combination by ID
  - Include full device details
  - Include user information
  - _Requirements: 4.7_

- [x] 6.4 Implement DELETE /api/admin/device-combinations/[id]

  - Soft delete combination
  - Preserve device assignments
  - Create audit log
  - _Requirements: 4.8_

- [x] 6.5 Implement GET /api/admin/device-combinations/by-classroom/[classroomId]


  - Fetch all combinations in a classroom
  - Include device details
  - _Requirements: 4.7_

- [x] 7. Update electronics API for memory capacity


- [x] 7.1 Update POST /api/admin/electronics

  - Add memory capacity validation
  - Store memory fields in database
  - Include memory in response
  - _Requirements: 1.1, 1.2_

- [x] 7.2 Update PUT /api/admin/electronics/[id]

  - Add memory capacity validation
  - Update memory fields in database
  - Include memory in response
  - _Requirements: 1.1, 1.2_

- [x] 7.3 Update GET /api/admin/electronics

  - Include memory capacity in device list
  - Support filtering by memory capacity
  - _Requirements: 1.3, 1.4_

- [x] 7.4 Update GET /api/admin/electronics/[id]

  - Include memory capacity in device details
  - Format memory display properly
  - _Requirements: 1.3, 1.4_

- [x] 8. Create edit modal component


- [x] 8.1 Create EditElectronicDeviceModal component

  - Create modal structure with form
  - Add all device fields (name, category, brand, model, serial, status, condition)
  - Add memory capacity fields (conditional on category)
  - Implement form validation
  - Handle form submission
  - Handle cancel action
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 8.2 Integrate edit modal with electronics list

  - Add edit button to each device card
  - Open modal on edit click
  - Pass device data to modal
  - Refresh list after successful edit
  - _Requirements: 2.1, 2.7_

- [x] 8.3 Add memory capacity fields to device forms

  - Show memory fields for Laptops, Tablets, Smartphones
  - Hide memory fields for other categories
  - Validate memory input
  - Format memory display
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 9. Create classroom management page

- [x] 9.1 Create classroom list component

  - Display all classrooms in a table/grid
  - Show name, location, status, device count
  - Add search and filter functionality
  - Add sorting capability
  - _Requirements: 3.1, 3.8_

- [x] 9.2 Create classroom form component

  - Add fields for name, location, status, description
  - Implement validation
  - Handle create and edit modes
  - Show validation errors
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 9.3 Create classroom detail view

  - Show classroom information
  - Display assigned devices
  - Show assignment history
  - Add edit and delete actions
  - _Requirements: 3.8, 5.4_

- [x] 9.4 Implement classroom CRUD operations in UI

  - Wire up create classroom flow
  - Wire up edit classroom flow
  - Wire up delete classroom flow with confirmation
  - Handle error cases (duplicate name, has devices)
  - Show success/error messages
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_





- [x] 10. Create device assignment page


- [x] 10.1 Create assignment page layout

  - Create two-column layout (classrooms | devices)
  - Add classroom selector
  - Display unassigned devices list

  - Display assigned devices for selected classroom
  - _Requirements: 4.1, 4.2_

- [x] 10.2 Implement device assignment UI

  - Add assign button to unassigned devices
  - Show assignment confirmation dialog
  - Handle assignment creation

  - Update UI after assignment
  - Show success/error messages
  - _Requirements: 4.3, 4.9_

- [x] 10.3 Implement device removal UI

  - Add remove button to assigned devices

  - Show removal confirmation dialog
  - Handle assignment removal
  - Update UI after removal
  - _Requirements: 4.4_


- [x] 10.4 Add filtering and search

  - Filter by classroom
  - Filter by device type
  - Filter by assignment status
  - Search devices by name/serial
  - _Requirements: 4.10_

- [x] 11. Create device combination UI



- [x] 11.1 Add combination creation UI

  - Add "Combine" button for assigned devices
  - Show device selection dialog
  - Validate same classroom
  - Create combination
  - Show visual indicator of pairing

  - _Requirements: 4.5, 4.6, 4.7_

- [x] 11.2 Display device combinations

  - Show paired devices together
  - Add visual link/indicator
  - Display combination type
  - Show combination notes
  - _Requirements: 4.7_

- [x] 11.3 Implement combination removal

  - Add "Unlink" button to combinations
  - Show confirmation dialog
  - Remove combination
  - Preserve individual assignments
  - Update UI
  - _Requirements: 4.8_

- [x] 12. Implement assignment history views



- [x] 12.1 Add history to device details


  - Show current assignment
  - Display assignment history table
  - Include dates, classrooms, administrators
  - _Requirements: 5.3, 5.5_

- [x] 12.2 Add history to classroom details


  - Show current devices
  - Display historical assignments
  - Include dates, devices, administrators
  - _Requirements: 5.4, 5.5_

- [x] 13. Create classroom equipment reports


- [x] 13.1 Create report generation endpoint


  - Implement GET /api/admin/reports/classroom-equipment
  - Generate summary per classroom
  - Include device counts by category
  - Identify incomplete workstations
  - Calculate equipment values (if available)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13.2 Create report UI component


  - Display report data in tables/charts
  - Add export to PDF functionality
  - Add export to Excel functionality
  - Add filtering and date range selection
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Add navigation and permissions



- [x] 15.1 Add navigation menu items


  - Add "Aulas" menu item for classroom management
  - Add "Asignaciones" menu item for device assignments
  - Add "Reportes de Equipos" menu item
  - Update admin navigation structure
  - _Requirements: All UI requirements_

- [x] 15.2 Implement permission checks


  - Add permission checks to all new pages
  - Restrict API endpoints to admin users
  - Show/hide UI elements based on permissions
  - _Requirements: All requirements (security)_

- [x] 16. Documentation and polish





- [x] 16.1 Update user documentation


  - Document memory capacity feature
  - Document classroom management
  - Document device assignment workflow
  - Document device combination workflow
  - Document equipment reports
  - _Requirements: All requirements_



- [ ] 16.2 Add loading states and error handling
  - Add loading spinners to all async operations
  - Implement error boundaries
  - Add retry logic for failed requests


  - Show user-friendly error messages
  - _Requirements: All requirements (UX)_

- [x] 16.3 Add success notifications





  - Show toast on successful create/update/delete
  - Show confirmation dialogs for destructive actions
  - Add undo functionality where appropriate
  - _Requirements: All requirements (UX)_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
