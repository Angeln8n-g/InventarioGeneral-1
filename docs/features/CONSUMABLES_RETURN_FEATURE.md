# Feature: Devolución de Consumibles No Utilizados

## Resumen Ejecutivo
Implementar una funcionalidad que permita a los usuarios devolver consumibles no utilizados de sus prácticas, validando el historial de consumo y actualizando el stock principal automáticamente.

## Objetivos
1. Permitir a los usuarios devolver consumibles no utilizados
2. Validar el historial de consumo del usuario antes de permitir devoluciones
3. Actualizar el stock principal automáticamente al confirmar devoluciones
4. Proporcionar una interfaz similar al scanner con carrito de compras
5. Registrar todas las devoluciones en el sistema de auditoría

## Estructura de Datos

### Nueva Tabla: `consumable_returns`
```sql
CREATE TABLE consumable_returns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  consumable_stock_id INTEGER REFERENCES consumable_stock(id) ON DELETE CASCADE,
  returned_quantity INTEGER NOT NULL CHECK (returned_quantity > 0),
  original_consumption_date DATE NOT NULL,
  return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consumable_returns_user ON consumable_returns(user_id);
CREATE INDEX idx_consumable_returns_item_type ON consumable_returns(item_type_id);
CREATE INDEX idx_consumable_returns_date ON consumable_returns(return_date);
```

### Nuevo Tipo de Movimiento en `stock_movements`
- Agregar `'return'` al CHECK constraint de `movement_type`

## Componentes a Crear

### 1. Página: `/consumables/return`
**Funcionalidad:**
- Mostrar historial de consumos del usuario (últimos 30 días)
- Permitir seleccionar fecha de consumo
- Mostrar consumibles consumidos en esa fecha
- Carrito de devolución con scanner QR
- Validación de cantidades (no puede devolver más de lo consumido)

**Componentes:**
- `ConsumptionHistorySelector` - Selector de fecha con historial
- `ReturnableItemsList` - Lista de items que pueden devolverse
- `ReturnCart` - Carrito de devolución
- `ReturnScanner` - Scanner QR para agregar items al carrito

### 2. API Endpoints

#### `GET /api/consumables/my-consumption`
**Propósito:** Obtener historial de consumo del usuario

**Query Parameters:**
- `start_date` (opcional): Fecha inicio
- `end_date` (opcional): Fecha fin
- `item_type_id` (opcional): Filtrar por tipo de item

**Response:**
```typescript
{
  data: [
    {
      consumption_date: "2025-01-08",
      items: [
        {
          item_type_id: 1,
          item_name: "Tornillos M5",
          consumed_quantity: 10,
          returned_quantity: 0,
          returnable_quantity: 10,
          unit_of_measure: "units"
        }
      ]
    }
  ]
}
```

#### `POST /api/consumables/return`
**Propósito:** Registrar devolución de consumibles

**Request Body:**
```typescript
{
  returns: [
    {
      item_type_id: number,
      returned_quantity: number,
      consumption_date: string, // ISO date
      notes?: string
    }
  ]
}
```

**Validaciones:**
1. Usuario debe haber consumido el item en la fecha especificada
2. Cantidad a devolver <= cantidad consumida - cantidad ya devuelta
3. Stock debe existir y estar activo

**Response:**
```typescript
{
  data: {
    returns: ConsumableReturn[],
    stock_updated: {
      item_type_id: number,
      old_quantity: number,
      new_quantity: number
    }[]
  },
  message: "Returns processed successfully"
}
```

#### `GET /api/consumables/return-history`
**Propósito:** Obtener historial de devoluciones del usuario

**Response:**
```typescript
{
  data: ConsumableReturn[]
}
```

### 3. Contexto: `ReturnCartContext`
Similar a `CartContext` pero para devoluciones:

```typescript
interface ReturnCartItem {
  id: number
  name: string
  quantity: number
  consumption_date: string
  max_returnable: number
  unit_of_measure?: string
}

interface ReturnCartContextType {
  items: ReturnCartItem[]
  addItem: (item: Omit<ReturnCartItem, 'quantity'>, quantity: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
}
```

### 4. Componentes UI

#### `ReturnButton`
- Icono de reciclaje (♻️)
- Badge con contador de items en carrito
- Posición fija en la esquina inferior derecha

#### `ReturnCartModal`
- Lista de items a devolver
- Validación de cantidades
- Botón de confirmación
- Resumen de devolución

#### `ConsumptionDatePicker`
- Calendario con fechas que tienen consumos
- Indicador visual de cantidad consumida por fecha
- Filtro rápido (hoy, ayer, última semana)

## Flujo de Usuario

### Flujo Principal
1. Usuario accede desde botón de reciclaje en `/scanner` o `/consumables`
2. Sistema muestra selector de fecha con historial de consumos
3. Usuario selecciona fecha de consumo
4. Sistema muestra formulario flotante con items consumidos en esa fecha
5. Usuario puede:
   - Escanear QR del consumible
   - Buscar manualmente
   - Agregar al carrito de devolución
6. Usuario ajusta cantidades en el carrito
7. Usuario confirma devolución
8. Sistema valida y procesa:
   - Registra devolución en `consumable_returns`
   - Actualiza stock en `consumable_stock`
   - Crea movimiento en `stock_movements` (tipo: 'return')
   - Crea log de auditoría
   - Envía notificación al usuario
9. Usuario recibe confirmación

### Validaciones en Tiempo Real
- Al agregar item: verificar que fue consumido en la fecha seleccionada
- Al ajustar cantidad: no permitir más de lo consumido - lo ya devuelto
- Al confirmar: validar todas las cantidades nuevamente

## Integración con Sistema Existente

### Botones de Acceso
1. **En `/scanner` (página principal):**
   - Agregar opción "Devolver Consumibles" con icono de reciclaje
   - Posición: junto a las opciones existentes

2. **En `/consumables`:**
   - Agregar botón flotante con icono de reciclaje
   - Posición: esquina inferior derecha (similar a CartButton)

### Modificaciones a Tablas Existentes
```sql
-- Agregar tipo 'return' a stock_movements
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_movement_type_check 
CHECK (movement_type IN ('consumption', 'adjustment', 'restock', 'loss', 'damage', 'return'));
```

## Consideraciones de Seguridad
1. Solo el usuario que consumió puede devolver
2. No se pueden devolver items de hace más de 30 días (configurable)
3. Validación de cantidades en backend
4. Registro completo en audit_logs
5. Notificaciones a administradores de devoluciones grandes

## Métricas y Reportes
- Total de devoluciones por usuario
- Items más devueltos (posible indicador de sobre-asignación)
- Tasa de devolución por tipo de item
- Impacto en stock por devoluciones

## Traducciones (i18n)
```typescript
{
  returns: {
    title: "Devolver Consumibles",
    selectDate: "Seleccionar Fecha de Consumo",
    noConsumptions: "No hay consumos en esta fecha",
    addToCart: "Agregar al Carrito",
    confirmReturn: "Confirmar Devolución",
    returnSuccess: "Devolución procesada exitosamente",
    maxReturnable: "Máximo devolvible",
    consumed: "Consumido",
    returned: "Devuelto",
    returnable: "Disponible para devolver"
  }
}
```

## Fases de Implementación

### Fase 1: Base de Datos y API (Prioridad Alta)
- [ ] Crear migración para tabla `consumable_returns`
- [ ] Modificar constraint de `stock_movements`
- [ ] Implementar endpoint `GET /api/consumables/my-consumption`
- [ ] Implementar endpoint `POST /api/consumables/return`
- [ ] Implementar endpoint `GET /api/consumables/return-history`

### Fase 2: Contexto y Lógica (Prioridad Alta)
- [ ] Crear `ReturnCartContext`
- [ ] Crear utilidades de validación de devoluciones
- [ ] Implementar lógica de cálculo de cantidades devolvibles

### Fase 3: Componentes UI (Prioridad Media)
- [ ] Crear `ConsumptionDatePicker`
- [ ] Crear `ReturnableItemsList`
- [ ] Crear `ReturnCart` y `ReturnCartModal`
- [ ] Crear `ReturnButton`
- [ ] Crear `ReturnScanner`

### Fase 4: Página Principal (Prioridad Media)
- [ ] Crear página `/consumables/return`
- [ ] Integrar todos los componentes
- [ ] Implementar flujo completo

### Fase 5: Integración (Prioridad Baja)
- [ ] Agregar botón en `/scanner`
- [ ] Agregar botón en `/consumables`
- [ ] Agregar traducciones
- [ ] Testing end-to-end

### Fase 6: Reportes y Métricas (Prioridad Baja)
- [ ] Dashboard de devoluciones para admin
- [ ] Reportes de análisis de devoluciones
- [ ] Alertas automáticas

## Notas Técnicas
- Usar transacciones para garantizar consistencia entre `consumable_returns`, `consumable_stock` y `stock_movements`
- Implementar rollback automático en caso de error
- Cache de historial de consumo para mejorar performance
- Considerar límite de tiempo para devoluciones (30 días por defecto)
- Validar que el stock no esté desactivado antes de aceptar devolución

## Archivos a Crear
```
supabase/migrations/
  └── 007_add_consumable_returns.sql

src/app/consumables/return/
  └── page.tsx

src/app/api/consumables/
  ├── my-consumption/
  │   └── route.ts
  └── return/
      └── route.ts

src/contexts/
  └── ReturnCartContext.tsx

src/components/returns/
  ├── ConsumptionDatePicker.tsx
  ├── ReturnableItemsList.tsx
  ├── ReturnCart.tsx
  ├── ReturnCartModal.tsx
  ├── ReturnButton.tsx
  └── ReturnScanner.tsx

src/utils/
  └── returnValidation.ts
```

## Testing
- Unit tests para validaciones de devolución
- Integration tests para endpoints de API
- E2E tests para flujo completo de devolución
- Tests de concurrencia para actualizaciones de stock
