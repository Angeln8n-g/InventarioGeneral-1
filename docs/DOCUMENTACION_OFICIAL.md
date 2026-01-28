# 📚 Documentación Oficial del Sistema
## Sistema de Gestión de Inventario CCC

---

## 📋 Índice General

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Funcionalidades Principales](#4-funcionalidades-principales)
5. [Integraciones](#5-integraciones)
6. [Seguridad y Permisos](#6-seguridad-y-permisos)
7. [Stack Tecnológico](#7-stack-tecnológico)
8. [Guía de Instalación](#8-guía-de-instalación)

---

## 1. Resumen Ejecutivo

### 1.1 Descripción General

El **Sistema de Gestión de Inventario CCC** es una plataforma web integral diseñada para el Centro de Competencias Claro, que permite la administración eficiente de:

- **Herramientas físicas**: Préstamos, devoluciones y seguimiento
- **Consumibles**: Solicitudes, reservas y control de stock
- **Dispositivos electrónicos**: Gestión de equipos tecnológicos
- **Espacios/Aulas**: Evaluación y gestión de espacios físicos

### 1.2 Objetivos del Sistema

| Objetivo | Descripción |
|----------|-------------|
| **Eficiencia** | Reducir tiempos de gestión de inventario |
| **Trazabilidad** | Seguimiento completo de todos los activos |
| **Control** | Gestión de stock en tiempo real |
| **Accesibilidad** | Disponible desde cualquier dispositivo |
| **Automatización** | Notificaciones y procesos automáticos |

### 1.3 Beneficios Clave

- ✅ **Reducción de pérdidas** mediante seguimiento QR
- ✅ **Optimización de stock** con alertas automáticas
- ✅ **Mejora en tiempos** de solicitud y devolución
- ✅ **Reportes detallados** para toma de decisiones
- ✅ **Integración con Teams** para comunicación efectiva

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Pages     │  │ Components  │  │    State Management     │ │
│  │  (App Dir)  │  │ (React 19)  │  │  (Redux + RTK Query)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │    Auth     │  │    CRUD     │  │      Business Logic     │ │
│  │  Endpoints  │  │  Endpoints  │  │       Endpoints         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Database   │  │    Auth     │  │       Realtime          │ │
│  │  (Tables)   │  │  (Sessions) │  │    (Subscriptions)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRACIONES                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Teams     │  │  QR Codes   │  │      Exportación        │ │
│  │  Webhooks   │  │  (Scanner)  │  │    (PDF/Excel/CSV)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Directorios

```
inventory-system/
├── src/
│   ├── app/                    # Páginas y rutas (App Router)
│   │   ├── api/               # API Routes
│   │   ├── admin/             # Páginas de administración
│   │   ├── consumables/       # Módulo de consumibles
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── login/             # Autenticación
│   │   ├── my-loans/          # Préstamos del usuario
│   │   ├── my-spaces/         # Espacios asignados
│   │   ├── profile/           # Perfil de usuario
│   │   └── tools/             # Módulo de herramientas
│   │
│   ├── components/            # Componentes React
│   │   ├── admin/            # Componentes de administración
│   │   ├── auth/             # Componentes de autenticación
│   │   ├── bag/              # Sistema de bulto
│   │   ├── cart/             # Carrito de compras
│   │   ├── classrooms/       # Gestión de aulas
│   │   ├── consumables/      # Componentes de consumibles
│   │   ├── dashboard/        # Componentes del dashboard
│   │   ├── electronics/      # Dispositivos electrónicos
│   │   ├── notifications/    # Sistema de notificaciones
│   │   ├── reports/          # Reportes y gráficos
│   │   ├── reservations/     # Sistema de reservas
│   │   ├── returns/          # Devoluciones
│   │   ├── scanner/          # Escáner QR
│   │   ├── tools/            # Componentes de herramientas
│   │   ├── ui/               # Componentes UI compartidos
│   │   └── vault/            # Sistema vault
│   │
│   ├── contexts/              # React Contexts
│   ├── features/              # Features por módulo
│   ├── hooks/                 # Custom Hooks
│   ├── lib/                   # Utilidades y configuración
│   ├── services/              # API Services (RTK Query)
│   ├── types/                 # TypeScript Types
│   └── utils/                 # Funciones utilitarias
│
├── public/                    # Assets estáticos
├── docs/                      # Documentación
├── scripts/                   # Scripts de utilidad
├── supabase/                  # Migraciones de BD
└── tests/                     # Tests
```

---

## 3. Módulos del Sistema

### 3.1 Módulo de Herramientas

**Ruta**: `/tools`

| Funcionalidad | Descripción |
|---------------|-------------|
| Visualización | Grid/Lista de herramientas con filtros |
| Préstamos | Solicitud individual o múltiple (Bulto) |
| Devoluciones | Individual o múltiple (Vault) |
| Escaneo QR | Identificación rápida de herramientas |
| Historial | Registro completo de movimientos |

**Componentes Principales:**
- `ToolCard.tsx` - Tarjeta de herramienta
- `ToolDetailsModal.tsx` - Detalles completos
- `BagModal.tsx` - Sistema de bulto
- `VaultModal.tsx` - Sistema de devoluciones

### 3.2 Módulo de Consumibles

**Ruta**: `/consumables`

| Funcionalidad | Descripción |
|---------------|-------------|
| Catálogo | Visualización de consumibles disponibles |
| Carrito | Solicitud múltiple de materiales |
| Reservas | Apartado de materiales para después |
| Stock | Control en tiempo real |
| Devoluciones | Retorno de materiales no usados |

**Componentes Principales:**
- `ConsumableCard.tsx` - Tarjeta de consumible
- `CartModal.tsx` - Carrito de compras
- `MyReservationsModal.tsx` - Gestión de reservas
- `ReturnCartModal.tsx` - Devoluciones

### 3.3 Módulo de Electrónicos

**Ruta**: `/admin/electronics`

| Funcionalidad | Descripción |
|---------------|-------------|
| Inventario | Gestión de dispositivos electrónicos |
| Asignaciones | Asignar equipos a aulas/usuarios |
| Combinaciones | Crear workstations (PC + Monitor + Teclado) |
| Tracking | Seguimiento de memoria, garantías |
| Historial | Registro de asignaciones |

**Componentes Principales:**
- `ElectronicDeviceCard.tsx` - Tarjeta de dispositivo
- `EditElectronicDeviceModal.tsx` - Edición rápida
- `DynamicFieldRenderer.tsx` - Campos dinámicos

### 3.4 Módulo de Aulas

**Ruta**: `/admin/classrooms`

| Funcionalidad | Descripción |
|---------------|-------------|
| Gestión | CRUD de espacios/aulas |
| Evaluaciones | Sistema de evaluación de aulas |
| Asignaciones | Equipos asignados por aula |
| Responsables | Gestión de responsables |
| Reportes | Equipos por ubicación |

**Componentes Principales:**
- `ClassroomForm.tsx` - Formulario de aula
- `EvaluationFeedbackModal.tsx` - Feedback de evaluación
- `QuestionnaireForm.tsx` - Cuestionarios
- `PendingApprovals.tsx` - Aprobaciones pendientes

---

## 4. Funcionalidades Principales

### 4.1 Sistema de Bulto (Bag)

Permite solicitar múltiples herramientas en un solo préstamo:

```typescript
// Flujo del Bulto
1. Usuario escanea herramientas → Se agregan al Bag
2. Usuario revisa contenido del Bag
3. Usuario confirma préstamo
4. Sistema crea préstamo consolidado
5. Si existe préstamo activo → Agrega al existente
```

**Características:**
- Herramientas únicas (sin duplicados)
- Fecha de devolución única para todo el bulto
- Notas opcionales por préstamo
- Validación de disponibilidad en tiempo real

### 4.2 Sistema de Carrito

Permite solicitar múltiples consumibles en una transacción:

```typescript
// Flujo del Carrito
1. Usuario agrega consumibles al carrito
2. Usuario ajusta cantidades
3. Usuario elige: Solicitar Ahora o Reservar
4. Sistema procesa solicitud/reserva
5. Stock se actualiza automáticamente
```

**Características:**
- Persistencia en localStorage
- Edición de cantidades inline
- Validación de stock disponible
- Opción de reserva o solicitud inmediata

### 4.3 Sistema de Reservas

Permite apartar consumibles para recoger después:

```typescript
// Configuración de Reservas
{
  MAX_ACTIVE_RESERVATIONS_PER_USER: 5,
  MAX_QUANTITY_PER_ITEM: 50,
  MAX_PERCENTAGE_OF_STOCK: 0.5,  // 50%
  MIN_DAYS_UNTIL_EXPIRATION: 1,
  MAX_DAYS_UNTIL_EXPIRATION: 30,
  DEFAULT_RESERVATION_DAYS: 7,
  URGENT_NOTIFICATION_HOURS: 24
}
```

**Estados de Reserva:**
- `active` - Reserva activa
- `fulfilled` - Recogida completada
- `cancelled` - Cancelada por usuario
- `expired` - Expirada automáticamente

### 4.4 Sistema de Notificaciones

Notificaciones en tiempo real con múltiples canales:

| Canal | Tipo | Descripción |
|-------|------|-------------|
| **In-App** | Dropdown | Notificaciones en la aplicación |
| **Teams** | Webhook | Notificaciones a Microsoft Teams |
| **Sonido** | Audio | Alerta sonora opcional |

**Tipos de Notificaciones:**
- 🔵 **Info**: Información general
- 🟡 **Warning**: Advertencias (préstamos por vencer)
- 🟢 **Success**: Acciones exitosas
- 🔴 **Error**: Errores y rechazos

### 4.5 Sistema de Evaluaciones

Flujo completo de evaluación de aulas:

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE EVALUACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Admin crea evaluación/cuestionario                     │
│                    ↓                                        │
│  2. Admin asigna evaluación a evaluador                    │
│                    ↓                                        │
│  3. Evaluador completa cuestionario                        │
│                    ↓                                        │
│  4. Sistema envía notificación a Teams                     │
│                    ↓                                        │
│  5. Responsable de aula recibe feedback                    │
│                    ↓                                        │
│  6. Responsable responde feedback                          │
│                    ↓                                        │
│  7. Admin aprueba/rechaza evaluación                       │
│                    ↓                                        │
│  8. Notificación final a todas las partes                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 Escaneo QR

Sistema de identificación rápida mediante códigos QR:

**Modos de Escaneo:**
- **Individual**: Escanear un item a la vez
- **Multi-scan (Batch)**: Escanear múltiples items consecutivamente

**Flujo de Escaneo:**
```typescript
1. Usuario activa cámara
2. Sistema detecta código QR
3. Sistema valida QR en base de datos
4. Sistema muestra información del item
5. Usuario confirma acción (préstamo/devolución/consumo)
```

---

## 5. Integraciones

### 5.1 Microsoft Teams

Integración mediante Power Automate Workflows:

```typescript
// Configuración
TEAMS_WEBHOOK_URL=https://prod-XX.westus.logic.azure.com:443/workflows/...
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

**Eventos Notificados:**
| Evento | Color | Descripción |
|--------|-------|-------------|
| Evaluación Completada | 🔵 Azul | Nueva evaluación lista |
| Evaluación Aprobada | 🟢 Verde | Evaluación aprobada |
| Evaluación Rechazada | 🔴 Rojo | Evaluación rechazada |
| Préstamos Vencidos | 🟡 Amarillo | Alerta de vencimiento |
| Stock Bajo | 🟡 Amarillo | Alerta de inventario |

### 5.2 Supabase

Base de datos PostgreSQL con funcionalidades adicionales:

- **Autenticación**: Gestión de sesiones y usuarios
- **Realtime**: Suscripciones en tiempo real
- **Storage**: Almacenamiento de archivos
- **Edge Functions**: Funciones serverless

### 5.3 Exportación de Datos

Formatos de exportación disponibles:

| Formato | Librería | Uso |
|---------|----------|-----|
| **PDF** | jsPDF + jspdf-autotable | Reportes para impresión |
| **Excel** | xlsx | Análisis de datos |
| **CSV** | Nativo | Importación a otros sistemas |

---

## 6. Seguridad y Permisos

### 6.1 Roles del Sistema

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| **Usuario** | 1 | Acceso básico a solicitudes |
| **Evaluador** | 2 | Puede realizar evaluaciones |
| **Responsable** | 3 | Gestiona aula asignada |
| **Administrador** | 4 | Acceso completo al sistema |

### 6.2 Permisos por Módulo

```typescript
// Matriz de Permisos
{
  tools: {
    view: ['user', 'evaluator', 'responsible', 'admin'],
    request: ['user', 'evaluator', 'responsible', 'admin'],
    manage: ['admin']
  },
  consumables: {
    view: ['user', 'evaluator', 'responsible', 'admin'],
    request: ['user', 'evaluator', 'responsible', 'admin'],
    manage: ['admin']
  },
  electronics: {
    view: ['admin'],
    manage: ['admin']
  },
  classrooms: {
    view: ['responsible', 'admin'],
    evaluate: ['evaluator', 'admin'],
    manage: ['admin']
  },
  reports: {
    view: ['admin'],
    export: ['admin']
  },
  users: {
    manage: ['admin']
  }
}
```

### 6.3 Autenticación

- **Método**: JWT (JSON Web Tokens)
- **Proveedor**: Supabase Auth
- **Sesiones**: Persistentes con refresh tokens
- **Contraseñas**: Hasheadas con bcrypt

---

## 7. Stack Tecnológico

### 7.1 Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.5.4 | Framework React |
| **React** | 19.1.0 | Librería UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.x | Estilos |
| **Redux Toolkit** | 2.9.0 | Estado global |
| **RTK Query** | 2.9.0 | Data fetching |
| **Framer Motion** | 12.x | Animaciones |

### 7.2 Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js API Routes** | 15.x | API endpoints |
| **Supabase** | 2.48.1 | Base de datos |
| **PostgreSQL** | 15.x | Motor de BD |
| **JWT** | 9.0.2 | Autenticación |

### 7.3 Herramientas

| Tecnología | Propósito |
|------------|-----------|
| **html5-qrcode** | Escaneo QR |
| **jsPDF** | Generación PDF |
| **xlsx** | Exportación Excel |
| **Recharts** | Gráficos |
| **Sonner** | Notificaciones toast |
| **Lucide React** | Iconos |

---

## 8. Guía de Instalación

### 8.1 Requisitos Previos

- Node.js 18.x o superior
- npm 9.x o superior
- Cuenta de Supabase
- (Opcional) Webhook de Microsoft Teams

### 8.2 Instalación

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd inventory-system

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# 4. Editar .env.local con credenciales
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
# TEAMS_WEBHOOK_URL=... (opcional)

# 5. Ejecutar migraciones de base de datos
# (Ver documentación de migraciones)

# 6. Iniciar servidor de desarrollo
npm run dev
```

### 8.3 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your-secret-key

# Teams (Opcional)
TEAMS_WEBHOOK_URL=https://prod-XX.westus.logic.azure.com:443/workflows/...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 8.4 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Verificar código |
| `npm run test` | Ejecutar tests |
| `npm run type-check` | Verificar tipos |

---

## 📊 Métricas del Sistema

### Capacidades

| Métrica | Valor |
|---------|-------|
| Usuarios concurrentes | 100+ |
| Items en inventario | 10,000+ |
| Transacciones/día | 1,000+ |
| Tiempo de respuesta | < 200ms |

### Disponibilidad

- **Uptime objetivo**: 99.9%
- **Backup**: Automático diario
- **Recuperación**: < 1 hora

---

*Documentación Oficial - Sistema de Gestión de Inventario CCC*
*Versión: 0.1.0*
*Última actualización: Enero 2026*
