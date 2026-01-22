# Documento de Diseño

## Visión General

El Sistema de Evaluación de Aulas se implementará como una extensión del módulo de administración de aulas existente, aprovechando la infraestructura actual de Next.js 15, React 19, Supabase y TypeScript. El sistema permitirá programar, ejecutar y analizar evaluaciones de condiciones de espacios (aulas de entrenamiento, almacenes, planta externa) para medir el nivel de responsabilidad de los encargados.

La arquitectura seguirá los patrones de diseño existentes en el proyecto:
- **Frontend**: React Server Components y Client Components con Next.js App Router
- **Backend**: API Routes con middleware de autenticación y autorización
- **Database**: Nuevas tablas en Supabase PostgreSQL siguiendo convenciones existentes
- **State Management**: React hooks y context para estado local
- **Styling**: Tailwind CSS con tema claro/oscuro existente

### Decisiones de Diseño Clave

1. **Calendario de Evaluaciones**: Reutilizaremos el patrón visual del componente `ReservationsCalendar` existente para mantener consistencia
2. **Sistema de Puntuación**: Cálculo simple basado en respuestas Sí/No, excluyendo "No aplica" del denominador
3. **Plantillas Versionadas**: Las plantillas modificadas crearán nuevas versiones para preservar historial
4. **Categorías de Preguntas**: Tres categorías fijas (organización, limpieza, mantenimiento) para análisis granular
5. **Integración con Classrooms**: Uso directo de la tabla `classrooms` existente y campo `responsible_person`

## Arquitectura

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│                  /admin/dashboard/page.tsx                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Classrooms Section                          │
│              /admin/classrooms/page.tsx                      │
│         (Nueva pestaña: Evaluaciones)                        │
└──────────┬──────────────┬──────────────┬────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │Calendario│   │Plantillas│   │Historial │   │ Reportes │
    │Evaluac.  │   │Preguntas │   │Evaluac.  │   │Desempeño │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
           │              │              │              │
           └──────────────┴──────────────┴──────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │   Shared Components Layer   │
           │  - EvaluationCalendar       │
           │  - QuestionnaireForm        │
           │  - ScoreDisplay             │
           │  - TrendChart               │
           └─────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │      API Routes Layer       │
           │  /api/admin/evaluations/*   │
           └─────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │   Data Access Layer         │
           │  - evaluationOperations     │
           │  - Supabase queries         │
           └─────────────────────────────┘
```

### Jerarquía de Componentes

```
EvaluationsPage (Hub con Tabs)
├── Tab: Calendario
│   └── EvaluationCalendar
│       ├── CalendarHeader
│       ├── CalendarGrid
│       ├── DayCell (con indicadores de evaluaciones)
│       └── ScheduleEvaluationModal
│           ├── ClassroomSelector
│           ├── DateTimePicker
│           └── TemplateSelector
│
├── Tab: Plantillas
│   └── TemplatesManager
│       ├── TemplatesList
│       ├── TemplateCard
│       └── TemplateEditorModal
│           ├── TemplateForm
│           ├── QuestionsEditor
│           │   ├── QuestionItem
│           │   ├── AddQuestionForm
│           │   └── CategorySelector
│           └── PreviewPanel
│
├── Tab: Historial
│   └── EvaluationHistory
│       ├── HistoryFilters
│       ├── HistoryTable
│       ├── TrendChart
│       └── EvaluationDetailModal
│           ├── ScoreSummary
│           ├── ResponsesList
│           └── ComparisonView
│
└── Tab: Reportes
    └── EvaluationReports
        ├── ReportTypeSelector
        ├── ReportFilters
        ├── ResponsibleReport
        │   ├── ResponsibleRanking
        │   └── ResponsibleDetailCard
        ├── SpaceReport
        │   ├── SpaceRanking
        │   └── SpaceDetailCard
        └── ExportActions

QuestionnaireExecutionPage
├── EvaluationHeader
├── ProgressBar
├── QuestionsList
│   └── QuestionItem
│       ├── QuestionText
│       ├── ResponseOptions (Sí/No/No aplica)
│       └── ObservationField (condicional)
├── ScorePreview
└── SubmitActions
```

## Componentes e Interfaces

### Componentes Principales

#### 1. EvaluationCalendar Component

**Propósito**: Calendario para visualizar y programar evaluaciones

**Interfaz de Props**:
```typescript
interface EvaluationCalendarProps {
  token: string | null
  onScheduleClick: (date: Date) => void
  onEvaluationClick: (evaluation: ScheduledEvaluation) => void
}

interface ScheduledEvaluation {
  id: number
  classroom_id: number
  classroom_name: string
  scheduled_date: string
  template_id: number
  template_name: string
  status: 'pending' | 'completed' | 'overdue'
  evaluator_id?: number
  evaluator_name?: string
}
```

**Características**:
- Navegación por mes (similar a ReservationsCalendar)
- Indicadores visuales por estado (pendiente, completada, vencida)
- Filtro por tipo de espacio
- Click en día para programar nueva evaluación
- Click en evaluación para ver detalles o ejecutar

#### 2. TemplateEditor Component

**Propósito**: Editor de plantillas de cuestionarios

**Interfaz de Props**:
```typescript
interface TemplateEditorProps {
  template?: EvaluationTemplate
  onSave: (template: CreateTemplateInput | UpdateTemplateInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

interface EvaluationTemplate {
  id: number
  name: string
  space_type: 'training_room' | 'warehouse' | 'external_plant'
  version: number
  is_active: boolean
  questions: TemplateQuestion[]
  created_at: string
  updated_at: string
}

interface TemplateQuestion {
  id: number
  template_id: number
  question_text: string
  category: 'organization' | 'cleanliness' | 'maintenance'
  is_required: boolean
  display_order: number
}

interface CreateTemplateInput {
  name: string
  space_type: 'training_room' | 'warehouse' | 'external_plant'
  questions: Omit<TemplateQuestion, 'id' | 'template_id'>[]
}
```

**Características**:
- Formulario para nombre y tipo de espacio
- Lista editable de preguntas con drag-and-drop para reordenar
- Selector de categoría por pregunta
- Toggle de pregunta obligatoria
- Vista previa del cuestionario
- Validación de al menos una pregunta

#### 3. QuestionnaireForm Component

**Propósito**: Formulario para ejecutar una evaluación

**Interfaz de Props**:
```typescript
interface QuestionnaireFormProps {
  evaluation: ScheduledEvaluation
  template: EvaluationTemplate
  onSubmit: (responses: EvaluationResponse[]) => Promise<void>
  onSaveDraft: (responses: EvaluationResponse[]) => Promise<void>
  initialResponses?: EvaluationResponse[]
  isSubmitting: boolean
}

interface EvaluationResponse {
  question_id: number
  response: 'yes' | 'no' | 'not_applicable'
  observation?: string
}

interface EvaluationResult {
  id: number
  scheduled_evaluation_id: number
  evaluator_id: number
  completed_at: string
  total_score: number
  max_possible_score: number
  score_percentage: number
  organization_score: number
  organization_max: number
  cleanliness_score: number
  cleanliness_max: number
  maintenance_score: number
  maintenance_max: number
  responses: EvaluationResponseWithQuestion[]
}
```

**Características**:
- Preguntas agrupadas por categoría
- Opciones de respuesta: Sí, No, No aplica
- Campo de observación visible al seleccionar "No"
- Barra de progreso de preguntas respondidas
- Preview de puntuación en tiempo real
- Botón guardar borrador
- Validación de preguntas obligatorias

#### 4. ScoreDisplay Component

**Propósito**: Visualización de puntuaciones con indicadores de color

**Interfaz de Props**:
```typescript
interface ScoreDisplayProps {
  totalScore: number
  maxScore: number
  categoryScores?: {
    organization: { score: number; max: number }
    cleanliness: { score: number; max: number }
    maintenance: { score: number; max: number }
  }
  size?: 'sm' | 'md' | 'lg'
  showCategories?: boolean
}
```

**Características**:
- Porcentaje con indicador de color (rojo <70%, amarillo 70-89%, verde ≥90%)
- Desglose por categoría opcional
- Tamaños configurables
- Tooltips con detalles

#### 5. TrendChart Component

**Propósito**: Gráfico de tendencia de puntuaciones en el tiempo

**Interfaz de Props**:
```typescript
interface TrendChartProps {
  data: TrendDataPoint[]
  height?: number
  showCategories?: boolean
}

interface TrendDataPoint {
  date: string
  total_percentage: number
  organization_percentage?: number
  cleanliness_percentage?: number
  maintenance_percentage?: number
}
```

**Características**:
- Gráfico de líneas con Recharts
- Línea principal de puntuación total
- Líneas opcionales por categoría
- Tooltips interactivos
- Responsive

## Modelos de Datos

### Nuevas Tablas de Base de Datos

```sql
-- Plantillas de evaluación
CREATE TABLE evaluation_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  space_type VARCHAR(50) NOT NULL CHECK (space_type IN ('training_room', 'warehouse', 'external_plant')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preguntas de plantilla
CREATE TABLE template_questions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES evaluation_templates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('organization', 'cleanliness', 'maintenance')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluaciones programadas
CREATE TABLE scheduled_evaluations (
  id SERIAL PRIMARY KEY,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
  template_id INTEGER NOT NULL REFERENCES evaluation_templates(id),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resultados de evaluación
CREATE TABLE evaluation_results (
  id SERIAL PRIMARY KEY,
  scheduled_evaluation_id INTEGER NOT NULL REFERENCES scheduled_evaluations(id),
  evaluator_id INTEGER NOT NULL REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_score INTEGER NOT NULL,
  max_possible_score INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  organization_score INTEGER NOT NULL DEFAULT 0,
  organization_max INTEGER NOT NULL DEFAULT 0,
  cleanliness_score INTEGER NOT NULL DEFAULT 0,
  cleanliness_max INTEGER NOT NULL DEFAULT 0,
  maintenance_score INTEGER NOT NULL DEFAULT 0,
  maintenance_max INTEGER NOT NULL DEFAULT 0,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Respuestas individuales
CREATE TABLE evaluation_responses (
  id SERIAL PRIMARY KEY,
  result_id INTEGER NOT NULL REFERENCES evaluation_results(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES template_questions(id),
  response VARCHAR(20) NOT NULL CHECK (response IN ('yes', 'no', 'not_applicable')),
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_scheduled_evaluations_date ON scheduled_evaluations(scheduled_date);
CREATE INDEX idx_scheduled_evaluations_classroom ON scheduled_evaluations(classroom_id);
CREATE INDEX idx_scheduled_evaluations_status ON scheduled_evaluations(status);
CREATE INDEX idx_evaluation_results_scheduled ON evaluation_results(scheduled_evaluation_id);
CREATE INDEX idx_template_questions_template ON template_questions(template_id);
```

### Tipos TypeScript

```typescript
// Tipos de evaluación
export type SpaceType = 'training_room' | 'warehouse' | 'external_plant'
export type QuestionCategory = 'organization' | 'cleanliness' | 'maintenance'
export type ResponseType = 'yes' | 'no' | 'not_applicable'
export type EvaluationStatus = 'pending' | 'completed' | 'overdue' | 'cancelled'

// Plantilla de evaluación
export interface EvaluationTemplate {
  id: number
  name: string
  space_type: SpaceType
  version: number
  is_active: boolean
  created_by?: number
  created_at: string
  updated_at: string
}

export interface EvaluationTemplateWithQuestions extends EvaluationTemplate {
  questions: TemplateQuestion[]
}

// Pregunta de plantilla
export interface TemplateQuestion {
  id: number
  template_id: number
  question_text: string
  category: QuestionCategory
  is_required: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// Evaluación programada
export interface ScheduledEvaluation {
  id: number
  classroom_id: number
  template_id: number
  scheduled_date: string
  status: EvaluationStatus
  created_by?: number
  created_at: string
  updated_at: string
}

export interface ScheduledEvaluationWithDetails extends ScheduledEvaluation {
  classroom: {
    id: number
    name: string
    location: string
    responsible_person?: string
  }
  template: {
    id: number
    name: string
    space_type: SpaceType
  }
  result?: EvaluationResult
}

// Resultado de evaluación
export interface EvaluationResult {
  id: number
  scheduled_evaluation_id: number
  evaluator_id: number
  completed_at: string
  total_score: number
  max_possible_score: number
  score_percentage: number
  organization_score: number
  organization_max: number
  cleanliness_score: number
  cleanliness_max: number
  maintenance_score: number
  maintenance_max: number
  is_draft: boolean
  created_at: string
  updated_at: string
}

export interface EvaluationResultWithResponses extends EvaluationResult {
  responses: EvaluationResponseWithQuestion[]
  evaluator: {
    id: number
    username: string
  }
}

// Respuesta individual
export interface EvaluationResponse {
  id: number
  result_id: number
  question_id: number
  response: ResponseType
  observation?: string
  created_at: string
}

export interface EvaluationResponseWithQuestion extends EvaluationResponse {
  question: TemplateQuestion
}

// Inputs para crear/actualizar
export interface CreateTemplateInput {
  name: string
  space_type: SpaceType
  questions: Array<{
    question_text: string
    category: QuestionCategory
    is_required: boolean
    display_order: number
  }>
}

export interface UpdateTemplateInput {
  name?: string
  space_type?: SpaceType
  is_active?: boolean
  questions?: Array<{
    id?: number
    question_text: string
    category: QuestionCategory
    is_required: boolean
    display_order: number
  }>
}

export interface CreateScheduledEvaluationInput {
  classroom_id: number
  template_id: number
  scheduled_date: string
}

export interface CreateEvaluationResultInput {
  scheduled_evaluation_id: number
  responses: Array<{
    question_id: number
    response: ResponseType
    observation?: string
  }>
  is_draft?: boolean
}

// Tipos para reportes
export interface ResponsiblePerformance {
  responsible_person: string
  classrooms: Array<{
    id: number
    name: string
    location: string
  }>
  total_evaluations: number
  average_score: number
  trend: 'up' | 'down' | 'stable'
  last_evaluation_date?: string
  scores_by_category: {
    organization: number
    cleanliness: number
    maintenance: number
  }
}

export interface SpacePerformance {
  classroom_id: number
  classroom_name: string
  location: string
  responsible_person?: string
  total_evaluations: number
  last_score: number
  average_score: number
  trend: 'up' | 'down' | 'stable'
  history: Array<{
    date: string
    score: number
  }>
}
```


## Propiedades de Correctitud

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema—esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de correctitud verificables por máquinas.*

### Propiedades del Sistema de Puntuación

**Propiedad 1: Cálculo de puntuación sigue la fórmula definida**
*Para cualquier* conjunto de respuestas de evaluación, la puntuación total debe ser igual a la cantidad de respuestas "Sí", y el máximo posible debe ser igual al total de respuestas menos las respuestas "No aplica".
**Valida: Requisitos 4.1**

**Propiedad 2: Porcentaje de puntuación es matemáticamente correcto**
*Para cualquier* resultado de evaluación con puntuación total y máximo posible, el porcentaje debe ser igual a (puntuación_total / máximo_posible) × 100, redondeado a dos decimales.
**Valida: Requisitos 4.2**

**Propiedad 3: Puntuaciones por categoría suman correctamente**
*Para cualquier* resultado de evaluación, la suma de puntuaciones por categoría (organización + limpieza + mantenimiento) debe ser igual a la puntuación total, y la suma de máximos por categoría debe ser igual al máximo posible total.
**Valida: Requisitos 4.3**

**Propiedad 4: Clasificación de puntuación es consistente con umbrales**
*Para cualquier* porcentaje de puntuación, la clasificación debe ser: "Requiere Atención" si < 70%, "Aceptable" si >= 70% y < 90%, "Excelente" si >= 90%.
**Valida: Requisitos 4.4, 4.5, 4.6**

### Propiedades de Validación

**Propiedad 5: Programación de evaluación requiere campos obligatorios**
*Para cualquier* intento de crear una programación de evaluación, el sistema debe rechazar la creación si falta classroom_id, template_id, o scheduled_date.
**Valida: Requisitos 1.3**

**Propiedad 6: Plantilla requiere al menos una pregunta**
*Para cualquier* intento de crear o actualizar una plantilla, el sistema debe rechazar la operación si la lista de preguntas está vacía.
**Valida: Requisitos 2.2**

**Propiedad 7: Respuestas obligatorias deben estar presentes para enviar**
*Para cualquier* intento de enviar una evaluación (no borrador), el sistema debe rechazar el envío si alguna pregunta marcada como obligatoria no tiene respuesta.
**Valida: Requisitos 3.4**

**Propiedad 8: Opciones de respuesta son exactamente tres**
*Para cualquier* pregunta en el sistema, las únicas respuestas válidas son: 'yes', 'no', 'not_applicable'.
**Valida: Requisitos 2.4, 3.2**

### Propiedades de Estado y Transiciones

**Propiedad 9: Evaluaciones vencidas se marcan automáticamente**
*Para cualquier* evaluación programada con fecha pasada y estado 'pending', el sistema debe retornar estado 'overdue' al consultarla.
**Valida: Requisitos 1.6**

**Propiedad 10: Solo evaluaciones pendientes son editables**
*Para cualquier* intento de editar una evaluación programada, el sistema debe permitir la edición solo si el estado actual es 'pending'.
**Valida: Requisitos 1.7**

**Propiedad 11: Evaluación completada actualiza estado de programación**
*Para cualquier* evaluación guardada exitosamente (no borrador), el estado de la programación asociada debe cambiar a 'completed'.
**Valida: Requisitos 3.7**

**Propiedad 12: Plantillas con evaluaciones pendientes no pueden eliminarse**
*Para cualquier* intento de eliminar una plantilla, el sistema debe rechazar la eliminación si existen evaluaciones programadas con estado 'pending' que usen esa plantilla.
**Valida: Requisitos 2.7**

**Propiedad 13: Modificar plantilla en uso crea nueva versión**
*Para cualquier* plantilla que tenga evaluaciones completadas asociadas, al modificarla el sistema debe crear una nueva versión preservando la versión anterior.
**Valida: Requisitos 2.6**

### Propiedades de Datos e Historial

**Propiedad 14: Historial ordenado por fecha descendente**
*Para cualquier* consulta de historial de evaluaciones de un espacio, los resultados deben estar ordenados por fecha de completado en orden descendente.
**Valida: Requisitos 5.1**

**Propiedad 15: Filtro de fechas retorna solo evaluaciones en rango**
*Para cualquier* consulta de historial con filtro de rango de fechas, todas las evaluaciones retornadas deben tener fecha de completado dentro del rango especificado.
**Valida: Requisitos 5.5**

**Propiedad 16: Cuestionario contiene todas las preguntas de la plantilla**
*Para cualquier* evaluación iniciada, el cuestionario debe contener exactamente las mismas preguntas que la plantilla asociada, en el mismo orden.
**Valida: Requisitos 3.1**

### Propiedades de Reportes

**Propiedad 17: Reporte por responsable incluye todos los campos requeridos**
*Para cualquier* responsable en el reporte, el registro debe incluir: nombre, lista de espacios a cargo, promedio de puntuación, tendencia, y número de evaluaciones.
**Valida: Requisitos 6.2**

**Propiedad 18: Reporte por espacio incluye todos los campos requeridos**
*Para cualquier* espacio en el reporte, el registro debe incluir: nombre, responsable actual, última puntuación, promedio histórico, y tendencia.
**Valida: Requisitos 6.3**

**Propiedad 19: Responsables con bajo desempeño son resaltados**
*Para cualquier* responsable con promedio de puntuación menor al 70%, el sistema debe marcarlo como "bajo desempeño" en el reporte.
**Valida: Requisitos 6.7**

**Propiedad 20: Métricas de reporte respetan filtro de fechas**
*Para cualquier* reporte generado con filtro de rango de fechas, todas las métricas calculadas deben basarse únicamente en evaluaciones dentro del período especificado.
**Valida: Requisitos 6.5**

### Propiedades de Integración

**Propiedad 21: Sistema utiliza datos de classrooms existente**
*Para cualquier* consulta de espacios evaluables, los datos deben provenir de la tabla classrooms existente, incluyendo el campo responsible_person.
**Valida: Requisitos 8.1, 8.2**

**Propiedad 22: Endpoints requieren autenticación JWT**
*Para cualquier* solicitud a endpoints de evaluación sin token JWT válido, el sistema debe retornar error 401.
**Valida: Requisitos 8.3**

**Propiedad 23: Endpoints de gestión requieren rol admin**
*Para cualquier* solicitud a endpoints de gestión (crear/editar/eliminar plantillas, programar evaluaciones) sin rol admin, el sistema debe retornar error 403.
**Valida: Requisitos 8.4**

### Propiedades de UI

**Propiedad 24: Progreso de cuestionario refleja respuestas**
*Para cualquier* estado del cuestionario, el porcentaje de progreso debe ser igual a (preguntas respondidas / total de preguntas) × 100.
**Valida: Requisitos 7.4**

**Propiedad 25: Campo de observación aparece solo para respuestas "No"**
*Para cualquier* pregunta con respuesta "No", el campo de observación debe estar visible. Para respuestas "Sí" o "No aplica", el campo debe estar oculto.
**Valida: Requisitos 3.3**

## Manejo de Errores

### Tipos de Error

```typescript
enum EvaluationErrorCode {
  // Validación
  INVALID_TEMPLATE = 'INVALID_TEMPLATE',
  INVALID_SCHEDULE = 'INVALID_SCHEDULE',
  MISSING_REQUIRED_RESPONSES = 'MISSING_REQUIRED_RESPONSES',
  INVALID_RESPONSE_VALUE = 'INVALID_RESPONSE_VALUE',
  
  // Estado
  EVALUATION_NOT_PENDING = 'EVALUATION_NOT_PENDING',
  EVALUATION_ALREADY_COMPLETED = 'EVALUATION_ALREADY_COMPLETED',
  TEMPLATE_IN_USE = 'TEMPLATE_IN_USE',
  TEMPLATE_HAS_PENDING_EVALUATIONS = 'TEMPLATE_HAS_PENDING_EVALUATIONS',
  
  // Datos
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  EVALUATION_NOT_FOUND = 'EVALUATION_NOT_FOUND',
  CLASSROOM_NOT_FOUND = 'CLASSROOM_NOT_FOUND',
  
  // Permisos
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  
  // Sistema
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXPORT_FAILED = 'EXPORT_FAILED',
}

interface EvaluationError {
  code: EvaluationErrorCode
  message: string
  details?: Record<string, unknown>
}
```

### Mensajes de Error en Español

```typescript
const ERROR_MESSAGES_ES: Record<EvaluationErrorCode, string> = {
  INVALID_TEMPLATE: 'La plantilla no es válida. Verifique que tenga nombre, tipo de espacio y al menos una pregunta.',
  INVALID_SCHEDULE: 'La programación no es válida. Verifique que tenga espacio, fecha y plantilla.',
  MISSING_REQUIRED_RESPONSES: 'Faltan respuestas obligatorias. Complete todas las preguntas requeridas.',
  INVALID_RESPONSE_VALUE: 'Valor de respuesta inválido. Use: Sí, No, o No aplica.',
  EVALUATION_NOT_PENDING: 'Solo se pueden editar evaluaciones pendientes.',
  EVALUATION_ALREADY_COMPLETED: 'Esta evaluación ya fue completada.',
  TEMPLATE_IN_USE: 'No se puede eliminar una plantilla que tiene evaluaciones asociadas.',
  TEMPLATE_HAS_PENDING_EVALUATIONS: 'No se puede eliminar una plantilla con evaluaciones pendientes.',
  TEMPLATE_NOT_FOUND: 'Plantilla no encontrada.',
  EVALUATION_NOT_FOUND: 'Evaluación no encontrada.',
  CLASSROOM_NOT_FOUND: 'Espacio no encontrado.',
  INSUFFICIENT_PERMISSIONS: 'No tiene permisos para realizar esta acción.',
  AUTHENTICATION_REQUIRED: 'Debe iniciar sesión para acceder a esta función.',
  DATABASE_ERROR: 'Error de base de datos. Intente nuevamente.',
  EXPORT_FAILED: 'Error al exportar el reporte. Intente nuevamente.',
}
```

### Estrategia de Manejo de Errores

1. **Validación del Cliente**:
   - Validar campos requeridos antes de enviar
   - Validar formato de fechas
   - Validar que todas las preguntas obligatorias tengan respuesta

2. **Respuestas de Error de API**:
   - Retornar códigos de error específicos
   - Incluir mensajes descriptivos en español
   - Registrar errores en audit logs

3. **Feedback al Usuario**:
   - Toast notifications para errores
   - Mensajes inline en formularios
   - Estados vacíos cuando no hay datos
   - Botones de reintentar para errores recuperables

4. **Comportamiento de Fallback**:
   - Guardar borrador automáticamente cada 30 segundos
   - Recuperar borrador al recargar página
   - Mantener filtros aplicados después de error

## Estrategia de Testing

### Enfoque Dual de Testing

El sistema utilizará dos tipos complementarios de pruebas:

1. **Unit Tests**: Para ejemplos específicos, casos edge, y condiciones de error
2. **Property Tests**: Para propiedades universales que deben cumplirse para todas las entradas

### Configuración de Property-Based Testing

- **Librería**: fast-check para TypeScript
- **Iteraciones mínimas**: 100 por propiedad
- **Formato de tag**: `Feature: classroom-evaluation-system, Property {number}: {property_text}`

### Unit Tests

**Componentes a Probar**:
- ScoreDisplay: formato de valores, colores por clasificación
- QuestionnaireForm: validación de respuestas, cálculo de progreso
- EvaluationCalendar: renderizado de eventos, filtros
- TemplateEditor: validación de plantilla, manejo de preguntas

**Casos de Prueba**:
```typescript
describe('ScoreDisplay', () => {
  it('should show red indicator for scores below 70%')
  it('should show yellow indicator for scores between 70-89%')
  it('should show green indicator for scores 90% and above')
  it('should format percentage with two decimals')
})

describe('QuestionnaireForm', () => {
  it('should show observation field only for "No" responses')
  it('should calculate progress correctly')
  it('should validate required questions before submit')
  it('should allow saving as draft with incomplete responses')
})

describe('TemplateEditor', () => {
  it('should require at least one question')
  it('should validate question text is not empty')
  it('should allow reordering questions')
})
```

### Property Tests

**Propiedades a Implementar**:

```typescript
// Feature: classroom-evaluation-system, Property 1: Cálculo de puntuación sigue la fórmula definida
describe('Score Calculation', () => {
  it('should calculate score correctly for any set of responses', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('yes', 'no', 'not_applicable'), { minLength: 1, maxLength: 50 }),
        (responses) => {
          const yesCount = responses.filter(r => r === 'yes').length
          const applicableCount = responses.filter(r => r !== 'not_applicable').length
          const result = calculateScore(responses)
          
          expect(result.totalScore).toBe(yesCount)
          expect(result.maxPossibleScore).toBe(applicableCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: classroom-evaluation-system, Property 4: Clasificación de puntuación es consistente con umbrales
describe('Score Classification', () => {
  it('should classify scores correctly for any percentage', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100 }),
        (percentage) => {
          const classification = classifyScore(percentage)
          
          if (percentage < 70) {
            expect(classification).toBe('requires_attention')
          } else if (percentage < 90) {
            expect(classification).toBe('acceptable')
          } else {
            expect(classification).toBe('excellent')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: classroom-evaluation-system, Property 14: Historial ordenado por fecha descendente
describe('History Ordering', () => {
  it('should return evaluations sorted by date descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1 }),
            completed_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (evaluations) => {
          const sorted = sortEvaluationsByDate(evaluations)
          
          for (let i = 1; i < sorted.length; i++) {
            expect(new Date(sorted[i-1].completed_at).getTime())
              .toBeGreaterThanOrEqual(new Date(sorted[i].completed_at).getTime())
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Integration Tests

**API Routes a Probar**:
- `POST /api/admin/evaluations/templates`: crear plantilla
- `GET /api/admin/evaluations/templates`: listar plantillas
- `POST /api/admin/evaluations/schedule`: programar evaluación
- `GET /api/admin/evaluations/calendar`: obtener calendario
- `POST /api/admin/evaluations/[id]/submit`: enviar evaluación
- `GET /api/admin/evaluations/history/[classroomId]`: historial por espacio
- `GET /api/admin/evaluations/reports/responsible`: reporte por responsable

**Escenarios de Prueba**:
```typescript
describe('Evaluation Templates API', () => {
  it('should create template with valid data')
  it('should reject template without questions')
  it('should require admin role')
  it('should version template when modified with existing evaluations')
})

describe('Evaluation Submission API', () => {
  it('should calculate scores correctly')
  it('should update scheduled evaluation status to completed')
  it('should reject submission with missing required responses')
  it('should allow saving as draft')
})

describe('Reports API', () => {
  it('should calculate averages correctly')
  it('should filter by date range')
  it('should identify low performers')
})
```

### Performance Tests

**Métricas a Monitorear**:
- Tiempo de carga del calendario (objetivo: < 2s)
- Tiempo de envío de evaluación (objetivo: < 1s)
- Tiempo de generación de reportes (objetivo: < 3s)
- Tiempo de exportación (objetivo: < 5s)

### Accessibility Tests

**Requisitos**:
- Navegación por teclado para cuestionarios
- Soporte de lectores de pantalla para puntuaciones
- Contraste de colores WCAG AA
- Indicadores de foco visibles
- Mensajes de error anunciados a lectores de pantalla
