# 📋 Número de Factura Obligatorio - Implementación

## ✅ Cambios Implementados

Se ha agregado el requisito de número de factura para todas las operaciones que incrementan el stock de consumibles, con el objetivo de mantener trazabilidad completa de la procedencia del inventario.

---

## 🎯 Objetivo

**Tener constancia de la procedencia del stock entrante** para:
- ✅ Auditoría y control
- ✅ Contabilidad y finanzas
- ✅ Garantías y devoluciones
- ✅ Cumplimiento normativo
- ✅ Trazabilidad completa

---

## 📊 Campos Agregados

### 1. Actualización Individual de Stock

**Campos nuevos (condicionales):**

| Campo | Tipo | Obligatorio | Cuándo se muestra | Descripción |
|-------|------|-------------|-------------------|-------------|
| `invoice_number` | Texto | ✅ Sí | Add Stock, Adjust (+) | Número de factura o documento |
| `supplier_name` | Texto | ❌ No | Add Stock, Adjust (+) | Nombre del proveedor |
| `purchase_date` | Fecha | ❌ No | Add Stock, Adjust (+) | Fecha de compra (default: hoy) |

**Lógica de visualización:**
- **Add Stock (Restock)**: Siempre muestra los 3 campos
- **Adjust Stock (positivo)**: Muestra los 3 campos si cantidad > 0
- **Adjust Stock (negativo)**: NO muestra los campos
- **Set Stock**: NO muestra los campos (es un ajuste de inventario)

---

### 2. Importación Masiva (Excel)

**Columnas nuevas:**

| Columna | Tipo | Obligatorio | Ejemplo | Descripción |
|---------|------|-------------|---------|-------------|
| `invoice_number` | Texto | ✅ Sí | FAC-2025-001234 | Número de factura |
| `supplier_name` | Texto | ❌ No | ABC Supplies Inc. | Nombre del proveedor |
| `purchase_date` | Fecha | ❌ No | 2025-10-06 | Fecha de compra |

**Plantilla actualizada:**
```
name | description | category | current_quantity | minimum_threshold | unit_of_measure | invoice_number | supplier_name | purchase_date
```

---

## 🔍 Validaciones Implementadas

### Frontend (Modal de Actualización)

```typescript
// Validación antes de enviar
const isStockIncrease = 
  updateAction === 'restock' || 
  (updateAction === 'adjust_stock' && quantity > 0)

if (isStockIncrease && !invoiceNumber.trim()) {
  setUpdateError('Invoice number is required when adding stock')
  return
}
```

### Backend (API Endpoint)

**Para Restock:**
```typescript
if (!invoice_number) {
  return NextResponse.json({
    error: {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invoice number is required for restocking',
    }
  }, { status: 400 })
}
```

**Para Adjust Stock (positivo):**
```typescript
if (quantity > 0 && !invoice_number) {
  return NextResponse.json({
    error: {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invoice number is required when adding stock',
    }
  }, { status: 400 })
}
```

**Para Bulk Import:**
```typescript
if (item.current_quantity > 0 && 
    (!item.invoice_number || item.invoice_number.trim() === '')) {
  results.push({
    success: false,
    message: 'Invoice number is required when adding stock',
  })
  continue
}
```

---

## 🎨 Interfaz de Usuario

### Modal de Actualización (Add Stock)

```
┌────────────────────────────────────────────┐
│ Add Stock                             ✕    │
├────────────────────────────────────────────┤
│ Current Stock: 45 units                    │
│                                            │
│ Amount to Add *                            │
│ ┌──────────────────────────────────────┐  │
│ │ 50                                   │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Invoice Number *                           │
│ ┌──────────────────────────────────────┐  │
│ │ FAC-2025-001234                      │  │
│ └──────────────────────────────────────┘  │
│ Required for tracking stock origin        │
│                                            │
│ Supplier Name (Optional)                   │
│ ┌──────────────────────────────────────┐  │
│ │ ABC Supplies Inc.                    │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Purchase Date (Optional)                   │
│ ┌──────────────────────────────────────┐  │
│ │ 2025-10-06                       📅  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Notes (Optional)                           │
│ ┌──────────────────────────────────────┐  │
│ │ Received in good condition           │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Preview: New stock will be 95 units        │
│                                            │
│ [Cancel]  [Update Stock]                  │
└────────────────────────────────────────────┘
```

### Modal de Importación Masiva

```
┌────────────────────────────────────────────┐
│ Bulk Import Consumables              ✕    │
├────────────────────────────────────────────┤
│ 📋 Instructions                            │
│ 1. Download the template file below        │
│ 2. Fill in your consumables data           │
│ 3. Required: name, current_quantity,       │
│    minimum_threshold, invoice_number       │
│ 4. Upload the completed file               │
│ 5. Review the results                      │
│                                            │
│ Note: Invoice number is required for       │
│ tracking stock origin and auditing.        │
├────────────────────────────────────────────┤
│ [Download Template]                        │
└────────────────────────────────────────────┘
```

---

## 📝 Audit Log

Los nuevos campos se registran en el audit log:

```json
{
  "user_id": 1,
  "action": "stock_restock",
  "entity_type": "consumable_stock",
  "entity_id": 123,
  "old_values": {
    "current_quantity": 45
  },
  "new_values": {
    "old_quantity": 45,
    "new_quantity": 95,
    "restock_amount": 50,
    "notes": "Received new shipment",
    "invoice_number": "FAC-2025-001234",
    "supplier_name": "ABC Supplies Inc.",
    "purchase_date": "2025-10-06"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-10-06T10:30:00Z"
}
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: Recibir Mercancía Nueva

```
1. Admin recibe mercancía del proveedor
   ↓
2. Tiene factura: FAC-2025-001234
   ↓
3. Va a /admin/consumables/[id]
   ↓
4. Click en "Update Stock" o "+ Add Stock"
   ↓
5. Ingresa:
   - Cantidad: 50
   - Factura: FAC-2025-001234 ✅
   - Proveedor: ABC Supplies Inc.
   - Fecha: 2025-10-06
   - Notas: "Received shipment #12345"
   ↓
6. Click en "Update Stock"
   ↓
7. ✅ Stock actualizado con trazabilidad completa
```

### Flujo 2: Importación Masiva

```
1. Admin descarga plantilla Excel
   ↓
2. Llena datos incluyendo invoice_number
   ↓
3. Ejemplo:
   name: "Papel Bond A4"
   current_quantity: 500
   invoice_number: "FAC-2025-001234" ✅
   supplier_name: "ABC Supplies"
   ↓
4. Sube archivo
   ↓
5. Sistema valida invoice_number
   ↓
6. ✅ Importación exitosa con trazabilidad
```

### Flujo 3: Ajuste Negativo (Sin Factura)

```
1. Admin encuentra 5 unidades dañadas
   ↓
2. Va a /admin/consumables/[id]
   ↓
3. Click en "± Adjust"
   ↓
4. Ingresa: -5
   ↓
5. Campos de factura NO aparecen ✅
   ↓
6. Solo ingresa notas: "Damaged units"
   ↓
7. ✅ Ajuste registrado sin requerir factura
```

---

## ⚠️ Mensajes de Error

### Error 1: Factura Faltante (Add Stock)
```
❌ Invoice number is required when adding stock
```

### Error 2: Factura Faltante (Bulk Import)
```
⚠️ Row 5: Papel Bond A4
   Invoice number is required when adding stock
```

### Error 3: Factura Vacía
```
❌ Invoice number is required for restocking
```

---

## 📊 Casos de Uso

### ✅ Casos que REQUIEREN Factura

1. **Add Stock (Restock)**
   - Siempre requiere factura
   - Es una compra nueva

2. **Adjust Stock (positivo)**
   - Requiere factura si cantidad > 0
   - Está agregando inventario

3. **Bulk Import**
   - Requiere factura para cada item
   - Es inventario nuevo

### ❌ Casos que NO REQUIEREN Factura

1. **Adjust Stock (negativo)**
   - No requiere factura
   - Es una reducción (daño, pérdida)

2. **Set Stock**
   - No requiere factura
   - Es un ajuste de inventario (conteo físico)

3. **Consumo por Usuario**
   - No requiere factura
   - Es uso normal del material

---

## 🎯 Beneficios

### Para Administración
- ✅ Trazabilidad completa del inventario
- ✅ Auditoría facilitada
- ✅ Control de compras
- ✅ Verificación de facturas

### Para Contabilidad
- ✅ Relación directa factura-inventario
- ✅ Conciliación más fácil
- ✅ Reportes más precisos
- ✅