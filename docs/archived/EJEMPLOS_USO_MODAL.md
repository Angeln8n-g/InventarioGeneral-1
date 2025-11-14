# 📖 Ejemplos de Uso: Modal de Consumibles

## 🎯 Casos de Uso Comunes

### 1. Ver Detalles de un Consumible

**Escenario**: Necesitas revisar el stock actual de "Baterías"

**Pasos**:
1. Ve a `/admin/consumables`
2. Busca el card de "Baterías"
3. Click en **"View Details"**
4. El modal se abre mostrando:
   - Stock actual: 24 unidades
   - Mínimo: 10 unidades
   - Estado: In Stock (verde)
   - QR Code
   - Descripción completa

**Resultado**: Ves toda la información sin perder tu posición en la lista

---

### 2. Revisar Múltiples Consumibles Rápidamente

**Escenario**: Auditoría de inventario - necesitas revisar 10 items

**Método Tradicional** (antes):
```
1. Click "View Details" → Espera carga → Revisa → Back
2. Busca siguiente item → Click "View Details" → Espera carga → Revisa → Back
3. Repite 8 veces más...
Total: ~20 clics + 10 cargas de página = ~30 segundos
```

**Método con Modal** (ahora):
```
1. Click "View Details" en primer item
2. Revisa información
3. Presiona → (flecha derecha)
4. Revisa siguiente item
5. Presiona → nuevamente
6. Repite...
Total: 1 clic + 9 flechas = ~10 segundos
```

**Ahorro**: 66% de tiempo

---

### 3. Actualizar Stock Desde el Modal

**Escenario**: Recibiste un pedido de 50 "Anillas de rosca"

**Pasos**:
1. Abre el modal de "Anillas de rosca"
2. Click en **"+ Add Stock"** (botón verde)
3. Completa el formulario:
   - Cantidad: `50`
   - Invoice: `FAC-2025-001234`
   - Supplier: `ABC Supplies Inc.`
   - Fecha: `2025-10-10`
   - Notas: `Pedido mensual octubre`
4. Click **"Update Stock"**
5. ✓ Stock actualizado
6. El modal se mantiene abierto
7. Puedes navegar al siguiente item con →

**Ventaja**: No necesitas cerrar el modal ni volver a la lista

---

### 4. Compartir un Consumible Específico

**Escenario**: Necesitas que tu colega revise el stock de "Cable DROP"

**Pasos**:
1. Abre el modal de "Cable DROP"
2. Copia la URL del navegador: 
   ```
   https://tuapp.com/admin/consumables?view=123
   ```
3. Envía el link por email/chat
4. Tu colega hace click en el link
5. El modal se abre automáticamente en "Cable DROP"

**Ventaja**: Deep linking directo al item específico

---

### 5. Imprimir QR Codes para Múltiples Items

**Escenario**: Necesitas imprimir QR codes para 5 consumibles nuevos

**Pasos**:
1. Abre el modal del primer consumible
2. Click en **"Print QR Code"**
3. Se abre ventana de impresión → Imprime
4. Presiona → para ir al siguiente
5. Click en **"Print QR Code"**
6. Repite para los 5 items

**Ventaja**: Proceso continuo sin cerrar/abrir modales

---

### 6. Ajustar Stock por Inventario Físico

**Escenario**: Hiciste conteo físico y encontraste 18 "Anillas guía" (sistema dice 20)

**Pasos**:
1. Abre modal de "Anillas guía"
2. Click en **"= Set Value"** (botón morado)
3. Ingresa: `18`
4. Notas: `Ajuste por conteo físico`
5. Click **"Update Stock"**
6. ✓ Stock corregido a 18

**Ventaja**: Ajuste directo sin cálculos

---

### 7. Navegación con Filtros Aplicados

**Escenario**: Revisar solo consumibles de categoría "Material"

**Pasos**:
1. En la lista, aplica filtro: Category = "Material"
2. Resultado: 8 items filtrados
3. Abre modal del primero
4. Usa → para navegar
5. Solo navegas entre los 8 items filtrados

**Ventaja**: Navegación respeta filtros activos

---

### 8. Uso en Dispositivo Móvil

**Escenario**: Estás en el almacén con tu tablet

**Pasos**:
1. Abre `/admin/consumables` en tablet
2. Toca un card para ver detalles
3. Modal se abre en pantalla completa
4. Scroll vertical para ver todo el contenido
5. Usa botones Previous/Next (flechas de teclado no disponibles en móvil)
6. Toca fuera del modal o X para cerrar

**Ventaja**: Experiencia optimizada para touch

---

## ⌨️ Atajos de Teclado - Ejemplos

### Ejemplo 1: Power User
```
Situación: Revisar 20 consumibles rápidamente

1. Click en primer item
2. Presiona → → → → → → → → → → (10 veces)
3. Revisaste 11 items en ~15 segundos
4. Presiona ESC para cerrar
```

### Ejemplo 2: Navegación Bidireccional
```
Situación: Comparar dos items consecutivos

1. Abre item A
2. Presiona → para ver item B
3. Presiona ← para volver a item A
4. Presiona → nuevamente para item B
5. Compara mentalmente
```

### Ejemplo 3: Salida Rápida
```
Situación: Abriste el modal por error

1. Presiona ESC
2. Modal se cierra instantáneamente
```

---

## 🎨 Casos de Uso Avanzados

### Caso 1: Auditoría de Stock Bajo

**Objetivo**: Revisar todos los items con stock bajo

**Proceso**:
1. Aplica filtro: "Low stock only" ☑️
2. Resultado: 5 items con stock bajo
3. Abre modal del primero
4. Revisa si necesita restock
5. Si sí: Click "Update Stock" → Agrega pedido
6. Presiona → para siguiente
7. Repite para los 5 items

**Tiempo estimado**: 2-3 minutos
**Antes**: 5-7 minutos

---

### Caso 2: Preparación de Pedido

**Objetivo**: Generar lista de compra para 10 items

**Proceso**:
1. Abre modal del primer item
2. Anota: Nombre, Stock actual, Mínimo
3. Presiona → para siguiente
4. Repite para 10 items
5. Presiona ESC al terminar

**Ventaja**: Navegación fluida sin perder contexto

---

### Caso 3: Verificación de QR Codes

**Objetivo**: Verificar que todos los items tengan QR code

**Proceso**:
1. Abre modal del primer item
2. Verifica que QR code esté visible
3. Si falta: Reporta o genera
4. Presiona → para siguiente
5. Repite para todos los items

**Ventaja**: Verificación rápida y sistemática

---

## 💡 Tips y Trucos

### Tip 1: Uso del Contador
```
Contador muestra: "5 of 35"

Significa:
- Estás viendo el item #5
- Hay 35 items en total (o filtrados)
- Puedes navegar 30 items más hacia adelante
- Puedes navegar 4 items hacia atrás
```

### Tip 2: URL como Bookmark
```
Guarda URLs específicas como bookmarks:

📌 Items con stock bajo:
   /admin/consumables?lowStock=true

📌 Categoría Material:
   /admin/consumables?category=Material

📌 Item específico:
   /admin/consumables?view=123
```

### Tip 3: Navegación Eficiente
```
Para revisar muchos items:

1. Usa filtros primero para reducir lista
2. Abre modal del primero
3. Usa → para navegar
4. No cierres el modal hasta terminar
```

### Tip 4: Update Stock Rápido
```
Para actualizar múltiples items:

1. Prepara información (invoices, cantidades)
2. Abre modal del primero
3. Update stock
4. Presiona → inmediatamente
5. Update stock del siguiente
6. Repite...
```

---

## 🚫 Errores Comunes y Soluciones

### Error 1: "Las flechas no funcionan"

**Causa**: El modal no está enfocado

**Solución**: 
- Haz click dentro del modal
- O cierra cualquier formulario abierto (Update Stock)

---

### Error 2: "El modal no se cierra con ESC"

**Causa**: Estás en un campo de texto

**Solución**:
- Haz click fuera del campo de texto
- Luego presiona ESC

---

### Error 3: "Perdí mi posición en la lista"

**Causa**: Esto NO debería pasar con el modal

**Verificación**:
- Cierra el modal
- Tu posición y filtros deben estar intactos
- Si no: Refresca la página (F5)

---

### Error 4: "El link compartido no funciona"

**Causa**: Falta el parámetro ?view=

**Solución**:
- Asegúrate de copiar la URL completa
- Debe incluir: `?view=123`
- Ejemplo correcto: `/admin/consumables?view=123`

---

## 📊 Comparación de Workflows

### Workflow 1: Actualizar 5 Items

| Paso | Método Anterior | Método Modal | Ahorro |
|------|----------------|--------------|--------|
| 1 | Click item 1 | Click item 1 | - |
| 2 | Espera carga (2s) | Modal abre (0.3s) | 1.7s |
| 3 | Update stock | Update stock | - |
| 4 | Click Back | Presiona → | 0.5s |
| 5 | Espera carga (2s) | Modal cambia (0.2s) | 1.8s |
| 6-20 | Repite 4 veces | Repite 4 veces | 8s |
| **Total** | **~25s** | **~10s** | **60%** |

### Workflow 2: Revisar 10 Items

| Aspecto | Método Anterior | Método Modal |
|---------|----------------|--------------|
| Clics | 20 (10 view + 10 back) | 1 (+ 9 flechas) |
| Cargas | 10 páginas completas | 10 requests ligeros |
| Tiempo | ~40 segundos | ~15 segundos |
| Contexto | Se pierde | Se mantiene |

---

## 🎯 Conclusión

El modal de consumibles transforma workflows comunes en procesos mucho más eficientes:

- ✅ **Menos clics**: 50% reducción
- ✅ **Más rápido**: 60% ahorro de tiempo
- ✅ **Mejor UX**: Contexto preservado
- ✅ **Más productivo**: Navegación fluida

**Recomendación**: Usa el modal para cualquier tarea que involucre revisar múltiples consumibles. Para ediciones profundas de un solo item, ambos métodos funcionan igual de bien.

---

**Última actualización**: Octubre 2025
