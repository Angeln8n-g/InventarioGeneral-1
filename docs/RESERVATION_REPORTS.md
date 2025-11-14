# 📊 Reportes de Reservas con Verificación QR

## Descripción General

Los reportes de reservas proporcionan análisis detallado del sistema de reservas de materiales consumibles, incluyendo métricas de verificación por QR del almacén.

## Endpoint

```
GET /api/admin/reports/reservations
```

**Permisos requeridos:** `REPORTS_VIEW`

## Parámetros de Consulta

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `status` | string | Filtrar por estado | `active`, `fulfilled`, `cancelled`, `expired` |
| `start_date` | string | Fecha de inicio (ISO 8601) | `2025-01-01` |
| `end_date` | string | Fecha de fin (ISO 8601) | `2025-01-31` |
| `user_id` | number | Filtrar por usuario | `123` |
| `item_type_id` | number | Filtrar por tipo de item | `45` |
| `category` | string | Filtrar por categoría | `Electrónica` |
| `warehouse_qr_id` | number | Filtrar por código QR del almacén | `1` |

## Respuesta

### Estructura

```typescript
{
  data: {
    metrics: ReservationMetrics
    charts: ReservationCharts
    reservations: ReservationDetailData[]
    warehouseStats: WarehouseQRStat[]
  }
  message: string
}
```

### Métricas (ReservationMetrics)

```typescript
{
  totalReservations: number          // Total de reservas
  activeReservations: number         // Reservas activas
  fulfilledReservations: number      // Reservas cumplidas
  cancelledReservations: number      // Reservas canceladas
  expiredReservations: number        // Reservas expiradas
  expiringSoon: number               // Reservas que expiran pronto (≤1 día)
  totalReservedQuantity: number      // Cantidad total reservada
  fulfillmentRate: number            // Tasa de cumplimiento (%)
  cancellationRate: number           // Tasa de cancelación (%)
  expirationRate: number             // Tasa de expiración (%)
  avgTimeToPickup: number            // Tiempo promedio hasta recogida (horas)
  reservationsWithQR: number         // Reservas con verificación QR
  qrVerificationRate: number         // Tasa de verificación QR (%)
}
```

### Gráficos (ReservationCharts)

#### 1. Distribución por Estado
```typescript
statusDistribution: Array<{
  status: string    // 'active', 'fulfilled', 'cancelled', 'expired'
  count: number     // Cantidad de reservas
}>
```

#### 2. Reservas por Categoría
```typescript
reservationsByCategory: Array<{
  category: string  // Nombre de la categoría
  count: number     // Cantidad de reservas
}>
```

#### 3. Reservas en el Tiempo
```typescript
reservationsOverTime: Array<{
  date: string      // Fecha (YYYY-MM-DD)
  count: number     // Cantidad de reservas ese día
}>
```

#### 4. Items Más Reservados
```typescript
topReservedItems: Array<{
  name: string      // Nombre del item
  count: number     // Número de reservas
  quantity: number  // Cantidad total reservada
}>
```

#### 5. Distribución de Tiempo de Cumplimiento
```typescript
fulfillmentTimeDistribution: Array<{
  range: string     // '0-6h', '6-12h', '12-24h', '1-2d', '2-7d', '>7d'
  count: number     // Cantidad de reservas en ese rango
}>
```

### Datos Detallados (ReservationDetailData)

```typescript
{
  id: number
  user_id: number
  username: string
  email: string
  item_type_id: number
  item_name: string
  item_category: string | null
  reserved_quantity: number
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired'
  reservation_date: string
  expiration_date: string
  pickup_date: string | null
  notes: string | null
  purpose: string | null
  warehouse_qr_code_id: number | null      // ⭐ ID del código QR escaneado
  warehouse_qr_code: string | null         // ⭐ Código QR (ej: WH-QR-001-ENTRANCE)
  warehouse_location: string | null        // ⭐ Ubicación del código QR
  warehouse_zone: string | null            // ⭐ Zona del almacén
  created_at: string
}
```

### Estadísticas de Códigos QR (WarehouseQRStat)

```typescript
{
  id: number
  qr_code: string              // Código QR (ej: WH-QR-001-ENTRANCE)
  location_name: string        // Nombre de la ubicación
  zone: string                 // Zona del almacén
  is_active: boolean           // Si el código está activo
  total_scans: number          // Total de escaneos
  last_scan_date: string | null // Fecha del último escaneo
}
```

## Ejemplos de Uso

### 1. Reporte General

```bash
GET /api/admin/reports/reservations
```

Retorna todas las métricas y estadísticas sin filtros.

### 2. Reservas Cumplidas del Último Mes

```bash
GET /api/admin/reports/reservations?status=fulfilled&start_date=2025-01-01&end_date=2025-01-31
```

### 3. Reservas de un Usuario Específico

```bash
GET /api/admin/reports/reservations?user_id=123
```

### 4. Análisis por Código QR

```bash
GET /api/admin/reports/reservations?warehouse_qr_id=1
```

Muestra todas las reservas confirmadas con el código QR de la entrada principal.

### 5. Reservas por Categoría

```bash
GET /api/admin/reports/reservations?category=Electrónica
```

## Casos de Uso

### 1. Auditoría de Verificación QR

**Objetivo:** Verificar que los usuarios están usando el sistema de QR correctamente.

**Consulta:**
```bash
GET /api/admin/reports/reservations?status=fulfilled&start_date=2025-01-01
```

**Análisis:**
- Revisar `qrVerificationRate` (debe ser cercano al 100%)
- Identificar reservas sin `warehouse_qr_code_id`
- Verificar distribución de uso entre códigos QR

### 2. Análisis de Eficiencia

**Objetivo:** Medir qué tan rápido los usuarios recogen sus reservas.

**Métricas clave:**
- `avgTimeToPickup`: Tiempo promedio hasta recogida
- `fulfillmentTimeDistribution`: Distribución de tiempos
- `fulfillmentRate`: Porcentaje de reservas cumplidas

### 3. Identificación de Problemas

**Objetivo:** Detectar patrones problemáticos.

**Indicadores:**
- `expirationRate` alto: Usuarios no recogen a tiempo
- `cancellationRate` alto: Problemas con disponibilidad o proceso
- `expiringSoon` alto: Necesidad de recordatorios

### 4. Optimización de Ubicación de Códigos QR

**Objetivo:** Determinar si los códigos QR están bien ubicados.

**Análisis de `warehouseStats`:**
- Códigos con `total_scans = 0`: Mal ubicados o no visibles
- Códigos con uso muy alto: Ubicación óptima
- Distribución desigual: Considerar reubicación

### 5. Análisis de Demanda

**Objetivo:** Identificar items más solicitados.

**Datos:**
- `topReservedItems`: Items más populares
- `reservationsByCategory`: Categorías más demandadas
- `reservationsOverTime`: Patrones temporales

## Consultas SQL Útiles

### Reservas sin Verificación QR

```sql
SELECT 
  r.id,
  u.username,
  it.name as item_name,
  r.pickup_date
FROM consumable_reservations r
JOIN users u ON r.user_id = u.id
JOIN item_types it ON r.item_type_id = it.id
WHERE r.status = 'fulfilled'
  AND r.warehouse_qr_code_id IS NULL
  AND r.pickup_date >= '2025-01-01'
ORDER BY r.pickup_date DESC;
```

### Códigos QR Más Utilizados

```sql
SELECT 
  wq.qr_code,
  wq.location_name,
  COUNT(cr.id) as total_usos,
  MAX(cr.pickup_date) as ultimo_uso
FROM warehouse_qr_codes wq
LEFT JOIN consumable_reservations cr ON cr.warehouse_qr_code_id = wq.id
WHERE cr.status = 'fulfilled'
GROUP BY wq.id, wq.qr_code, wq.location_name
ORDER BY total_usos DESC;
```

### Tiempo Promedio de Recogida por Usuario

```sql
SELECT 
  u.username,
  COUNT(r.id) as total_reservas,
  AVG(EXTRACT(EPOCH FROM (r.pickup_date - r.reservation_date)) / 3600) as avg_horas_recogida
FROM consumable_reservations r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'fulfilled'
  AND r.pickup_date IS NOT NULL
GROUP BY u.id, u.username
ORDER BY avg_horas_recogida ASC;
```

### Reservas por Zona del Almacén

```sql
SELECT 
  wq.zone,
  COUNT(cr.id) as total_recogidas,
  COUNT(DISTINCT cr.user_id) as usuarios_unicos
FROM warehouse_qr_codes wq
JOIN consumable_reservations cr ON cr.warehouse_qr_code_id = wq.id
WHERE cr.status = 'fulfilled'
  AND cr.pickup_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY wq.zone
ORDER BY total_recogidas DESC;
```

## Visualizaciones Recomendadas

### 1. Dashboard Principal

**Métricas destacadas:**
- Total de reservas (con tendencia)
- Tasa de cumplimiento
- Tasa de verificación QR
- Reservas que expiran pronto

**Gráficos:**
- Distribución por estado (pie chart)
- Reservas en el tiempo (line chart)
- Top 10 items reservados (bar chart)

### 2. Panel de Verificación QR

**Métricas:**
- Tasa de verificación QR
- Total de escaneos por código
- Códigos sin uso

**Gráficos:**
- Uso por código QR (bar chart)
- Distribución por zona (pie chart)
- Actividad en el tiempo (line chart)

### 3. Análisis de Eficiencia

**Métricas:**
- Tiempo promedio de recogida
- Tasa de expiración
- Tasa de cancelación

**Gráficos:**
- Distribución de tiempo de cumplimiento (histogram)
- Tendencia de eficiencia (line chart)
- Comparación por categoría (grouped bar chart)

## Integración con Otros Reportes

### Reporte de Consumibles

Combinar con el reporte de consumibles para:
- Correlacionar reservas con consumo real
- Identificar discrepancias
- Optimizar niveles de stock

### Reporte de Usuarios

Analizar comportamiento de usuarios:
- Usuarios con más reservas
- Usuarios con alta tasa de cancelación
- Usuarios que no recogen a tiempo

## Exportación

Los reportes de reservas pueden exportarse en los siguientes formatos:

### PDF
```bash
GET /api/admin/reports/export?reportType=reservations&format=pdf&start_date=2025-01-01
```

### Excel
```bash
GET /api/admin/reports/export?reportType=reservations&format=excel&start_date=2025-01-01
```

### CSV
```bash
GET /api/admin/reports/export?reportType=reservations&format=csv&start_date=2025-01-01
```

## Mejores Prácticas

### 1. Monitoreo Regular

- Revisar tasa de verificación QR semanalmente
- Analizar códigos QR sin uso mensualmente
- Evaluar eficiencia de recogida trimestralmente

### 2. Alertas Automáticas

Configurar alertas para:
- Tasa de verificación QR < 90%
- Códigos QR sin uso por > 7 días
- Tasa de expiración > 20%
- Tiempo promedio de recogida > 48 horas

### 3. Análisis de Tendencias

- Comparar métricas mes a mes
- Identificar patrones estacionales
- Evaluar impacto de cambios en el proceso

### 4. Optimización Continua

Basado en los datos:
- Reubicar códigos QR poco usados
- Ajustar tiempos de expiración
- Mejorar comunicación con usuarios
- Optimizar proceso de reservas

## Soporte

Para más información:
- Documentación técnica: `docs/WAREHOUSE_QR_VERIFICATION.md`
- Implementación: `WAREHOUSE_QR_IMPLEMENTATION.md`
- Guía rápida: `QUICK_START_WAREHOUSE_QR.md`
