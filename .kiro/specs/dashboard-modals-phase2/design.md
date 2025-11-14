# Design Document: Dashboard Modals - Phase 2

## Overview

This design document outlines the technical architecture and implementation approach for Phase 2 of the Dashboard Modals feature. Building on the successful Phase 1 (Loan Details Modal), this phase extends the modal pattern to all primary dashboard actions, creating a seamless, context-preserving user experience.

### Design Goals

1. **Consistency**: Maintain visual and behavioral consistency with Phase 1 and admin modals
2. **Performance**: Ensure modals load quickly (<300ms) and respond smoothly
3. **Reusability**: Maximize code reuse through shared components and utilities
4. **Accessibility**: Full keyboard navigation and screen reader support
5. **Mobile-First**: Responsive design that works seamlessly on all devices

### Design Principles

- **Progressive Enhancement**: Start with core functionality, add advanced features incrementally
- **Fail Gracefully**: Provide fallbacks when advanced features (like camera) aren't available
- **User Feedback**: Clear, immediate feedback for all user actions
- **Context Preservation**: Users never lose their place in the dashboard

---

## Architecture

### High-Level Component Structure

```
Dashboard Page
├── Action Cards (4)
│   ├── Solicitar Materiales → RequestMaterialsModal
│   ├── Devolver Materiales → ReturnMaterialsModal
│   ├── Solicitar Herramientas → RequestToolsModal
│   └── Devolver Herramientas → ReturnToolsModal
├── Active Loans Section
└── Modal State Management

Shared Components
├── Dialog (base modal component - existing)
├── QRScanner (new - reusable scanner)
├── ModalHeader (new - consistent headers)
├── ModalFooter (new - consistent footers)
├── LoadingSpinner (existing)
└── ErrorMessage (existing)
```

### Component Hierarchy

```
Dialog (Base)
└── Modal Wrapper
    ├── ModalHeader
    │   ├── Title
    │   ├── Close Button
    │   └── Navigation (if applicable)
    ├── ModalBody
    │   ├── View Router (main/scanner/browse/form)
    │   ├── Content Area
    │   └── Loading/Error States
    └── ModalFooter
        ├── Action Buttons
        └── Status Messages
```

---

## Components and Interfaces

### 1. Shared Components

#### QRScanner Component

**Purpose**: Reusable QR code scanner for all modals

**Interface**:
```typescript
interface QRScannerProps {
  onScan: (code: string) => void
  onError: (error: Error) => void
  onCancel: () => void
  isActive: boolean
  placeholder?: string
}

interface QRScannerState {
  hasPermission: boolean | null
  isScanning: boolean
  error: string | null
}
```

**Features**:
- Camera permission handling
- Live camera feed display
- QR code detection and validation
- Manual code entry fallback
- Error handling and user feedback
- Mobile optimization

**Implementation Notes**:
- Use `react-qr-reader` or similar library
- Implement permission request flow
- Provide clear error messages
- Optimize for battery life
- Clean up camera resources on unmount

#### ModalHeader Component

**Purpose**: Consistent header across all modals

**Interface**:
```typescript
interface ModalHeaderProps {
  title: string
  onClose: () => void
  showNavigation?: boolean
  currentIndex?: number
  totalItems?: number
  onNavigate?: (direction: 'prev' | 'next') => void
}
```

**Features**:
- Title display
- Close button (X)
- Optional navigation arrows
- Optional item counter
- Consistent styling

#### ModalFooter Component

**Purpose**: Consistent footer with action buttons

**Interface**:
```typescript
interface ModalFooterProps {
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  statusMessage?: {
    type: 'success' | 'error' | 'info'
    message: string
  }
}
```

---

### 2. Request Materials Modal

#### Component Structure

```typescript
interface RequestMaterialsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface RequestMaterialsModalState {
  view: 'main' | 'scanner' | 'browse'
  selectedMaterial: Material | null
  quantity: number
  isLoading: boolean
  error: string | null
}

interface Material {
  id: number
  name: string
  description: string
  currentStock: number
  minStock: number
  unit: string
  qrCode: string
}
```

#### View States

**Main View**:
- Two primary action buttons: "Scan QR" and "Browse List"
- Manual code entry field
- Recent materials (optional enhancement)

**Scanner View**:
- QRScanner component
- Cancel button
- Instructions text

**Browse View**:
- Search input with real-time filtering
- Material list with cards
- Material details (name, stock, unit)
- Loading skeleton
- Empty state

**Quantity View**:
- Selected material summary
- Quantity input with validation
- Stock availability indicator
- Submit button
- Back button

#### Data Flow

```
1. User opens modal → Fetch available materials
2. User scans QR or selects material → Validate and show quantity view
3. User enters quantity → Validate against stock
4. User submits → POST /api/consumables/request
5. Success → Update dashboard, show success message, close modal
6. Error → Show error message, allow retry
```

#### API Integration

```typescript
// Fetch available materials
GET /api/consumables
Response: Material[]

// Submit request
POST /api/consumables/request
Body: {
  consumableId: number
  quantity: number
}
Response: {
  success: boolean
  message: string
  request: ConsumableRequest
}
```

---

### 3. Return Materials Modal

#### Component Structure

```typescript
interface ReturnMaterialsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ReturnMaterialsModalState {
  returnableMaterials: ConsumableRequest[]
  selectedRequest: ConsumableRequest | null
  returnQuantity: number
  returnReason: string
  isLoading: boolean
  error: string | null
}

interface ConsumableRequest {
  id: number
  consumable: Material
  quantityRequested: number
  quantityReturnable: number
  requestDate: string
}
```

#### View States

**Main View**:
- List of returnable materials
- Each item shows: name, quantity, request date
- Select button for each item
- Empty state if no materials to return

**Return Form View**:
- Selected material summary
- Return quantity input (max: quantityReturnable)
- Return reason textarea (optional)
- Submit button
- Cancel button

#### Data Flow

```
1. User opens modal → Fetch returnable materials
2. User selects material → Show return form
3. User enters quantity and reason → Validate
4. User submits → POST /api/consumables/return
5. Success → Update dashboard, show success message, close modal
6. Error → Show error message, allow retry
```

#### API Integration

```typescript
// Fetch returnable materials
GET /api/consumables/returnable
Response: ConsumableRequest[]

// Submit return
POST /api/consumables/return
Body: {
  requestId: number
  quantity: number
  reason?: string
}
Response: {
  success: boolean
  message: string
}
```

---

### 4. Request Tools Modal

#### Component Structure

```typescript
interface RequestToolsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface RequestToolsModalState {
  view: 'main' | 'scanner' | 'browse'
  selectedTool: Tool | null
  loanDuration: number
  isLoading: boolean
  error: string | null
}

interface Tool {
  id: number
  name: string
  description: string
  status: 'available' | 'in_use' | 'maintenance'
  category: string
  qrCode: string
  imageUrl?: string
}
```

#### View States

**Main View**:
- Two primary action buttons: "Scan QR" and "Browse List"
- Manual code entry field

**Scanner View**:
- QRScanner component
- Cancel button
- Instructions text

**Browse View**:
- Search input with filtering
- Category filter dropdown
- Tool list with cards (only available tools)
- Tool details (name, status, category)
- Loading skeleton
- Empty state

**Loan Duration View**:
- Selected tool summary
- Duration input (days)
- Default duration suggestion
- Due date preview
- Submit button
- Back button

#### Data Flow

```
1. User opens modal → Fetch available tools
2. User scans QR or selects tool → Validate availability, show duration view
3. User enters duration → Calculate due date
4. User submits → POST /api/loans
5. Success → Update active loans, show success message, close modal
6. Error → Show error message, allow retry
```

#### API Integration

```typescript
// Fetch available tools
GET /api/tools?status=available
Response: Tool[]

// Create loan
POST /api/loans
Body: {
  toolId: number
  durationDays: number
}
Response: {
  success: boolean
  message: string
  loan: Loan
}
```

---

### 5. Return Tools Modal

#### Component Structure

```typescript
interface ReturnToolsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ReturnToolsModalState {
  activeLoans: Loan[]
  selectedLoan: Loan | null
  condition: 'good' | 'minor_damage' | 'major_damage'
  notes: string
  isLoading: boolean
  error: string | null
}

interface Loan {
  id: number
  tool: Tool
  loanDate: string
  dueDate: string
  isOverdue: boolean
}
```

#### View States

**Main View**:
- List of active loans
- Each item shows: tool name, loan date, due date, overdue indicator
- Select button for each item
- Empty state if no tools to return

**Return Form View**:
- Selected tool summary
- Loan details (dates, duration)
- Condition assessment radio buttons
- Notes textarea (optional)
- Submit button
- Cancel button

#### Data Flow

```
1. User opens modal → Fetch active loans
2. User selects loan → Show return form
3. User assesses condition and adds notes → Validate
4. User submits → POST /api/loans/[id]/return
5. Success → Update active loans, show success message, close modal
6. Error → Show error message, allow retry
```

#### API Integration

```typescript
// Fetch active loans
GET /api/loans?status=active
Response: Loan[]

// Return tool
POST /api/loans/[id]/return
Body: {
  condition: string
  notes?: string
}
Response: {
  success: boolean
  message: string
}
```

---

## Data Models

### Shared Types

```typescript
// Modal view states
type ModalView = 'main' | 'scanner' | 'browse' | 'form'

// Loading states
interface LoadingState {
  isLoading: boolean
  loadingMessage?: string
}

// Error states
interface ErrorState {
  error: string | null
  errorType?: 'validation' | 'network' | 'permission' | 'unknown'
}

// Success states
interface SuccessState {
  success: boolean
  successMessage?: string
}

// Form validation
interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}
```

### Material Types

```typescript
interface Material {
  id: number
  name: string
  description: string
  currentStock: number
  minStock: number
  unit: string
  qrCode: string
  category?: string
  imageUrl?: string
}

interface ConsumableRequest {
  id: number
  consumable: Material
  quantityRequested: number
  quantityReturnable: number
  requestDate: string
  status: 'pending' | 'approved' | 'completed'
}
```

### Tool Types

```typescript
interface Tool {
  id: number
  name: string
  description: string
  status: 'available' | 'in_use' | 'maintenance'
  category: string
  qrCode: string
  imageUrl?: string
  specifications?: Record<string, string>
}

interface Loan {
  id: number
  tool: Tool
  user: User
  loanDate: string
  dueDate: string
  returnDate?: string
  status: 'active' | 'returned' | 'overdue'
  condition?: string
  notes?: string
}
```

---

## State Management

### Dashboard Page State

```typescript
interface DashboardState {
  // Modal states
  modals: {
    requestMaterials: boolean
    returnMaterials: boolean
    requestTools: boolean
    returnTools: boolean
    loanDetails: boolean
  }
  
  // Data states
  activeLoans: Loan[]
  recentActivity: Activity[]
  
  // Loading states
  isLoadingLoans: boolean
  isLoadingActivity: boolean
  
  // Selected items
  selectedLoanId: number | null
}
```

### Modal State Management Pattern

Each modal manages its own internal state but communicates with the dashboard through callbacks:

```typescript
// Dashboard manages which modal is open
const [openModal, setOpenModal] = useState<string | null>(null)

// Each modal has open/close handlers
const handleOpenRequestMaterials = () => setOpenModal('requestMaterials')
const handleCloseModal = () => setOpenModal(null)

// Success callback refreshes dashboard data
const handleSuccess = async () => {
  await refreshDashboardData()
  setOpenModal(null)
  showSuccessNotification()
}
```

---

## Error Handling

### Error Types and Handling

```typescript
enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  UNAUTHORIZED = 'unauthorized',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

interface ErrorHandler {
  type: ErrorType
  message: string
  action?: 'retry' | 'dismiss' | 'redirect'
  retryFn?: () => void
}
```

### Error Handling Strategy

1. **Validation Errors**: Show inline, highlight fields, prevent submission
2. **Network Errors**: Show message, provide retry button
3. **Permission Errors**: Show explanation, provide instructions
4. **Not Found Errors**: Show message, suggest alternatives
5. **Server Errors**: Show generic message, log details, provide support contact

### Error Display

```typescript
// Error message component
<ErrorMessage
  type={error.type}
  message={error.message}
  onRetry={error.retryFn}
  onDismiss={() => setError(null)}
/>
```

---

## Testing Strategy

### Unit Testing

**Components to Test**:
- QRScanner component
- ModalHeader component
- ModalFooter component
- Each modal component
- Form validation functions
- API integration functions

**Test Cases**:
- Component renders correctly
- Props are handled correctly
- State updates work as expected
- Event handlers fire correctly
- Error states display properly

### Integration Testing

**Scenarios to Test**:
- Modal opens from dashboard
- User completes full workflow
- Data refreshes after success
- Multiple modals don't interfere
- Navigation between views works
- Form validation prevents invalid submission

### E2E Testing

**User Flows to Test**:
1. Request material via scanner
2. Request material via browse
3. Return material
4. Request tool via scanner
5. Request tool via browse
6. Return tool
7. Handle errors gracefully
8. Mobile responsiveness

### Accessibility Testing

**Tests to Perform**:
- Keyboard navigation works
- Screen reader announces correctly
- Focus management is correct
- ARIA labels are present
- Color contrast is sufficient
- Touch targets are adequate

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load modals
const RequestMaterialsModal = lazy(() => 
  import('./components/dashboard/RequestMaterialsModal')
)

const ReturnMaterialsModal = lazy(() => 
  import('./components/dashboard/ReturnMaterialsModal')
)

// Lazy load scanner
const QRScanner = lazy(() => 
  import('./components/shared/QRScanner')
)
```

### Data Fetching Optimization

```typescript
// Prefetch data on hover
const handleCardHover = (modalType: string) => {
  if (modalType === 'requestMaterials') {
    prefetchMaterials()
  }
}

// Cache frequently accessed data
const { data: materials, isLoading } = useQuery(
  'materials',
  fetchMaterials,
  { staleTime: 5 * 60 * 1000 } // 5 minutes
)
```

### Rendering Optimization

```typescript
// Memoize expensive computations
const filteredMaterials = useMemo(() => 
  materials.filter(m => m.name.includes(searchTerm)),
  [materials, searchTerm]
)

// Memoize components
const MaterialCard = memo(({ material }) => {
  // Component implementation
})
```

---

## Mobile Responsiveness

### Breakpoints

```css
/* Mobile: < 640px */
@media (max-width: 639px) {
  .modal {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
}

/* Tablet: 640px - 1024px */
@media (min-width: 640px) and (max-width: 1023px) {
  .modal {
    width: 90vw;
    max-width: 600px;
  }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .modal {
    width: 80vw;
    max-width: 800px;
  }
}
```

### Mobile-Specific Considerations

1. **Full-screen modals on mobile**: Better use of limited screen space
2. **Larger touch targets**: Minimum 44x44px for all interactive elements
3. **Optimized scanner**: Full-screen camera view on mobile
4. **Simplified navigation**: Fewer options, clearer hierarchy
5. **Keyboard handling**: Adjust layout when keyboard appears

---

## Accessibility

### ARIA Labels

```typescript
// Modal container
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Request Materials</h2>
  <p id="modal-description">Scan or browse to request materials</p>
</div>

// Form inputs
<label htmlFor="quantity">Quantity</label>
<input
  id="quantity"
  type="number"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="quantity-error"
/>
{hasError && (
  <span id="quantity-error" role="alert">
    {errorMessage}
  </span>
)}
```

### Keyboard Navigation

```typescript
// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
    if (e.key === 'Enter' && canSubmit) {
      handleSubmit()
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [handleClose, handleSubmit, canSubmit])
```

### Focus Management

```typescript
// Trap focus within modal
const modalRef = useRef<HTMLDivElement>(null)
const previousFocusRef = useRef<HTMLElement | null>(null)

useEffect(() => {
  if (isOpen) {
    previousFocusRef.current = document.activeElement as HTMLElement
    modalRef.current?.focus()
  } else {
    previousFocusRef.current?.focus()
  }
}, [isOpen])
```

---

## Security Considerations

### Input Validation

```typescript
// Client-side validation
const validateQuantity = (quantity: number, maxStock: number): ValidationResult => {
  if (quantity <= 0) {
    return { isValid: false, errors: { quantity: 'Quantity must be positive' } }
  }
  if (quantity > maxStock) {
    return { isValid: false, errors: { quantity: 'Exceeds available stock' } }
  }
  return { isValid: true, errors: {} }
}

// Server-side validation (API)
// Always validate on server, never trust client
```

### Data Sanitization

```typescript
// Sanitize user input
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script>/gi, '')
    .replace(/javascript:/gi, '')
    .substring(0, 500) // Max length
}
```

### Permission Checks

```typescript
// Check user permissions before showing actions
const canRequestMaterials = user.permissions.includes('request_materials')
const canReturnTools = user.permissions.includes('return_tools')

// API also checks permissions server-side
```

---

## Migration and Rollback

### Feature Flag

```typescript
// Feature flag for gradual rollout
const useModals = useFeatureFlag('dashboard-modals-phase2')

// Conditional rendering
{useModals ? (
  <ActionCard onClick={handleOpenModal}>
    Solicitar Materiales
  </ActionCard>
) : (
  <Link href="/consumables/scan">
    Solicitar Materiales
  </Link>
)}
```

### Rollback Plan

1. **Immediate Rollback**: Disable feature flag
2. **Partial Rollback**: Disable specific modals, keep others
3. **Data Integrity**: Ensure existing pages still work
4. **User Communication**: Notify users of changes

---

## Success Metrics

### Performance Metrics

- Modal open time: < 300ms
- API response time: < 2s
- Search filtering: < 100ms
- Camera activation: < 1s

### User Experience Metrics

- Task completion rate: > 95%
- Error rate: < 2%
- User satisfaction: > 85%
- Modal usage vs page navigation: > 80%

### Technical Metrics

- Bundle size increase: < 100KB
- Memory usage: < 50MB per modal
- Accessibility score: 100/100
- Mobile performance score: > 90/100

---

## Future Enhancements

### Phase 3 Possibilities

1. **Bulk Operations**: Request/return multiple items at once
2. **Advanced Filtering**: More sophisticated search and filters
3. **Favorites**: Quick access to frequently used items
4. **History**: View past requests/returns in modal
5. **Notifications**: In-modal notifications for updates
6. **Offline Support**: Queue actions when offline
7. **Analytics**: Track usage patterns and optimize

### Technical Debt to Address

1. **Scanner Library**: Evaluate and potentially replace with better option
2. **State Management**: Consider moving to more robust solution if complexity grows
3. **API Optimization**: Implement GraphQL for more efficient data fetching
4. **Caching Strategy**: Implement more sophisticated caching
5. **Error Tracking**: Integrate with error monitoring service

---

## Conclusion

This design provides a comprehensive blueprint for implementing Phase 2 of the Dashboard Modals feature. By following this design, we will create a consistent, performant, and accessible modal-based workflow that significantly improves the user experience while maintaining code quality and maintainability.

The design emphasizes:
- **Reusability** through shared components
- **Consistency** with existing patterns
- **Performance** through optimization techniques
- **Accessibility** through proper ARIA and keyboard support
- **Maintainability** through clear architecture and documentation

---

**Status**: Draft - Pending Review
**Created**: October 2025
**Version**: 1.0.0
**Next Steps**: Review design, get approval, proceed to implementation
