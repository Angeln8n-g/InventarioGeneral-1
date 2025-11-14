-- Script de prueba para el sistema de verificación por QR del almacén
-- Ejecutar después de aplicar la migración 011

-- ============================================
-- 1. VERIFICAR INSTALACIÓN
-- ============================================

-- Verificar que la tabla warehouse_qr_codes existe y tiene datos
SELECT 
  'warehouse_qr_codes' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN is_active THEN 1 END) as activos
FROM warehouse_qr_codes;

-- Ver todos los códigos QR instalados
SELECT 
  id,
  qr_code,
  location_name,
  zone,
  is_active
FROM warehouse_qr_codes
ORDER BY id;

-- ============================================
-- 2. VERIFICAR MODIFICACIÓN EN RESERVATIONS
-- ============================================

-- Verificar que la columna warehouse_qr_code_id existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'consumable_reservations'
  AND column_name = 'warehouse_qr_code_id';

-- ============================================
-- 3. VERIFICAR VISTA DE ESTADÍSTICAS
-- ============================================

-- Verificar que la vista warehouse_qr_scan_stats existe
SELECT 
  qr_code,
  location_name,
  zone,
  total_scans,
  scans_last_7_days,
  scans_last_30_days,
  last_scan_date
FROM warehouse_qr_scan_stats
ORDER BY id;

-- ============================================
-- 4. PRUEBA DE FUNCIONALIDAD (OPCIONAL)
-- ============================================

-- Crear una reserva de prueba (ajustar user_id e item_type_id según tu BD)
-- NOTA: Comentado por defecto, descomentar solo para pruebas

/*
INSERT INTO consumable_reservations (
  user_id,
  item_type_id,
  reserved_quantity,
  status,
  reservation_date,
  expiration_date,
  purpose
) VALUES (
  1, -- Ajustar al ID de un usuario existente
  1, -- Ajustar al ID de un item_type existente
  5,
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '3 days',
  'Prueba de sistema de verificación QR'
) RETURNING id;
*/

-- Simular confirmación de recogida con código QR
-- NOTA: Comentado por defecto, descomentar solo para pruebas
-- Reemplazar [RESERVATION_ID] con el ID de la reserva de prueba

/*
UPDATE consumable_reservations
SET 
  status = 'fulfilled',
  pickup_date = CURRENT_TIMESTAMP,
  warehouse_qr_code_id = 1 -- WH-QR-001-ENTRANCE
WHERE id = [RESERVATION_ID]
RETURNING *;
*/

-- ============================================
-- 5. VERIFICAR ESTADÍSTICAS DESPUÉS DE PRUEBA
-- ============================================

-- Ver estadísticas actualizadas (después de hacer pruebas)
/*
SELECT 
  wq.qr_code,
  wq.location_name,
  COUNT(cr.id) as total_usos,
  MAX(cr.pickup_date) as ultimo_uso
FROM warehouse_qr_codes wq
LEFT JOIN consumable_reservations cr ON cr.warehouse_qr_code_id = wq.id
GROUP BY wq.id, wq.qr_code, wq.location_name
ORDER BY total_usos DESC;
*/

-- ============================================
-- 6. CONSULTAS ÚTILES PARA ADMINISTRACIÓN
-- ============================================

-- Ver todas las reservas confirmadas con su código QR escaneado
SELECT 
  cr.id,
  u.username,
  it.name as item_name,
  cr.reserved_quantity,
  cr.pickup_date,
  wq.qr_code,
  wq.location_name as ubicacion_escaneo
FROM consumable_reservations cr
JOIN users u ON cr.user_id = u.id
JOIN item_types it ON cr.item_type_id = it.id
LEFT JOIN warehouse_qr_codes wq ON cr.warehouse_qr_code_id = wq.id
WHERE cr.status = 'fulfilled'
  AND cr.pickup_date IS NOT NULL
ORDER BY cr.pickup_date DESC
LIMIT 20;

-- Códigos QR más utilizados
SELECT 
  wq.qr_code,
  wq.location_name,
  wq.zone,
  COUNT(cr.id) as total_escaneos,
  COUNT(CASE WHEN cr.pickup_date >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as escaneos_ultima_semana
FROM warehouse_qr_codes wq
LEFT JOIN consumable_reservations cr ON cr.warehouse_qr_code_id = wq.id
GROUP BY wq.id, wq.qr_code, wq.location_name, wq.zone
ORDER BY total_escaneos DESC;

-- Reservas confirmadas sin código QR (legacy, antes de la migración)
SELECT 
  COUNT(*) as reservas_sin_qr,
  COUNT(CASE WHEN pickup_date >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as ultimos_30_dias
FROM consumable_reservations
WHERE status = 'fulfilled'
  AND warehouse_qr_code_id IS NULL;

-- ============================================
-- 7. VERIFICACIÓN DE INTEGRIDAD
-- ============================================

-- Verificar que no hay códigos QR duplicados
SELECT 
  qr_code,
  COUNT(*) as duplicados
FROM warehouse_qr_codes
GROUP BY qr_code
HAVING COUNT(*) > 1;

-- Verificar que todos los warehouse_qr_code_id referencian códigos válidos
SELECT 
  COUNT(*) as referencias_invalidas
FROM consumable_reservations cr
LEFT JOIN warehouse_qr_codes wq ON cr.warehouse_qr_code_id = wq.id
WHERE cr.warehouse_qr_code_id IS NOT NULL
  AND wq.id IS NULL;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

/*
Si todo está correcto, deberías ver:

1. ✅ 5 códigos QR en warehouse_qr_codes (todos activos)
2. ✅ La columna warehouse_qr_code_id existe en consumable_reservations
3. ✅ La vista warehouse_qr_scan_stats existe y es consultable
4. ✅ No hay códigos QR duplicados
5. ✅ No hay referencias inválidas

Si alguna verificación falla, revisa la aplicación de la migración.
*/
