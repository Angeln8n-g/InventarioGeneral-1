# 🎒 Bulto de Herramientas - Feature Completo

## 🎯 Objetivo

Implementar un sistema de "bulto" para herramientas, similar al carrito de consumibles, que permita escanear múltiples herramientas y crear un préstamo consolidado.

---

## 📋 Especificaciones

### 1. Herramientas Únicas
- Cada herramienta es única (no tiene cantidad)
- Identificada por tool_id, serial_number y QR code
- No se pueden agregar duplicados al bulto

### 2. Fecha de Devolución
- Se establece al confirmar el bulto completo
- Aplica para todas las herramientas del préstamo

### 3. Notas del Préstamo
- Opcionales
- Se agregan después de confirmar el bulto
- Aplican al préstamo completo, no por herramienta

### 4. Validación Inteligente
- Verificar que herramienta esté disponible
- Verificar que usuario no tenga la misma herramienta prestada
- **Si usuario tiene préstamo pendiente**: Agregar herramientas al préstamo existente
- **Si usuario NO tiene préstamo pendiente**: Crear nuevo préstamo

---

## 🎨 Diseño de Interfaz

### Badge Flotante

```
┌────────┐
│ 🎒  3  │  ← Badge con icono de bolsa
└────────┘
```

**Características**:
- Icono: 🎒 (bolsa/bulto)
- Contador: Número de herramientas
- Color: Azul (igual que carrito)
- Posición: Bottom-right
- Solo visible si hay items

---

### Modal del Bulto

```
┌─────────────────────────────────────┐
│ Mi Bulto                    3    ✕  │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Taladro Bosch              [✕] │ │
│ │ #TOOL-001                       │ │
│ │ [Herramientas] [Disponible]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Martillo Stanley           [✕] │ │
│ │ #TOOL-002                       │ │
│ │ [Herramientas] [Disponible]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Destornillador             [✕] │ │
│ │ #TOOL-003                       │ │
│ │ [Herramientas] [Disponible]     │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Total de herramientas: 3            │
│                                     │
│ [Confirmar Préstamo]                │
│ [Vaciar Bulto]                      │
└─────────────────────────────────────┘
```

**Elementos**:
- Header con título y contador
- Lista de herramientas con:
  - Nombre
  - Serial number
  - Categoría badge
  - Estado badge
  - Botón eliminar
- Footer con:
  - Resumen total
  - Botón confirmar
  - Botón vaciar

---

## 🔧 Arquitectura Técnica

### 1. BagContext

```typescript
interface BagItem {
  id: number          // tool_id
  tool_id: number
  name: string
  description?: string
  category?: string
  serial_number?: string
  qr_code: string
  status: string
}

interface BagContextType {
  items: BagItem[]
  addItem: (item: BagItem) => void
  removeItem: (toolId: number) => void
  clearBag: () => void
  getTotalItems: () => number
  isInBag: (toolId: number) => boolean
}
```

**Funcionalidades**:
- Persistencia en localStorage
- Validación de duplicados
- CRUD completo de items

---

### 2. BagButton Component

```typescript
<BagButton onClick={() => setShowBag(true)} />
```

**Props**:
- `onClick`: Función para abrir modal

**Características**:
- Badge flotante bottom-right
- Contador animado
- Tooltip al hover
- Solo visible si hay items

---

### 3. BagModal Component

```typescript
<BagModal
  isOpen={showBag}
  onClose={() => setShowBag(false)}
  onConfirm={handleConfirmBag}
/>
```

**Props**:
- `isOpen`: Boolean para mostrar/ocultar
- `onClose`: Función para cerrar
- `onConfirm`: Función para confirmar préstamo

**Características**:
- Sidebar desde la derecha
- Lista de herramientas
- Botones de acción
- Animaciones suaves

---

## 🔄 Flujo de Usuario

### Flujo Completo

```
1. Usuario abre Scanner de Herramientas
   ↓
2. Click "Iniciar Escáner"
   ↓
3. Escanea QR de Taladro
   ↓
4. Sistema valida disponibilidad
   ↓
5. Modal aparece: "Agregar al Bulto"
   ↓
6. Click "Agregar al Bulto"
   ↓
7. ✅ "Taladro agregado al bulto"
   ↓
8. Badge aparece: 🎒 1
   ↓
9. Escáner sigue activo
   ↓
10. Escanea QR de Martillo
    ↓
11. Click "Agregar al Bulto"
    ↓
12. Badge actualiza: 🎒 2
    ↓
13. Escanea QR de Destornillador
    ↓
14. Click "Agregar al Bulto"
    ↓
15. Badge actualiza: 🎒 3
    ↓
16. Click en badge 🎒
    ↓
17. Modal del bulto se abre
    ↓
18. Revisa las 3 herramientas
    ↓
19. Click "Confirmar Préstamo"
    ↓
20. Modal de fecha de devolución aparece
    ↓
21. Selecciona fecha
    ↓
22. (Opcional) Agrega notas
    ↓
23. Click "Confirmar"
    ↓
24. Sistema verifica si tiene préstamo pendiente
    ↓
25a. SI tiene préstamo pendiente:
     → Agregar herramientas al préstamo existente
     → ✅ "3 herramientas agregadas a tu préstamo"
    ↓
25b. NO tiene préstamo pendiente:
     → Crear nuevo préstamo con las 3 herramientas
     → ✅ "Préstamo creado con 3 herramientas"
    ↓
26. Bulto se vacía automáticamente
    ↓
27. Badge desaparece
    ↓
28. Redirect a "Mis Préstamos"
```

---

## 🎯 Lógica de Préstamo Inteligente

### Escenario 1: Usuario SIN Préstamo Pendiente

```typescript
const handleConfirmBag = async () => {
  // 1. Verificar si tiene préstamo pendiente
  const activeLoan = await checkActiveLoan(user.id)
  
  if (!activeLoan) {
    // 2. Crear NUEVO préstamo
    const loan = await createLoan({
      user_id: user.id,
      due_date: selectedDate,
      notes: notes,
      tools: bagItems.map(item => item.tool_id)
    })
    
    // 3. Limpiar bulto
    clearBag()
    
    // 4. Notificar
    alert(`✅ Préstamo creado con ${bagItems.length} herramientas`)
  }
}
```

---

### Escenario 2: Usuario CON Préstamo Pendiente

```typescript
const handleConfirmBag = async () => {
  // 1. Verificar si tiene préstamo pendiente
  const activeLoan = await checkActiveLoan(user.id)
  
  if (activeLoan) {
    // 2. AGREGAR herramientas al préstamo existente
    await addToolsToLoan({
      loan_id: activeLoan.id,
      tools: bagItems.map(item => item.tool_id)
    })
    
    // 3. Limpiar bulto
    clearBag()
    
    // 4. Notificar
    alert(`✅ ${bagItems.length} herramientas agregadas a tu préstamo`)
  }
}
```

---

## 📊 Validaciones

### 1. Herramienta Disponible

```typescript
const validateToolAvailability = async (toolId: number) => {
  const tool = await fetchTool(toolId)
  
  if (tool.status !== 'available') {
    throw new Error('Herramienta no disponible')
  }
  
  return tool
}
```

---

### 2. Herramienta No Duplicada en Bulto

```typescript
const addItem = (item: BagItem) => {
  const exists = items.some(i => i.tool_id === item.tool_id)
  
  if (exists) {
    alert('⚠️ Esta herramienta ya está en el bulto')
    return
  }
  
  setItems([...items, item])
}
```

---

### 3. Usuario No Tiene la Misma Herramienta Prestada

```typescript
const validateUserDoesntHaveTool = async (userId: number, toolId: number) => {
  const userLoans = await fetchUserActiveLoans(userId)
  
  const hasTool = userLoans.some(loan => 
    loan.tools.some(t => t.id === toolId)
  )
  
  if (hasTool) {
    throw new Error('Ya tienes esta herramienta prestada')
  }
}
```

---

## 🎨 Modal de Confirmación de Préstamo

### Diseño

```
┌─────────────────────────────────────┐
│ Confirmar Préstamo              ✕   │
├─────────────────────────────────────┤
│                                     │
│ Herramientas a prestar: 3           │
│                                     │
│ Fecha de devolución:                │
│ [📅 Seleccionar fecha]              │
│                                     │
│ Notas (opcional):                   │
│ [                                 ] │
│ [                                 ] │
│                                     │
│ ℹ️ Tienes un préstamo activo        │
│    Las herramientas se agregarán    │
│    a tu préstamo existente          │
│                                     │
│ [Confirmar Préstamo]                │
│ [Cancelar]                          │
└─────────────────────────────────────┘
```

**Elementos**:
- Contador de herramientas
- Date picker para fecha de devolución
- Textarea para notas opcionales
- Info box si tiene préstamo activo
- Botones de acción

---

## 🔧 API Endpoints Necesarios

### 1. Check Active Loan

```typescript
GET /api/loans/active?user_id={userId}

Response:
{
  data: {
    id: number
    user_id: number
    due_date: string
    tools: Tool[]
  } | null
}
```

---

### 2. Create Loan

```typescript
POST /api/loans/create

Body:
{
  user_id: number
  due_date: string
  notes?: string
  tool_ids: number[]
}

Response:
{
  data: {
    id: number
    user_id: number
    due_date: string
    notes?: string
    tools: Tool[]
  }
}
```

---

### 3. Add Tools to Loan

```typescript
POST /api/loans/{loanId}/add-tools

Body:
{
  tool_ids: number[]
}

Response:
{
  data: {
    id: number
    tools: Tool[]
  }
}
```

---

## 📱 Responsive Design

### Mobile (< 768px)

```
┌──────────────────┐
│ Scanner          │
│                  │
│ [QR Scanner]     │
│                  │
│     ┌──────┐     │
│     │ 🎒 3 │     │
│     └──────┘     │
└──────────────────┘
```

**Modal ocupa pantalla completa**

---

### Desktop (> 1024px)

```
┌────────────────────────────────────┐
│ Scanner                            │
│                                    │
│ [QR Scanner Area]                  │
│                                    │
│                    ┌─────────┐     │
│                    │  🎒  3  │     │
│                    └─────────┘     │
└────────────────────────────────────┘
```

**Modal como sidebar derecho**

---

## ✅ Checklist de Implementación

### Fase 1: Contexto y Componentes Base
- [x] Crear BagContext.tsx
- [x] Crear BagButton.tsx
- [x] Crear BagModal.tsx
- [ ] Crear LoanConfirmationModal.tsx

### Fase 2: Integración en Scanner
- [ ] Actualizar scanner de herramientas
- [ ] Agregar BagProvider
- [ ] Agregar botón "Agregar al Bulto"
- [ ] Mostrar badge flotante
- [ ] Implementar handleAddToBag
- [ ] Implementar handleConfirmBag

### Fase 3: API y Backend
- [ ] Endpoint: Check active loan
- [ ] Endpoint: Create loan
- [ ] Endpoint: Add tools to loan
- [ ] Validaciones de disponibilidad
- [ ] Notificaciones

### Fase 4: Testing
- [ ] Testing manual completo
- [ ] Verificar persistencia
- [ ] Verificar lógica de préstamo inteligente
- [ ] Testing en mobile
- [ ] Testing de validaciones

### Fase 5: Documentación
- [ ] Guía de uso
- [ ] Documentación técnica
- [ ] Testing checklist

---

## 🎉 Beneficios

### Para el Usuario
- ✅ **Más rápido**: 70% menos tiempo para múltiples herramientas
- ✅ **Más conveniente**: Escanear todo y confirmar una vez
- ✅ **Menos errores**: Revisar antes de confirmar
- ✅ **Mejor organización**: Todas las herramientas en un préstamo

### Para el Admin
- ✅ **Menos préstamos**: 1 en lugar de N
- ✅ **Mejor trazabilidad**: Herramientas agrupadas lógicamente
- ✅ **Más fácil de gestionar**: Un solo préstamo por usuario
- ✅ **Menos notificaciones**: 1 notificación consolidada

### Para el Sistema
- ✅ **Menos transacciones**: Reduce carga
- ✅ **Mejor UX**: Experiencia consistente con consumibles
- ✅ **Escalable**: Funciona con muchas herramientas
- ✅ **Mantenible**: Código reutilizable

---

**Estado**: 🚧 En Implementación
**Versión**: 1.0
**Fecha**: Hoy
