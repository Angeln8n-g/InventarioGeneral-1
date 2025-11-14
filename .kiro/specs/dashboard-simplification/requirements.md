# Dashboard + Scanner Unification - Requirements

## Introduction

Actualmente existen dos páginas separadas (Dashboard y Scanner) que muestran opciones similares, creando redundancia y confusión para el usuario. Este rediseño unifica ambas páginas en una sola vista principal que sirve como punto de entrada único para todas las acciones principales de la aplicación.

## Problem Statement

**Problemas Identificados:**
1. Dashboard y Scanner son dos páginas separadas con funcionalidad similar
2. El usuario no sabe si ir a Dashboard o Scanner para realizar acciones
3. Código duplicado y mantenimiento innecesario de dos páginas
4. Navegación confusa con dos tabs que hacen cosas similares

**Objetivo:**
Unificar Dashboard y Scanner en una sola página principal que contenga:
- Las 4 acciones principales de Scanner (Scan to Loan, Scan to Return, Request Supplies, My Loans)
- Return Consumables (acción única del dashboard)
- Active Loans (información contextual)
- Todo en un solo lugar, eliminando la necesidad de dos páginas separadas

## Requirements

### Requirement 1: Unified Dashboard with Scanner Actions

**User Story:** Como usuario, quiero tener todas las acciones principales en una sola página al entrar a la aplicación, para no tener que buscar entre múltiples páginas.

#### Acceptance Criteria

1. WHEN el usuario accede al dashboard THEN el sistema SHALL mostrar un header personalizado con saludo, notificaciones y configuración
2. WHEN el usuario ve el dashboard THEN el sistema SHALL mostrar 4 action cards principales:
   - Scan to Loan (escanear para préstamo) - destacado en rojo
   - Scan to Return (escanear para devolver)
   - Request Supplies (solicitar suministros)
   - My Loans (ver mis préstamos)
3. WHEN el usuario ve el dashboard THEN el sistema SHALL mostrar la card "Return Consumables" con borde destacado
4. WHEN el usuario ve el dashboard THEN el sistema SHALL mostrar la card "Devolver Herramientas"
5. WHEN el usuario ve el dashboard THEN el sistema SHALL mostrar la sección "Active Loans" con préstamos activos

### Requirement 2: Scanner Actions Integration

**User Story:** Como usuario, quiero poder acceder a todas las funciones de escaneo desde el dashboard, sin necesidad de ir a una página separada de Scanner.

#### Acceptance Criteria

1. WHEN el usuario hace click en "Scan to Loan" THEN el sistema SHALL abrir el escáner QR para crear préstamos
2. WHEN el usuario hace click en "Scan to Return" THEN el sistema SHALL abrir el escáner QR para devolver herramientas
3. WHEN el usuario hace click en "Request Supplies" THEN el sistema SHALL navegar a la página de solicitud de suministros
4. WHEN el usuario hace click en "My Loans" THEN el sistema SHALL navegar a la página de préstamos del usuario
5. WHEN el usuario escanea un código QR THEN el sistema SHALL mantener la funcionalidad actual del bag/bulto

### Requirement 3: Active Loans Display

**User Story:** Como usuario, quiero ver mis préstamos activos en el dashboard, para tener una visión rápida de mi estado actual.

#### Acceptance Criteria

1. WHEN el usuario tiene préstamos activos THEN el sistema SHALL mostrar la sección "Active Loans" con cada préstamo mostrando:
   - Nombre de la herramienta
   - Código/Serial
   - Fecha de devolución esperada
   - Días restantes
   - Estado visual (verde/amarillo/rojo según urgencia)

2. WHEN el usuario no tiene préstamos activos THEN el sistema SHALL mostrar un estado vacío con mensaje "No Active Loans"

3. WHEN el usuario hace click en un préstamo THEN el sistema SHALL navegar a los detalles del préstamo

### Requirement 4: Scanner Tab Elimination

**User Story:** Como usuario, no quiero tener un tab separado de Scanner cuando todas las funciones están en el Dashboard, para evitar confusión.

#### Acceptance Criteria

1. WHEN el usuario ve el bottom navigation THEN el sistema SHALL NOT mostrar un tab "Scanner" separado

2. WHEN el usuario accede a la ruta /tools/scan THEN el sistema SHALL redirigir a /dashboard

3. WHEN el usuario está en el dashboard THEN el sistema SHALL mostrar el tab "Dashboard" como activo en el bottom navigation

### Requirement 5: Icon Consistency

**User Story:** Como usuario, quiero que los iconos de las acciones sean consistentes y reconocibles, para identificar rápidamente cada acción.

#### Acceptance Criteria

1. WHEN el usuario ve "Scan to Loan" THEN el sistema SHALL mostrar un icono de escáner QR en rojo
2. WHEN el usuario ve "Scan to Return" THEN el sistema SHALL mostrar un icono de check/return
3. WHEN el usuario ve "Request Supplies" THEN el sistema SHALL mostrar un icono de caja/paquete
4. WHEN el usuario ve "My Loans" THEN el sistema SHALL mostrar un icono de lista/clipboard
5. WHEN el usuario ve "Return Consumables" THEN el sistema SHALL mostrar un icono de reciclaje
6. WHEN el usuario ve "Devolver Herramientas" THEN el sistema SHALL mostrar un icono de edificio/institución

### Requirement 6: Responsive Layout

**User Story:** Como usuario, quiero que el dashboard se vea bien en todos los dispositivos, para poder usarlo desde mi teléfono, tablet o computadora.

#### Acceptance Criteria

1. WHEN el usuario ve el dashboard en mobile (< 768px) THEN el sistema SHALL mostrar las cards en grid 2x3
2. WHEN el usuario ve el dashboard en tablet (768px - 1024px) THEN el sistema SHALL mostrar las cards en grid 2x3 con mayor espaciado
3. WHEN el usuario ve el dashboard en desktop (> 1024px) THEN el sistema SHALL mostrar las cards en grid 2x3 o layout optimizado
4. WHEN el usuario hace scroll THEN el sistema SHALL mantener el header fijo en la parte superior

## Design Principles

### 1. All-in-One Hub
El dashboard es el punto de entrada único que contiene todas las acciones principales.

### 2. No Separate Scanner
Eliminar la página Scanner separada - toda su funcionalidad vive en el Dashboard.

### 3. Visual Hierarchy
Las acciones más comunes (Scan to Loan) deben destacar visualmente.

### 4. Context-Aware
Mostrar información relevante (Active Loans) junto con las acciones.

## Out of Scope

- Modificar la funcionalidad interna del escáner QR
- Modificar la funcionalidad de My Loans (página de destino)
- Modificar la funcionalidad de Consumables (página de destino)
- Cambiar otros tabs del bottom navigation (My Loans, Consumables, Admin)

## Success Metrics

1. **Reducción de Confusión:** Usuarios no preguntan "¿dónde escaneo?" porque saben que es en Scanner
2. **Tiempo en Dashboard:** Reducción del tiempo porque el usuario encuentra rápido lo que busca
3. **Uso de Bottom Nav:** Aumento del uso del bottom navigation como método principal de navegación
4. **Satisfacción:** Usuarios reportan que el dashboard es "útil" en lugar de "confuso"

## User Flow

```
Usuario entra a la app
    ↓
Dashboard Unificado (Todo en un lugar)
    ├─ [Scan to Loan] → Abre escáner QR
    ├─ [Scan to Return] → Abre escáner QR para devolución
    ├─ [Request Supplies] → Va a solicitud de suministros
    ├─ [My Loans] → Va a página de préstamos
    ├─ [Return Consumables] → Va a devolución de consumibles
    ├─ [Devolver Herramientas] → Va a devolución de herramientas
    └─ Ve Active Loans (información contextual)
```

## Wireframe Comparison

### Antes (Dos páginas separadas)
```
Dashboard:                    Scanner:
┌─────────────────────┐      ┌─────────────────────┐
│ Header              │      │ Header              │
├─────────────────────┤      ├─────────────────────┤
│ [Escanear]          │      │ [Scan to Loan]      │
│ [Solicitar]         │      │ [Scan to Return]    │
│ [Return]            │      │ [Request Supplies]  │
│ [Devolver]          │      │ [My Loans]          │
│                     │      │                     │
│ Active Loans        │      │ QR Scanner          │
└─────────────────────┘      └─────────────────────┘
     ↑                              ↑
     └──────── Redundancia ─────────┘
```

### Después (Una sola página unificada)
```
Dashboard Unificado:
┌─────────────────────────────┐
│ Hello, Felix_Rosario! 🔔 ⚙️ │
├─────────────────────────────┤
│ [Scan to Loan]  [Solicitar] │  ← 4 acciones principales
│     (rojo)      Herramientas│
│                             │
│ [Request]       [My Loans]  │
│  Supplies                   │
├─────────────────────────────┤
│ [Return         [Devolver]  │  ← 2 acciones adicionales
│  Consumables]   Herramientas│
│  (destacado)                │
├─────────────────────────────┤
│ Active Loans                │  ← Información contextual
│ ┌─────────────────────────┐ │
│ │ Hammer #123 - 2 days    │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

## Technical Considerations

1. **Mantener componentes existentes:** Reutilizar ActiveLoansSection, DashboardHeader, etc.
2. **No romper rutas:** Todas las rutas existentes deben seguir funcionando
3. **Responsive:** El diseño debe funcionar en mobile, tablet y desktop
4. **Performance:** No degradar el performance actual
5. **Accesibilidad:** Mantener o mejorar la accesibilidad

## Dependencies

- Componentes existentes de dashboard
- Bottom navigation existente
- Rutas existentes (/consumables/return, /loans, etc.)
- Sistema de autenticación actual

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Usuarios acostumbrados al dashboard actual | Medium | Mantener rutas antiguas funcionando, agregar tooltips |
| Confusión sobre dónde escanear | High | Hacer el tab Scanner más prominente, agregar onboarding |
| Pérdida de acceso rápido | Low | Return Consumables sigue disponible, resto en bottom nav |

## Acceptance Testing Scenarios

### Scenario 1: Usuario con préstamos activos
```
GIVEN un usuario con 2 préstamos activos
WHEN accede al dashboard
THEN ve sus 2 préstamos con estado
AND ve el botón "Return Consumables"
AND NO ve botones de escanear/solicitar
```

### Scenario 2: Usuario sin préstamos
```
GIVEN un usuario sin préstamos activos
WHEN accede al dashboard
THEN ve un estado vacío amigable
AND ve el botón "Return Consumables"
AND puede navegar a Scanner usando bottom nav
```

### Scenario 3: Usuario necesita escanear
```
GIVEN un usuario en el dashboard
WHEN necesita escanear una herramienta
THEN hace click en el tab "Scanner" del bottom nav
AND es dirigido a /tools/scan
```

### Scenario 4: Usuario necesita devolver herramienta
```
GIVEN un usuario con un préstamo activo
WHEN hace click en "Return" en el préstamo
THEN es dirigido a la página de devolución
AND el préstamo está pre-seleccionado
```
