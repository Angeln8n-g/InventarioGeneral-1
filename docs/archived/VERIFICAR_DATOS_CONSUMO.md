# 🔍 Verificación de Datos de Consumo

## Queries de Verificación Rápida

### 1. Verificar que existen movimientos de consumo

```sql
SELECT COUNT(*) as total_movimientos_consumo
FROM stock_movements
WHERE movement_type = 'consumption';
```

**Resultado esperado**: Número > 0

---

### 2. Ver últimos movimientos de consumo

```sql
SELECT 
  sm.id,
  sm.consumable_stock_id,
  it.name as item_name,
  sm.quantity,
  sm.created_at,
  u.username
FROM stock_movements sm
INNER JOIN consumable_stock cs ON sm.consumable_stock_id = cs.id
INNER JOIN item_types it ON cs.item_type_id = it.id
LEFT JOIN users u ON sm.user_id = u.id
WHERE sm.movement_type = 'consumption'
ORDER BY sm.created_at DESC
LIMIT 20;
```

**Resultado esperado**: Lista de movimientos recientes

---

### 3. Consumo por item (últimos 30 días)

```sql
SELECT 
  cs.id as consumable_stock_id,
  it.name as item_name,
  it.category,
  cs.current_quantity as stock_actual,
  COALESCE(SUM(ABS(sm.quantity)), 0) as cantidad_consumida
FROM consumable_stock cs
INNER JOIN item_types it ON cs.item_type_id = it.id
LEFT JOIN stock_movements sm ON cs.id = sm.consumable_stock_id 
  AND sm.movement_type = 'consumption'
  AND sm.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY cs.id, it.name, it.category, cs.current_quantity
ORDER BY cantidad_consumida DESC;
```

**Resultado esperado**: Lista de items con su consumo

---

### 4. Verificar datos de la categoría "Supplies"

```sql
SELECT 
  cs.id,
  it.name,
  cs.current_quantity,
  cs.minimum_threshold,
  COALESCE(SUM(ABS(sm.quantity)), 0) as consumido
FROM consumable_stock cs
INNER JOIN item_types it ON cs.item_type_id = it.id
LEFT JOIN stock_movements sm ON cs.id = sm.consumable_stock_id 
  AND sm.movement_type = 'consumption'
  AND sm.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE it.category = 'Supplies'
GROUP BY cs.id, it.name, cs.current_quantity, cs.minimum_threshold
ORDER BY cs.id;
```

**Resultado esperado**:
```
id | name              | current_quantity | minimum_threshold | consumido
2  | Copy Paper        | 21               | 20                | 45
3  | Batteries         | 24               | 5                 | 32
1  | Whiteboard Markers| 38               | 10                | 18
```

---

### 5. Verificar si hay datos en el rango de fechas actual

```sql
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as movimientos,
  SUM(ABS(quantity)) as total_consumido
FROM stock_movements
WHERE movement_type = 'consumption'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

**Resultado esperado**: Lista de fechas con consumo

---

## 🚨 Diagnóstico de Problemas

### Problema 1: No hay movimientos de consumo

**Síntoma**: Query 1 retorna 0

**Solución**: Necesitas crear movimientos de consumo. Ejemplo:

```sql
-- Insertar movimiento de consumo de prueba
INSERT INTO stock_movements (
  consumable_stock_id,
  user_id,
  quantity,
  movement_type,
  notes,
  created_at
) VALUES (
  2,  -- ID del consumable_stock (Copy Paper)
  1,  -- ID del usuario
  -10,  -- Cantidad negativa = consumo
  'consumption',
  'Consumo de prueba',
  NOW()
);
```

---

### Problema 2: Movimientos fuera del rango de fechas

**Síntoma**: Query 5 no muestra datos recientes

**Solución**: Los movimientos son muy antiguos. Opciones:
1. Ampliar el rango de fechas en el reporte
2. Crear movimientos nuevos para prueba

---

### Problema 3: consumable_stock_id no coincide

**Síntoma**: Query 3 muestra 0 para todos los items

**Solución**: Verificar que los IDs coinciden:

```sql
-- Verificar IDs de consumable_stock
SELECT id, item_type_id FROM consumable_stock ORDER BY id;

-- Verificar IDs en stock_movements
SELECT DISTINCT consumable_stock_id 
FROM stock_movements 
WHERE movement_type = 'consumption';
```

---

## 🧪 Crear Datos de Prueba

Si no hay datos, puedes crear algunos para probar:

```sql
-- Consumo de Copy Paper (ID 2)
INSERT INTO stock_movements (consumable_stock_id, user_id, quantity, movement_type, notes, created_at)
VALUES (2, 1, -10, 'consumption', 'Prueba 1', NOW() - INTERVAL '5 days');

INSERT INTO stock_movements (consumable_stock_id, user_id, quantity, movement_type, notes, created_at)
VALUES (2, 2, -15, 'consumption', 'Prueba 2', NOW() - INTERVAL '3 days');

INSERT INTO stock_movements (consumable_stock_id, user_id, quantity, movement_type, notes, created_at)
VALUES (2, 1, -20, 'consumption', 'Prueba 3', NOW() - INTERVAL '1 day');

-- Consumo de Batteries (ID 3)
INSERT INTO stock_movements (consumable_stock_id, user_id, quantity, movement_type, notes, created_at)
VALUES (3, 2, -12, 'consumption', 'Prueba 4', NOW() - INTERVAL '4 days');

INSERT INTO stock_movements (consumable_stock_id, user_id, quantity, movement_type, notes, created_at)
VALUES (3, 1, -20, 'consumption', 'Prueba 5', NOW() - INTERVAL '2 days');

-- Consumo de Whiteboard Markers (ID 1)
INSERT INTO stock_movements (consumable_stock_id, user_id, quantity, movement_type, notes, created_at)
VALUES (1, 1, -8, 'consumption', 'Prueba 6', NOW() - INTERVAL '6 days');

INSERT INTO stock_movements (consumable_stock_id, user_id, quantity, movement_type, notes, created_at)
VALUES (1, 2, -10, 'consumption', 'Prueba 7', NOW() - INTERVAL '1 day');
```

**Resultado esperado después de insertar**:
- Copy Paper: 45 consumido (10 + 15 + 20)
- Batteries: 32 consumido (12 + 20)
- Whiteboard Markers: 18 consumido (8 + 10)

---

## ✅ Checklist de Verificación

- [✅] Query 1: Hay movimientos de consumo
- [✅] Query 2: Se ven movimientos recientes
- [✅] Query 3: Items muestran consumo > 0
- [✅] Query 4: Categoría específica muestra datos
- [✅] Query 5: Hay datos en últimos 30 días
- [✅] Frontend: Columna muestra valores correctos

---

## 🎯 Resultado Esperado en Frontend

Después de verificar los datos, al abrir el reporte deberías ver:

```
Detalle de Supplies

ID | NOMBRE              | STOCK ACTUAL | CANTIDAD CONSUMIDA | STOCK MÍNIMO | UNIDAD | ESTADO
2  | Copy Paper          | 21           | 45                 | 20           | sheets | Adecuado
3  | Batteries           | 24           | 32                 | 5            | pieces | Adecuado
1  | Whiteboard Markers  | 38           | 18                 | 10           | pieces | Adecuado
```

---

## 📞 Ayuda Adicional

Si después de ejecutar estas queries los datos aún no aparecen:

1. **Verificar logs del servidor**
   ```
   Buscar errores en la consola del servidor
   ```

2. **Verificar permisos de base de datos**
   ```sql
   -- Verificar que el usuario tiene permisos
   SELECT * FROM stock_movements LIMIT 1;
   ```

3. **Verificar que la API está funcionando**
   ```
   Abrir DevTools → Network → Ver request a /api/admin/reports/consumables
   Verificar que la respuesta incluye userConsumption con datos
   ```

4. **Limpiar caché del navegador**
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

---

**Última actualización**: 11 de Octubre, 2025
