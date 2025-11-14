# Funcionalidad de Importación Masiva de Herramientas

## ✅ Resumen

Se ha implementado la funcionalidad de importación masiva de herramientas que permite a los administradores cargar múltiples herramientas desde un archivo Excel de forma rápida y eficiente.

## 🎯 Características Principales

### 1. **Importación desde Excel**
- Soporte para archivos .xlsx, .xls y .csv
- Plantilla descargable con ejemplos
- Validación de datos en tiempo real
- Procesamiento por lotes

### 2. **Creación Automática**
- Crea tipos de items automáticamente si no existen
- Genera múltiples instancias de herramientas por fila
- Genera códigos QR únicos automáticamente
- Opción de prefijo personalizado para QR codes

### 3. **Validaciones Robustas**
- Validación de campos requeridos
- Validación de tipos de datos
- Validación de estados válidos
- Límite de 100 items por importación

### 4. **Feedback Detallado**
- Resumen de importación (total, éxitos, errores)
- Resultados detallados por fila
- Mensajes de error descriptivos
- Indicadores visuales de éxito/error

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/components/admin/BulkImportTools.tsx`**
   - Componente de interfaz para importación masiva
   - Modal con drag & drop
   - Descarga de plantilla
   - Visualización de resultados

2. **`src/app/api/admin/tools/bulk-import/route.ts`**
   - Endpoint POST para procesar importaciones
   - Validación de datos
   - Creación de item types y tool instances
   - Registro de auditoría

### Archivos Modificados

3. **`src/app/admin/tools/new/page.tsx`**
   - Agregado botón "Bulk Import"
   - Integración del componente BulkImportTools
   - Redirección automática después de importación exitosa

4. **`src/app/admin/tools/page.tsx`**
   - Agregado botón "Bulk Import" en el header
   - Integración del componente BulkImportTools
   - Actualización automática de la lista después de importación

## 📋 Formato de Plantilla Excel

### Columnas Requeridas
- **name** (requerido): Nombre de la herramienta
- **category** (requerido): Categoría de la herramienta
- **quantity** (requerido): Cantidad de instancias a crear (1-100)

### Columnas Opcionales
- **description**: Descripción detallada
- **status**: Estado inicial (available, loaned, damaged, out-of-service, lost)
- **qr_code_prefix**: Prefijo para códigos QR (si está vacío, se generan automáticamente)

### Ejemplo de Plantilla

| name | description | category | quantity | status | qr_code_prefix |
|------|-------------|----------|----------|--------|----------------|
| Laptop Dell Latitude | Educational laptop for classroom use | Electronics | 5 | available | LAPTOP |
| Projector Epson | HD projector for presentations | Electronics | 3 | available | PROJ |
| Power Drill | Cordless power drill | Power Tools | 10 | available | |

## 🔄 Flujo de Uso

### Paso 1: Acceder a la Funcionalidad
**Opción A - Desde la página de lista de herramientas:**
1. Navegar a `/admin/tools`
2. Hacer clic en el botón "Bulk Import" en el header

**Opción B - Desde la página de crear nueva herramienta:**
1. Navegar a `/admin/tools/new`
2. Hacer clic en el botón "Bulk Import"

### Paso 2: Descargar Plantilla
1. En el modal, hacer clic en "Download Template"
2. Se descarga un archivo Excel con ejemplos

### Paso 3: Llenar la Plantilla
1. Abrir el archivo en Excel
2. Llenar los datos de las herramientas
3. Asegurarse de incluir los campos requeridos
4. Guardar el archivo

### Paso 4: Importar
1. Arrastrar el archivo al área de carga o hacer clic para seleccionar
2. Hacer clic en "Import"
3. Esperar el procesamiento

### Paso 5: Revisar Resultados
1. Ver el resumen de importación
2. Revisar los resultados detallados
3. Corregir errores si es necesario
4. Hacer clic en "Done" para cerrar

## 🔍 Validaciones Implementadas

### Validaciones de Archivo
- ✅ Tipo de archivo válido (.xlsx, .xls, .csv)
- ✅ Archivo no vacío
- ✅ Máximo 100 items por importación

### Validaciones de Datos
- ✅ Nombre requerido y no vacío
- ✅ Categoría requerida y no vacía
- ✅ Cantidad entre 1 y 100
- ✅ Estado válido (available, loaned, damaged, out-of-service, lost)
- ✅ Formato de datos correcto

### Validaciones de Negocio
- ✅ Verificación de tipos de items existentes
- ✅ Generación de códigos QR únicos
- ✅ Prevención de duplicados

## 📊 Procesamiento

### Lógica de Creación

1. **Por cada fila del Excel:**
   - Validar campos requeridos
   - Verificar si el tipo de item ya existe
   - Si no existe, crear nuevo tipo de item
   - Crear N instancias de herramientas (según quantity)
   - Generar códigos QR únicos para cada instancia
   - Registrar en audit logs

2. **Manejo de Errores:**
   - Los errores en una fila no detienen el proceso
   - Se continúa con las siguientes filas
   - Se reportan todos los errores al final

3. **Resultados:**
   - Resumen con totales
   - Lista detallada de éxitos y errores
   - Opción de importar otro archivo

## 🔐 Seguridad

### Autenticación y Autorización
- ✅ Requiere autenticación (JWT token)
- ✅ Requiere permisos de administrador
- ✅ Validación de permisos: `ADMIN_MANAGE_TOOLS`

### Validación de Datos
- ✅ Sanitización de inputs
- ✅ Validación de tipos de datos
- ✅ Límites de cantidad
- ✅ Prevención de inyección

### Auditoría
- ✅ Registro de creación de item types
- ✅ Registro de creación de tool instances
- ✅ Registro de usuario y timestamp
- ✅ Registro de valores nuevos

## 📈 Registro de Auditoría

### Creación de Item Type
```json
{
  "user_id": 123,
  "action": "item_type_create_bulk_import",
  "entity_type": "item_type",
  "entity_id": 456,
  "new_values": {
    "name": "Laptop Dell Latitude",
    "category": "Electronics",
    "type": "tool"
  }
}
```

### Creación de Tool Instance
```json
{
  "user_id": 123,
  "action": "tool_create_bulk_import",
  "entity_type": "tool_instance",
  "entity_id": 789,
  "new_values": {
    "item_type_id": 456,
    "qr_code": "LAPTOP-1",
    "status": "available",
    "bulk_row": 2,
    "bulk_index": 1,
    "bulk_total": 5
  }
}
```

## 🎨 Interfaz de Usuario

### Modal de Importación
```
┌─────────────────────────────────────────┐
│  Bulk Import Tools              [X]     │
├─────────────────────────────────────────┤
│  📋 Instructions                        │
│  1. Download the template file          │
│  2. Fill in your tools data             │
│  3. Required: name, category, quantity  │
│  4. Upload the completed file           │
│  5. Review the results                  │
│                                         │
│  [Download Template]                    │
│                                         │
│  Upload Excel File                      │
│  ┌───────────────────────────────────┐  │
│  │     [📄]                          │  │
│  │  Drop file here or click          │  │
│  │  Supports .xlsx, .xls, .csv       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Cancel]  [Import]                     │
└─────────────────────────────────────────┘
```

### Resultados de Importación
```
┌─────────────────────────────────────────┐
│  Import Summary                         │
│  ┌─────────┬─────────┬─────────┐        │
│  │ Total   │ Success │ Errors  │        │
│  │   10    │    8    │    2    │        │
│  └─────────┴─────────┴─────────┘        │
│                                         │
│  Detailed Results                       │
│  ✓ Row 2: Laptop Dell Latitude         │
│     Successfully created 5 tools        │
│  ✓ Row 3: Projector Epson              │
│     Successfully created 3 tools        │
│  ✗ Row 4: Invalid Tool                 │
│     Name is required                    │
│                                         │
│  [Import Another File]  [Done]          │
└─────────────────────────────────────────┘
```

## 🧪 Testing Recomendado

### Casos de Prueba

#### Importación Exitosa
- [x] Importar archivo con datos válidos
- [x] Crear múltiples herramientas por fila
- [x] Usar prefijos de QR personalizados
- [x] Dejar prefijos vacíos (auto-generación)
- [x] Diferentes estados (available, damaged, etc.)

#### Validaciones
- [x] Archivo vacío (debe fallar)
- [x] Archivo con formato incorrecto (debe fallar)
- [x] Fila sin nombre (debe fallar esa fila)
- [x] Fila sin categoría (debe fallar esa fila)
- [x] Cantidad inválida (debe fallar esa fila)
- [x] Estado inválido (debe fallar esa fila)
- [x] Más de 100 items (debe fallar)

#### Funcionalidad
- [x] Tipos de items existentes (debe reutilizar)
- [x] Tipos de items nuevos (debe crear)
- [x] Códigos QR únicos (no duplicados)
- [x] Registro de auditoría
- [x] Redirección después de importación exitosa

## 🚀 Mejoras Futuras Sugeridas

1. **Validación Previa**: Validar el archivo antes de procesarlo
2. **Progreso en Tiempo Real**: Mostrar barra de progreso durante la importación
3. **Importación Incremental**: Permitir agregar más herramientas sin reemplazar
4. **Exportación**: Exportar herramientas existentes a Excel
5. **Plantillas Personalizadas**: Permitir guardar plantillas personalizadas
6. **Imágenes**: Soporte para importar imágenes de herramientas
7. **Validación de Duplicados**: Detectar herramientas duplicadas antes de importar
8. **Rollback**: Opción de deshacer importación completa

## 📝 Notas de Implementación

- Se reutiliza la lógica de `itemTypeOperations` y `toolInstanceOperations`
- Los códigos QR se generan usando `generateToolUUID()`
- Se mantiene compatibilidad con el sistema de auditoría existente
- El componente sigue el mismo patrón que `BulkImportConsumables`
- Se usa la librería `xlsx` para procesar archivos Excel
- Los iconos son de `lucide-react`

## 🔗 Dependencias

- **xlsx**: Para leer archivos Excel
- **lucide-react**: Para iconos
- **Componentes existentes**: Button, Input
- **Hooks existentes**: useRequireAdmin, useRouter
- **APIs existentes**: itemTypeOperations, toolInstanceOperations, auditLogOperations

## 📌 Configuración Requerida

### Permisos
- El usuario debe tener el permiso `ADMIN_MANAGE_TOOLS`

### Límites
- Máximo 100 items por importación
- Máximo 100 instancias por item
- Tamaño de archivo limitado por el servidor

---

**Fecha de Implementación**: Octubre 2025  
**Estado**: ✅ Completado y Probado  
**Versión**: 1.0
