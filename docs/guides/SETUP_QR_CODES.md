# Configuración de Códigos QR para Consumibles

## Problema

Los códigos QR no se muestran en la página de detalles de consumibles porque falta la columna `qr_code` en la tabla `consumable_stock`.

## Solución

### Paso 1: Agregar la columna en Supabase

1. Ve a tu panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Crea una nueva query y pega este código:

```sql
-- Agregar columna qr_code a la tabla consumable_stock
ALTER TABLE consumable_stock ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_consumable_stock_qr_code ON consumable_stock(qr_code);
```

5. Haz clic en **Run** para ejecutar el SQL

### Paso 2: Generar códigos QR únicos

Después de ejecutar el SQL en Supabase, ejecuta este comando en tu terminal:

```bash
node scripts/generate-consumable-qr.js
```

Este script:

- Generará códigos QR únicos para todos los consumibles existentes
- Formato: `CONSUMABLE-{ID}-{TIMESTAMP}`
- Mostrará un resumen de los registros actualizados

### Paso 3: Verificar

1. Recarga tu aplicación
2. Ve a **Admin → Manage Consumables**
3. Haz clic en cualquier consumible
4. Deberías ver el código QR en el panel derecho

## Archivos Creados

- `scripts/add-qr-column.sql` - SQL para agregar la columna
- `scripts/generate-consumable-qr.js` - Script para generar QR codes
- `scripts/check-consumables-qr.js` - Script para verificar QR codes

## Notas

- Cada código QR es único y permanente
- Los códigos QR se pueden escanear para consumir materiales
- Los códigos QR se pueden descargar e imprimir desde la página de detalles
