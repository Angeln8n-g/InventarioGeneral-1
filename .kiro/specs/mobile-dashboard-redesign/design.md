# Design Document - Mobile Dashboard Redesign

## Overview

Este documento describe el diseño técnico para el rediseño completo del dashboard principal con enfoque mobile-first. El objetivo es crear una experiencia optimizada para usuarios móviles que prioriza la velocidad, accesibilidad y facilidad de uso.

## Architecture

### Component Hierarchy

```
DashboardPage
├── MobileHeader
│   ├── WelcomeMessage
│   ├── NotificationBell
│   └── UserAvatar
├── QuickActionButtons
│   ├── ScanToLoanButton
│   ├── ScanToReturnButton
│   ├── RequestSuppliesButton
│   └── MyLoansButton
├── ActiveLoansSection
│   ├── SectionHeader
│   └── LoansList
│       └── LoanCard[]
└── BottomNavigation
    ├── HomeTab
    ├── LoansTab
    ├── NotificationsTab
    └── ProfileTab
```

### State Management

```typescript
interface DashboardState {
  user: {
    id: number
    name: string
    email: string
    role: string
  }
  activeLoans: Loan[]
  notifications: {
    unreadCount: number
    items: Notification[]
  }
  isLoading: boolean
  error: string | null
}

interface Loan {
  id: number
  tool: {
    name: string
    serialNumber: string
  }
  dueDate: string
  isOverdue: boolean
  status: 'active' | 'returned' | 'overdue'
}
```

## Components and Interfaces

### 1. MobileHeader Component

**Purpose:** Mostrar información del usuario y acceso rápido a notificaciones y perfil.

**Props:**
```typescript
interface MobileHeaderProps {
  userName: string
  unreadNotifications: number
  onNotificationClick: () => void
  onAvatarClick: () => void
}
```

**Design:**
- Altura fija: 64px
- Fondo: `bg-card-light dark:bg-card-dark`
- Sombra sutil para separación
- Layout: Flex con justify-between
- Sticky position en scroll

**Elements:**
- Welcome Message: "¡Hola, [Nombre]!" - Truncate si es muy largo
- Notification Bell: Material Icon con badge absoluto
- User Avatar: Círculo con inicial, dropdown menu on click

### 2. QuickActionButtons Component

**Purpose:** Proporcionar acceso rápido a las acciones más comunes.

**Props:**
```typescript
interface QuickActionButtonsProps {
  onScanToLoan: () => void
  onScanToReturn: () => void
  onRequestSupplies: () => void
  onViewMyLoans: () => void
  activeLoansCount: number
}
```

**Design:**
- Grid layout: 2 columnas en móvil, 4 en desktop
- Gap: 16px
- Padding: 24px
- Botones grandes con iconos prominentes

**Button Styles:**
```typescript
const buttonStyles = {
  base: "flex flex-col items-center justify-center p-6 rounded-2xl transition-all active:scale-95",
  primary: "bg-primary text-white shadow-lg",
  secondary: "bg-card-light dark:bg-card-dark border-2 border-gray-200 dark:border-gray-700",
  icon: "w-12 h-12 mb-3",
  label: "text-base font-semibold"
}
```

### 3. ActiveLoansSection Component

**Purpose:** Mostrar préstamos activos del usuario de forma compacta.

**Props:**
```typescript
interface ActiveLoansSectionProps {
  loans: Loan[]
  onReturnClick: (loanId: number) => void
  isLoading: boolean
}
```

**Design:**
- Max height: 400px con scroll
- Padding: 24px
- Background: Transparent

**LoanCard Design:**
```typescript
const loanCardStyles = {
  container: "bg-card-light dark:bg-card-dark rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-700",
  header: "flex justify-between items-start mb-2",
  toolName: "font-semibold text-base",
  dueDate: "text-sm",
  dueDateNormal: "text-text-secondary-light dark:text-text-secondary-dark",
  dueDateOverdue: "text-red-accent font-semibold",
  returnButton: "mt-3 w-full bg-green-accent text-white py-2 rounded-lg"
}
```

### 4. BottomNavigation Component

**Purpose:** Navegación principal de la aplicación.

**Props:**
```typescript
interface BottomNavigationProps {
  currentPath: string
  unreadNotifications: number
}
```

**Design:**
- Altura: 64px
- Posición: Fixed bottom
- Background: `bg-card-light dark:bg-card-dark`
- Border top: 1px solid gray-200
- Safe area inset para iOS

**Tab Design:**
```typescript
const tabStyles = {
  container: "flex-1 flex flex-col items-center justify-center py-2",
  icon: "w-6 h-6 mb-1",
  label: "text-xs",
  active: "text-primary",
  inactive: "text-text-secondary-light dark:text-text-secondary-dark"
}
```

## Data Models

### Dashboard Data Structure

```typescript
interface DashboardData {
  user: User
  activeLoans: Loan[]
  recentLoans: Loan[]
  notifications: Notification[]
  stats: {
    activeLoansCount: number
    overdueLoansCount: number
    totalLoansCount: number
  }
}

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'user' | 'admin'
}

interface Loan {
  id: number
  user_id: number
  tool_instance_id: number
  tool_instance: {
    id: number
    serial_number: string
    item_type: {
      name: string
      description: string
    }
  }
  loan_date: string
  due_date: string
  return_date: string | null
  status: 'active' | 'returned' | 'overdue' | 'lost'
  notes: string | null
}

interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}
```

## Error Handling

### Error States

1. **Network Error:**
   - Show toast notification
   - Retry button
   - Offline indicator

2. **Loading Error:**
   - Skeleton loaders
   - Graceful degradation
   - Error boundaries

3. **Action Error:**
   - Inline error messages
   - Clear call-to-action
   - Undo option when applicable

### Error Messages

```typescript
const errorMessages = {
  networkError: "No se pudo conectar. Verifica tu conexión.",
  loadingError: "Error al cargar los datos. Intenta de nuevo.",
  scanError: "Error al escanear. Verifica los permisos de cámara.",
  returnError: "No se pudo procesar la devolución. Intenta de nuevo.",
}
```

## Testing Strategy

### Unit Tests

1. **Component Tests:**
   - MobileHeader rendering
   - QuickActionButtons click handlers
   - ActiveLoansSection data display
   - BottomNavigation active state

2. **Hook Tests:**
   - useDashboardData data fetching
   - useNotifications unread count
   - useActiveLoans filtering

### Integration Tests

1. **User Flows:**
   - Dashboard load → View loans → Return item
   - Dashboard load → Scan to loan → Success
   - Dashboard load → Request supplies → Submit

2. **Navigation Tests:**
   - Bottom nav navigation
   - Deep linking
   - Back button behavior

### E2E Tests

1. **Critical Paths:**
   - Complete loan flow
   - Complete return flow
   - Notification interaction

## Performance Optimization

### Loading Strategy

1. **Initial Load:**
   - Server-side render dashboard shell
   - Client-side hydration
   - Lazy load non-critical components

2. **Data Fetching:**
   - Parallel requests for independent data
   - Cache active loans (5 min)
   - Optimistic updates for actions

3. **Code Splitting:**
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports for heavy components

### Rendering Optimization

```typescript
// Memoization strategy
const MemoizedLoanCard = React.memo(LoanCard)
const MemoizedQuickActionButtons = React.memo(QuickActionButtons)

// Virtual scrolling for long lists
import { FixedSizeList } from 'react-window'
```

## Accessibility

### ARIA Labels

```typescript
const ariaLabels = {
  notificationBell: "Notificaciones, {count} sin leer",
  userAvatar: "Menú de usuario",
  scanToLoan: "Escanear código QR para prestar herramienta",
  scanToReturn: "Escanear código QR para devolver herramienta",
  requestSupplies: "Solicitar materiales consumibles",
  returnButton: "Devolver {toolName}",
}
```

### Keyboard Navigation

- Tab order: Header → Quick Actions → Loans → Bottom Nav
- Enter/Space: Activate buttons
- Escape: Close modals/menus
- Arrow keys: Navigate bottom nav

### Screen Reader Support

- Semantic HTML elements
- ARIA landmarks
- Live regions for dynamic content
- Descriptive alt text

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  mobile: '0px',      // < 640px
  tablet: '640px',    // 640px - 1024px
  desktop: '1024px',  // > 1024px
}
```

### Layout Adaptations

**Mobile (< 640px):**
- Single column layout
- Full-width buttons
- Bottom navigation visible
- Compact spacing

**Tablet (640px - 1024px):**
- 2-column grid for quick actions
- Increased padding
- Bottom navigation visible
- Medium spacing

**Desktop (> 1024px):**
- 4-column grid for quick actions
- Side navigation instead of bottom
- Increased max-width container
- Generous spacing

## Animation and Transitions

### Micro-interactions

```typescript
const animations = {
  buttonPress: "active:scale-95 transition-transform duration-100",
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  shimmer: "animate-shimmer",
}
```

### Page Transitions

```typescript
const pageTransitions = {
  enter: "transition-opacity duration-300 ease-in-out",
  enterFrom: "opacity-0",
  enterTo: "opacity-100",
  leave: "transition-opacity duration-200 ease-in-out",
  leaveFrom: "opacity-100",
  leaveTo: "opacity-0",
}
```

## PWA Configuration

### Manifest

```json
{
  "name": "Inventario Academia",
  "short_name": "Inventario",
  "description": "Sistema de gestión de inventario y préstamos",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#1A1A2E",
  "theme_color": "#8B5CF6",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy

- Cache-first for static assets
- Network-first for API calls
- Offline fallback page
- Background sync for actions

## Security Considerations

1. **Authentication:**
   - Token validation on every request
   - Automatic token refresh
   - Secure storage (httpOnly cookies)

2. **Authorization:**
   - Role-based access control
   - Action permissions check
   - Admin-only routes protection

3. **Data Protection:**
   - Input sanitization
   - XSS prevention
   - CSRF tokens

## Monitoring and Analytics

### Key Metrics

1. **Performance:**
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)

2. **User Behavior:**
   - Most used actions
   - Navigation patterns
   - Error rates

3. **Business Metrics:**
   - Daily active users
   - Loan completion rate
   - Average session duration
