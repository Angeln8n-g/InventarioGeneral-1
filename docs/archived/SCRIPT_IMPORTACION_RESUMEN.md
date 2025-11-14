# 🎉 Script de Importación de Herramientas - Listo!

## ✅ Archivos Creados

1. **`scripts/import-tools.js`** - Script principal de importación
2. **`IMPORT_TOOLS_README.md`** - Documentación completa
3. **Comando agregado a `package.json`**: `npm run import:tools`

## 🚀 Cómo Usar

### Paso 1: Preparar el Excel

Tu archivo ya está en: `supabase/Herramientas.xlsx`

El script detecta automáticamente las siguientes columnas (en cualquier variación):
- Nombre / nombre / NOMBRE / Herramienta
- Descripción / descripcion / DESCRIPCIÓN
- Categoría / categoria / CATEGORÍA
- Código QR / codigo_qr / QR
- Número de Serie / numero_serie / SERIE
- Estado / estado / ESTADO

### Paso 2: Verificar Variables de Entorno

Asegúrate de tener en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

⚠️ **Importante**: Necesitas el **Service Role Key**, no el anon key.

### Paso 3: Ejecutar el Script

```bash
npm run import:tools
```

O directamente:

```bash
node scripts/import-tools.js
```

## 📊 Qué Hace el Script

### 1. Lee el Excel
- Detecta automáticamente las columnas
- Filtra filas vacías
- Muestra un preview de los datos

### 2. Agrupa Herramientas
- Agrupa por nombre (herramientas con el mismo nombre = mismo tipo)
- Ejemplo:
  ```
  Taladro Eléctrico - QR001
  Taladro Eléctrico - QR002  } → 1 tipo con 2 instancias
  Martillo - QR003           } → 1 tipo con 1 instancia
  ```

### 3. Crea en Supabase
- **Item Types**: Un registro por cada tipo de herramienta único
- **Tool Instances**: Un registro por cada herramienta individual

### 4. Genera Códigos Automáticos
Si no hay código QR o número de serie en el Excel:
- Código QR: `QR-{timestamp}-{random}`
- Número de Serie: `SN-{timestamp}-{random}`

## 📋 Ejemplo de Salida

```
🔧 Script de Importación de Herramientas
============================================================
📁 Archivo: supabase/Herramientas.xlsx
🌐 Supabase URL: https://tu-proyecto.supabase.co
============================================================

📖 Leyendo archivo Excel...
✅ Se encontraron 15 registros en el Excel
📄 Hoja: Hoja1
📋 Columnas encontradas: Nombre, Descripción, Categoría

📋 Preview de los primeros 3 registros:

1. Taladro Eléctrico
   Descripción: Taladro de 500W
   Categoría: Herramientas Eléctricas
   Código QR: QR001
   Número de Serie: SN001
   Estado: available

⚠️  La importación comenzará en 5 segundos...
Presiona Ctrl+C para cancelar

🚀 Iniciando importación de herramientas...

📦 Se encontraron 8 tipos de herramientas diferentes

📝 Procesando: Taladro Eléctrico
   ✅ Item type creado (ID: 1)
   ✅ Instancia 1/2 creada
   ✅ Instancia 2/2 creada

📝 Procesando: Martillo
   ✅ Item type creado (ID: 2)
   ✅ Instancia 1/1 creada

============================================================
📊 RESUMEN DE IMPORTACIÓN
============================================================
✅ Herramientas importadas exitosamente: 15
❌ Errores: 0
📦 Tipos de herramientas creados: 8
============================================================

✅ Importación completada!
```

## 🎯 Características

### ✅ Ventajas
- Detecta automáticamente las columnas del Excel
- Genera códigos QR y números de serie si faltan
- Agrupa herramientas inteligentemente
- Muestra progreso en tiempo real
- Maneja errores sin detener la importación
- Resumen detallado al final

### 🔒 Seguridad
- Espera 5 segundos antes de importar (tiempo para cancelar)
- Valida variables de entorno
- Manejo de errores robusto
- No sobrescribe datos existentes

### 📦 Estructura Creada

#### Tabla: item_types
```
- id: 1
- name: "Taladro Eléctrico"
- description: "Taladro de 500W"
- category: "Herramientas Eléctricas"
- is_tool: true
- can_be_loaned: true
```

#### Tabla: tool_instances
```
- id: 1
- item_type_id: 1
- qr_code: "QR001"
- serial_number: "SN001"
- status: "available"
- can_be_loaned: true
```

## ⚠️ Notas Importantes

### Antes de Ejecutar
1. ✅ Haz backup de tu base de datos
2. ✅ Verifica que el Excel tenga datos válidos
3. ✅ Confirma que tienes el Service Role Key correcto
4. ✅ Prueba primero con pocos registros

### Durante la Ejecución
- El script NO verifica duplicados
- Cada ejecución crea nuevos registros
- Puedes cancelar con Ctrl+C en los primeros 5 segundos

### Después de Ejecutar
1. Verifica los datos en Supabase
2. Genera códigos QR físicos si es necesario
3. Imprime etiquetas para las herramientas
4. Actualiza el inventario físico

## 🐛 Solución de Problemas

### "Archivo no encontrado"
```bash
# Verifica la ruta
ls supabase/Herramientas.xlsx
```

### "Faltan variables de entorno"
```bash
# Verifica el archivo
cat .env.local | grep SUPABASE
```

### "Error creando item_type"
- Verifica el Service Role Key
- Verifica que las tablas existan
- Revisa los permisos en Supabase

### No se importan todas las herramientas
- Verifica que cada fila tenga "Nombre"
- Elimina filas vacías del Excel
- Revisa el formato de las columnas

## 📚 Documentación Adicional

Para más detalles, consulta: **`IMPORT_TOOLS_README.md`**

## 🎉 ¡Listo para Usar!

El script está completamente configurado y listo para importar tus herramientas.

```bash
npm run import:tools
```

---

**¿Necesitas ayuda?** Revisa los logs del script para detalles específicos sobre cualquier error.
