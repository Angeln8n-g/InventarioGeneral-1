# 🎉 Sistema de Reservas de Consumables - Documentación Completa

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración](#configuración)
4. [Uso del Sistema](#uso-del-sistema)
5. [Reportes y Métricas](#reportes-y-métricas)
6. [Mantenimiento](#mantenimiento)
7. [Troubleshooting](#troubleshooting)

---

## Resumen Ejecutivo

El Sistema de Reservas de Consumables permite a los usuarios apartar materiales para recoger más tarde, optimizando la gestión de inventario y mejorando la planificación.

### Características Principales
✅ Crear y gestionar reservas con fecha de expiración
✅ Visualización de cantidades reservadas en tiempo real
✅ Límites automáticos por usuario y por item
✅ Notificaciones antes de expiración
✅ Expiración automática de reservas vencidas
✅ Reportes completos para administradores
✅ Exportación de datos (CSV, PDF, Excel)

---

## Arquitectura del Sistema

### Base de Datos
```
consumable_reservations
├── id (PK)
├── user_id (FK → users)
├── item_type_id (FK → item_types)
├── reserved_quantity
├── status (active|fulfilled|cancelled|expired)
├── reservation_date
├── expiration_date
├── pickup_date
├── notes
├── purpose
├── created_at
└── updated_at

reservation_details (VIEW)
└── Incluye información de usuario e item
```

### Endpoints API
```
GET    /api/reservations              # Listar con filtros
POST   /api/reservations              # Crear reserva
GET    /api/reservations/[id]         # Obtener una
PATCH  /api/reservations/[id]         # Actualizar
POST   /api/reservations/[id]/fulfill # Marcar como recogida
POST   /api/reservations/[id]/cancel  # Cancelar
GET    /api/reservations/stats        # Estadísticas
POST   /api/reservations/expire       # Job de expiración
POST   /api/reservations/notify-expiring # Job de notificaciones
```

### Componentes Frontend
```
Modales:
├── MyReservationsModal          # Mis reservas
├── AllReservationsModal         # Todas las reservas activas
└── ReservationsHistoryModal     # Historial completo

Componentes:
├── CartModal                    # Con opción Reservar/Consumir
├── ReservationButtons           # Acceso rápido
├── ConsumableCard               # Muestra reservas
└── ConsumableList               # Integra reservas

Páginas:
├── /consumables                 # Vista de usuarios
└── /admin/reports/reservations  # Reporte admin
```

---

## Configuración

### Archivo de Configuración
**Ubicación**: `src/config/reservations.config.ts`

```typescript
export const RESERVATION_CONFIG = {
  // Límites
  MAX_ACTIVE_RESERVATIONS_PER_USER: 5,    // Máx reservas activas por usuario
  MAX_QUANTITY_PER_ITEM: 50,              // Máx cantidad por item
  MAX_PERCENTAGE_OF_STOCK: 0.5,           // Máx 50% del stock
  MIN_DAYS_UNTIL_EXPIRATION: 1,           // Mín 1 día
  MAX_DAYS_UNTIL_EXPIRATION: 30,          // Máx 30 días
  DEFAULT_RESERVATION_DAYS: 7,            // Por defecto 7 días

  // Notificaciones
  URGENT_NOTIFICATION_HOURS: 24,          // Notificar 24h antes
  WARNING_NOTIFICATION_DAYS: 3,           // Advertencia 3 días antes
  
  // UI
  QUICK_DURATION_OPTIONS: [3, 7, 14],     // Opciones rápidas
  MAX_RESERVATIONS_DISPLAY: 3,            // Mostrar máx 3 en tarjeta
  
  // Reportes
  TOP_ITEMS_LIMIT: 10,                    // Top 10 materiales
  PDF_EXPORT_LIMIT: 50,                   // Máx 50 en PDF
}
```

### Variables de Entorno
```env
# .env.local
CRON_API_KEY=tu_clave_secreta_aqui
```

### Cron Jobs (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/reservations/expire",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/reservations/notify-expiring",
      "schedule": "0 8,14,20 * * *"
    }
  ]
}
```

---

## Uso del Sistema

### Para Usuarios

#### 1. Crear una Reserva
1. Ir a "Request Supplies"
2. Agregar materiales al carrito
3. Abrir carrito
4. Seleccionar "Reservar para Después"
5. Elegir duración (3, 7 o 14 días)
6. Opcional: Agregar propósito
7. Confirmar

#### 2. Ver Mis Reservas
1. Click en "📦 Mis Reservas"
2. Ver lista de reservas activas
3. Opciones:
   - ✓ Marcar como Recogida
   - ✕ Cancelar

#### 3. Ver Reservas del Sistema
1. Click en "👥 Reservas Activas"
2. Ver quién tiene qué reservado
3. Filtrar por categoría o buscar

#### 4. Ver Historial
1. Click en "📜 Historial"
2. Filtrar por estado y período
3. Ver estadísticas

### Para Administradores

#### 1. Acceder al Reporte
- Ir a `/admin/reports`
- Click en "Reservas"

#### 2. Métricas Disponibles
- Total de reservas
- Reservas activas
- Tasa de cumplimiento
- Usuarios activos
- Duración promedio
- Reservas por expirar
- Top materiales reservados

#### 3. Filtros
- **Período**: Semana, Mes, Trimestre, Año, Todo
- **Estado**: Todas, Activas, Recogidas, Canceladas, Expiradas

#### 4. Exportar Datos
- **CSV**: Todos los campos
- **PDF**: Resumen (próximamente)
- **Excel**: Completo (próximamente)

---

## Reportes y Métricas

### Métricas Clave

#### 1. Tasa de Cumplimiento
```
Tasa = (Reservas Recogidas / Total Completadas) × 100

Interpretación:
- ≥ 80%: Excelente
- 50-79%: Regular
- < 50%: Requiere atención
```

#### 2. Duración Promedio
```
Promedio = Σ(Fecha Recogida - Fecha Reserva) / Total Recogidas

Indica: Tiempo que los usuarios tardan en recoger
```

#### 3. Reservas por Usuario
```
Promedio = Total Reservas / Usuarios Únicos

Indica: Nivel de uso del sistema
```

#### 4. Stock Reservado
```
Por Item = Σ(Cantidad Reservada) donde Status = 'active'

Indica: Impacto en disponibilidad
```

### Análisis Recomendados

#### Semanal
- Reservas próximas a expirar
- Tasa de cumplimiento
- Usuarios con más reservas

#### Mensual
- Tendencias de uso
- Materiales más reservados
- Tasa de cancelación/expiración

#### Trimestral
- Eficiencia del sistema
- Ajustes de límites necesarios
- Capacitación de usuarios

---

## Mantenimiento

### Tareas Diarias
- ✅ Verificar que los cron jobs se ejecuten
- ✅ Revisar reservas próximas a expirar
- ✅ Atender notificaciones de usuarios

### Tareas Semanales
- ✅ Revisar tasa de cumplimiento
- ✅ Identificar materiales con alta demanda
- ✅ Verificar logs de errores

### Tareas Mensuales
- ✅ Analizar tendencias
- ✅ Ajustar límites si es necesario
- ✅ Limpiar datos antiguos (opcional)
- ✅ Revisar configuración

### Comandos Útiles

#### Ejecutar Expiración Manual
```bash
curl -X POST https://tu-dominio.com/api/reservations/expire \
  -H "x-api-key: $CRON_API_KEY"
```

#### Ver Estadísticas
```bash
curl https://tu-dominio.com/api/reservations/expire
```

#### Enviar Notificaciones Manual
```bash
curl -X POST https://tu-dominio.com/api/reservations/notify-expiring \
  -H "x-api-key: $CRON_API_KEY"
```

---

## Troubleshooting

### Problema: Reservas no expiran automáticamente
**Solución**:
1. Verificar que el cron job esté configurado
2. Revisar logs del endpoint `/api/reservations/expire`
3. Ejecutar manualmente para probar
4. Verificar `CRON_API_KEY` en variables de entorno

### Problema: No se envían notificaciones
**Solución**:
1. Verificar cron job de notificaciones
2. Revisar que existan reservas próximas a expirar
3. Verificar tabla `notifications`
4. Ejecutar `/api/reservations/notify-expiring` manualmente

### Problema: Usuario no puede crear más reservas
**Causa**: Límite de reservas activas alcanzado
**Solución**:
1. Usuario debe recoger o cancelar reservas existentes
2. Admin puede ajustar `MAX_ACTIVE_RESERVATIONS_PER_USER`

### Problema: No se puede reservar cantidad deseada
**Causa**: Límites de stock o porcentaje
**Solución**:
1. Verificar stock disponible
2. Revisar `MAX_PERCENTAGE_OF_STOCK`
3. Ajustar `MAX_QUANTITY_PER_ITEM` si es necesario

### Problema: Reporte no muestra datos
**Solución**:
1. Verificar que existan reservas en el período seleccionado
2. Revisar permisos de usuario (debe ser admin)
3. Verificar conexión a base de datos
4. Revisar logs del navegador

---

## Mejores Prácticas

### Para Usuarios
1. ✅ Reservar solo lo que necesitas
2. ✅ Recoger a tiempo o cancelar
3. ✅ Agregar propósito para mejor seguimiento
4. ✅ Revisar "Mis Reservas" regularmente

### Para Administradores
1. ✅ Monitorear métricas semanalmente
2. ✅ Ajustar límites según demanda
3. ✅ Comunicar políticas claramente
4. ✅ Mantener cron jobs activos
5. ✅ Exportar reportes mensualmente

### Configuración Recomendada por Tipo de Organización

#### Pequeña (< 50 usuarios)
```typescript
MAX_ACTIVE_RESERVATIONS_PER_USER: 3
MAX_PERCENTAGE_OF_STOCK: 0.6
DEFAULT_RESERVATION_DAYS: 5
```

#### Mediana (50-200 usuarios)
```typescript
MAX_ACTIVE_RESERVATIONS_PER_USER: 5
MAX_PERCENTAGE_OF_STOCK: 0.5
DEFAULT_RESERVATION_DAYS: 7
```

#### Grande (> 200 usuarios)
```typescript
MAX_ACTIVE_RESERVATIONS_PER_USER: 3
MAX_PERCENTAGE_OF_STOCK: 0.4
DEFAULT_RESERVATION_DAYS: 3
```

---

## Soporte y Contacto

Para preguntas o problemas:
1. Revisar esta documentación
2. Consultar logs del sistema
3. Contactar al administrador del sistema

---

**Última actualización**: Diciembre 2024
**Versión del Sistema**: 1.0.0
