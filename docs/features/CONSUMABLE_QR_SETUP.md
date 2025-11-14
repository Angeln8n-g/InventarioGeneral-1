# 🏷️ Configuración de QR Codes Automáticos para Consumibles

## 🎯 Objetivo

Generar códigos QR automáticamente cuando se insertan nuevos consumibles en la base de datos.

## 🚀 Configuración Rápida

### Paso 1: Aplicar el Trigger en la Base de Datos

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y pega este SQL:

```sql
-- Function to generate QR code for consumable_stock
CREATE OR REPLACE FUNCTION generate_consumable_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'CONSUMABLE-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_generate_consumable_qr ON consumable_stock;
DROP TRIGGER IF EXISTS trigger_update_consumable_qr ON consumable_stock;

-- Trigger for INSERT
CREATE TRIGGER trigger_generate_consumable_qr
  BEFORE INSERT ON consumable_stock
  FOR EACH ROW
  EXECUTE FUNCTION generate_consumable_qr_code();

-- Trigger for UPDATE (only when qr_code is NULL)
CREATE TRIGGER trigger_update_consumable_qr
  BEFORE UPDATE ON consumable_stock
  FOR EACH ROW
  WHEN (NEW.qr_code IS NULL OR NEW.qr_code = '')
  EXECUTE FUNCTION generate_consumable_qr_code();
```

4. Haz clic en **Run**
5. ✅ ¡Listo! Ahora todos los nuevos consumibles tendrán QR automáticamente

### Paso 2: Generar QR para Datos Existentes

Si ya tienes consumibles sin códigos QR:

```bash
node scripts/apply-qr-migration.js
```

## ✅ Verificación

Prueba insertando un consumible:

```sql
INSERT INTO consumable_stock (item_type_id, current_quantity, minimum_threshold, unit_of_measure)
VALUES (1, 10, 5, 'unidad')
RETURNING *;
```

Deberías ver un `qr_code` generado automáticamente como: `CONSUMABLE-37-1760102856785`

## 📊 Formato de QR Codes

Los códigos QR de consumibles siguen el formato:

```
CONSUMABLE-{id}-{timestamp}
```

Ejemplo: `CONSUMABLE-9-1760102827612`

Donde:

- `CONSUMABLE` = Prefijo identificador
- `9` = ID del consumible
- `1760102827612` = Timestamp Unix en milisegundos

## 🔧 Archivos Relacionados

- `supabase/migrations/add_consumable_qr_trigger.sql` - SQL del trigger
- `scripts/apply-qr-migration.js` - Script para datos existentes
- `scripts/setup-consumable-qr-trigger.md` - Documentación detallada
- `src/lib/supabase-client.ts` - Validación de formatos QR

## 💡 Ventajas

- ✅ Automático: No necesitas código adicional
- ✅ Consistente: Mismo formato siempre
- ✅ Único: ID + timestamp garantizan unicidad
- ✅ Trazable: El timestamp ayuda a identificar cuándo se creó
- ✅ Universal: Funciona sin importar cómo insertes los datos (API, SQL, scripts)

## 🐛 Solución de Problemas

### El trigger no se ejecuta

Verifica que existe:

```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%consumable_qr%';
```

### Los QR no se generan

Verifica que la función existe:

```sql
SELECT proname FROM pg_proc WHERE proname = 'generate_consumable_qr_code';
```

### Recrear el trigger

Si algo falla, ejecuta nuevamente el SQL del Paso 1.
