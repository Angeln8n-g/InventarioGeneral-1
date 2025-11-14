# Implementation Plan

- [x] 1. Corregir tipos base y utilidades

  - Corregir errores de tipo `any` en archivos fundamentales que son usados por todo el proyecto
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Corregir src/types/database.ts

  - Reemplazar los 5 usos de `any` con tipos específicos en las interfaces
  - Eliminar la variable no utilizada `UpdateNotificationInput` de src/lib/supabase-client.ts
  - _Requirements: 1.1, 1.2, 2.2_

- [x] 1.2 Corregir src/lib/supabase.ts

  - Reemplazar los 4 usos de `any` en funciones de consulta con tipos específicos de Supabase
  - Usar tipos `PostgrestError` y tipos de respuesta apropiados
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.3 Corregir src/lib/auth-middleware.ts

  - Reemplazar los 2 usos de `any` en bloques catch con `unknown`
  - Agregar manejo de errores tipado correctamente
  - _Requirements: 1.1, 1.3_

- [x] 1.4 Corregir src/services/api.ts

  - Reemplazar los 12 usos de `any` con tipos específicos de respuesta
  - Usar genéricos apropiados para funciones de API
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.5 Corregir src/hooks/useAuth.ts

  - Reemplazar el uso de `any` en bloque catch con `unknown`
  - _Requirements: 1.1, 1.3_

- [x] 2. Corregir API routes de autenticación

  - Corregir errores de tipo en las rutas de autenticación que son críticas para el funcionamiento del sistema
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 2.1 Corregir src/app/api/auth/login/route.ts

  - Eliminar import no usado de `supabase`
  - Eliminar variable no usada `password_hash`
  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3, 2.1, 2.2_

- [x] 2.2 Corregir src/app/api/auth/logout/route.ts

  - Reemplazar los 2 usos de `any` en parámetros y bloques catch
  - _Requirements: 1.1, 1.3_

- [x] 2.3 Corregir src/app/api/auth/profile/route.ts

  - Reemplazar los 2 usos de `any` con tipos apropiados
  - Eliminar variables no usadas `password_hash` y `jwtError`
  - _Requirements: 1.1, 1.3, 2.2_

- [x] 2.4 Corregir src/app/api/auth/register/route.ts

  - Reemplazar `any` en bloque catch con `unknown`
  - Renombrar variable no usada `_` a `_data` o eliminarla
  - _Requirements: 1.3, 2.2, 2.4_

- [x] 3. Corregir API routes de admin - tools

  - Corregir errores en las rutas de administración de herramientas
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 3.1 Corregir src/app/api/admin/tools/route.ts

  - Eliminar imports no usados: `updateToolInstanceSchema`, `SUCCESS_MESSAGES`, `PERMISSIONS`
  - Reemplazar los 3 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3, 2.1_

- [x] 3.2 Corregir src/app/api/admin/tools/[id]/adjust/route.ts

  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3_

- [x] 3.3 Corregir src/app/api/admin/tools/[id]/qr-image/route.ts

  - Reemplazar los 2 usos de `any` con tipos apropiados
  - _Requirements: 1.1, 1.3_

- [x] 4. Corregir API routes de admin - consumables

  - Corregir errores en las rutas de administración de consumibles
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 4.1 Corregir src/app/api/admin/consumables/route.ts

  - Eliminar parámetro no usado `authContext`
  - Reemplazar los 4 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3, 2.2_

- [x] 4.2 Corregir src/app/api/admin/consumables/backorders/route.ts

  - Eliminar imports no usados: `SUCCESS_MESSAGES`, `authContext`
  - Eliminar variable no usada `updatedStock`
  - Reemplazar los 7 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [ ] 5. Corregir API routes de admin - otros

  - Corregir errores en otras rutas de administración
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 5.1 Corregir src/app/api/admin/item-types/route.ts

  - Eliminar imports no usados: `updateItemTypeSchema`, `SUCCESS_MESSAGES`, `authContext`
  - Reemplazar los 2 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 5.2 Corregir src/app/api/admin/notifications/system/route.ts

  - Reemplazar los 4 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3_

- [ ] 5.3 Corregir src/app/api/admin/overdue/route.ts

  - Eliminar parámetro no usado `authContext`
  - Reemplazar los 4 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3, 2.2_

- [ ] 6. Corregir API routes de usuario

  - Corregir errores en las rutas de API para usuarios
  - _Requirements: 1.1, 1.3, 2.2_

- [ ] 6.1 Corregir src/app/api/loans/route.ts

  - Reemplazar los 4 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3_

- [ ] 6.2 Corregir src/app/api/loans/my/route.ts

  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3_

- [ ] 6.3 Corregir src/app/api/loans/[id]/return/route.ts

  - Reemplazar los 2 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3_

- [ ] 6.4 Corregir src/app/api/consumables/route.ts

  - Eliminar parámetro no usado `authContext`
  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3, 2.2_

- [ ] 6.5 Corregir src/app/api/consumables/request/route.ts

  - Eliminar import no usado `SUCCESS_MESSAGES`
  - Reemplazar los 4 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 6.6 Corregir src/app/api/consumables/request/[id]/route.ts

  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3_

- [ ] 6.7 Corregir src/app/api/notifications/route.ts

  - Reemplazar los 2 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3_

- [ ] 6.8 Corregir src/app/api/tools/route.ts

  - Eliminar import no usado `PERMISSIONS`
  - Reemplazar los 3 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 6.9 Corregir src/app/api/tools/qr/[uuid]/route.ts

  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3_

- [ ] 6.10 Corregir src/app/api/audit/logs/route.ts

  - Eliminar import no usado `PERMISSIONS`
  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3, 2.1_

- [ ] 7. Corregir páginas de usuario

  - Corregir errores en las páginas de interfaz de usuario
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3_

- [ ] 7.1 Corregir src/app/login/page.tsx

  - Eliminar import no usado `useState`
  - Reemplazar `any` en bloque catch con `unknown`
  - _Requirements: 1.3, 2.1_

- [ ] 7.2 Corregir src/app/dashboard/page.tsx

  - Reemplazar `any` en parámetro de función con tipo específico
  - _Requirements: 1.1_

- [ ] 7.3 Corregir src/app/my-loans/page.tsx

  - Reemplazar los 3 usos de `any` con tipos específicos
  - Escapar apóstrofe en texto JSX
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

- [ ] 7.4 Corregir src/app/my-requests/page.tsx

  - Reemplazar los 2 usos de `any` con tipos específicos
  - Escapar apóstrofes y comillas en texto JSX (4 instancias)
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

- [ ] 7.5 Corregir src/app/consumables/page.tsx

  - Reemplazar los 2 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3_

- [ ] 7.6 Corregir src/app/scanner/page.tsx

  - Reemplazar los 8 usos de `any` con tipos específicos
  - Eliminar variable no usada `data`
  - Agregar dependencia faltante `startScanner` a useEffect o memoizar la función
  - Escapar apóstrofe en texto JSX
  - _Requirements: 1.1, 1.3, 2.2, 3.1, 3.2, 4.1, 4.2_

- [x] 8. Corregir páginas de admin

  - Corregir errores en las páginas de administración
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 8.1 Corregir src/app/admin/audit/page.tsx

  - Reemplazar los 5 usos de `any` con tipos específicos
  - _Requirements: 1.1, 1.3_

- [x] 8.2 Corregir src/app/admin/consumables/page.tsx

  - Reemplazar los 4 usos de `any` con tipos específicos
  - Eliminar función no usada `processBackorders`
  - _Requirements: 1.1, 1.3, 2.2_

- [x] 8.3 Corregir src/app/admin/dashboard/page.tsx

  - Eliminar variables no usadas `activeTab` y `setActiveTab`
  - _Requirements: 2.2_

- [ ] 9. Corregir componentes

  - Corregir errores en componentes reutilizables
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [ ] 9.1 Corregir src/components/layout/Header.tsx

  - Eliminar import no usado `Button`
  - _Requirements: 2.1_

- [ ] 9.2 Corregir src/components/layout/MobileNavigation.tsx

  - Eliminar import no usado `useState`
  - Eliminar variable no usada `user`
  - _Requirements: 2.1, 2.2_

- [ ] 9.3 Corregir src/components/auth/RoleGuard.tsx

  - Eliminar variable no usada `requireAll`
  - _Requirements: 2.2_

- [ ] 9.4 Corregir src/features/auth/ProtectedRoute.tsx

  - Escapar apóstrofes en texto JSX (2 instancias)
  - _Requirements: 3.1, 3.2_

- [ ] 9.5 Corregir src/features/auth/authSlice.ts

  - Eliminar imports no usados: `PayloadAction`, `AuthUser`
  - _Requirements: 2.1_

- [x] 10. Actualizar configuración de Next.js

  - Actualizar next.config.js para eliminar warnings de configuración obsoleta
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10.1 Actualizar next.config.js

  - Eliminar opción obsoleta `swcMinify` (ahora es default en Next.js 15)
  - Eliminar opción obsoleta `experimental.appDir` (ahora es default)
  - Agregar `outputFileTracingRoot` para resolver warning de múltiples lockfiles
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 11. Verificación final y build

  - Ejecutar build completo y verificar que no hay errores
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 11.1 Ejecutar build y verificar errores

  - Ejecutar `npx next build` para compilación completa
  - Verificar que no hay errores de TypeScript
  - Verificar que no hay errores de ESLint
  - Confirmar que el build se completa exitosamente
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_
