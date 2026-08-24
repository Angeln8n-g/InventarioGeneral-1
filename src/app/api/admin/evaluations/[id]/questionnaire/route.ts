import { NextRequest, NextResponse } from 'next/server'
import {
  scheduledEvaluationOperations,
  evaluationTemplateOperations,
  evaluationResultOperations,
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type {
  TemplateQuestion,
  EvaluationResponseWithQuestion,
} from '@/types/evaluations'

/**
 * Response type for the questionnaire endpoint
 */
interface QuestionnaireResponse {
  evaluation: {
    id: number
    classroom_id: number
    classroom_name: string
    classroom_location: string
    responsible_person?: string
    scheduled_date: string
    status: string
  }
  template: {
    id: number
    name: string
    space_type: string
    version: number
  }
  questions: Array<{
    id: number
    question_text: string
    category: 'organization' | 'cleanliness' | 'maintenance'
    is_required: boolean
    display_order: number
    existing_response?: {
      response: 'yes' | 'no' | 'not_applicable'
      observation?: string
    }
  }>
  draft?: {
    id: number
    is_draft: boolean
    total_score: number
    max_possible_score: number
    score_percentage: number
  }
}

/**
 * GET /api/admin/evaluations/[id]/questionnaire
 * Gets the complete questionnaire for a scheduled evaluation with all template questions
 * Includes existing responses if there's a saved draft
 * Requires admin role
 *
 * @returns Questionnaire with all questions and optional draft responses
 * Validates: Requirements 3.1 - Show questionnaire with all template questions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
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

      // Get the scheduled evaluation with details
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

      // Check if evaluation is assigned to a specific evaluator
      // If assigned, only that evaluator can execute it
      if (evaluation.assigned_to) {
        // Get current user from auth context
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          const token = authHeader.substring(7)
          const jwt = await import('jsonwebtoken')
          const JWT_SECRET = process.env.JWT_SECRET || 'inventario_sgi_jwt_secret_key_default'
          const decoded = jwt.default.verify(token, JWT_SECRET) as { userId: number }
          
          if (decoded.userId !== evaluation.assigned_to) {
            // Get assigned user info for the error message
            const assignedUser = evaluation.assigned_user as { id: number; username: string; full_name?: string } | undefined
            const assignedName = assignedUser?.full_name || assignedUser?.username || 'otro evaluador'
            
            return NextResponse.json(
              {
                error: {
                  code: 'EVALUATION_ASSIGNED_TO_OTHER',
                  message: `Esta evaluación está asignada a ${assignedName}. Solo el evaluador asignado puede completarla.`,
                  assigned_to: {
                    id: evaluation.assigned_to,
                    name: assignedName,
                  },
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 403 }
            )
          }
        }
      }

      // Check if evaluation can be started (must be pending or overdue)
      if (evaluation.status !== 'pending' && evaluation.status !== 'overdue') {
        // If completed, check if there's a draft that can be continued
        const existingResult = await evaluationResultOperations.getByScheduledId(evaluationId)
        
        if (!existingResult?.is_draft) {
          return NextResponse.json(
            {
              error: {
                code: 'EVALUATION_NOT_AVAILABLE',
                message: 'Esta evaluación ya fue completada o cancelada',
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

      // Get existing draft responses if any
      const existingResult = await evaluationResultOperations.getByScheduledId(evaluationId)

      // Build response map from existing responses
      const responseMap = new Map<number, { response: 'yes' | 'no' | 'not_applicable'; observation?: string }>()
      
      if (existingResult?.responses) {
        existingResult.responses.forEach((resp: EvaluationResponseWithQuestion) => {
          responseMap.set(resp.question_id, {
            response: resp.response,
            observation: resp.observation || undefined,
          })
        })
      }

      // Build questionnaire response with questions in display order
      // Property 16: Questionnaire contains all template questions in the same order
      const questions = template.questions
        .sort((a: TemplateQuestion, b: TemplateQuestion) => a.display_order - b.display_order)
        .map((question: TemplateQuestion) => {
          const existingResponse = responseMap.get(question.id)
          return {
            id: question.id,
            question_text: question.question_text,
            category: question.category,
            is_required: question.is_required,
            display_order: question.display_order,
            ...(existingResponse && { existing_response: existingResponse }),
          }
        })

      const response: QuestionnaireResponse = {
        evaluation: {
          id: evaluation.id,
          classroom_id: evaluation.classroom_id,
          classroom_name: evaluation.classroom?.name || '',
          classroom_location: evaluation.classroom?.location || '',
          responsible_person: evaluation.classroom?.responsible_person,
          scheduled_date: evaluation.scheduled_date,
          status: evaluation.status,
        },
        template: {
          id: template.id,
          name: template.name,
          space_type: template.space_type,
          version: template.version,
        },
        questions,
      }

      // Include draft info if exists
      if (existingResult?.is_draft) {
        response.draft = {
          id: existingResult.id,
          is_draft: existingResult.is_draft,
          total_score: existingResult.total_score,
          max_possible_score: existingResult.max_possible_score,
          score_percentage: existingResult.score_percentage,
        }
      }

      return NextResponse.json({
        data: response,
      })
    })
  } catch (error: unknown) {
    console.error('[Questionnaire API] GET error:', error)

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
