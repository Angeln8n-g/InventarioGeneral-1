import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, AuthContext } from '@/lib/auth-middleware'
import { notificationOperations, auditLogOperations } from '@/lib/supabase-client'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * Request body for submitting feedback
 */
interface FeedbackRequest {
  agrees_with_result: boolean
  feedback_comments?: string
}

/**
 * GET /api/evaluations/[id]/feedback
 * Gets the evaluation result details for a responsible person to review
 * Only accessible if the user is the responsible person for the classroom
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withAuth(request, async (auth: AuthContext) => {
      const { id } = await params
      const resultId = parseInt(id, 10)

      if (isNaN(resultId) || resultId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de resultado inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get the evaluation result with all details
      const { data: result, error: resultError } = await supabase
        .from('evaluation_results')
        .select(`
          *,
          scheduled_evaluation:scheduled_evaluations(
            *,
            classroom:classrooms(id, name, location, responsible_person, responsible_user_id),
            template:evaluation_templates(id, name, space_type)
          ),
          evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
          responses:evaluation_responses(
            *,
            question:template_questions(id, question_text, category, is_required)
          )
        `)
        .eq('id', resultId)
        .single()

      if (resultError || !result) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Resultado de evaluación no encontrado',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Check if user is the responsible person for this classroom
      const classroom = result.scheduled_evaluation?.classroom
      const isResponsible = classroom?.responsible_user_id === auth.user.id
      const isAdmin = auth.user.role === 'admin'

      if (!isResponsible && !isAdmin) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.AUTHORIZATION_ERROR,
              message: 'No tienes permiso para ver esta evaluación',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        )
      }

      // Get existing feedback if any
      const { data: existingFeedback } = await supabase
        .from('evaluation_feedback')
        .select('*')
        .eq('evaluation_result_id', resultId)
        .eq('user_id', auth.user.id)
        .single()

      return NextResponse.json({
        data: {
          result: {
            id: result.id,
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
            approval_status: result.approval_status,
            approval_comments: result.approval_comments,
          },
          classroom: {
            id: classroom?.id,
            name: classroom?.name,
            location: classroom?.location,
            responsible_person: classroom?.responsible_person,
          },
          template: {
            id: result.scheduled_evaluation?.template?.id,
            name: result.scheduled_evaluation?.template?.name,
            space_type: result.scheduled_evaluation?.template?.space_type,
          },
          evaluator: {
            id: result.evaluator?.id,
            name: result.evaluator?.full_name || result.evaluator?.username,
          },
          responses: result.responses?.map((r: {
            id: number
            response: string
            observation?: string
            question: {
              id: number
              question_text: string
              category: string
              is_required: boolean
            }
          }) => ({
            id: r.id,
            response: r.response,
            observation: r.observation,
            question: {
              id: r.question?.id,
              text: r.question?.question_text,
              category: r.question?.category,
              is_required: r.question?.is_required,
            },
          })) || [],
          feedback: existingFeedback ? {
            agrees_with_result: existingFeedback.agrees_with_result,
            feedback_comments: existingFeedback.feedback_comments,
            created_at: existingFeedback.created_at,
          } : null,
        },
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Feedback API] GET error:', error)

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

/**
 * POST /api/evaluations/[id]/feedback
 * Submits feedback from the responsible person on an evaluation result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withAuth(request, async (auth: AuthContext) => {
      const { id } = await params
      const resultId = parseInt(id, 10)

      if (isNaN(resultId) || resultId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de resultado inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Parse request body
      let body: FeedbackRequest
      try {
        body = await request.json()
      } catch {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Cuerpo de solicitud inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate required fields
      if (typeof body.agrees_with_result !== 'boolean') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El campo agrees_with_result es requerido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get the evaluation result to verify access
      const { data: result, error: resultError } = await supabase
        .from('evaluation_results')
        .select(`
          id,
          evaluator_id,
          scheduled_evaluation:scheduled_evaluations(
            classroom:classrooms(id, name, responsible_user_id)
          )
        `)
        .eq('id', resultId)
        .single()

      if (resultError || !result) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Resultado de evaluación no encontrado',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Check if user is the responsible person for this classroom
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scheduledEval = result.scheduled_evaluation as any
      const classroom = scheduledEval?.classroom as { id: number; name: string; responsible_user_id?: number } | undefined
      
      if (classroom?.responsible_user_id !== auth.user.id) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.AUTHORIZATION_ERROR,
              message: 'Solo el responsable del espacio puede proporcionar retroalimentación',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        )
      }

      // Check if feedback already exists
      const { data: existingFeedback } = await supabase
        .from('evaluation_feedback')
        .select('id')
        .eq('evaluation_result_id', resultId)
        .eq('user_id', auth.user.id)
        .single()

      let feedback
      if (existingFeedback) {
        // Update existing feedback
        const { data, error } = await supabase
          .from('evaluation_feedback')
          .update({
            agrees_with_result: body.agrees_with_result,
            feedback_comments: body.feedback_comments || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFeedback.id)
          .select()
          .single()

        if (error) throw error
        feedback = data
      } else {
        // Create new feedback
        const { data, error } = await supabase
          .from('evaluation_feedback')
          .insert({
            evaluation_result_id: resultId,
            user_id: auth.user.id,
            agrees_with_result: body.agrees_with_result,
            feedback_comments: body.feedback_comments || null,
          })
          .select()
          .single()

        if (error) throw error
        feedback = data
      }

      // Create audit log
      await auditLogOperations.create({
        user_id: auth.user.id,
        action: existingFeedback ? 'evaluation_feedback_updated' : 'evaluation_feedback_submitted',
        entity_type: 'evaluation_feedback',
        entity_id: feedback.id,
        new_values: {
          evaluation_result_id: resultId,
          agrees_with_result: body.agrees_with_result,
          has_comments: !!body.feedback_comments,
        },
      })

      // Send notification to the evaluator about the feedback
      try {
        const classroomName = classroom?.name || 'Espacio'
        const agreementText = body.agrees_with_result ? 'está de acuerdo' : 'no está de acuerdo'
        
        await notificationOperations.create({
          user_id: result.evaluator_id,
          type: 'evaluation_feedback_received',
          title: 'Retroalimentación Recibida',
          message: `El responsable de "${classroomName}" ${agreementText} con los resultados de la evaluación.${body.feedback_comments ? ' Ha dejado comentarios.' : ''}`,
        })
      } catch (notificationError) {
        console.error('[Evaluation Feedback API] Error sending notification:', notificationError)
        // Don't fail the request if notification fails
      }

      return NextResponse.json({
        data: {
          id: feedback.id,
          agrees_with_result: feedback.agrees_with_result,
          feedback_comments: feedback.feedback_comments,
          created_at: feedback.created_at,
        },
        message: existingFeedback 
          ? 'Retroalimentación actualizada exitosamente'
          : 'Retroalimentación enviada exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Feedback API] POST error:', error)

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
