# Implementation Plan

## Overview

Este plan de implementación convierte el diseño en tareas concretas de código, siguiendo un enfoque incremental que permite validar cada paso. Las tareas están organizadas para minimizar riesgo y permitir testing continuo.

---

## Phase 1: Foundation - Shared Types and Structure

- [ ] 1. Create shared types and interfaces

  - Create `src/types/consumables.ts` with all TypeScript interfaces
  - Define `ConsumableItem`, `ConsumableStock`, `ConsumableStockAdmin` types
  - Define `BackorderRequest`, `ConsumableFilters`, `UserRole` types
  - Export all types for use across the application
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [ ] 2. Create folder structure for shared components
  - Create `src/components/consumables/` directory
  - Create `src/hooks/consumables/` directory
  - Create barrel exports (`index.ts`) in each directory
  - _Requirements: 3.1, 3.2_

---

## Phase 2: Core Shared Components

- [ ] 3. Implement ConsumableSummary component

  - [ ] 3.1 Create `src/components/consumables/ConsumableSummary.tsx`
    - Implement props interface with TypeScript
    - Create summary cards for Total Items, Available, Low Stock, Out of Stock
    - Add conditional Backorders card for admin role
    - Use Claro theme colors (green, yellow, red, blue accents)
    - Implement responsive grid (2 cols mobile, 4 cols desktop)
    - _Requirements: 3.1, 3.2, 6.1_

- [ ] 4. Implement ConsumableFilters component

  - [ ] 4.1 Create `src/components/consumables/ConsumableFilters.tsx`
    - Implement props interface with filters state and callbacks
    - Create search input with icon
    - Create category dropdown with "All Categories" option
    - Create "Low stock only" checkbox
    - Implement active filters badges with remove buttons
    - Add "Clear All" button when filters are active
    - Add optional result counter display
    - Use consistent styling with dark mode support
    - _Requirements: 3.1, 3.2, 6.2_

- [ ] 5. Implement ConsumableActions component (user role)

  - [ ] 5.1 Create `src/components/consumables/ConsumableActions.tsx`
    - Implement props interface with item, callbacks, and loading state
    - Create quick quantity buttons (1, 5, 10)
    - Create quantity input with +/- buttons
    - Implement quantity validation (min: 1, max: available stock)
    - Add "Add to Cart" button
    - Add "Request Now" button
    - Add "Cancel" button
    - Handle empty/zero quantity with auto-fill to 1
    - Show available stock info
    - _Requirements: 3.1, 3.2, 5.1_

- [ ] 6. Implement StockAdjustmentForm component (admin role)

  - [ ] 6.1 Create `src/components/consumables/StockAdjustmentForm.tsx`
    - Implement props interface with stock, callbacks, and loading state
    - Create action type dropdown (adjust, set, restock)
    - Create quantity input with appropriate label per action type
    - Add "Apply" and "Cancel" buttons
    - Implement validation (no zero for adjust/restock)
    - Show current stock info
    - _Requirements: 3.1, 3.2, 5.2_

- [ ] 7. Implement ConsumableCard component

  - [ ] 7.1 Create `src/components/consumables/ConsumableCard.tsx`
    - Implement props interface with item, role, and all callbacks
    - Create card layout with icon, stock display, and item info
    - Implement status colors (green/yellow/red) based on stock
    - Add category badge
    - Add status badge (In Stock, Low Stock, Out of Stock)
    - Conditionally render ConsumableActions for user role
    - Conditionally render StockAdjustmentForm for admin role
    - Add "View Details" button for admin role
    - Handle loading states
    - _Requirements: 3.1, 3.2, 3.3, 6.1_

- [ ] 8. Implement ConsumableList component

  - [ ] 8.1 Create `src/components/consumables/ConsumableList.tsx`
    - Implement props interface with items, role, callbacks, and states
    - Create loading state with spinner and message
    - Create empty state with icon, message, and optional "Clear Filters" button
    - Implement responsive grid (2 cols mobile, 3-4 cols desktop)
    - Map items to ConsumableCard components
    - Pass through all callbacks to cards
    - _Requirements: 3.1, 3.2, 6.3_

- [ ] 9. Implement BackordersTab component (admin only)

  - [ ] 9.1 Create `src/components/consumables/BackordersTab.tsx`
    - Implement props interface with backorders, loading, and callback
    - Create loading state with spinner
    - Create empty state for no backorders
    - Display backorder list with user info, item name, quantity, date
    - Add "Process Backorders" button per item type
    - Group backorders by item type
    - _Requirements: 3.1, 3.2, 5.2_

- [ ] 10. Update barrel exports
  - Export all components from `src/components/consumables/index.ts`
  - _Requirements: 3.1_

---

## Phase 3: Shared Hooks

- [ ] 11. Implement useConsumableFilters hook

  - [ ] 11.1 Create `src/hooks/consumables/useConsumableFilters.ts`
    - Implement hook interface with generic type parameter
    - Create filters state with useState
    - Implement setFilters, updateFilter, clearFilters functions
    - Implement filter logic with useMemo:
      - Search filter (name and description)
      - Category filter
      - Low stock filter
    - Extract unique categories with useMemo
    - Compute hasActiveFilters boolean
    - Return all state and functions
    - _Requirements: 3.1, 3.2_

- [ ] 12. Implement useConsumables hook

  - [ ] 12.1 Create `src/hooks/consumables/useConsumables.ts`
    - Implement hook interface with role parameter
    - Create state for consumables, isLoading, error
    - Implement fetchConsumables function:
      - Use different endpoints based on role
      - Handle authentication token
      - Parse response data
      - Handle errors
    - Implement requestConsumable function (user role):
      - POST to /api/consumables/request
      - Show success/error feedback
      - Auto-refetch on success
    - Implement adjustStock function (admin role):
      - PUT to /api/admin/consumables
      - Show success/error feedback
      - Auto-refetch on success
    - Implement refetch function
    - Use useEffect for auto-fetch on mount
    - Return all state and functions
    - _Requirements: 3.1, 3.2, 5.1, 5.2_

- [ ] 13. Implement useStockAdjustment hook (admin only)

  - [ ] 13.1 Create `src/hooks/consumables/useStockAdjustment.ts`
    - Implement hook interface with optional onSuccess callback
    - Create state for isAdjusting and adjustingStockId
    - Implement adjustStock function:
      - Set adjustingStockId to track which item is being adjusted
      - PUT to /api/admin/consumables
      - Handle errors
      - Call onSuccess callback
      - Reset adjustingStockId
    - Return adjustStock, isAdjusting, adjustingStockId
    - _Requirements: 3.1, 3.2, 5.2_

- [ ] 14. Update barrel exports
  - Export all hooks from `src/hooks/consumables/index.ts`
  - _Requirements: 3.1_

---

## Phase 4: Refactor User Page

- [ ] 15. Refactor `/consumables/page.tsx` to use shared components

  - [ ] 15.1 Import shared components and hooks

    - Import ConsumableSummary, ConsumableFilters, ConsumableList
    - Import useConsumables, useConsumableFilters hooks
    - Import ConsumableItem type
    - _Requirements: 4.1, 5.1_

  - [ ] 15.2 Replace local state with hooks

    - Replace consumables fetch logic with useConsumables hook (role: 'user')
    - Replace filter state with useConsumableFilters hook
    - Keep CartContext integration
    - Keep showCart state for modal
    - _Requirements: 4.1, 5.1_

  - [ ] 15.3 Replace UI sections with shared components

    - Replace summary cards section with ConsumableSummary component
    - Replace filters section with ConsumableFilters component
    - Replace consumables grid with ConsumableList component
    - Pass role='user' to all components
    - Pass handleRequestConsumable and handleAddToCart callbacks
    - _Requirements: 4.1, 5.1, 6.1, 6.2, 6.3_

  - [ ] 15.4 Remove duplicate code

    - Remove local ConsumableItem component (now using ConsumableCard)
    - Remove local filter logic (now in useConsumableFilters)
    - Remove local fetch logic (now in useConsumables)
    - Keep CartButton, CartModal, and return materials button
    - _Requirements: 4.1, 5.1_

  - [ ] 15.5 Verify all user features work
    - Test search, category filter, low stock filter
    - Test request consumable flow
    - Test add to cart flow
    - Test cart confirmation
    - Test return materials button navigation
    - _Requirements: 4.1, 5.1, 7.1_

---

## Phase 5: Refactor Admin Page

- [ ] 16. Refactor `/admin/consumables/page.tsx` to use shared components

  - [ ] 16.1 Import shared components and hooks

    - Import ConsumableSummary, ConsumableFilters, ConsumableList, BackordersTab
    - Import useConsumables, useConsumableFilters, useStockAdjustment hooks
    - Import ConsumableStockAdmin, BackorderRequest types
    - _Requirements: 4.2, 5.2_

  - [ ] 16.2 Replace local state with hooks

    - Replace stocks fetch logic with useConsumables hook (role: 'admin')
    - Replace filter state with useConsumableFilters hook
    - Use useStockAdjustment hook for stock adjustments
    - Keep activeTab state ('inventory' | 'backorders')
    - Keep backorders state (separate fetch)
    - _Requirements: 4.2, 5.2_

  - [ ] 16.3 Replace inventory tab UI with shared components

    - Replace summary cards with ConsumableSummary component (include backordersCount)
    - Replace filters section with ConsumableFilters component (with result counter)
    - Replace stock items list with ConsumableList component
    - Pass role='admin' to all components
    - Pass onAdjustStock and onViewDetails callbacks
    - _Requirements: 4.2, 5.2, 6.1, 6.2, 6.3_

  - [ ] 16.4 Replace backorders tab with BackordersTab component

    - Replace backorders list UI with BackordersTab component
    - Pass backorders data and processBackorders callback
    - _Requirements: 4.2, 5.2_

  - [ ] 16.5 Remove duplicate code

    - Remove local StockItem component (now using ConsumableCard)
    - Remove local filter logic (now in useConsumableFilters)
    - Remove local fetch logic (now in useConsumables)
    - Keep BulkImportConsumables, Scan QR, Manage Types buttons
    - Keep tabs navigation
    - _Requirements: 4.2, 5.2_

  - [ ] 16.6 Verify all admin features work
    - Test inventory tab with all filters
    - Test stock adjustment (adjust, set, restock)
    - Test view details navigation
    - Test backorders tab
    - Test process backorders
    - Test bulk import integration
    - Test scan QR navigation
    - Test manage types navigation
    - _Requirements: 4.2, 5.2, 7.1_

---

## Phase 6: Polish and Optimization

- [ ] 17. Add performance optimizations

  - [ ] 17.1 Add memoization to expensive computations

    - Memoize filteredItems in useConsumableFilters
    - Memoize categories extraction in useConsumableFilters
    - Memoize summary calculations in ConsumableSummary
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 17.2 Add debouncing to search input
    - Implement debounced search in ConsumableFilters (300ms delay)
    - Use useDebouncedValue or similar utility
    - _Requirements: 6.2_

- [ ] 18. Improve error handling and user feedback

  - [ ] 18.1 Enhance error messages

    - Add user-friendly error messages for common scenarios
    - Add error boundaries for component failures
    - Improve loading states with skeleton screens (optional)
    - _Requirements: 5.1, 5.2, 6.3_

  - [ ] 18.2 Add success feedback
    - Improve success messages for requests and adjustments
    - Consider toast notifications instead of alerts (optional)
    - _Requirements: 5.1, 5.2_

- [ ] 19. Accessibility improvements

  - [ ] 19.1 Add ARIA labels and roles

    - Add aria-label to icon buttons
    - Add role="status" to loading states
    - Add aria-live regions for dynamic content
    - _Requirements: 6.1, 6.2, 6.3, 7.2_

  - [ ] 19.2 Improve keyboard navigation
    - Ensure all interactive elements are keyboard accessible
    - Add focus styles
    - Test tab order
    - _Requirements: 6.1, 6.2, 6.3, 7.2_

- [ ] 20. Code cleanup and documentation

  - [ ] 20.1 Add JSDoc comments to components and hooks

    - Document props interfaces
    - Document hook return values
    - Add usage examples
    - _Requirements: 8.1, 8.2_

  - [ ] 20.2 Remove unused code and imports

    - Clean up any remaining duplicate code
    - Remove unused imports
    - Remove commented code
    - _Requirements: 8.2_

  - [ ] 20.3 Update README or create component documentation
    - Document shared components usage
    - Document hooks usage
    - Add examples
    - _Requirements: 8.1_

---

## Phase 7: Testing and Validation

- [ ] 21. Manual testing of user flows

  - [ ] 21.1 Test user page flows

    - Test as regular user: search, filter, request, cart
    - Test edge cases: no stock, low stock, empty results
    - Test responsive design on mobile and desktop
    - _Requirements: 7.1_

  - [ ] 21.2 Test admin page flows
    - Test as admin: inventory view, filters, stock adjustment
    - Test backorders tab and processing
    - Test bulk import and other admin features
    - Test responsive design on mobile and desktop
    - _Requirements: 7.1_

- [ ] 22. Cross-browser testing

  - Test on Chrome, Firefox, Safari, Edge
  - Test on mobile browsers (iOS Safari, Chrome Mobile)
  - _Requirements: 7.1_

- [ ] 23. Accessibility testing

  - Test with keyboard only (no mouse)
  - Test with screen reader (NVDA, JAWS, or VoiceOver)
  - Check color contrast with accessibility tools
  - _Requirements: 7.2_

- [ ] 24. Performance testing
  - Check bundle sizes with webpack-bundle-analyzer
  - Test with large datasets (100+ items)
  - Check for memory leaks
  - Measure load times
  - _Requirements: 6.1, 6.2, 6.3_

---

## Phase 8: Deployment and Monitoring

- [ ] 25. Prepare for deployment

  - [ ] 25.1 Create deployment checklist

    - Verify all tests pass
    - Verify no console errors
    - Verify no TypeScript errors
    - Create backup of current pages
    - _Requirements: 8.2_

  - [ ] 25.2 Deploy to staging environment
    - Deploy changes to staging
    - Run smoke tests
    - Get stakeholder approval
    - _Requirements: 8.2_

- [ ] 26. Deploy to production

  - [ ] 26.1 Production deployment

    - Deploy during low-traffic window
    - Monitor error logs
    - Monitor performance metrics
    - Be ready to rollback if needed
    - _Requirements: 8.2_

  - [ ] 26.2 Post-deployment validation
    - Verify user page works in production
    - Verify admin page works in production
    - Check analytics for errors
    - Monitor user feedback
    - _Requirements: 8.2_

- [ ] 27. Documentation and handoff

  - [ ] 27.1 Update project documentation

    - Document new architecture
    - Update component library docs
    - Create migration guide for future developers
    - _Requirements: 8.1_

  - [ ] 27.2 Team knowledge transfer
    - Present new architecture to team
    - Answer questions
    - Provide examples of extending components
    - _Requirements: 8.1_

---

## Success Criteria

✅ All shared components are implemented and reusable
✅ Both user and admin pages use shared components
✅ No significant code duplication between pages
✅ All existing features work correctly
✅ Performance is equal or better than before
✅ Accessibility standards are met
✅ Documentation is complete
✅ Team is trained on new architecture

## Notes

- **Testing Priority**: Focus on core flows (request, adjust stock) before edge cases
- **Incremental Deployment**: Consider deploying user page first, then admin page
- **Rollback Plan**: Keep old page files as backup for 1 sprint after deployment
- **Feature Flags**: Consider using feature flags to toggle between old/new implementations
- **Monitoring**: Set up alerts for errors in new components
