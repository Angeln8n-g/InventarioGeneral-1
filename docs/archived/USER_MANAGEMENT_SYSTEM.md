# Sistema de Gestión de Usuarios

## Descripción General

Sistema completo para administrar usuarios en la aplicación, incluyendo visualización, edición y eliminación de usuarios.

## Endpoints API

### GET /api/admin/users
Lista todos los usuarios del sistema.

**Permisos requeridos:** `USERS_VIEW_ALL`

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "full_name": "Administrator",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/admin/users/[id]
Obtiene información detallada de un usuario específico.

**Permisos requeridos:** `USERS_VIEW_ALL`

**Parámetros:**
- `id` (path): ID del usuario

**Respuesta:**
```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "full_name": "Administrator",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errores:**
- `400`: ID de usuario inválido
- `404`: Usuario no encontrado

### PUT /api/admin/users/[id]
Actualiza la información de un usuario.

**Permisos requeridos:** `USERS_MANAGE`

**Parámetros:**
- `id` (path): ID del usuario

**Body:**
```json
{
  "email": "newemail@example.com",
  "role": "admin",
  "full_name": "New Full Name"
}
```

**Validaciones:**
- Al menos un campo debe ser proporcionado
- `email`: Debe ser un email válido y único
- `role`: Debe ser "admin" o "user"
- No se puede cambiar el propio rol
- El email no puede estar en uso por otro usuario

**Respuesta:**
```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "email": "newemail@example.com",
    "role": "admin",
    "full_name": "New Full Name",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "message": "User updated successfully"
}
```

**Errores:**
- `400`: Datos de entrada inválidos
- `403`: No se puede cambiar el propio rol
- `404`: Usuario no encontrado

**Auditoría:**
Se registra un log de auditoría con:
- Acción: `user_update`
- Valores anteriores y nuevos
- Usuario que realizó el cambio
- IP y User-Agent

### DELETE /api/admin/users/[id]
Elimina un usuario del sistema.

**Permisos requeridos:** `USERS_MANAGE`

**Parámetros:**
- `id` (path): ID del usuario

**Validaciones:**
- No se puede eliminar la propia cuenta

**Respuesta:**
```json
{
  "message": "User deleted successfully"
}
```

**Errores:**
- `400`: ID de usuario inválido
- `403`: No se puede eliminar la propia cuenta
- `404`: Usuario no encontrado

**Auditoría:**
Se registra un log de auditoría con:
- Acción: `user_delete`
- Datos del usuario eliminado
- Usuario que realizó la eliminación
- IP y User-Agent

**Nota:** La eliminación es permanente y CASCADE eliminará todos los registros relacionados.

## Páginas UI

### /admin/users
Página de listado de usuarios con:
- Estadísticas (total, admins, usuarios regulares)
- Búsqueda por nombre de usuario o email
- Filtro por rol
- Botón para editar cada usuario
- Botón para crear nuevo usuario

### /admin/users/[id]
Página de edición de usuario con:
- Información del usuario (avatar, username, fecha de creación)
- Formulario de edición:
  - Username (solo lectura)
  - Nombre completo (editable)
  - Email (editable)
  - Rol (editable)
- Botones de acción:
  - Guardar cambios
  - Cancelar
  - Eliminar usuario (zona de peligro)
- Mensajes de éxito/error
- Validación en tiempo real

## Permisos

### USERS_VIEW_ALL
Permite ver la lista de todos los usuarios y sus detalles.

**Roles con este permiso:**
- admin

### USERS_MANAGE
Permite actualizar y eliminar usuarios.

**Roles con este permiso:**
- admin

**Nota:** Este permiso es un alias que combina `USERS_UPDATE_ANY` y `USERS_DELETE`.

## Características de Seguridad

1. **Protección contra auto-modificación:**
   - No se puede cambiar el propio rol
   - No se puede eliminar la propia cuenta

2. **Validación de datos:**
   - Formato de email válido
   - Roles permitidos (admin, user)
   - Email único en el sistema

3. **Auditoría completa:**
   - Todos los cambios se registran
   - Se guarda información del usuario que realizó el cambio
   - Se registran valores anteriores y nuevos

4. **Autenticación y autorización:**
   - Requiere token JWT válido
   - Verifica permisos específicos
   - Solo administradores pueden gestionar usuarios

## Flujo de Trabajo

### Editar Usuario
1. Admin navega a `/admin/users`
2. Hace clic en "Editar" en el usuario deseado
3. Se carga la página `/admin/users/[id]` con los datos actuales
4. Admin modifica los campos deseados
5. Hace clic en "Guardar Cambios"
6. Sistema valida los datos
7. Se actualiza el usuario en la base de datos
8. Se crea un registro de auditoría
9. Se muestra mensaje de éxito
10. Los datos se refrescan automáticamente

### Eliminar Usuario
1. Admin navega a `/admin/users/[id]`
2. Hace scroll hasta la "Zona de Peligro"
3. Hace clic en "Eliminar Usuario"
4. Sistema muestra confirmación
5. Admin confirma la eliminación
6. Usuario se elimina de la base de datos
7. Se crea un registro de auditoría
8. Admin es redirigido a `/admin/users`

## Testing

### Script de Prueba
Ejecutar el script de prueba:

```bash
node scripts/test-user-management.js
```

El script prueba:
- Login como admin
- Listar usuarios
- Obtener usuario específico
- Actualizar usuario
- Validaciones de datos
- Restauración de valores originales

**Nota:** El script NO prueba la eliminación para evitar pérdida de datos.

### Pruebas Manuales
1. Crear un usuario de prueba
2. Editar su información
3. Cambiar su rol
4. Verificar que no puedes cambiar tu propio rol
5. Verificar que no puedes eliminar tu propia cuenta
6. Eliminar el usuario de prueba
7. Verificar los logs de auditoría

## Mejoras Futuras

1. **Soft Delete:**
   - En lugar de eliminar permanentemente, marcar como inactivo
   - Permitir restauración de usuarios eliminados

2. **Cambio de Contraseña:**
   - Endpoint para que admin pueda resetear contraseñas
   - Envío de email con nueva contraseña temporal

3. **Roles Personalizados:**
   - Crear roles más allá de admin/user
   - Asignar permisos específicos a cada rol

4. **Historial de Cambios:**
   - Ver todos los cambios realizados a un usuario
   - Timeline de actividad del usuario

5. **Exportación:**
   - Exportar lista de usuarios a CSV/Excel
   - Filtros avanzados para exportación

6. **Paginación:**
   - Implementar paginación en la lista de usuarios
   - Mejorar rendimiento con muchos usuarios

## Archivos Relacionados

### Backend
- `src/app/api/admin/users/route.ts` - Endpoint para listar usuarios
- `src/app/api/admin/users/[id]/route.ts` - Endpoints GET, PUT, DELETE
- `src/lib/permissions.ts` - Definición de permisos
- `src/lib/auth-middleware.ts` - Middleware de autenticación

### Frontend
- `src/app/admin/users/page.tsx` - Página de listado
- `src/app/admin/users/[id]/page.tsx` - Página de edición
- `src/components/ui/Button.tsx` - Componente de botón

### Scripts
- `scripts/test-user-management.js` - Script de pruebas

### Documentación
- `USER_MANAGEMENT_SYSTEM.md` - Este archivo
