# Cómo Aplicar las Migraciones de Electronic Devices

## Opción 1: Usando Supabase CLI (Recomendado)

Si tienes Supabase CLI instalado:

```bash
# Aplicar todas las migraciones pendientes
supabase db push

# O aplicar una migración específica
supabase db push --file supabase/migrations/008_add_electronic_devices.sql
supabase db push --file supabase/migrations/009_seed_electronic_devices.sql
```

## Opción 2: Usando el Dashboard de Supabase

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido de cada archivo de migración en orden:

### Paso 1: Crear la tabla electronic_devices
Copia y ejecuta: `supabase/migrations/008_add_electronic_devices.sql`

### Paso 2: Agregar datos de prueba
Copia y ejecuta: `supabase/migrations/009_seed_electronic_devices.sql`

## Verificar que las migraciones se aplicaron correctamente

Después de aplicar las migraciones, verifica en el SQL Editor:

```sql
-- Verificar que la tabla existe
SELECT COUNT(*) FROM electronic_devices;

-- Ver los dispositivos de prueba
SELECT 
  ed.*,
  ti.qr_code,
  ti.serial_number,
  ti.status,
  it.name as device_name,
  it.category
FROM electronic_devices ed
JOIN tool_instances ti ON ed.tool_instance_id = ti.id
JOIN item_types it ON ti.item_type_id = it.id;
```

Deberías ver 5 dispositivos electrónicos:
1. MacBook Pro 14" (Apple)
2. iPad Pro 11" (Apple)
3. iPhone 13 (Apple)
4. Dell Latitude 5420 (Dell)
5. Samsung Galaxy Tab S8 (Samsung)

## Rollback (Deshacer)

Si necesitas eliminar los datos de prueba:

```sql
-- Ejecuta el contenido de:
-- supabase/migrations/009_seed_electronic_devices_rollback.sql
```

Si necesitas eliminar la tabla completa:

```sql
-- Ejecuta el contenido de:
-- supabase/migrations/008_add_electronic_devices_rollback.sql
```

## Probar en la Aplicación

Después de aplicar las migraciones:

1. Ve a `/admin/test-connection`
2. Haz clic en **"Test Database"**
   - `electronic_devices_table.count` debería ser **5**
3. Haz clic en **"Test Electronics API"**
   - Debería retornar los 5 dispositivos
4. Ve a `/admin/electronics`
   - Deberías ver los 5 dispositivos en la lista

## Troubleshooting

### Error: "relation electronic_devices does not exist"
- Ejecuta primero la migración 008 (crear tabla)
- Luego ejecuta la migración 009 (datos de prueba)

### Error: "duplicate key value violates unique constraint"
- Los datos de prueba ya existen
- Ejecuta el rollback primero, luego vuelve a aplicar

### Error: "permission denied"
- Verifica que tu usuario tenga permisos de admin en Supabase
- Verifica que estés conectado al proyecto correcto
