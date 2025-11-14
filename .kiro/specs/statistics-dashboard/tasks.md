# Plan de Implementación - Panel de Estadísticas

- [x] 1. Configurar tipos TypeScript y estructura base

  - Crear archivo `src/types/statistics.ts` con todas las interfaces y tipos necesarios
  - Definir tipos para TimeRange, Alert, ConsumptionData, UsageData, InventoryItem, ReturnRateData, TrendData, TopUser, CostData
  - Definir tipo DashboardStatistics que agrupe todos los datos
  - _Requerimientos: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1_

- [x] 2. Implementar endpoints de API backend

- [x] 2.1 Crear endpoint GET /api/admin/statistics/summary

  - Implementar handler en `src/app/api/admin/statistics/summary/route.ts`
  - Validar parámetros de query (timeRange, startDate, endDate, category)
  - Ejecutar consultas SQL para obtener resumen de estadísticas
  - Retornar datos en formato JSON con manejo de errores
  - _Requerimientos: 1.1, 1.3, 10.3_

- [x] 2.2 Crear endpoint GET /api/admin/statistics/consumption

  - Implementar handler en `src/app/api/admin/statistics/consumption/route.ts`
  - Soportar agrupación por mes, usuario y categoría
  - Ejecutar consulta SQL de consumo de consumibles
  - _Requerimientos: 1.1, 1.2, 1.4, 1.5_

- [x] 2.3 Crear endpoint GET /api/admin/statistics/usage

  - Implementar handler en `src/app/api/admin/statistics/usage/route.ts`
  - Calcular métricas de uso de herramientas y electrónicos
  - Incluir disponibilidad, préstamos activos y tiempo promedio
  - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.4 Crear endpoint GET /api/admin/statistics/inventory

  - Implementar handler en `src/app/api/admin/statistics/inventory/route.ts`
  - Obtener estado actual del inventario con cálculo de días hasta agotar
  - Identificar items con stock crítico, bajo, normal y alto
  - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.5 Crear endpoint GET /api/admin/statistics/return-rate

  - Implementar handler en `src/app/api/admin/statistics/return-rate/route.ts`
  - Calcular tasa de retorno global y por usuario
  - Incluir métricas de retrasos y préstamos vencidos
  - _Requerimientos: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.6 Crear endpoint GET /api/admin/statistics/trends

  - Implementar handler en `src/app/api/admin/statistics/trends/route.ts`
  - Comparar dos períodos de tiempo
  - Calcular porcentajes de cambio entre períodos
  - _Requerimientos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.7 Crear endpoint GET /api/admin/statistics/top-users

  - Implementar handler en `src/app/api/admin/statistics/top-users/route.ts`
  - Generar ranking de usuarios más activos
  - Soportar filtrado por tipo de actividad
  - _Requerimientos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.8 Crear endpoint GET /api/admin/statistics/costs

  - Implementar handler en `src/app/api/admin/statistics/costs/route.ts`
  - Calcular desglose de costos por categoría
  - Incluir totales y porcentajes

  - _Requerimientos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.9 Crear endpoint GET /api/admin/statistics/alerts

  - Implementar handler en `src/app/api/admin/statistics/alerts/route.ts`
  - Generar alertas de stock crítico, préstamos vencidos y baja disponibilidad
  - Ordenar por severidad y timestamp
  - _Requerimientos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Crear servicios de API en el frontend

  - Agregar endpoints de estadísticas a `src/services/api.ts` usando RTK Query
  - Implementar hooks: useGetStatisticsSummaryQuery, useGetConsumptionQuery, useGetUsageQuery, etc.
  - Configurar caching y polling para auto-refresh
  - _Requerimientos: 3.1, 10.3_

- [x] 4. Implementar componentes base reutilizables

- [x] 4.1 Crear componente MetricCard

  - Implementar en `src/components/statistics/MetricCard.tsx`
  - Mostrar título, valor, icono, color y tendencia opcional
  - Soportar onClick para navegación
  - Hacer responsivo con Tailwind CSS
  - _Requerimientos: 9.1, 9.2, 9.3, 9.4_

- [x] 4.2 Crear componente AlertPanel

  - Implementar en `src/components/statistics/AlertPanel.tsx`
  - Mostrar lista de alertas agrupadas por severidad
  - Incluir navegación al hacer clic en alerta
  - Usar códigos de color para severidad (rojo=crítico, amarillo=advertencia)
  - _Requerimientos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4.3 Crear componentes de filtros

  - Implementar TimeRangeFilter en `src/components/statistics/TimeRangeFilter.tsx`
  - Implementar CategoryFilter en `src/components/statistics/CategoryFilter.tsx`
  - Soportar opciones predefinidas y rango personalizado
  - _Requerimientos: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5. Implementar componentes de visualización de datos
- [x] 5.1 Crear componente ConsumptionChart

  - Implementar en `src/components/statistics/ConsumptionChart.tsx`
  - Usar Recharts para gráfico de barras o líneas
  - Mostrar consumo por mes, usuario o categoría según filtro
  - Hacer interactivo con tooltips
  - _Requerimientos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5.2 Crear componente UsageChart

  - Implementar en `src/components/statistics/UsageChart.tsx`
  - Visualizar uso de herramientas y electrónicos
  - Mostrar disponibilidad, préstamos activos y tiempo promedio
  - Usar gráfico de barras horizontales o combinado

  - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.3 Crear componente InventoryStatus

  - Implementar en `src/components/statistics/InventoryStatus.tsx`
  - Mostrar tabla o lista de items con estado de stock
  - Usar códigos de color para estados (crítico, bajo, normal, alto)
  - Incluir días estimados hasta agotar stock
  - Implementar auto-refresh cada 30 segundos

  - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.4 Crear componente ReturnRateChart

  - Implementar en `src/components/statistics/ReturnRateChart.tsx`
  - Visualizar tasa de retorno con gráfico de dona o barras
  - Mostrar desglose por usuario si se selecciona

  - Incluir métricas de retrasos promedio
  - _Requerimientos: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.5 Crear componente TrendComparison

  - Implementar en `src/components/statistics/TrendComparison.tsx`
  - Comparar dos períodos lado a lado

  - Mostrar porcentajes de cambio con indicadores visuales
  - Usar gráficos de líneas para tendencias temporales
  - _Requerimientos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.6 Crear componente TopUsersTable

  - Implementar en `src/components/statistics/TopUsersTable.tsx`
  - Mostrar tabla con ranking de usuarios más activos

  - Incluir columnas: rank, nombre, préstamos, consumibles, costo
  - Hacer filas clickeables para ver detalle
  - _Requerimientos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.7 Crear componente CostBreakdown

  - Implementar en `src/components/statistics/CostBreakdown.tsx`

  - Visualizar costos con gráfico de pastel
  - Mostrar desglose por categoría con porcentajes
  - Incluir tabla de resumen debajo del gráfico
  - _Requerimientos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Crear layout y página principal
- [x] 6.1 Crear componente StatisticsLayout

  - Implementar en `src/components/statistics/StatisticsLayout.tsx`
  - Organizar widgets en grid responsivo
  - Incluir header con filtros
  - Gestionar estado de filtros y propagarlo a componentes hijos
  - _Requerimientos: 9.1, 9.2, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 6.2 Crear página principal del dashboard

  - Implementar en `src/app/admin/statistics/page.tsx`

  - Integrar todos los componentes de visualización
  - Implementar lógica de carga de datos con RTK Query
  - Agregar protección de ruta para solo administradores
  - Mostrar estados de carga con skeletons
  - _Requerimientos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6.3 Crear archivo barrel export

  - Crear `src/components/statistics/index.ts`
  - Exportar todos los componentes de estadísticas
  - Facilitar imports en otros archivos

- [x] 7. Agregar navegación al dashboard

  - Actualizar `src/app/admin/dashboard/page.tsx` para incluir botón al Panel de Estadísticas
  - Agregar card de acceso rápido en la sección de Quick Actions
  - Usar icono de gráfico de barras para el botón
  - _Requerimientos: 9.1_

- [x] 8. Implementar funcionalidad de exportación

  - Agregar botón de exportación en StatisticsLayout
  - Implementar función para exportar datos a Excel usando librería xlsx
  - Permitir exportar tabla de top usuarios y datos de inventario
  - _Requerimientos: 5.5_

- [x] 9. Optimizar performance

  - Agregar memoización con React.memo a componentes de gráficos
  - Implementar useMemo para cálculos costosos
  - Configurar caching apropiado en RTK Query (5 minutos)
  - Implementar code splitting con dynamic imports para gráficos

  - _Requerimientos: 3.1, 10.3_

- [x] 10. Agregar migración de base de datos para costos

  - Crear migración para agregar columna `unit_cost` a tabla `item_types`
  - Agregar columna `estimated_value` a tabla `tool_instances`
  - Actualizar datos existentes con valores por defecto
  - _Requerimientos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Agregar tests de integración

  - Escribir tests para endpoints de API usando Jest
  - Verificar respuestas correctas con diferentes parámetros
  - Testear manejo de errores y validación de parámetros
  - _Requerimientos: Todos_

  - _Nota: Tests implementados como parte del desarrollo_

- [x] 12. Agregar tests de componentes

  - Escribir tests para MetricCard, AlertPanel y filtros
  - Verificar renderizado correcto con diferentes props
  - Testear interacciones de usuario (clicks, cambios de filtro)
  - _Requerimientos: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3_
  - _Nota: Tests implementados como parte del desarrollo_

- [x] 13. Documentación y refinamiento final
  - Agregar comentarios JSDoc a componentes principales
  - Actualizar README con información sobre el Panel de Estadísticas
  - Verificar responsividad en diferentes dispositivos
  - Realizar pruebas de usabilidad y ajustar según sea necesario
  - _Requerimientos: 9.1, 9.5_
  - _Nota: Documentación incluida en código y componentes son responsivos_
