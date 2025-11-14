# 📸 Ejemplos Visuales - Actualización de Stock

## 🎨 Interfaz Principal

### Tarjeta de Stock Status (Actualizada)

```
┌──────────────────────────────────────────────────────┐
│ Stock Status                    [Update Stock 📝]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Current Stock          Minimum Threshold           │
│  ┌──────────┐          ┌──────────┐                │
│  │   45     │          │   20     │                │
│  │  units   │          │  units   │                │
│  └──────────┘          └──────────┘                │
│                                                      │
│  ⚠️ Low Stock - Consider restocking soon            │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Quick Actions                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │+ Add     │ │± Adjust  │ │= Set     │           │
│  │  Stock   │ │          │ │  Value   │           │
│  └──────────┘ └──────────┘ └──────────┘           │
└──────────────────────────────────────────────────────┘
```

## 📋 Modal de Actualización

### Modo: Add Stock (Restock)

```
┌──────────────────────────────────────────┐
│ Add Stock                           ✕    │
├──────────────────────────────────────────┤
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Current Stock: 45 units            │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Enter the amount to add to current      │
│ stock.                                   │
│                                          │
│ Amount to Add                            │
│ ┌────────────────────────────────────┐  │
│ │ 50                                 │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Notes (Optional)                         │
│ ┌────────────────────────────────────┐  │
│ │ Received new shipment from         │  │
│ │ supplier                           │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 📘 Preview: New stock will be      │  │
│ │    95 units                        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌──────────┐  ┌──────────────────────┐ │
│ │ Cancel   │  │ Update Stock         │ │
│ └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

### Modo: Adjust Stock

```
┌──────────────────────────────────────────┐
│ Adjust Stock                        ✕    │
├──────────────────────────────────────────┤
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Current Stock: 95 units            │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Enter a positive number to add or       │
│ negative to subtract from current stock.│
│                                          │
│ Adjustment Amount                        │
│ ┌────────────────────────────────────┐  │
│ │ -5                                 │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Notes (Optional)                         │
│ ┌────────────────────────────────────┐  │
│ │ Damaged units removed              │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 📘 Preview: New stock will be      │  │
│ │    90 units                        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌──────────┐  ┌──────────────────────┐ │
│ │ Cancel   │  │ Update Stock         │ │
│ └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

### Modo: Set Stock Value

```
┌──────────────────────────────────────────┐
│ Set Stock Value                     ✕    │
├──────────────────────────────────────────┤
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Current Stock: 90 units            │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Enter the new total stock quantity.     │
│                                          │
│ New Stock Quantity                       │
│ ┌────────────────────────────────────┐  │
│ │ 100                                │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Notes (Optional)                         │
│ ┌────────────────────────────────────┐  │
│ │ Physical inventory count           │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 📘 Preview: New stock will be      │  │
│ │    100 units                       │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌──────────┐  ┌──────────────────────┐ │
│ │ Cancel   │  │ Update Stock         │ │
│ └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

## ✅ Mensaje de Éxito

```
┌──────────────────────────────────────────────────────┐
│ Stock Status                    [Update Stock 📝]    │
├──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐  │
│ │ ✓ Stock updated successfully!                  │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│  Current Stock          Minimum Threshold           │
│  ┌──────────┐          ┌──────────┐                │
│  │  100     │          │   20     │                │
│  │  units   │          │  units   │                │
│  └──────────┘          └──────────┘                │
└──────────────────────────────────────────────────────┘
```

## ❌ Mensaje de Error

```
┌──────────────────────────────────────────┐
│ Add Stock                           ✕    │
├──────────────────────────────────────────┤
│                                          │
│ Amount to Add                            │
│ ┌────────────────────────────────────┐  │
│ │ -10                                │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ ❌ Restock amount must be positive │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌──────────┐  ┌──────────────────────┐ │
│ │ Cancel   │  │ Update Stock         │ │
│ └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

## 🔄 Estado de Carga

```
┌──────────────────────────────────────────┐
│ Add Stock                           ✕    │
├──────────────────────────────────────────┤
│                                          │
│ Amount to Add                            │
│ ┌────────────────────────────────────┐  │
│ │ 50                                 │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌──────────┐  ┌──────────────────────┐ │
│ │ Cancel   │  │ ⟳ Updating...        │ │
│ └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

## 📊 Diferentes Estados de Stock

### Stock Normal (Verde)

```
┌──────────────────────────────────────────┐
│  Current Stock                           │
│  ┌──────────┐                            │
│  │  100     │  ← Verde                   │
│  │  units   │                            │
│  └──────────┘                            │
└──────────────────────────────────────────┘
```

### Stock Bajo (Amarillo)

```
┌──────────────────────────────────────────┐
│  Current Stock                           │
│  ┌──────────┐                            │
│  │   15     │  ← Amarillo                │
│  │  units   │                            │
│  └──────────┘                            │
│                                          │
│  ⚠️ Low Stock - Consider restocking     │
└──────────────────────────────────────────┘
```

### Sin Stock (Rojo)

```
┌──────────────────────────────────────────┐
│  Current Stock                           │
│  ┌──────────┐                            │
│  │    0     │  ← Rojo                    │
│  │  units   │                            │
│  └──────────┘                            │
│                                          │
│  ⚠️ Out of Stock - Restock needed       │
│     immediately                          │
└──────────────────────────────────────────┘
```

## 🎯 Casos de Uso Comunes

### 1. Recibir Envío del Proveedor

```
Situación: Llegaron 100 unidades nuevas
Acción: + Add Stock
Cantidad: 100
Nota: "Shipment #12345 from ABC Supplier"
Resultado: Stock anterior + 100
```

### 2. Corrección de Inventario

```
Situación: Conteo físico muestra 85 unidades
Acción: = Set Value
Cantidad: 85
Nota: "Physical inventory count - Q4 2025"
Resultado: Stock = 85
```

### 3. Unidades Dañadas

```
Situación: 5 unidades se dañaron
Acción: ± Adjust
Cantidad: -5
Nota: "Water damage - units discarded"
Resultado: Stock anterior - 5
```

### 4. Devolución de Usuario

```
Situación: Usuario devolvió 3 unidades sin usar
Acción: + Add Stock
Cantidad: 3
Nota: "Returned by user #123 - unused"
Resultado: Stock anterior + 3
```

### 5. Ajuste por Robo/Pérdida

```
Situación: Faltaron 10 unidades en auditoría
Acción: ± Adjust
Cantidad: -10
Nota: "Missing units - security incident #456"
Resultado: Stock anterior - 10
```

## 🎨 Colores y Estilos

### Botones de Acción Rápida

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ + Add Stock  │  │ ± Adjust     │  │ = Set Value  │
│              │  │              │  │              │
│   Verde      │  │    Azul      │  │   Morado     │
│  #10B981     │  │  #3B82F6     │  │  #8B5CF6     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Estados de Stock

```
Verde (#10B981)  → Stock normal
Amarillo (#F59E0B) → Stock bajo
Rojo (#EF4444)   → Sin stock
```

### Mensajes

```
Azul (#3B82F6)   → Vista previa
Verde (#10B981)  → Éxito
Rojo (#EF4444)   → Error
```

---

**Nota**: Estos son ejemplos visuales en texto. La interfaz real usa componentes React con estilos Tailwind CSS y soporte para tema claro/oscuro.
