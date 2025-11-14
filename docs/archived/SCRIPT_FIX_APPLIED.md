# 🔧 Corrección Aplicada al Script de Importación

## ❌ Problema Encontrado

```
Error: Could not find the 'can_be_loaned' column of 'item_types' in the schema cache
```

## 🔍 Causa

El script intentaba insertar columnas que no existen en el esquema real de la base de datos:
- `is_tool` (no existe en `item_types`)
- `can_be_loaned` (no existe en `item_types` ni en `tool_instances`)

## ✅ Solución Aplicada

### Cambios en `createItemType()`

**Antes:**
```javascript
body: JSON.stringify({
  name: nombre,
  description: descripcion,
  category: categoria,
  is_tool: true,           // ❌ No existe
  can_be_loaned: true      // ❌ No existe
})
```

**Después:**
```javascript
body: JSON.stringify({
  name: nombre,
  description: descripcion,
  category: categoria,
  is_consumable: false,              // ✅ Existe
  default_loan_duration_days: 7      // ✅ Existe
})
```

### Cambios en `createToolInstance()`

**Antes:**
```javascript
body: JSON.stringify({
  item_type_id: itemTypeId,
  qr_code: qrCode,
  serial_number: serialNumber,
  status: estado || 'available',
  can_be_loaned: true      // ❌ No existe
})
```

**Después:**
```javascript
body: JSON.stringify({
  item_type_id: itemTypeId,
  qr_code: qrCode,
  serial_number: serialNumber,
  status: mappedStatus     // ✅ Con mapeo de estados
})
```

### Mapeo de Estados Agregado

Se agregó un mapeo automático de estados para soportar nombres en español e inglés:

```javascript
const statusMap = {
  'disponible': 'available',
  'available': 'available',
  'prestado': 'loaned',
  'loaned': 'loaned',
  'mantenimiento': 'out-of-service',
  'out-of-service': 'out-of-service',
  'perdido': 'lost',
  'lost': 'lost',
  'dañado': 'damaged',
  'damaged': 'damaged'
}
```

## 📋 Esquema Real de la Base de Datos

### Tabla: item_types
```sql
CREATE TABLE item_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  is_consumable BOOLEAN DEFAULT FALSE,
  default_loan_duration_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: tool_instances
```sql
CREATE TABLE tool_instances (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id),
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  serial_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'available' 
    CHECK (status IN ('available', 'loaned', 'out-of-service', 'lost', 'damaged')),
  condition_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);
```

## 🎯 Estados Válidos

| Estado en Excel | Estado en BD | Descripción |
|----------------|--------------|-------------|
| disponible / available | available | Disponible para préstamo |
| prestado / loaned | loaned | Prestado actualmente |
| mantenimiento / out-of-service | out-of-service | Fuera de servicio |
| perdido / lost | lost | Perdido |
| dañado / damaged | damaged | Dañado |

**Cualquier otro valor → `available` (por defecto)**

## 📁 Archivos Corregidos

1. ✅ `scripts/import-tools.js` - Script JavaScript
2. ✅ `scripts/import-tools.ts` - Script TypeScript
3. ✅ `IMPORT_TOOLS_README.md` - Documentación actualizada

## 🚀 Cómo Usar Ahora

El script está corregido y listo para usar:

```bash
npm run import:tools
```

### Ejemplo de Excel Válido

| Nombre | Descripción | Categoría | Código QR | Número de Serie | Estado |
|--------|-------------|-----------|-----------|-----------------|--------|
| JDSU | Medidor de fibra óptica | Equipos de Medición | QR001 | SN001 | disponible |
| Teléfono de prueba | Teléfono para pruebas | Comunicaciones | QR002 | SN002 | available |

Ambos registros se importarán correctamente ahora.

## ✅ Resultado Esperado

```
📝 Procesando: JDSU
   ✅ Item type creado (ID: 1)
   ✅ Instancia 1/1 creada

📝 Procesando: Teléfono de prueba
   ✅ Item type creado (ID: 2)
   ✅ Instancia 1/1 creada

============================================================
📊 RESUMEN DE IMPORTACIÓN
============================================================
✅ Herramientas importadas exitosamente: 2
❌ Errores: 0
📦 Tipos de herramientas creados: 2
============================================================
```

## 🎉 ¡Listo!

El script ahora funciona correctamente con el esquema real de tu base de datos.

---

**Fecha de corrección**: Octubre 2025  
**Estado**: ✅ Corregido y probado
