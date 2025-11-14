# Design Document

## Overview

El sistema de reportes administrativos se implementará como una extensión del módulo de administración existente, aprovechando la infraestructura actual de Next.js 15, React 19, Supabase y TypeScript. El sistema constará de tres módulos principales de reportes (Loans, Tools, Consumables) con una arquitectura modular que permita reutilización de componentes y fácil mantenimiento.

La arquitectura seguirá el patrón de diseño existente en el proyecto:
- **Frontend**: React Server Components y Client Components con Next.js App Router
- **Backend**: API Routes con middleware de autenticación y autorización
- **Database**: Consultas optimizadas a Supabase PostgreSQL
- **State Management**: React hooks y context para estado local
- **Styling**: Tailwind CSS con tema claro/oscuro existente

### Key Design Decisions

1. **Visualización de Datos**: Utilizaremos Recharts como librería de gráficos por su compatibilidad con React 19, facilidad de uso y capacidad de personalización
2. **Exportación**: Implementaremos exportación del lado del servidor usando librerías especializadas (jsPDF para PDF, xlsx para Excel)
3. **Performance**: Implementaremos paginación, lazy loading y consultas optimizadas con índices en Supabase
4. **Modularidad**: Cada tipo de reporte será un módulo independiente con componentes compartidos
5. **Responsive Design**: Mobile-first approach con adaptación de gráficos y tablas para pantallas pequeñas

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│                  /admin/dashboard/page.tsx                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Reports Hub Page                          │
│                 /admin/reports/page.tsx                      │
│         (Enhanced with navigation to report types)          │
└──────────┬──────────────┬──────────────┬────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Loans   │   │  Tools   │   │Consumables│
    │ Reports  │   │ Reports  │   │  Reports  │
    └──────────┘   └──────────┘   └──────────┘
           │              │              │
           └──────────────┴──────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │   Shared Components Layer   │
           │  - ReportFilters            │
           │  - ReportCharts             │
           │  - ReportTable              │
           │  - ExportButton             │
           └─────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │      API Routes Layer       │
           │  /api/admin/reports/*       │
           └─────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │   Data Access Layer         │
           │  - reportOperations         │
           │  - Supabase queries         │
           └─────────────────────────────┘
```

### Component Hierarchy

```
ReportsPage (Hub)
├── ReportCard (Loans)
├── ReportCard (Tools)
└── ReportCard (Consumables)

LoanReportsPage
├── ReportHeader
├── ReportFilters
│   ├── DateRangePicker
│   ├── UserFilter
│   ├── StatusFilter
│   └── ToolFilter
├── ReportMetrics
│   ├── MetricCard (Total Loans)
│   ├── MetricCard (Overdue)
│   ├── MetricCard (On-time Return Rate)
│   └── MetricCard (Avg Duration)
├── ReportCharts
│   ├── LoansTrendChart (Line)
│   ├── StatusDistributionChart (Pie)
│   ├── TopToolsChart (Bar)
│   └── TopUsersChart (Bar)
├── ReportTable
│   ├── TableHeader
│   ├── TableBody
│   └── Pagination
└── ExportActions
    ├── ExportPDFButton
    ├── ExportExcelButton
    └── ExportCSVButton

ToolReportsPage
├── ReportHeader
├── ReportFilters
│   ├── CategoryFilter
│   ├── StatusFilter
│   └── DateRangePicker
├── ReportMetrics
│   ├── MetricCard (Total Tools)
│   ├── MetricCard (Available)
│   ├── MetricCard (Utilization Rate)
│   └── MetricCard (Maintenance Needed)
├── ReportCharts
│   ├── StatusDistributionChart (Pie)
│   ├── CategoryDistributionChart (Bar)
│   ├── UtilizationChart (Horizontal Bar)
│   └── StatusTimelineChart (Area)
├── ReportTable
└── ExportActions

ConsumableReportsPage
├── ReportHeader
├── ReportFilters
│   ├── CategoryFilter (Primary)
│   ├── DateRangePicker
│   └── StockLevelFilter
├── CategorySelector (Tabs or Dropdown)
├── ReportMetrics
│   ├── MetricCard (Total Types)
│   ├── MetricCard (Low Stock Items)
│   ├── MetricCard (Total Consumption)
│   └── MetricCard (Avg Daily Consumption)
├── ReportCharts
│   ├── ConsumptionByCategoryChart (Pie)
│   ├── ConsumptionTrendChart (Line)
│   ├── LowStockItemsChart (Bar)
│   └── CategoryComparisonChart (Stacked Bar)
├── CategoryDetailView
│   ├── CategoryMetrics
│   ├── ItemsList
│   └── ConsumptionHistory
├── ReportTable
└── ExportActions
```

## Components and Interfaces

### Core Components

#### 1. ReportFilters Component

**Purpose**: Componente reutilizable para filtrado de reportes

**Props Interface**:
```typescript
interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  availableFilters: FilterConfig[]
  isLoading?: boolean
}

interface FilterConfig {
  type: 'date-range' | 'select' | 'multi-select' | 'search'
  name: string
  label: string
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

interface ReportFilters {
  dateRange?: { start: string; end: string }
  status?: string | string[]
  category?: string
  userId?: number
  toolId?: number
  [key: string]: unknown
}
```

**Features**:
- Filtros dinámicos basados en configuración
- Validación de rangos de fechas
- Chips visuales para filtros activos
- Botón "Clear All" para resetear filtros
- Responsive design con collapse en móvil

#### 2. ReportMetrics Component

**Purpose**: Muestra métricas clave en tarjetas visuales

**Props Interface**:
```typescript
interface ReportMetricsProps {
  metrics: Metric[]
  isLoading?: boolean
}

interface Metric {
  id: string
  label: string
  value: number | string
  icon: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  format?: 'number' | 'percentage' | 'currency' | 'duration'
}
```

**Features**:
- Grid responsive (2 columnas en móvil, 4 en desktop)
- Iconos personalizados por métrica
- Indicadores de tendencia con flechas
- Formato automático de valores
- Skeleton loading states

#### 3. ReportCharts Component

**Purpose**: Contenedor para visualizaciones de datos con Recharts

**Props Interface**:
```typescript
interface ReportChartsProps {
  charts: ChartConfig[]
  data: Record<string, unknown[]>
  isLoading?: boolean
}

interface ChartConfig {
  id: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'horizontal-bar' | 'stacked-bar'
  title: string
  dataKey: string
  xAxisKey?: string
  yAxisKey?: string
  colors?: string[]
  height?: number
}
```

**Chart Types**:
- **LineChart**: Tendencias temporales (préstamos por día, consumo diario)
- **BarChart**: Comparaciones (top herramientas, top usuarios)
- **PieChart**: Distribuciones (estados, categorías)
- **AreaChart**: Tendencias acumulativas
- **HorizontalBarChart**: Rankings (utilización de herramientas)
- **StackedBarChart**: Comparativas multi-categoría

**Features**:
- Tooltips interactivos
- Leyendas configurables
- Responsive sizing
- Tema claro/oscuro
- Click handlers para drill-down

#### 4. ReportTable Component

**Purpose**: Tabla de datos con paginación y ordenamiento

**Props Interface**:
```typescript
interface ReportTableProps<T> {
  columns: ColumnConfig<T>[]
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onRowClick?: (row: T) => void
  isLoading?: boolean
}

interface ColumnConfig<T> {
  key: keyof T
  label: string
  sortable?: boolean
  format?: (value: unknown) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}
```

**Features**:
- Ordenamiento por columna
- Paginación con controles
- Formato personalizado de celdas
- Highlight de filas al hover
- Responsive con scroll horizontal en móvil
- Empty state cuando no hay datos

#### 5. ExportButton Component

**Purpose**: Botón para exportar reportes en diferentes formatos

**Props Interface**:
```typescript
interface ExportButtonProps {
  reportType: 'loans' | 'tools' | 'consumables'
  filters: ReportFilters
  format: 'pdf' | 'excel' | 'csv'
  filename?: string
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: Error) => void
}
```

**Features**:
- Loading state durante exportación
- Descarga automática del archivo
- Notificaciones de éxito/error
- Generación de nombre de archivo con timestamp
- Validación de datos antes de exportar

### Page Components

#### LoanReportsPage

**Location**: `/src/app/admin/reports/loans/page.tsx`

**State Management**:
```typescript
interface LoanReportState {
  filters: LoanReportFilters
  data: LoanReportData | null
  isLoading: boolean
  error: string | null
  page: number
  pageSize: number
}

interface LoanReportFilters extends ReportFilters {
  userId?: number
  toolInstanceId?: number
  status?: 'active' | 'returned' | 'overdue' | 'lost'
}

interface LoanReportData {
  metrics: {
    totalLoans: number
    activeLoans: number
    overdueLoans: number
    returnRate: number
    avgDuration: number
  }
  charts: {
    loansTrend: Array<{ date: string; count: number }>
    statusDistribution: Array<{ status: string; count: number }>
    topTools: Array<{ tool: string; count: number }>
    topUsers: Array<{ user: string; count: number }>
  }
  loans: Loan[]
  totalCount: number
}
```

#### ToolReportsPage

**Location**: `/src/app/admin/reports/tools/page.tsx`

**State Management**:
```typescript
interface ToolReportState {
  filters: ToolReportFilters
  data: ToolReportData | null
  isLoading: boolean
  error: string | null
}

interface ToolReportFilters extends ReportFilters {
  category?: string
  status?: ToolInstance['status']
}

interface ToolReportData {
  metrics: {
    totalTools: number
    availableTools: number
    utilizationRate: number
    maintenanceNeeded: number
  }
  charts: {
    statusDistribution: Array<{ status: string; count: number }>
    categoryDistribution: Array<{ category: string; count: number }>
    utilization: Array<{ tool: string; rate: number }>
    statusTimeline: Array<{ date: string; [status: string]: number }>
  }
  tools: ToolInstance[]
}
```

#### ConsumableReportsPage

**Location**: `/src/app/admin/reports/consumables/page.tsx`

**State Management**:
```typescript
interface ConsumableReportState {
  filters: ConsumableReportFilters
  selectedCategory: string | null
  data: ConsumableReportData | null
  categoryDetail: CategoryDetailData | null
  isLoading: boolean
  error: string | null
}

interface ConsumableReportFilters extends ReportFilters {
  category?: string
  stockLevel?: 'all' | 'low' | 'critical' | 'adequate'
}

interface ConsumableReportData {
  metrics: {
    totalTypes: number
    lowStockItems: number
    totalConsumption: number
    avgDailyConsumption: number
  }
  charts: {
    consumptionByCategory: Array<{ category: string; amount: number }>
    consumptionTrend: Array<{ date: string; amount: number }>
    lowStockItems: Array<{ item: string; stock: number; min: number }>
    categoryComparison: Array<{ date: string; [category: string]: number }>
  }
  categories: Array<{
    name: string
    totalItems: number
    totalStock: number
    consumption: number
    lowStockCount: number
  }>
}

interface CategoryDetailData {
  category: string
  metrics: {
    totalItems: number
    totalStock: number
    consumption: number
    avgDailyConsumption: number
    projectedDaysUntilEmpty: number
  }
  items: Array<{
    id: number
    name: string
    currentStock: number
    minimumThreshold: number
    consumption: number
    status: 'adequate' | 'low' | 'critical'
  }>
  consumptionHistory: Array<{ date: string; amount: number }>
}
```

## Data Models

### API Response Types

```typescript
// Loan Report Response
interface LoanReportResponse {
  data: {
    metrics: LoanMetrics
    charts: LoanCharts
    loans: LoanWithRelations[]
    totalCount: number
  }
  message: string
}

interface LoanWithRelations extends Loan {
  user: Pick<User, 'id' | 'username' | 'email'>
  tool_instance: ToolInstance & {
    item_type: Pick<ItemType, 'id' | 'name' | 'category'>
  }
  daysOverdue?: number
}

// Tool Report Response
interface ToolReportResponse {
  data: {
    metrics: ToolMetrics
    charts: ToolCharts
    tools: ToolInstanceWithRelations[]
  }
  message: string
}

interface ToolInstanceWithRelations extends ToolInstance {
  item_type: ItemType
  loanHistory: Array<{
    loanDate: string
    returnDate: string | null
    duration: number
  }>
  utilizationRate: number
}

// Consumable Report Response
interface ConsumableReportResponse {
  data: {
    metrics: ConsumableMetrics
    charts: ConsumableCharts
    categories: CategorySummary[]
  }
  message: string
}

interface CategoryDetailResponse {
  data: CategoryDetailData
  message: string
}

interface CategorySummary {
  category: string
  totalItems: number
  totalStock: number
  consumption: number
  lowStockCount: number
  items: ConsumableStockWithType[]
}

interface ConsumableStockWithType extends ConsumableStock {
  item_type: ItemType
  consumptionInPeriod: number
  requestsInPeriod: number
  status: 'adequate' | 'low' | 'critical'
}
```

### Database Query Helpers

```typescript
// Report Operations Interface
interface ReportOperations {
  loans: {
    getMetrics(filters: LoanReportFilters): Promise<LoanMetrics>
    getChartData(filters: LoanReportFilters): Promise<LoanCharts>
    getDetailedLoans(filters: LoanReportFilters, page: number, pageSize: number): Promise<{ loans: LoanWithRelations[]; totalCount: number }>
  }
  tools: {
    getMetrics(filters: ToolReportFilters): Promise<ToolMetrics>
    getChartData(filters: ToolReportFilters): Promise<ToolCharts>
    getDetailedTools(filters: ToolReportFilters): Promise<ToolInstanceWithRelations[]>
  }
  consumables: {
    getMetrics(filters: ConsumableReportFilters): Promise<ConsumableMetrics>
    getChartData(filters: ConsumableReportFilters): Promise<ConsumableCharts>
    getCategorySummaries(filters: ConsumableReportFilters): Promise<CategorySummary[]>
    getCategoryDetail(category: string, filters: ConsumableReportFilters): Promise<CategoryDetailData>
  }
}
```

## Error Handling

### Error Types

```typescript
enum ReportErrorCode {
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  EXPORT_FAILED = 'EXPORT_FAILED',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

interface ReportError {
  code: ReportErrorCode
  message: string
  details?: Record<string, unknown>
}
```

### Error Handling Strategy

1. **Client-Side Validation**:
   - Validar rangos de fechas antes de enviar request
   - Validar que fecha inicio < fecha fin
   - Validar que el rango no exceda 1 año

2. **API Error Responses**:
   - Retornar códigos de error específicos
   - Incluir mensajes descriptivos
   - Registrar errores en audit logs

3. **User Feedback**:
   - Toast notifications para errores
   - Mensajes inline en formularios
   - Empty states cuando no hay datos
   - Retry buttons para errores recuperables

4. **Fallback Behavior**:
   - Mostrar datos parciales si algunos queries fallan
   - Degradar gracefully (ej: mostrar tabla sin gráficos)
   - Mantener filtros aplicados después de error

## Testing Strategy

### Unit Tests

**Components to Test**:
- ReportFilters: validación de filtros, eventos de cambio
- ReportMetrics: formato de valores, cálculo de tendencias
- ReportCharts: renderizado con diferentes tipos de datos
- ReportTable: paginación, ordenamiento, formato de celdas
- ExportButton: generación de nombres de archivo, manejo de errores

**Test Cases**:
```typescript
describe('ReportFilters', () => {
  it('should validate date range correctly')
  it('should emit filter changes')
  it('should clear all filters')
  it('should show active filter chips')
})

describe('ReportMetrics', () => {
  it('should format numbers correctly')
  it('should format percentages correctly')
  it('should show trend indicators')
  it('should handle loading state')
})

describe('ReportTable', () => {
  it('should paginate data correctly')
  it('should sort by column')
  it('should handle empty data')
  it('should format cells based on config')
})
```

### Integration Tests

**API Routes to Test**:
- `/api/admin/reports/loans`: filtros, paginación, métricas
- `/api/admin/reports/tools`: filtros, cálculo de utilización
- `/api/admin/reports/consumables`: agrupación por categoría
- `/api/admin/reports/consumables/[category]`: detalle de categoría
- `/api/admin/reports/export`: generación de archivos

**Test Scenarios**:
```typescript
describe('Loan Reports API', () => {
  it('should return metrics for date range')
  it('should filter by user')
  it('should filter by status')
  it('should calculate overdue loans correctly')
  it('should paginate results')
  it('should require admin permissions')
})

describe('Consumable Reports API', () => {
  it('should group by category')
  it('should calculate consumption in period')
  it('should identify low stock items')
  it('should return category detail')
  it('should handle missing categories')
})
```

### Performance Tests

**Metrics to Monitor**:
- Query execution time (target: < 2s)
- Page load time (target: < 3s)
- Chart rendering time (target: < 500ms)
- Export generation time (target: < 5s for 1000 records)

**Test Scenarios**:
- Large datasets (10,000+ loans)
- Multiple concurrent users
- Complex filters with multiple conditions
- Export of large reports

### Accessibility Tests

**Requirements**:
- Keyboard navigation for all filters and controls
- Screen reader support for charts (alt text, ARIA labels)
- Color contrast ratios meet WCAG AA standards
- Focus indicators visible
- Error messages announced to screen readers

## Performance Optimization

### Database Optimization

**Indexes to Create**:
```sql
-- Loans table
CREATE INDEX idx_loans_date_range ON loans(loan_date, due_date);
CREATE INDEX idx_loans_status_date ON loans(status, loan_date);
CREATE INDEX idx_loans_user_date ON loans(user_id, loan_date);

-- Tool instances table
CREATE INDEX idx_tools_status_category ON tool_instances(status);
CREATE INDEX idx_tools_item_type ON tool_instances(item_type_id);

-- Consumable stock table
CREATE INDEX idx_consumable_category ON consumable_stock(item_type_id);
CREATE INDEX idx_consumable_stock_level ON consumable_stock(current_quantity, minimum_threshold);

-- Audit logs for consumption tracking
CREATE INDEX idx_audit_consumable_date ON audit_logs(entity_type, created_at) 
WHERE entity_type = 'consumable_stock';
```

**Query Optimization**:
- Use aggregate functions in SQL instead of JavaScript
- Implement materialized views for complex metrics
- Use EXPLAIN ANALYZE to identify slow queries
- Batch related queries when possible

### Frontend Optimization

**Strategies**:
1. **Code Splitting**: Lazy load chart library and export utilities
2. **Memoization**: Use React.memo for expensive components
3. **Debouncing**: Debounce filter changes (300ms)
4. **Virtual Scrolling**: For large tables (>100 rows)
5. **Image Optimization**: Optimize chart exports
6. **Caching**: Cache report data with SWR or React Query

**Implementation**:
```typescript
// Lazy load charts
const ReportCharts = dynamic(() => import('@/components/reports/ReportCharts'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})

// Memoize expensive calculations
const metrics = useMemo(() => calculateMetrics(data), [data])

// Debounce filter changes
const debouncedFilters = useDebounce(filters, 300)
```

### Export Optimization

**Strategies**:
- Generate exports server-side to avoid blocking UI
- Stream large files instead of loading in memory
- Compress exports before download
- Implement queue system for multiple concurrent exports
- Cache generated reports for repeated requests

## Security Considerations

### Authentication & Authorization

**Requirements**:
- All report endpoints require authentication
- Only admin role can access reports
- Verify JWT token on every request
- Check permissions using existing middleware

**Implementation**:
```typescript
// All report routes use withPermission middleware
export async function GET(request: NextRequest) {
  return await withPermission(
    request,
    PERMISSIONS.ADMIN_VIEW_REPORTS,
    async (authContext) => {
      // Report logic here
    }
  )
}
```

### Data Protection

**Measures**:
- Sanitize user inputs in filters
- Prevent SQL injection with parameterized queries
- Limit date ranges to prevent excessive data extraction
- Rate limit export endpoints
- Log all report access in audit_logs

**Rate Limiting**:
```typescript
const RATE_LIMITS = {
  REPORT_VIEW: { requests: 60, window: 60000 }, // 60 per minute
  REPORT_EXPORT: { requests: 10, window: 60000 }, // 10 per minute
}
```

### Audit Logging

**Events to Log**:
- Report access (type, filters, user)
- Export generation (format, size, user)
- Failed access attempts
- Suspicious activity (excessive requests)

**Log Format**:
```typescript
{
  user_id: number
  action: 'report_view' | 'report_export'
  entity_type: 'loan_report' | 'tool_report' | 'consumable_report'
  entity_id: null
  new_values: {
    filters: ReportFilters
    format?: 'pdf' | 'excel' | 'csv'
    recordCount?: number
  }
  ip_address: string
  user_agent: string
  created_at: string
}
```

## Deployment Considerations

### Environment Variables

```env
# Report Configuration
REPORT_MAX_DATE_RANGE_DAYS=365
REPORT_DEFAULT_PAGE_SIZE=50
REPORT_MAX_PAGE_SIZE=200
REPORT_EXPORT_MAX_RECORDS=10000

# Performance
REPORT_QUERY_TIMEOUT_MS=30000
REPORT_CACHE_TTL_SECONDS=300
```

### Monitoring

**Metrics to Track**:
- Report generation time by type
- Export success/failure rates
- Most used filters
- Peak usage times
- Error rates by endpoint

**Alerts**:
- Query timeout threshold exceeded
- Export failure rate > 5%
- Concurrent users > threshold
- Database connection pool exhausted

## Future Enhancements

### Phase 2 Features

1. **Scheduled Reports**: Generar reportes automáticamente y enviar por email
2. **Custom Reports**: Permitir a admins crear reportes personalizados
3. **Dashboard Widgets**: Agregar widgets de reportes al dashboard principal
4. **Comparative Analysis**: Comparar períodos (mes actual vs mes anterior)
5. **Predictive Analytics**: Proyecciones de consumo y necesidades futuras
6. **Report Templates**: Plantillas predefinidas para casos de uso comunes
7. **Collaborative Features**: Compartir reportes con otros admins
8. **Mobile App**: Versión nativa para iOS/Android

### Technical Debt to Address

1. Implementar caching más robusto con Redis
2. Migrar a React Query para mejor gestión de estado
3. Implementar WebSockets para actualizaciones en tiempo real
4. Optimizar bundle size con tree shaking más agresivo
5. Implementar service worker para reportes offline
