# Design Document

## Overview

El sistema de gestión de electrónicos es una extensión del sistema de inventario existente que permite a los administradores gestionar dispositivos electrónicos con especificaciones técnicas detalladas. El sistema se integra completamente con la infraestructura existente de herramientas (tools) y préstamos, aprovechando las capacidades actuales mientras agrega funcionalidad especializada para dispositivos tecnológicos.

### Key Design Decisions

1. **Extensión vs Nueva Entidad**: Los electrónicos se implementarán como una extensión de `ToolInstance` con metadatos adicionales, no como una entidad completamente nueva. Esto permite reutilizar el sistema de préstamos existente.

2. **Almacenamiento de Especificaciones**: Las especificaciones técnicas se almacenarán en formato JSON en una nueva tabla `electronic_devices` que tiene una relación 1:1 con `tool_instances`.

3. **Categorización**: Se utilizará el campo `category` existente en `item_types` con valores específicos para electrónicos (Laptops, Tablets, Smartphones, etc.).

4. **Integración con Préstamos**: Los dispositivos electrónicos utilizarán el sistema de préstamos existente sin modificaciones, manteniendo la consistencia del sistema.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Panel (Frontend)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Electronics Management Pages                  │   │
│  │  - List View (/admin/electronics)                    │   │
│  │  - Create/Edit Form (/admin/electronics/new|[id])   │   │
│  │  - Detail View (Modal)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Backend)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Electronics API Routes                        │   │
│  │  - GET    /api/admin/electronics                     │   │
│  │  - POST   /api/admin/electronics                     │   │
│  │  - GET    /api/admin/electronics/[id]                │   │
│  │  - PUT    /api/admin/electronics/[id]                │   │
│  │  - DELETE /api/admin/electronics/[id]                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Existing Tables (Reused)                            │   │
│  │  - item_types                                        │   │
│  │  - tool_instances                                    │   │
│  │  - loans                                             │   │
│  │  - audit_logs                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  New Table                                           │   │
│  │  - electronic_devices (specifications)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Dashboard Integration**: Agregar tarjeta de estadísticas de electrónicos en el dashboard de administración
2. **Navigation**: Agregar enlace "Electrónicos" en el menú de administración
3. **Loan System**: Los electrónicos aparecerán automáticamente en el sistema de préstamos
4. **QR System**: Cada dispositivo tendrá su código QR para escaneo
5. **Audit System**: Todos los cambios se registrarán en `audit_logs`

## Components and Interfaces

### Frontend Components

#### 1. ElectronicsListPage (`/admin/electronics/page.tsx`)
- **Purpose**: Página principal de gestión de electrónicos
- **Features**:
  - Lista de dispositivos con tarjetas visuales
  - Filtros por categoría, estado y búsqueda
  - Estadísticas resumidas (total, disponibles, prestados, en reparación)
  - Botón para crear nuevo dispositivo
  - Navegación a detalles/edición

#### 2. ElectronicDeviceForm (`/components/admin/ElectronicDeviceForm.tsx`)
- **Purpose**: Formulario para crear/editar dispositivos
- **Fields**:
  - Información básica: nombre, categoría, descripción
  - Marca y modelo
  - Número de serie
  - Estado: disponible, prestado, en reparación, etc.
  - Notas de condición

#### 3. ElectronicDeviceCard (`/components/admin/ElectronicDeviceCard.tsx`)
- **Purpose**: Tarjeta visual para mostrar dispositivo en lista
- **Display**:
  - Icono según categoría
  - Nombre del dispositivo
  - Marca y modelo
  - Número de serie
  - Badge de estado con color
  - Botón de acciones rápidas

#### 4. ElectronicDeviceModal (`/components/admin/ElectronicDeviceModal.tsx`)
- **Purpose**: Modal para ver detalles completos
- **Sections**:
  - Información general (nombre, categoría, descripción)
  - Detalles del dispositivo (marca, modelo, número de serie)
  - Estado y condición
  - Historial de préstamos
  - Código QR
  - Botones de acción (editar, eliminar, prestar)

### Backend API Routes

#### GET /api/admin/electronics
- **Purpose**: Obtener lista de dispositivos electrónicos
- **Query Parameters**:
  - `status`: filtrar por estado
  - `category`: filtrar por categoría
  - `search`: búsqueda por nombre/serial
- **Response**: Array de dispositivos con especificaciones
- **Permissions**: `ADMIN_MANAGE_TOOLS`

#### POST /api/admin/electronics
- **Purpose**: Crear nuevo dispositivo electrónico
- **Body**: Datos del dispositivo (nombre, categoría, marca, modelo, serial)
- **Process**:
  1. Crear `item_type` si no existe
  2. Crear `tool_instance`
  3. Crear `electronic_device` con marca y modelo
  4. Generar QR code
  5. Registrar en audit log
- **Response**: Dispositivo creado
- **Permissions**: `ADMIN_MANAGE_TOOLS`

#### GET /api/admin/electronics/[id]
- **Purpose**: Obtener detalles de un dispositivo específico
- **Response**: Dispositivo con todas las especificaciones y préstamo activo si existe
- **Permissions**: `ADMIN_MANAGE_TOOLS`

#### PUT /api/admin/electronics/[id]
- **Purpose**: Actualizar dispositivo existente
- **Body**: Datos actualizados
- **Process**:
  1. Validar cambios
  2. Actualizar `tool_instance`
  3. Actualizar `electronic_device`
  4. Registrar cambios en audit log
- **Response**: Dispositivo actualizado
- **Permissions**: `ADMIN_MANAGE_TOOLS`

#### DELETE /api/admin/electronics/[id]
- **Purpose**: Eliminar dispositivo
- **Validations**: No permitir si tiene préstamo activo
- **Process**:
  1. Verificar préstamos activos
  2. Eliminar `electronic_device`
  3. Eliminar `tool_instance`
  4. Registrar en audit log
- **Response**: Confirmación
- **Permissions**: `ADMIN_MANAGE_TOOLS`

## Data Models

### New Table: electronic_devices

```sql
CREATE TABLE electronic_devices (
  id SERIAL PRIMARY KEY,
  tool_instance_id INTEGER NOT NULL UNIQUE REFERENCES tool_instances(id) ON DELETE CASCADE,
  
  -- Basic Information
  brand VARCHAR(100),
  model VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  
  CONSTRAINT fk_tool_instance FOREIGN KEY (tool_instance_id) 
    REFERENCES tool_instances(id) ON DELETE CASCADE
);

CREATE INDEX idx_electronic_devices_tool_instance ON electronic_devices(tool_instance_id);
CREATE INDEX idx_electronic_devices_brand ON electronic_devices(brand);
CREATE INDEX idx_electronic_devices_model ON electronic_devices(model);
```

### TypeScript Interfaces

```typescript
export interface ElectronicDevice {
  id: number
  tool_instance_id: number
  
  // Basic Information
  brand?: string
  model?: string
  
  // Metadata
  created_at: string
  updated_at: string
  version: number
}

export interface ElectronicDeviceWithDetails extends ElectronicDevice {
  tool_instance: ToolInstance
  item_type: ItemType
  current_loan?: Loan
}

export interface CreateElectronicDeviceInput {
  // Basic Info
  name: string
  category: ElectronicCategory
  description?: string
  brand?: string
  model?: string
  serial_number?: string
  
  // Status
  status?: ToolInstance['status']
  condition_notes?: string
}

export type ElectronicCategory = 
  | 'Laptops'
  | 'Tablets'
  | 'Smartphones'
  | 'Periféricos'
  | 'Digitales'
  | 'Otros'
```

## Error Handling

### Validation Errors
- **Empty required fields**: Mostrar mensaje específico por campo
- **Duplicate QR code**: "El código QR ya existe en el sistema"
- **Invalid numeric values**: "El valor debe ser un número positivo"
- **Invalid dates**: "La fecha ingresada no es válida"

### Business Logic Errors
- **Delete with active loan**: "No se puede eliminar un dispositivo con préstamo activo"
- **Update loaned device status**: "No se puede cambiar el estado de un dispositivo prestado manualmente"

### System Errors
- **Database connection**: "Error de conexión con la base de datos"
- **Permission denied**: "No tienes permisos para realizar esta acción"
- **Not found**: "Dispositivo no encontrado"

### Error Response Format
```typescript
{
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
  }
}
```

## Testing Strategy

### Unit Tests
- Validación de formularios
- Transformación de datos
- Utilidades de formato

### Integration Tests
- API endpoints (CRUD operations)
- Integración con sistema de préstamos
- Generación de códigos QR
- Registro de auditoría

### E2E Tests
- Flujo completo de creación de dispositivo
- Flujo de edición y actualización
- Flujo de eliminación con validaciones
- Filtrado y búsqueda
- Integración con préstamos

### Manual Testing Checklist
- [ ] Crear dispositivo de cada categoría
- [ ] Editar especificaciones
- [ ] Cambiar estados
- [ ] Filtrar por categoría y estado
- [ ] Buscar por nombre y serial
- [ ] Prestar dispositivo
- [ ] Devolver dispositivo
- [ ] Intentar eliminar con préstamo activo
- [ ] Verificar registro en audit log
- [ ] Verificar generación de QR
- [ ] Probar en modo oscuro
- [ ] Probar responsividad móvil

## Security Considerations

### Authentication & Authorization
- Todas las rutas requieren autenticación JWT
- Solo usuarios con rol `admin` pueden acceder
- Validación de permisos en cada endpoint

### Input Validation
- Sanitización de todos los inputs
- Validación de tipos de datos
- Límites de longitud en campos de texto
- Prevención de SQL injection (uso de prepared statements)

### Data Protection
- No exponer información sensible en logs
- Encriptación de datos en tránsito (HTTPS)
- Validación de ownership antes de operaciones

### Audit Trail
- Registrar todas las operaciones CRUD
- Incluir usuario, timestamp, y cambios realizados
- Mantener historial inmutable

## Performance Considerations

### Database Optimization
- Índices en campos de búsqueda frecuente
- Paginación en lista de dispositivos
- Lazy loading de especificaciones detalladas
- Caching de categorías y estados

### Frontend Optimization
- Lazy loading de componentes
- Debouncing en búsqueda
- Optimistic updates en UI
- Virtualización de listas largas

### API Optimization
- Compresión de respuestas
- Rate limiting
- Query optimization
- Connection pooling

## Accessibility

### WCAG 2.1 Compliance
- Contraste de colores adecuado
- Navegación por teclado
- Labels descriptivos en formularios
- ARIA attributes en componentes interactivos
- Mensajes de error accesibles

### Screen Reader Support
- Semantic HTML
- Alt text en imágenes
- Anuncios de cambios dinámicos
- Skip links

## Internationalization

### Supported Languages
- Español (es)
- English (en)

### Translation Keys
```typescript
{
  "admin.electronics.title": "Gestión de Electrónicos",
  "admin.electronics.addNew": "Agregar Dispositivo",
  "admin.electronics.categories.laptops": "Laptops",
  "admin.electronics.categories.tablets": "Tablets",
  "admin.electronics.categories.smartphones": "Smartphones",
  "admin.electronics.specs.processor": "Procesador",
  "admin.electronics.specs.ram": "Memoria RAM",
  "admin.electronics.specs.storage": "Almacenamiento",
  // ... más claves
}
```

## Migration Strategy

### Phase 1: Database Setup
1. Crear tabla `electronic_devices`
2. Crear índices
3. Agregar categorías de electrónicos a `item_types`

### Phase 2: Backend Implementation
1. Implementar API routes
2. Agregar validaciones
3. Integrar con audit log

### Phase 3: Frontend Implementation
1. Crear componentes base
2. Implementar páginas
3. Integrar con dashboard

### Phase 4: Testing & Refinement
1. Testing completo
2. Ajustes de UX
3. Optimizaciones de performance

### Phase 5: Documentation & Deployment
1. Documentación de usuario
2. Documentación técnica
3. Deploy a producción
