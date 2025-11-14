# 🚀 Guía Rápida - Importación Masiva de Consumibles

## ✅ ¿Qué es?

Importa múltiples consumibles desde un archivo Excel en lugar de agregarlos uno por uno.

## 📍 ¿Dónde está?

1. Ve a **Admin → Manage Consumables**
2. Click en **"Bulk Import"** (botón con icono de upload)

## 🎯 ¿Cómo usar?

### Paso 1: Descargar Plantilla
```
Click en "Bulk Import"
↓
Click en "Download Template"
↓
Se descarga: consumables_import_template.xlsx
```

### Paso 2: Llenar Datos en Excel

**Columnas requeridas:**
- `name` ✅ (obligatorio)
- `current_quantity` ✅ (obligatorio, número ≥ 0)
- `minimum_threshold` ✅ (obligatorio, número ≥ 0)

**Columnas opcionales:**
- `description` (texto)
- `category` (texto, default: "General")
- `unit_of_measure` (texto, default: "units")

**Ejemplo:**
```
name              | description        | category        | current_quantity | minimum_threshold | unit_of_measure
Papel Bond A4     | Papel para imprimir| Office Supplies | 500              | 100               | sheets
Marcadores        | Colores variados   | Office Supplies | 50               | 10                | pieces
Pegamento         | 100ml              | Office Supplies | 30               | 5                 | bottles
```

### Paso 3: Importar Archivo

**Opción A: Drag & Drop**
```
Arrastra el archivo Excel al área de carga
↓
Verifica que aparece el nombre del archivo
↓
Click en "Import"
```

**Opción B: Click para Seleccionar**
```
Click en el área de carga
↓
Selecciona tu archivo Excel
↓
Click en "Import"
```

### Paso 4: Revisar Resultados

**Resumen:**
- Total de items procesados
- Exitosos (verde)
- Errores (rojo)

**Lista detallada:**
- ✓ Row 2: Papel Bond A4 - Created new consumable
- ✓ Row 3: Marcadores - Updated existing consumable
- ⚠️ Row 4: Item Sin Nombre - Name is required

**Si hay errores:**
1. Anota las filas con error
2. Corrige el Excel
3. Click en "Import Another File"
4. Importa nuevamente

**Si todo está bien:**
1. Click en "Done"
2. La página se refresca automáticamente
3. ¡Listo! Tus consumibles están importados

## ✨ Características

- ✅ Importa múltiples items a la vez
- ✅ Actualiza consumibles existentes
- ✅ Crea nuevos consumibles
- ✅ Validaciones automáticas
- ✅ Mensajes de error claros
- ✅ Genera QR codes automáticamente
- ✅ Registra en audit log

## 🎨 Tipos de Archivo Soportados

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.csv` (Valores separados por comas)

## ⚠️ Errores Comunes

### "Name is required"
**Problema:** Fila sin nombre
**Solución:** Agrega un nombre en la columna `name`

### "Current quantity must be a non-negative number"
**Problema:** Cantidad no es un número o es negativa
**Solución:** Usa números positivos (ej: 100, 50, 0)

### "The file is empty or has no valid data"
**Problema:** Excel vacío o sin datos
**Solución:** Agrega al menos una fila con datos

### "Please select a valid Excel file"
**Problema:** Archivo no es Excel o CSV
**Solución:** Usa archivos .xlsx, .xls o .csv

## 💡 Tips

### Actualizar Consumibles Existentes
- Si el nombre ya existe, se actualiza la cantidad
- No se crean duplicados
- Útil para actualizar stock masivamente

### Categorías
- Si no especificas categoría, se usa "General"
- Usa categorías consistentes para mejor organización
- Ejemplos: "Office Supplies", "Lab Equipment", "Cleaning"

### Unidades de Medida
- Si no especificas, se usa "units"
- Sé consistente con las unidades
- Ejemplos: "pieces", "sheets", "bottles", "boxes", "kg", "liters"

### Preparar Datos
- Usa la plantilla descargada como base
- Copia y pega desde otras fuentes
- Verifica que los números no tengan texto
- Elimina filas vacías

## 📊 Ejemplo Completo

**Situación:** Necesitas agregar 20 consumibles nuevos

**Tiempo tradicional:** 20 items × 2 min = 40 minutos

**Con importación masiva:**
1. Descargar plantilla: 10 segundos
2. Llenar Excel: 10 minutos
3. Importar: 5 segundos
4. Revisar: 1 minuto

**Total: ~11 minutos** ⚡

**Ahorro: 29 minutos (72.5%)** 🎉

---

**¿Necesitas ayuda?** Revisa `BULK_IMPORT_CONSUMABLES_FEATURE.md` para documentación completa.
