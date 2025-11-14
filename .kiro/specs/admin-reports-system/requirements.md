# Requirements Document

## Introduction

El sistema de reportes administrativos permitirá a los administradores generar, visualizar y exportar reportes detallados sobre préstamos, herramientas y consumibles. Este sistema proporcionará insights valiosos sobre el uso del inventario, tendencias de préstamos, niveles de stock y consumo de materiales, facilitando la toma de decisiones informadas y la gestión eficiente de recursos.

Los reportes incluirán visualizaciones gráficas, filtros avanzados, y capacidades de exportación en múltiples formatos (PDF, Excel, CSV). Para consumibles, se implementará un sistema de reportes por categorías que permita análisis granular del consumo por tipo de material.

## Requirements

### Requirement 1: Reportes de Préstamos (Loans)

**User Story:** Como administrador, quiero generar reportes detallados de préstamos, para poder analizar patrones de uso, identificar usuarios frecuentes y detectar préstamos vencidos o problemáticos.

#### Acceptance Criteria

1. WHEN el administrador accede a la sección de reportes de préstamos THEN el sistema SHALL mostrar un dashboard con métricas clave: total de préstamos activos, préstamos vencidos, tasa de devolución a tiempo, y duración promedio de préstamos
2. WHEN el administrador selecciona un rango de fechas THEN el sistema SHALL filtrar los datos del reporte para mostrar solo préstamos dentro de ese período
3. WHEN el administrador aplica filtros por usuario, herramienta o estado THEN el sistema SHALL actualizar el reporte mostrando solo los préstamos que cumplan los criterios seleccionados
4. WHEN el administrador visualiza el reporte THEN el sistema SHALL incluir gráficos de: préstamos por período (línea temporal), distribución por estado (pie chart), top 10 herramientas más prestadas (bar chart), y top 10 usuarios más activos (bar chart)
5. WHEN el administrador solicita exportar el reporte THEN el sistema SHALL generar un archivo en el formato seleccionado (PDF, Excel, CSV) con todos los datos filtrados y gráficos
6. WHEN el reporte incluye préstamos vencidos THEN el sistema SHALL resaltar visualmente estos casos con indicadores de color rojo y mostrar el número de días de retraso
7. WHEN el administrador hace clic en un elemento del reporte THEN el sistema SHALL mostrar detalles completos del préstamo incluyendo: usuario, herramienta, fechas, estado, y notas

### Requirement 2: Reportes de Inventario de Herramientas (Tools)

**User Story:** Como administrador, quiero generar reportes del inventario de herramientas, para poder monitorear el estado del inventario, identificar herramientas que requieren mantenimiento y optimizar la disponibilidad de recursos.

#### Acceptance Criteria

1. WHEN el administrador accede a la sección de reportes de herramientas THEN el sistema SHALL mostrar métricas clave: total de herramientas, herramientas disponibles, herramientas prestadas, herramientas en mantenimiento, herramientas perdidas/dañadas
2. WHEN el administrador filtra por categoría THEN el sistema SHALL mostrar solo las herramientas de la categoría seleccionada con sus estadísticas específicas
3. WHEN el administrador filtra por estado THEN el sistema SHALL mostrar solo las herramientas con el estado seleccionado (available, loaned, out-of-service, lost, damaged)
4. WHEN el administrador visualiza el reporte THEN el sistema SHALL incluir gráficos de: distribución por estado (pie chart), distribución por categoría (bar chart), tasa de utilización por herramienta (bar chart horizontal), y timeline de cambios de estado
5. WHEN el administrador solicita un reporte de utilización THEN el sistema SHALL calcular y mostrar el porcentaje de tiempo que cada herramienta ha estado prestada vs disponible
6. WHEN el administrador exporta el reporte THEN el sistema SHALL incluir información detallada: QR code, número de serie, categoría, estado actual, historial de préstamos, y notas de condición
7. WHEN el reporte identifica herramientas con baja utilización THEN el sistema SHALL resaltar estas herramientas con indicadores visuales y sugerencias de optimización

### Requirement 3: Reportes de Consumibles (Consumables)

**User Story:** Como administrador, quiero generar reportes de consumibles con análisis por categorías, para poder gestionar el stock eficientemente, predecir necesidades de reabastecimiento y controlar el consumo por área.

#### Acceptance Criteria

1. WHEN el administrador accede a la sección de reportes de consumibles THEN el sistema SHALL mostrar métricas clave: total de tipos de consumibles, items en stock bajo, valor total del inventario, y tasa de consumo promedio
2. WHEN el administrador selecciona "Reporte por Categorías" THEN el sistema SHALL agrupar todos los consumibles por categoría y mostrar métricas específicas para cada una: cantidad total, cantidad consumida, stock actual, y tendencia de consumo
3. WHEN el administrador filtra por categoría específica THEN el sistema SHALL mostrar un análisis detallado de esa categoría incluyendo: lista de items, niveles de stock, historial de consumo, y proyección de reabastecimiento
4. WHEN el administrador visualiza el reporte THEN el sistema SHALL incluir gráficos de: consumo por categoría (pie chart), tendencia de consumo temporal (line chart), items con stock bajo (bar chart), y comparativa de consumo entre categorías (stacked bar chart)
5. WHEN el sistema detecta stock bajo THEN el sistema SHALL resaltar los items con indicadores de alerta (amarillo para stock bajo, rojo para stock crítico) basándose en el minimum_quantity configurado
6. WHEN el administrador selecciona un rango de fechas THEN el sistema SHALL calcular el consumo total y promedio diario para ese período, desglosado por categoría
7. WHEN el administrador exporta el reporte de consumibles THEN el sistema SHALL incluir: nombre del item, categoría, stock actual, stock mínimo, cantidad consumida en el período, solicitudes pendientes (backorders), y proyección de días hasta agotamiento
8. WHEN el administrador solicita un reporte de solicitudes THEN el sistema SHALL mostrar todas las consumable_requests con su estado (pending, fulfilled, cancelled, backorder) agrupadas por categoría

### Requirement 4: Interfaz de Usuario y Navegación

**User Story:** Como administrador, quiero una interfaz intuitiva para acceder y generar reportes, para poder obtener la información que necesito de manera rápida y eficiente.

#### Acceptance Criteria

1. WHEN el administrador accede al dashboard administrativo THEN el sistema SHALL mostrar una nueva sección "Reports" con acceso a los tres tipos de reportes
2. WHEN el administrador hace clic en "Reports" THEN el sistema SHALL mostrar una página con tres tarjetas principales: "Loan Reports", "Tool Inventory Reports", y "Consumable Reports"
3. WHEN el administrador selecciona un tipo de reporte THEN el sistema SHALL navegar a una página dedicada con controles de filtrado en la parte superior y visualización de datos debajo
4. WHEN el administrador aplica filtros THEN el sistema SHALL actualizar los datos y gráficos en tiempo real sin recargar la página
5. WHEN el administrador interactúa con gráficos THEN el sistema SHALL proporcionar tooltips informativos y permitir hacer clic para ver detalles adicionales
6. WHEN el sistema está cargando datos del reporte THEN el sistema SHALL mostrar indicadores de carga apropiados y mantener la interfaz responsive
7. WHEN el administrador está en dispositivo móvil THEN el sistema SHALL adaptar la visualización de reportes para pantallas pequeñas, mostrando gráficos apilados verticalmente y tablas con scroll horizontal

### Requirement 5: Exportación y Compartición de Reportes

**User Story:** Como administrador, quiero exportar reportes en diferentes formatos, para poder compartirlos con otros stakeholders y mantener registros históricos.

#### Acceptance Criteria

1. WHEN el administrador hace clic en "Export" THEN el sistema SHALL mostrar opciones de formato: PDF, Excel (.xlsx), y CSV
2. WHEN el administrador selecciona formato PDF THEN el sistema SHALL generar un documento PDF profesional con logo, fecha de generación, filtros aplicados, gráficos visuales, y tablas de datos
3. WHEN el administrador selecciona formato Excel THEN el sistema SHALL generar un archivo .xlsx con múltiples hojas: una para resumen con gráficos, y otras para datos detallados con formato de tabla
4. WHEN el administrador selecciona formato CSV THEN el sistema SHALL generar un archivo CSV con todos los datos tabulares del reporte para análisis en herramientas externas
5. WHEN el sistema genera un archivo de exportación THEN el sistema SHALL incluir en el nombre del archivo: tipo de reporte, rango de fechas, y timestamp de generación (ej: "loan-report-2025-01-01-to-2025-01-31-20250205-143022.pdf")
6. WHEN la exportación se completa THEN el sistema SHALL iniciar automáticamente la descarga del archivo y mostrar una notificación de éxito
7. WHEN ocurre un error durante la exportación THEN el sistema SHALL mostrar un mensaje de error descriptivo y registrar el error en los logs del sistema

### Requirement 6: Rendimiento y Optimización

**User Story:** Como administrador, quiero que los reportes se generen rápidamente incluso con grandes volúmenes de datos, para poder trabajar eficientemente sin esperas prolongadas.

#### Acceptance Criteria

1. WHEN el sistema carga datos para un reporte THEN el sistema SHALL implementar paginación para conjuntos de datos grandes (más de 100 registros)
2. WHEN el administrador aplica filtros THEN el sistema SHALL ejecutar consultas optimizadas en el backend y devolver resultados en menos de 2 segundos para datasets normales
3. WHEN el sistema genera gráficos THEN el sistema SHALL utilizar librerías de visualización eficientes que rendericen sin bloquear la UI
4. WHEN el sistema calcula métricas agregadas THEN el sistema SHALL utilizar consultas SQL optimizadas con índices apropiados en lugar de procesamiento en memoria
5. WHEN el administrador exporta un reporte grande THEN el sistema SHALL procesar la exportación de manera asíncrona y notificar cuando esté lista
6. WHEN múltiples administradores generan reportes simultáneamente THEN el sistema SHALL manejar las solicitudes concurrentes sin degradación significativa del rendimiento
7. WHEN el sistema detecta consultas lentas THEN el sistema SHALL registrar métricas de rendimiento para identificación y optimización futura

### Requirement 7: Seguridad y Permisos

**User Story:** Como administrador del sistema, quiero que solo usuarios autorizados puedan acceder a los reportes, para proteger información sensible del inventario y usuarios.

#### Acceptance Criteria

1. WHEN un usuario no autenticado intenta acceder a reportes THEN el sistema SHALL redirigir al login y mostrar mensaje de autenticación requerida
2. WHEN un usuario autenticado sin rol de administrador intenta acceder a reportes THEN el sistema SHALL mostrar mensaje de "Access Denied" y registrar el intento en audit logs
3. WHEN un administrador accede a reportes THEN el sistema SHALL verificar el token JWT y los permisos antes de mostrar cualquier dato
4. WHEN el sistema registra acceso a reportes THEN el sistema SHALL crear entradas en audit_logs con: usuario, tipo de reporte, filtros aplicados, y timestamp
5. WHEN un administrador exporta un reporte THEN el sistema SHALL registrar la exportación en audit_logs incluyendo el formato y los datos exportados
6. WHEN el sistema detecta actividad sospechosa THEN el sistema SHALL implementar rate limiting para prevenir extracción masiva de datos
7. WHEN los datos sensibles aparecen en reportes THEN el sistema SHALL asegurar que información personal de usuarios esté protegida según políticas de privacidad
