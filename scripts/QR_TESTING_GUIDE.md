# 📱 Guía de Prueba de Códigos QR del Almacén

## Cómo Probar sin Imprimir

### Opción 1: Escanear desde Pantalla (Recomendado)

1. **Abrir el archivo HTML:**
   - Abre `generate-warehouse-qr-codes.html` en tu navegador
   - Los códigos QR se generarán automáticamente

2. **Activar Modo Prueba:**
   - Click en el botón "📱 Modo Prueba"
   - Lee las instrucciones que aparecen

3. **Probar el Escaneo:**
   - Abre la aplicación en tu teléfono/tablet
   - Ve a "Mis Reservas"
   - Selecciona una reserva activa
   - Click en "Marcar como Recogida"
   - Apunta la cámara del teléfono a cualquier código QR en la pantalla del computador
   - El sistema debería reconocer el código

### Opción 2: Entrada Manual

1. **Copiar el Código:**
   - En el navegador, click en "📋 Copiar Código" bajo cualquier QR
   - O click directamente en el texto del código

2. **Usar Entrada Manual:**
   - En el scanner de la app, busca la opción "Entrada manual"
   - Pega o escribe el código copiado
   - Click en "Buscar"

## Códigos QR Disponibles para Pruebas

| Código | Ubicación | Zona |
|--------|-----------|------|
| `WH-QR-001-ENTRANCE` | Entrada Principal | General |
| `WH-QR-002-TOOLS` | Zona de Herramientas | Tools |
| `WH-QR-003-CONSUMABLES` | Zona de Consumibles | Consumables |
| `WH-QR-004-ELECTRONICS` | Zona de Electrónicos | Electronics |
| `WH-QR-005-EXIT` | Salida del Almacén | General |

## Solución de Problemas

### Los códigos QR no se generan

**Síntomas:**
- Ves un mensaje de "Cargando códigos QR..." que no desaparece
- Ves un mensaje de error sobre la librería QRCode

**Soluciones:**
1. Verifica tu conexión a internet (necesaria para cargar la librería)
2. Recarga la página (F5 o Ctrl+R)
3. Prueba con otro navegador (Chrome, Firefox, Edge)
4. Abre la consola del navegador (F12) y busca errores

### El scanner no reconoce el código en pantalla

**Síntomas:**
- La cámara se abre pero no detecta el código
- El escaneo es muy lento

**Soluciones:**
1. **Aumenta el brillo de la pantalla** donde están los códigos QR
2. **Mejora la iluminación** de la habitación
3. **Mantén la cámara estable** a unos 15-20 cm del código
4. **Limpia la lente** de la cámara del teléfono
5. **Usa entrada manual** como alternativa

### El código se escanea pero da error

**Síntomas:**
- El código se detecta pero aparece un mensaje de error
- Dice "Código QR no válido"

**Posibles causas:**
1. **La migración 011 no se aplicó:** Los códigos no están en la base de datos
2. **El código está desactivado:** Verifica en la BD que `is_active = true`
3. **Problema de red:** La validación no puede conectarse al servidor

**Verificación:**
```sql
-- Verificar que los códigos existen
SELECT * FROM warehouse_qr_codes;

-- Verificar que están activos
SELECT qr_code, is_active FROM warehouse_qr_codes;
```

## Consejos para Pruebas Efectivas

### 1. Prueba Todos los Códigos
- Escanea cada uno de los 5 códigos al menos una vez
- Verifica que todos funcionen correctamente

### 2. Prueba en Diferentes Condiciones
- Con buena iluminación
- Con poca luz
- Desde diferentes ángulos
- A diferentes distancias

### 3. Prueba con Diferentes Dispositivos
- Teléfonos Android
- iPhones
- Tablets
- Diferentes navegadores

### 4. Verifica el Registro
Después de cada escaneo exitoso, verifica en la base de datos:

```sql
-- Ver últimas reservas confirmadas con QR
SELECT 
  r.id,
  u.username,
  it.name as item_name,
  r.pickup_date,
  wq.qr_code,
  wq.location_name
FROM consumable_reservations r
JOIN users u ON r.user_id = u.id
JOIN item_types it ON r.item_type_id = it.id
LEFT JOIN warehouse_qr_codes wq ON r.warehouse_qr_code_id = wq.id
WHERE r.status = 'fulfilled'
ORDER BY r.pickup_date DESC
LIMIT 10;
```

## Flujo de Prueba Completo

### Preparación
1. ✅ Aplicar migración 011 en base de datos
2. ✅ Verificar que los 5 códigos QR existen
3. ✅ Abrir `generate-warehouse-qr-codes.html` en navegador
4. ✅ Verificar que los códigos QR se generan correctamente

### Prueba Básica
1. ✅ Crear una reserva de prueba
2. ✅ Ir a "Mis Reservas"
3. ✅ Click en "Marcar como Recogida"
4. ✅ Escanear código QR desde pantalla
5. ✅ Verificar confirmación exitosa
6. ✅ Verificar en BD que se registró el `warehouse_qr_code_id`

### Prueba de Validación
1. ✅ Intentar escanear un código QR aleatorio (no del almacén)
2. ✅ Verificar que muestra error "Código QR no válido"
3. ✅ Intentar usar entrada manual con código incorrecto
4. ✅ Verificar que muestra error apropiado

### Prueba de Reportes
1. ✅ Ir a reportes de reservas
2. ✅ Verificar que aparece la tasa de verificación QR
3. ✅ Verificar estadísticas de códigos QR
4. ✅ Verificar que se muestra qué código fue escaneado

## Después de las Pruebas

### Si Todo Funciona Correctamente
1. Imprimir los códigos QR (botón "🖨️ Imprimir Todos")
2. Plastificar cada código
3. Instalar en las ubicaciones indicadas
4. Hacer pruebas finales con códigos físicos

### Si Hay Problemas
1. Documentar el problema específico
2. Verificar logs del navegador (F12 > Console)
3. Verificar logs del servidor
4. Revisar la documentación técnica
5. Consultar `docs/WAREHOUSE_QR_VERIFICATION.md`

## Reciclaje de Códigos de Prueba

Una vez que hayas terminado las pruebas y estés listo para producción:

### Opción 1: Mantener los Mismos Códigos
- Los códigos de prueba son los mismos que usarás en producción
- Solo necesitas imprimirlos e instalarlos físicamente
- No requiere cambios en la base de datos

### Opción 2: Generar Nuevos Códigos (Opcional)
Si quieres códigos diferentes para producción:

```sql
-- Desactivar códigos de prueba
UPDATE warehouse_qr_codes 
SET is_active = false 
WHERE qr_code LIKE 'WH-QR-%';

-- Insertar nuevos códigos
INSERT INTO warehouse_qr_codes (qr_code, location_name, location_description, zone) VALUES
  ('PROD-QR-001-ENTRANCE', 'Entrada Principal', 'Código de producción', 'general'),
  -- ... etc
```

Luego actualiza el archivo HTML con los nuevos códigos.

## Checklist de Pruebas

- [ ] Códigos QR se generan en el navegador
- [ ] Los 5 códigos son visibles y escaneables
- [ ] Scanner reconoce códigos desde pantalla
- [ ] Validación acepta códigos del almacén
- [ ] Validación rechaza códigos incorrectos
- [ ] Se registra el `warehouse_qr_code_id` en BD
- [ ] Reportes muestran estadísticas de QR
- [ ] Entrada manual funciona como fallback
- [ ] Funciona en diferentes dispositivos
- [ ] Funciona con diferentes navegadores

## Recursos Adicionales

- **Documentación técnica:** `docs/WAREHOUSE_QR_VERIFICATION.md`
- **Guía de implementación:** `WAREHOUSE_QR_IMPLEMENTATION.md`
- **Guía rápida:** `QUICK_START_WAREHOUSE_QR.md`
- **Script de pruebas SQL:** `scripts/test-warehouse-qr.sql`

## Soporte

Si encuentras problemas durante las pruebas:
1. Revisa esta guía completa
2. Consulta la consola del navegador para errores
3. Verifica los logs del servidor
4. Ejecuta el script de pruebas SQL
5. Revisa la documentación técnica
