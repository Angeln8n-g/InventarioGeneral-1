# Plan de Implementación: Sistema de Gestión de Permisos Dinámico

## Descripción General

Este plan implementa el sistema de permisos dinámico que reemplaza los permisos hardcodeados actuales. El proyecto usa Next.js 15, React 19, Supabase (PostgreSQL), Redux Toolkit y Tailwind CSS. La implementación mantiene compatibilidad con el código existente.

## Estado: ✅ COMPLETADO

Todas las tareas han sido implementadas exitosamente. El sistema de permisos dinámico está completamente funcional.

**Última verificación:** 27 de enero de 2026 - Todos los archivos verificados y funcionando correctamente.

## Tareas Completadas

- [x] 1. Configurar esquema de base de datos
  - [x] 1.1 Crear migración SQL con tablas roles, role_permissions, user_permissions, sections, permissions_audit
    - Archivo: `supabase/migrations/031_dynamic_permissions_schema.sql`
    - Incluye índices optimizados para consultas de permisos
    - Agrega columna role_id a tabla users
    - _Requirements: 8.3, 9.5_
  
  - [x] 1.2 Crear script de seed con roles iniciales (admin, user) y secciones del sistema
    - Archivo: `supabase/migrations/032_dynamic_permissions_seed.sql`
    - Roles admin y user marcados como protegidos
    - 17 secciones definidas en requisitos insertadas
    - _Requirements: 4.1, 8.3_
  
  - [x] 1.3 Crear script de migración de datos existentes
    - Archivo: `supabase/migrations/033_migrate_existing_users.sql`
    - Migra usuarios existentes al nuevo esquema role_id
    - Preserva permisos actuales de roles hardcodeados
    - _Requirements: 8.3, 8.6_

- [x] 2. Implementar tipos y constantes TypeScript
  - [x] 2.1 Crear tipos en src/types/permissions.ts
    - Role, RoleWithPermissions, UserPermissionOverride, Section
    - PermissionAuditEntry, EffectivePermissions, PermissionDefinition
    - _Requirements: 8.4_
  
  - [x] 2.2 Actualizar src/lib/permissions.ts para compatibilidad
    - Constantes PERMISSIONS existentes mantenidas
    - Nuevo permiso ADMIN_MANAGE_PERMISSIONS agregado
    - Definiciones de permisos con categorías (PERMISSION_DEFINITIONS)
    - _Requirements: 8.1, 8.4_

- [x] 3. Implementar servicios de backend
  - [x] 3.1 Crear PermissionsService en src/services/permissions.service.ts
    - getEffectivePermissions, getRolePermissions, getUserOverrides implementados
    - setRolePermissions, grantUserPermission, revokeUserPermission implementados
    - hasPermission, hasAnyPermission, hasAllPermissions implementados
    - calculateEffectivePermissions (función pura para testing)
    - _Requirements: 2.2, 3.2, 3.3, 3.5_
  
  - [x] 3.2 Escribir property test para cálculo de permisos efectivos
    - Archivo: `src/services/__tests__/permissions.service.test.ts`
    - **Property 8: Cálculo de permisos efectivos**
    - **Validates: Requirements 3.5**
  
  - [x] 3.3 Crear RolesService en src/services/roles.service.ts
    - getAllRoles, getRoleById, createRole, updateRole, deleteRole implementados
    - Validación de roles protegidos implementada
    - Reasignación de usuarios al eliminar rol implementada
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.7, 1.8_
  
  - [x] 3.4 Escribir property tests para gestión de roles
    - Archivo: `src/services/__tests__/roles.service.test.ts`
    - **Property 1: Unicidad de nombres de roles**
    - **Property 2: Edición de roles preserva permisos**
    - **Property 3: Eliminación de roles reasigna usuarios**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.6**
  
  - [x] 3.5 Crear AuditService en src/services/audit.service.ts
    - logPermissionChange para registrar cambios implementado
    - getAuditHistory con filtros y ordenamiento implementado
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 3.6 Escribir property tests para auditoría
    - Archivo: `src/services/__tests__/audit.service.test.ts`
    - **Property 5: Auditoría de operaciones de permisos**
    - **Property 12: Ordenamiento de auditoría**
    - **Property 13: Inmutabilidad de auditoría**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 4. Checkpoint - Verificar servicios de backend ✅

- [x] 5. Implementar API Routes
  - [x] 5.1 Crear API de roles en src/app/api/admin/roles/
    - GET /api/admin/roles - Listar roles
    - POST /api/admin/roles - Crear rol
    - GET /api/admin/roles/[id] - Obtener rol
    - PUT /api/admin/roles/[id] - Actualizar rol
    - DELETE /api/admin/roles/[id] - Eliminar rol
    - _Requirements: 1.1, 1.2, 1.4, 1.6_
  
  - [x] 5.2 Crear API de permisos de rol en src/app/api/admin/roles/[id]/permissions/
    - GET - Obtener permisos del rol
    - PUT - Actualizar permisos del rol
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 5.3 Crear API de permisos de usuario en src/app/api/admin/users/[id]/permissions/
    - GET - Obtener permisos efectivos del usuario
    - PUT - Actualizar overrides del usuario
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 5.4 Crear API de permisos del usuario actual en src/app/api/permissions/effective/
    - GET - Obtener permisos del usuario autenticado
    - _Requirements: 9.4_
  
  - [x] 5.5 Crear API de auditoría en src/app/api/admin/permissions/audit/
    - GET - Obtener historial con filtros
    - _Requirements: 6.4_
  
  - [x] 5.6 Escribir property tests para APIs
    - Archivo: `src/app/api/admin/__tests__/permissions-api-security.property.test.ts`
    - **Property 14: Autenticación requerida**
    - **Property 15: Autorización de administrador requerida**
    - **Validates: Requirements 7.2, 7.3**

- [x] 6. Implementar contexto y hooks de frontend
  - [x] 6.1 Crear PermissionsContext en src/contexts/PermissionsContext.tsx
    - Carga de permisos al iniciar sesión implementada
    - Caché local de permisos (localStorage) implementado
    - Invalidación de caché implementada
    - _Requirements: 9.2, 9.3, 9.4_
  
  - [x] 6.2 Actualizar usePermissions hook para usar nuevo contexto
    - Archivo: `src/hooks/usePermissions.ts`
    - API existente mantenida (hasPermission, hasAnyPermission, etc.)
    - Soporte para permisos dinámicos agregado
    - Fallback a permisos estáticos cuando contexto no disponible
    - _Requirements: 8.1, 8.2_
  
  - [x] 6.3 Escribir property tests para compatibilidad
    - Archivo: `src/hooks/__tests__/usePermissions.property.test.tsx`
    - Archivo: `src/contexts/__tests__/PermissionsContext.test.tsx`
    - **Property 16: Compatibilidad con sistema anterior**
    - **Property 17: Invalidación de caché**
    - **Validates: Requirements 8.1, 8.2, 9.3**

- [x] 7. Checkpoint - Verificar integración frontend-backend ✅

- [x] 8. Implementar componentes de UI para administración
  - [x] 8.1 Crear página principal en src/app/admin/permissions/page.tsx
    - Layout con pestañas (Roles, Usuarios, Secciones) implementado
    - Indicador de cambios pendientes implementado
    - _Requirements: 5.1, 5.4_
  
  - [x] 8.2 Crear componente RolesTab en src/components/admin/permissions/RolesTab.tsx
    - Lista de roles con nombre, descripción, usuarios asignados
    - Formulario de crear/editar rol
    - Confirmación de eliminación con usuarios afectados
    - _Requirements: 1.1, 1.5, 1.6_
  
  - [x] 8.3 Crear componente PermissionsMatrix en src/components/admin/permissions/PermissionsMatrix.tsx
    - Matriz de checkboxes organizada por categorías
    - Diferenciación visual de permisos heredados/agregados/revocados
    - _Requirements: 2.1, 3.6_
  
  - [x] 8.4 Crear componente UsersTab en src/components/admin/permissions/UsersTab.tsx
    - Búsqueda de usuarios por nombre/email/username
    - Vista de permisos heredados y overrides
    - Edición de overrides de usuario
    - _Requirements: 3.1, 5.2_
  
  - [x] 8.5 Escribir property test para búsqueda
    - Archivo: `src/components/admin/permissions/__tests__/search.property.test.ts`
    - **Property 11: Búsqueda de usuarios y roles**
    - **Validates: Requirements 5.2, 5.3**
  
  - [x] 8.6 Crear componente SectionsTab en src/components/admin/permissions/SectionsTab.tsx
    - Lista de secciones del sistema
    - Matriz de acceso por rol
    - _Requirements: 4.1_
  
  - [x] 8.7 Crear componente AuditHistory en src/components/admin/permissions/AuditHistory.tsx
    - Lista de cambios con filtros
    - Detalles de cada cambio
    - _Requirements: 6.4_

- [x] 9. Implementar control de acceso a secciones
  - [x] 9.1 Crear middleware de verificación de secciones
    - Archivo: `src/lib/section-access.ts`
    - Verificación de permiso requerido para cada ruta
    - Configuración de secciones con permisos requeridos
    - _Requirements: 4.2_
  
  - [x] 9.2 Actualizar navegación para filtrar secciones
    - filterNavigationByPermissions implementado
    - getAccessibleSections implementado
    - _Requirements: 4.3_
  
  - [x] 9.3 Escribir property tests para control de acceso
    - Archivo: `src/lib/__tests__/section-access.property.test.ts`
    - **Property 9: Control de acceso a secciones**
    - **Property 10: Filtrado de navegación**
    - **Validates: Requirements 4.2, 4.3**

- [x] 10. Implementar validaciones de seguridad
  - [x] 10.1 Agregar validación de permisos críticos en rol admin
    - Prevención de quitar SYSTEM_CONFIGURE, USERS_MANAGE, ADMIN_MANAGE_PERMISSIONS
    - _Requirements: 2.4_
  
  - [x] 10.2 Agregar validación de auto-protección
    - Prevención de que admin se quite permiso de gestionar permisos
    - _Requirements: 7.4_
  
  - [x] 10.3 Agregar validación de roles protegidos
    - Prevención de eliminación de roles admin y user
    - isProtectedRole, isProtectedRoleName en RolesService
    - _Requirements: 1.7, 1.8_

- [x] 11. Checkpoint - Verificar funcionalidad completa ✅

- [x] 12. Integración final y limpieza
  - [x] 12.1 Agregar enlace a /admin/permissions en navegación de admin
    - Visible solo para usuarios con ADMIN_MANAGE_PERMISSIONS
    - Configurado en SECTION_CONFIG
    - _Requirements: 4.3_
  
  - [x] 12.2 Actualizar documentación de permisos
    - Archivo: `docs/PERMISSIONS_SYSTEM.md`
    - Documentación completa de permisos y secciones
    - Proceso de migración documentado
    - _Requirements: 8.6_
  
  - [x] 12.3 Crear página de acceso denegado en src/app/access-denied/page.tsx
    - Mensaje informativo
    - Enlace para volver al dashboard
    - Información del usuario y código de error
    - _Requirements: 4.2_

- [x] 13. Checkpoint final - Verificar sistema completo ✅

## Archivos Implementados

### Base de Datos
- `supabase/migrations/031_dynamic_permissions_schema.sql`
- `supabase/migrations/032_dynamic_permissions_seed.sql`
- `supabase/migrations/033_migrate_existing_users.sql`

### Tipos y Constantes
- `src/types/permissions.ts`
- `src/lib/permissions.ts` (actualizado)

### Servicios
- `src/services/permissions.service.ts`
- `src/services/roles.service.ts`
- `src/services/audit.service.ts`

### API Routes
- `src/app/api/admin/roles/route.ts`
- `src/app/api/admin/roles/[id]/route.ts`
- `src/app/api/admin/roles/[id]/permissions/route.ts`
- `src/app/api/admin/users/[id]/permissions/route.ts`
- `src/app/api/admin/permissions/audit/route.ts`
- `src/app/api/permissions/effective/route.ts`

### Frontend
- `src/contexts/PermissionsContext.tsx`
- `src/hooks/usePermissions.ts` (actualizado)
- `src/lib/section-access.ts`
- `src/app/admin/permissions/page.tsx`
- `src/app/access-denied/page.tsx`

### Componentes UI
- `src/components/admin/permissions/RolesTab.tsx`
- `src/components/admin/permissions/UsersTab.tsx`
- `src/components/admin/permissions/SectionsTab.tsx`
- `src/components/admin/permissions/PermissionsMatrix.tsx`
- `src/components/admin/permissions/AuditHistory.tsx`
- `src/components/admin/permissions/index.ts`

### Tests
- `src/services/__tests__/permissions.service.test.ts`
- `src/services/__tests__/roles.service.test.ts`
- `src/services/__tests__/audit.service.test.ts`
- `src/hooks/__tests__/usePermissions.test.tsx`
- `src/hooks/__tests__/usePermissions.property.test.tsx`
- `src/contexts/__tests__/PermissionsContext.test.tsx`
- `src/lib/__tests__/section-access.property.test.ts`
- `src/app/api/admin/__tests__/permissions-api-security.property.test.ts`
- `src/components/admin/permissions/__tests__/search.property.test.ts`
- `src/components/admin/permissions/__tests__/PermissionsMatrix.test.tsx`

### Documentación
- `docs/PERMISSIONS_SYSTEM.md`

## Notas

- Todas las tareas han sido completadas exitosamente
- El sistema mantiene compatibilidad total con el código existente
- Los property tests validan las propiedades de correctitud definidas en el diseño
- La documentación está actualizada con todos los permisos y secciones
