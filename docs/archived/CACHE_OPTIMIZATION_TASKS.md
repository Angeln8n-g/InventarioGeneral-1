# Cache Optimization - Implementation Tasks

## Overview
Este documento contiene todas las tareas necesarias para implementar la optimización de caché y eliminación de recargas manuales en la aplicación.

---

## Phase 1: Add Missing Mutations to API Service

### Task 1.1: Add Batch Loans Mutation
- [ ] Open `src/services/api.ts`
- [ ] Add `createBatchLoans` mutation endpoint
- [ ] Configure `invalidatesTags: ['Loan', 'Tool', 'Notification']`
- [ ] Add TypeScript types for request/response
- [ ] Test endpoint with Postman/Thunder Client
- _Requirements: API must support batch loan creation_

### Task 1.2: Add Consume Consumable Mutation
- [ ] Add `consumeConsumable` mutation endpoint to `src/services/api.ts`
- [ ] Configure `invalidatesTags: ['Consumable', 'Notification']`
- [ ] Add TypeScript types for consumable consumption
- [ ] Test endpoint functionality
- _Requirements: Consumable consumption API endpoint_

### Task 1.3: Add Return Consumable Mutation
- [ ] Add `returnConsumable` mutation endpoint to `src/services/api.ts`
- [ ] Configure `invalidatesTags: ['Consumable']`
- [ ] Add TypeScript types for consumable returns
- [ ] Test endpoint functionality
- _Requirements: Consumable return API endpoint_

### Task 1.4: Add Get My Consumptions Query
- [ ] Add `getMyConsumptions` query endpoint to `src/services/api.ts`
- [ ] Configure `providesTags: ['Consumable']`
- [ ] Add TypeScript types for consumption history
- [ ] Test query functionality
- _Requirements: User consumption history API endpoint_

### Task 1.5: Export New Hooks
- [ ] Export all new mutation and query hooks from `src/services/api.ts`
- [ ] Verify hooks are properly typed
- [ ] Update API documentation if exists
- _Requirements: All tasks 1.1-1.4 completed_

---

## Phase 2: Migrate Components to Use RTK Query Mutations

### Task 2.1: Migrate Tools Scan Page
- [ ] Open `src/app/tools/scan/page.tsx`
- [ ] Import `useCreateBatchLoansMutation` hook
- [ ] Replace `fetch` calls in `handleConfirmBag` with mutation
- [ ] Remove manual token handling (RTK Query handles it)
- [ ] Update loading states to use mutation `isLoading`
- [ ] Update error handling to use mutation errors
- [ ] Test loan creation flow end-to-end
- [ ] Verify dashboard updates automatically after loan creation
- _Requirements: Task 1.1 completed_

### Task 2.2: Migrate Tools Return Page
- [ ] Open `src/app/tools/return/page.tsx`
- [ ] Import `useReturnToolMutation` hook (already exists)
- [ ] Replace any `fetch` calls with RTK Query mutation
- [ ] Update loading and error states
- [ ] Test tool return flow end-to-end
- [ ] Verify my-loans page updates automatically
- _Requirements: Existing returnTool mutation in API_

### Task 2.3: Migrate Consumables Scan Page
- [ ] Open `src/app/consumables/scan/page.tsx`
- [ ] Import `useConsumeConsumableMutation` hook
- [ ] Replace `fetch` calls with mutation
- [ ] Update loading and error states
- [ ] Test consumable consumption flow
- [ ] Verify consumables list updates automatically
- _Requirements: Task 1.2 completed_

### Task 2.4: Migrate Consumables Return Page
- [ ] Open `src/app/consumables/return/page.tsx`
- [ ] Import `useReturnConsumableMutation` hook
- [ ] Replace `fetch` calls with mutation
- [ ] Update loading and error states
- [ ] Test consumable return flow
- [ ] Verify consumables list updates automatically
- _Requirements: Task 1.3 completed_

### Task 2.5: Migrate My Loans Consumptions Tab
- [ ] Open `src/app/my-loans/page.tsx`
- [ ] Replace `useEffect` fetch with `useGetMyConsumptionsQuery` hook
- [ ] Remove manual loading state management
- [ ] Remove manual error handling
- [ ] Update component to use query data
- [ ] Test consumptions tab loading and display
- _Requirements: Task 1.4 completed_

---

## Phase 3: Optimize Navigation and Refetching

### Task 3.1: Add Refetch to Critical Navigation Points
- [ ] Identify all navigation points after mutations
- [ ] Add `refetch` calls before navigation where needed
- [ ] Test navigation flows to ensure data is fresh
- _Requirements: Phase 2 completed_

### Task 3.2: Implement Router Refresh for Server Components
- [ ] Identify server components that need refresh
- [ ] Add `router.refresh()` after mutations if needed
- [ ] Test server component data updates
- _Requirements: Phase 2 completed_

### Task 3.3: Configure Polling for Real-time Data
- [ ] Review which queries need polling (notifications, active loans)
- [ ] Configure `pollingInterval` for real-time queries
- [ ] Add `skipPollingIfUnfocused: true` for performance
- [ ] Test polling behavior
- _Requirements: Phase 2 completed_

### Task 3.4: Add Cache Timing Configuration
- [ ] Review and configure `keepUnusedDataFor` for each query
- [ ] Set appropriate cache times based on data volatility
- [ ] Document cache timing decisions
- _Requirements: Phase 2 completed_

---

## Phase 4: Implement Optimistic Updates (Optional)

### Task 4.1: Add Optimistic Update to Return Tool
- [ ] Open `src/services/api.ts`
- [ ] Add `onQueryStarted` to `returnTool` mutation
- [ ] Implement optimistic cache update
- [ ] Add rollback on error
- [ ] Test optimistic update behavior
- _Requirements: Phase 2 completed_

### Task 4.2: Add Optimistic Update to Create Loan
- [ ] Add `onQueryStarted` to loan creation mutations
- [ ] Implement optimistic cache update
- [ ] Add rollback on error
- [ ] Test optimistic update behavior
- _Requirements: Phase 2 completed_

### Task 4.3: Add Optimistic Update to Consume Consumable
- [ ] Add `onQueryStarted` to `consumeConsumable` mutation
- [ ] Implement optimistic cache update
- [ ] Add rollback on error
- [ ] Test optimistic update behavior
- _Requirements: Phase 2 completed_

---

## Testing & Validation

### Task 5.1: End-to-End Testing
- [ ] Test complete loan creation flow
- [ ] Test complete tool return flow
- [ ] Test complete consumable consumption flow
- [ ] Test complete consumable return flow
- [ ] Verify all dashboards update automatically
- [ ] Verify no manual reloads are needed
- _Requirements: All Phase 2 tasks completed_

### Task 5.2: Performance Testing
- [ ] Measure page load times before/after
- [ ] Measure time to see updates after actions
- [ ] Check network tab for unnecessary requests
- [ ] Verify cache is working correctly
- [ ] Document performance improvements
- _Requirements: All Phase 2 tasks completed_

### Task 5.3: Error Handling Testing
- [ ] Test behavior with network errors
- [ ] Test behavior with API errors
- [ ] Verify error messages are user-friendly
- [ ] Test rollback behavior for optimistic updates
- _Requirements: All Phase 2 tasks completed_

### Task 5.4: Cross-browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile browsers
- _Requirements: All Phase 2 tasks completed_

---

## Documentation & Cleanup

### Task 6.1: Update Component Documentation
- [ ] Document new mutation usage patterns
- [ ] Add JSDoc comments to new hooks
- [ ] Update README if needed
- _Requirements: Phase 2 completed_

### Task 6.2: Remove Deprecated Code
- [ ] Remove old fetch-based implementations
- [ ] Remove unused utility functions
- [ ] Clean up commented code
- _Requirements: All phases completed_

### Task 6.3: Create Developer Guide
- [ ] Document how to add new mutations
- [ ] Document cache invalidation patterns
- [ ] Document optimistic update patterns
- [ ] Add examples for common scenarios
- _Requirements: All phases completed_

---

## Progress Tracking

### Phase 1: API Mutations
- **Status**: Not Started
- **Progress**: 0/5 tasks
- **Estimated Time**: 4-6 hours
- **Priority**: HIGH

### Phase 2: Component Migration
- **Status**: Not Started
- **Progress**: 0/5 tasks
- **Estimated Time**: 8-12 hours
- **Priority**: HIGH

### Phase 3: Navigation Optimization
- **Status**: Not Started
- **Progress**: 0/4 tasks
- **Estimated Time**: 4-6 hours
- **Priority**: MEDIUM

### Phase 4: Optimistic Updates
- **Status**: Not Started
- **Progress**: 0/3 tasks
- **Estimated Time**: 6-8 hours
- **Priority**: LOW (Optional)

### Testing & Validation
- **Status**: Not Started
- **Progress**: 0/4 tasks
- **Estimated Time**: 4-6 hours
- **Priority**: HIGH

### Documentation
- **Status**: Not Started
- **Progress**: 0/3 tasks
- **Estimated Time**: 2-3 hours
- **Priority**: MEDIUM

---

## Total Estimated Time
- **Minimum (Phases 1-3 + Testing)**: 20-30 hours
- **Maximum (All Phases)**: 28-41 hours

---

## Notes
- Start with Phase 1 and 2 for immediate impact
- Phase 4 (Optimistic Updates) is optional but provides best UX
- Test thoroughly after each phase before moving to next
- Document any issues or blockers encountered
- Update progress tracking as tasks are completed

---

## Success Criteria
✅ No manual page reloads needed after any action
✅ Dashboard updates automatically after loan/return actions
✅ My Loans page updates automatically
✅ Consumables list updates automatically
✅ All loading states work correctly
✅ All error handling works correctly
✅ Performance is equal or better than before
✅ Code is cleaner and more maintainable
