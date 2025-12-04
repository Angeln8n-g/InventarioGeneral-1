# Solución: Error "column stock_movements.start_marker does not exist"

## Problema

El error ocurre porque la migración `015_add_cable_markers.sql` no se ha aplicado a la base de datos. Esta migración agrega las columnas necesarias para el seguimiento de cables con marcadores:

- `stock_movements.start_marker`
- `stock_movements.end_marker`
- `consumable_returns.segment_start`
- `consumable_returns.segment_end`

## Solución

Tienes 3 opciones para aplicar la migración:

### Opción 1: Usar el script de Node.js (Recomendado)

```powershell
node apply-cable-markers-migration.js
```

O usando el script de PowerShell:

```powershell
.\apply-cable-markers.ps1
```

### Opción 2: Aplicar manualmente en Supabase SQL Editor

1. Ve al SQL Editor de Supabase:
   - Abre tu proyecto en https://app.supabase.com
   - Ve a la sección "SQL Editor"

2. Copia el contenido completo del archivo:
   ```
   supabase/migrations/015_add_cable_markers.sql
   ```

3. Pega el SQL en el editor y haz clic en "Run"

4. Verifica que se ejecutó correctamente viendo el mensaje de éxito

### Opción 3: Usar Supabase CLI (si lo tienes instalado)

```bash
supabase db push
```

O aplicar la migración específica:

```bash
supabase migration up --file supabase/migrations/015_add_cable_markers.sql
```

## Verificación

Después de aplicar la migración, verifica que las columnas existen ejecutando este SQL en Supabase:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stock_movements' 
AND column_name IN ('start_marker', 'end_marker');
```

Deberías ver 2 filas con las columnas `start_marker` y `end_marker`.

## Qué hace la migración

La migración `015_add_cable_markers.sql`:

1. Agrega columnas de marcadores a `stock_movements`:
   - `start_marker DECIMAL(10, 2)` - Marcador inicial del cable
   - `end_marker DECIMAL(10, 2)` - Marcador final del cable

2. Agrega columnas de segmento a `consumable_returns`:
   - `segment_start DECIMAL(10, 2)` - Inicio del segmento devuelto
   - `segment_end DECIMAL(10, 2)` - Fin del segmento devuelto

3. Crea índices para mejorar el rendimiento de las consultas

4. Agrega restricciones de validación para asegurar que:
   - Los marcadores sean ambos NULL o ambos no-NULL
   - El marcador final sea mayor que el inicial

5. Crea vistas y funciones auxiliares para facilitar las consultas

## Después de aplicar la migración

Una vez aplicada la migración, el endpoint `/api/consumables/my-consumption` funcionará correctamente y podrás:

- Consumir cables especificando marcadores de inicio y fin
- Ver el historial de consumo con información de marcadores
- Devolver segmentos específicos de cable
- Detectar solapamientos en devoluciones de cable

## Notas importantes

- Esta migración es **idempotente**: puedes ejecutarla múltiples veces sin problemas
- Las columnas de marcadores son **opcionales**: los registros antiguos tendrán NULL
- Solo los consumos de tipo cable necesitan marcadores
- Los consumos regulares (sin marcadores) seguirán funcionando normalmente
