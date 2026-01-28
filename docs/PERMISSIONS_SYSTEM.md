# Sistema de Permisos Dinámico

## Descripción General

El Sistema de Gestión de Permisos Dinámico permite crear roles personalizados, asignar permisos granulares a roles y usuarios, y gestionar el acceso a secciones y funcionalidades del sistema desde una interfaz administrativa.

Este sistema reemplaza el sistema de permisos hardcodeado anterior (con roles fijos `user` y `admin`) por una solución basada en base de datos que ofrece mayor flexibilidad.

## Características Principales

### 1. Gestión de Roles
- Crear roles personalizados con nombre y descripción
- Editar roles existentes
- Eliminar roles (con reasignación automática de usuarios al rol "user")
- Roles protegidos: `admin` y `user` no pueden ser eliminados

### 2. Asignación de Permisos a Roles
- Matriz visual de permisos organizada por categorías
- Permisos agrupados en: Herramientas, Préstamos, Consumibles, Administración, Usuarios, Notificaciones, Auditoría, Reportes, Sistema
- Cambios aplicados inmediatamente a todos los usuarios del rol

### 3. Permisos Específicos de Usuario (Override)
- Otorgar permisos adicionales a usuarios individuales
- Revocar permisos específicos de usuarios
- Diferenciación visual: heredados (gris), agregados (verde), revocados (rojo)

### 4. Control de Acceso a Secciones
- Secciones del sistema controladas por permisos
- Navegación filtrada según permisos del usuario
- Redirección a página de acceso denegado para secciones sin permiso

### 5. Auditoría
- Registro de todos los cambios en roles y permisos
- Historial con filtros por tipo de acción, usuario y fecha
- Registros inmutables

## Permisos Disponibles

### Herramientas (tools)
| Permiso | Descripción |
|---------|-------------|
| `tools:view` | Ver catálogo de herramientas |
| `tools:create` | Agregar nuevas herramientas |
| `tools:update` | Modificar herramientas existentes |
| `tools:delete` | Eliminar herramientas |
| `tools:adjust_status` | Cambiar estado de disponibilidad |
| `tools:generate_qr` | Generar códigos QR |

### Préstamos (loans)
| Permiso | Descripción |
|---------|-------------|
| `loans:view_own` | Ver préstamos propios |
| `loans:view_all` | Ver todos los préstamos |
| `loans:create` | Solicitar préstamos |
| `loans:return_own` | Devolver préstamos propios |
| `loans:return_any` | Devolver cualquier préstamo |
| `loans:extend` | Extender duración de préstamos |
| `loans:override` | Sobrescribir reglas de préstamos |

### Consumibles (consumables)
| Permiso | Descripción |
|---------|-------------|
| `consumables:view` | Ver catálogo de consumibles |
| `consumables:request` | Solicitar consumibles |
| `consumables:manage_stock` | Gestionar inventario |
| `consumables:fulfill_requests` | Aprobar solicitudes |

### Administración (admin)
| Permiso | Descripción |
|---------|-------------|
| `admin:view_dashboard` | Acceder al panel de administración |
| `admin:manage_items` | Administrar items del sistema |
| `admin:manage_tools` | Administrar herramientas |
| `admin:manage_consumables` | Administrar consumibles |
| `admin:manage_loans` | Administrar préstamos |
| `admin:manage_categories` | Administrar categorías |
| `admin:manage_permissions` | Administrar roles y permisos |
| `admin:manage_electronics` | Administrar equipos electrónicos |
| `admin:manage_classrooms` | Administrar aulas |
| `admin:manage_assignments` | Administrar asignaciones |

### Usuarios (users)
| Permiso | Descripción |
|---------|-------------|
| `users:view_own` | Ver perfil propio |
| `users:view_all` | Ver todos los usuarios |
| `users:create` | Crear usuarios |
| `users:update_own` | Actualizar perfil propio |
| `users:update_any` | Actualizar cualquier usuario |
| `users:delete` | Eliminar usuarios |
| `users:manage` | Gestionar usuarios |

### Notificaciones (notifications)
| Permiso | Descripción |
|---------|-------------|
| `notifications:view_own` | Ver notificaciones propias |
| `notifications:view_all` | Ver todas las notificaciones |
| `notifications:create` | Crear notificaciones |
| `notifications:send` | Enviar notificaciones |

### Auditoría y Reportes
| Permiso | Descripción |
|---------|-------------|
| `audit:view` | Ver registros de auditoría |
| `reports:view` | Ver reportes |
| `reports:export` | Exportar reportes |

### Sistema (system)
| Permiso | Descripción |
|---------|-------------|
| `system:configure` | Configurar sistema |
| `system:backup` | Respaldos del sistema |
| `system:maintenance` | Mantenimiento |

## Secciones del Sistema

Las siguientes secciones están controladas por permisos:

### Secciones de Usuario
| Sección | Ruta | Permiso Requerido |
|---------|------|-------------------|
| Dashboard | `/dashboard` | `sections:dashboard` |
| Herramientas | `/tools` | `sections:tools` |
| Consumibles | `/consumables` | `sections:consumables` |
| Mis Préstamos | `/my-loans` | `sections:my_loans` |
| Mis Espacios | `/my-spaces` | `sections:my_spaces` |
| Perfil | `/profile` | `sections:profile` |

### Secciones de Administración
| Sección | Ruta | Permiso Requerido |
|---------|------|-------------------|
| Admin Dashboard | `/admin/dashboard` | `admin:view_dashboard` |
| Admin Herramientas | `/admin/tools` | `admin:manage_tools` |
| Admin Consumibles | `/admin/consumables` | `admin:manage_consumables` |
| Admin Electrónicos | `/admin/electronics` | `admin:manage_electronics` |
| Admin Aulas | `/admin/classrooms` | `admin:manage_classrooms` |
| Admin Asignaciones | `/admin/assignments` | `admin:manage_assignments` |
| Admin Usuarios | `/admin/users` | `users:manage` |
| Admin Categorías | `/admin/categories` | `admin:manage_categories` |
| Admin Reportes | `/admin/reports` | `reports:view` |
| Admin Auditoría | `/admin/audit` | `audit:view` |
| Admin Permisos | `/admin/permissions` | `admin:manage_permissions` |

## Proceso de Migración

### Migraciones de Base de Datos

El sistema utiliza las siguientes migraciones SQL:

1. **031_dynamic_permissions_schema.sql** - Crea las tablas:
   - `roles` - Roles del sistema
   - `role_permissions` - Permisos asignados a roles
   - `user_permissions` - Permisos específicos de usuario (overrides)
   - `sections` - Secciones del sistema
   - `permissions_audit` - Auditoría de cambios

2. **032_dynamic_permissions_seed.sql** - Datos iniciales:
   - Roles `admin` y `user` marcados como protegidos
   - Permisos iniciales para cada rol
   - Secciones del sistema

3. **033_migrate_existing_users.sql** - Migración de usuarios:
   - Asigna `role_id` a usuarios existentes basado en su rol actual
   - Preserva la compatibilidad con el campo `role` existente

### Ejecutar Migraciones

```bash
# Aplicar migraciones en orden
supabase db push

# O ejecutar manualmente
psql -f supabase/migrations/031_dynamic_permissions_schema.sql
psql -f supabase/migrations/032_dynamic_permissions_seed.sql
psql -f supabase/migrations/033_migrate_existing_users.sql
```

## Uso en Código

### Hook usePermissions

```typescript
import { usePermissions } from '@/hooks/usePermissions'
import { PERMISSIONS } from '@/lib/permissions'

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = usePermissions()
  
  // Verificar un permiso específico
  if (hasPermission(PERMISSIONS.TOOLS_CREATE)) {
    // Usuario puede crear herramientas
  }
  
  // Verificar si tiene alguno de varios permisos
  if (hasAnyPermission([PERMISSIONS.TOOLS_UPDATE, PERMISSIONS.TOOLS_DELETE])) {
    // Usuario puede editar o eliminar
  }
  
  // Verificar si tiene todos los permisos
  if (hasAllPermissions([PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT])) {
    // Usuario puede ver y exportar reportes
  }
}
```

### Componente PermissionGuard

```typescript
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { PERMISSIONS } from '@/lib/permissions'

function AdminTools() {
  return (
    <PermissionGuard permission={PERMISSIONS.ADMIN_MANAGE_TOOLS}>
      {/* Contenido solo visible para usuarios con permiso */}
      <ToolsManager />
    </PermissionGuard>
  )
}
```

### Hook useSectionAccess

```typescript
import { useSectionAccess } from '@/hooks/useSectionAccess'

function Navigation() {
  const { hasAccess, getAccessibleSections } = useSectionAccess()
  
  // Verificar acceso a una sección
  if (hasAccess('/admin/permissions')) {
    // Mostrar enlace a permisos
  }
  
  // Obtener todas las secciones accesibles
  const sections = getAccessibleSections()
}
```

## API Endpoints

### Roles
- `GET /api/admin/roles` - Listar roles
- `POST /api/admin/roles` - Crear rol
- `GET /api/admin/roles/[id]` - Obtener rol
- `PUT /api/admin/roles/[id]` - Actualizar rol
- `DELETE /api/admin/roles/[id]` - Eliminar rol
- `GET /api/admin/roles/[id]/permissions` - Obtener permisos del rol
- `PUT /api/admin/roles/[id]/permissions` - Actualizar permisos del rol

### Permisos de Usuario
- `GET /api/admin/users/[id]/permissions` - Obtener permisos efectivos
- `PUT /api/admin/users/[id]/permissions` - Actualizar overrides

### Auditoría
- `GET /api/admin/permissions/audit` - Historial de cambios

### Usuario Actual
- `GET /api/permissions/effective` - Permisos del usuario autenticado

## Seguridad

### Validaciones
- Autenticación requerida para todas las operaciones
- Solo administradores pueden modificar permisos
- Roles protegidos (`admin`, `user`) no pueden ser eliminados
- Permisos críticos del rol `admin` no pueden ser removidos
- Un administrador no puede quitarse el permiso de gestionar permisos

### Permisos Críticos Protegidos
Los siguientes permisos no pueden ser removidos del rol `admin`:
- `system:configure`
- `users:manage`
- `admin:manage_permissions`

## Compatibilidad

El sistema mantiene compatibilidad con el código existente:

- Las funciones `hasPermission`, `hasAnyPermission`, `hasAllPermissions` funcionan igual
- Los componentes `RoleGuard`, `PermissionGuard` funcionan igual
- El hook `usePermissions` mantiene la misma API
- Los identificadores de permisos existentes se mantienen

## Troubleshooting

### El usuario no ve las secciones esperadas
1. Verificar que el rol del usuario tiene los permisos correctos
2. Verificar si hay overrides de usuario que revocan permisos
3. Revisar la consola del navegador para errores de carga de permisos

### Los cambios de permisos no se aplican
1. El usuario debe cerrar sesión y volver a iniciar
2. O usar el botón de refrescar permisos en la interfaz
3. Verificar que los cambios se guardaron correctamente en la auditoría

### Error al eliminar un rol
1. Verificar que no es un rol protegido (`admin` o `user`)
2. Confirmar la reasignación de usuarios afectados
