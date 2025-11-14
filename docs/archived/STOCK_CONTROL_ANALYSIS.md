# 📊 Análisis: Control Total de Stock de Consumibles

## 🎯 Objetivo

Implementar un sistema robusto de control de inventario que permita rastrear la procedencia y movimientos de todo el stock de consumibles.

---

## 📋 Requerimiento Inicial

**Propuesta:** Hacer obligatorio el número de factura al actualizar stock.

**Razón:** Tener constancia de la procedencia del stock entrante.

---

## 🔍 Análisis de Escenarios

### Escenario 1: Stock Entrante (Compras)
**Situación:** Se recibe mercancía de un proveedor

**Información necesaria:**
- ✅ Número de factura (obligatorio)
- ✅ Proveedor
- ✅ Fecha de compra
- ✅ Cantidad recibida
- ✅ Precio unitario (opcional pero recomendado)
- ✅ Precio total
- ✅ Notas adicionales

**Justificación:** Auditoría, contabilidad, garantías, devoluciones

---

### Escenario 2: Stock Saliente (Consumo)
**Situación:** Un usuario consume material

**Información necesaria:**
- ✅ Usuario que consume
- ✅ Cantidad consumida
- ✅ Fecha y hora
- ✅ Proyecto/actividad (opcional)
- ✅ Notas

**Justificación:** Control de uso, presupuestos por proyecto

---

### Escenario 3: Ajustes de Inventario
**Situación:** Correcciones por conteo físico, daños, pérdidas

**Tipos de ajustes:**

#### 3a. Conteo Físico
- ✅ Cantidad encontrada
- ✅ Diferencia (+ o -)
- ✅ Responsable del conteo
- ✅ Fecha del conteo
- ✅ Notas

#### 3b. Daños/Pérdidas
- ✅ Cantidad dañada/perdida
- ✅ Razón (daño, robo, vencimiento)
- ✅ Responsable (si aplica)
- ✅ Número de reporte (si aplica)
- ✅ Notas

#### 3c. Devoluciones a Proveedor
- ✅ Número de nota de crédito
- ✅ Proveedor
- ✅ Cantidad devuelta
- ✅ Razón
- ✅ Notas

---

## 💡 Sugerencias de Mejora

### Propuesta 1: Sistema de Tipos de Movimiento

Crear una tabla `stock_movement_types` con categorías:

```sql
CREATE TABLE stock_movement_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  affects_stock VARCHAR(20) NOT NULL, -- 'increase', 'decrease', 'adjust'
  requires_invoice BOOLEAN DEFAULT false,
  requires_supplier BOOLEAN DEFAULT false,
  requires_user BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

-- Ejemplos de tipos
INSERT INTO stock_movement_types (code, name, affects_stock, requires_invoice, requires_supplier) VALUES
('PURCHASE', 'Compra a Proveedor', 'increase', true, true),
('CONSUMPTION', 'Consumo por Usuario', 'decrease', false, false),
('ADJUSTMENT_UP', 'Ajuste Positivo', 'increase', false, false),
('ADJUSTMENT_DOWN', 'Ajuste Negativo', 'decrease', false, false),
('DAMAGE', 'Daño/Pérdida', 'decrease', false, false),
('RETURN_TO_SUPPLIER', 'Devolución a Proveedor', 'decrease', true, true),
('RETURN_FROM_USER', 'Devolución de Usuario', 'increase', false, false),
('TRANSFER_IN', 'Transferencia Entrante', 'increase', false, false),
('TRANSFER_OUT', 'Transferencia Saliente', 'decrease', false, false),
('INITIAL_STOCK', 'Inventario Inicial', 'increase', false, false);
```

---

### Propuesta 2: Tabla de Proveedores

```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  tax_id VARCHAR(50), -- RUC, NIT, etc.
  contact_name VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Propuesta 3: Tabla Mejorada de Movimientos de Stock

```sql
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  consumable_stock_id INTEGER NOT NULL REFERENCES consumable_stock(id),
  movement_type_id INTEGER NOT NULL REFERENCES stock_movement_types(id),
  
  -- Cantidades
  quantity DECIMAL(10,2) NOT NULL,
  previous_quantity DECIMAL(10,2) NOT NULL,
  new_quantity DECIMAL(10,2) NOT NULL,
  unit_of_measure VARCHAR(50),
  
  -- Información de compra (si aplica)
  invoice_number VARCHAR(100),
  supplier_id INTEGER REFERENCES suppliers(id),
  purchase_date DATE,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Información de usuario (si aplica)
  user_id INTEGER REFERENCES users(id),
  project_code VARCHAR(100),
  
  -- Información adicional
  reference_number VARCHAR(100), -- Número de reporte, nota de crédito, etc.
  reason VARCHAR(200),
  notes TEXT,
  
  -- Auditoría
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- Índices
CREATE INDEX idx_stock_movements_consumable ON stock_movements(consumable_stock_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_invoice ON stock_movements(invoice_number);
CREATE INDEX idx_stock_movements_supplier ON stock_movements(supplier_id);
```

---

### Propuesta 4: Validaciones Dinámicas

En lugar de hacer el número de factura siempre obligatorio, hacerlo obligatorio **solo cuando el tipo de movimiento lo requiera**:

```typescript
interface StockUpdateValidation {
  movement_type: string // 'PURCHASE', 'CONSUMPTION', etc.
  quantity: number
  invoice_number?: string
  supplier_id?: number
  reason?: string
  notes?: string
}

function validateStockUpdate(data: StockUpdateValidation) {
  const movementType = getMovementType(data.movement_type)
  
  // Validaciones dinámicas basadas en el tipo
  if (movementType.requires_invoice && !data.invoice_number) {
    throw new Error('Invoice number is required for this type of movement')
  }
  
  if (movementType.requires_supplier && !data.supplier_id) {
    throw new Error('Supplier is required for this type of movement')
  }
  
  // ... más validaciones
}
```

---

## 🎨 Propuesta de UI Mejorada

### Modal de Actualización de Stock (Versión Mejorada)

```
┌────────────────────────────────────────────────┐
│ Update Stock                              ✕    │
├────────────────────────────────────────────────┤
│                                                │
│ Movement Type *                                │
│ ┌──────────────────────────────────────────┐  │
│ │ [📦] Purchase from Supplier          ▼   │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌────────────────────────────────────────┐    │
│ │ Current Stock: 45 units                │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Quantity to Add *                              │
│ ┌──────────────────────────────────────────┐  │
│ │ 50                                       │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Invoice Number *                               │
│ ┌──────────────────────────────────────────┐  │
│ │ FAC-2025-001234                          │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Supplier *                                     │
│ ┌──────────────────────────────────────────┐  │
│ │ ABC Supplies Inc.                    ▼   │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Purchase Date                                  │
│ ┌──────────────────────────────────────────┐  │
│ │ 2025-10-06                           📅  │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Unit Price (Optional)                          │
│ ┌──────────────────────────────────────────┐  │
│ │ $ 2.50                                   │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Total: $125.00                                 │
│                                                │
│ Notes                                          │
│ ┌──────────────────────────────────────────┐  │
│ │ Received in good condition               │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌────────────────────────────────────────┐    │
│ │ 📘 Preview: New stock will be 95 units │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ [Cancel]  [Update Stock]                      │
└────────────────────────────────────────────────┘
```

---

## 📊 Comparación de Enfoques

### Enfoque 1: Factura Siempre Obligatoria (Propuesta Original)

**Pros:**
- ✅ Simple de implementar
- ✅ Garantiza trazabilidad de compras
- ✅ Fácil de auditar

**Contras:**
- ❌ No aplica para todos los escenarios
- ❌ Ajustes de inventario no tienen factura
- ❌ Devoluciones de usuarios no tienen factura
- ❌ Menos flexible
- ❌ Puede frustrar a usuarios en casos válidos

---

### Enfoque 2: Validación Dinámica por Tipo (Recomendado)

**Pros:**
- ✅ Flexible y adaptable
- ✅ Validaciones apropiadas por contexto
- ✅ Mejor experiencia de usuario
- ✅ Más información capturada
- ✅ Escalable a futuro
- ✅ Permite diferentes flujos de trabajo

**Contras:**
- ⚠️ Más complejo de implementar
- ⚠️ Requiere más campos en la UI
- ⚠️ Necesita tabla de tipos de movimiento

---

## 🎯 Recomendación Final

### Opción A: Implementación Rápida (Corto Plazo)

**Para actualización individual:**
1. Agregar campo `invoice_number` (obligatorio solo para "Add Stock" y "Restock")
2. Agregar campo `supplier_name` (texto libre, opcional)
3. Mantener campo `notes` existente

**Para importación masiva:**
1. Agregar columna `invoice_number` en Excel (obligatoria)
2. Agregar columna `supplier_name` (opcional)
3. Validar en backend

**Ventajas:**
- ✅ Rápido de implementar (1-2 horas)
- ✅ Resuelve el problema inmediato
- ✅ No requiere migraciones complejas

**Desventajas:**
- ⚠️ Menos flexible
- ⚠️ No distingue tipos de movimiento

---

### Opción B: Implementación Completa (Largo Plazo)

**Fase 1: Base de Datos**
1. Crear tabla `suppliers`
2. Crear tabla `stock_movement_types`
3. Mejorar tabla `stock_movements`
4. Migrar datos existentes

**Fase 2: Backend**
1. Crear operaciones CRUD para proveedores
2. Implementar validaciones dinámicas
3. Actualizar endpoints de stock

**Fase 3: Frontend**
1. Crear página de gestión de proveedores
2. Actualizar modal de actualización de stock
3. Agregar selector de tipo de movimiento
4. Actualizar importación masiva

**Ventajas:**
- ✅ Sistema completo y profesional
- ✅ Máxima flexibilidad
- ✅ Mejor trazabilidad
- ✅ Reportes más detallados
- ✅ Escalable

**Desventajas:**
- ⚠️ Requiere más tiempo (1-2 días)
- ⚠️ Más complejo de mantener

---

## 💡 Mi Recomendación

**Implementar Opción A ahora + planificar Opción B para después**

### Fase Inmediata (Hoy):
1. Agregar campo `invoice_number` obligatorio
2. Agregar campo `supplier_name` opcional
3. Actualizar validaciones
4. Actualizar UI del modal
5. Actualizar plantilla de Excel

### Fase Futura (Cuando haya tiempo):
1. Implementar sistema completo de tipos de movimiento
2. Crear gestión de proveedores
3. Mejorar reportes y auditoría

---

## 🔄 Campos Propuestos para Implementación Inmediata

### Modal de Actualización Individual

**Campos actuales:**
- Movement type (Add/Adjust/Set)
- Quantity
- Notes

**Campos a agregar:**
- ✅ Invoice Number (obligatorio para Add/Restock)
- ✅ Supplier Name (opcional, texto libre)
- ✅ Purchase Date (opcional, default: hoy)

### Importación Masiva

**Columnas actuales:**
- name
- description
- category
- current_quantity
- minimum_threshold
- unit_of_measure

**Columnas a agregar:**
- ✅ invoice_number (obligatorio)
- ✅ supplier_name (opcional)
- ✅ purchase_date (opcional)
- ✅ unit_price (opcional)

---

## 📝 Próximos Pasos

1. **Decidir:** ¿Opción A (rápida) u Opción B (completa)?
2. **Revisar:** ¿Los campos propuestos son suficientes?
3. **Confirmar:** ¿Alguna otra información necesaria?
4. **Implementar:** Proceder con los cambios

---

## ❓ Preguntas para Considerar

1. **¿Necesitas rastrear precios de compra?**
   - Si sí: Agregar campos de precio
   - Si no: Omitir por ahora

2. **¿Necesitas gestión formal de proveedores?**
   - Si sí: Implementar tabla de proveedores
   - Si no: Usar texto libre por ahora

3. **¿Necesitas distinguir tipos de movimiento?**
   - Si sí: Implementar sistema de tipos
   - Si no: Asumir que todo es "compra"

4. **¿Necesitas reportes financieros?**
   - Si sí: Agregar campos de precio y moneda
   - Si no: Enfocarse solo en cantidades

5. **¿Cuándo necesitas esto en producción?**
   - Urgente: Opción A
   - Puede esperar: Opción B

---

**¿Qué opción prefieres? ¿Alguna modificación a las propuestas?**
