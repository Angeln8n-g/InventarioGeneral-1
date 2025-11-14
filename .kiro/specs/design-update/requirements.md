# Actualización de Diseño - Esquema de Colores

## Objetivo
Implementar un nuevo esquema de colores moderno y consistente en toda la aplicación, con soporte para modo oscuro mejorado.

## User Stories

### 1. Como usuario, quiero ver una interfaz con colores modernos y consistentes
**Criterios de aceptación:**
- Los colores primarios y de acento están actualizados según el nuevo diseño
- El modo oscuro usa los nuevos colores de fondo y texto
- Las tarjetas y componentes usan los nuevos colores

### 2. Como usuario, quiero que el modo oscuro sea más legible y atractivo
**Criterios de aceptación:**
- El fondo oscuro usa el color #1A1A2E
- Las tarjetas oscuras usan el color #2B2B45
- El texto en modo oscuro es más legible con #E0E0E0

### 3. Como desarrollador, quiero que los colores sean fáciles de mantener
**Criterios de aceptación:**
- Los colores están definidos en la configuración de Tailwind
- Los nombres de colores son semánticos y descriptivos
- Se pueden usar como clases de Tailwind estándar

## Esquema de Colores

### Colores Principales
- **Primary**: #8B5CF6 (Púrpura vibrante)
- **Blue Accent**: #3B82F6
- **Green Accent**: #22C55E
- **Yellow Accent**: #EAB308
- **Red Accent**: #EF4444

### Colores de Fondo
- **Background Light**: #F8FAFC
- **Background Dark**: #1A1A2E
- **Card Light**: #FFFFFF
- **Card Dark**: #2B2B45

### Colores de Texto
- **Text Light**: #1E293B
- **Text Dark**: #E0E0E0
- **Text Secondary Light**: #64748B
- **Text Secondary Dark**: #B0B0B0

## Alcance
- Actualizar configuración de Tailwind CSS
- Actualizar componentes principales (Header, Footer, Dashboard)
- Mantener compatibilidad con componentes existentes
