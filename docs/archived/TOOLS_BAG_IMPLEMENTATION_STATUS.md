# ✅ Estado de Implementación: Bulto de Herramientas

## 🎯 Objetivo

Implementar un sistema de "bulto" 🎒 para herramientas, similar al carrito de consumibles, que permita escanear múltiples herramientas y crear un préstamo consolidado.

---

## ✅ Componentes Implementados

### 1. BagContext ✅
**Archivo**: `src/contexts/BagContext.tsx`

**Funcionalidades**:
- ✅ Estado global del bulto
- ✅ Persistencia en localStorage
- ✅ Métodos CRUD completos
- ✅ Validación de duplicados
- ✅ TypeScript type-safe

**Métodos**:
```typescript
- addItem(item)         // Agregar herramienta
- removeItem(toolId)    // Eliminar herramienta
- clearBag()            // Vaciar bulto
- getTotalItems()       // Total de herramientas
- isInBag(toolId)       // Verificar si está en bulto
```

---

### 2. BagButton ✅
**Archivo**: `src/components/bag/BagButton.tsx`

**Características**:
- ✅ Badge flotante bottom-right
- ✅ Icono de bolsa 🎒
- ✅ Contador animado
- ✅ Tooltip al hover
- ✅ Solo visible si hay items
- ✅ Responsive

---

### 3. BagModal ✅
**Archivo**: `src/components/bag/BagModal.tsx`

**Características**:
- ✅ Sidebar desde la derecha
- ✅ Lista de herramientas
- ✅ Información completa (nombre, serial, categoría, estado)
- ✅ Botón eliminar por item
- ✅ Resumen total
- ✅ Botón "Confirmar Préstamo"
- ✅ Botón "Vaciar Bulto"
- ✅ Animaciones suaves
- ✅ Dark mode support

---

### 4. LoanConfirmationModal ✅
**Archivo**: `src/components/bag/LoanConfirmationModal.tsx`

**Características**:
- ✅ Date picker para fecha de devolución
- ✅ Validación de fecha (mínimo mañana, máximo 30 días)
- ✅ Textarea para notas opcionales
- ✅ Contador de caracteres (500 max)
- ✅ Info box si tiene préstamo activo
- ✅ Loading state
- ✅ Validación de campos requeridos
- ✅ Dark mode support

---

## ⏳ Pendiente de Implementar

### 1. Integración en Scanner ⏳
**Archivo**: `src/app/scanner/page.tsx` o crear `src/app/tools/scan/page.tsx`

**Tareas**:
- [ ] Agregar BagProvider
- [ ] Agregar BagButton
- [ ] Agregar BagModal
- [ ] Agregar LoanConfirmationModal
- [ ] Implementar handleAddToBag
- [ ] Implementar handleConfirmBag
- [ ] Validar disponibilidad de herramienta
- [ ] Simplificar (eliminar multi-mode si existe)

---

### 2. API Endpoints ⏳

#### a) Check Active Loan
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

#### b) Create Loan
```typescript
POST /api/loans/create

Body:
{
  user_id: number
  due_date: string
  notes?: string
  tool_ids: number[]
}
```

#### c) Add Tools to Loan
```typescript
POST /api/loans/{loanId}/add-tools

Body:
{
  tool_ids: number[]
}
```

---

### 3. Lógica de Préstamo Inteligente ⏳

```typescript
const handleConfirmBag = async (dueDate: string, notes?: string) => {
  // 1. Verificar si tiene préstamo activo
  const activeLoan = await checkActiveLoan(user.id)
  
  if (activeLoan) {
    // Agregar herramientas al préstamo existente
    await addToolsToLoan(activeLoan.id, bagItems)
    alert(`✅ ${bagItems.length} herramientas agregadas a tu préstamo`)
  } else {
    // Crear nuevo préstamo
    await createLoan({
      user_id: user.id,
      due_date: dueDate,
      notes: notes,
      tool_ids: bagItems.map(item => item.tool_id)
    })
    alert(`✅ Préstamo creado con ${bagItems.length} herramientas`)
  }
  
  clearBag()
  router.push('/my-loans')
}
```

---

## 🎨 Flujo Completo Diseñado

```
1. Abrir Scanner de Herramientas
   ↓
2. Escanear QR de herramienta
   ↓
3. Sistema valida disponibilidad
   ↓
4. Modal: "Agregar al Bulto"
   ↓
5. Click "Agregar al Bulto"
   ↓
6. Badge aparece: 🎒 1
   ↓
7. Escanear más herramientas
   ↓
8. Badge actualiza: 🎒 3
   ↓
9. Click en badge 🎒
   ↓
10. BagModal se abre
    ↓
11. Revisar herramientas
    ↓
12. Click "Confirmar Préstamo"
    ↓
13. LoanConfirmationModal aparece
    ↓
14. Seleccionar fecha de devolución
    ↓
15. (Opcional) Agregar notas
    ↓
16. Click "Confirmar Préstamo"
    ↓
17. Sistema verifica préstamo activo
    ↓
18a. SI tiene préstamo:
     → Agregar herramientas al préstamo
    ↓
18b. NO tiene préstamo:
     → Crear nuevo préstamo
    ↓
19. Bulto se vacía
    ↓
20. Redirect a "Mis Préstamos"
```

---

## 📊 Progreso

### Componentes Base
- [x] BagContext (100%)
- [x] BagButton (100%)
- [x] BagModal (100%)
- [x] LoanConfirmationModal (100%)

**Progreso**: 4/4 (100%) ✅

---

### Integración
- [ ] Scanner page integration (0%)
- [ ] handleAddToBag (0%)
- [ ] handleConfirmBag (0%)
- [ ] Validaciones (0%)

**Progreso**: 0/4 (0%) ⏳

---

### Backend
- [ ] Check active loan endpoint (0%)
- [ ] Create loan endpoint (0%)
- [ ] Add tools to loan endpoint (0%)

**Progreso**: 0/3 (0%) ⏳

---

### Testing
- [ ] Testing manual (0%)
- [ ] Documentación (0%)

**Progreso**: 0/2 (0%) ⏳

---

## 🎯 Próximos Pasos

### Paso 1: Integrar en Scanner
1. Leer scanner actual de herramientas
2. Simplificar (eliminar multi-mode)
3. Agregar BagProvider
4. Agregar BagButton y BagModal
5. Implementar handleAddToBag
6. Implementar handleConfirmBag

### Paso 2: Crear/Verificar API Endpoints
1. Verificar si existen endpoints necesarios
2. Crear los que falten
3. Probar endpoints

### Paso 3: Testing
1. Testing manual completo
2. Verificar persistencia
3. Verificar lógica de préstamo inteligente
4. Testing en mobile

### Paso 4: Documentación
1. Guía de uso
2. Testing checklist
3. Resumen final

---

## 💡 Decisiones de Diseño

### 1. Herramientas Únicas
- Cada herramienta es única (no tiene cantidad)
- No se pueden agregar duplicados al bulto
- Identificadas por tool_id

### 2. Fecha de Devolución
- Se establece al confirmar el bulto
- Aplica para todas las herramientas
- Mínimo: Mañana
- Máximo: 30 días

### 3. Notas Opcionales
- Se agregan al confirmar el bulto
- Aplican al préstamo completo
- Máximo 500 caracteres

### 4. Préstamo Inteligente
- Si tiene préstamo activo → Agregar herramientas
- Si NO tiene préstamo → Crear nuevo préstamo

---

## 🎉 Ventajas del Sistema

### Para el Usuario
- ✅ Escaneo rápido de múltiples herramientas
- ✅ Revisión antes de confirmar
- ✅ Un solo préstamo consolidado
- ✅ Persistencia entre sesiones
- ✅ Experiencia consistente con consumibles

### Para el Admin
- ✅ Un préstamo en lugar de N
- ✅ Herramientas agrupadas lógicamente
- ✅ Más fácil de gestionar
- ✅ Mejor trazabilidad

### Para el Sistema
- ✅ Menos transacciones
- ✅ Código reutilizable
- ✅ Experiencia consistente
- ✅ Escalable

---

## 📝 Notas Técnicas

### Persistencia
- localStorage key: `tools_bag`
- Se guarda automáticamente al cambiar
- Se carga al iniciar

### Validaciones
- Herramienta disponible
- No duplicados en bulto
- Usuario no tiene la misma herramienta prestada
- Fecha de devolución válida

### Iconos
- Bulto: 🎒 (bolsa/backpack)
- Carrito: 🛒 (shopping cart)
- Diferenciación visual clara

---

**Estado General**: 🚧 50% Completado
**Componentes Base**: ✅ 100% Completado
**Integración**: ⏳ 0% Pendiente
**Backend**: ⏳ 0% Pendiente
**Testing**: ⏳ 0% Pendiente

**Próximo paso**: Integrar en scanner de herramientas
