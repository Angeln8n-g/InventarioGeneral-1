# ✅ Testing Checklist: Modal de Consumibles

## 🎯 Objetivo

Este checklist te ayudará a verificar que todas las funcionalidades del modal estén funcionando correctamente antes de usar en producción.

---

## 📋 Pre-requisitos

- [ ] Proyecto compilado sin errores (`npm run build`)
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Usuario con permisos de administrador
- [ ] Al menos 5 consumibles en la base de datos
- [ ] Navegador moderno (Chrome, Firefox, Safari, Edge)

---

## 🧪 Tests Funcionales

### 1. Apertura y Cierre del Modal

#### Test 1.1: Abrir modal con click
- [ ] Ve a `/admin/consumables`
- [ ] Click en "View Details" de cualquier consumible
- [ ] ✓ Modal se abre
- [ ] ✓ Contenido se carga
- [ ] ✓ URL cambia a `?view=123`

#### Test 1.2: Cerrar modal con botón X
- [ ] Con modal abierto, click en X (esquina superior derecha)
- [ ] ✓ Modal se cierra
- [ ] ✓ URL vuelve a `/admin/consumables`
- [ ] ✓ Lista mantiene posición

#### Test 1.3: Cerrar modal con ESC
- [ ] Abre modal
- [ ] Presiona tecla ESC
- [ ] ✓ Modal se cierra
- [ ] ✓ URL se limpia

#### Test 1.4: Cerrar modal con click fuera
- [ ] Abre modal
- [ ] Click en el área oscura fuera del modal
- [ ] ✓ Modal se cierra
- [ ] ✓ URL se limpia

---

### 2. Navegación Entre Items

#### Test 2.1: Botón Next
- [ ] Abre modal del primer item
- [ ] Click en botón "Next"
- [ ] ✓ Modal muestra siguiente item
- [ ] ✓ URL actualiza a nuevo ID
- [ ] ✓ Contador incrementa (ej: "2 of 35")

#### Test 2.2: Botón Previous
- [ ] Con modal en segundo item
- [ ] Click en botón "Previous"
- [ ] ✓ Modal muestra item anterior
- [ ] ✓ URL actualiza a ID anterior
- [ ] ✓ Contador decrementa (ej: "1 of 35")

#### Test 2.3: Flecha derecha (→)
- [ ] Abre modal
- [ ] Presiona tecla flecha derecha
- [ ] ✓ Navega al siguiente item
- [ ] ✓ URL actualiza

#### Test 2.4: Flecha izquierda (←)
- [ ] Con modal abierto (no en primer item)
- [ ] Presiona tecla flecha izquierda
- [ ] ✓ Navega al item anterior
- [ ] ✓ URL actualiza

#### Test 2.5: Límites de navegación
- [ ] Abre modal del primer item
- [ ] ✓ Botón "Previous" está deshabilitado
- [ ] ✓ Flecha izquierda no hace nada
- [ ] Navega hasta el último item
- [ ] ✓ Botón "Next" está deshabilitado
- [ ] ✓ Flecha derecha no hace nada

---

### 3. Deep Linking

#### Test 3.1: Abrir con URL directa
- [ ] Copia URL con `?view=123`
- [ ] Pega en nueva pestaña
- [ ] ✓ Página carga
- [ ] ✓ Modal se abre automáticamente
- [ ] ✓ Muestra el consumible correcto

#### Test 3.2: Refresh con modal abierto
- [ ] Abre modal
- [ ] Presiona F5 (refresh)
- [ ] ✓ Página recarga
- [ ] ✓ Modal se abre automáticamente
- [ ] ✓ Muestra el mismo consumible

#### Test 3.3: Compartir URL
- [ ] Abre modal
- [ ] Copia URL del navegador
- [ ] Envía a otro usuario (o abre en modo incógnito)
- [ ] ✓ Modal se abre en el item correcto

---

### 4. Visualización de Datos

#### Test 4.1: Información básica
- [ ] Abre modal de cualquier consumible
- [ ] ✓ Nombre del item visible
- [ ] ✓ Stock actual visible
- [ ] ✓ Mínimo threshold visible
- [ ] ✓ Unidad de medida visible
- [ ] ✓ Categoría visible (si existe)
- [ ] ✓ Descripción visible (si existe)

#### Test 4.2: Estados de stock
- [ ] Abre item con stock normal
- [ ] ✓ Número en verde
- [ ] ✓ Mensaje "In Stock"
- [ ] Abre item con stock bajo
- [ ] ✓ Número en amarillo
- [ ] ✓ Mensaje "Low Stock"
- [ ] ✓ Alerta amarilla visible
- [ ] Abre item sin stock
- [ ] ✓ Número en rojo
- [ ] ✓ Mensaje "Out of Stock"
- [ ] ✓ Alerta roja visible

#### Test 4.3: QR Code
- [ ] Abre modal
- [ ] ✓ QR code se genera y muestra
- [ ] ✓ Valor del QR code visible
- [ ] ✓ Mensaje informativo presente

#### Test 4.4: Fechas
- [ ] Verifica "Added" date
- [ ] ✓ Fecha formateada correctamente
- [ ] Verifica "Last Updated" date
- [ ] ✓ Fecha formateada correctamente

---

### 5. Update Stock

#### Test 5.1: Abrir formulario Add Stock
- [ ] Click en "Update Stock" o "+ Add Stock"
- [ ] ✓ Formulario se abre
- [ ] ✓ Muestra stock actual
- [ ] ✓ Campos visibles: Quantity, Invoice, Supplier, Date, Notes

#### Test 5.2: Validación de campos
- [ ] Intenta enviar sin cantidad
- [ ] ✓ Error: "Please enter a valid number"
- [ ] Ingresa cantidad negativa en "Add Stock"
- [ ] ✓ Error apropiado
- [ ] Ingresa cantidad sin invoice
- [ ] ✓ Error: "Invoice number is required"

#### Test 5.3: Add Stock exitoso
- [ ] Abre formulario "+ Add Stock"
- [ ] Ingresa: Quantity=10, Invoice="FAC-001"
- [ ] Click "Update Stock"
- [ ] ✓ Mensaje de éxito aparece
- [ ] ✓ Stock se actualiza en el modal
- [ ] ✓ Formulario se cierra
- [ ] ✓ Modal permanece abierto

#### Test 5.4: Adjust Stock (positivo)
- [ ] Click en "± Adjust"
- [ ] Ingresa: Quantity=5, Invoice="FAC-002"
- [ ] Click "Update Stock"
- [ ] ✓ Stock aumenta en 5
- [ ] ✓ Mensaje de éxito

#### Test 5.5: Adjust Stock (negativo)
- [ ] Click en "± Adjust"
- [ ] Ingresa: Quantity=-3
- [ ] Click "Update Stock"
- [ ] ✓ Stock disminuye en 3
- [ ] ✓ No requiere invoice (es negativo)

#### Test 5.6: Set Stock
- [ ] Click en "= Set Value"
- [ ] Ingresa: Quantity=50
- [ ] Click "Update Stock"
- [ ] ✓ Stock se establece en 50 exactamente

#### Test 5.7: Cancelar update
- [ ] Abre formulario de update
- [ ] Click "Cancel"
- [ ] ✓ Formulario se cierra
- [ ] ✓ No se realizan cambios

---

### 6. QR Code Actions

#### Test 6.1: Download QR Code
- [ ] Abre modal
- [ ] Click "Download QR Code"
- [ ] ✓ Archivo PNG se descarga
- [ ] ✓ Nombre del archivo incluye nombre del item
- [ ] Abre archivo descargado
- [ ] ✓ QR code es legible

#### Test 6.2: Print QR Code
- [ ] Abre modal
- [ ] Click "Print QR Code"
- [ ] ✓ Ventana de impresión se abre
- [ ] ✓ Preview muestra QR code
- [ ] ✓ Incluye nombre del item
- [ ] ✓ Incluye información adicional
- [ ] Cancela impresión
- [ ] ✓ Ventana se cierra

---

### 7. Filtros y Contexto

#### Test 7.1: Navegación con filtros
- [ ] Aplica filtro: Category = "Material"
- [ ] Resultado: X items filtrados
- [ ] Abre modal del primero
- [ ] Navega con → varias veces
- [ ] ✓ Solo navega entre items filtrados
- [ ] ✓ Contador refleja items filtrados (ej: "3 of 8")

#### Test 7.2: Preservación de scroll
- [ ] Scroll down en la lista
- [ ] Abre modal
- [ ] Cierra modal
- [ ] ✓ Posición de scroll se mantiene

#### Test 7.3: Preservación de filtros
- [ ] Aplica múltiples filtros
- [ ] Abre modal
- [ ] Cierra modal
- [ ] ✓ Filtros siguen aplicados

---

### 8. Loading States

#### Test 8.1: Loading inicial
- [ ] Abre modal (con network throttling si es posible)
- [ ] ✓ Spinner de carga visible
- [ ] ✓ Mensaje "Loading..." visible
- [ ] Espera a que cargue
- [ ] ✓ Contenido aparece

#### Test 8.2: Loading al navegar
- [ ] Abre modal
- [ ] Navega rápidamente con →
- [ ] ✓ Loading state breve visible (si conexión lenta)
- [ ] ✓ Contenido se actualiza

#### Test 8.3: Loading en update stock
- [ ] Abre formulario update
- [ ] Click "Update Stock"
- [ ] ✓ Botón muestra "Updating..."
- [ ] ✓ Botón está deshabilitado
- [ ] Espera respuesta
- [ ] ✓ Botón vuelve a normal

---

## 📱 Tests Responsive

### 9. Desktop (1920x1080)

- [ ] Abre modal
- [ ] ✓ Modal tamaño apropiado
- [ ] ✓ Contenido en 2 columnas (info + QR)
- [ ] ✓ Todo el contenido visible sin scroll
- [ ] ✓ Botones bien espaciados

### 10. Tablet (768x1024)

- [ ] Abre modal en tablet
- [ ] ✓ Modal se adapta al ancho
- [ ] ✓ Columnas se reorganizan si es necesario
- [ ] ✓ Touch funciona correctamente
- [ ] ✓ Botones táctiles suficientemente grandes

### 11. Mobile (375x667)

- [ ] Abre modal en móvil
- [ ] ✓ Modal ocupa casi toda la pantalla
- [ ] ✓ Contenido en 1 columna
- [ ] ✓ Scroll vertical funciona
- [ ] ✓ Botones accesibles
- [ ] ✓ No hay elementos cortados

---

## 🎨 Tests de UI/UX

### 12. Dark Mode

- [ ] Activa dark mode
- [ ] Abre modal
- [ ] ✓ Colores apropiados para dark mode
- [ ] ✓ Contraste adecuado
- [ ] ✓ Texto legible
- [ ] ✓ Botones visibles

### 13. Light Mode

- [ ] Activa light mode
- [ ] Abre modal
- [ ] ✓ Colores apropiados para light mode
- [ ] ✓ Contraste adecuado
- [ ] ✓ Texto legible

### 14. Animaciones

- [ ] Abre modal
- [ ] ✓ Transición suave (si implementada)
- [ ] Cierra modal
- [ ] ✓ Transición suave (si implementada)
- [ ] Navega entre items
- [ ] ✓ Cambio fluido

---

## ♿ Tests de Accesibilidad

### 15. Keyboard Navigation

#### Test 15.1: Tab navigation
- [ ] Abre modal
- [ ] Presiona Tab repetidamente
- [ ] ✓ Focus se mueve entre elementos interactivos
- [ ] ✓ Focus visible (outline)
- [ ] ✓ No sale del modal (focus trap)

#### Test 15.2: Shift+Tab
- [ ] Con modal abierto
- [ ] Presiona Shift+Tab
- [ ] ✓ Focus se mueve hacia atrás
- [ ] ✓ Focus trap funciona

#### Test 15.3: Enter en botones
- [ ] Focus en botón "Update Stock"
- [ ] Presiona Enter
- [ ] ✓ Formulario se abre

### 16. Screen Reader (Opcional)

- [ ] Activa screen reader (NVDA, JAWS, VoiceOver)
- [ ] Abre modal
- [ ] ✓ Título del modal se anuncia
- [ ] ✓ Contenido es navegable
- [ ] ✓ Botones tienen labels apropiados

---

## 🔄 Tests de Integración

### 17. Actualización de Lista

#### Test 17.1: Update stock refleja en lista
- [ ] Nota el stock actual en la lista
- [ ] Abre modal
- [ ] Actualiza stock (+10)
- [ ] Cierra modal
- [ ] ✓ Stock en la lista se actualizó

#### Test 17.2: Múltiples updates
- [ ] Abre modal
- [ ] Update stock 3 veces seguidas
- [ ] ✓ Cada update se refleja
- [ ] ✓ No hay errores

### 18. Navegación del Browser

#### Test 18.1: Browser back button
- [ ] Abre modal
- [ ] Click en botón "Back" del navegador
- [ ] ✓ Modal se cierra
- [ ] ✓ Vuelves a la lista

#### Test 18.2: Browser forward button
- [ ] Después de Test 18.1
- [ ] Click en botón "Forward" del navegador
- [ ] ✓ Modal se abre nuevamente

---

## 🐛 Tests de Edge Cases

### 19. Casos Extremos

#### Test 19.1: Item sin descripción
- [ ] Abre modal de item sin descripción
- [ ] ✓ Modal se muestra correctamente
- [ ] ✓ No hay espacios vacíos raros

#### Test 19.2: Item sin categoría
- [ ] Abre modal de item sin categoría
- [ ] ✓ Modal se muestra correctamente
- [ ] ✓ Campo de categoría no aparece o muestra "N/A"

#### Test 19.3: Nombre muy largo
- [ ] Abre modal de item con nombre largo
- [ ] ✓ Nombre se muestra completo o truncado apropiadamente
- [ ] ✓ No rompe el layout

#### Test 19.4: Stock = 0
- [ ] Abre modal de item con stock 0
- [ ] ✓ Muestra "0" en rojo
- [ ] ✓ Alerta "Out of Stock" visible
- [ ] ✓ Puede actualizar stock normalmente

#### Test 19.5: Solo 1 item en lista
- [ ] Filtra para que solo quede 1 item
- [ ] Abre modal
- [ ] ✓ Ambos botones Previous/Next deshabilitados
- [ ] ✓ Contador muestra "1 of 1"

---

## 🚀 Tests de Performance

### 20. Velocidad

#### Test 20.1: Tiempo de apertura
- [ ] Mide tiempo desde click hasta modal visible
- [ ] ✓ Menos de 1 segundo en conexión normal
- [ ] ✓ Menos de 2 segundos en conexión lenta

#### Test 20.2: Navegación rápida
- [ ] Presiona → rápidamente 10 veces
- [ ] ✓ No hay lag significativo
- [ ] ✓ No hay errores en consola

#### Test 20.3: Múltiples aperturas
- [ ] Abre y cierra modal 10 veces seguidas
- [ ] ✓ No hay degradación de performance
- [ ] ✓ No hay memory leaks (verifica en DevTools)

---

## 📊 Resumen de Testing

### Estadísticas

- **Total de tests**: ~80
- **Tiempo estimado**: 30-45 minutos
- **Prioridad alta**: Tests 1-8 (funcionalidad core)
- **Prioridad media**: Tests 9-16 (responsive y accesibilidad)
- **Prioridad baja**: Tests 17-20 (edge cases y performance)

### Criterios de Aprobación

Para considerar el modal listo para producción:

- ✅ **100% de tests de prioridad alta** deben pasar
- ✅ **90% de tests de prioridad media** deben pasar
- ✅ **80% de tests de prioridad baja** deben pasar
- ✅ **0 errores críticos** en consola
- ✅ **0 warnings de accesibilidad** críticos

---

## 🐛 Reporte de Bugs

Si encuentras algún problema, documenta:

1. **Descripción**: ¿Qué pasó?
2. **Pasos para reproducir**: ¿Cómo llegaste ahí?
3. **Resultado esperado**: ¿Qué debería pasar?
4. **Resultado actual**: ¿Qué pasó realmente?
5. **Navegador/Dispositivo**: ¿Dónde ocurrió?
6. **Screenshots**: Si es posible

---

## ✅ Sign-off

Una vez completado el testing:

- [ ] Todos los tests críticos pasaron
- [ ] Bugs documentados y priorizados
- [ ] Performance aceptable
- [ ] Accesibilidad verificada
- [ ] Listo para producción

**Testeado por**: _______________
**Fecha**: _______________
**Versión**: 1.0.0
**Estado**: ⬜ APROBADO / ⬜ REQUIERE CAMBIOS

---

**Última actualización**: Octubre 2025
