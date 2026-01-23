import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, AuthContext } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/evaluations/my-spaces
 * Gets all evaluation results for spaces where the current user is the responsible person
 * Allows non-admin users to see evaluations for their spaces
 */
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (auth: AuthContext) => {
      // Get classrooms where user is the responsible person
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id, name, location, responsible_person')
        .eq('responsible_user_id', auth.user.id)

      if (classroomsError) throw classroomsError

      if (!classrooms || classrooms.length === 0) {
        return NextResponse.json({
          data: {
            classrooms: [],
            evaluations: [],
          },
          message: 'No tienes espacios asignados como responsable',
        })
      }

      const classroomIds = classrooms.map(c => c.id)

      // Get evaluation results for these classrooms
      const { data: evaluations, error: evaluationsError } = await supabase
        .from('evaluation_results')
        .select(`
          id,
          completed_at,
          total_score,
          max_possible_score,
          score_percentage,
          approval_status,
          is_draft,
          scheduled_evaluation:scheduled_evaluations!inner(
            id,
            scheduled_date,
            classroom_id,
            classroom:classrooms(id, name, location),
            template:evaluation_templates(id, name, space_type)
          ),
          evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
          feedback:evaluation_feedback(
            id,
            agrees_with_result,
            feedback_comments,
            created_at
          )
        `)
        .in('scheduled_evaluation.classroom_id', classroomIds)
        .eq('is_draft', false)
        .order('completed_at', { ascending: false })

      if (evaluationsError) throw evaluationsError

      // Filter out null scheduled_evaluations (from the inner join)
      const validEvaluations = (evaluations || []).filter(e => e.scheduled_evaluation !== null)

      // Get classification for each evaluation
      const evaluationsWithClassification = validEvaluations.map(e => {
        const percentage = e.score_percentage
        const classification = percentage < 70
          ? 'requires_attention'
          : percentage < 90
            ? 'acceptable'
            : 'excellent'

        // Check if user has provided feedback
        const userFeedback = e.feedback?.find((f: { id: number }) => f.id) || null

        // Type the scheduled evaluation properly (Supabase returns nested objects)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduledEval = e.scheduled_evaluation as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evaluator = e.evaluator as any

        return {
          id: e.id,
          completed_at: e.completed_at,
          score_percentage: e.score_percentage,
          total_score: e.total_score,
          max_possible_score: e.max_possible_score,
          classification,
          approval_status: e.approval_status,
          classroom: {
            id: scheduledEval?.classroom?.id,
            name: scheduledEval?.classroom?.name,
            location: scheduledEval?.classroom?.location,
          },
          template: {
            id: scheduledEval?.template?.id,
            name: scheduledEval?.template?.name,
            space_type: scheduledEval?.template?.space_type,
          },
          evaluator: {
            id: evaluator?.id,
            name: evaluator?.full_name || evaluator?.username,
          },
          scheduled_date: scheduledEval?.scheduled_date,
          has_feedback: userFeedback !== null,
          feedback: userFeedback ? {
            agrees_with_result: userFeedback.agrees_with_result,
            created_at: userFeedback.created_at,
          } : null,
        }
      })

      return NextResponse.json({
        data: {
          classrooms: classrooms.map(c => ({
            id: c.id,
            name: c.name,
            location: c.location,
            responsible_person: c.responsible_person,
          })),
          evaluations: evaluationsWithClassification,
          summary: {
            total_evaluations: evaluationsWithClassification.length,
            pending_feedback: evaluationsWithClassification.filter(e => !e.has_feedback).length,
            average_score: evaluationsWithClassification.length > 0
              ? evaluationsWithClassification.reduce((sum, e) => sum + e.score_percentage, 0) / evaluationsWithClassification.length
              : 0,
          },
        },
      })
    })
  } catch (error: unknown) {
    console.error('[My Spaces Evaluations API] GET error:', error)

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
