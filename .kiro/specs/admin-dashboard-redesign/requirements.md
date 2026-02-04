# Requirements Document

## Introduction

Este documento define los requisitos para el rediseño completo del Admin Dashboard siguiendo un Design System unificado. El objetivo es crear una interfaz moderna, accesible y consistente que priorice el modo oscuro, sea mobile-first, y se adapte dinámicamente según los permisos del usuario. El sistema debe integrarse con el `PermissionsContext` existente para mostrar/ocultar módulos según el rol del usuario.

## Glossary

- **Design_System**: Conjunto de principios, tokens, y componentes reutilizables que definen la identidad visual y comportamiento de la interfaz
- **Dashboard**: Interfaz principal de administración que muestra KPIs, métricas, y acciones rápidas
- **Token**: Variable de diseño (color, espaciado, tipografía) que se usa consistentemente en toda la aplicación
- **Component**: Elemento de UI reutilizable e independiente con comportamiento definido
- **Role_Based_UI**: Sistema donde la interfaz se adapta dinámicamente según los permisos del usuario
- **Breakpoint**: Punto de quiebre donde el layout cambia según el tamaño de pantalla
- **Skeleton**: Placeholder animado que indica carga de contenido
- **Toast**: Notificación temporal que aparece para confirmar acciones o mostrar errores
- **KPI_Grid**: Cuadrícula de tarjetas que muestran métricas clave de rendimiento
- **Bottom_Sheet**: Modal que aparece desde la parte inferior en dispositivos móviles
- **Sidebar**: Panel lateral de navegación en tablet y desktop

## Requirements

### Requirement 1: Design Tokens Foundation

**User Story:** As a developer, I want a centralized design token system, so that I can maintain visual consistency across all components.

#### Acceptance Criteria

1. THE Design_System SHALL define color tokens for Primary (#E50914), Primary_Hover (#FF2A2A), Accent (#4ADE80), Warning (#F59E0B), and Danger (#EF4444)
2. THE Design_System SHALL define neutral tokens for Background (#0B0F14), Surface (#151A21), Card (#1E2430), Border (#2A3242), Text_Primary (#FFFFFF), Text_Secondary (#9CA3AF), and Disabled (#6B7280)
3. THE Design_System SHALL define spacing tokens based on multiples of 4 (4, 8, 12, 16, 24, 32 pixels)
4. THE Design_System SHALL define border radius tokens for Cards (12px), Buttons (10px), and Modals (16px)
5. THE Design_System SHALL define typography tokens using Inter/SF Pro/Roboto font family with SemiBold for headings and Regular for body text
6. WHEN a token value is changed THEN all components using that token SHALL reflect the change automatically

### Requirement 2: Responsive Layout System

**User Story:** As a user, I want the dashboard to adapt to my device, so that I can use it effectively on mobile, tablet, or desktop.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px (mobile) THEN the Dashboard SHALL display content in a single column with vertical scroll and bottom navigation
2. WHEN the viewport width is between 768px and 1024px (tablet) THEN the Dashboard SHALL display content in two columns with a collapsible sidebar
3. WHEN the viewport width is greater than 1024px (desktop) THEN the Dashboard SHALL display content in a flexible grid with a fixed sidebar
4. THE Layout_System SHALL implement mobile-first CSS where base styles target mobile and media queries add complexity for larger screens
5. WHEN the sidebar is collapsed on tablet THEN the Dashboard SHALL expand the main content area to use available space
6. THE Bottom_Navigation SHALL only be visible on mobile breakpoint

### Requirement 3: Role-Based UI Adaptation

**User Story:** As an administrator, I want the dashboard to show only the modules I have permission to access, so that I see a relevant and uncluttered interface.

#### Acceptance Criteria

1. THE Dashboard SHALL integrate with the existing PermissionsContext to determine visible modules
2. WHEN a user lacks permission for a module THEN the Dashboard SHALL hide that module completely without leaving empty spaces
3. THE Dashboard SHALL automatically reorder and redistribute visible modules to fill available space when modules are hidden
4. WHEN permissions change THEN the Dashboard SHALL update the visible modules without requiring a page refresh
5. EACH dashboard module SHALL declare its required permissions using the pattern `<ModuleName roles={[permission1, permission2]} />`
6. IF a user has no permissions for any dashboard modules THEN the Dashboard SHALL display an appropriate empty state message

### Requirement 4: AppBar Component (Header)

**User Story:** As a user, I want a consistent header across all dashboard views, so that I can easily navigate and access common actions.

#### Acceptance Criteria

1. THE AppBar SHALL display the application logo on the left side
2. THE AppBar SHALL display the page title in the center on mobile and left-aligned on desktop
3. THE AppBar SHALL display user notifications icon with unread count badge
4. THE AppBar SHALL display user avatar with dropdown menu for profile and logout
5. WHEN on mobile THEN the AppBar SHALL have a height of 56px
6. WHEN on desktop THEN the AppBar SHALL have a height of 64px
7. THE AppBar SHALL use the Surface (#151A21) background color with Border (#2A3242) bottom border

### Requirement 5: Bottom Navigation Component (Mobile)

**User Story:** As a mobile user, I want easy access to main sections, so that I can navigate the app with one hand.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL display a maximum of 5 navigation items
2. THE Bottom_Navigation SHALL highlight the active item using Primary (#E50914) color
3. THE Bottom_Navigation SHALL use inactive items in Text_Secondary (#9CA3AF) color
4. WHEN a navigation item is tapped THEN the Bottom_Navigation SHALL provide haptic feedback
5. THE Bottom_Navigation SHALL have a height of 64px with safe area padding for devices with home indicators
6. THE Bottom_Navigation SHALL only render on viewports less than 768px wide

### Requirement 6: Metric Card Component

**User Story:** As an administrator, I want to see key metrics at a glance, so that I can quickly assess system status.

#### Acceptance Criteria

1. THE Metric_Card SHALL display a title, value, and optional trend indicator
2. THE Metric_Card SHALL use Card (#1E2430) background with Border (#2A3242) border
3. THE Metric_Card SHALL use 12px border radius
4. WHEN the trend is positive THEN the Metric_Card SHALL display an up arrow in Accent (#4ADE80) color
5. WHEN the trend is negative THEN the Metric_Card SHALL display a down arrow in Danger (#EF4444) color
6. WHEN data is loading THEN the Metric_Card SHALL display a skeleton placeholder with pulse animation
7. THE Metric_Card SHALL support an optional icon displayed in Primary (#E50914) color

### Requirement 7: Action Card Component

**User Story:** As a user, I want quick access to common actions, so that I can perform tasks efficiently.

#### Acceptance Criteria

1. THE Action_Card SHALL display an icon, title, and optional description
2. THE Action_Card SHALL use Card (#1E2430) background that transitions to Surface (#151A21) on hover
3. WHEN pressed THEN the Action_Card SHALL scale to 95% with a smooth transition
4. THE Action_Card SHALL support a highlighted variant with Primary (#E50914) border
5. THE Action_Card SHALL be keyboard accessible with visible focus states
6. WHEN the action is disabled THEN the Action_Card SHALL use Disabled (#6B7280) color and prevent interaction

### Requirement 8: Button Components

**User Story:** As a user, I want consistent button styles, so that I can easily identify interactive elements.

#### Acceptance Criteria

1. THE Button_Primary SHALL use Primary (#E50914) background with white text
2. WHEN hovered THEN the Button_Primary SHALL transition to Primary_Hover (#FF2A2A)
3. THE Button_Secondary SHALL use transparent background with Primary (#E50914) border and text
4. THE Button_Ghost SHALL use transparent background with Text_Secondary (#9CA3AF) text that changes to Text_Primary on hover
5. THE Button_Danger SHALL use Danger (#EF4444) background with white text
6. ALL buttons SHALL use 10px border radius and 16px horizontal padding
7. WHEN disabled THEN ALL buttons SHALL use Disabled (#6B7280) background and prevent interaction
8. ALL buttons SHALL display a loading spinner when in loading state

### Requirement 9: List Components

**User Story:** As a user, I want organized lists of items, so that I can scan and find information quickly.

#### Acceptance Criteria

1. THE List_Simple SHALL display items with consistent padding (16px) and Border (#2A3242) separators
2. THE List_With_Status SHALL display a status indicator dot using Accent (#4ADE80) for active, Warning (#F59E0B) for pending, and Danger (#EF4444) for error
3. THE List_With_Action SHALL display an action button or icon on the right side of each item
4. WHEN a list item is tapped THEN it SHALL provide visual feedback with background color change
5. THE List components SHALL support virtualization for lists with more than 50 items
6. WHEN a list is empty THEN it SHALL display an appropriate empty state with icon and message

### Requirement 10: Modal and Drawer Components

**User Story:** As a user, I want contextual dialogs for focused tasks, so that I can complete actions without losing my place.

#### Acceptance Criteria

1. THE Modal SHALL use Card (#1E2430) background with 16px border radius
2. THE Modal SHALL display a header with title and close button
3. THE Modal SHALL trap focus within its content when open
4. WHEN on mobile THEN the Modal SHALL render as a Bottom_Sheet sliding up from the bottom
5. WHEN on desktop THEN the Modal SHALL render centered with a backdrop overlay
6. THE Modal SHALL close when clicking the backdrop or pressing Escape key
7. THE Modal SHALL animate in with a slide-up (mobile) or fade-scale (desktop) transition

### Requirement 11: KPI Grid Dashboard Module

**User Story:** As an administrator, I want to see all key performance indicators in one view, so that I can monitor system health.

#### Acceptance Criteria

1. THE KPI_Grid SHALL display Metric_Cards in a responsive grid (1 column mobile, 2 columns tablet, 4 columns desktop)
2. THE KPI_Grid SHALL require the "dashboard:view_kpis" permission to be visible
3. THE KPI_Grid SHALL display metrics for: total loans, active users, pending returns, and inventory alerts
4. WHEN data fails to load THEN the KPI_Grid SHALL display an error state with retry button
5. THE KPI_Grid SHALL refresh data automatically every 30 seconds
6. THE KPI_Grid SHALL support manual refresh via pull-to-refresh on mobile

### Requirement 12: Admin Modules (Users, Tools, Logs)

**User Story:** As an administrator, I want dedicated sections for managing users, tools, and viewing logs, so that I can perform administrative tasks efficiently.

#### Acceptance Criteria

1. THE Manage_Users module SHALL require the "users:manage" permission to be visible
2. THE Manage_Tools module SHALL require the "tools:manage" permission to be visible
3. THE Logs_Audit module SHALL require the "logs:view" permission to be visible
4. EACH admin module SHALL display as a collapsible section on mobile and as a card on desktop
5. THE admin modules SHALL display a summary count in their header (e.g., "Users (45)")
6. WHEN expanded THEN each admin module SHALL display a searchable list with pagination

### Requirement 13: Loading States and Feedback

**User Story:** As a user, I want clear feedback during loading and actions, so that I know the system is responding.

#### Acceptance Criteria

1. WHEN content is loading THEN the Dashboard SHALL display skeleton placeholders matching the expected content shape
2. THE Skeleton components SHALL use Surface (#151A21) background with a pulse animation
3. WHEN an action succeeds THEN the Dashboard SHALL display a success Toast with Accent (#4ADE80) accent
4. WHEN an action fails THEN the Dashboard SHALL display an error Toast with Danger (#EF4444) accent
5. THE Toast SHALL auto-dismiss after 4 seconds with option to dismiss manually
6. THE Toast SHALL stack when multiple notifications occur, showing maximum 3 at once

### Requirement 14: Empty States

**User Story:** As a user, I want helpful empty states, so that I understand why there's no content and what I can do.

#### Acceptance Criteria

1. WHEN a list or section has no data THEN the Dashboard SHALL display an empty state component
2. THE Empty_State SHALL display an illustrative icon, title, and description
3. THE Empty_State SHALL optionally display a call-to-action button
4. THE Empty_State SHALL use Text_Secondary (#9CA3AF) for text and a muted icon
5. EACH module type SHALL have a contextually appropriate empty state message

### Requirement 15: Error States

**User Story:** As a user, I want clear error messages, so that I understand what went wrong and how to recover.

#### Acceptance Criteria

1. WHEN a module fails to load THEN the Dashboard SHALL display an error state in place of the content
2. THE Error_State SHALL display an error icon, message, and retry button
3. THE Error_State SHALL use Danger (#EF4444) for the icon and retry button
4. WHEN retry is clicked THEN the module SHALL attempt to reload its data
5. IF multiple retries fail THEN the Error_State SHALL suggest contacting support

### Requirement 16: Dark Mode Implementation

**User Story:** As a user, I want a dark interface by default, so that I can use the dashboard comfortably in low-light environments.

#### Acceptance Criteria

1. THE Dashboard SHALL use dark mode as the default theme
2. ALL components SHALL use the defined neutral color tokens for dark mode
3. THE Dashboard SHALL ensure minimum 4.5:1 contrast ratio for all text
4. THE Dashboard SHALL ensure minimum 3:1 contrast ratio for interactive elements
5. WHEN displaying images or icons THEN the Dashboard SHALL ensure they are optimized for dark backgrounds

### Requirement 17: Component Naming Convention

**User Story:** As a developer, I want consistent naming conventions, so that I can easily find and use components.

#### Acceptance Criteria

1. ALL component files SHALL use PascalCase naming (e.g., MetricCard.tsx)
2. ALL component variants SHALL use kebab-case naming (e.g., button-primary, button-secondary)
3. ALL design tokens SHALL use camelCase naming (e.g., colorPrimary, spacingMd)
4. ALL component props interfaces SHALL be named with "Props" suffix (e.g., MetricCardProps)
5. ALL component directories SHALL be organized by feature or type (e.g., components/dashboard/, components/ui/)
