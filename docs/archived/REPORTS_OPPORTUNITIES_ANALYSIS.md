# 📊 Oportunidades de Reportes con Número de Factura

## 🎯 Datos Disponibles Ahora

Con la implementación del número de factura, ahora tenemos en el `audit_log`:

```json
{
  "action": "stock_restock",
  "entity_type": "consumable_stock",
  "entity_id": 123,
  "new_values": {
    "old_quantity": 45,
    "new_quantity": 95,
    "restock_amount": 50,
    "invoice_number": "FAC-2025-001234",
    "supplier_name": "ABC Supplies Inc.",
    "purchase_date": "2025-10-06",
    "notes": "Received shipment"
  },
  "user_id": 1,
  "created_at": "2025-10-06T10:30:00Z"
}
```

---

## 📈 Reportes Posibles

### 1. Reporte de Compras por Período

**Objetivo:** Ver todas las compras realizadas en un período

**Datos a mostrar:**

- Fecha de compra
- Número de factura
- Proveedor
- Consumible comprado
- Cantidad
- Usuario que registró
- Notas

**Query SQL:**

```sql
SELECT
  al.created_at::date as purchase_date,
  al.new_values->>'invoice_number' as invoice_number,
  al.new_values->>'supplier_name' as supplier_name,
  it.name as consumable_name,
  (al.new_values->>'restock_amount')::numeric as quantity,
  cs.unit_of_measure,
  u.username as registered_by,
  al.new_values->>'notes' as notes
FROM audit_logs al
JOIN consumable_stock cs ON cs.id = al.entity_id
JOIN item_types it ON it.id = cs.item_type_id
JOIN users u ON u.id = al.user_id
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
  AND al.created_at >= '2025-01-01'
  AND al.created_at < '2025-02-01'
ORDER BY al.created_at DESC;
```

**Visualización:**

```
┌────────────┬─────────────────┬──────────────────┬─────────────┬──────────┐
│ Fecha      │ Factura         │ Proveedor        │ Consumible  │ Cantidad │
├────────────┼─────────────────┼──────────────────┼─────────────┼──────────┤
│ 2025-10-06 │ FAC-2025-001234 │ ABC Supplies     │ Papel A4    │ 500      │
│ 2025-10-05 │ FAC-2025-001233 │ XYZ Equipment    │ Marcadores  │ 50       │
│ 2025-10-04 │ FAC-2025-001232 │ ABC Supplies     │ Pegamento   │ 30       │
└────────────┴─────────────────┴──────────────────┴─────────────┴──────────┘
Total: 3 compras
```

---

### 2. Reporte de Compras por Proveedor

**Objetivo:** Analizar qué proveedores usamos más

**Datos a mostrar:**

- Proveedor
- Número de compras
- Total de items comprados
- Última compra
- Facturas asociadas

**Query SQL:**

```sql
SELECT
  al.new_values->>'supplier_name' as supplier_name,
  COUNT(DISTINCT al.new_values->>'invoice_number') as total_invoices,
  COUNT(*) as total_purchases,
  SUM((al.new_values->>'restock_amount')::numeric) as total_items,
  MAX(al.created_at) as last_purchase,
  STRING_AGG(DISTINCT al.new_values->>'invoice_number', ', ') as invoices
FROM audit_logs al
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
  AND al.new_values->>'supplier_name' IS NOT NULL
  AND al.created_at >= '2025-01-01'
GROUP BY al.new_values->>'supplier_name'
ORDER BY total_purchases DESC;
```

**Visualización:**

```
┌──────────────────┬──────────┬──────────┬────────────┬─────────────┐
│ Proveedor        │ Facturas │ Compras  │ Items Tot. │ Última      │
├──────────────────┼──────────┼──────────┼────────────┼─────────────┤
│ ABC Supplies     │ 15       │ 25       │ 5,000      │ 2025-10-06  │
│ XYZ Equipment    │ 8        │ 12       │ 2,500      │ 2025-10-05  │
│ Office Depot     │ 5        │ 8        │ 1,200      │ 2025-10-03  │
└──────────────────┴──────────┴──────────┴────────────┴─────────────┘
```

**Gráfico de Pastel:**

```
ABC Supplies (55%)  ████████████████████████
XYZ Equipment (27%) ████████████
Office Depot (18%)  ████████
```

---

### 3. Reporte de Facturas Duplicadas

**Objetivo:** Detectar posibles errores o fraudes

**Query SQL:**

```sql
SELECT
  al.new_values->>'invoice_number' as invoice_number,
  COUNT(*) as times_used,
  STRING_AGG(DISTINCT al.new_values->>'supplier_name', ', ') as suppliers,
  STRING_AGG(DISTINCT it.name, ', ') as consumables,
  MIN(al.created_at) as first_use,
  MAX(al.created_at) as last_use
FROM audit_logs al
JOIN consumable_stock cs ON cs.id = al.entity_id
JOIN item_types it ON it.id = cs.item_type_id
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND al.new_values->>'invoice_number' IS NOT NULL
GROUP BY al.new_values->>'invoice_number'
HAVING COUNT(*) > 1
ORDER BY times_used DESC;
```

**Alerta:**

```
⚠️ FACTURAS DUPLICADAS DETECTADAS

Factura: FAC-2025-001234
Usada: 3 veces
Proveedores: ABC Supplies, XYZ Equipment
Consumibles: Papel A4, Marcadores, Pegamento
Primera vez: 2025-10-01
Última vez: 2025-10-06

Acción recomendada: Revisar si es error o compras múltiples legítimas
```

---

### 4. Reporte de Consumo vs. Compras

**Objetivo:** Analizar balance entre lo que compramos y consumimos

**Query SQL:**

```sql
WITH purchases AS (
  SELECT
    cs.item_type_id,
    SUM((al.new_values->>'restock_amount')::numeric) as total_purchased
  FROM audit_logs al
  JOIN consumable_stock cs ON cs.id = al.entity_id
  WHERE al.action IN ('stock_restock', 'stock_adjustment')
    AND (al.new_values->>'restock_amount')::numeric > 0
    AND al.created_at >= '2025-01-01'
  GROUP BY cs.item_type_id
),
consumption AS (
  SELECT
    consumable_stock_id,
    SUM(quantity) as total_consumed
  FROM stock_movements
  WHERE movement_type = 'consumption'
    AND created_at >= '2025-01-01'
  GROUP BY consumable_stock_id
)
SELECT
  it.name as consumable_name,
  COALESCE(p.total_purchased, 0) as purchased,
  COALESCE(c.total_consumed, 0) as consumed,
  cs.current_quantity as current_stock,
  COALESCE(p.total_purchased, 0) - COALESCE(c.total_consumed, 0) as balance
FROM item_types it
JOIN consumable_stock cs ON cs.item_type_id = it.id
LEFT JOIN purchases p ON p.item_type_id = it.id
LEFT JOIN consumption c ON c.consumable_stock_id = cs.id
WHERE it.is_tool = false
ORDER BY balance DESC;
```

**Visualización:**

```
┌─────────────┬──────────┬──────────┬────────────┬─────────┐
│ Consumible  │ Comprado │ Consumido│ Stock Act. │ Balance │
├─────────────┼──────────┼──────────┼────────────┼─────────┤
│ Papel A4    │ 1,000    │ 600      │ 450        │ +400    │
│ Marcadores  │ 200      │ 180      │ 25         │ +20     │
│ Pegamento   │ 100      │ 120      │ 5          │ -20 ⚠️  │
└─────────────┴──────────┴──────────┴────────────┴─────────┘

⚠️ Pegamento: Consumo mayor que compras (posible error de registro)
```

---

### 5. Reporte de Frecuencia de Compras

**Objetivo:** Identificar patrones de compra

**Query SQL:**

```sql
SELECT
  it.name as consumable_name,
  COUNT(DISTINCT al.new_values->>'invoice_number') as purchase_count,
  MIN(al.created_at::date) as first_purchase,
  MAX(al.created_at::date) as last_purchase,
  ROUND(
    EXTRACT(EPOCH FROM (MAX(al.created_at) - MIN(al.created_at))) /
    (COUNT(DISTINCT al.new_values->>'invoice_number') - 1) / 86400
  ) as avg_days_between_purchases
FROM audit_logs al
JOIN consumable_stock cs ON cs.id = al.entity_id
JOIN item_types it ON it.id = cs.item_type_id
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
GROUP BY it.name
HAVING COUNT(DISTINCT al.new_values->>'invoice_number') > 1
ORDER BY purchase_count DESC;
```

**Visualización:**

```
┌─────────────┬──────────┬─────────────┬─────────────┬──────────────┐
│ Consumible  │ Compras  │ Primera     │ Última      │ Días Promedio│
├─────────────┼──────────┼─────────────┼─────────────┼──────────────┤
│ Papel A4    │ 12       │ 2025-01-05  │ 2025-10-06  │ 25 días      │
│ Marcadores  │ 8        │ 2025-02-10  │ 2025-10-05  │ 32 días      │
│ Pegamento   │ 6        │ 2025-03-15  │ 2025-10-04  │ 38 días      │
└─────────────┴──────────┴─────────────┴─────────────┴──────────────┘

📊 Recomendación: Papel A4 se compra cada ~25 días
```

---

### 6. Reporte de Costo Estimado (Si se agrega precio)

**Objetivo:** Análisis financiero de compras

**Nota:** Requiere agregar campo `unit_price` en futuro

**Query SQL (Futuro):**

```sql
SELECT
  DATE_TRUNC('month', al.created_at) as month,
  COUNT(DISTINCT al.new_values->>'invoice_number') as invoices,
  SUM(
    (al.new_values->>'restock_amount')::numeric *
    (al.new_values->>'unit_price')::numeric
  ) as total_cost,
  AVG(
    (al.new_values->>'restock_amount')::numeric *
    (al.new_values->>'unit_price')::numeric
  ) as avg_invoice_cost
FROM audit_logs al
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
  AND al.created_at >= '2025-01-01'
GROUP BY DATE_TRUNC('month', al.created_at)
ORDER BY month DESC;
```

**Visualización:**

```
┌──────────┬──────────┬─────────────┬──────────────┐
│ Mes      │ Facturas │ Costo Total │ Costo Prom.  │
├──────────┼──────────┼─────────────┼──────────────┤
│ Oct 2025 │ 15       │ $12,500.00  │ $833.33      │
│ Sep 2025 │ 18       │ $15,200.00  │ $844.44      │
│ Ago 2025 │ 12       │ $9,800.00   │ $816.67      │
└──────────┴──────────┴─────────────┴──────────────┘

📈 Tendencia: Gasto mensual promedio $12,500
```

---

### 7. Reporte de Auditoría de Facturas

**Objetivo:** Verificación y cumplimiento

**Query SQL:**

```sql
SELECT
  al.created_at::date as date,
  al.new_values->>'invoice_number' as invoice_number,
  al.new_values->>'supplier_name' as supplier,
  it.name as consumable,
  (al.new_values->>'restock_amount')::numeric as quantity,
  u.username as registered_by,
  al.ip_address,
  al.new_values->>'notes' as notes
FROM audit_logs al
JOIN consumable_stock cs ON cs.id = al.entity_id
JOIN item_types it ON it.id = cs.item_type_id
JOIN users u ON u.id = al.user_id
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
  AND al.created_at >= '2025-01-01'
ORDER BY al.created_at DESC;
```

**Exportable a Excel/PDF para auditorías externas**

---

### 8. Dashboard de Compras en Tiempo Real

**Objetivo:** Vista ejecutiva de compras

**Métricas:**

```
┌─────────────────────────────────────────────────────┐
│ DASHBOARD DE COMPRAS - OCTUBRE 2025                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📦 Total Compras Este Mes: 15                       │
│ 📋 Total Facturas: 15                               │
│ 🏢 Proveedores Activos: 5                           │
│ 📊 Items Comprados: 2,500 unidades                  │
│                                                     │
│ Top 3 Proveedores:                                  │
│ 1. ABC Supplies (8 compras)                         │
│ 2. XYZ Equipment (4 compras)                        │
│ 3. Office Depot (3 compras)                         │
│                                                     │
│ Última Compra:                                      │
│ Factura: FAC-2025-001234                            │
│ Proveedor: ABC Supplies                             │
│ Fecha: 2025-10-06                                   │
│ Items: Papel A4 (500 unidades)                      │
│                                                     │
│ ⚠️ Alertas:                                         │
│ • 2 facturas duplicadas detectadas                  │
│ • 1 proveedor sin compras en 60 días                │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Implementación de Reportes

### Opción 1: Página de Reportes Dedicada

**Ruta:** `/admin/reports/purchases`

**Componentes:**

```typescript
// src/app/admin/reports/purchases/page.tsx
export default function PurchasesReportPage() {
  return (
    <AppLayout title="Purchase Reports">
      <div className="space-y-6">
        {/* Filtros */}
        <ReportFilters />

        {/* Métricas Resumen */}
        <PurchaseMetrics />

        {/* Gráficos */}
        <div className="grid grid-cols-2 gap-4">
          <PurchasesBySupplierChart />
          <PurchasesTrendChart />
        </div>

        {/* Tabla Detallada */}
        <PurchasesTable />

        {/* Exportar */}
        <ExportButtons />
      </div>
    </AppLayout>
  );
}
```

---

### Opción 2: Agregar a Reportes Existentes

**Actualizar:** `src/app/admin/reports/consumables/page.tsx`

**Agregar sección:**

```typescript
<div className="bg-card-light dark:bg-card-dark rounded-lg p-6">
  <h3 className="text-lg font-semibold mb-4">Purchase History</h3>

  {/* Tabla de compras */}
  <PurchaseHistoryTable
    consumableId={selectedConsumable}
    dateRange={dateRange}
  />

  {/* Gráfico de compras */}
  <PurchaseFrequencyChart consumableId={selectedConsumable} />
</div>
```

---

### Opción 3: Widget en Dashboard

**Actualizar:** `src/app/admin/dashboard/page.tsx`

**Agregar widget:**

```typescript
<DashboardCard
  title="Recent Purchases"
  icon={<ShoppingCart />}
  value={recentPurchases.length}
  subtitle="Last 7 days"
>
  <RecentPurchasesList purchases={recentPurchases} />
</DashboardCard>
```

---

## 📊 Queries Útiles para Reportes

### Query 1: Compras del Mes Actual

```sql
SELECT
  COUNT(*) as total_purchases,
  COUNT(DISTINCT al.new_values->>'invoice_number') as total_invoices,
  COUNT(DISTINCT al.new_values->>'supplier_name') as total_suppliers,
  SUM((al.new_values->>'restock_amount')::numeric) as total_items
FROM audit_logs al
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
  AND DATE_TRUNC('month', al.created_at) = DATE_TRUNC('month', CURRENT_DATE);
```

### Query 2: Top 5 Proveedores

```sql
SELECT
  al.new_values->>'supplier_name' as supplier,
  COUNT(*) as purchases,
  SUM((al.new_values->>'restock_amount')::numeric) as total_items
FROM audit_logs al
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
  AND al.new_values->>'supplier_name' IS NOT NULL
GROUP BY al.new_values->>'supplier_name'
ORDER BY purchases DESC
LIMIT 5;
```

### Query 3: Compras por Día (Últimos 30 días)

```sql
SELECT
  al.created_at::date as date,
  COUNT(*) as purchases,
  SUM((al.new_values->>'restock_amount')::numeric) as items
FROM audit_logs al
WHERE al.action IN ('stock_restock', 'stock_adjustment')
  AND (al.new_values->>'restock_amount')::numeric > 0
  AND al.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY al.created_at::date
ORDER BY date DESC;
```

---

## 🎯 Beneficios de Estos Reportes

### Para Administración

- ✅ Visibilidad completa de compras
- ✅ Identificación de proveedores preferidos
- ✅ Detección de patrones de compra
- ✅ Control de gastos

### Para Contabilidad

- ✅ Conciliación de facturas
- ✅ Auditoría facilitada
- ✅ Reportes para impuestos
- ✅ Análisis de costos

### Para Compras

- ✅ Negociación con proveedores
- ✅ Optimización de pedidos
- ✅ Predicción de necesidades
- ✅ Evaluación de proveedores

### Para Dirección

- ✅ Toma de decisiones informada
- ✅ Control presupuestario
- ✅ Identificación de ahorros
- ✅ Planificación estratégica

---

## 💡 Recomendaciones

### Corto Plazo (Implementar Ya)

1. ✅ Reporte de Compras por Período
2. ✅ Reporte de Compras por Proveedor
3. ✅ Dashboard con métricas básicas

### Mediano Plazo

1. ⏳ Reporte de Facturas Duplicadas
2. ⏳ Reporte de Frecuencia de Compras
3. ⏳ Gráficos y visualizaciones

### Largo Plazo

1. ⏳ Agregar campo de precio
2. ⏳ Reportes financieros completos
3. ⏳ Predicción de compras con IA
4. ⏳ Integración con sistema contable

---

**¿Quieres que implemente alguno de estos reportes?**
