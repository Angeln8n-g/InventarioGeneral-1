# 🔧 Corrección: Error "scanner.invalidQR"

## 🐛 Problema Identificado

Las herramientas importadas recientemente usando el script `import-tools.ts` generaban códigos QR con el formato:

```
QR-{timestamp}-{random}
Ejemplo: QR-1759476348176-abc123xyz
```

Sin embargo, el sistema validaba **únicamente** códigos QR en formato UUID estándar:

```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Ejemplo: 360b6d9f-9fd1-4fe0-a096-51bec0c89684
```

Esto causaba que al escanear herramientas recientes, el sistema mostrara el error:

```
Error: scanner.invalidQR
```

## ✅ Solución Aplicada

Se modificó la función `isValidUUID()` en `src/lib/supabase-client.ts` para aceptar **ambos formatos**:

### Antes:

```typescript
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
```

### Después:

```typescript
export const isValidUUID = (uuid: string): boolean => {
  // Standard UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Custom QR code format: QR-{timestamp}-{random}, SN-{timestamp}-{random}, or CONSUMABLE-{id}-{timestamp}
  const customQRRegex = /^(QR|SN|CONSUMABLE)-\d+-[a-z0-9]+$/i;

  return uuidRegex.test(uuid) || customQRRegex.test(uuid);
};
```

## 📋 Formatos Aceptados

Ahora el sistema acepta:

1. **UUID estándar** (herramientas antiguas):

   - `360b6d9f-9fd1-4fe0-a096-51bec0c89684`
   - `f47ac10b-58cc-4372-a567-0e02b2c3d483`

2. **Formato personalizado** (herramientas importadas):

   - `QR-1759476348176-abc123xyz`
   - `SN-1759476348176-def456uvw`

3. **Formato consumibles** (consumable_stock):
   - `CONSUMABLE-9-1760102827612`
   - `CONSUMABLE-15-1760102835292`

## 🎯 Impacto

- ✅ Las herramientas antiguas siguen funcionando normalmente
- ✅ Las herramientas nuevas ahora se pueden escanear sin errores
- ✅ Los consumibles ahora tienen códigos QR únicos
- ✅ El script de importación no necesita modificaciones
- ✅ Compatibilidad hacia atrás mantenida

## 🔄 Generación de QR Codes para Consumibles

### Generación Automática (Recomendado) ⚡

Para que los códigos QR se generen automáticamente al insertar nuevos consumibles, configura el trigger de base de datos:

**Ver instrucciones completas en:** `scripts/setup-consumable-qr-trigger.md`

**Resumen rápido:**

1. Abre el SQL Editor en Supabase Dashboard
2. Ejecuta el SQL de `supabase/migrations/add_consumable_qr_trigger.sql`
3. ¡Listo! Los nuevos consumibles tendrán QR automáticamente

### Generación Manual (Para datos existentes) 🔧

Si ya tienes datos sin códigos QR, ejecuta:

```bash
node scripts/apply-qr-migration.js
```

Este script:

- Detecta consumibles sin código QR
- Genera códigos únicos en formato `CONSUMABLE-{id}-{timestamp}`
- Actualiza la base de datos automáticamente
- Muestra un resumen de los cambios

**Resultado de la última ejecución:**

- 34 consumibles procesados
- 31 códigos QR generados
- 3 ya tenían códigos QR previos

## 🧪 Pruebas

Para verificar que funciona:

1. Escanea una herramienta antigua (UUID estándar) ✅
2. Escanea una herramienta reciente (formato QR-xxx) ✅
3. Intenta escanear un código inválido (debe mostrar error) ✅

## 📝 Archivos Modificados

- `src/lib/supabase-client.ts` - Función `isValidUUID()`

## 🔄 Próximos Pasos

Si deseas que todas las herramientas usen el mismo formato en el futuro:

**Opción A**: Modificar el script para generar UUIDs estándar
**Opción B**: Mantener el formato actual (recomendado, más legible)

El formato actual `QR-{timestamp}-{random}` tiene ventajas:

- Más legible para humanos
- Incluye timestamp para trazabilidad
- Más corto y fácil de identificar visualmente
