# Documento de Requerimientos - Panel de Estadísticas

## Introducción

El Panel de Estadísticas es una página dedicada al monitoreo en tiempo real y control total de los recursos del sistema de inventario. Proporciona visualizaciones profesionales de métricas clave sobre consumibles, herramientas y electrónicos, permitiendo a los administradores tomar decisiones informadas basadas en datos de consumo, uso y tendencias.

## Glosario

- **Sistema**: El sistema de gestión de inventario completo
- **Panel de Estadísticas**: La página web dedicada a mostrar métricas y estadísticas en tiempo real
- **Consumible**: Material que se consume y no se devuelve (ej: tornillos, cables, pegamento)
- **Herramienta**: Equipo que se presta y debe ser devuelto (ej: taladros, destornilladores)
- **Electrónico**: Dispositivo electrónico que se presta y debe ser devuelto (ej: laptops, tablets)
- **Usuario**: Persona que solicita o utiliza recursos del sistema
- **Administrador**: Usuario con permisos para acceder al Panel de Estadísticas
- **Período de Tiempo**: Rango temporal seleccionable (día, semana, mes, trimestre, año)
- **Métrica**: Valor cuantificable que mide un aspecto específico del sistema
- **Dashboard**: Interfaz visual que agrupa múltiples métricas y gráficos
- **Stock Crítico**: Nivel de inventario que requiere atención inmediata
- **Tasa de Retorno**: Porcentaje de herramientas/electrónicos devueltos dentro del plazo establecido

## Requerimientos

### Requerimiento 1

**Historia de Usuario:** Como administrador, quiero visualizar el consumo de consumibles por cantidad, mes y usuario, para poder identificar patrones de uso y planificar reabastecimientos.

#### Criterios de Aceptación

1. WHEN el Administrador accede al Panel de Estadísticas, THE Sistema SHALL mostrar un gráfico de consumo de consumibles agrupado por mes
2. WHEN el Administrador selecciona un consumible específico, THE Sistema SHALL mostrar la cantidad consumida por cada Usuario en el período seleccionado
3. WHEN el Administrador selecciona un Período de Tiempo, THE Sistema SHALL actualizar todas las visualizaciones de consumo para reflejar ese rango temporal
4. THE Sistema SHALL calcular y mostrar el consumo total de cada tipo de consumible en unidades de medida apropiadas
5. THE Sistema SHALL permitir filtrar los datos de consumo por categoría de consumible

### Requerimiento 2

**Historia de Usuario:** Como administrador, quiero monitorear el uso de herramientas y electrónicos, para poder optimizar la disponibilidad y detectar equipos subutilizados o sobreutilizados.

#### Criterios de Aceptación

1. WHEN el Administrador accede a la sección de herramientas, THE Sistema SHALL mostrar la cantidad total de préstamos activos y completados
2. THE Sistema SHALL calcular y mostrar el porcentaje de disponibilidad de cada Herramienta y Electrónico
3. WHEN el Administrador visualiza las estadísticas de uso, THE Sistema SHALL mostrar el tiempo promedio de préstamo por categoría de equipo
4. THE Sistema SHALL identificar y mostrar las 10 Herramientas y Electrónicos más solicitados en el período seleccionado
5. THE Sistema SHALL mostrar la frecuencia de uso de cada equipo mediante un gráfico de barras o líneas

### Requerimiento 3

**Historia de Usuario:** Como administrador, quiero ver el inventario en tiempo real con alertas de stock bajo, para poder tomar acciones preventivas antes de quedarnos sin recursos críticos.

#### Criterios de Aceptación

1. THE Sistema SHALL actualizar los niveles de inventario cada 30 segundos sin requerir recarga manual de la página
2. WHEN un Consumible alcanza el punto de reorden definido, THE Sistema SHALL mostrar una alerta visual en color rojo
3. THE Sistema SHALL mostrar el stock actual versus el stock mínimo requerido para cada tipo de consumible
4. WHEN el Administrador visualiza el inventario, THE Sistema SHALL mostrar indicadores de estado (crítico, bajo, normal, alto) mediante códigos de color
5. THE Sistema SHALL calcular y mostrar el número de días estimados hasta agotar el stock basado en el consumo promedio

### Requerimiento 4

**Historia de Usuario:** Como administrador, quiero analizar la tasa de retorno de préstamos, para poder identificar usuarios o equipos con problemas de devolución y tomar medidas correctivas.

#### Criterios de Aceptación

1. THE Sistema SHALL calcular la Tasa de Retorno como el porcentaje de préstamos devueltos a tiempo versus el total de préstamos
2. WHEN el Administrador visualiza las estadísticas de retorno, THE Sistema SHALL mostrar la tasa de retorno global y por Usuario
3. THE Sistema SHALL identificar y mostrar los Usuarios con mayor cantidad de devoluciones tardías
4. THE Sistema SHALL mostrar el promedio de días de retraso para préstamos no devueltos a tiempo
5. WHEN un préstamo está vencido, THE Sistema SHALL incluirlo en el contador de préstamos pendientes con indicador visual

### Requerimiento 5

**Historia de Usuario:** Como administrador, quiero ver tendencias y comparativas de uso a lo largo del tiempo, para poder identificar patrones estacionales y planificar recursos futuros.

#### Criterios de Aceptación

1. THE Sistema SHALL generar gráficos de líneas que muestren tendencias de consumo mes a mes para los últimos 12 meses
2. WHEN el Administrador selecciona dos Períodos de Tiempo, THE Sistema SHALL mostrar una comparativa lado a lado de las métricas principales
3. THE Sistema SHALL calcular y mostrar el porcentaje de cambio entre períodos comparados
4. THE Sistema SHALL identificar y resaltar picos y valles significativos en los patrones de uso
5. THE Sistema SHALL permitir exportar los datos de tendencias en formato CSV o Excel

### Requerimiento 6

**Historia de Usuario:** Como administrador, quiero identificar los usuarios más activos del sistema, para poder reconocer patrones de uso y detectar posibles anomalías.

#### Criterios de Aceptación

1. THE Sistema SHALL generar un ranking de los 20 Usuarios más activos basado en cantidad de préstamos y consumos
2. WHEN el Administrador visualiza el ranking, THE Sistema SHALL mostrar el nombre del Usuario, cantidad de préstamos activos, y total de consumibles solicitados
3. THE Sistema SHALL calcular y mostrar el valor monetario total de recursos utilizados por cada Usuario en el período seleccionado
4. THE Sistema SHALL permitir filtrar el ranking por tipo de actividad (préstamos, consumos, o ambos)
5. WHEN el Administrador selecciona un Usuario del ranking, THE Sistema SHALL mostrar un desglose detallado de su actividad

### Requerimiento 7

**Historia de Usuario:** Como administrador, quiero visualizar costos asociados a consumos y préstamos, para poder gestionar el presupuesto y justificar inversiones en inventario.

#### Criterios de Aceptación

1. THE Sistema SHALL calcular y mostrar el costo total de consumibles utilizados en el Período de Tiempo seleccionado
2. THE Sistema SHALL mostrar el valor monetario de los préstamos activos actualmente en circulación
3. WHEN el Administrador visualiza los costos, THE Sistema SHALL desglosar los gastos por categoría de recurso
4. THE Sistema SHALL generar un gráfico de pastel que muestre la distribución porcentual de costos por categoría
5. THE Sistema SHALL calcular y mostrar el costo promedio por Usuario en el período seleccionado

### Requerimiento 8

**Historia de Usuario:** Como administrador, quiero recibir alertas visuales sobre situaciones críticas, para poder responder rápidamente a problemas que requieren atención inmediata.

#### Criterios de Aceptación

1. WHEN existe Stock Crítico en cualquier consumible, THE Sistema SHALL mostrar una notificación prominente en la parte superior del Dashboard
2. WHEN existen préstamos vencidos por más de 7 días, THE Sistema SHALL mostrar un contador de alertas con el número de préstamos afectados
3. THE Sistema SHALL mostrar un indicador visual cuando la disponibilidad de Herramientas o Electrónicos cae por debajo del 20%
4. THE Sistema SHALL agrupar todas las alertas activas en un panel dedicado con priorización por severidad
5. WHEN el Administrador hace clic en una alerta, THE Sistema SHALL navegar a la vista detallada del problema identificado

### Requerimiento 9

**Historia de Usuario:** Como administrador, quiero que el Panel de Estadísticas tenga un diseño profesional y responsivo, para poder acceder a las métricas desde cualquier dispositivo de manera efectiva.

#### Criterios de Aceptación

1. THE Sistema SHALL renderizar el Panel de Estadísticas con un diseño responsivo que se adapte a pantallas de escritorio, tablet y móvil
2. THE Sistema SHALL utilizar una paleta de colores consistente con el resto de la aplicación
3. THE Sistema SHALL organizar las métricas en tarjetas o widgets claramente delimitados con espaciado apropiado
4. THE Sistema SHALL utilizar gráficos interactivos que permitan hover para ver detalles adicionales
5. WHEN el Administrador accede desde un dispositivo móvil, THE Sistema SHALL reorganizar los widgets en una columna única manteniendo la legibilidad

### Requerimiento 10

**Historia de Usuario:** Como administrador, quiero poder filtrar y personalizar las visualizaciones del dashboard, para poder enfocarme en las métricas más relevantes para mi análisis actual.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar controles de filtro por Período de Tiempo con opciones predefinidas (hoy, semana, mes, trimestre, año, personalizado)
2. THE Sistema SHALL permitir filtrar todas las visualizaciones por categoría de recurso (consumibles, herramientas, electrónicos, o todos)
3. WHEN el Administrador aplica un filtro, THE Sistema SHALL actualizar todas las métricas y gráficos en menos de 2 segundos
4. THE Sistema SHALL mantener los filtros seleccionados durante la sesión del Usuario
5. THE Sistema SHALL proporcionar un botón para restablecer todos los filtros a sus valores predeterminados
