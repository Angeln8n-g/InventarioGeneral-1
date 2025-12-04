# Implementation Plan

- [ ] 1. Database schema and migrations
- [x] 1.1 Create device_categories table migration


  - Create `device_categories` table with all required fields
  - Add UNIQUE constraint on name
  - Add case-insensitive index on name
  - Create indexes on is_active
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 Create category_fields table migration


  - Create `category_fields` table with foreign keys
  - Add CHECK constraint for field_type values
  - Add UNIQUE constraint on (category_id, field_name)
  - Create indexes on category_id and is_custom
  - _Requirements: 4.1, 4.2, 5.1_

- [x] 1.3 Create device_custom_fields table migration


  - Create `device_custom_fields` table with foreign keys
  - Add UNIQUE constraint on (electronic_device_id, field_id)
  - Create indexes on electronic_device_id and field_id
  - _Requirements: 5.3, 5.4_

- [x] 1.4 Create migration script for existing categories


  - Populate device_categories with hardcoded categories
  - Create default field configurations (memory for laptops/tablets/smartphones)
  - Update item_types to reference new category IDs
  - _Requirements: All requirements (migration)_

- [x] 1.5 Apply all migrations to database



  - Run migrations in order
  - Verify schema changes
  - Test rollback scripts
  - _Requirements: All database-related requirements_

- [ ] 2. Update type definitions and validation
- [x] 2.1 Create device category types


  - Define DeviceCategory interface
  - Define DeviceCategoryWithCount interface
  - Define CreateDeviceCategoryInput and UpdateDeviceCategoryInput
  - Create category validation function
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 Create category field types


  - Define CategoryField interface
  - Define CreateCategoryFieldInput and UpdateCategoryFieldInput
  - Create field configuration validation function
  - _Requirements: 4.1, 4.2, 5.1_

- [x] 2.3 Create device custom field types


  - Define DeviceCustomField interface
  - Define DeviceCustomFieldWithDetails interface
  - Define CreateDeviceCustomFieldInput and UpdateDeviceCustomFieldInput
  - _Requirements: 5.3, 5.4_

- [x] 2.4 Create migration types


  - Define MigrationAnalysis interface
  - Define field mapping types
  - Create migration validation functions
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 3. Implement database operations layer
- [x] 3.1 Implement category operations


  - Create categoryOperations.create() with uniqueness check
  - Create categoryOperations.getAll() with device counts
  - Create categoryOperations.getById()
  - Create categoryOperations.update() with uniqueness check
  - Create categoryOperations.delete() with device check
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 3.2 Implement field configuration operations


  - Create fieldOperations.create() with validation
  - Create fieldOperations.getByCategory()
  - Create fieldOperations.getById()
  - Create fieldOperations.update()
  - Create fieldOperations.delete()
  - _Requirements: 4.1, 4.2, 5.1, 5.2_

- [x] 3.3 Implement custom field operations


  - Create customFieldOperations.create()
  - Create customFieldOperations.getByDevice()
  - Create customFieldOperations.update()
  - Create customFieldOperations.delete()
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 3.4 Implement migration operations



  - Create migrationOperations.analyzeCompatibility()
  - Create migrationOperations.migrateDevice()
  - Create migrationOperations.migrateBulk()
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Create API endpoints for categories
- [x] 4.1 Implement GET /api/admin/categories


  - List all categories with device counts
  - Support filtering and sorting
  - Add authentication and authorization
  - _Requirements: 1.1, 1.5_

- [x] 4.2 Implement POST /api/admin/categories

  - Validate input data
  - Check name uniqueness (case-insensitive)
  - Create category record
  - Create audit log
  - Return created category
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 4.3 Implement GET /api/admin/categories/[id]


  - Fetch category by ID
  - Include device count and field configurations
  - Handle not found errors
  - _Requirements: 1.1, 1.5_


- [x] 4.4 Implement PUT /api/admin/categories/[id]
  - Validate input data
  - Check name uniqueness if name changed
  - Update category record
  - Update all devices using category
  - Create audit log
  - Return updated category
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 4.5 Implement DELETE /api/admin/categories/[id]
  - Check for devices using category
  - Prevent deletion if devices exist
  - Delete category if no devices
  - Create audit log
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Create API endpoints for field configuration
- [x] 5.1 Implement GET /api/admin/categories/[id]/fields


  - List all fields for a category
  - Include standard and custom fields
  - Sort by display_order
  - _Requirements: 4.1, 5.3_


- [x] 5.2 Implement POST /api/admin/categories/[id]/fields
  - Validate field configuration
  - Check field name uniqueness within category
  - Create field record
  - Create audit log
  - _Requirements: 4.1, 4.2, 5.1, 5.2_

- [x] 5.3 Implement PUT /api/admin/categories/[id]/fields/[fieldId]



  - Validate field configuration
  - Update field record
  - Create audit log
  - _Requirements: 4.1, 4.2_

- [x] 5.4 Implement DELETE /api/admin/categories/[id]/fields/[fieldId]

  - Check if field is in use
  - Delete field and associated custom field values
  - Create audit log
  - _Requirements: 4.5_

- [ ] 6. Create API endpoints for device custom fields
- [x] 6.1 Implement GET /api/admin/electronics/[id]/custom-fields


  - Fetch all custom fields for a device
  - Include field definitions
  - _Requirements: 5.5_

- [x] 6.2 Implement POST /api/admin/electronics/[id]/custom-fields

  - Validate field value against field type
  - Create custom field value
  - _Requirements: 5.4_

- [x] 6.3 Implement PUT /api/admin/electronics/[id]/custom-fields/[fieldId]


  - Validate field value
  - Update custom field value
  - _Requirements: 5.4_

- [x] 6.4 Implement DELETE /api/admin/electronics/[id]/custom-fields/[fieldId]

  - Delete custom field value
  - _Requirements: 5.4_

- [ ] 7. Create API endpoints for migration
- [x] 7.1 Implement POST /api/admin/categories/migrate/analyze


  - Analyze compatibility between source and target categories
  - Return compatible and incompatible fields
  - Return device count
  - _Requirements: 8.1, 8.2_


- [x] 7.2 Implement POST /api/admin/categories/migrate/execute


  - Validate migration request
  - Migrate devices to new category
  - Preserve compatible field values
  - Handle incompatible fields
  - Create audit log
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 8. Update electronics API for dynamic categories
- [x] 8.1 Update POST /api/admin/electronics


  - Fetch category field configuration
  - Validate device data against category fields
  - Store custom field values
  - _Requirements: 4.3, 4.4, 5.4, 7.1, 7.2_

- [x] 8.2 Update PUT /api/admin/electronics/[id]


  - Fetch category field configuration
  - Validate device data against category fields
  - Update custom field values
  - Handle category changes
  - _Requirements: 4.3, 4.4, 5.4, 7.4_


- [x] 8.3 Update GET /api/admin/electronics
  - Include custom field values in device list
  - Support filtering by custom fields
  - _Requirements: 5.5_


- [x] 8.4 Update GET /api/admin/electronics/[id]
  - Include custom field values in device details
  - Include field definitions
  - _Requirements: 5.5_

- [ ] 9. Create category management page
- [x] 9.1 Create category list component




  - Display all categories in a table/grid
  - Show name, description, icon, device count
  - Add search and filter functionality
  - Add sorting capability
  - _Requirements: 1.1, 1.5_


- [x] 9.2 Create category form component

  - Add fields for name, description, icon
  - Implement validation
  - Handle create and edit modes
  - Show validation errors
  - Add icon selector
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 6.1, 6.2_

- [x] 9.3 Create category detail view


  - Show category information
  - Display field configurations
  - Show device count and list
  - Add edit and delete actions
  - _Requirements: 1.5, 2.1, 3.1_


- [x] 9.4 Implement category CRUD operations in UI

  - Wire up create category flow
  - Wire up edit category flow
  - Wire up delete category flow with confirmation
  - Handle error cases (duplicate name, has devices)
  - Show success/error messages
  - _Requirements: 1.2, 1.3, 1.4, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5_

- [-] 10. Create field configuration UI

- [x] 10.1 Create field configuration list

  - Display all fields for a category
  - Show field name, type, required status
  - Add sorting by display_order
  - Distinguish standard vs custom fields
  - _Requirements: 4.1, 5.3_


- [x] 10.2 Create field configuration form

  - Add fields for name, type, required, options
  - Implement validation
  - Handle different field types
  - Show options editor for select fields
  - _Requirements: 4.1, 4.2, 5.1, 5.2_




- [ ] 10.3 Implement field configuration CRUD in UI
  - Wire up create field flow
  - Wire up edit field flow
  - Wire up delete field flow
  - Handle validation errors
  - Show success/error messages
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.2_

- [ ] 11. Implement dynamic device forms
- [x] 11.1 Create dynamic form field renderer


  - Render fields based on category configuration
  - Support text, number, select, boolean types
  - Show/hide fields based on category
  - Apply required/optional rules
  - _Requirements: 4.3, 4.4, 4.5, 7.1_

- [x] 11.2 Implement category change handling


  - Detect category changes in forms
  - Preserve compatible field values
  - Clear incompatible field values
  - Show warning about data loss
  - _Requirements: 7.4_


- [ ] 11.3 Implement dynamic validation
  - Validate required fields based on category
  - Validate field types
  - Show clear error messages
  - Prevent submission with errors
  - _Requirements: 4.3, 7.2, 7.5_

- [x] 11.4 Update device creation form

  - Replace hardcoded fields with dynamic renderer
  - Load category configurations
  - Handle custom fields
  - _Requirements: 4.3, 4.4, 4.5, 5.3, 7.1_


- [ ] 11.5 Update device edit form
  - Replace hardcoded fields with dynamic renderer
  - Load existing custom field values
  - Handle category changes
  - _Requirements: 4.3, 4.4, 4.5, 5.3, 7.1, 7.4_


- [ ] 12. Implement custom field display
- [x] 12.1 Update device card component

  - Display custom fields alongside standard fields
  - Format values based on field type
  - _Requirements: 5.5_

- [x] 12.2 Update device details modal

  - Display custom fields in specifications section
  - Show field labels and formatted values

  - _Requirements: 5.5_

- [x] 12.3 Update device list page

  - Include custom fields in search/filter
  - Support sorting by custom fields
  - _Requirements: 5.5_

- [x] 13. Create category migration UI
- [x] 13.1 Create migration wizard component


  - Step 1: Select source category
  - Step 2: Select target category
  - Step 3: Review compatibility analysis
  - Step 4: Confirm and execute
  - _Requirements: 8.1, 8.2_


- [x] 13.2 Implement compatibility analysis display
  - Show compatible fields (green)
  - Show incompatible fields (red)
  - Show device count to migrate
  - Show warnings about data loss
  - _Requirements: 8.2_


- [x] 13.3 Implement migration execution
  - Execute migration with progress indicator
  - Handle errors gracefully
  - Show success/failure messages
  - Refresh device list after migration
  - _Requirements: 8.3, 8.4, 8.5_


- [ ] 14. Update icon system
- [x] 14.1 Create icon selector component

  - Display available icons in a grid
  - Support search/filter
  - Show icon preview
  - _Requirements: 6.1, 6.2_


- [x] 14.2 Update device displays with category icons





  - Show category icon in device cards
  - Show category icon in device details
  - Use default icon when none selected
  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 15. Add navigation and permissions
- [x] 15.1 Add navigation menu items

  - Add "Categorías" menu item for category management
  - Update admin navigation structure
  - _Requirements: All UI requirements_



- [x] 15.2 Implement permission checks





  - Add permission checks to all new pages
  - Restrict API endpoints to admin users
  - Show/hide UI elements based on permissions
  - _Requirements: All requirements (security)_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Documentation and polish


- [x] 17.1 Update user documentation


  - Document category management
  - Document field configuration
  - Document custom fields
  - Document migration process
  - _Requirements: All requirements_


- [x] 17.2 Add loading states and error handling




  - Add loading spinners to all async operations
  - Implement error boundaries
  - Add retry logic for failed requests
  - Show user-friendly error messages
  - _Requirements: All requirements (UX)_


- [x] 17.3 Add success notifications

  - Show toast on successful create/update/delete
  - Show confirmation dialogs for destructive actions
  - Add undo functionality where appropriate
  - _Requirements: All requirements (UX)_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
