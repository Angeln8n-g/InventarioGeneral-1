import { NextRequest, NextResponse } from 'next/server'
import {
  scheduledEvaluationOperations,
  evaluationTemplateOperations,
  evaluationResultOperations,
  auditLogOperations,
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { calculateScore } from '@/utils/evaluation-scoring'
import type {
  ResponseType,
  TemplateQuestion,
  CreateEvaluationResultInput,
} from '@/types/evaluations'

/**
 * Request body for submitting an evaluation
 */
interface SubmitEvaluationRequest {
  responses: Array<{
    question_id: number
    response: ResponseType
    observation?: string
  }>
  is_draft?: boolean
}

/**
 * Response type for the submit endpoint
 */
interface SubmitEvaluationResponse {
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
  classification: 'requires_attention' | 'acceptable' | 'excellent'
}

/**
 * Validates that a response value is valid
 */
function isValidResponse(response: string): response is ResponseType {
  return ['yes', 'no', 'not_applicable'].includes(response)
}

/**
 * POST /api/admin/evaluations/[id]/submit
 * Submits an evaluation with responses
 * 
 * - Validates that all required questions have responses (if not draft)
 * - Calculates scores (total and by category)
 * - Saves result and responses
 * - Updates scheduled evaluation status to completed (if not draft)
 * - Supports saving as draft (is_draft: true)
 * 
 * Requires admin role
 *
 * @validates Requirements 3.4 - Validate required questions have responses
 * @validates Requirements 3.5 - Calculate score automatically
 * @validates Requirements 3.6 - Record completion date, evaluator, responses, score, observations
 * @validates Requirements 3.7 - Update scheduled evaluation status to completed
 * @validates Requirements 3.8 - Allow saving as draft
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const evaluationId = parseInt(id, 10)

      // Validate evaluation ID
      if (isNaN(evaluationId) || evaluationId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid evaluation ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Parse request body
      let body: SubmitEvaluationRequest
      try {
        body = await request.json()
      } catch {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid request body',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate responses array exists
      if (!body.responses || !Array.isArray(body.responses)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Responses array is required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate each response has valid values
      for (const response of body.responses) {
        if (!response.question_id || typeof response.question_id !== 'number') {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Each response must have a valid question_id',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        if (!response.response || !isValidResponse(response.response)) {
          return NextResponse.json(
            {
              error: {
                code: 'INVALID_RESPONSE_VALUE',
                message: 'Valor de respuesta inválido. Use: yes, no, o not_applicable',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
      }

      // Get the scheduled evaluation
      const evaluation = await scheduledEvaluationOperations.getById(evaluationId)

      if (!evaluation) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Evaluación programada no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Check if evaluation can be submitted (must be pending or overdue)
      // Also allow if there's an existing draft
      const existingResult = await evaluationResultOperations.getByScheduledId(evaluationId)
      
      if (evaluation.status !== 'pending' && evaluation.status !== 'overdue') {
        if (!existingResult?.is_draft) {
          return NextResponse.json(
            {
              error: {
                code: 'EVALUATION_ALREADY_COMPLETED',
                message: 'Esta evaluación ya fue completada',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 409 }
          )
        }
      }

      // Get the template with all questions
      const template = await evaluationTemplateOperations.getById(evaluation.template_id)

      if (!template) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Plantilla de evaluación no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      const questions = template.questions || []
      const isDraft = body.is_draft === true

      // Property 7: Validate required questions have responses (if not draft)
      // Requirement 3.4: Validate all required questions have responses
      if (!isDraft) {
        const requiredQuestionIds = questions
          .filter((q: TemplateQuestion) => q.is_required)
          .map((q: TemplateQuestion) => q.id)

        const answeredQuestionIds = body.responses.map((r) => r.question_id)
        const missingRequired = requiredQuestionIds.filter(
          (id: number) => !answeredQuestionIds.includes(id)
        )

        if (missingRequired.length > 0) {
          return NextResponse.json(
            {
              error: {
                code: 'MISSING_REQUIRED_RESPONSES',
                message: 'Faltan respuestas obligatorias. Complete todas las preguntas requeridas.',
                details: {
                  missing_question_ids: missingRequired,
                },
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
      }

      // Validate that all question_ids in responses belong to the template
      const templateQuestionIds = questions.map((q: TemplateQuestion) => q.id)
      const invalidQuestionIds = body.responses
        .map((r) => r.question_id)
        .filter((id) => !templateQuestionIds.includes(id))

      if (invalidQuestionIds.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Some question IDs do not belong to this template',
              details: {
                invalid_question_ids: invalidQuestionIds,
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Prepare input for creating/updating result
      const resultInput: CreateEvaluationResultInput = {
        scheduled_evaluation_id: evaluationId,
        responses: body.responses,
        is_draft: isDraft,
      }

      let result

      // If there's an existing draft, update it; otherwise create new
      if (existingResult?.is_draft) {
        result = await evaluationResultOperations.update(existingResult.id, resultInput)
      } else {
        result = await evaluationResultOperations.create(resultInput, auth.user.id)
      }

      // Calculate classification for response
      // Requirement 3.5: Calculate score automatically
      const responsesWithCategory = body.responses.map((r) => {
        const question = questions.find((q: TemplateQuestion) => q.id === r.question_id)
        return {
          response: r.response,
          category: question?.category || 'organization',
        }
      })

      const scoreResult = calculateScore(responsesWithCategory)
      const classification = scoreResult.percentage < 70
        ? 'requires_attention'
        : scoreResult.percentage < 90
          ? 'acceptable'
          : 'excellent'

      // Create audit log
      // Requirement 3.6: Record completion date, evaluator, responses, score, observations
      await auditLogOperations.create({
        user_id: auth.user.id,
        action: isDraft ? 'evaluation_draft_saved' : 'evaluation_submitted',
        entity_type: 'evaluation_result',
        entity_id: result.id,
        new_values: {
          scheduled_evaluation_id: evaluationId,
          classroom_id: evaluation.classroom_id,
          classroom_name: evaluation.classroom?.name,
          template_id: evaluation.template_id,
          template_name: template.name,
          is_draft: isDraft,
          total_score: result.total_score,
          max_possible_score: result.max_possible_score,
          score_percentage: result.score_percentage,
          classification,
          responses_count: body.responses.length,
        },
      })

      // Build response
      // Requirement 3.7: Update scheduled evaluation status to completed (handled in evaluationResultOperations)
      // Requirement 3.8: Allow saving as draft
      const response: SubmitEvaluationResponse = {
        id: result.id,
        scheduled_evaluation_id: result.scheduled_evaluation_id,
        evaluator_id: result.evaluator_id,
        completed_at: result.completed_at,
        total_score: result.total_score,
        max_possible_score: result.max_possible_score,
        score_percentage: result.score_percentage,
        organization_score: result.organization_score,
        organization_max: result.organization_max,
        cleanliness_score: result.cleanliness_score,
        cleanliness_max: result.cleanliness_max,
        maintenance_score: result.maintenance_score,
        maintenance_max: result.maintenance_max,
        is_draft: result.is_draft,
        classification,
      }

      return NextResponse.json({
        data: response,
        message: isDraft
          ? 'Borrador guardado exitosamente'
          : 'Evaluación enviada exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('[Submit Evaluation API] POST error:', error)

    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.AUTHENTICATION_ERROR,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        )
      }

      if (error.name === 'AuthorizationError') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.AUTHORIZATION_ERROR,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        )
      }

      // Handle specific error messages from operations
      if (error.message === 'Missing required responses') {
        return NextResponse.json(
          {
            error: {
              code: 'MISSING_REQUIRED_RESPONSES',
              message: 'Faltan respuestas obligatorias. Complete todas las preguntas requeridas.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (error.message === 'Cannot update a completed evaluation') {
        return NextResponse.json(
          {
            error: {
              code: 'EVALUATION_ALREADY_COMPLETED',
              message: 'No se puede modificar una evaluación completada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
