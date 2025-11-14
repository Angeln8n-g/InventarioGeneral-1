# Implementation Plan

## Phase 1: Core Prototype - Tool Loan/Return System

- [x] 1. Set up project structure and development environment

  - Initialize Next.js project with TypeScript support
  - Configure Supabase client connection using existing environment variables
  - Set up basic project structure with pages, components, lib, and types directories
  - Configure Supabase authentication and database access
  - _Requirements: 1.1, 2.1_

- [x] 2. Implement core database schema and models

  - [x] 2.1 Create Supabase database schema and tables

    - Create users, item_types, tool_instances, and loans tables using Supabase SQL editor
    - Use VARCHAR(255) for qr_code field to store UUIDs securely
    - Add database indexes for performance optimization on qr_code lookups
    - Set up Row Level Security (RLS) policies for data access control
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [x] 2.2 Implement TypeScript types and Supabase client utilities

    - Create TypeScript interfaces for all database tables
    - Implement Supabase client wrapper functions for CRUD operations
    - Add UUID generation for new tool instances using crypto.randomUUID()
    - Add basic validation functions for data integrity and UUID format validation
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [x]\* 2.3 Write unit tests for data models and validation
    - Create unit tests for model validation functions
    - Test database CRUD operations with test database
    - Verify constraint enforcement and error handling
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 3. Build authentication and authorization system

  - [x] 3.1 Implement Supabase authentication integration

    - Set up Supabase Auth with email/password authentication
    - Create user registration and login pages using Supabase Auth
    - Implement authentication context and hooks for React components
    - Add role-based user profiles with admin/user distinction
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Add role-based authorization system

    - Implement role checking utilities and hooks
    - Create protected page components for different permission levels
    - Add session management and logout functionality
    - Set up RLS policies in Supabase for role-based data access
    - _Requirements: 2.2, 2.3_

  - [x]\* 3.3 Write authentication and authorization tests
    - Test login/logout flows with valid and invalid credentials
    - Verify role-based access control for different pages
    - Test protected route behavior and redirects
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Create core inventory management API routes

  - [x] 4.1 Implement tool lookup and status management

    - Create API route /api/tools/qr/[uuid] for secure UUID-based lookup
    - Add UUID format validation to prevent invalid requests
    - Implement tool status validation (available, loaned, out-of-service)
    - Add error handling for invalid UUIDs and missing tools using Supabase queries
    - _Requirements: 1.1, 1.6_

  - [x] 4.2 Build loan creation and management system

    - Implement API route /api/loans for loan creation with business logic validation
    - Add loan status tracking and due date calculation
    - Create loan conflict detection using Supabase transactions (tool already loaned)
    - _Requirements: 1.2, 1.5_

  - [x] 4.3 Implement tool return processing

    - Create API route /api/loans/[id]/return for return processing
    - Add return validation (user can only return their own loans)
    - Update tool status back to available on successful return using Supabase
    - _Requirements: 1.3, 1.4_

  - [x]\* 4.4 Write integration tests for loan/return workflows
    - Test complete loan workflow from QR scan to confirmation
    - Test return workflow with proper status updates
    - Verify error handling for edge cases (invalid QR, unauthorized returns)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 5. Build mobile-first frontend interface

  - [x] 5.1 Create Progressive Web App structure with Next.js

    - Set up responsive layout components using Tailwind CSS
    - Implement PWA configuration with manifest.json
    - Create basic navigation and layout components
    - Add mobile-first design with touch-friendly interfaces
    - _Requirements: 1.1, 2.1_

  - [x] 5.2 Implement QR code scanning functionality

    - Create /scanner page with camera integration
    - Integrate HTML5 camera API for QR code scanning using react-qr-scanner
    - Add QR code detection with proper error handling
    - Implement UUID format validation on scanned codes for security
    - Create camera permission handling and error states
    - Implement scan result processing and API integration with UUID lookup
    - _Requirements: 1.1, 1.6_

  - [x] 5.3 Build loan confirmation and management UI

    - Create tool information display component after QR scan
    - Implement loan confirmation dialog with tool details
    - Add return confirmation interface for active loans
    - Create /my-loans page for user loan history and status views
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]\* 5.4 Write end-to-end tests for user workflows
    - Test complete user journey from login to tool loan
    - Verify QR scanning integration and error handling
    - Test return workflow and status updates in UI
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 6. Create basic administrative dashboard

  - [x] 6.1 Build admin tool management interface

    - Create API route /api/admin/item-types for managing item categories
    - Create API route /api/admin/tools for tool instance management
    - Create admin-only pages for tool inventory management
    - Implement tool creation with automatic UUID generation
    - Create tool editing and status updates functionality
    - Create bulk import functionality for existing inventory
    - _Requirements: 2.2, 8.1, 8.2_

  - [x] 6.1.1 Implement QR code generation system

    - Add API route /api/admin/tools/[id]/qr-image for on-demand QR generation
    - Implement QR code image generation using qrcode library (PNG format)
    - _Requirements: 8.1_

  - [x] 6.2 Implement loan monitoring and management

    - Create /admin/dashboard page with comprehensive admin overview
    - Create dashboard showing all active loans using Supabase queries
    - Add overdue loan identification and highlighting
    - Implement admin override for returns and status changes
    - Create basic reporting for loan statistics with real-time updates
    - _Requirements: 8.2, 8.4_

## Phase 2: Consumable Items Management

- [x] 7. Extend database schema for consumables

  - [x] 7.1 Add consumable-specific tables and relationships

    - Create consumable_stock and consumable_requests tables in Supabase
    - Add is_consumable flag to item_types table
    - Implement quantity tracking and unit of measure fields
    - Add database constraints and RLS policies for stock management
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 7.2 Implement consumable stock management utilities
    - Create TypeScript utilities for consumable stock operations
    - Add stock validation and threshold checking functions
    - Implement backorder creation and fulfillment logic using Supabase
    - Create stock adjustment and restock functionality
    - _Requirements: 3.2, 3.3, 3.5_

- [x] 8. Build consumable management API routes

  - [x] 8.1 Create consumable inventory API routes

    - Implement API route /api/consumables for listing available items
    - Add stock level display and availability checking
    - Create search and filtering capabilities for consumables
    - _Requirements: 3.1_

  - [x] 8.2 Implement consumable request processing

    - Create API route /api/consumables/request for quantity-based requests
    - Add stock validation and automatic fulfillment logic using Supabase transactions
    - Implement backorder creation when stock is insufficient
    - Add request status tracking and history
    - _Requirements: 3.2, 3.3_

  - [x] 8.3 Build admin stock management API routes

    - Create API routes for stock adjustments and restocking
    - Implement backorder processing and fulfillment
    - Add bulk stock update capabilities
    - Create stock level reporting and alerts
    - _Requirements: 3.5, 8.3_

  - [ ]\* 8.4 Write tests for consumable workflows
    - Test stock validation and quantity fulfillment
    - Verify backorder creation and processing
    - Test concurrent stock requests and race conditions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 9. Extend frontend for consumable management

  - [x] 9.1 Create consumable request interface

    - Create /consumables page for browsing and requesting supplies
    - Build consumable browsing and search interface
    - Implement quantity selection and request submission
    - Add stock level display and availability indicators
    - Create request confirmation and status tracking
    - _Requirements: 3.1, 3.2_

  - [x] 9.2 Add backorder management for users

    - Create backorder status display and notifications
    - Implement backorder cancellation functionality
    - Add estimated fulfillment time display
    - _Requirements: 3.3_

  - [x] 9.3 Extend admin dashboard for consumables

    - Add consumable inventory management interface
    - Create stock level monitoring and alerts
    - Implement restocking and adjustment workflows
    - Add backorder queue management
    - _Requirements: 3.5, 8.3_

## Phase 3: Audit Trail and Notification System

- [x] 10. Implement comprehensive audit logging

  - [x] 10.1 Create audit logging infrastructure

    - Add audit_logs table with JSONB fields for change tracking in Supabase
    - Implement audit utilities to capture all significant actions
    - Create audit log service with standardized entry format
    - Add IP address and user agent tracking using Next.js request headers
    - _Requirements: 6.1, 6.2_

  - [x] 10.2 Build audit query and reporting system

    - Create API route /api/audit/logs with filtering capabilities
    - Create API route /api/notifications for notification management
    - Implement search by user, item, date range, and action type using Supabase queries
    - Add audit trail display components for specific items and users
    - Create audit report generation and export functionality
    - _Requirements: 6.3, 6.4_

  - [x]\* 10.3 Write audit system tests
    - Verify audit log creation for all tracked actions
    - Test audit query filtering and search functionality
    - Validate audit data integrity and completeness
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Build notification system infrastructure

  - [x] 11.1 Create notification data models and API

    - Add notifications table with delivery status tracking in Supabase
    - Implement notification creation and management utilities
    - Create notification API routes for CRUD operations
    - Add notification type categorization and templating
    - _Requirements: 7.1, 7.4, 7.5_

  - [x] 11.2 Implement overdue detection and notification system

    - Create API route for detecting overdue loans using Supabase Edge Functions
    - Implement notification creation for overdue items
    - Add escalation logic for repeated overdue notifications
    - Create notification delivery tracking using Supabase real-time
    - _Requirements: 7.1, 7.5_

  - [x] 11.3 Add backorder and system notifications

    - Implement notifications for backorder fulfillment
    - Create system maintenance and update notifications
    - Add notification for stock level alerts using Supabase triggers
    - _Requirements: 7.2, 7.3_

  - [x]\* 11.4 Write notification system tests
    - Test overdue detection and notification creation
    - Verify notification delivery and retry mechanisms
    - Test notification preferences and filtering
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 12. Extend frontend with audit and notification features


  - [x] 12.1 Add notification display and management

    - Create notification bell icon with unread count
    - Implement notification list with read/unread status
    - Add notification detail view and action buttons
    - Create notification preferences interface
    - _Requirements: 7.4, 7.6_

  - [x] 12.2 Build audit trail interface for admins

    - Create audit log viewer with filtering and search
    - Add item-specific audit history display
    - Implement audit report generation and export
    - Create audit dashboard with activity summaries
    - _Requirements: 6.3, 6.4_

## Phase 4: Advanced Features and Production Readiness

- [ ] 13.0 Fix current implementation issues

  - [ ] 13.0.1 Fix TypeScript compilation errors

    - Fix property 'headers' errors in consumable request route
    - Fix CreateToolInstanceInput type compatibility in admin tools route
    - Remove unused imports and variables to clean up warnings
    - Add proper error handling for edge cases
    - _Requirements: Code quality and maintainability_

  - [ ] 13.0.2 Improve error handling and validation

    - Add proper UUID validation in QR code scanning endpoints
    - Implement consistent error response format across all API routes
    - Add input sanitization and validation for all user inputs
    - Improve database error handling and user feedback
    - _Requirements: 1.6, 2.1, 3.1, 4.1_

- [ ] 13. Implement concurrency control and data integrity



  - [ ] 13.1 Add optimistic locking with version fields

    - Implement version checking in update operations for tool_instances and consumable_stock
    - Add version increment logic to all update operations in supabase-client.ts
    - Create retry logic with exponential backoff for version conflicts
    - Add concurrency conflict error handling and user feedback in API routes
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 13.2 Implement database transaction management

    - Replace pseudo-transaction comments with actual Supabase RPC functions for complex operations
    - Create RPC functions for loan creation, return, and consumable request workflows
    - Implement proper rollback mechanisms for failed multi-step operations
    - Add transaction retry mechanisms for deadlock handling
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]\* 13.3 Write concurrency and stress tests
    - Create tests for simultaneous loan attempts on same tool
    - Test concurrent consumable requests with limited stock
    - Implement load testing for high-concurrency scenarios
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 14. Build loss and damage management system

  - [x] 14.1 Implement item status management



    - Add lost/damaged status options to tool instances
    - Create admin-only endpoints for status changes with justification
    - Implement automatic loan closure for lost/damaged items
    - Add status change notification to affected users
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 14.2 Create loss/damage reporting and tracking

    - Build admin interface for reporting lost/damaged items
    - Add mandatory justification notes for status changes
    - Implement loss/damage history tracking and reporting
    - Create cost tracking and replacement workflows
    - _Requirements: 5.1, 5.4, 5.5_

  - [ ]\* 14.3 Write loss/damage management tests
    - Test status change workflows with active loans
    - Verify notification delivery for affected users
    - Test admin authorization for status changes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 15. Implement system configuration and policy management

  - [ ] 15.1 Create configurable system policies

    - Add system_settings table for configurable parameters in Supabase
    - Implement default loan duration per item category
    - Create notification timing and escalation policies
    - Add stock threshold and reorder point configuration
    - _Requirements: 8.5_

  - [ ] 15.2 Build admin configuration interface
    - Create settings management pages for admins
    - Add policy configuration forms with validation
    - Implement configuration backup and restore functionality
    - Create configuration change audit logging
    - _Requirements: 8.5, 8.6_

- [ ] 16. Add comprehensive reporting and analytics

  - [ ] 16.1 Implement usage analytics and reporting

    - Create loan frequency and duration analytics using Supabase views
    - Add user activity and utilization reports
    - Implement inventory turnover and efficiency metrics
    - Create cost analysis and ROI reporting
    - _Requirements: 8.1, 8.4_

  - [ ] 16.2 Build executive dashboard and KPI tracking
    - Create high-level dashboard with key performance indicators
    - Add trend analysis and forecasting capabilities using Chart.js
    - Implement automated report generation and distribution
    - Create data export functionality for external analysis
    - _Requirements: 8.1, 8.4, 8.6_

- [ ] 17. Production deployment and monitoring setup

  - [ ] 17.1 Configure production environment

    - Set up Vercel deployment with environment variables
    - Configure Supabase production instance with proper security settings
    - Implement proper security headers and CORS configuration
    - Add SSL/TLS configuration and domain setup
    - _Requirements: All requirements for production deployment_

  - [ ] 17.2 Implement monitoring and alerting

    - Create health check API route at /api/health for system monitoring
    - Add application performance monitoring using Vercel Analytics
    - Implement error tracking using Sentry or similar service
    - Add Supabase database performance monitoring
    - _Requirements: System reliability and performance_

  - [ ]\* 17.3 Write deployment and monitoring tests
    - Test deployment pipeline and rollback procedures
    - Verify monitoring and alerting functionality
    - Test backup and disaster recovery procedures
    - _Requirements: Production readiness and reliability_
