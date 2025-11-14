# Ejemplos de Uso - API de Gestión de Usuarios

## Autenticación

Primero, obtén un token de autenticación:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Respuesta:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

Usa el token en todas las siguientes peticiones:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## GET /api/admin/users

### Listar todos los usuarios

```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta exitosa (200):
```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "full_name": "Administrator",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "full_name": "John Doe",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## GET /api/admin/users/[id]

### Obtener un usuario específico

```bash
curl -X GET http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta exitosa (200):
```json
{
  "data": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "full_name": "John Doe",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error: Usuario no encontrado (404)

```bash
curl -X GET http://localhost:3000/api/admin/users/999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "timestamp": "2024-01-20T15:30:00.000Z"
  }
}
```

### Error: ID inválido (400)

```bash
curl -X GET http://localhost:3000/api/admin/users/abc \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid user ID",
    "timestamp": "2024-01-20T15:30:00.000Z"
  }
}
```

## PUT /api/admin/users/[id]

### Actualizar email de usuario

```bash
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@newdomain.com"
  }'
```

Respuesta exitosa (200):
```json
{
  "data": {
    "id": 2,
    "username": "john_doe",
    "email": "john.doe@newdomain.com",
    "role": "user",
    "full_name": "John Doe",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T15:45:00.000Z"
  },
  "message": "User updated successfully"
}
```

### Actualizar rol de usuario

```bash
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

Respuesta exitosa (200):
```json
{
  "data": {
    "id": 2,
    "username": "john_doe",
    "email": "john.doe@newdomain.com",
    "role": "admin",
    "full_name": "John Doe",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T15:50:00.000Z"
  },
  "message": "User updated successfully"
}
```

### Actualizar múltiples campos

```bash
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "role": "user",
    "full_name": "John Michael Doe"
  }'
```

Respuesta exitosa (200):
```json
{
  "data": {
    "id": 2,
    "username": "john_doe",
    "email": "john.doe@example.com",
    "role": "user",
    "full_name": "John Michael Doe",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T16:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

### Error: Email inválido (400)

```bash
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

Respuesta:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "timestamp": "2024-01-20T16:05:00.000Z"
  }
}
```

### Error: Rol inválido (400)

```bash
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "superadmin"
  }'
```

Respuesta:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid role. Must be \"admin\" or \"user\"",
    "timestamp": "2024-01-20T16:10:00.000Z"
  }
}
```

### Error: Email ya existe (400)

```bash
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'
```

Respuesta:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already taken",
    "timestamp": "2024-01-20T16:15:00.000Z"
  }
}
```

### Error: Cambiar propio rol (403)

```bash
# Intentando cambiar el rol del usuario autenticado (ID 1)
curl -X PUT http://localhost:3000/api/admin/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user"
  }'
```

Respuesta:
```json
{
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You cannot change your own role",
    "timestamp": "2024-01-20T16:20:00.000Z"
  }
}
```

### Error: Sin campos para actualizar (400)

```bash
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Respuesta:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one field (email, role, or full_name) is required",
    "timestamp": "2024-01-20T16:25:00.000Z"
  }
}
```

## DELETE /api/admin/users/[id]

### Eliminar un usuario

```bash
curl -X DELETE http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta exitosa (200):
```json
{
  "message": "User deleted successfully"
}
```

### Error: Eliminar propia cuenta (403)

```bash
# Intentando eliminar el usuario autenticado (ID 1)
curl -X DELETE http://localhost:3000/api/admin/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You cannot delete your own account",
    "timestamp": "2024-01-20T16:30:00.000Z"
  }
}
```

### Error: Usuario no encontrado (404)

```bash
curl -X DELETE http://localhost:3000/api/admin/users/999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "timestamp": "2024-01-20T16:35:00.000Z"
  }
}
```

## Errores de Autenticación/Autorización

### Sin token (401)

```bash
curl -X GET http://localhost:3000/api/admin/users
```

Respuesta:
```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "No authorization token provided",
    "timestamp": "2024-01-20T16:40:00.000Z"
  }
}
```

### Token inválido (401)

```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer invalid_token"
```

Respuesta:
```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired token",
    "timestamp": "2024-01-20T16:45:00.000Z"
  }
}
```

### Sin permisos (403)

```bash
# Usuario regular intentando acceder a endpoint de admin
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer USER_TOKEN"
```

Respuesta:
```json
{
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions",
    "timestamp": "2024-01-20T16:50:00.000Z"
  }
}
```

## Ejemplos con JavaScript/TypeScript

### Fetch API

```typescript
// Obtener usuario
async function getUser(userId: number, token: string) {
  const response = await fetch(`/api/admin/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }

  const data = await response.json()
  return data.data
}

// Actualizar usuario
async function updateUser(
  userId: number,
  updates: { email?: string; role?: string; full_name?: string },
  token: string
) {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }

  const data = await response.json()
  return data.data
}

// Eliminar usuario
async function deleteUser(userId: number, token: string) {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }

  const data = await response.json()
  return data.message
}

// Uso
try {
  const user = await getUser(2, token)
  console.log('Usuario:', user)

  const updated = await updateUser(2, { email: 'new@example.com' }, token)
  console.log('Usuario actualizado:', updated)

  await deleteUser(2, token)
  console.log('Usuario eliminado')
} catch (error) {
  console.error('Error:', error.message)
}
```

### Axios

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Obtener usuario
async function getUser(userId: number) {
  const { data } = await api.get(`/admin/users/${userId}`)
  return data.data
}

// Actualizar usuario
async function updateUser(
  userId: number,
  updates: { email?: string; role?: string; full_name?: string }
) {
  const { data } = await api.put(`/admin/users/${userId}`, updates)
  return data.data
}

// Eliminar usuario
async function deleteUser(userId: number) {
  const { data } = await api.delete(`/admin/users/${userId}`)
  return data.message
}
```

## Verificar Auditoría

Después de realizar cambios, puedes verificar los logs de auditoría:

```sql
-- Ver últimas actualizaciones de usuarios
SELECT 
  al.*,
  u.username as performed_by
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action = 'user_update'
ORDER BY al.created_at DESC
LIMIT 10;

-- Ver últimas eliminaciones de usuarios
SELECT 
  al.*,
  u.username as performed_by
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action = 'user_delete'
ORDER BY al.created_at DESC
LIMIT 10;

-- Ver todos los cambios de un usuario específico
SELECT 
  al.*,
  u.username as performed_by
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.entity_type = 'user' AND al.entity_id = 2
ORDER BY al.created_at DESC;
```

## Notas Importantes

1. **Tokens JWT:** Los tokens tienen una expiración. Asegúrate de renovarlos cuando sea necesario.

2. **Permisos:** Solo usuarios con rol `admin` pueden acceder a estos endpoints.

3. **Auditoría:** Todos los cambios se registran automáticamente en la tabla `audit_logs`.

4. **Validaciones:** El sistema valida todos los datos antes de guardarlos.

5. **Seguridad:** No puedes cambiar tu propio rol ni eliminar tu propia cuenta.

6. **Cascade:** Al eliminar un usuario, se eliminan automáticamente todos sus registros relacionados.

7. **Email único:** No puede haber dos usuarios con el mismo email.

8. **Username inmutable:** El username no se puede cambiar después de crear el usuario.
