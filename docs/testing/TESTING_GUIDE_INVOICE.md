# 🧪 Guía de Pruebas - Número de Factura Obligatorio

## ✅ Estado Actual

- ✅ Código compilado exitosamente
- ✅ Servidor ejecutándose en `http://localhost:3000`
- ✅ Sin errores críticos
- ⏳ Listo para testing manual

---

## 🎯 Casos de Prueba

### Test 1: Actualización Individual - Add Stock CON Factura ✅

**Pasos:**
1. Ir a `http://localhost:3000/admin/consumables`
2. Click en cualquier consumible
3. Click en botón **"Update Stock"** o **"+ Add Stock"**
4. Llenar formulario:
   - Amount to Add: `50`
   - Invoice Number: `FAC-2025-001234` ✅
   - Supplier Name: `ABC Supplies` (opcional)
   - Purchase Date: `2025-10-06` (opcional)
   - Notes: `Test con factura`
5. Click en **"Update Stock"**

**Resultado Esperado:**
- ✅ Stock se actualiza correctamente
- ✅ Mensaje de éxito aparece
- ✅ Modal se cierra
- ✅ Página se refresca

---

### Test 2: Actualización Individual - Add Stock SIN Factura ❌

**Pasos:**
1. Ir a `http://localhost:3000/admin/consumables`
2. Click en cualquier consumible
3. Click en **"+ Add Stock"**
4. Llenar formulario:
   - Amount to Add: `50`
   - Invoice Number: *(dejar vacío)* ❌
   - Notes: `Test sin factura`
5. Click en **"Update Stock"**

**Resultado Esperado:**
- ❌ Error aparece: "Invoice number is required when adding stock"
- ❌ Stock NO se actualiza
- ❌ Modal permanece abierto
- ✅ Usuario puede corregir

---

### Test 3: Adjust Stock Positivo CON Factura ✅

**Pasos:**
1. Ir a consumible
2. Click en **"± Adjust"**
3. Llenar:
   - Adjustment Amount: `10` (positivo)
   - Invoice Number: `FAC-2025-001235` ✅
4. Click en **"Update Stock"**

**Resultado Esperado:**
- ✅ Stock se actualiza (+10)
- ✅ Campos de factura aparecen
- ✅ Validación pasa

---

### Test 4: Adjust Stock Positivo SIN Factura ❌

**Pasos:**
1. Click en **"± Adjust"**
2. Llenar:
   - Adjustment Amount: `10` (positivo)
   - Invoice Number: *(vacío)* ❌
3. Click en **"Update Stock"**

**Resultado Esperado:**
- ❌ Error: "Invoice number is required when adding stock"
- ❌ Stock NO se actualiza

---

### Test 5: Adjust Stock Negativo SIN Factura ✅

**Pasos:**
1. Click en **"± Adjust"**
2. Llenar:
   - Adjustment Amount: `-5` (negativo)
   - *(Campos de factura NO aparecen)* ✅
   - Notes: `Damaged units`
3. Click en **"Update Stock"**

**Resultado Esperado:**
- ✅ Stock se actualiza (-5)
- ✅ NO requiere factura
- ✅ Campos de factura NO aparecen

---

### Test 6: Set Stock SIN Factura ✅

**Pasos:**
1. Click en **"= Set Value"**
2. Llenar:
   - New Stock Quantity: `100`
   - *(Campos de factura NO aparecen)* ✅
   - Notes: `Physical count`
3. Click en **"Update Stock"**

**Resultado Esperado:**
- ✅ Stock se establece en 100
- ✅ NO requiere factura
- ✅ Campos de factura NO aparecen

---

### Test 7: Importación Masiva CON Factura ✅

**Pasos:**
1. Ir a `http://localhost:3000/admin/consumables`
2. Click en **"Bulk Import"**
3. Click en **"Download Template"**
4. Abrir Excel descargado
5. Verificar columnas nuevas:
   - ✅ `invoice_number`
   - ✅ `supplier_name`
   - ✅ `purchase_date`
6. Llenar datos:
   ```
   name: "Test Item 1"
   current_quantity: 100
   minimum_threshold: 20
   invoice_number: "FAC-2025-001236" ✅
   supplier_name: "Test Supplier"
   ```
7. Guardar y subir archivo
8. Click en **"Import"**

**Resultado Esperado:**
- ✅ Importación exitosa
- ✅ Resumen muestra 1 exitoso, 0 errores
- ✅ Item aparece en lista

---

### Test 8: Importación Masiva SIN Factura ❌

**Pasos:**
1. Click en **"Bulk Import"**
2. Crear Excel con:
   ```
   name: "Test Item 2"
   current_quantity: 50
   minimum_threshold: 10
   invoice_number: *(vacío)* ❌
   ```
3. Subir archivo
4. Click en **"Import"**

**Resultado Esperado:**
- ❌ Error en resultados
- ❌ Row X: "Invoice number is required when adding stock"
- ❌ Item NO se crea
- ✅ Resumen muestra 0 exitosos, 1 error

---

### Test 9: Campos Condicionales en UI

**Pasos:**
1. Abrir modal de actualización
2. Seleccionar **"Add Stock"**
   - ✅ Verificar que aparecen: Invoice, Supplier, Date
3. Cambiar a **"± Adjust"**
4. Ingresar cantidad positiva (`10`)
   - ✅ Verificar que aparecen: Invoice, Supplier, Date
5. Cambiar cantidad a negativa (`-5`)
   - ✅ Verificar que desaparecen los campos
6. Cambiar a **"= Set Value"**
   - ✅ Verificar que NO aparecen los campos

**Resultado Esperado:**
- ✅ Campos aparecen/desaparecen dinámicamente
- ✅ Comportamiento correcto según tipo

---

### Test 10: Audit Log

**Pasos:**
1. Realizar actualización con factura
2. Ir a base de datos
3. Consultar tabla `audit_logs`
4. Buscar último registro

**Resultado Esperado:**
```sql
SELECT * FROM audit_logs 
WHERE action IN ('stock_restock', 'stock_adjustment')
ORDER BY created_at DESC 
LIMIT 1;
```

**Debe contener:**
```json
{
  "new_values": {
    "old_quantity": 45,
    "new_quantity": 95,
    "restock_amount": 50,
    "notes": "Test con factura",
    "invoice_number": "FAC-2025-001234",  ✅
    "supplier_name": "ABC Supplies",      ✅
    "purchase_date": "2025-10-06"         ✅
  }
}
```

---

## 📋 Checklist de Pruebas

### Actualización Individual
- [ ] Add Stock con factura (debe funcionar)
- [ ] Add Stock sin factura (debe fallar)
- [ ] Adjust positivo con factura (debe funcionar)
- [ ] Adjust positivo sin factura (debe fallar)
- [ ] Adjust negativo sin factura (debe funcionar)
- [ ] Set Stock sin factura (debe funcionar)

### Importación Masiva
- [ ] Descargar plantilla (debe tener nuevas columnas)
- [ ] Importar con factura (debe funcionar)
- [ ] Importar sin factura (debe fallar)
- [ ] Verificar mensajes de error claros

### UI/UX
- [ ] Campos aparecen para Add Stock
- [ ] Campos aparecen para Adjust positivo
- [ ] Campos NO aparecen para Adjust negativo
- [ ] Campos NO aparecen para Set Stock
- [ ] Mensajes de error claros
- [ ] Validación en tiempo real

### Backend
- [ ] Validación en API funciona
- [ ] Audit log registra campos nuevos
- [ ] Errores 400 con mensajes correctos

---

## 🐛 Problemas Conocidos

### Warnings (No Críticos)
```
⚠️ React Hook useEffect has missing dependency
⚠️ Using <img> instead of <Image />
⚠️ Variables declared but never used
```

**Impacto:** Ninguno - Son warnings de linting, no afectan funcionalidad

---

## 📊 Matriz de Pruebas

| Escenario | Tipo | Factura | Debe Funcionar | Probado |
|-----------|------|---------|----------------|---------|
| Add Stock | Restock | ✅ Sí | ✅ Sí | ⏳ |
| Add Stock | Restock | ❌ No | ❌ No | ⏳ |
| Adjust | Positivo | ✅ Sí | ✅ Sí | ⏳ |
| Adjust | Positivo | ❌ No | ❌ No | ⏳ |
| Adjust | Negativo | ❌ No | ✅ Sí | ⏳ |
| Set Stock | Set | ❌ No | ✅ Sí | ⏳ |
| Bulk Import | Import | ✅ Sí | ✅ Sí | ⏳ |
| Bulk Import | Import | ❌ No | ❌ No | ⏳ |

---

## 🎯 Criterios de Éxito

### Funcionalidad
- ✅ Factura obligatoria para stock entrante
- ✅ Factura NO obligatoria para ajustes negativos
- ✅ Validaciones en frontend y backend
- ✅ Mensajes de error claros

### UI/UX
- ✅ Campos aparecen condicionalmente
- ✅ Formulario intuitivo
- ✅ Feedback visual inmediato
- ✅ Plantilla Excel actualizada

### Calidad
- ✅ Sin errores de compilación
- ✅ Sin errores críticos
- ✅ Audit log completo
- ✅ Código limpio

---

## 📝 Reporte de Pruebas

### Formato de Reporte

```markdown
## Test: [Nombre del Test]
**Fecha:** [Fecha]
**Probado por:** [Nombre]

**Pasos realizados:**
1. ...
2. ...

**Resultado:**
- [ ] ✅ Pasó
- [ ] ❌ Falló

**Observaciones:**
- ...

**Screenshots:**
- [Adjuntar si es necesario]
```

---

## 🚀 Comandos Útiles

### Iniciar Servidor
```bash
npm run dev
```

### Ver Logs
```bash
# En la terminal donde corre el servidor
# Los errores aparecerán automáticamente
```

### Verificar Base de Datos
```sql
-- Ver últimos audit logs
SELECT * FROM audit_logs 
WHERE action LIKE 'stock%' 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver consumables actualizados
SELECT * FROM consumable_stock 
ORDER BY updated_at DESC 
LIMIT 10;
```

---

**Estado:** ✅ Listo para Testing  
**Servidor:** ✅ Ejecutándose  
**URL:** http://localhost:3000  
**Próximo paso:** Ejecutar pruebas manuales
