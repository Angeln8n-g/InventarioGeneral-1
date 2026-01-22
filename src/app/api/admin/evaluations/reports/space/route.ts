import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { SpacePerformance, TrendDirection } from '@/types/evaluations'

/**
 * Response type for space performance report
 */
interface SpaceReportResponse {
  data: SpacePerformance[]
  total: number
  filters: {
    start_date: string | null
    end_date: string | null
  }
  generated_at: string
}

/**
 * Calculates trend direction based on evaluation scores
 * Compares the average of the last 3 evaluations with the previous 3
 * @param scores - Array of scores ordered by date descending (most recent first)
 * @returns Trend direction: 'up', 'down', or 'stable'
 */
function calculateTrend(scores: number[]): TrendDirection {
  if (scores.length < 2) {
    return 'stable'
  }

  // Take the most recent evaluations (up to 3) and compare with previous ones
  const recentCount = Math.min(3, Math.floor(scores.length / 2))
  const recentScores = scores.slice(0, recentCount)
  const previousScores = scores.slice(recentCount, recentCount * 2)

  if (previousScores.length === 0) {
    return 'stable'
  }

  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
  const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length

  // Consider a 5% threshold for determining trend
  const threshold = 5
  const difference = recentAvg - previousAvg

  if (difference > threshold) {
    return 'up'
  } else if (difference < -threshold) {
    return 'down'
  }
  return 'stable'
}

/**
 * GET /api/admin/evaluations/reports/space
 * Generates a performance report by space (classroom)
 * Requires admin role
 *
 * Query parameters:
 * - start_date: Filter by start date (ISO string, optional)
 * - end_date: Filter by end date (ISO string, optional)
 *
 * @returns SpacePerformance array with:
 * - classroom_id: ID of the classroom
 * - classroom_name: Name of the classroom
 * - location: Location of the classroom
 * - responsible_person: Current responsible person
 * - total_evaluations: Number of evaluations completed
 * - last_score: Most recent evaluation score
 * - average_score: Average score percentage
 * - trend: Trend direction (up/down/stable)
 * - history: Array of historical scores with dates
 * 
 * Validates: Requirements 6.3, 6.5
 * - 6.3: Generate report by space with name, responsible, last score, historical average, trend
 * - 6.5: Support date range filter for metrics calculation
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      // Parse query parameters for date range filter
      const { searchParams } = new URL(request.url)
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

      // Validate date formats if provided
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
      }

      // Get all classrooms
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id, name, location, responsible_person')
        .order('name', { ascending: true })

      if (classroomsError) throw classroomsError

      if (!classrooms || classrooms.length === 0) {
        return NextResponse.json({
          data: [],
          total: 0,
          filters: {
            start_date: startDate,
            end_date: endDate,
          },
          generated_at: new Date().toISOString(),
        } as SpaceReportResponse)
      }

      // Get all classroom IDs
      const classroomIds = classrooms.map((c) => c.id)

      // Build query for evaluation results
      let query = supabase
        .from('evaluation_results')
        .select(`
          id,
          completed_at,
          score_percentage,
          scheduled_evaluation:scheduled_evaluations!inner(
            classroom_id
          )
        `)
        .eq('is_draft', false)
        .order('completed_at', { ascending: false })

      // Apply date filters if provided (Requirement 6.5)
      if (startDate) {
        query = query.gte('completed_at', startDate)
      }
      if (endDate) {
        query = query.lte('completed_at', endDate)
      }

      const { data: results, error: resultsError } = await query

      if (resultsError) throw resultsError

      // Group results by classroom
      const resultsByClassroom: Record<number, Array<{
        score_percentage: number
        completed_at: string
      }>> = {}

      // Initialize all classrooms (even those without evaluations)
      classroomIds.forEach((id) => {
        resultsByClassroom[id] = []
      })

      // Group results by classroom
      if (results) {
        results.forEach((result) => {
          const scheduledEval = result.scheduled_evaluation as unknown as {
            classroom_id: number
          }
          
          if (scheduledEval?.classroom_id) {
            const classroomId = scheduledEval.classroom_id
            if (!resultsByClassroom[classroomId]) {
              resultsByClassroom[classroomId] = []
            }
            resultsByClassroom[classroomId].push({
              score_percentage: result.score_percentage,
              completed_at: result.completed_at,
            })
          }
        })
      }

      // Build performance data for each classroom
      // Requirement 6.3: Include name, responsible, last score, historical average, trend
      const performanceData: SpacePerformance[] = classrooms.map((classroom) => {
        const evaluations = resultsByClassroom[classroom.id] || []
        const totalEvaluations = evaluations.length

        // Get last score (most recent evaluation)
        const lastScore = totalEvaluations > 0 ? evaluations[0].score_percentage : 0

        // Calculate average score
        const averageScore = totalEvaluations > 0
          ? Math.round(
              (evaluations.reduce((sum, e) => sum + e.score_percentage, 0) / totalEvaluations) * 100
            ) / 100
          : 0

        // Calculate trend based on score percentages (ordered by date descending)
        const scores = evaluations.map((e) => e.score_percentage)
        const trend = calculateTrend(scores)

        // Build history array for trend chart (ordered by date ascending for display)
        const history = evaluations
          .map((e) => ({
            date: e.completed_at,
            score: e.score_percentage,
          }))
          .reverse() // Reverse to get chronological order for charts

        return {
          classroom_id: classroom.id,
          classroom_name: classroom.name,
          location: classroom.location,
          responsible_person: classroom.responsible_person || undefined,
          total_evaluations: totalEvaluations,
          last_score: lastScore,
          average_score: averageScore,
          trend,
          history,
        }
      })

      // Sort by average score descending (best performers first)
      performanceData.sort((a, b) => b.average_score - a.average_score)

      const response: SpaceReportResponse = {
        data: performanceData,
        total: performanceData.length,
        filters: {
          start_date: startDate,
          end_date: endDate,
        },
        generated_at: new Date().toISOString(),
      }

      return NextResponse.json(response)
    })
  } catch (error: unknown) {
    console.error('[Space Report API] GET error:', error)

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
