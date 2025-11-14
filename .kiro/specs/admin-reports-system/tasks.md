# Implementation Plan

- [x] 1. Setup dependencies and base infrastructure

  - Install Recharts library for data visualization
  - Install jsPDF and jspdf-autotable for PDF export
  - Install xlsx library (already present) for Excel export
  - Create base types and interfaces for reports in `src/types/reports.ts`
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2. Create shared report components

- [x] 2.1 Implement ReportFilters component

  - Create `src/components/reports/ReportFilters.tsx` with dynamic filter rendering
  - Implement date range picker with validation
  - Add filter chips display with remove functionality
  - Add "Clear All" button
  - Implement responsive design with mobile collapse
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.2, 3.3, 4.4_

- [x] 2.2 Implement ReportMetrics component

  - Create `src/components/reports/ReportMetrics.tsx` for metric cards
  - Implement value formatting (number, percentage, currency, duration)
  - Add trend indicators with up/down arrows
  - Create responsive grid layout (2 cols mobile, 4 cols desktop)
  - Add skeleton loading states
  - _Requirements: 1.1, 2.1, 3.1, 4.6_

- [x] 2.3 Implement ReportCharts component

  - Create `src/components/reports/ReportCharts.tsx` as chart container
  - Implement LineChart for temporal trends
  - Implement BarChart for comparisons
  - Implement PieChart for distributions
  - Implement HorizontalBarChart for rankings
  - Implement StackedBarChart for multi-category comparisons
  - Add interactive tooltips and legends
  - Implement theme support (light/dark mode)
  - Add responsive sizing and mobile adaptations
  - _Requirements: 1.4, 2.4, 3.4, 4.5_

- [x] 2.4 Implement ReportTable component

  - Create `src/components/reports/ReportTable.tsx` with generic typing
  - Implement column sorting functionality
  - Add pagination controls
  - Implement custom cell formatting
  - Add row click handlers
  - Create empty state component
  - Implement responsive design with horizontal scroll on mobile
  - _Requirements: 1.7, 4.7_

- [x] 2.5 Implement ExportButton component

  - Create `src/components/reports/ExportButton.tsx` with format options
  - Implement loading states during export
  - Add automatic file download trigger
  - Implement filename generation with timestamp
  - Add success/error notifications
  - _Requirements: 5.1, 5.6_

- [x] 3. Implement Loan Reports backend

- [x] 3.1 Create loan report data access layer

  - Create `src/lib/reports/loan-reports.ts` with reportOperations.loans
  - Implement getMetrics function with SQL aggregations
  - Implement getChartData function for visualizations
  - Implement getDetailedLoans function with pagination
  - Add database indexes for loan queries
  - Optimize queries with proper joins and filters
  - _Requirements: 1.1, 1.2, 1.3, 6.2, 6.4_

- [x] 3.2 Create loan reports API endpoint

  - Create `src/app/api/admin/reports/loans/route.ts`
  - Implement GET handler with authentication middleware
  - Add filter validation and sanitization
  - Implement date range validation
  - Add audit logging for report access
  - Implement error handling with specific error codes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4_

- [x] 3.3 Create loan reports frontend page

  - Create `src/app/admin/reports/loans/page.tsx`
  - Implement state management with React hooks
  - Integrate ReportFilters with loan-specific filters
  - Integrate ReportMetrics with loan metrics
  - Integrate ReportCharts with loan visualizations
  - Integrate ReportTable with loan data
  - Add loading and error states
  - Implement responsive layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 4. Implement Tool Reports backend
- [x] 4.1 Create tool report data access layer

  - Create `src/lib/reports/tool-reports.ts` with reportOperations.tools
  - Implement getMetrics function for tool statistics
  - Implement getChartData function for tool visualizations
  - Implement getDetailedTools function with utilization calculation
  - Add database indexes for tool queries
  - Calculate utilization rates from loan history
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 6.2, 6.4_

- [x] 4.2 Create tool reports API endpoint

  - Create `src/app/api/admin/reports/tools/route.ts`
  - Implement GET handler with authentication

  - Add category and status filters
  - Implement utilization rate calculations
  - Add audit logging
  - Implement error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4_

- [x] 4.3 Create tool reports frontend page

  - Create `src/app/admin/reports/tools/page.tsx`
  - Implement state management
  - Integrate ReportFilters with tool-specific filters
  - Integrate ReportMetrics with tool metrics
  - Integrate ReportCharts with tool visualizations
  - Integrate ReportTable with tool data
  - Add utilization rate display
  - Implement responsive layout
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 5. Implement Consumable Reports backend

- [x] 5.1 Create consumable report data access layer

  - Create `src/lib/reports/consumable-reports.ts` with reportOperations.consumables
  - Implement getMetrics function for consumable statistics
  - Implement getChartData function with category grouping
  - Implement getCategorySummaries function
  - Implement getCategoryDetail function for drill-down
  - Add database indexes for consumable queries
  - Calculate consumption from audit logs
  - Implement stock level classification (adequate/low/critical)
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 6.2, 6.4_

- [x] 5.2 Create consumable reports API endpoints

  - Create `src/app/api/admin/reports/consumables/route.ts` for main report
  - Create `src/app/api/admin/reports/consumables/[category]/route.ts` for category detail
  - Implement GET handlers with authentication
  - Add category filtering and grouping
  - Implement consumption calculations for date ranges
  - Add stock level filtering
  - Add audit logging
  - Implement error handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 7.1, 7.2, 7.3, 7.4_

- [x] 5.3 Create consumable reports frontend page

  - Create `src/app/admin/reports/consumables/page.tsx`
  - Implement state management with category selection
  - Create CategorySelector component (tabs or dropdown)
  - Integrate ReportFilters with consumable-specific filters
  - Integrate ReportMetrics with consumable metrics
  - Integrate ReportCharts with category-based visualizations
  - Create CategoryDetailView component for drill-down
  - Integrate ReportTable with consumable data
  - Add stock level indicators (color-coded alerts)
  - Implement responsive layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Implement export functionality

- [x] 6.1 Create PDF export utility

  - Create `src/lib/reports/export/pdf-export.ts`
  - Implement generateLoanReportPDF function
  - Implement generateToolReportPDF function
  - Implement generateConsumableReportPDF function
  - Add logo and header to PDF
  - Include filters and date range in PDF

  - Add charts as images to PDF
  - Format tables in PDF
  - _Requirements: 5.2, 5.5_

- [x] 6.2 Create Excel export utility

  - Create `src/lib/reports/export/excel-export.ts`
  - Implement generateLoanReportExcel function
  - Implement generateToolReportExcel function
  - Implement generateConsumableReportExcel function
  - Create multiple sheets (summary + detailed data)
  - Add formatting and styling to Excel
  - Include charts in Excel (if possible)
  - _Requirements: 5.3, 5.5_

- [x] 6.3 Create CSV export utility

  - Create `src/lib/reports/export/csv-export.ts`
  - Implement generateLoanReportCSV function
  - Implement generateToolReportCSV function
  - Implement generateConsumableReportCSV function
  - Properly escape CSV values
  - Handle special characters and line breaks
  - _Requirements: 5.4, 5.5_

- [x] 6.4 Create export API endpoints

  - Create `src/app/api/admin/reports/export/route.ts`
  - Implement POST handler for export requests
  - Add format validation (pdf/excel/csv)
  - Implement async export processing for large datasets
  - Generate filename with timestamp
  - Return file as download
  - Add audit logging for exports
  - Implement rate limiting for export endpoint
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.5, 7.6_

- [x] 7. Update reports hub page

  - Update `src/app/admin/reports/page.tsx` to add navigation cards
  - Add "Loan Reports" card with link to `/admin/reports/loans`
  - Add "Tool Inventory Reports" card with link to `/admin/reports/tools`
  - Add "Consumable Reports" card with link to `/admin/reports/consumables`
  - Update card descriptions and icons
  - Remove placeholder report generation functionality
  - Maintain responsive grid layout
  - _Requirements: 4.1, 4.2_

- [ ] 8. Add reports link to admin dashboard

  - Update `src/app/admin/dashboard/page.tsx`
  - Add "Reports" navigation card or button
  - Ensure proper routing to `/admin/reports`
  - _Requirements: 4.1_

- [x] 9. Implement performance optimizations

- [x] 9.1 Add database indexes

  - Create migration file for report indexes
  - Add indexes for loans (date_range, status, user_id)
  - Add indexes for tool_instances (status, item_type_id)
  - Add indexes for consumable_stock (item_type_id, stock levels)
  - Add indexes for audit_logs (entity_type, created_at)
  - Run migration on database
  - _Requirements: 6.2, 6.4_

- [x] 9.2 Implement frontend optimizations

  - Add lazy loading for ReportCharts component
  - Implement React.memo for expensive components
  - Add debouncing to filter changes (300ms)
  - Implement data memoization with useMemo
  - Add loading skeletons for better UX
  - _Requirements: 6.1, 6.3_

- [ ] 10. Implement security measures
- [x] 10.1 Add authentication and authorization

  - Verify all report endpoints use withPermission middleware
  - Add PERMISSIONS.ADMIN_VIEW_REPORTS permission
  - Implement permission checks in frontend
  - Add redirect to login for unauthenticated users
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 10.2 Implement audit logging

  - Add audit log entries for report views
  - Add audit log entries for report exports
  - Include filters and parameters in audit logs
  - Log failed access attempts
  - _Requirements: 7.4, 7.5_

- [x] 10.3 Implement rate limiting

  - Add rate limiting middleware for report endpoints
  - Set limits: 60 requests/minute for views, 10/minute for exports
  - Return 429 status code when limit exceeded
  - Log rate limit violations
  - _Requirements: 7.6_

- [x] 11. Add internationalization support

  - Add report-related translations to language files
  - Translate report titles, labels, and descriptions
  - Translate metric labels and chart titles
  - Translate error messages
  - Translate export button labels
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 12. Integration and end-to-end validation

  - Test complete flow: navigate to reports → apply filters → view data → export
  - Verify all three report types work correctly
  - Test with different date ranges and filters
  - Verify exports generate correctly in all formats
  - Test responsive behavior on mobile devices
  - Verify authentication and authorization work correctly
  - Check audit logs are created properly
  - Validate performance with realistic data volumes
  - _Requirements: All requirements_
