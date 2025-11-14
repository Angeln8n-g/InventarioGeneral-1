# Migración 011: Sistema de Verificación por QR del Almacén

## Descripción

Esta migración implementa un sistema de verificación de presencia física en el almacén mediante códigos QR. Los usuarios deben escanear uno de los códigos QR distribuidos en el almacén para confirmar la recogida de sus reservas.

## Cambios en la Base de Datos

### Nueva Tabla: `warehouse_qr_codes`

Almacena los códigos QR oficiales del almacén con sus ubicaciones.

**Campos:**
- `id`: Identificador único
- `qr_code`: Código QR único (ej: WH-QR-001-ENTRANCE)
- `location_name`: Nombre de la ubicación
- `location_description`: Descripción detallada
- `zone`: Zona del almacén (general, tools, consumables, electronics)
- `is_active`: Si el código está activo para escaneo
- `created_at`, `updated_at`: Timestamps

### Modificación: `consumable_reservations`

Se añade el campo `warehouse_qr_code_id` para registrar qué código QR fue escaneado al confirmar la recogida.

### Nueva Vista: `warehouse_qr_scan_stats`

Proporciona estadísticas de uso de cada código QR.

## Datos Iniciales

Se insertan automáticamente 5 códigos QR:

1. **WH-QR-001-ENTRANCE** - Entrada Principal
2. **WH-QR-002-TOOLS** - Zona de Herramientas
3. **WH-QR-003-CONSUMABLES** - Zona de Consumibles
4. **WH-QR-004-ELECTRONICS** - Zona de Electrónicos
5. **WH-QR-005-EXIT** - Salida del Almacén

## Aplicar la Migración

### Opción 1: Supabase Dashboard (Recomendado)

1. Ir a tu proyecto en Supabase Dashboard
2. Navegar a **SQL Editor**
3. Copiar el contenido de `011_warehouse_qr_codes.sql`
4. Pegar en el editor y ejecutar
5. Verificar que no hay errores

### Opción 2: CLI de Supabase

```bash
# Si usas Supabase CLI
supabase db push

# O aplicar manualmente
supabase db execute -f supabase/migrations/011_warehouse_qr_codes.sql
```

### Opción 3: psql (Conexión Directa)

```bash
psql -h [tu-host].supabase.co -U postgres -d postgres -f supabase/migrations/011_warehouse_qr_codes.sql
```

## Verificación

Después de aplicar la migración, verifica que todo esté correcto:

```sql
-- Verificar que la tabla existe
SELECT COUNT(*) FROM warehouse_qr_codes;
-- Debe retornar: 5

-- Ver todos los códigos QR
SELECT qr_code, location_name, zone, is_active 
FROM warehouse_qr_codes 
ORDER BY id;

-- Verificar que la columna fue añadida a reservations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consumable_reservations' 
  AND column_name = 'warehouse_qr_code_id';

-- Verificar que la vista existe
SELECT * FROM warehouse_qr_scan_stats;
```

## Rollback (Si es necesario)

Si necesitas revertir esta migración:

```sql
-- Eliminar la vista
DROP VIEW IF EXISTS warehouse_qr_scan_stats;

-- Eliminar la columna de reservations
ALTER TABLE consumable_reservations 
DROP COLUMN IF EXISTS warehouse_qr_code_id;

-- Eliminar la tabla
DROP TABLE IF EXISTS warehouse_qr_codes CASCADE;
```

## Próximos Pasos

1. **Aplicar la migración** en tu base de datos
2. **Generar los códigos QR** usando `scripts/generate-warehouse-qr-codes.html`
3. **Imprimir y plastificar** los códigos QR
4. **Instalar físicamente** los códigos en las ubicaciones indicadas
5. **Probar el sistema** escaneando un código QR desde la app

## Notas Importantes

- ⚠️ Esta migración es **compatible hacia atrás**: las reservas existentes no requieren `warehouse_qr_code_id`
- ⚠️ Solo las **nuevas confirmaciones** de recogida requerirán escanear un código QR
- ⚠️ Los códigos QR deben estar **instalados físicamente** antes de activar esta funcionalidad en producción
- ✅ Los códigos QR pueden ser **desactivados individualmente** sin eliminarlos (campo `is_active`)

## Soporte

Si encuentras problemas al aplicar esta migración:

1. Verifica que tienes permisos de administrador en la base de datos
2. Revisa los logs de error de Supabase
3. Asegúrate de que no hay conflictos con migraciones anteriores
4. Consulta la documentación completa en `docs/WAREHOUSE_QR_VERIFICATION.md`
