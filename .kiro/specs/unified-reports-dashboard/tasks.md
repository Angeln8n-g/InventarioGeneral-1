# Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - [x] 1.1 Create unified dashboard directory structure and type definitions
    - Create `src/components/unified-dashboard/` directory
    - Create `src/types/unified-dashboard.ts` with all interfaces from design
    - Create index.ts for exports
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Create RTK Query endpoints for unified dashboard data
    - Add `useGetUnifiedDashboardSummaryQuery` endpoint
    - Add `useGetUserConsumptionQuery` endpoint
    - Add `useGetDeviceMovementsQuery` endpoint
    - Add `useGetDashboardAlertsQuery` endpoint
    - _Requirements: 1.1, 5.1, 5.2, 11.1, 12.3_
  - [x] 1.3 Write property test for alert generation
    - **Property 6: Low Stock Alert Generation**
    - **Property 7: Overdue Loan Alert Generation**
    - **Validates: Requirements 5.1, 5.2**

- [x] 2. Implement Global Filters component
  - [x] 2.1 Create GlobalFilters component with date range and category selectors
    - Implement TimeRangeSelector with presets (week, month, quarter, year, custom)
    - Implement CategorySelector with dynamic options
    - Add filter state management with useState
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.2 Write property tests for filter propagation
    - **Property 1: Date Range Filter Propagation**
    - **Property 2: Category Filter Propagation**
    - **Property 3: Filter State Persistence**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Implement shared components
  - [x] 3.1 Enhance MetricCard component with loading and trend support
    - Add loading skeleton state
    - Add trend indicator (up/down arrow with percentage)
    - Add onClick handler for drill-down
    - _Requirements: 1.2, 6.1, 7.1_
  - [x] 3.2 Create UnifiedChart component wrapper
    - Support line, bar, pie, doughnut chart types
    - Add loading state with skeleton
    - Implement theme-aware colors
    - _Requirements: 3.1, 3.2, 3.3, 9.2_
  - [x] 3.3 Create UnifiedDataTable component with pagination, sorting, and search
    - Implement pagination controls
    - Implement column sorting
    - Implement search filtering
    - Add loading state
    - _Requirements: 6.2, 6.4_
  - [x] 3.4 Write property tests for table functionality
    - **Property 9: Table Sorting Correctness**
    - **Property 11: Table Search Filtering**
    - **Validates: Requirements 6.2, 6.4**

- [x] 4. Implement Overview Section
  - [x] 4.1 Create OverviewSection component with KPI cards
    - Display summary cards for all major metrics
    - Integrate AlertsPanel component
    - Add quick navigation to detailed sections
    - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4_
  - [x] 4.2 Write property test for alert badge count
    - **Property 8: Alert Badge Count Accuracy**
    - **Validates: Requirements 5.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Tools Section
  - [x] 6.1 Create ToolsSection component with metrics and charts
    - Display tool metrics (total, available, loaned, maintenance)
    - Add status distribution chart
    - Add category breakdown chart
    - Implement drill-down to tool details table
    - _Requirements: 1.2, 1.4, 3.2, 3.3, 6.1, 6.2_

- [x] 7. Implement Consumables Section
  - [x] 7.1 Create ConsumablesSection component with stock metrics
    - Display consumable metrics (types, stock, low stock)
    - Add consumption trend chart
    - Add category distribution chart
    - Implement drill-down to consumables table
    - _Requirements: 1.2, 1.4, 3.2, 3.3, 6.1, 6.2_

- [x] 8. Implement Loans Section
  - [x] 8.1 Create LoansSection component with loan activity
    - Display loan metrics (active, overdue, returned)
    - Add loan activity trend chart
    - Add status distribution chart
    - Implement drill-down to loans table
    - _Requirements: 1.2, 1.4, 3.2, 3.3, 6.1, 6.2_

- [x] 9. Implement User Consumption Section
  - [x] 9.1 Create UserConsumptionSection component
    - Display user consumption table with totals
    - Add consumption breakdown by type per user
    - Add historical trend chart per user
    - Implement sorting by quantity/cost
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 9.2 Write property tests for user consumption
    - **Property 16: User Consumption Aggregation Consistency**
    - **Property 17: User Consumption Date Filter**
    - **Property 18: User Consumption Sorting**
    - **Validates: Requirements 11.1, 11.2, 11.4, 11.5**

- [x] 10. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.



- [x] 11. Implement Electronics Section


  - [x] 11.1 Create ElectronicsSection component with device metrics

    - Display device metrics (total, by status, by brand)
    - Add brand distribution chart
    - Add status distribution chart
    - Show current classroom assignment per device
    - _Requirements: 12.1, 12.2_
  - [x] 11.2 Create DeviceMovementHistory component


    - Display timeline of transfers per device
    - Show origin/destination classrooms
    - Include transfer date and responsible user
    - _Requirements: 12.3, 12.5_
  - [x] 11.3 Write property test for classroom device filter


    - **Property 19: Classroom Device History Filter**
    - **Validates: Requirements 12.4**

- [x] 12. Implement Classrooms Section



  - [x] 12.1 Create ClassroomsSection component

    - Display classroom summary (total, with devices)
    - Add device distribution by classroom chart
    - Implement classroom selector
    - Show device list per selected classroom
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 12.2 Write property test for classroom device distribution


    - **Property 15: Classroom Device Distribution Sum**
    - **Validates: Requirements 10.2**



- [ ] 13. Implement Top Users Section
  - [x] 13.1 Create TopUsersSection component

    - Display ranked user list by activity
    - Show active loans, consumables used, total cost
    - Add activity type filter (loans, consumables, both)
    - Implement click to navigate to user detail
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 13.2 Write property tests for top users


    - **Property 13: Top Users Ranking Correctness**
    - **Property 14: Top Users Activity Type Filter**
    - **Validates: Requirements 8.1, 8.4**

- [x] 14. Implement Export Functionality


  - [x] 14.1 Create useExportDashboard hook


    - Generate Excel file with multiple sheets
    - Include filter metadata in export
    - Generate descriptive filename with date
    - Support section-specific exports
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 14.2 Write property tests for export

    - **Property 4: Export Data Consistency**
    - **Property 5: Export Filter Metadata**
    - **Validates: Requirements 4.1, 4.2**

- [x] 15. Implement Main Dashboard Container




  - [x] 15.1 Create UnifiedDashboardContainer with tab navigation

    - Implement tab navigation between sections
    - Integrate GlobalFilters at top level
    - Pass filters to all sections
    - Handle section switching without page reload
    - _Requirements: 1.3, 1.4, 2.1, 2.2_

  - [x] 15.2 Write property tests for drill-down and error isolation

    - **Property 10: Drill-down Filter Preservation**
    - **Property 12: Section Error Isolation**
    - **Validates: Requirements 6.3, 7.4**

- [x] 16. Create Unified Dashboard Page



  - [x] 16.1 Create page route at /admin/unified-reports

    - Set up page with ProtectedRoute wrapper
    - Integrate UnifiedDashboardContainer
    - Add page title and breadcrumbs
    - _Requirements: 1.1_

  - [x] 16.2 Update navigation to include unified dashboard

    - Add link in admin sidebar/menu
    - Update dashboard quick actions
    - _Requirements: 1.1_



- [x] 17. Implement Theme Support

  - [x] 17.1 Ensure all components support light/dark themes

    - Verify MetricCard theme classes
    - Verify chart color schemes
    - Verify table styling
    - Test theme switching
    - _Requirements: 9.1, 9.2, 9.3_


- [x] 18. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
