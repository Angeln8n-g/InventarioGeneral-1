# RTK Query Guide - Cache Optimization

## Overview

This guide explains how to use RTK Query for state management and caching in the Inventory Management System. RTK Query provides automatic cache invalidation, loading states, and error handling, eliminating the need for manual fetch calls and page reloads.

## Table of Contents

1. [Adding New Mutations](#adding-new-mutations)
2. [Adding New Queries](#adding-new-queries)
3. [Cache Invalidation Strategy](#cache-invalidation-strategy)
4. [Using Mutations in Components](#using-mutations-in-components)
5. [Using Queries in Components](#using-queries-in-components)
6. [Cache Timing Configuration](#cache-timing-configuration)
7. [Error Handling](#error-handling)
8. [Troubleshooting](#troubleshooting)

## Adding New Mutations

Mutations are used for operations that modify data (POST, PUT, DELETE).

### Step 1: Define TypeScript Types

```typescript
// In src/services/api.ts

interface MyMutationRequest {
  field1: string
  field2: number
  field3?: string // optional
}

interface MyMutationResponse {
  data: MyDataType
  message: string
}
```

### Step 2: Add Mutation to API Service

```typescript
// In src/services/api.ts, inside endpoints: (builder) => ({...})

/**
 * Brief description of what this mutation does
 * @param field1 - Description of field1
 * @param field2 - Description of field2
 * @returns Description of return value
 */
myMutation: builder.mutation<MyMutationResponse, MyMutationRequest>({
  query: (data) => ({
    url: '/api/my-endpoint',
    method: 'POST',
    body: data,
  }),
  invalidatesTags: ['Tag1', 'Tag2'], // Tags to invalidate after success
}),
```

### Step 3: Export the Hook

```typescript
// At the bottom of src/services/api.ts

export const {
  // ... existing hooks
  useMyMutationMutation,
} = api
```

## Adding New Queries

Queries are used for fetching data (GET).

### Step 1: Define TypeScript Types

```typescript
interface MyQueryResponse {
  data: MyDataType[]
  total: number
}
```

### Step 2: Add Query to API Service

```typescript
/**
 * Fetch my data
 * @returns My data with total count
 */
getMyData: builder.query<MyQueryResponse, void>({
  query: () => '/api/my-data',
  providesTags: ['MyData'], // Tags this query provides
  keepUnusedDataFor: 180, // Cache time in seconds (3 minutes)
}),
```

### Step 3: Export the Hook

```typescript
export const {
  // ... existing hooks
  useGetMyDataQuery,
} = api
```

## Cache Invalidation Strategy

### Tag System

RTK Query uses tags to manage cache invalidation. When a mutation invalidates a tag, all queries that provide that tag will automatically refetch.

### Available Tags

| Tag | Provided By | Invalidated By | Purpose |
|-----|-------------|----------------|---------|
| `Tool` | `getToolByQR`, `getDashboardStats` | `createLoan`, `returnTool`, `createBatchLoans`, `adjustToolStatus` | Tool availability and status |
| `Loan` | `getMyLoans` | `createLoan`, `returnTool`, `createBatchLoans` | Loan records |
| `Consumable` | `getConsumables`, `getMyConsumptions` | `consumeConsumable`, `returnConsumable`, `requestConsumable` | Consumable stock and history |
| `Notification` | `getNotifications` | `createLoan`, `createBatchLoans`, `consumeConsumable`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification` | User notifications |

### Example Flow

1. User creates a loan using `createBatchLoans` mutation
2. Mutation succeeds and invalidates `['Loan', 'Tool', 'Notification']` tags
3. All queries providing these tags automatically refetch:
   - `getMyLoans` (provides `Loan`)
   - `getToolByQR` (provides `Tool`)
   - `getNotifications` (provides `Notification`)
4. UI updates automatically without manual reload

## Using Mutations in Components

### Basic Usage

```typescript
import { useMyMutationMutation } from '@/services/api'

function MyComponent() {
  const [myMutation, { isLoading, isError, error, isSuccess }] = useMyMutationMutation()

  const handleAction = async () => {
    try {
      const result = await myMutation({
        field1: 'value1',
        field2: 123,
      }).unwrap()

      // Success - cache automatically invalidated
      console.log('Success:', result)
      alert('Operation successful!')
    } catch (err) {
      // Error handling
      console.error('Failed:', err)
    }
  }

  return (
    <button 
      onClick={handleAction}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : 'Submit'}
    </button>
  )
}
```

### Batch Operations

```typescript
const handleBatchOperation = async () => {
  try {
    // Process multiple items
    const promises = items.map(item =>
      myMutation({ data: item }).unwrap()
    )

    const results = await Promise.allSettled(promises)
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (failed > 0) {
      alert(`${failed} operations failed. ${successful} were successful.`)
    } else {
      alert(`All ${successful} operations completed successfully!`)
    }
  } catch (err) {
    console.error('Batch operation error:', err)
  }
}
```

## Using Queries in Components

### Basic Usage

```typescript
import { useGetMyDataQuery } from '@/services/api'

function MyComponent() {
  const { data, isLoading, isError, error, refetch } = useGetMyDataQuery()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      {data?.data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  )
}
```

### With Polling

```typescript
const { data } = useGetMyDataQuery(undefined, {
  pollingInterval: 30000, // Poll every 30 seconds
  skipPollingIfUnfocused: true, // Pause when tab not focused
})
```

### Conditional Fetching

```typescript
const { data } = useGetMyDataQuery(undefined, {
  skip: !shouldFetch, // Skip query if condition is false
})
```

## Cache Timing Configuration

### Guidelines

- **High Volatility Data** (1 minute): Dashboard stats, real-time notifications
- **Moderate Volatility Data** (3 minutes): Consumables list, general inventory
- **Low Volatility Data** (5 minutes): User loans, historical data

### Example

```typescript
getMyData: builder.query<MyQueryResponse, void>({
  query: () => '/api/my-data',
  providesTags: ['MyData'],
  keepUnusedDataFor: 180, // 3 minutes for moderate volatility
}),
```

## Error Handling

### Mutation Errors

```typescript
const [myMutation, { isError, error }] = useMyMutationMutation()

// Display error in UI
{isError && (
  <div className="bg-red-50 border border-red-200 rounded p-4">
    <p className="text-red-800">
      {error?.data?.error?.message || 'An error occurred'}
    </p>
  </div>
)}
```

### Query Errors

```typescript
const { isError, error } = useGetMyDataQuery()

if (isError) {
  return (
    <div className="text-center py-8">
      <p className="text-red-600">Failed to load data</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  )
}
```

## Troubleshooting

### Cache Not Updating

**Problem:** UI doesn't update after mutation

**Solution:** Check that:
1. Mutation has correct `invalidatesTags`
2. Query has correct `providesTags`
3. Tags match exactly (case-sensitive)

```typescript
// ❌ Wrong - tags don't match
mutation: { invalidatesTags: ['tool'] }
query: { providesTags: ['Tool'] }

// ✅ Correct - tags match
mutation: { invalidatesTags: ['Tool'] }
query: { providesTags: ['Tool'] }
```

### Multiple Unnecessary Requests

**Problem:** Same query called multiple times

**Solution:** Use `keepUnusedDataFor` to cache results

```typescript
getMyData: builder.query<MyQueryResponse, void>({
  query: () => '/api/my-data',
  keepUnusedDataFor: 180, // Cache for 3 minutes
}),
```

### Stale Data After Navigation

**Problem:** Old data shows when navigating back

**Solution:** Either:
1. Increase `keepUnusedDataFor` time
2. Use `refetch()` on component mount
3. Reduce cache time for more frequent updates

### Token Not Included in Requests

**Problem:** 401 Unauthorized errors

**Solution:** Token is automatically included via `prepareHeaders` in base query. Ensure Redux store has valid token:

```typescript
// Check Redux state
const token = useSelector((state: RootState) => state.auth.token)
```

## Best Practices

1. **Always use TypeScript types** for requests and responses
2. **Document mutations and queries** with JSDoc comments
3. **Use appropriate cache times** based on data volatility
4. **Handle loading and error states** in UI
5. **Use `.unwrap()`** for mutations to handle errors with try/catch
6. **Invalidate all relevant tags** after mutations
7. **Test cache invalidation** after implementing new mutations
8. **Use polling sparingly** to avoid unnecessary server load
9. **Implement optimistic updates** for better UX (optional)
10. **Monitor network tab** to verify cache is working correctly

## Examples

### Complete Mutation Example

```typescript
// In src/services/api.ts
createItem: builder.mutation<
  { data: Item; message: string },
  { name: string; quantity: number }
>({
  query: (itemData) => ({
    url: '/api/items',
    method: 'POST',
    body: itemData,
  }),
  invalidatesTags: ['Item', 'Notification'],
}),

// In component
import { useCreateItemMutation } from '@/services/api'

function CreateItemForm() {
  const [createItem, { isLoading, isError, error }] = useCreateItemMutation()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createItem({ name, quantity }).unwrap()
      alert('Item created successfully!')
      setName('')
      setQuantity(1)
    } catch (err) {
      console.error('Failed to create item:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
      />
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value))}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Item'}
      </button>
      {isError && <p className="text-red-600">{error?.data?.error?.message}</p>}
    </form>
  )
}
```

### Complete Query Example

```typescript
// In src/services/api.ts
getItems: builder.query<
  { data: Item[]; total: number },
  void
>({
  query: () => '/api/items',
  providesTags: ['Item'],
  keepUnusedDataFor: 180,
}),

// In component
import { useGetItemsQuery } from '@/services/api'

function ItemsList() {
  const { data, isLoading, isError, error, refetch } = useGetItemsQuery()

  if (isLoading) {
    return <div className="animate-spin">Loading...</div>
  }

  if (isError) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      <h2>Items ({data?.total})</h2>
      {data?.data.map(item => (
        <div key={item.id}>
          {item.name} - Quantity: {item.quantity}
        </div>
      ))}
    </div>
  )
}
```

## Additional Resources

- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Cache Behavior](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior)
- [Automated Refetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching)
