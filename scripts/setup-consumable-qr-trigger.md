# 🔧 Configuración del Trigger Automático para QR Codes

## 📋 Instrucciones

Para que los códigos QR se generen automáticamente al insertar consumibles, sigue estos pasos:

### Opción 1: Usando Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el siguiente SQL:

```sql
-- Function to generate QR code for consumable_stock
CREATE OR REPLACE FUNCTION generate_consumable_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if qr_code is NULL or empty
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'CONSUMABLE-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_generate_consumable_qr ON consumable_stock;
DROP TRIGGER IF EXISTS trigger_update_consumable_qr ON consumable_stock;

-- Trigger that fires BEFORE INSERT on consumable_stock
CREATE TRIGGER trigger_generate_consumable_qr
  BEFORE INSERT ON consumable_stock
  FOR EACH ROW
  EXECUTE FUNCTION generate_consumable_qr_code();

-- Trigger that fires BEFORE UPDATE on consumable_stock (only if qr_code is being set to NULL)
CREATE TRIGGER trigger_update_consumable_qr
  BEFORE UPDATE ON consumable_stock
  FOR EACH ROW
  WHEN (NEW.qr_code IS NULL OR NEW.qr_code = '')
  EXECUTE FUNCTION generate_consumable_qr_code();
```

5. Haz clic en **Run** o presiona `Ctrl+Enter`
6. Verifica que aparezca "Success. No rows returned"

### Opción 2: Usando psql (Línea de comandos)

```bash
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]" -f supabase/migrations/add_consumable_qr_trigger.sql
```

## ✅ Verificación

Para verificar que el trigger funciona:

1. Inserta un nuevo consumible sin especificar `qr_code`:

```sql
INSERT INTO consumable_stock (item_type_id, current_quantity, minimum_threshold, unit_of_measure)
VALUES (1, 10, 5, 'unidad')
RETURNING *;
```

2. Deberías ver que el campo `qr_code` se generó automáticamente con formato:
   `CONSUMABLE-{id}-{timestamp}`

## 🎯 Comportamiento

Una vez configurado, el trigger:

- ✅ Se ejecuta automáticamente en cada INSERT
- ✅ Se ejecuta en UPDATE solo si qr_code es NULL o vacío
- ✅ Genera códigos únicos usando ID + timestamp
- ✅ No sobrescribe códigos QR existentes
- ✅ Funciona sin importar cómo se inserten los datos (API, SQL directo, scripts, etc.)

## 🔄 Para Datos Existentes

Los datos que ya existen sin QR code necesitan el script de migración:

```bash
node scripts/apply-qr-migration.js
```

El trigger solo afecta nuevas inserciones y actualizaciones futuras.
