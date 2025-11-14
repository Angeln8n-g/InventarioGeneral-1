# Configuración de Tabla Stock Movements

## Problema
La tabla `stock_movements` no existe en la base de datos, lo que causa un error 500 al intentar ver el historial de consumibles en "My Loans".

## Solución

### Paso 1: Crear la tabla en Supabase

1. Ve a tu panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Crea una nueva query y pega este código:

```sql
-- Create stock_movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  consumable_stock_id INTEGER REFERENCES consumable_stock(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('consumption', 'adjustment', 'restock', 'loss', 'damage')),
  quantity INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_consumable ON stock_movements(consumable_stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
```

5. Haz clic en **Run** para ejecutar el SQL

### Paso 2: Verificar la creación

Ejecuta este comando en tu terminal:

```bash
node scripts/create-stock-movements-table.js
```

Deberías ver:
```
✅ Table stock_movements already exists
ℹ️  Table is empty (no movements recorded yet)
```

### Paso 3: Probar la funcionalidad

1. Recarga tu aplicación
2. Ve a **Scanner → Scan Supplies**
3. Escanea un código QR de consumible
4. Registra un consumo
5. Ve a **My Loans → Consumables**
6. Deberías ver el consumo registrado

## Estructura de la Tabla

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único del movimiento |
| `consumable_stock_id` | INTEGER | Referencia al consumible |
| `movement_type` | VARCHAR(20) | Tipo de movimiento (consumption, adjustment, restock, loss, damage) |
| `quantity` | INTEGER | Cantidad del movimiento |
| `user_id` | INTEGER | Usuario que realizó el movimiento |
| `notes` | TEXT | Notas adicionales |
| `created_at` | TIMESTAMP | Fecha y hora del movimiento |

### Tipos de Movimiento

- **consumption**: Consumo normal de material
- **adjustment**: Ajuste manual de inventario
- **restock**: Reabastecimiento de stock
- **loss**: Pérdida de material
- **damage**: Material dañado

## Relaciones

```
stock_movements
├── consumable_stock_id → consumable_stock(id)
│   └── item_type_id → item_types(id)
└── user_id → users(id)
```

## Índices

Para optimizar las consultas, se crean índices en:
- `consumable_stock_id` - Búsquedas por consumible
- `user_id` - Búsquedas por usuario
- `created_at` - Ordenamiento por fecha
- `movement_type` - Filtrado por tipo

## API Endpoints que Usan Esta Tabla

### GET `/api/consumables/my-consumption`
Obtiene el historial de consumos del usuario autenticado.

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "quantity": 2,
      "notes": "Consumed via QR scanner",
      "created_at": "2025-10-03T10:30:00Z",
      "consumable_stock": {
        "id": 3,
        "unit_of_measure": "pieces",
        "item_type": {
          "name": "Batteries",
          "description": "AA batteries for devices",
          "category": "Supplies"
        }
      }
    }
  ]
}
```

### POST `/api/consumables/consume`
Registra un consumo y crea un registro en `stock_movements`.

**Request:**
```json
{
  "qr_code": "CONSUMABLE-3-1759476347918",
  "quantity": 2,
  "notes": "Used for classroom devices"
}
```

## Troubleshooting

### Error: "Could not find the table 'public.stock_movements'"
- La tabla no existe en la base de datos
- Ejecuta el SQL del Paso 1

### Error: "column 'item_type_id' does not exist"
- Estás usando una versión antigua de la migración
- Ejecuta el SQL actualizado del Paso 1

### No aparecen consumos en "My Loans → Consumables"
- Verifica que la tabla existe: `node scripts/create-stock-movements-table.js`
- Verifica que has escaneado y consumido algún item
- Revisa la consola del navegador para errores

## Archivos Relacionados

- `supabase/migrations/006_add_stock_movements.sql` - Migración SQL
- `scripts/create-stock-movements-table.js` - Script de verificación
- `src/app/api/consumables/my-consumption/route.ts` - API de historial
- `src/app/api/consumables/consume/route.ts` - API de consumo
- `src/app/my-loans/page.tsx` - Página que muestra el historial
