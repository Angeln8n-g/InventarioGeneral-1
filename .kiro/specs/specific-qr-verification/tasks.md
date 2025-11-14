# Implementation Plan - Verificación de QR Específico

## Overview

Este plan de implementación desglosa la funcionalidad de verificación de QR específico en tareas incrementales y manejables. Cada tarea construye sobre las anteriores y termina con la integración completa del sistema.

---

## Phase 1: Database Schema ✅ COMPLETED

- [x] 1. Crear migración de base de datos

  - Crear archivo `supabase/migrations/013_specific_qr_verification.sql`
  - Agregar columna `required_qr_code_id` a `consumable_reservations`
  - Crear tabla `qr_scan_attempts` con todos los campos necesarios
  - Crear índices para optimizar consultas
  - Crear vista `qr_scan_statistics` para reportes
  - _Requirements: 1.1, 3.5, 4.1, 4.2_

- [x] 2. Actualizar tipos TypeScript de base de datos
  - Actualizar interface `ConsumableReservation` en `src/types/database.ts`
  - Agregar nuevo campo `required_qr_code_id: number | null`
  - Crear interface `QRScanAttempt` para la nueva tabla
  - Crear interface `QRScanStatistics` para la vista
  - Actualizar `UpdateReservationInput` si es necesario
  - _Requirements: 4.1, 4.2_

---

## Phase 2: Backend - Required QR Selection ✅ COMPLETED

- [x] 3. Crear endpoint para solicitar código QR requerido

  - Crear archivo `src/app/api/reservations/[id]/required-qr/route.ts`
  - Implementar autenticación y validación de permisos
  - Verificar que la reserva existe y está activa
  - Consultar códigos QR activos de la base de datos
  - Implementar selección aleatoria criptográficamente segura
  - Retornar información completa del código QR seleccionado
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.4_

- [x] 4. Crear función de selección aleatoria segura
  - Crear `src/lib/qr-selection.ts`
  - Implementar función `selectRandomQRCode()` usando `crypto.randomInt()`
  - Implementar función `getActiveQRCodes()` con caché
  - Manejar caso cuando no hay códigos activos
  - Agregar logging para debugging
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

---

## Phase 3: Backend - Validation and Logging ✅ COMPLETED

- [x] 5. Actualizar endpoint de fulfill para validar código específico

  - Modificar `src/app/api/reservations/[id]/fulfill/route.ts`
  - Aceptar nuevo parámetro `required_qr_code_id` en el body
  - Validar que `required_qr_code_id` coincida con `warehouse_qr_code_id`
  - Retornar error específico si los códigos no coinciden
  - Incluir información del código correcto en el error
  - Mantener compatibilidad hacia atrás (si no se envía `required_qr_code_id`, usar modo legacy)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Crear sistema de registro de intentos de escaneo

  - Crear `src/lib/qr-scan-logger.ts`
  - Implementar función `logScanAttempt()` para registrar en `qr_scan_attempts`
  - Registrar intentos exitosos y fallidos
  - Incluir información de IP y user agent
  - Implementar función `getRecentFailedAttempts()` para rate limiting
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Implementar rate limiting para intentos fallidos
  - Agregar validación en endpoint de fulfill
  - Limitar a 5 intentos fallidos por reserva en 5 minutos
  - Retornar error específico cuando se excede el límite
  - Incluir tiempo de espera en el mensaje de error
  - _Requirements: 3.1, 4.4_

---

## Phase 4: Frontend - UI Components ✅ COMPLETED

- [x] 8. Crear componente para mostrar código QR requerido

  - Crear `src/components/reservations/RequiredQRBanner.tsx`
  - Mostrar icono de la zona (🚪, 🔧, 📦, 💻)
  - Mostrar nombre de ubicación prominentemente
  - Mostrar descripción de la ubicación
  - Aplicar estilos visuales llamativos
  - Hacer responsive para móvil y desktop
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1_

- [x] 9. Actualizar QRScanner para mostrar código requerido
  - Modificar `src/components/shared/QRScanner.tsx`
  - Agregar prop `requiredQR` opcional
  - Integrar `RequiredQRBanner` cuando `requiredQR` está presente
  - Mantener banner visible durante todo el escaneo
  - Agregar opción para "Ver ubicación nuevamente"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.5_

---

## Phase 5: Frontend - Integration ✅ COMPLETED

- [x] 10. Actualizar MyReservationsModal para solicitar código requerido

  - Modificar `src/components/reservations/MyReservationsModal.tsx`
  - Agregar estado para `requiredQR`
  - Agregar estado para `isLoadingQR`
  - Implementar función `fetchRequiredQR()` que llama al nuevo endpoint
  - Llamar a `fetchRequiredQR()` antes de abrir el scanner
  - Mostrar loading state mientras se obtiene el código requerido
  - _Requirements: 1.1, 1.2, 1.3, 7.1_

- [x] 11. Implementar validación de código escaneado en frontend

  - En `handleWarehouseScan()` de `MyReservationsModal`
  - Validar código QR escaneado contra el endpoint de validación
  - Comparar `scanned_qr_code_id` con `required_qr_code_id`
  - Si no coinciden, mostrar error específico
  - Si coinciden, proceder con fulfill
  - Pasar ambos IDs al endpoint de fulfill
  - _Requirements: 3.1, 3.2, 3.3, 6.2, 6.3_

- [x] 12. Implementar manejo de errores y feedback visual
  - Mostrar ubicación escaneada vs ubicación requerida en error
  - Agregar vibración de error cuando código es incorrecto
  - Agregar vibración de éxito cuando código es correcto
  - Implementar animaciones de transición
  - Permitir reintentar sin cerrar el modal
  - _Requirements: 3.5, 7.1, 7.2, 7.3, 7.4_

---

## Phase 6: Entry Manual Support ✅ COMPLETED

- [x] 13. Actualizar entrada manual para validar código específico
  - Modificar sección de entrada manual en `QRScanner`
  - Mostrar hint del código correcto cuando requiredQR está presente
  - Validación se realiza en backend (mismo flujo que escaneo)
  - Registrar intento manual en logs (ya implementado en fulfill endpoint)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

## Phase 7: Reporting and Statistics

- [x] 14. Actualizar operaciones de reportes de reservas

  - Modificar `src/lib/reports/reservation-reports.ts`
  - Agregar función `getQRScanStatistics()` que consulta la vista `qr_scan_statistics`
  - Agregar métricas de códigos QR requeridos vs escaneados
  - Calcular tasa de éxito de escaneo por código QR
  - Agregar estadísticas de intentos fallidos por código QR
  - Incluir códigos QR más problemáticos (mayor tasa de fallo)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 15. Actualizar tipos de reportes

  - Modificar `src/types/reports.ts`
  - Agregar campos a `ReservationMetrics`: `qrScanSuccessRate`, `totalScanAttempts`, `failedScanAttempts`
  - Crear interface `QRScanAttemptData` con campos: `qr_code_id`, `location_name`, `total_attempts`, `successful_scans`, `failed_scans`, `success_rate`
  - Agregar campo `qrScanStats: QRScanAttemptData[]` a `ReservationReportData`
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 16. Crear endpoint de reportes de reservas

  - Crear `src/app/api/admin/reports/reservations/route.ts`
  - Implementar autenticación y validación de rol admin
  - Incluir datos de `qr_scan_attempts` en reportes usando funciones de Phase 7 Task 14
  - Agregar filtro opcional por código QR requerido
  - Agregar métricas de tasa de éxito de escaneo
  - Retornar datos completos de reservas con estadísticas de QR
  - _Requirements: 8.4, 8.5_

---

## Phase 8: Error Handling and Edge Cases

- [x] 17. Implementar manejo de códigos QR inactivos

  - En endpoint `required-qr`, verificar que hay códigos activos (ya implementado)
  - Si no hay códigos activos, retornar error específico (ya implementado)
  - Proporcionar fallback de entrada manual (ya disponible en UI)
  - _Requirements: 5.2, 5.3_
  - **Note:** Notificación a administradores puede agregarse como mejora futura

- [-] 18. Implementar timeout de escaneo

  - Agregar timer de 5 minutos en `MyReservationsModal`
  - Mostrar advertencia cuando se acerca el timeout (ej: a los 4 minutos)
  - Ofrecer opciones: ver ubicación nuevamente o cancelar
  - Limpiar timer al cerrar modal o completar escaneo
  - _Requirements: 7.5_

- [ ] 19. Implementar expiración de asignación de código QR
  - En endpoint de fulfill, validar que la asignación no sea muy antigua
  - Consultar `updated_at` de la reserva para verificar cuándo se asignó el QR
  - Rechazar si han pasado más de 30 minutos desde la asignación
  - Retornar error específico con código `QR_ASSIGNMENT_EXPIRED`
  - Sugerir al usuario solicitar un nuevo código QR
  - Registrar expiración en logs usando `logScanAttempt` con error_message
  - _Requirements: 3.1, 4.4_

---

## Phase 9: Testing (Optional)

- [ ]\* 20. Escribir tests unitarios de backend

  - Test de selección aleatoria de código QR
  - Test de validación de código correcto vs incorrecto
  - Test de registro de intentos fallidos
  - Test de rate limiting
  - Test de manejo de códigos inactivos
  - _Requirements: All_

- [ ]\* 21. Escribir tests unitarios de frontend

  - Test de `RequiredQRBanner` component
  - Test de `QRScanner` con código requerido
  - Test de validación en `MyReservationsModal`
  - Test de manejo de errores
  - Test de entrada manual
  - _Requirements: All_

- [ ]\* 22. Escribir tests de integración
  - Test de flujo completo: solicitar QR → escanear correcto → confirmar
  - Test de flujo con código incorrecto
  - Test de flujo con entrada manual
  - Test de rate limiting end-to-end
  - Test de expiración de asignación
  - _Requirements: All_

---

## Phase 10: Documentation and Deployment

- [ ] 23. Actualizar documentación técnica

  - Actualizar `docs/WAREHOUSE_QR_VERIFICATION.md`
  - Documentar nuevo flujo de verificación específica
  - Agregar ejemplos de uso de nuevos endpoints
  - Documentar estructura de `qr_scan_attempts` y vista `qr_scan_statistics`
  - Agregar guía de troubleshooting para errores comunes
  - _Requirements: All_

- [ ] 24. Crear guía de migración

  - Crear `docs/SPECIFIC_QR_MIGRATION_GUIDE.md`
  - Documentar pasos de migración de BD (ejecutar migration 013)
  - Documentar verificación post-migración
  - Documentar plan de rollback (columnas nullable permiten rollback sin pérdida de datos)
  - Incluir checklist de verificación
  - _Requirements: All_

- [ ] 25. Aplicar migración en base de datos

  - Hacer backup de la base de datos antes de aplicar
  - Ejecutar migración 013 en Supabase
  - Verificar que columna `required_qr_code_id` se agregó correctamente
  - Verificar que tabla `qr_scan_attempts` se creó con todos los campos
  - Verificar índices usando queries de verificación en la migración
  - Verificar vista `qr_scan_statistics` retorna datos correctos
  - _Requirements: All_

- [ ] 26. Desplegar y monitorear
  - Desplegar cambios a producción (backend y frontend juntos)
  - Monitorear logs de errores en primeras 24 horas
  - Verificar que reservas nuevas reciben `required_qr_code_id`
  - Verificar que intentos de escaneo se registran en `qr_scan_attempts`
  - Verificar que rate limiting funciona correctamente
  - Recopilar feedback de usuarios sobre claridad de mensajes
  - _Requirements: All_

---

## Notes

- **Phases 1-6 están completadas** - La funcionalidad core está implementada y funcional
- **Phase 7 (Reporting)** es la siguiente prioridad para visibilidad de métricas
- **Phase 8** mejora la robustez con timeouts y expiración de asignaciones
- **Phase 9 (Testing)** es opcional pero recomendado para producción
- **Phase 10** es crítico antes de considerar la feature completa
- El sistema es compatible hacia atrás - reservas sin `required_qr_code_id` funcionan en modo legacy
- No se requiere feature flag ya que la compatibilidad hacia atrás está garantizada

## Estimated Timeline (Remaining Work)

- **Phase 7 (Reporting):** 3-4 horas
- **Phase 8 (Error Handling):** 2-3 horas
- **Phase 9 (Testing - Optional):** 6-8 horas
- **Phase 10 (Documentation):** 2-3 horas

**Total Remaining Time:** 7-10 horas (sin tests) o 13-18 horas (con tests)

## Success Criteria

- ✅ Usuario ve claramente qué código QR debe escanear
- ✅ Sistema rechaza códigos QR incorrectos con mensaje útil
- ✅ Sistema acepta solo el código QR específicamente solicitado
- ✅ Todos los intentos (exitosos y fallidos) se registran
- ⏳ Reportes muestran estadísticas de uso y tasa de éxito (Phase 7)
- ✅ Rate limiting previene abuso
- ✅ Sistema es compatible hacia atrás
- ⏳ Documentación está completa y actualizada (Phase 10)
