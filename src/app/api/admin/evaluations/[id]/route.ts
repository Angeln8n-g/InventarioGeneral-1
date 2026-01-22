import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/evaluations/[id]
 * Gets the complete detail of an evaluation result including all responses
 * Requires admin role
 *
 * @returns Evaluation result with all responses and related data
 * 
 * Validates: Requirements 5.3 - Show complete detail with all responses and observations
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
              message: 'ID de evaluación inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get evaluation result with all related data
      const { data: result, error } = await supabase
        .from('evaluation_results')
        .select(`
          *,
          evaluator:users(id, username),
          responses:evaluation_responses(
            *,
            question:template_questions(*)
          ),
          scheduled_evaluation:scheduled_evaluations(
            id,
            scheduled_date,
            classroom:classrooms(id, name, location, responsible_person),
            template:evaluation_templates(id, name, space_type)
          )
        `)
        .eq('id', evaluationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.NOT_FOUND,
                message: 'Evaluación no encontrada',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 404 }
          )
        }
        throw error
      }

      // Sort responses by question display_order
      const sortedResponses = [...(result.responses || [])].sort(
        (a: { question: { display_order: number } }, b: { question: { display_order: number } }) => 
          a.question.display_order - b.question.display_order
      )

      return NextResponse.json({
        data: {
          ...result,
          responses: sortedResponses,
        },
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Detail API] GET error:', error)

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
