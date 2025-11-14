# Implementation Plan - Cache Optimization

- [x] 1. Create backend API endpoints for new mutations


  - Create batch loans endpoint at `/api/loans/batch`
  - Create consume consumable endpoint at `/api/consumables/consume`
  - Create return consumable endpoint at `/api/consumables/return`
  - Ensure all endpoints include proper authentication and error handling
  - _Requirements: 1.1, 1.2, 1.3_



- [ ] 1.1 Implement batch loans API endpoint
  - Create file `src/app/api/loans/batch/route.ts`
  - Implement POST handler that accepts array of loan objects
  - Validate input array and each loan object
  - Create all loans in a transaction for atomicity
  - Return array of created loans with success message
  - Include proper error handling and status codes

  - _Requirements: 1.1_

- [ ] 1.2 Implement consume consumable API endpoint
  - Create file `src/app/api/consumables/consume/route.ts`
  - Implement POST handler that accepts item_type_id, quantity, and notes
  - Validate user has permission to consume
  - Check stock availability before consuming
  - Create consumption movement record
  - Update consumable stock quantity

  - Return movement record with success message
  - _Requirements: 1.2_

- [ ] 1.3 Implement return consumable API endpoint
  - Create file `src/app/api/consumables/return/route.ts`
  - Implement POST handler that accepts item_type_id, quantity, and notes
  - Validate return request


  - Create return movement record
  - Update consumable stock quantity
  - Return movement record with success message
  - _Requirements: 1.3_

- [ ] 2. Add new mutations and queries to RTK Query API service
  - Open `src/services/api.ts`
  - Add `createBatchLoans` mutation with proper types and tag invalidation


  - Add `consumeConsumable` mutation with proper types and tag invalidation
  - Add `returnConsumable` mutation with proper types and tag invalidation
  - Add `getMyConsumptions` query with proper types and tag provision
  - Export all new hooks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_


- [ ] 2.1 Add createBatchLoans mutation to API service
  - Define TypeScript interfaces for BatchLoansRequest and BatchLoansResponse
  - Add mutation endpoint with URL `/loans/batch` and method POST
  - Configure to invalidate tags: ['Loan', 'Tool', 'Notification']
  - Export `useCreateBatchLoansMutation` hook

  - _Requirements: 1.1, 1.5, 1.6_

- [ ] 2.2 Add consumeConsumable mutation to API service
  - Define TypeScript interfaces for ConsumeConsumableRequest and ConsumeConsumableResponse
  - Add mutation endpoint with URL `/consumables/consume` and method POST
  - Configure to invalidate tags: ['Consumable', 'Notification']

  - Export `useConsumeConsumableMutation` hook
  - _Requirements: 1.2, 1.5, 1.6_

- [ ] 2.3 Add returnConsumable mutation to API service
  - Define TypeScript interfaces for ReturnConsumableRequest and ReturnConsumableResponse


  - Add mutation endpoint with URL `/consumables/return` and method POST
  - Configure to invalidate tags: ['Consumable']
  - Export `useReturnConsumableMutation` hook
  - _Requirements: 1.3, 1.5, 1.6_

- [ ] 2.4 Add getMyConsumptions query to API service
  - Define TypeScript interface for MyConsumptionsResponse
  - Add query endpoint with URL `/consumables/my-consumption`
  - Configure to provide tags: ['Consumable']
  - Export `useGetMyConsumptionsQuery` hook


  - _Requirements: 1.4, 1.5, 1.6_

- [ ] 3. Migrate tools scan page to use RTK Query
  - Open `src/app/tools/scan/page.tsx`
  - Import `useCreateBatchLoansMutation` hook
  - Replace fetch calls in `handleConfirmBag` with mutation hook
  - Remove manual token handling (RTK Query handles it automatically)

  - Update loading states to use mutation `isLoading` property
  - Update error handling to use mutation error state
  - Remove manual state management for loading and errors
  - Test complete loan creation flow from scan to dashboard
  - _Requirements: 2.1, 2.6, 2.7, 3.1, 4.1, 4.2, 7.2_



- [ ] 3.1 Replace fetch with useCreateBatchLoansMutation in tools scan
  - Add `const [createBatchLoans, { isLoading, isError, error }] = useCreateBatchLoansMutation()` at component top
  - Modify `handleConfirmBag` to build loans array from bagItems
  - Replace Promise.all fetch calls with single `await createBatchLoans({ loans }).unwrap()`
  - Remove localStorage.getItem('token') calls
  - Update success handling to use mutation response
  - Update error handling to use mutation error state
  - _Requirements: 2.1, 2.6, 2.7_



- [ ] 3.2 Update loading and error UI in tools scan page
  - Replace local `isLoading` state with mutation `isLoading`
  - Add error display component using mutation `isError` and `error`
  - Update button disabled state to use mutation `isLoading`
  - Add loading spinner to confirm button when `isLoading` is true

  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4. Migrate consumables scan page to use RTK Query
  - Open `src/app/consumables/scan/page.tsx`
  - Import `useConsumeConsumableMutation` hook


  - Replace fetch calls in `handleConfirmCart` with mutation hook
  - Remove manual token handling
  - Update loading states to use mutation `isLoading` property
  - Update error handling to use mutation error state
  - Test complete consumption flow from scan to list update
  - _Requirements: 2.3, 2.6, 2.7, 3.3, 4.1, 4.2, 7.3_

- [x] 4.1 Replace fetch with useConsumeConsumableMutation in consumables scan

  - Add `const [consumeConsumable, { isLoading, isError, error }] = useConsumeConsumableMutation()` at component top
  - Modify `handleConfirmCart` to use Promise.all with mutation calls
  - Replace fetch calls with `consumeConsumable({ item_type_id, quantity, notes }).unwrap()`
  - Remove localStorage.getItem('token') calls
  - Update success and error handling
  - _Requirements: 2.3, 2.6, 2.7_


- [ ] 4.2 Update loading and error UI in consumables scan page
  - Replace local `isLoading` state with mutation `isLoading`
  - Add error display component using mutation error state


  - Update button disabled state to use mutation `isLoading`
  - Add loading spinner to confirm button
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Migrate consumables return page to use RTK Query
  - Open `src/app/consumables/return/page.tsx`
  - Import `useReturnConsumableMutation` hook
  - Replace fetch calls with mutation hook
  - Remove manual token handling

  - Update loading and error states
  - Test complete return flow
  - _Requirements: 2.4, 2.6, 2.7, 3.4, 4.1, 4.2, 7.3_

- [ ] 5.1 Replace fetch with useReturnConsumableMutation in consumables return
  - Add `const [returnConsumable, { isLoading, isError, error }] = useReturnConsumableMutation()` at component top

  - Replace fetch calls with mutation hook calls
  - Remove manual token and state management
  - Update success and error handling
  - _Requirements: 2.4, 2.6, 2.7_



- [ ] 5.2 Update loading and error UI in consumables return page
  - Replace local loading state with mutation `isLoading`
  - Add error display using mutation error state
  - Update button states
  - _Requirements: 4.1, 4.2, 4.3_


- [ ] 6. Migrate my loans page consumptions tab to use RTK Query
  - Open `src/app/my-loans/page.tsx`
  - Import `useGetMyConsumptionsQuery` hook
  - Replace useEffect fetch with query hook
  - Remove manual loading state management (`isLoadingConsumptions`, `setIsLoadingConsumptions`)
  - Remove manual error handling

  - Update component to use query data directly
  - Test consumptions tab loading and automatic updates
  - _Requirements: 2.5, 2.6, 2.7, 3.4, 4.4, 4.5_

- [x] 6.1 Replace useEffect fetch with useGetMyConsumptionsQuery

  - Add `const { data: consumptionsData, isLoading: isLoadingConsumptions, error: consumptionsError } = useGetMyConsumptionsQuery()` at component top
  - Remove useEffect that fetches consumptions
  - Remove `consumptions` and `setConsumptions` state
  - Update component to use `consumptionsData?.data || []`
  - _Requirements: 2.5, 2.6, 2.7_

- [ ] 6.2 Update loading and error UI in my loans consumptions tab
  - Use query `isLoadingConsumptions` for loading state
  - Add error display using query `consumptionsError`

  - Remove manual state management
  - _Requirements: 4.4, 4.5_

- [ ] 7. Configure cache timing and polling for optimal performance
  - Review each query in `src/services/api.ts`
  - Add `keepUnusedDataFor` configuration based on data volatility
  - Add `pollingInterval` for real-time data (notifications, active loans)
  - Add `skipPollingIfUnfocused: true` for performance
  - Document cache timing decisions

  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.1 Configure cache timing for all queries
  - Set `keepUnusedDataFor: 300` (5 min) for `getMyLoans` (frequently accessed)
  - Set `keepUnusedDataFor: 180` (3 min) for `getConsumables` (moderate volatility)
  - Set `keepUnusedDataFor: 60` (1 min) for `getDashboardStats` (high volatility)
  - Set `keepUnusedDataFor: 60` (1 min) for `getNotifications` (already configured)
  - _Requirements: 5.1, 5.2, 5.3_


- [ ] 7.2 Configure polling for real-time data
  - Document that components should use `pollingInterval: 30000` for notifications
  - Document that components should use `pollingInterval: 60000` for active loans
  - Document that all polling should include `skipPollingIfUnfocused: true`
  - Add examples to component documentation
  - _Requirements: 5.4, 5.5_

- [x] 8. Test complete flows end-to-end

  - Test loan creation flow: scan → add to bag → confirm → verify dashboard updates
  - Test tool return flow: return tool → verify my-loans updates
  - Test consumable consumption flow: scan → add to cart → confirm → verify list updates
  - Test consumable return flow: return → verify list updates
  - Test my loans consumptions tab: verify automatic updates after consumption
  - Verify no manual reloads are needed for any flow
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5_


- [ ] 8.1 Test loan creation end-to-end flow
  - Scan multiple tools and add to bag
  - Confirm loan with due date
  - Verify success message appears
  - Navigate to dashboard without reload
  - Verify dashboard shows updated loan count

  - Navigate to my-loans without reload
  - Verify new loans appear in active loans list
  - _Requirements: 3.1, 7.2_

- [ ] 8.2 Test tool return end-to-end flow
  - Navigate to my-loans page
  - Return an active loan
  - Verify success message appears

  - Verify loan moves from active to history without reload
  - Navigate to dashboard without reload
  - Verify dashboard stats updated
  - _Requirements: 3.2, 7.2_

- [ ] 8.3 Test consumable consumption end-to-end flow
  - Scan consumable and add to cart

  - Confirm cart
  - Verify success message appears
  - Navigate to consumables list without reload
  - Verify stock quantity decreased
  - Navigate to my-loans consumptions tab without reload



  - Verify consumption appears in history
  - _Requirements: 3.3, 7.3_

- [ ] 8.4 Test consumable return end-to-end flow
  - Navigate to consumables return page
  - Return a consumable
  - Verify success message appears
  - Navigate to consumables list without reload

  - Verify stock quantity increased
  - _Requirements: 3.4, 7.3_

- [ ] 8.5 Test error handling scenarios
  - Test network error during mutation (disconnect network)
  - Verify error message displays correctly
  - Test API error (invalid data)
  - Verify error message displays correctly

  - Test validation error (quantity exceeds stock)
  - Verify error message displays correctly
  - _Requirements: 4.3, 4.5, 7.5_

- [ ] 9. Performance testing and optimization
  - Measure page load times before and after migration
  - Measure time to see updates after actions

  - Check network tab for unnecessary requests
  - Verify cache is working correctly (no duplicate requests)
  - Document performance improvements
  - _Requirements: 5.6, 7.5_

- [ ] 9.1 Measure and document performance metrics
  - Record baseline metrics before migration (page load times, API calls)
  - Record metrics after migration
  - Verify time to see updates is < 500ms
  - Verify reduction in API calls (should be ~50% fewer)
  - Document findings in performance report
  - _Requirements: 5.6_

- [ ] 9.2 Verify cache behavior
  - Navigate between pages and verify cached data is used
  - Perform mutation and verify only affected queries refetch
  - Check network tab to confirm no duplicate requests
  - Verify cache invalidation works correctly
  - _Requirements: 5.2, 5.3_

- [ ] 10. Code cleanup and documentation
  - Remove old fetch-based implementations from migrated components
  - Remove unused utility functions
  - Clean up commented code
  - Add JSDoc comments to new mutations and queries
  - Update component documentation
  - Create developer guide for adding new mutations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 10.1 Remove deprecated code
  - Remove old fetch calls from tools scan page
  - Remove old fetch calls from consumables scan page
  - Remove old fetch calls from consumables return page
  - Remove old useEffect fetch from my-loans page
  - Remove unused state management code
  - Remove commented code
  - _Requirements: 6.2, 6.6_

- [ ] 10.2 Add documentation
  - Add JSDoc comments to all new mutations in api.ts
  - Add JSDoc comments to all new queries in api.ts
  - Document cache invalidation strategy
  - Document tag usage patterns
  - Create examples for common mutation patterns
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 10.3 Create developer guide
  - Create `docs/rtk-query-guide.md` file
  - Document how to add new mutations
  - Document cache invalidation patterns
  - Document when to use which cache settings
  - Add troubleshooting section
  - Include code examples
  - _Requirements: 6.3, 6.4, 6.5_

- [ ]* 11. Optional: Implement optimistic updates for better UX
  - Add optimistic update to returnTool mutation
  - Add optimistic update to createBatchLoans mutation
  - Add optimistic update to consumeConsumable mutation
  - Test optimistic updates with network delays
  - Test rollback behavior on errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 11.1 Add optimistic update to returnTool mutation
  - Add `onQueryStarted` callback to returnTool mutation
  - Implement optimistic cache update for getMyLoans query
  - Update loan status to 'returned' and set return_date
  - Add rollback logic using patchResult.undo() on error
  - Test with network delay to verify instant UI update
  - _Requirements: 8.1, 8.2_

- [ ]* 11.2 Add optimistic update to createBatchLoans mutation
  - Add `onQueryStarted` callback to createBatchLoans mutation
  - Implement optimistic cache update for getMyLoans query
  - Add new loans to active loans list with 'pending' indicator
  - Add rollback logic on error
  - Test with network delay
  - _Requirements: 8.3_

- [ ]* 11.3 Add optimistic update to consumeConsumable mutation
  - Add `onQueryStarted` callback to consumeConsumable mutation
  - Implement optimistic cache update for getConsumables query
  - Decrease stock quantity immediately
  - Add rollback logic on error
  - Test with network delay
  - _Requirements: 8.4_
