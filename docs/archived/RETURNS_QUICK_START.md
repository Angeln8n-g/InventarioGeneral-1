# 🔄 Devolución de Consumibles - Guía Rápida

## 🚀 Inicio Rápido

### 1. Ejecutar Migración de Base de Datos

```bash
# Conectar a tu base de datos y ejecutar:
psql -U postgres -d tu_base_de_datos -f supabase/migrations/007_add_consumable_returns.sql
```

O si usas Supabase CLI:
```bash
supabase db push
```

### 2. Verificar Instalación

La funcionalidad está lista para usar. No requiere instalación de dependencias adicionales.

### 3. Acceder a la Funcionalidad

**Opción 1: Desde la página de Consumibles**
1. Ve a `/consumables`
2. Haz clic en el botón verde flotante con icono de reciclaje (♻️)

**Opción 2: Desde el Scanner**
1. Ve a `/scanner`
2. Selecciona la opción "Devolver Consumibles" con el icono ♻️

## 📖 Cómo Usar

### Paso 1: Seleccionar Fecha
- El sistema muestra tus consumos de los últimos 30 días
- Selecciona la fecha en que consumiste los items que deseas devolver
- Verás métricas: items consumidos, cantidad total, cantidad devolvible

### Paso 2: Seleccionar Items
- Se muestran todos los items consumidos en esa fecha
- Para cada item verás:
  - Cantidad consumida
  - Cantidad ya devuelta (si aplica)
  - Cantidad disponible para devolver
- Usa los botones rápidos (1, 5, 10) o ingresa cantidad manualmente
- Haz clic en "Agregar al Carrito"

### Paso 3: Revisar Carrito
- Haz clic en el botón flotante verde con el contador
- Revisa los items en tu carrito
- Puedes modificar cantidades o eliminar items
- El carrito se guarda automáticamente

### Paso 4: Confirmar Devolución
- Haz clic en "Confirmar Devolución"
- El sistema valida las cantidades
- Actualiza el stock automáticamente
- Recibes una notificación de confirmación

## ✅ Validaciones Automáticas

El sistema valida automáticamente:
- ✅ Solo puedes devolver lo que consumiste
- ✅ No puedes devolver más de lo disponible
- ✅ Solo consumos de los últimos 30 días
- ✅ Cantidades deben ser positivas
- ✅ Items deben existir en el sistema

## 🎯 Casos de Uso

### Caso 1: Devolución Simple
```
Usuario consumió: 10 tornillos
Usuario devuelve: 3 tornillos
Stock se incrementa: +3
```

### Caso 2: Devolución Parcial Múltiple
```
Usuario consumió: 20 tuercas
Primera devolución: 5 tuercas
Segunda devolución: 8 tuercas (máximo devolvible: 15)
```

### Caso 3: Devolución de Múltiples Items
```
Fecha: 2025-01-08
- 10 tornillos → devuelve 5
- 5 tuercas → devuelve 2
- 3 arandelas → devuelve 3
Total en carrito: 3 tipos de items
```

## 🔍 Consultas SQL Útiles

### Ver devoluciones de un usuario
```sql
SELECT 
  cr.*,
  it.name as item_name,
  u.username
FROM consumable_returns cr
JOIN item_types it ON cr.item_type_id = it.id
JOIN users u ON cr.user_id = u.id
WHERE u.username = 'nombre_usuario'
ORDER BY cr.return_date DESC;
```

### Ver historial de movimientos de un item
```sql
SELECT 
  sm.*,
  u.username,
  CASE 
    WHEN sm.movement_type = 'consumption' THEN 'Consumo'
    WHEN sm.movement_type = 'return' THEN 'Devolución'
    WHEN sm.movement_type = 'restock' THEN 'Reabastecimiento'
    ELSE sm.movement_type
  END as tipo_movimiento
FROM stock_movements sm
JOIN users u ON sm.user_id = u.id
WHERE sm.consumable_stock_id = 1
ORDER BY sm.created_at DESC;
```

### Estadísticas de devoluciones
```sql
SELECT 
  it.name,
  COUNT(cr.id) as total_devoluciones,
  SUM(cr.returned_quantity) as cantidad_total_devuelta,
  AVG(cr.returned_quantity) as promedio_por_devolucion
FROM consumable_returns cr
JOIN item_types it ON cr.item_type_id = it.id
WHERE cr.status = 'completed'
GROUP BY it.name
ORDER BY total_devoluciones DESC;
```

## 🐛 Troubleshooting

### Problema: No aparecen fechas para seleccionar
**Solución:** El usuario no tiene consumos en los últimos 30 días. Debe consumir items primero.

### Problema: No puedo devolver un item
**Posibles causas:**
1. Ya devolviste todo lo consumido
2. El consumo es de hace más de 30 días
3. El item fue consumido por otro usuario

### Problema: Error al confirmar devolución
**Verificar:**
1. Conexión a la base de datos
2. Permisos del usuario en las tablas
3. Logs del servidor para detalles del error

### Problema: El stock no se actualiza
**Verificar:**
1. La transacción se completó exitosamente
2. Revisar tabla `stock_movements` para el registro
3. Verificar que el `consumable_stock_id` es correcto

## 📊 Monitoreo

### Métricas Importantes
- Total de devoluciones por día/semana/mes
- Items más devueltos (puede indicar sobre-asignación)
- Usuarios con más devoluciones
- Tasa de devolución por tipo de item

### Queries de Monitoreo

**Devoluciones del día:**
```sql
SELECT COUNT(*) as total_devoluciones_hoy
FROM consumable_returns
WHERE DATE(return_date) = CURRENT_DATE;
```

**Top 10 items más devueltos:**
```sql
SELECT 
  it.name,
  COUNT(*) as veces_devuelto,
  SUM(cr.returned_quantity) as cantidad_total
FROM consumable_returns cr
JOIN item_types it ON cr.item_type_id = it.id
WHERE cr.status = 'completed'
GROUP BY it.name
ORDER BY veces_devuelto DESC
LIMIT 10;
```

## 🔐 Seguridad

### Permisos Requeridos
- Usuario autenticado
- Acceso a sus propios consumos
- No puede devolver consumos de otros usuarios

### Auditoría
Todas las devoluciones quedan registradas en:
- `consumable_returns`: Registro de la devolución
- `stock_movements`: Movimiento de stock
- `audit_logs`: Log de auditoría con IP y User-Agent

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Verifica la consola del navegador
3. Consulta la tabla `audit_logs` para detalles
4. Revisa este documento para soluciones comunes

## 🎉 ¡Listo!

La funcionalidad está completamente implementada y lista para usar. Los usuarios pueden comenzar a devolver consumibles inmediatamente después de ejecutar la migración de base de datos.

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025  
**Compatibilidad:** Sistema de Inventario v10.0+
