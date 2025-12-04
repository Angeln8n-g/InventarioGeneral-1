# Migración 022: Reportes de Mantenimiento

## Descripción
Esta migración crea la tabla `maintenance_reports` para gestionar reportes de equipos averiados y su seguimiento de reparación.

## Tabla: maintenance_reports

### Columnas
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL | Identificador único |
| electronic_device_id | INTEGER | FK a electronic_devices |
| issue_description | TEXT | Descripción del problema |
| technician_type | VARCHAR(20) | 'internal' o 'external' |
| technician_name | VARCHAR(255) | Nombre del técnico |
| technician_company | VARCHAR(255) | Empresa (para externos) |
| status | VARCHAR(20) | 'pending', 'in_progress', 'completed', 'cancelled' |
| report_date | TIMESTAMP | Fecha del reporte |
| resolution_date | TIMESTAMP | Fecha de resolución |
| resolution_notes | TEXT | Notas de resolución |
| cost | DECIMAL(10,2) | Costo de reparación |
| created_by | INTEGER | FK a users |
| updated_by | INTEGER | FK a users |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de actualización |

### Índices
- `idx_maintenance_reports_device` - Por dispositivo
- `idx_maintenance_reports_status` - Por estado
- `idx_maintenance_reports_date` - Por fecha de reporte
- `idx_maintenance_reports_technician_type` - Por tipo de técnico

### Políticas RLS
- Admins pueden hacer todo
- Usuarios pueden ver reportes

## API Endpoints

### GET /api/admin/maintenance-reports
Obtiene todos los reportes de mantenimiento.

**Query params:**
- `status` - Filtrar por estado
- `deviceId` - Filtrar por dispositivo
- `page` - Página (default: 1)
- `limit` - Límite (default: 50)

### POST /api/admin/maintenance-reports
Crea un nuevo reporte de mantenimiento.

**Body:**
```json
{
  "deviceId": 1,
  "issueDescription": "Pantalla dañada",
  "technicianType": "internal",
  "technicianName": "Juan Pérez",
  "technicianCompany": "TechCorp" // opcional
}
```

### PATCH /api/admin/maintenance-reports
Actualiza el estado de un reporte.

**Body:**
```json
{
  "id": 1,
  "status": "completed",
  "resolutionNotes": "Se reemplazó la pantalla",
  "cost": 150.00
}
```

## Aplicar Migración

```sql
-- Ejecutar en Supabase SQL Editor
\i 022_maintenance_reports.sql
```

## Rollback

```sql
-- Ejecutar en Supabase SQL Editor
\i 022_maintenance_reports_rollback.sql
```
