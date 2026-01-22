# Plan de Implementación: Sistema de Evaluación de Aulas

## Visión General

Este plan implementa el sistema de evaluación de condiciones de aulas, almacenes y planta externa para medir el nivel de responsabilidad de los encargados. La implementación sigue los patrones existentes del proyecto (Next.js 15, Supabase, TypeScript, Tailwind CSS).

## Tareas

- [x] 1. Configurar base de datos y tipos
  - [x] 1.1 Crear migración de Supabase con las 5 nuevas tablas
    - Crear tabla `evaluation_templates` con campos: id, name, space_type, version, is_active, created_by, timestamps
    - Crear tabla `template_questions` con campos: id, template_id, question_text, category, is_required, display_order, timestamps
    - Crear tabla `scheduled_evaluations` con campos: id, classroom_id, template_id, scheduled_date, status, created_by, timestamps
    - Crear tabla `evaluation_results` con campos: id, scheduled_evaluation_id, evaluator_id, completed_at, scores (total, por categoría), is_draft, timestamps
    - Crear tabla `evaluation_responses` con campos: id, result_id, question_id, response, observation, timestamps
    - Crear índices para optimización de consultas
    - _Requisitos: 8.5_

  - [x] 1.2 Crear tipos TypeScript en src/types/evaluations.ts
    - Definir tipos: SpaceType, QuestionCategory, ResponseType, EvaluationStatus
    - Definir interfaces: EvaluationTemplate, TemplateQuestion, ScheduledEvaluation, EvaluationResult, EvaluationResponse
    - Definir interfaces con relaciones: EvaluationTemplateWithQuestions, ScheduledEvaluationWithDetails, EvaluationResultWithResponses
    - Definir inputs: CreateTemplateInput, UpdateTemplateInput, CreateScheduledEvaluationInput, CreateEvaluationResultInput
    - Definir tipos de reportes: ResponsiblePerformance, SpacePerformance
    - _Requisitos: 4.1, 4.3, 4.7_

  - [x] 1.3 Escribir property test para validación de tipos de respuesta
    - **Propiedad 8: Opciones de respuesta son exactamente tres**
    - **Valida: Requisitos 2.4, 3.2**

- [x] 2. Implementar capa de acceso a datos
  - [x] 2.1 Crear operaciones de base de datos en src/lib/supabase-client.ts
    - Implementar evaluationTemplateOperations: getAll, getById, create, update, delete, getBySpaceType
    - Implementar templateQuestionOperations: getByTemplateId, create, update, delete, reorder
    - Implementar scheduledEvaluationOperations: getAll, getById, create, update, delete, getByDateRange, getByClassroom
    - Implementar evaluationResultOperations: create, update, getByScheduledId, getByClassroom, getByResponsible
    - Implementar evaluationResponseOperations: createBatch, getByResultId
    - _Requisitos: 8.1, 8.2_

  - [x] 2.2 Implementar funciones de cálculo de puntuación
    - Crear función calculateScore(responses): calcula puntuación total y por categoría
    - Crear función calculatePercentage(score, max): calcula porcentaje
    - Crear función classifyScore(percentage): retorna clasificación (requires_attention, acceptable, excellent)
    - _Requisitos: 4.1, 4.2, 4.4, 4.5, 4.6_

  - [x] 2.3 Escribir property test para cálculo de puntuación
    - **Propiedad 1: Cálculo de puntuación sigue la fórmula definida**
    - **Valida: Requisitos 4.1**

  - [x] 2.4 Escribir property test para clasificación de puntuación
    - **Propiedad 4: Clasificación de puntuación es consistente con umbrales**
    - **Valida: Requisitos 4.4, 4.5, 4.6**

  - [x] 2.5 Escribir property test para puntuaciones por categoría
    - **Propiedad 3: Puntuaciones por categoría suman correctamente**
    - **Valida: Requisitos 4.3**

- [x] 3. Checkpoint - Verificar base de datos y cálculos
  - Ejecutar migración de base de datos
  - Verificar que todas las tablas se crearon correctamente
  - Ejecutar tests de propiedades de puntuación
  - Preguntar al usuario si hay dudas

- [x] 4. Implementar API endpoints de plantillas
  - [x] 4.1 Crear endpoint GET/POST /api/admin/evaluations/templates
    - GET: listar todas las plantillas activas con conteo de preguntas
    - POST: crear nueva plantilla con validación de campos requeridos
    - Usar middleware withPermission para verificar rol admin
    - _Requisitos: 2.1, 2.2, 8.3, 8.4_

  - [x] 4.2 Crear endpoint GET/PUT/DELETE /api/admin/evaluations/templates/[id]
    - GET: obtener plantilla con todas sus preguntas
    - PUT: actualizar plantilla, crear nueva versión si tiene evaluaciones existentes
    - DELETE: eliminar plantilla solo si no tiene evaluaciones pendientes
    - _Requisitos: 2.5, 2.6, 2.7_

  - [x] 4.3 Escribir property test para validación de plantilla
    - **Propiedad 6: Plantilla requiere al menos una pregunta**
    - **Valida: Requisitos 2.2**

  - [x] 4.4 Escribir property test para versionado de plantillas
    - **Propiedad 13: Modificar plantilla en uso crea nueva versión**
    - **Valida: Requisitos 2.6**

  - [x] 4.5 Escribir property test para eliminación de plantillas
    - **Propiedad 12: Plantillas con evaluaciones pendientes no pueden eliminarse**
    - **Valida: Requisitos 2.7**

- [x] 5. Implementar API endpoints de programación
  - [x] 5.1 Crear endpoint GET/POST /api/admin/evaluations/schedule
    - GET: obtener evaluaciones programadas con filtros (fecha, classroom, status)
    - POST: crear nueva programación con validación de campos requeridos
    - _Requisitos: 1.2, 1.3_

  - [x] 5.2 Crear endpoint GET/PUT/DELETE /api/admin/evaluations/schedule/[id]
    - GET: obtener detalle de evaluación programada
    - PUT: actualizar programación solo si estado es pending
    - DELETE: cancelar programación (cambiar status a cancelled)
    - _Requisitos: 1.7, 1.8_

  - [x] 5.3 Crear endpoint GET /api/admin/evaluations/calendar
    - Obtener evaluaciones por rango de fechas para el calendario
    - Incluir información de classroom y template
    - Marcar automáticamente como overdue las evaluaciones vencidas
    - _Requisitos: 1.1, 1.4, 1.6_

  - [x] 5.4 Escribir property test para validación de programación
    - **Propiedad 5: Programación de evaluación requiere campos obligatorios**
    - **Valida: Requisitos 1.3**

  - [x] 5.5 Escribir property test para evaluaciones vencidas
    - **Propiedad 9: Evaluaciones vencidas se marcan automáticamente**
    - **Valida: Requisitos 1.6**

  - [x] 5.6 Escribir property test para edición de evaluaciones
    - **Propiedad 10: Solo evaluaciones pendientes son editables**
    - **Valida: Requisitos 1.7**

- [x] 6. Implementar API endpoints de ejecución de evaluaciones
  - [x] 6.1 Crear endpoint GET /api/admin/evaluations/[id]/questionnaire
    - Obtener cuestionario completo con todas las preguntas de la plantilla
    - Incluir respuestas existentes si hay borrador guardado
    - _Requisitos: 3.1_

  - [x] 6.2 Crear endpoint POST /api/admin/evaluations/[id]/submit
    - Validar que todas las preguntas obligatorias tengan respuesta
    - Calcular puntuaciones (total y por categoría)
    - Guardar resultado y respuestas
    - Actualizar estado de programación a completed
    - Soportar guardado como borrador (is_draft: true)
    - _Requisitos: 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.3 Escribir property test para validación de respuestas obligatorias
    - **Propiedad 7: Respuestas obligatorias deben estar presentes para enviar**
    - **Valida: Requisitos 3.4**

  - [x] 6.4 Escribir property test para actualización de estado
    - **Propiedad 11: Evaluación completada actualiza estado de programación**
    - **Valida: Requisitos 3.7**

  - [x] 6.5 Escribir property test para cuestionario completo
    - **Propiedad 16: Cuestionario contiene todas las preguntas de la plantilla**
    - **Valida: Requisitos 3.1**

- [x] 7. Checkpoint - Verificar APIs
  - Ejecutar todos los tests de propiedades de APIs
  - Probar endpoints manualmente con Postman o similar
  - Verificar autenticación y autorización
  - Preguntar al usuario si hay dudas

- [x] 8. Implementar API endpoints de historial y reportes
  - [x] 8.1 Crear endpoint GET /api/admin/evaluations/history/[classroomId]
    - Obtener historial de evaluaciones de un espacio
    - Ordenar por fecha descendente
    - Soportar filtro por rango de fechas
    - Incluir puntuaciones y evaluador
    - _Requisitos: 5.1, 5.2, 5.5_

  - [x] 8.2 Crear endpoint GET /api/admin/evaluations/reports/responsible
    - Generar reporte por responsable
    - Calcular promedio de puntuación, tendencia, número de evaluaciones
    - Identificar responsables con bajo desempeño (<70%)
    - Soportar filtro por rango de fechas
    - _Requisitos: 6.2, 6.5, 6.7_

  - [x] 8.3 Crear endpoint GET /api/admin/evaluations/reports/space
    - Generar reporte por espacio
    - Incluir última puntuación, promedio histórico, tendencia
    - Soportar filtro por rango de fechas
    - _Requisitos: 6.3, 6.5_

  - [x] 8.4 Crear endpoint GET /api/admin/evaluations/reports/general
    - Generar reporte general con ranking de responsables
    - Identificar espacios con mejor y peor desempeño
    - Calcular métricas globales
    - _Requisitos: 6.4_

  - [x] 8.5 Escribir property test para ordenamiento de historial
    - **Propiedad 14: Historial ordenado por fecha descendente**
    - **Valida: Requisitos 5.1**

  - [x] 8.6 Escribir property test para filtro de fechas
    - **Propiedad 15: Filtro de fechas retorna solo evaluaciones en rango**
    - **Valida: Requisitos 5.5**

  - [x] 8.7 Escribir property test para reporte por responsable
    - **Propiedad 17: Reporte por responsable incluye todos los campos requeridos**
    - **Valida: Requisitos 6.2**

  - [x] 8.8 Escribir property test para identificación de bajo desempeño
    - **Propiedad 19: Responsables con bajo desempeño son resaltados**
    - **Valida: Requisitos 6.7**

  - [x] 8.9 Escribir property test para métricas con filtro de fechas
    - **Propiedad 20: Métricas de reporte respetan filtro de fechas**
    - **Valida: Requisitos 6.5**

- [x] 9. Implementar componentes de UI - Calendario
  - [x] 9.1 Crear componente EvaluationCalendar en src/components/classrooms/evaluations/
    - Reutilizar patrón visual de ReservationsCalendar
    - Mostrar evaluaciones programadas con indicadores de estado (pending, completed, overdue)
    - Implementar navegación por mes
    - Implementar filtro por tipo de espacio
    - Click en día para programar nueva evaluación
    - Click en evaluación para ver detalles
    - _Requisitos: 1.1, 1.4, 1.5, 7.3_

  - [x] 9.2 Crear componente ScheduleEvaluationModal
    - Formulario para programar nueva evaluación
    - Selector de espacio (classrooms)
    - Selector de fecha y hora
    - Selector de plantilla
    - Validación de campos requeridos
    - _Requisitos: 1.2, 1.3_

- [x] 10. Implementar componentes de UI - Plantillas
  - [x] 10.1 Crear componente TemplatesManager
    - Lista de plantillas con nombre, tipo de espacio, número de preguntas
    - Botón para crear nueva plantilla
    - Acciones: editar, eliminar
    - _Requisitos: 2.1_

  - [x] 10.2 Crear componente TemplateEditorModal
    - Formulario para nombre y tipo de espacio
    - Editor de preguntas con drag-and-drop para reordenar
    - Selector de categoría por pregunta (organización, limpieza, mantenimiento)
    - Toggle de pregunta obligatoria
    - Vista previa del cuestionario
    - _Requisitos: 2.2, 2.3, 2.4, 2.5, 2.8_

- [x] 11. Implementar componentes de UI - Cuestionario
  - [x] 11.1 Crear componente QuestionnaireForm
    - Mostrar preguntas agrupadas por categoría
    - Opciones de respuesta: Sí, No, No aplica
    - Campo de observación visible al seleccionar "No"
    - Barra de progreso de preguntas respondidas
    - Preview de puntuación en tiempo real
    - Botón guardar borrador
    - Validación de preguntas obligatorias al enviar
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

  - [x] 11.2 Crear componente ScoreDisplay
    - Mostrar porcentaje con indicador de color (rojo <70%, amarillo 70-89%, verde ≥90%)
    - Desglose por categoría opcional
    - Tamaños configurables (sm, md, lg)
    - Tooltips con detalles
    - _Requisitos: 4.4, 4.5, 4.6_

  - [x] 11.3 Escribir property test para progreso de cuestionario
    - **Propiedad 24: Progreso de cuestionario refleja respuestas**
    - **Valida: Requisitos 7.4**

  - [x] 11.4 Escribir property test para campo de observación
    - **Propiedad 25: Campo de observación aparece solo para respuestas "No"**
    - **Valida: Requisitos 3.3**

- [x] 12. Checkpoint - Verificar componentes de evaluación
  - Ejecutar tests de propiedades de UI
  - Probar flujo completo de programación y ejecución de evaluación
  - Verificar responsive design
  - Preguntar al usuario si hay dudas

- [x] 13. Implementar componentes de UI - Historial y Reportes
  - [x] 13.1 Crear componente EvaluationHistory
    - Tabla con historial de evaluaciones
    - Filtros por rango de fechas
    - Columnas: fecha, evaluador, puntuación total, puntuaciones por categoría, estado
    - Click en fila para ver detalle
    - _Requisitos: 5.1, 5.2, 5.5_

  - [x] 13.2 Crear componente EvaluationDetailModal
    - Mostrar detalle completo de evaluación
    - Lista de respuestas con observaciones
    - Puntuaciones por categoría
    - _Requisitos: 5.3_

  - [x] 13.3 Crear componente TrendChart
    - Gráfico de líneas con Recharts
    - Mostrar tendencia de puntuaciones en el tiempo
    - Líneas opcionales por categoría
    - Tooltips interactivos
    - _Requisitos: 5.4_

  - [x] 13.4 Crear componente EvaluationReports
    - Selector de tipo de reporte (responsable, espacio, general)
    - Filtros por rango de fechas
    - Componentes específicos para cada tipo de reporte
    - Botón de exportación
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 14. Integrar en panel de administración
  - [x] 14.1 Crear página principal de evaluaciones
    - Crear src/app/admin/classrooms/evaluations/page.tsx
    - Implementar tabs: Calendario, Plantillas, Historial, Reportes
    - Integrar todos los componentes creados
    - _Requisitos: 7.1, 7.2_

  - [x] 14.2 Agregar navegación en menú de aulas
    - Agregar enlace "Evaluaciones" en la sección de aulas del panel admin
    - _Requisitos: 7.1_

  - [-] 14.3 Escribir property test para autenticación JWT
    - **Propiedad 22: Endpoints requieren autenticación JWT**
    - **Valida: Requisitos 8.3**

  - [ ] 14.4 Escribir property test para autorización admin
    - **Propiedad 23: Endpoints de gestión requieren rol admin**
    - **Valida: Requisitos 8.4**

- [ ] 15. Implementar exportación de reportes
  - [x] 15.1 Crear endpoint POST /api/admin/evaluations/reports/export
    - Soportar formatos PDF y Excel
    - Incluir datos y gráficos en el archivo
    - Generar nombre de archivo con timestamp
    - _Requisitos: 6.6_

- [ ] 16. Checkpoint final - Verificar sistema completo
  - Ejecutar todos los tests de propiedades
  - Probar flujo completo end-to-end
  - Verificar todos los requisitos implementados
  - Verificar responsive design en móvil
  - Preguntar al usuario si hay dudas

## Notas

- Todas las tareas son requeridas, incluyendo los property tests para testing completo
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud
- Los unit tests validan ejemplos específicos y casos edge
