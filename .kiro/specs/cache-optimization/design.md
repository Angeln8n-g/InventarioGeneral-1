# Design Document - Cache Optimization

## Overview

Este documento describe el diseño técnico para eliminar las recargas manuales de página mediante la implementación completa de RTK Query para gestión de caché y estado. La solución se centra en tres pilares principales:

1. **Completar el API Service**: Agregar todas las mutaciones faltantes al servicio RTK Query
2. **Migrar Componentes**: Reemplazar fetch manual con hooks RTK Query en todos los componentes
3. **Configurar Invalidación Automática**: Establecer tags y estrategias de invalidación para actualizaciones automáticas

### Current State Analysis

**Implementación Actual:**
- RTK Query está parcialmente implementado en `src/services/api.ts`
- Algunos endpoints ya existen: `createLoan`, `returnTool`, `getMyLoans`, `requestConsumable`
- Los componentes usan una mezcla de RTK Query y fetch manual
- No hay invalidación de caché consistente después de mutaciones

**Problemas Identificados:**
- `src/app/tools/scan/page.tsx`: Usa fetch manual para crear préstamos por lotes
- `src/app/consumables/scan/page.tsx`: Usa fetch manual para consumir consumibles
- `src/app/consumables/return/page.tsx`: Usa fetch manual para devolver consumibles
- `src/app/my-loans/page.tsx`: Usa useEffect + fetch para obtener consumos
- Los usuarios deben recargar manualmente para ver cambios

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  (Tools Scan, Consumables Scan, My Loans, etc.)            │
└────────────────────┬────────────────────────────────────────┘
                     │ Uses RTK Query Hooks
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   RTK Query API Service                      │
│                   (src/services/api.ts)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Queries    │  │  Mutations   │  │  Cache Tags  │     │
│  │              │  │              │  │              │     │
│  │ - getMyLoans │  │ - createLoan │  │ - Tool       │     │
│  │ - getTools   │  │ - returnTool │  │ - Loan       │     │
│  │ - getConsum. │  │ - consume    │  │ - Consumable │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests with Auth
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│                   (Next.js API Routes)                       │
└─────────────────────────────────────────────────────────────┘
```

### Cache Invalidation Flow

```
User Action (e.g., Create Loan)
        │
        ▼
Component calls mutation hook
        │
        ▼
RTK Query sends request to API
        │
        ▼
API responds with success
        │
        ▼
RTK Query invalidates specified tags
        │
        ▼
All queries with those tags refetch automatically
        │
        ▼
UI updates without manual reload
```

## Components and Interfaces

### 1. API Service Extensions

**File:** `src/services/api.ts`

#### New Mutations

```typescript
// Batch Loans Creation
createBatchLoans: builder.mutation<
  { data: Loan[]; message: string },
  { 
    loans: Array<{
      tool_instance_id: number
      due_date: string
      notes?: string
    }>
  }
>({
  query: (batchData) => ({
    url: '/loans/batch',
    method: 'POST',
    body: batchData,
  }),
  invalidatesTags: ['Loan', 'Tool', 'Notification'],
})

// Consume Consumable
consumeConsumable: builder.mutation<
  { data: ConsumableMovement; message: string },
  {
    item_type_id: number
    quantity: number
    notes?: string
  }
>({
  query: (consumeData) => ({
    url: '/consumables/consume',
    method: 'POST',
    body: consumeData,
  }),
  invalidatesTags: ['Consumable', 'Notification'],
})

// Return Consumable
returnConsumable: builder.mutation<
  { data: ConsumableMovement; message: string },
  {
    item_type_id: number
    quantity: number
    notes?: string
  }
>({
  query: (returnData) => ({
    url: '/consumables/return',
    method: 'POST',
    body: returnData,
  }),
  invalidatesTags: ['Consumable'],
})

// Get My Consumptions
getMyConsumptions: builder.query<
  { data: ConsumptionMovement[] },
  void
>({
  query: () => '/consumables/my-consumption',
  providesTags: ['Consumable'],
})
```

#### Tag Strategy

| Tag | Provided By | Invalidated By | Purpose |
|-----|-------------|----------------|---------|
| `Tool` | `getToolByQR`, `getDashboardStats` | `createLoan`, `returnTool`, `createBatchLoans`, `adjustToolStatus` | Tool availability and status |
| `Loan` | `getMyLoans` | `createLoan`, `returnTool`, `createBatchLoans` | Loan records |
| `Consumable` | `getConsumables`, `getMyConsumptions` | `consumeConsumable`, `returnConsumable`, `requestConsumable` | Consumable stock and history |
| `Notification` | `getNotifications` | `createLoan`, `createBatchLoans`, `consumeConsumable`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification` | User notifications |

### 2. Component Migrations

#### Tools Scan Page (`src/app/tools/scan/page.tsx`)

**Current Implementation:**
```typescript
// Manual fetch in handleConfirmBag
const promises = bagItems.map(item =>
  fetch('/api/loans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      tool_instance_id: item.tool_id,
      due_date: dueDate,
      notes: notes,
    }),
  })
)
```

**New Implementation:**
```typescript
// Use RTK Query mutation
const [createBatchLoans, { isLoading, isError, error }] = useCreateBatchLoansMutation()

const handleConfirmBag = async (dueDate: string, notes?: string) => {
  if (bagItems.length === 0) return

  try {
    const loans = bagItems.map(item => ({
      tool_instance_id: item.tool_id,
      due_date: dueDate,
      notes: notes || `Préstamo creado vía escáner`,
    }))

    await createBatchLoans({ loans }).unwrap()
    
    // Success - cache automatically invalidated
    clearBag()
    router.push('/dashboard?success=loans_created')
  } catch (err) {
    // Error handling from mutation
    console.error('Failed to create loans:', err)
  }
}
```

**Benefits:**
- Automatic token handling via `prepareHeaders`
- Automatic cache invalidation
- Built-in loading and error states
- No manual state management needed

#### Consumables Scan Page (`src/app/consumables/scan/page.tsx`)

**Current Implementation:**
```typescript
// Manual fetch in handleConfirmCart
const promises = cartItems.map((item) =>
  fetch('/api/consumables/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      item_type_id: item.id,
      requested_quantity: item.quantity,
      notes: `Solicitado vía escáner QR`,
    }),
  })
)
```

**New Implementation:**
```typescript
// Use RTK Query mutation
const [consumeConsumable] = useConsumeConsumableMutation()

const handleConfirmCart = async () => {
  if (cartItems.length === 0) return

  try {
    // Process each item
    await Promise.all(
      cartItems.map(item =>
        consumeConsumable({
          item_type_id: item.id,
          quantity: item.quantity,
          notes: `Consumido vía escáner QR`,
        }).unwrap()
      )
    )

    // Success - cache automatically invalidated
    clearCart()
    router.push('/dashboard?success=consumables_consumed')
  } catch (err) {
    console.error('Failed to consume consumables:', err)
  }
}
```

#### My Loans Page (`src/app/my-loans/page.tsx`)

**Current Implementation:**
```typescript
// Manual fetch in useEffect
useEffect(() => {
  const fetchConsumptions = async () => {
    setIsLoadingConsumptions(true)
    try {
      const response = await fetch('/api/consumables/my-consumption', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setConsumptions(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch consumptions:', error)
    } finally {
      setIsLoadingConsumptions(false)
    }
  }
  fetchConsumptions()
}, [])
```

**New Implementation:**
```typescript
// Use RTK Query hook
const { 
  data: consumptionsData, 
  isLoading: isLoadingConsumptions,
  error: consumptionsError 
} = useGetMyConsumptionsQuery()

const consumptions = consumptionsData?.data || []

// No useEffect needed - automatic refetching when cache invalidated
```

### 3. Backend API Endpoints

#### New Endpoint: Batch Loans Creation

**File:** `src/app/api/loans/batch/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request)
    const { loans } = await request.json()

    // Validate input
    if (!Array.isArray(loans) || loans.length === 0) {
      return NextResponse.json(
        { error: { message: 'Invalid loans array' } },
        { status: 400 }
      )
    }

    // Create all loans in transaction
    const createdLoans = await Promise.all(
      loans.map(loan => 
        createLoan({
          user_id: user.id,
          tool_instance_id: loan.tool_instance_id,
          due_date: loan.due_date,
          notes: loan.notes,
        })
      )
    )

    return NextResponse.json({
      data: createdLoans,
      message: `${createdLoans.length} loans created successfully`,
    })
  } catch (error) {
    return handleError(error)
  }
}
```

#### New Endpoint: Consume Consumable

**File:** `src/app/api/consumables/consume/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request)
    const { item_type_id, quantity, notes } = await request.json()

    // Validate and consume
    const movement = await consumeConsumable({
      user_id: user.id,
      item_type_id,
      quantity,
      notes,
    })

    return NextResponse.json({
      data: movement,
      message: 'Consumable consumed successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
```

#### New Endpoint: Return Consumable

**File:** `src/app/api/consumables/return/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request)
    const { item_type_id, quantity, notes } = await request.json()

    // Validate and return
    const movement = await returnConsumable({
      user_id: user.id,
      item_type_id,
      quantity,
      notes,
    })

    return NextResponse.json({
      data: movement,
      message: 'Consumable returned successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
```

## Data Models

### TypeScript Interfaces

```typescript
// Loan Types
interface Loan {
  id: number
  user_id: number
  tool_instance_id: number
  loan_date: string
  due_date: string
  return_date?: string
  status: 'active' | 'returned' | 'lost' | 'overdue'
  notes?: string
  tool_instance?: ToolInstance
}

interface BatchLoansRequest {
  loans: Array<{
    tool_instance_id: number
    due_date: string
    notes?: string
  }>
}

interface BatchLoansResponse {
  data: Loan[]
  message: string
}

// Consumable Types
interface ConsumableMovement {
  id: number
  consumable_stock_id: number
  user_id: number
  quantity: number
  movement_type: 'consumption' | 'return' | 'adjustment'
  notes?: string
  created_at: string
  consumable_stock?: ConsumableStock
}

interface ConsumeConsumableRequest {
  item_type_id: number
  quantity: number
  notes?: string
}

interface ConsumeConsumableResponse {
  data: ConsumableMovement
  message: string
}

interface ConsumptionMovement {
  id: number
  quantity: number
  notes?: string
  created_at: string
  consumable_stock: {
    id: number
    unit_of_measure?: string
    item_type: {
      name: string
      description?: string
      category?: string
    }
  }
}

interface MyConsumptionsResponse {
  data: ConsumptionMovement[]
}
```

## Error Handling

### Error Handling Strategy

1. **Network Errors**: RTK Query automatically retries failed requests
2. **API Errors**: Displayed using mutation error state
3. **Validation Errors**: Caught and displayed before API call
4. **Optimistic Update Rollback**: Automatic revert on failure (Phase 4)

### Error Display Pattern

```typescript
const [mutation, { isLoading, isError, error }] = useMutationHook()

// In component
{isError && (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
    <p className="text-sm text-red-800 dark:text-red-200">
      {error?.data?.error?.message || 'An error occurred'}
    </p>
  </div>
)}
```

### Loading State Pattern

```typescript
const [mutation, { isLoading }] = useMutationHook()

// In component
<Button 
  onClick={handleAction}
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Spinner className="mr-2" />
      Processing...
    </>
  ) : (
    'Confirm'
  )}
</Button>
```

## Testing Strategy

### Unit Testing

**Test Coverage:**
- API service mutations and queries
- Component integration with RTK Query hooks
- Error handling scenarios
- Loading state management

**Example Test:**
```typescript
describe('useCreateBatchLoansMutation', () => {
  it('should create multiple loans and invalidate cache', async () => {
    const { result } = renderHook(() => useCreateBatchLoansMutation(), {
      wrapper: createWrapper(),
    })

    const loans = [
      { tool_instance_id: 1, due_date: '2024-12-31', notes: 'Test' },
      { tool_instance_id: 2, due_date: '2024-12-31', notes: 'Test' },
    ]

    await act(async () => {
      await result.current[0]({ loans }).unwrap()
    })

    expect(result.current[1].isSuccess).toBe(true)
    // Verify cache invalidation
  })
})
```

### Integration Testing

**Test Scenarios:**
1. Complete loan creation flow from scan to dashboard update
2. Complete consumable consumption flow
3. Complete return flow
4. Cache invalidation verification
5. Error recovery scenarios

### End-to-End Testing

**Critical Flows:**
1. **Loan Creation Flow**
   - Scan multiple tools
   - Add to bag
   - Confirm loan
   - Verify dashboard updates automatically
   - Verify "My Loans" shows new loans

2. **Consumable Consumption Flow**
   - Scan consumable
   - Add to cart
   - Confirm consumption
   - Verify consumables list updates automatically
   - Verify "My Loans" consumptions tab updates

3. **Return Flow**
   - Return tool
   - Verify "My Loans" updates automatically
   - Verify dashboard updates

## Performance Optimization

### Cache Configuration

```typescript
// Query-specific cache configuration
getMyLoans: builder.query<{ data: Loan[] }, void>({
  query: () => '/loans/my',
  providesTags: ['Loan'],
  keepUnusedDataFor: 300, // 5 minutes - frequently accessed
})

getConsumables: builder.query<{ data: ConsumableStock[] }, void>({
  query: () => '/consumables',
  providesTags: ['Consumable'],
  keepUnusedDataFor: 180, // 3 minutes - moderate volatility
})

getDashboardStats: builder.query<{ data: DashboardStats }, void>({
  query: () => '/admin/dashboard/stats',
  keepUnusedDataFor: 60, // 1 minute - high volatility
})
```

### Polling Configuration

```typescript
// Real-time notifications
const { data } = useGetNotificationsQuery(undefined, {
  pollingInterval: 30000, // Poll every 30 seconds
  skipPollingIfUnfocused: true, // Pause when tab not focused
})

// Active loans (for overdue detection)
const { data } = useGetMyLoansQuery(undefined, {
  pollingInterval: 60000, // Poll every minute
  skipPollingIfUnfocused: true,
})
```

### Optimistic Updates (Phase 4)

```typescript
returnTool: builder.mutation<{ data: Loan }, number>({
  query: (loanId) => ({
    url: `/loans/${loanId}/return`,
    method: 'PUT',
  }),
  invalidatesTags: ['Loan', 'Tool'],
  async onQueryStarted(loanId, { dispatch, queryFulfilled }) {
    // Optimistic update
    const patchResult = dispatch(
      api.util.updateQueryData('getMyLoans', undefined, (draft) => {
        const loan = draft.data.find(l => l.id === loanId)
        if (loan) {
          loan.status = 'returned'
          loan.return_date = new Date().toISOString()
        }
      })
    )

    try {
      await queryFulfilled
    } catch {
      // Rollback on error
      patchResult.undo()
    }
  },
})
```

## Migration Strategy

### Phase 1: API Service (Priority: HIGH)
1. Add batch loans mutation
2. Add consume consumable mutation
3. Add return consumable mutation
4. Add get my consumptions query
5. Export all new hooks

**Estimated Time:** 4-6 hours

### Phase 2: Component Migration (Priority: HIGH)
1. Migrate tools scan page
2. Migrate tools return page
3. Migrate consumables scan page
4. Migrate consumables return page
5. Migrate my loans consumptions tab

**Estimated Time:** 8-12 hours

### Phase 3: Optimization (Priority: MEDIUM)
1. Configure cache timing
2. Add polling where needed
3. Optimize navigation flows
4. Add router.refresh() where needed

**Estimated Time:** 4-6 hours

### Phase 4: Optimistic Updates (Priority: LOW - Optional)
1. Add optimistic updates to return tool
2. Add optimistic updates to create loan
3. Add optimistic updates to consume consumable

**Estimated Time:** 6-8 hours

## Design Decisions and Rationales

### Decision 1: Batch Loans Endpoint vs Individual Calls

**Decision:** Create a dedicated `/api/loans/batch` endpoint

**Rationale:**
- Reduces network overhead (1 request vs N requests)
- Allows atomic transactions (all succeed or all fail)
- Better error handling and rollback
- Cleaner invalidation strategy

**Alternative Considered:** Use existing `/api/loans` endpoint with Promise.all
- Rejected due to lack of atomicity and complex error handling

### Decision 2: Separate Consume vs Request Endpoints

**Decision:** Create separate `/api/consumables/consume` and `/api/consumables/request` endpoints

**Rationale:**
- Clear semantic distinction between consumption and requests
- Different business logic and validation rules
- Different notification triggers
- Easier to audit and track

**Alternative Considered:** Use single endpoint with `action` parameter
- Rejected for clarity and maintainability

### Decision 3: Tag-Based Invalidation vs Manual Refetch

**Decision:** Use RTK Query tag-based invalidation

**Rationale:**
- Automatic and consistent
- Declarative and easy to understand
- Scales well with application growth
- Reduces boilerplate code

**Alternative Considered:** Manual refetch calls after mutations
- Rejected due to error-prone nature and maintenance burden

### Decision 4: Optimistic Updates as Optional Phase

**Decision:** Make optimistic updates Phase 4 (optional)

**Rationale:**
- Core functionality works without them
- Adds complexity that may not be needed initially
- Can be added incrementally
- Allows focus on critical features first

**Alternative Considered:** Implement optimistic updates from start
- Rejected to reduce initial complexity and time to value

## Security Considerations

1. **Authentication**: All requests use token from Redux state via `prepareHeaders`
2. **Authorization**: Backend validates user permissions for each action
3. **Input Validation**: Both frontend and backend validate all inputs
4. **CSRF Protection**: Next.js API routes include CSRF protection
5. **Rate Limiting**: Consider adding rate limiting for mutation endpoints

## Accessibility Considerations

1. **Loading States**: Clear visual indicators with ARIA labels
2. **Error Messages**: Screen reader friendly error announcements
3. **Success Feedback**: Accessible success messages
4. **Keyboard Navigation**: All interactions keyboard accessible

## Documentation Requirements

1. **API Service Documentation**: JSDoc comments for all new endpoints
2. **Component Migration Guide**: How to migrate from fetch to RTK Query
3. **Cache Strategy Guide**: When to use which cache settings
4. **Troubleshooting Guide**: Common issues and solutions

## Monitoring and Metrics

**Metrics to Track:**
- Average time to see updates after actions
- Number of unnecessary API calls (should decrease)
- Cache hit rate
- Error rates for mutations
- User satisfaction with responsiveness

**Success Metrics:**
- Zero manual reloads needed
- < 500ms to see UI updates after mutations
- 50% reduction in API calls
- Zero cache-related bugs
