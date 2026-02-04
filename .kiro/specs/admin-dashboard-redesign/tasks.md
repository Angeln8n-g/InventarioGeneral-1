# Implementation Plan: Admin Dashboard Redesign

## Overview

Este plan implementa el rediseño del Admin Dashboard siguiendo el Design System definido. La implementación sigue un enfoque incremental: primero los tokens y foundations, luego los componentes base, después los componentes de layout, y finalmente los módulos del dashboard con integración de permisos.

## Tasks

- [ ] 1. Set up Design System Foundation
  - [x] 1.1 Create design tokens structure
    - Create `src/design-system/tokens/colors.ts` with all color tokens (primary, semantic, neutrals)
    - Create `src/design-system/tokens/spacing.ts` with spacing scale (4, 8, 12, 16, 24, 32)
    - Create `src/design-system/tokens/typography.ts` with font family and sizes
    - Create `src/design-system/tokens/borders.ts` with border radius values
    - Create `src/design-system/tokens/breakpoints.ts` with responsive breakpoints
    - Create `src/design-system/tokens/index.ts` barrel export
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Write property tests for design tokens
    - **Property 1: Design Token Completeness**
    - **Property 2: Spacing Token Multiples**
    - **Property 29: Naming Convention - Variants**
    - **Property 30: Naming Convention - Tokens**
    - **Validates: Requirements 1.1, 1.2, 1.3, 17.2, 17.3**

  - [x] 1.3 Create ThemeProvider and useTheme hook
    - Create `src/design-system/theme/ThemeProvider.tsx` with CSS variables injection
    - Create `src/design-system/theme/useTheme.ts` hook for accessing theme
    - Create `src/design-system/index.ts` barrel export
    - _Requirements: 1.6, 16.1_

- [ ] 2. Implement Responsive Hooks
  - [x] 2.1 Create useResponsive hook
    - Create `src/hooks/useResponsive.ts` with breakpoint detection
    - Implement window resize listener with debounce
    - Return isMobile, isTablet, isDesktop flags and current breakpoint
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 2.2 Write property tests for useResponsive
    - **Property 3: Breakpoint Detection Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Checkpoint - Verify foundation setup
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Base UI Components
  - [x] 4.1 Create Button component
    - Create `src/components/ds/Button/Button.tsx` with variants (primary, secondary, ghost, danger)
    - Implement loading state with spinner
    - Implement disabled state
    - Add keyboard accessibility and focus states
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 4.2 Write property tests for Button
    - **Property 12: Button Disabled State**
    - **Property 13: Button Loading State**
    - **Validates: Requirements 8.7, 8.8**

  - [x] 4.3 Create Skeleton component
    - Create `src/components/ds/Skeleton/Skeleton.tsx` with variants (text, circular, rectangular)
    - Implement pulse animation
    - Create SkeletonCard composite component
    - _Requirements: 13.1, 13.2_

  - [x] 4.4 Create MetricCard component
    - Create `src/components/ds/MetricCard/MetricCard.tsx`
    - Implement trend indicator (up/down arrows with colors)
    - Implement loading skeleton state
    - Implement optional icon display
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 4.5 Write property tests for MetricCard
    - **Property 8: Metric Card Trend Indicator**
    - **Property 9: Component Loading State**
    - **Property 10: Metric Card Content Rendering**
    - **Validates: Requirements 6.1, 6.4, 6.5, 6.6, 6.7**

  - [x] 4.6 Create ActionCard component
    - Create `src/components/ds/ActionCard/ActionCard.tsx`
    - Implement highlighted variant with primary border
    - Implement disabled state
    - Add press animation (scale to 95%)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 4.7 Write property tests for ActionCard
    - **Property 11: Action Card Disabled State**
    - **Validates: Requirements 7.6**

- [x] 5. Checkpoint - Verify base components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement List and State Components
  - [x] 6.1 Create List components
    - Create `src/components/ds/List/List.tsx` with ListItem subcomponent
    - Implement status indicator dots (active, pending, error)
    - Implement action slot for list items
    - Add virtualization support for lists > 50 items using react-window
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 6.2 Write property tests for List
    - **Property 14: List Status Indicator**
    - **Property 15: List Virtualization Threshold**
    - **Property 16: List Empty State**
    - **Validates: Requirements 9.2, 9.5, 9.6**

  - [x] 6.3 Create EmptyState component
    - Create `src/components/ds/EmptyState/EmptyState.tsx`
    - Implement icon, title, description, and optional action button
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 6.4 Write property tests for EmptyState
    - **Property 25: Empty State Content**
    - **Validates: Requirements 14.2, 14.3**

  - [x] 6.5 Create ErrorState component
    - Create `src/components/ds/ErrorState/ErrorState.tsx`
    - Implement retry button with callback
    - Implement support message after multiple retries
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 6.6 Write property tests for ErrorState
    - **Property 26: Error State Retry**
    - **Property 27: Error State Support Message**
    - **Validates: Requirements 15.4, 15.5**

- [ ] 7. Implement Modal and Toast System
  - [x] 7.1 Create Modal component
    - Create `src/components/ds/Modal/Modal.tsx`
    - Implement responsive variants (Bottom_Sheet on mobile, centered on desktop)
    - Implement focus trap
    - Implement backdrop click and Escape key close
    - Add slide-up (mobile) and fade-scale (desktop) animations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 7.2 Write property tests for Modal
    - **Property 17: Modal Breakpoint Variant**
    - **Property 18: Modal Close Triggers**
    - **Validates: Requirements 10.4, 10.5, 10.6**

  - [x] 7.3 Create Toast system
    - Create `src/components/ds/Toast/Toast.tsx` component
    - Create `src/components/ds/Toast/ToastProvider.tsx` context provider
    - Create `src/hooks/useToast.ts` hook
    - Implement auto-dismiss after 4 seconds
    - Implement stack limit of 3 toasts
    - _Requirements: 13.3, 13.4, 13.5, 13.6_

  - [ ]* 7.4 Write property tests for Toast
    - **Property 22: Toast Type Rendering**
    - **Property 23: Toast Auto-Dismiss**
    - **Property 24: Toast Stack Limit**
    - **Validates: Requirements 13.3, 13.4, 13.5, 13.6**

- [x] 8. Checkpoint - Verify UI components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Layout Components
  - [x] 9.1 Create AppBar component
    - Create `src/components/layout/AppBar/AppBar.tsx`
    - Implement logo, title, notifications badge, and user menu
    - Implement responsive height (56px mobile, 64px desktop)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 9.2 Write property tests for AppBar
    - **Property 28: Notification Badge Count**
    - **Validates: Requirements 4.3**

  - [x] 9.3 Create BottomNavigation component
    - Create `src/components/layout/BottomNavigation/BottomNavigation.tsx`
    - Implement max 5 items limit
    - Implement active state highlighting
    - Add haptic feedback on tap
    - Conditionally render only on mobile
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 9.4 Write property tests for BottomNavigation
    - **Property 4: Bottom Navigation Visibility**
    - **Property 5: Navigation Item Limit**
    - **Validates: Requirements 2.6, 5.1, 5.6**

  - [x] 9.5 Create Sidebar component
    - Create `src/components/layout/Sidebar/Sidebar.tsx`
    - Implement collapsible behavior for tablet
    - Implement fixed behavior for desktop
    - _Requirements: 2.2, 2.3, 2.5_

  - [x] 9.6 Create ResponsiveGrid component
    - Create `src/components/layout/ResponsiveGrid/ResponsiveGrid.tsx`
    - Implement responsive columns (1 mobile, 2 tablet, 4 desktop)
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 10. Implement Permission Guard Hook
  - [x] 10.1 Create usePermissionGuard hook
    - Create `src/hooks/usePermissionGuard.ts`
    - Integrate with existing PermissionsContext
    - Implement hasAccess check using hasAnyPermission
    - _Requirements: 3.1, 3.2_

  - [ ]* 10.2 Write property tests for permission filtering
    - **Property 6: Module Permission Filtering**
    - **Property 7: Module Reordering on Filter**
    - **Validates: Requirements 3.2, 3.3**

- [x] 11. Checkpoint - Verify layout and permissions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Dashboard Modules
  - [x] 12.1 Create KPIGrid module
    - Create `src/components/admin-dashboard/KPIGrid/KPIGrid.tsx`
    - Implement 4 MetricCards (total loans, active users, pending returns, inventory alerts)
    - Implement permission check for "dashboard:view_kpis"
    - Implement error state with retry
    - Implement auto-refresh every 30 seconds
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 12.2 Write property tests for KPIGrid
    - **Property 19: KPI Grid Metrics**
    - **Property 20: KPI Grid Error State**
    - **Validates: Requirements 11.3, 11.4**

  - [x] 12.3 Create ManageUsers module
    - Create `src/components/admin-dashboard/ManageUsers/ManageUsers.tsx`
    - Implement permission check for "users:manage"
    - Implement collapsible section (mobile) / card (desktop)
    - Implement header with count
    - Implement searchable list with pagination
    - _Requirements: 12.1, 12.4, 12.5, 12.6_

  - [x] 12.4 Create ManageTools module
    - Create `src/components/admin-dashboard/ManageTools/ManageTools.tsx`
    - Implement permission check for "tools:manage"
    - Implement collapsible section (mobile) / card (desktop)
    - Implement header with count
    - Implement searchable list with pagination
    - _Requirements: 12.2, 12.4, 12.5, 12.6_

  - [x] 12.5 Create LogsAudit module
    - Create `src/components/admin-dashboard/LogsAudit/LogsAudit.tsx`
    - Implement permission check for "logs:view"
    - Implement collapsible section (mobile) / card (desktop)
    - Implement header with count
    - Implement searchable list with pagination
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

  - [ ]* 12.6 Write property tests for admin modules
    - **Property 21: Admin Module Header Count**
    - **Validates: Requirements 12.5**

- [x] 13. Implement Dashboard Container
  - [x] 13.1 Create AdminDashboardContainer
    - Create `src/components/admin-dashboard/AdminDashboardContainer.tsx`
    - Integrate AppBar, Sidebar (tablet/desktop), BottomNavigation (mobile)
    - Implement module visibility based on permissions
    - Implement automatic reordering of visible modules
    - Implement empty state when no modules are visible
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 13.2 Create admin dashboard page
    - Update or create `src/app/admin/dashboard/page.tsx`
    - Wrap with ThemeProvider and ToastProvider
    - Integrate AdminDashboardContainer
    - _Requirements: 16.1_

- [x] 14. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify responsive behavior across breakpoints
  - Verify permission-based module visibility
  - Verify dark mode styling

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check library already installed in the project
- The implementation integrates with the existing PermissionsContext
- All components follow the naming conventions defined in the Design System
