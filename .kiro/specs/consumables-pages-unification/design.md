# Design Document

## Overview

Este documento describe el diseño técnico para unificar las dos páginas de consumibles existentes (`/consumables` y `/admin/consumables`) en una arquitectura coherente que elimina duplicación mientras preserva todas las funcionalidades y mantiene la separación de permisos por rol.

### Design Decision: Páginas Separadas con Componentes Compartidos

Después de evaluar las opciones, se ha decidido mantener **páginas separadas** (`/consumables` para usuarios y `/admin/consumables` para administradores) pero con una **biblioteca de componentes compartidos** robusta.

**Razones:**

✅ **Separación clara de responsabilidades**: Cada página tiene un propósito distinto
✅ **Mejor rendimiento**: Solo se carga el código necesario para cada rol
✅ **Rutas semánticas**: URLs claras que reflejan el propósito
✅ **Menor riesgo**: No requiere cambios en navegación existente
✅ **Escalabilidad**: Fácil agregar funcionalidades específicas por rol
✅ **Testing más simple**: Tests separados por rol

**Trade-offs aceptados:**

⚠️ Dos archivos de página (pero con lógica compartida)
⚠️ Necesidad de mantener consistencia entre páginas (mitigado con componentes compartidos)

## Architecture

### High-Level Structure

```
src/
├── app/
│   ├── consumables/
│   │   └── page.tsx                    # Página de usuarios (Request Supplies)
│   └── admin/
│       └── consumables/
│           └── page.tsx                # Página de administradores (Management)
│
├── components/
│   └── consumables/                    # 🆕 Componentes compartidos
│       ├── ConsumableCard.tsx          # Tarjeta de consumible
│       ├── ConsumableFilters.tsx       # Sistema de filtros
│       ├── ConsumableSummary.tsx       # Tarjetas de resumen
│       ├── ConsumableList.tsx          # Lista/grid de consumibles
│       ├── ConsumableActions.tsx       # Acciones (request/adjust)
│       ├── StockAdjustmentForm.tsx     # Formulario de ajuste (admin)
│       ├── BackordersTab.tsx           # Tab de backorders (admin)
│       └── index.ts                    # Barrel export
│
├── hooks/
│   └── consumables/                    # 🆕 Hooks compartidos
│       ├── useConsumables.ts           # Fetch y gestión de consumibles
│       ├── useConsumableFilters.ts     # Lógica de filtrado
│       ├── useStockAdjustment.ts       # Ajuste de stock (admin)
│       └── index.ts
│
└── types/
    └── consumables.ts                  # 🆕 Tipos compartidos
```

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Page Component                            │
│  (/consumables/page.tsx o /admin/consumables/page.tsx)     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Consumable   │   │ Consumable   │   │ Consumable   │
│  Summary     │   │   Filters    │   │    List      │
└──────────────┘   └──────────────┘   └──────────────┘
                                              │
                                              ▼
                                    ┌──────────────┐
                                    │ Consumable   │
                                    │    Card      │
                                    └──────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                                    ▼                   ▼
                            ┌──────────────┐   ┌──────────────┐
                            │ Consumable   │   │    Stock     │
                            │   Actions    │   │  Adjustment  │
                            │  (Request)   │   │     Form     │
                            └──────────────┘   └──────────────┘
```

## Components and Interfaces

### 1. Shared Types (`types/consumables.ts`)

```typescript
// Base consumable item type
export interface ConsumableItem {
  id: number
  name: string
  description?: string
  category?: string
  stock?: ConsumableStock
}

// Stock information
export interface ConsumableStock {
  is_available: boolean
  is_low_stock: boolean
  current_quantity: number
  unit_of_measure?: string
  minimum_threshold?: number
}

// Extended type for admin view
export interface ConsumableStockAdmin extends ConsumableStock {
  id: number
  item_type: {
    id: number
    name: string
    description?: string
    category?: string
  }
  qr_code?: string
}

// Backorder request
export interface BackorderRequest {
  id: number
  user: { username: string; email: string }
  item_type: { name: string }
  requested_quantity: number
  request_date: string
}

// Filter state
export interface ConsumableFilters {
  searchTerm: string
  category: string
  showLowStockOnly: boolean
}

// User role type
export type UserRole = 'user' | 'admin'
```

### 2. ConsumableCard Component

**Purpose**: Tarjeta reutilizable para mostrar un consumible con acciones apropiadas según el rol.

**Props Interface**:
```typescript
interface ConsumableCardProps {
  item: ConsumableItem | ConsumableStockAdmin
  role: UserRole
  onRequest?: (itemId: number, quantity: number) => Promise<void>
  onAddToCart?: (item: ConsumableItem, quantity: number) => void
  onAdjustStock?: (stockId: number, action: string, quantity?: number) => Promise<void>
  onViewDetails?: (itemId: number) => void
  isLoading?: boolean
}
```

**Behavior**:
- **User role**: Muestra botón "Request", formulario de cantidad, botón "Add to Cart"
- **Admin role**: Muestra botón "View Details", botón "Adjust Stock", formulario de ajuste
- Usa el mismo diseño base pero con acciones condicionales
- Maneja estados de carga individualmente

**Visual States**:
- Available (green accent)
- Low Stock (yellow accent)
- Out of Stock (red accent)
- Loading (disabled con spinner)

### 3. ConsumableFilters Component

**Purpose**: Sistema de filtros compartido con búsqueda, categoría y filtro de stock bajo.

**Props Interface**:
```typescript
interface ConsumableFiltersProps {
  filters: ConsumableFilters
  categories: string[]
  onFiltersChange: (filters: ConsumableFilters) => void
  showResultCount?: boolean
  resultCount?: number
  totalCount?: number
}
```

**Features**:
- Input de búsqueda con debounce (300ms)
- Dropdown de categorías
- Checkbox "Low stock only"
- Badges de filtros activos (removibles)
- Botón "Clear All" cuando hay filtros activos
- Contador de resultados (opcional)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Filters                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Search     │  │   Category   │  │ ☑ Low Stock  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  Active Filters:  [Search: "cable"] [Category: Supplies] │
│                   Clear All                              │
│                                                          │
│  Showing 5 of 31 items                                  │
└─────────────────────────────────────────────────────────┘
```

### 4. ConsumableSummary Component

**Purpose**: Tarjetas de resumen estadístico del inventario.

**Props Interface**:
```typescript
interface ConsumableSummaryProps {
  items: ConsumableItem[] | ConsumableStockAdmin[]
  role: UserRole
  backordersCount?: number // Solo para admin
}
```

**Cards**:
- **Total Items**: Cuenta total de consumibles
- **Available**: Items con stock disponible (green)
- **Low Stock**: Items con stock bajo (yellow)
- **Out of Stock**: Items sin stock (red)
- **Backorders** (admin only): Pedidos pendientes (blue)

**Layout**: Grid responsive (2 cols móvil, 4 cols desktop)

### 5. ConsumableList Component

**Purpose**: Lista/grid de consumibles con estados de carga y vacío.

**Props Interface**:
```typescript
interface ConsumableListProps {
  items: ConsumableItem[] | ConsumableStockAdmin[]
  role: UserRole
  isLoading: boolean
  onRequest?: (itemId: number, quantity: number) => Promise<void>
  onAddToCart?: (item: ConsumableItem, quantity: number) => void
  onAdjustStock?: (stockId: number, action: string, quantity?: number) => Promise<void>
  onViewDetails?: (itemId: number) => void
  emptyMessage?: string
  onClearFilters?: () => void
}
```

**States**:
- **Loading**: Spinner centrado con mensaje
- **Empty**: Icono, mensaje, botón "Clear Filters" (si hay filtros activos)
- **Data**: Grid de ConsumableCard components

**Grid**: 2 columnas en móvil, 3-4 en desktop (responsive)

### 6. ConsumableActions Component

**Purpose**: Formulario de acciones para solicitar consumibles (usuarios).

**Props Interface**:
```typescript
interface ConsumableActionsProps {
  item: ConsumableItem
  onRequest: (quantity: number) => Promise<void>
  onAddToCart: (quantity: number) => void
  isLoading: boolean
  maxQuantity: number
}
```

**Features**:
- Botones de cantidad rápida (1, 5, 10)
- Input numérico con validación
- Botones +/- para incrementar/decrementar
- Validación de stock disponible
- Botón "Add to Cart"
- Botón "Request Now"
- Botón "Cancel"

**Validation**:
- Cantidad mínima: 1
- Cantidad máxima: stock disponible
- Deshabilitar si no hay stock

### 7. StockAdjustmentForm Component

**Purpose**: Formulario de ajuste de stock (administradores).

**Props Interface**:
```typescript
interface StockAdjustmentFormProps {
  stock: ConsumableStockAdmin
  onAdjust: (action: 'adjust' | 'set' | 'restock', quantity: number) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}
```

**Actions**:
- **Adjust (+/-)**: Incrementar o decrementar stock
- **Set Exact**: Establecer cantidad exacta
- **Restock (+)**: Solo incrementar (para reabastecimiento)

**UI**:
- Dropdown para seleccionar acción
- Input numérico
- Botones "Apply" y "Cancel"
- Preview del resultado (opcional)

### 8. BackordersTab Component

**Purpose**: Tab de backorders para administradores.

**Props Interface**:
```typescript
interface BackordersTabProps {
  backorders: BackorderRequest[]
  isLoading: boolean
  onProcessBackorders: (itemTypeId: number, newStockQuantity: number) => Promise<void>
}
```

**Features**:
- Lista de backorders agrupados por item
- Información de usuario y cantidad solicitada
- Botón para procesar backorders
- Estado vacío si no hay backorders

## Data Models

### API Integration

**Endpoints utilizados**:

```typescript
// GET consumables (users)
GET /api/consumables
Response: { data: ConsumableItem[] }

// GET consumables (admin)
GET /api/admin/consumables?include_requests=true
Response: { data: ConsumableStockAdmin[] }

// POST request consumable (users)
POST /api/consumables/request
Body: { item_type_id: number, requested_quantity: number }
Response: { fulfilled: boolean, message: string }

// PUT adjust stock (admin)
PUT /api/admin/consumables
Body: { action: string, stock_id: number, quantity?: number }
Response: { success: boolean }

// GET backorders (admin)
GET /api/admin/consumables/backorders
Response: { data: BackorderRequest[] }

// POST process backorders (admin)
POST /api/admin/consumables/backorders
Body: { action: 'process_backorders', item_type_id: number, new_stock_quantity: number }
Response: { summary: { requests_processed: number } }
```

### State Management

**Local State** (por página):
- `isLoading`: Estado de carga inicial
- `activeTab`: Tab activo (solo admin: 'inventory' | 'backorders')
- `showCart`: Visibilidad del modal de carrito (solo users)

**Shared State** (via hooks):
- `consumables`: Lista de consumibles
- `filters`: Estado de filtros
- `filteredConsumables`: Consumibles filtrados (computed)
- `categories`: Categorías únicas (computed)

**Context State**:
- `CartContext`: Carrito de compras (solo users)

## Hooks Design

### useConsumables Hook

```typescript
interface UseConsumablesOptions {
  role: UserRole
  autoFetch?: boolean
}

interface UseConsumablesReturn {
  consumables: ConsumableItem[] | ConsumableStockAdmin[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  requestConsumable: (itemId: number, quantity: number) => Promise<void>
  adjustStock: (stockId: number, action: string, quantity?: number) => Promise<void>
}

export function useConsumables(options: UseConsumablesOptions): UseConsumablesReturn
```

**Responsibilities**:
- Fetch consumables según rol
- Manejar estados de carga y error
- Proporcionar funciones de mutación (request, adjust)
- Auto-refetch después de mutaciones exitosas

### useConsumableFilters Hook

```typescript
interface UseConsumableFiltersOptions<T> {
  items: T[]
  initialFilters?: Partial<ConsumableFilters>
}

interface UseConsumableFiltersReturn<T> {
  filters: ConsumableFilters
  setFilters: (filters: ConsumableFilters) => void
  updateFilter: (key: keyof ConsumableFilters, value: any) => void
  clearFilters: () => void
  filteredItems: T[]
  categories: string[]
  hasActiveFilters: boolean
}

export function useConsumableFilters<T extends ConsumableItem | ConsumableStockAdmin>(
  options: UseConsumableFiltersOptions<T>
): UseConsumableFiltersReturn<T>
```

**Responsibilities**:
- Gestionar estado de filtros
- Aplicar filtros a items
- Extraer categorías únicas
- Detectar filtros activos
- Proporcionar funciones de actualización

**Filter Logic**:
```typescript
// Pseudo-code
filteredItems = items.filter(item => {
  // Search filter
  if (searchTerm) {
    const matchesName = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDesc = item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesName && !matchesDesc) return false
  }
  
  // Category filter
  if (category && category !== 'all') {
    if (item.category !== category) return false
  }
  
  // Low stock filter
  if (showLowStockOnly) {
    if (!item.stock?.is_low_stock) return false
  }
  
  return true
})
```

### useStockAdjustment Hook (Admin only)

```typescript
interface UseStockAdjustmentReturn {
  adjustStock: (stockId: number, action: string, quantity?: number) => Promise<void>
  isAdjusting: boolean
  adjustingStockId: number | null
}

export function useStockAdjustment(onSuccess?: () => void): UseStockAdjustmentReturn
```

**Responsibilities**:
- Manejar ajustes de stock
- Tracking de item siendo ajustado
- Callback de éxito para refetch

## Error Handling

### Error Types

```typescript
enum ConsumableErrorType {
  FETCH_ERROR = 'FETCH_ERROR',
  REQUEST_ERROR = 'REQUEST_ERROR',
  ADJUST_ERROR = 'ADJUST_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
}

interface ConsumableError {
  type: ConsumableErrorType
  message: string
  details?: any
}
```

### Error Handling Strategy

**Network Errors**:
- Mostrar toast/alert con mensaje de error
- Mantener estado anterior (no limpiar datos)
- Proporcionar botón de retry

**Validation Errors**:
- Mostrar mensaje inline en formulario
- Deshabilitar botón de submit
- Highlight del campo con error

**Permission Errors**:
- Redirigir a página apropiada
- Mostrar mensaje de "Access Denied"
- Log para debugging

**API Errors**:
- Parsear mensaje de error del backend
- Mostrar mensaje user-friendly
- Log completo para debugging

### Error Display

```typescript
// Toast notification (preferido)
toast.error('Failed to request consumable: Insufficient stock')

// Alert fallback (actual)
alert(`Failed to request consumable: ${error.message}`)

// Inline error (formularios)
<span className="text-red-500 text-sm">{error.message}</span>
```

## Testing Strategy

### Unit Tests

**Components**:
- `ConsumableCard`: Renderizado por rol, acciones, estados
- `ConsumableFilters`: Cambios de filtros, clear all
- `ConsumableSummary`: Cálculos de estadísticas
- `ConsumableActions`: Validación de cantidad, acciones
- `StockAdjustmentForm`: Tipos de ajuste, validación

**Hooks**:
- `useConsumables`: Fetch, mutaciones, refetch
- `useConsumableFilters`: Lógica de filtrado, categorías
- `useStockAdjustment`: Ajustes, tracking

### Integration Tests

**User Flow (Regular User)**:
1. Cargar página de consumibles
2. Aplicar filtros
3. Agregar item al carrito
4. Solicitar item directamente
5. Ver feedback de éxito

**Admin Flow**:
1. Cargar página de administración
2. Ver inventario y backorders
3. Ajustar stock de un item
4. Procesar backorders
5. Importar consumibles masivamente

### Accessibility Tests

- Keyboard navigation
- Screen reader compatibility
- ARIA labels
- Focus management
- Color contrast

### Visual Regression Tests

- Screenshots de componentes en diferentes estados
- Comparación con baseline
- Detección de cambios no intencionales

## Performance Considerations

### Optimization Strategies

**Code Splitting**:
- Lazy load admin-specific components
- Separate bundles para user/admin pages

**Memoization**:
```typescript
// Memoize filtered items
const filteredItems = useMemo(() => 
  applyFilters(items, filters),
  [items, filters]
)

// Memoize categories
const categories = useMemo(() => 
  extractCategories(items),
  [items]
)
```

**Debouncing**:
```typescript
// Debounce search input
const debouncedSearch = useDebouncedValue(searchTerm, 300)
```

**Virtualization** (future):
- Si la lista crece mucho (>100 items), considerar react-window

### Bundle Size

**Target**:
- Shared components: < 50KB
- User page: < 100KB (total)
- Admin page: < 150KB (total)

**Monitoring**:
- Usar webpack-bundle-analyzer
- Alertar si bundles crecen >20%

## Migration Plan

### Phase 1: Create Shared Components (Week 1)

1. Crear estructura de carpetas
2. Definir tipos compartidos
3. Implementar componentes base:
   - ConsumableCard
   - ConsumableFilters
   - ConsumableSummary
4. Crear hooks compartidos:
   - useConsumables
   - useConsumableFilters

### Phase 2: Refactor User Page (Week 2)

1. Integrar componentes compartidos en `/consumables/page.tsx`
2. Reemplazar lógica duplicada con hooks
3. Mantener funcionalidad de carrito
4. Testing exhaustivo
5. Deploy a staging

### Phase 3: Refactor Admin Page (Week 2-3)

1. Integrar componentes compartidos en `/admin/consumables/page.tsx`
2. Implementar StockAdjustmentForm
3. Implementar BackordersTab
4. Reemplazar lógica con hooks
5. Testing exhaustivo
6. Deploy a staging

### Phase 4: Cleanup and Documentation (Week 3)

1. Remover código duplicado
2. Actualizar documentación
3. Code review
4. Deploy a production
5. Monitoring post-deployment

## Rollback Strategy

**If issues arise**:
1. Revert to previous version via Git
2. Mantener páginas antiguas como backup durante 1 sprint
3. Feature flags para habilitar/deshabilitar nueva arquitectura

## Future Enhancements

**Potential improvements** (out of scope for initial implementation):

1. **Real-time updates**: WebSocket para actualizaciones de stock en tiempo real
2. **Advanced search**: Búsqueda por QR code, fuzzy search
3. **Bulk actions**: Selección múltiple para acciones en batch
4. **Export/Import**: Exportar inventario a CSV/Excel
5. **Analytics**: Dashboard de métricas de consumo
6. **Notifications**: Alertas automáticas de stock bajo
7. **History**: Historial de movimientos de stock
8. **Forecasting**: Predicción de necesidades de reabastecimiento

## Conclusion

Este diseño proporciona una arquitectura sólida que:
- ✅ Elimina duplicación mediante componentes compartidos
- ✅ Mantiene separación clara de responsabilidades
- ✅ Preserva todas las funcionalidades existentes
- ✅ Mejora la mantenibilidad y escalabilidad
- ✅ Facilita testing y debugging
- ✅ Proporciona base para futuras mejoras

La implementación será incremental y con bajo riesgo, permitiendo validación en cada fase.
