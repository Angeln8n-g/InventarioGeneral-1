/**
 * Types and interfaces for the Classroom Evaluation System
 * Sistema de Evaluación de Aulas
 * 
 * This module defines all TypeScript types for:
 * - Evaluation templates and questions
 * - Scheduled evaluations
 * - Evaluation results and responses
 * - Performance reports
 * 
 * @module types/evaluations
 */

// ============================================================================
// Enums and Type Aliases
// ============================================================================

/**
 * Type of space being evaluated
 * - training_room: Aula de entrenamiento
 * - warehouse: Almacén
 * - external_plant: Planta externa
 */
export type SpaceType = 'training_room' | 'warehouse' | 'external_plant'

/**
 * Category of evaluation question
 * - organization: Organización del espacio
 * - cleanliness: Limpieza del espacio
 * - maintenance: Mantenimiento de equipos
 */
export type QuestionCategory = 'organization' | 'cleanliness' | 'maintenance'

/**
 * Possible response values for evaluation questions
 * - yes: Sí (1 point)
 * - no: No (0 points)
 * - not_applicable: No aplica (excluded from calculation)
 */
export type ResponseType = 'yes' | 'no' | 'not_applicable'

/**
 * Status of a scheduled evaluation
 * - pending: Pendiente de realizar
 * - completed: Completada
 * - overdue: Vencida (fecha pasada sin completar)
 * - cancelled: Cancelada
 */
export type EvaluationStatus = 'pending' | 'completed' | 'overdue' | 'cancelled'

/**
 * Approval status for completed evaluations
 * - pending: Awaiting approval
 * - approved: Approved by designated approver
 * - rejected: Rejected by designated approver
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

/**
 * Trend direction for performance reports
 */
export type TrendDirection = 'up' | 'down' | 'stable'

// ============================================================================
// Template Interfaces
// ============================================================================

/**
 * Evaluation template - defines a set of questions for a specific space type
 * Plantilla de evaluación
 */
export interface EvaluationTemplate {
  /** Unique identifier */
  id: number
  /** Template name */
  name: string
  /** Type of space this template applies to */
  space_type: SpaceType
  /** Version number (incremented when modified with existing evaluations) */
  version: number
  /** Whether the template is currently active */
  is_active: boolean
  /** User ID who created the template */
  created_by?: number
  /** Creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at: string
}

/**
 * Evaluation template with its associated questions
 * Plantilla de evaluación con preguntas
 */
export interface EvaluationTemplateWithQuestions extends EvaluationTemplate {
  /** List of questions in this template */
  questions: TemplateQuestion[]
}

/**
 * Question within an evaluation template
 * Pregunta de plantilla
 */
export interface TemplateQuestion {
  /** Unique identifier */
  id: number
  /** ID of the parent template */
  template_id: number
  /** Question text to display */
  question_text: string
  /** Category for grouping and scoring */
  category: QuestionCategory
  /** Whether this question must be answered */
  is_required: boolean
  /** Order in which to display the question */
  display_order: number
  /** Creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at: string
}

// ============================================================================
// Scheduled Evaluation Interfaces
// ============================================================================

/**
 * Scheduled evaluation - a planned evaluation for a specific classroom
 * Evaluación programada
 */
export interface ScheduledEvaluation {
  /** Unique identifier */
  id: number
  /** ID of the classroom to evaluate */
  classroom_id: number
  /** ID of the template to use */
  template_id: number
  /** Date and time when evaluation is scheduled */
  scheduled_date: string
  /** Current status of the evaluation */
  status: EvaluationStatus
  /** User ID who created the schedule */
  created_by?: number
  /** User ID of the assigned evaluator */
  assigned_to?: number
  /** User ID of the designated approver */
  approver_id?: number
  /** Creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at: string
}

/**
 * Scheduled evaluation with related classroom and template details
 * Evaluación programada con detalles
 */
export interface ScheduledEvaluationWithDetails extends ScheduledEvaluation {
  /** Classroom information */
  classroom: {
    id: number
    name: string
    location: string
    responsible_person?: string
  }
  /** Template information */
  template: {
    id: number
    name: string
    space_type: SpaceType
  }
  /** Assigned evaluator information */
  assigned_user?: {
    id: number
    username: string
    full_name?: string
  }
  /** Designated approver information */
  approver?: {
    id: number
    username: string
    full_name?: string
  }
  /** Evaluation result if completed */
  result?: EvaluationResult
}

// ============================================================================
// Evaluation Result Interfaces
// ============================================================================

/**
 * Evaluation result - the completed evaluation with scores
 * Resultado de evaluación
 */
export interface EvaluationResult {
  /** Unique identifier */
  id: number
  /** ID of the scheduled evaluation this result belongs to */
  scheduled_evaluation_id: number
  /** ID of the user who performed the evaluation */
  evaluator_id: number
  /** Timestamp when evaluation was completed */
  completed_at: string
  /** Total score (sum of 'yes' responses) */
  total_score: number
  /** Maximum possible score (total questions minus 'not_applicable') */
  max_possible_score: number
  /** Score as percentage: (total_score / max_possible_score) × 100 */
  score_percentage: number
  /** Score for organization category */
  organization_score: number
  /** Maximum possible for organization category */
  organization_max: number
  /** Score for cleanliness category */
  cleanliness_score: number
  /** Maximum possible for cleanliness category */
  cleanliness_max: number
  /** Score for maintenance category */
  maintenance_score: number
  /** Maximum possible for maintenance category */
  maintenance_max: number
  /** Whether this is a draft (incomplete) evaluation */
  is_draft: boolean
  /** Approval status: pending, approved, or rejected */
  approval_status: ApprovalStatus
  /** User ID who approved/rejected the evaluation */
  approved_by?: number
  /** Timestamp when approved/rejected */
  approved_at?: string
  /** Comments from approver explaining the decision */
  approval_comments?: string
  /** Creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at: string
}

/**
 * Evaluation result with all responses and evaluator information
 * Resultado de evaluación con respuestas
 */
export interface EvaluationResultWithResponses extends EvaluationResult {
  /** List of individual responses */
  responses: EvaluationResponseWithQuestion[]
  /** Evaluator information */
  evaluator: {
    id: number
    username: string
    full_name?: string
  }
  /** Approver information (if approved/rejected) */
  approver?: {
    id: number
    username: string
    full_name?: string
  }
}

// ============================================================================
// Evaluation Response Interfaces
// ============================================================================

/**
 * Individual response to a question in an evaluation
 * Respuesta individual
 */
export interface EvaluationResponse {
  /** Unique identifier */
  id: number
  /** ID of the evaluation result this response belongs to */
  result_id: number
  /** ID of the question being answered */
  question_id: number
  /** The response value */
  response: ResponseType
  /** Optional observation (typically for 'no' responses) */
  observation?: string
  /** Creation timestamp */
  created_at: string
}

/**
 * Evaluation response with the associated question details
 * Respuesta con detalles de pregunta
 */
export interface EvaluationResponseWithQuestion extends EvaluationResponse {
  /** The question that was answered */
  question: TemplateQuestion
}

// ============================================================================
// Input Types for Create/Update Operations
// ============================================================================

/**
 * Input for creating a new evaluation template
 * Input para crear plantilla
 */
export interface CreateTemplateInput {
  /** Template name */
  name: string
  /** Type of space this template applies to */
  space_type: SpaceType
  /** List of questions to include (at least one required) */
  questions: Array<{
    /** Question text */
    question_text: string
    /** Question category */
    category: QuestionCategory
    /** Whether the question is required */
    is_required: boolean
    /** Display order */
    display_order: number
  }>
}

/**
 * Input for updating an existing evaluation template
 * Input para actualizar plantilla
 */
export interface UpdateTemplateInput {
  /** Updated template name */
  name?: string
  /** Updated space type */
  space_type?: SpaceType
  /** Whether the template is active */
  is_active?: boolean
  /** Updated list of questions (replaces existing) */
  questions?: Array<{
    /** Question ID (if updating existing question) */
    id?: number
    /** Question text */
    question_text: string
    /** Question category */
    category: QuestionCategory
    /** Whether the question is required */
    is_required: boolean
    /** Display order */
    display_order: number
  }>
}

/**
 * Input for creating a scheduled evaluation
 * Input para programar evaluación
 */
export interface CreateScheduledEvaluationInput {
  /** ID of the classroom to evaluate */
  classroom_id: number
  /** ID of the template to use */
  template_id: number
  /** Date and time for the evaluation */
  scheduled_date: string
  /** ID of the user assigned to perform the evaluation */
  assigned_to?: number
  /** ID of the user who will approve the evaluation */
  approver_id?: number
}

/**
 * Input for creating an evaluation result (submitting responses)
 * Input para crear resultado de evaluación
 */
export interface CreateEvaluationResultInput {
  /** ID of the scheduled evaluation */
  scheduled_evaluation_id: number
  /** List of responses to questions */
  responses: Array<{
    /** ID of the question being answered */
    question_id: number
    /** The response value */
    response: ResponseType
    /** Optional observation */
    observation?: string
  }>
  /** Whether to save as draft (incomplete) */
  is_draft?: boolean
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Performance data for a responsible person
 * Desempeño por responsable
 */
export interface ResponsiblePerformance {
  /** Name of the responsible person */
  responsible_person: string
  /** List of classrooms under their responsibility */
  classrooms: Array<{
    id: number
    name: string
    location: string
  }>
  /** Total number of evaluations completed */
  total_evaluations: number
  /** Average score percentage across all evaluations */
  average_score: number
  /** Trend direction based on recent evaluations */
  trend: TrendDirection
  /** Date of the most recent evaluation */
  last_evaluation_date?: string
  /** Average scores by category */
  scores_by_category: {
    organization: number
    cleanliness: number
    maintenance: number
  }
}

/**
 * Performance data for a specific space/classroom
 * Desempeño por espacio
 */
export interface SpacePerformance {
  /** Classroom ID */
  classroom_id: number
  /** Classroom name */
  classroom_name: string
  /** Classroom location */
  location: string
  /** Current responsible person */
  responsible_person?: string
  /** Total number of evaluations */
  total_evaluations: number
  /** Most recent evaluation score */
  last_score: number
  /** Average score across all evaluations */
  average_score: number
  /** Trend direction based on recent evaluations */
  trend: TrendDirection
  /** Historical scores for trend chart */
  history: Array<{
    date: string
    score: number
  }>
}

// ============================================================================
// Additional Utility Types
// ============================================================================

/**
 * Score classification based on percentage thresholds
 * - requires_attention: < 70%
 * - acceptable: 70% - 89%
 * - excellent: >= 90%
 */
export type ScoreClassification = 'requires_attention' | 'acceptable' | 'excellent'

/**
 * Data point for trend charts
 */
export interface TrendDataPoint {
  /** Date of the evaluation */
  date: string
  /** Total score percentage */
  total_percentage: number
  /** Organization category percentage */
  organization_percentage?: number
  /** Cleanliness category percentage */
  cleanliness_percentage?: number
  /** Maintenance category percentage */
  maintenance_percentage?: number
}

/**
 * Category scores breakdown
 */
export interface CategoryScores {
  organization: { score: number; max: number }
  cleanliness: { score: number; max: number }
  maintenance: { score: number; max: number }
}

/**
 * Filters for evaluation history queries
 */
export interface EvaluationHistoryFilters {
  /** Filter by classroom ID */
  classroom_id?: number
  /** Filter by responsible person */
  responsible_person?: string
  /** Filter by space type */
  space_type?: SpaceType
  /** Start date for date range filter */
  start_date?: string
  /** End date for date range filter */
  end_date?: string
  /** Filter by evaluation status */
  status?: EvaluationStatus
}

/**
 * Filters for report generation
 */
export interface ReportFilters {
  /** Start date for the report period */
  start_date?: string
  /** End date for the report period */
  end_date?: string
  /** Filter by space type */
  space_type?: SpaceType
  /** Filter by specific responsible person */
  responsible_person?: string
}


// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Valid response types for evaluation questions
 * Tipos de respuesta válidos para preguntas de evaluación
 */
export const VALID_RESPONSE_TYPES: readonly ResponseType[] = ['yes', 'no', 'not_applicable'] as const

/**
 * Validates if a given string is a valid response type
 * Valida si una cadena dada es un tipo de respuesta válido
 * 
 * @param response - The response string to validate
 * @returns true if the response is one of: 'yes', 'no', 'not_applicable'
 * 
 * @example
 * isValidResponseType('yes') // true
 * isValidResponseType('no') // true
 * isValidResponseType('not_applicable') // true
 * isValidResponseType('maybe') // false
 * isValidResponseType('') // false
 */
export function isValidResponseType(response: string): response is ResponseType {
  return VALID_RESPONSE_TYPES.includes(response as ResponseType)
}

// ============================================================================
// Approval Types
// ============================================================================

/**
 * Input for approving or rejecting an evaluation
 * Input para aprobar o rechazar una evaluación
 */
export interface ApproveEvaluationInput {
  /** The approval decision */
  decision: 'approved' | 'rejected'
  /** Comments explaining the decision */
  comments?: string
}

/**
 * Evaluation pending approval with full details
 * Evaluación pendiente de aprobación con detalles completos
 */
export interface EvaluationPendingApproval {
  /** Evaluation result ID */
  id: number
  /** Scheduled evaluation ID */
  scheduled_evaluation_id: number
  /** Classroom information */
  classroom: {
    id: number
    name: string
    location: string
    responsible_person?: string
  }
  /** Evaluator information */
  evaluator: {
    id: number
    username: string
    full_name?: string
  }
  /** Template used */
  template: {
    id: number
    name: string
    space_type: SpaceType
  }
  /** Evaluation scores */
  total_score: number
  max_possible_score: number
  score_percentage: number
  /** Category scores */
  organization_score: number
  organization_max: number
  cleanliness_score: number
  cleanliness_max: number
  maintenance_score: number
  maintenance_max: number
  /** When the evaluation was completed */
  completed_at: string
  /** When the evaluation was scheduled */
  scheduled_date: string
}
