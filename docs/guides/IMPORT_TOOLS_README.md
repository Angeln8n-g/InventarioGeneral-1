# 📦 Script de Importación de Herramientas

## 📋 Descripción

Este script permite importar herramientas desde un archivo Excel (`Herramientas.xlsx`) a la base de datos de Supabase.

## 🚀 Uso

### 1. Preparar el archivo Excel

El archivo debe estar ubicado en: `supabase/Herramientas.xlsx`

#### Columnas esperadas (cualquier variación de mayúsculas/minúsculas):
- **Nombre** / nombre / NOMBRE / Herramienta
- **Descripción** / descripcion / DESCRIPCIÓN / Descripcion
- **Categoría** / categoria / CATEGORÍA / Categoria
- **Código QR** / codigo_qr / QR / Codigo QR (opcional)
- **Número de Serie** / numero_serie / SERIE / Serie (opcional)
- **Estado** / estado / ESTADO (opcional, por defecto: "available")

#### Ejemplo de estructura:

| Nombre | Descripción | Categoría | Código QR | Número de Serie | Estado |
|--------|-------------|-----------|-----------|-----------------|--------|
| Taladro Eléctrico | Taladro de 500W | Herramientas Eléctricas | QR001 | SN001 | available |
| Martillo | Martillo de carpintero | Herramientas Manuales | QR002 | SN002 | available |
| Destornillador | Set de destornilladores | Herramientas Manuales | | | available |

### 2. Configurar variables de entorno

Asegúrate de tener configurado el archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Instalar dependencias

```bash
npm install xlsx
```

### 4. Ejecutar el script

```bash
node scripts/import-tools.js
```

## 📊 Funcionamiento

### Proceso de Importación

1. **Lectura del Excel**: Lee el archivo y extrae los datos
2. **Agrupación**: Agrupa herramientas por nombre (mismo nombre = mismo tipo)
3. **Creación de Item Types**: Crea un tipo de herramienta por cada nombre único
4. **Creación de Instancias**: Crea instancias individuales para cada herramienta

### Ejemplo de Agrupación

Si tienes en el Excel:
```
Taladro Eléctrico - QR001 - SN001
Taladro Eléctrico - QR002 - SN002
Martillo - QR003 - SN003
```

El script creará:
- 1 Item Type: "Taladro Eléctrico" (con 2 instancias)
- 1 Item Type: "Martillo" (con 1 instancia)

## 🔧 Características

### Generación Automática

Si no se proporcionan códigos QR o números de serie, el script los genera automáticamente:
- **Código QR**: `QR-{timestamp}-{random}`
- **Número de Serie**: `SN-{timestamp}-{random}`

### Estados Válidos

El script mapea automáticamente los estados del Excel a los estados válidos de la base de datos:

- `available` / `disponible` - Disponible para préstamo
- `loaned` / `prestado` - Prestado actualmente
- `out-of-service` / `mantenimiento` - Fuera de servicio / En mantenimiento
- `lost` / `perdido` - Perdido
- `damaged` / `dañado` - Dañado

**Nota**: Si el estado no coincide con ninguno de estos, se usará `available` por defecto.

### Manejo de Errores

El script continúa la importación aunque encuentre errores, mostrando un resumen al final con:
- ✅ Herramientas importadas exitosamente
- ❌ Errores encontrados
- 📦 Tipos de herramientas creados

## 📝 Salida del Script

```
🔧 Script de Importación de Herramientas
============================================================
📁 Archivo: supabase/Herramientas.xlsx
🌐 Supabase URL: https://tu-proyecto.supabase.co
============================================================

📖 Leyendo archivo Excel...
✅ Se encontraron 10 registros en el Excel
📄 Hoja: Hoja1
📋 Columnas encontradas: Nombre, Descripción, Categoría

📋 Preview de los primeros 3 registros:

1. Taladro Eléctrico
   Descripción: Taladro de 500W
   Categoría: Herramientas Eléctricas
   Código QR: QR001
   Número de Serie: SN001
   Estado: available

🚀 Iniciando importación de herramientas...

📦 Se encontraron 5 tipos de herramientas diferentes

📝 Procesando: Taladro Eléctrico
   ✅ Item type creado (ID: 1)
   ✅ Instancia 1/2 creada
   ✅ Instancia 2/2 creada

============================================================
📊 RESUMEN DE IMPORTACIÓN
============================================================
✅ Herramientas importadas exitosamente: 10
❌ Errores: 0
📦 Tipos de herramientas creados: 5
============================================================

✅ Importación completada!
```

## ⚠️ Notas Importantes

1. **Backup**: Haz un backup de tu base de datos antes de ejecutar el script
2. **Duplicados**: El script NO verifica duplicados, creará nuevos registros cada vez
3. **Service Role Key**: Necesitas el Service Role Key (no el anon key) para crear registros
4. **Tiempo de espera**: El script espera 5 segundos antes de iniciar para que puedas cancelar

## 🐛 Solución de Problemas

### Error: "Archivo no encontrado"
- Verifica que el archivo esté en `supabase/Herramientas.xlsx`
- Verifica que el nombre del archivo sea exacto (mayúsculas/minúsculas)

### Error: "Faltan variables de entorno"
- Verifica que `.env.local` exista
- Verifica que contenga `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Error creando item_type"
- Verifica que el Service Role Key sea correcto
- Verifica que las tablas existan en Supabase
- Verifica los permisos de la base de datos

### No se importan todas las herramientas
- Verifica que las filas tengan al menos el campo "Nombre"
- Verifica que no haya filas vacías en el Excel

## 📚 Estructura de Base de Datos

### Tabla: item_types
```sql
- id (int, primary key)
- name (text)
- description (text)
- category (text)
- is_tool (boolean)
- can_be_loaned (boolean)
```

### Tabla: tool_instances
```sql
- id (int, primary key)
- item_type_id (int, foreign key)
- qr_code (text, unique)
- serial_number (text)
- status (text)
- can_be_loaned (boolean)
```

## 🎯 Próximos Pasos

Después de importar las herramientas:

1. Verifica los datos en Supabase
2. Genera códigos QR para las herramientas (si es necesario)
3. Imprime etiquetas con los códigos QR
4. Asigna las herramientas a ubicaciones físicas

---

**¿Necesitas ayuda?** Revisa los logs del script para más detalles sobre errores específicos.
