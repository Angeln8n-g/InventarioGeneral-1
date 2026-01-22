import { NextRequest, NextResponse } from 'next/server'
import { evaluationResultOperations, classroomOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * Response type for evaluation history items
 * Includes: fecha, evaluador, puntuación total, puntuaciones por categoría, estado
 */
interface EvaluationHistoryItem {
  id: number
  fecha: string
  evaluador: {
    id: number
    username: string
  }
  puntuacion_total: {
    score: number
    max: number
    percentage: number
  }
  puntuaciones_por_categoria: {
    organization: { score: number; max: number; percentage: number }
    cleanliness: { score: number; max: number; percentage: number }
    maintenance: { score: number; max: number; percentage: number }
  }
  estado: 'completed' | 'draft'
  scheduled_evaluation?: {
    scheduled_date: string
    template: {
      id: number
      name: string
      space_type: string
    }
  }
}

/**
 * Calculates percentage from score and max
 * @param score - The score value
 * @param max - The maximum possible value
 * @returns Percentage rounded to 2 decimal places
 */
function calculatePercentage(score: number, max: number): number {
  if (max === 0) return 0
  return Math.round((score / max) * 10000) / 100
}

/**
 * GET /api/admin/evaluations/history/[classroomId]
 * Gets the evaluation history for a specific classroom
 * Requires admin role
 *
 * Query parameters:
 * - start_date: Filter by start date (ISO string, optional)
 * - end_date: Filter by end date (ISO string, optional)
 *
 * @returns Array of evaluation history items ordered by date descending
 * 
 * Validates: Requirements 5.1, 5.2, 5.5
 * - 5.1: Show complete evaluation history ordered by date
 * - 5.2: Show fecha, evaluador, puntuación total, puntuaciones por categoría, estado
 * - 5.5: Filter by date range
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { classroomId } = await params
      const classroomIdNum = parseInt(classroomId, 10)

      // Validate classroom ID
      if (isNaN(classroomIdNum) || classroomIdNum <= 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de espacio inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Verify classroom exists
      const classroom = await classroomOperations.getById(classroomIdNum)
      if (!classroom) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Espacio no encontrado',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Parse query parameters for date range filter
      const { searchParams } = new URL(request.url)
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

      // Validate date formats if provided
      const filters: { start_date?: string; end_date?: string } = {}

      if (startDate) {
        const parsedStartDate = new Date(startDate)
        if (isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'start_date debe ser una fecha ISO válida',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
        filters.start_date = startDate
      }

      if (endDate) {
        const parsedEndDate = new Date(endDate)
        if (isNaN(parsedEndDate.getTime())) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'end_date debe ser una fecha ISO válida',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
        filters.end_date = endDate
      }

      // Get evaluation results for the classroom
      // Results are already ordered by completed_at descending in the operation
      const results = await evaluationResultOperations.getByClassroom(classroomIdNum, filters)

      // Transform results to the expected response format
      // Requirement 5.2: Include fecha, evaluador, puntuación total, puntuaciones por categoría, estado
      const historyItems: EvaluationHistoryItem[] = results.map((result) => {
        // Access the scheduled_evaluation data from the result
        const scheduledEval = (result as unknown as { scheduled_evaluation?: {
          scheduled_date: string
          template: { id: number; name: string; space_type: string }
        } }).scheduled_evaluation

        return {
          id: result.id,
          fecha: result.completed_at,
          evaluador: {
            id: result.evaluator?.id || 0,
            username: result.evaluator?.username || 'Unknown',
          },
          puntuacion_total: {
            score: result.total_score,
            max: result.max_possible_score,
            percentage: result.score_percentage,
          },
          puntuaciones_por_categoria: {
            organization: {
              score: result.organization_score,
              max: result.organization_max,
              percentage: calculatePercentage(result.organization_score, result.organization_max),
            },
            cleanliness: {
              score: result.cleanliness_score,
              max: result.cleanliness_max,
              percentage: calculatePercentage(result.cleanliness_score, result.cleanliness_max),
            },
            maintenance: {
              score: result.maintenance_score,
              max: result.maintenance_max,
              percentage: calculatePercentage(result.maintenance_score, result.maintenance_max),
            },
          },
          estado: result.is_draft ? 'draft' : 'completed',
          scheduled_evaluation: scheduledEval ? {
            scheduled_date: scheduledEval.scheduled_date,
            template: scheduledEval.template,
          } : undefined,
        }
      })

      return NextResponse.json({
        data: historyItems,
        total: historyItems.length,
        classroom: {
          id: classroom.id,
          name: classroom.name,
          location: classroom.location,
          responsible_person: classroom.responsible_person,
        },
        filters: {
          start_date: filters.start_date || null,
          end_date: filters.end_date || null,
        },
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation History API] GET error:', error)

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
