# Documento de Requisitos

## Introducción

El Sistema de Evaluación de Aulas es una funcionalidad para evaluar las condiciones de organización, limpieza y mantenimiento de equipos asignados en aulas de entrenamiento, almacenes y áreas de planta externa. El propósito principal es medir el nivel de responsabilidad de la persona encargada de cada espacio (campo `responsible_person` existente en el sistema).

El sistema incluirá:
- Programación de evaluaciones mediante calendario
- Cuestionarios de evaluación con preguntas configurables
- Sistema de puntuación para medir condiciones de los espacios
- Historial de evaluaciones para seguimiento temporal
- Reportes de desempeño por responsable y por espacio
- Panel administrativo para gestionar plantillas de preguntas

## Glosario

- **Sistema_Evaluacion**: El módulo de evaluación de condiciones de aulas
- **Evaluacion**: Una instancia de evaluación realizada a un espacio específico
- **Cuestionario**: Conjunto de preguntas utilizadas para evaluar un espacio
- **Pregunta**: Ítem individual de evaluación con opciones de respuesta (Sí, No, No aplica)
- **Plantilla**: Conjunto predefinido de preguntas para un tipo de espacio
- **Espacio**: Aula de entrenamiento, almacén o área de planta externa sujeta a evaluación
- **Responsable**: Persona asignada como encargada del espacio (campo `responsible_person`)
- **Puntuacion**: Valor numérico calculado basado en las respuestas del cuestionario
- **Programacion**: Evento calendarizado para realizar una evaluación futura

## Requisitos

### Requisito 1: Programación de Evaluaciones

**Historia de Usuario:** Como administrador, quiero programar evaluaciones de aulas en un calendario, para poder planificar cuándo se realizarán las inspecciones de cada espacio.

#### Criterios de Aceptación

1. CUANDO el administrador accede al módulo de evaluaciones ENTONCES el Sistema_Evaluacion DEBERÁ mostrar un calendario con las evaluaciones programadas y completadas
2. CUANDO el administrador selecciona una fecha en el calendario ENTONCES el Sistema_Evaluacion DEBERÁ permitir crear una nueva programación de evaluación para esa fecha
3. CUANDO el administrador crea una programación ENTONCES el Sistema_Evaluacion DEBERÁ requerir: espacio a evaluar, fecha y hora, y plantilla de cuestionario a utilizar
4. CUANDO existe una evaluación programada para un espacio ENTONCES el Sistema_Evaluacion DEBERÁ mostrar el evento en el calendario con indicador visual del estado (pendiente, completada, vencida)
5. CUANDO el administrador visualiza el calendario ENTONCES el Sistema_Evaluacion DEBERÁ permitir filtrar por tipo de espacio (aula de entrenamiento, almacén, planta externa)
6. CUANDO una evaluación programada no se completa en la fecha asignada ENTONCES el Sistema_Evaluacion DEBERÁ marcarla como vencida y resaltarla visualmente
7. CUANDO el administrador edita una programación ENTONCES el Sistema_Evaluacion DEBERÁ permitir cambiar la fecha, hora o plantilla mientras el estado sea pendiente
8. CUANDO el administrador elimina una programación pendiente ENTONCES el Sistema_Evaluacion DEBERÁ solicitar confirmación y registrar la cancelación

### Requisito 2: Gestión de Plantillas y Preguntas

**Historia de Usuario:** Como administrador, quiero crear y gestionar plantillas de cuestionarios con preguntas personalizables, para poder adaptar las evaluaciones a diferentes tipos de espacios.

#### Criterios de Aceptación

1. CUANDO el administrador accede a la gestión de plantillas ENTONCES el Sistema_Evaluacion DEBERÁ mostrar la lista de plantillas existentes con nombre, tipo de espacio y número de preguntas
2. CUANDO el administrador crea una nueva plantilla ENTONCES el Sistema_Evaluacion DEBERÁ requerir: nombre de plantilla, tipo de espacio aplicable, y al menos una pregunta
3. CUANDO el administrador agrega una pregunta a la plantilla ENTONCES el Sistema_Evaluacion DEBERÁ permitir definir: texto de la pregunta, categoría (organización, limpieza, mantenimiento), y si es obligatoria
4. CUANDO el administrador define una pregunta ENTONCES el Sistema_Evaluacion DEBERÁ establecer las opciones de respuesta como: Sí, No, No aplica
5. CUANDO el administrador edita una plantilla ENTONCES el Sistema_Evaluacion DEBERÁ permitir agregar, modificar o eliminar preguntas
6. CUANDO una plantilla está en uso por evaluaciones existentes ENTONCES el Sistema_Evaluacion DEBERÁ crear una nueva versión al modificarla, preservando el historial
7. CUANDO el administrador elimina una plantilla ENTONCES el Sistema_Evaluacion DEBERÁ verificar que no tenga evaluaciones pendientes asociadas antes de permitir la eliminación
8. CUANDO el administrador visualiza una plantilla ENTONCES el Sistema_Evaluacion DEBERÁ mostrar las preguntas agrupadas por categoría

### Requisito 3: Ejecución de Evaluaciones

**Historia de Usuario:** Como evaluador, quiero completar cuestionarios de evaluación para los espacios asignados, para poder registrar las condiciones observadas durante la inspección.

#### Criterios de Aceptación

1. CUANDO el evaluador inicia una evaluación programada ENTONCES el Sistema_Evaluacion DEBERÁ mostrar el cuestionario con todas las preguntas de la plantilla asociada
2. CUANDO el evaluador responde una pregunta ENTONCES el Sistema_Evaluacion DEBERÁ permitir seleccionar una opción: Sí, No, o No aplica
3. CUANDO el evaluador selecciona "No" en una pregunta ENTONCES el Sistema_Evaluacion DEBERÁ mostrar un campo opcional para agregar observaciones o evidencia
4. CUANDO el evaluador intenta enviar la evaluación ENTONCES el Sistema_Evaluacion DEBERÁ validar que todas las preguntas obligatorias tengan respuesta
5. CUANDO el evaluador completa todas las preguntas requeridas ENTONCES el Sistema_Evaluacion DEBERÁ calcular la puntuación automáticamente
6. CUANDO el evaluador envía la evaluación ENTONCES el Sistema_Evaluacion DEBERÁ registrar: fecha/hora de completado, evaluador, respuestas, puntuación, y observaciones
7. CUANDO la evaluación se guarda exitosamente ENTONCES el Sistema_Evaluacion DEBERÁ actualizar el estado de la programación a completada
8. CUANDO el evaluador necesita pausar la evaluación ENTONCES el Sistema_Evaluacion DEBERÁ permitir guardar progreso parcial como borrador

### Requisito 4: Sistema de Puntuación

**Historia de Usuario:** Como administrador, quiero que el sistema calcule puntuaciones basadas en las respuestas, para poder medir objetivamente las condiciones de cada espacio y el desempeño del responsable.

#### Criterios de Aceptación

1. CUANDO el Sistema_Evaluacion calcula la puntuación ENTONCES DEBERÁ asignar: 1 punto por cada "Sí", 0 puntos por cada "No", y excluir las respuestas "No aplica" del cálculo
2. CUANDO el Sistema_Evaluacion presenta la puntuación ENTONCES DEBERÁ mostrarla como porcentaje: (puntos obtenidos / puntos posibles) × 100
3. CUANDO el Sistema_Evaluacion calcula puntuación por categoría ENTONCES DEBERÁ mostrar puntuaciones separadas para: organización, limpieza, y mantenimiento
4. CUANDO la puntuación total es menor al 70% ENTONCES el Sistema_Evaluacion DEBERÁ clasificar el resultado como "Requiere Atención" con indicador visual rojo
5. CUANDO la puntuación total está entre 70% y 89% ENTONCES el Sistema_Evaluacion DEBERÁ clasificar el resultado como "Aceptable" con indicador visual amarillo
6. CUANDO la puntuación total es 90% o mayor ENTONCES el Sistema_Evaluacion DEBERÁ clasificar el resultado como "Excelente" con indicador visual verde
7. CUANDO el Sistema_Evaluacion almacena una evaluación ENTONCES DEBERÁ guardar tanto la puntuación total como las puntuaciones por categoría

### Requisito 5: Historial y Seguimiento

**Historia de Usuario:** Como administrador, quiero ver el historial de evaluaciones de cada espacio, para poder identificar tendencias y dar seguimiento a las mejoras o deterioros.

#### Criterios de Aceptación

1. CUANDO el administrador selecciona un espacio ENTONCES el Sistema_Evaluacion DEBERÁ mostrar el historial completo de evaluaciones ordenado por fecha
2. CUANDO el administrador visualiza el historial ENTONCES el Sistema_Evaluacion DEBERÁ mostrar: fecha, evaluador, puntuación total, puntuaciones por categoría, y estado
3. CUANDO el administrador selecciona una evaluación del historial ENTONCES el Sistema_Evaluacion DEBERÁ mostrar el detalle completo con todas las respuestas y observaciones
4. CUANDO existen múltiples evaluaciones de un espacio ENTONCES el Sistema_Evaluacion DEBERÁ mostrar un gráfico de tendencia de puntuaciones en el tiempo
5. CUANDO el administrador filtra el historial por rango de fechas ENTONCES el Sistema_Evaluacion DEBERÁ mostrar solo las evaluaciones dentro del período seleccionado
6. CUANDO el administrador compara evaluaciones ENTONCES el Sistema_Evaluacion DEBERÁ permitir seleccionar dos evaluaciones y mostrar diferencias lado a lado

### Requisito 6: Reportes de Desempeño

**Historia de Usuario:** Como administrador, quiero generar reportes de desempeño por responsable y por espacio, para poder evaluar el nivel de responsabilidad de cada encargado.

#### Criterios de Aceptación

1. CUANDO el administrador accede a reportes ENTONCES el Sistema_Evaluacion DEBERÁ mostrar opciones: reporte por responsable, reporte por espacio, y reporte general
2. CUANDO el administrador genera reporte por responsable ENTONCES el Sistema_Evaluacion DEBERÁ mostrar: nombre del responsable, espacios a cargo, promedio de puntuación, tendencia, y número de evaluaciones
3. CUANDO el administrador genera reporte por espacio ENTONCES el Sistema_Evaluacion DEBERÁ mostrar: nombre del espacio, responsable actual, última puntuación, promedio histórico, y tendencia
4. CUANDO el administrador genera reporte general ENTONCES el Sistema_Evaluacion DEBERÁ mostrar: ranking de responsables por puntuación promedio, espacios con mejor y peor desempeño, y métricas globales
5. CUANDO el administrador selecciona un rango de fechas para el reporte ENTONCES el Sistema_Evaluacion DEBERÁ calcular métricas solo para evaluaciones dentro del período
6. CUANDO el administrador exporta un reporte ENTONCES el Sistema_Evaluacion DEBERÁ generar archivo en formato PDF o Excel con los datos y gráficos
7. CUANDO el reporte identifica responsables con bajo desempeño ENTONCES el Sistema_Evaluacion DEBERÁ resaltar aquellos con promedio menor al 70%

### Requisito 7: Interfaz de Usuario

**Historia de Usuario:** Como usuario del sistema, quiero una interfaz intuitiva para acceder a las funcionalidades de evaluación, para poder realizar mis tareas de manera eficiente.

#### Criterios de Aceptación

1. CUANDO el administrador accede al panel de administración ENTONCES el Sistema_Evaluacion DEBERÁ mostrar una nueva sección "Evaluaciones" en el menú de aulas
2. CUANDO el usuario accede a la sección de evaluaciones ENTONCES el Sistema_Evaluacion DEBERÁ mostrar pestañas para: Calendario, Plantillas, Historial, y Reportes
3. CUANDO el usuario interactúa con el calendario ENTONCES el Sistema_Evaluacion DEBERÁ seguir el patrón visual del componente ReservationsCalendar existente
4. CUANDO el usuario completa un cuestionario ENTONCES el Sistema_Evaluacion DEBERÁ mostrar progreso visual del porcentaje de preguntas respondidas
5. CUANDO el sistema está procesando una acción ENTONCES el Sistema_Evaluacion DEBERÁ mostrar indicadores de carga apropiados
6. CUANDO el usuario está en dispositivo móvil ENTONCES el Sistema_Evaluacion DEBERÁ adaptar la interfaz para pantallas pequeñas manteniendo funcionalidad completa
7. CUANDO ocurre un error ENTONCES el Sistema_Evaluacion DEBERÁ mostrar mensajes descriptivos en español y opciones de recuperación

### Requisito 8: Integración con Sistema Existente

**Historia de Usuario:** Como desarrollador, quiero que el sistema de evaluaciones se integre con los módulos existentes, para mantener consistencia y aprovechar la infraestructura actual.

#### Criterios de Aceptación

1. CUANDO el Sistema_Evaluacion obtiene lista de espacios ENTONCES DEBERÁ utilizar los datos existentes de la tabla classrooms
2. CUANDO el Sistema_Evaluacion muestra información del responsable ENTONCES DEBERÁ utilizar el campo responsible_person de la tabla classrooms
3. CUANDO el Sistema_Evaluacion requiere autenticación ENTONCES DEBERÁ utilizar el sistema de autenticación JWT existente
4. CUANDO el Sistema_Evaluacion verifica permisos ENTONCES DEBERÁ utilizar el sistema de roles existente (admin requerido para gestión)
5. CUANDO el Sistema_Evaluacion almacena datos ENTONCES DEBERÁ crear nuevas tablas en Supabase siguiendo las convenciones existentes
6. CUANDO el Sistema_Evaluacion implementa API endpoints ENTONCES DEBERÁ seguir el patrón de rutas existente en /api/admin/
7. CUANDO el Sistema_Evaluacion maneja estado ENTONCES DEBERÁ utilizar Redux Toolkit y RTK Query siguiendo los patrones establecidos
