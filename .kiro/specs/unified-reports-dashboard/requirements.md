# Requirements Document

## Introduction

Este documento define los requisitos para la centralización de reportes y estadísticas del sistema de inventario. Actualmente, el sistema cuenta con múltiples páginas de reportes dispersas (`/admin/statistics`, `/admin/reports/*`, `/admin/dashboard`) que han crecido orgánicamente. El objetivo es unificar toda esta información en un único panel de control centralizado que ofrezca una vista completa de métricas, estadísticas y reportes detallados.

## Glossary

- **Dashboard Unificado**: Página central que consolida todas las estadísticas y reportes del sistema
- **KPI (Key Performance Indicator)**: Métricas clave de rendimiento del inventario
- **Widget**: Componente visual reutilizable que muestra una métrica o gráfico específico
- **Módulo de Reporte**: Sección específica del dashboard dedicada a un área (herramientas, consumibles, préstamos, etc.)
- **Filtro Global**: Filtro que afecta a todos los widgets y módulos del dashboard simultáneamente
- **Exportación**: Funcionalidad para descargar datos en formatos como Excel o PDF

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to access all statistics and reports from a single unified page, so that I can have a complete overview of the inventory system without navigating between multiple pages.

#### Acceptance Criteria

1. WHEN an administrator navigates to the unified dashboard THEN the system SHALL display a consolidated view with all major KPIs visible on the initial screen
2. WHEN the unified dashboard loads THEN the system SHALL show summary cards for: total tools, available tools, active loans, overdue loans, consumables stock, low stock alerts, electronic devices, and total users
3. WHEN the administrator views the dashboard THEN the system SHALL organize content into logical sections: Overview, Tools, Consumables, Loans, Electronics, and Classrooms
4. WHEN the administrator clicks on a section tab THEN the system SHALL display detailed metrics and charts specific to that section without page reload

### Requirement 2

**User Story:** As an administrator, I want to apply global filters that affect all dashboard sections, so that I can analyze data for specific time periods or categories efficiently.

#### Acceptance Criteria

1. WHEN an administrator selects a date range filter THEN the system SHALL update all time-sensitive metrics and charts across all sections
2. WHEN an administrator selects a category filter THEN the system SHALL filter relevant data in all applicable sections
3. WHEN filters are applied THEN the system SHALL persist the filter state during the session
4. WHEN the administrator clears filters THEN the system SHALL reset all sections to show unfiltered data

### Requirement 3

**User Story:** As an administrator, I want to see interactive charts and visualizations, so that I can understand trends and patterns in inventory usage.

#### Acceptance Criteria

1. WHEN the dashboard displays charts THEN the system SHALL render interactive charts that respond to hover events showing detailed tooltips
2. WHEN displaying trend data THEN the system SHALL show line charts for consumption over time, loan activity, and stock levels
3. WHEN displaying distribution data THEN the system SHALL show pie or bar charts for category breakdowns and status distributions
4. WHEN a chart is rendered THEN the system SHALL support responsive sizing for different screen widths

### Requirement 4

**User Story:** As an administrator, I want to export dashboard data to Excel, so that I can share reports with stakeholders or perform offline analysis.

#### Acceptance Criteria

1. WHEN an administrator clicks the export button THEN the system SHALL generate an Excel file containing the currently visible data
2. WHEN exporting data THEN the system SHALL include all applied filters in the export metadata
3. WHEN the export completes THEN the system SHALL download the file with a descriptive filename including the date
4. WHEN exporting section-specific data THEN the system SHALL create separate sheets for each data category

### Requirement 5

**User Story:** As an administrator, I want to see real-time alerts for critical inventory situations, so that I can take immediate action on urgent matters.

#### Acceptance Criteria

1. WHEN items fall below minimum stock threshold THEN the system SHALL display a low stock alert in the alerts panel
2. WHEN loans become overdue THEN the system SHALL display an overdue loan alert with the number of affected items
3. WHEN the administrator clicks on an alert THEN the system SHALL navigate to the relevant detail view
4. WHEN alerts exist THEN the system SHALL display a badge count on the alerts section header

### Requirement 6

**User Story:** As an administrator, I want to view detailed breakdowns by clicking on summary metrics, so that I can drill down into specific data points.

#### Acceptance Criteria

1. WHEN an administrator clicks on a summary metric card THEN the system SHALL expand or navigate to show detailed breakdown data
2. WHEN viewing detailed data THEN the system SHALL display a paginated table with sorting capabilities
3. WHEN drilling down into data THEN the system SHALL maintain the current filter context
4. WHEN viewing detailed tables THEN the system SHALL allow searching within the displayed data

### Requirement 7

**User Story:** As an administrator, I want the dashboard to load quickly with progressive data loading, so that I can start viewing information immediately without waiting for all data.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display skeleton loaders for sections still fetching data
2. WHEN data is fetched THEN the system SHALL load critical KPIs first before loading detailed charts
3. WHEN multiple API calls are needed THEN the system SHALL execute them in parallel where dependencies allow
4. WHEN a section fails to load THEN the system SHALL display an error state with retry option without affecting other sections

### Requirement 8

**User Story:** As an administrator, I want to see a top users section showing the most active users, so that I can identify usage patterns and heavy users.

#### Acceptance Criteria

1. WHEN the dashboard displays top users THEN the system SHALL show a ranked list of users by activity level
2. WHEN displaying user activity THEN the system SHALL include metrics for active loans, consumables used, and total cost
3. WHEN an administrator clicks on a user row THEN the system SHALL navigate to the user detail page
4. WHEN displaying the top users table THEN the system SHALL allow filtering by activity type (loans, consumables, or both)

### Requirement 9

**User Story:** As an administrator, I want the dashboard to support both light and dark themes, so that I can use the interface comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the system theme changes THEN the dashboard SHALL update all components to match the selected theme
2. WHEN rendering charts THEN the system SHALL use theme-appropriate colors for data visualization
3. WHEN displaying cards and panels THEN the system SHALL apply consistent theme styling across all elements

### Requirement 10

**User Story:** As an administrator, I want to see classroom equipment reports integrated into the unified dashboard, so that I can monitor device assignments across educational spaces.

#### Acceptance Criteria

1. WHEN viewing the Classrooms section THEN the system SHALL display a summary of total classrooms and assigned devices
2. WHEN displaying classroom data THEN the system SHALL show device distribution by classroom
3. WHEN an administrator selects a classroom THEN the system SHALL display the list of assigned electronic devices
4. WHEN viewing classroom reports THEN the system SHALL include device status and assignment history

### Requirement 11

**User Story:** As an administrator, I want to see consumption statistics per user, so that I can track individual usage patterns and identify high-consumption users.

#### Acceptance Criteria

1. WHEN viewing user consumption data THEN the system SHALL display total quantity consumed per user
2. WHEN displaying consumption statistics THEN the system SHALL show breakdown by consumable type for each user
3. WHEN viewing user consumption THEN the system SHALL include historical consumption trends over time
4. WHEN filtering by date range THEN the system SHALL update user consumption totals to reflect the selected period
5. WHEN displaying consumption data THEN the system SHALL allow sorting users by total consumption quantity

### Requirement 12

**User Story:** As an administrator, I want to see electronic device reports including movement history between classrooms, so that I can track device locations and transfers over time.

#### Acceptance Criteria

1. WHEN viewing the Electronics section THEN the system SHALL display total devices, devices by status, and devices by brand
2. WHEN displaying device data THEN the system SHALL show current classroom assignment for each device
3. WHEN viewing device history THEN the system SHALL display a timeline of classroom transfers for each device
4. WHEN filtering by classroom THEN the system SHALL show all devices currently assigned and previously assigned to that classroom
5. WHEN displaying movement reports THEN the system SHALL include transfer date, origin classroom, destination classroom, and responsible user
