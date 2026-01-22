import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { ResponsiblePerformance, TrendDirection } from '@/types/evaluations'

/**
 * Response type for responsible performance report
 */
interface ResponsibleReportResponse {
  data: ResponsiblePerformance[]
  total: number
  low_performers: ResponsiblePerformance[]
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
 * GET /api/admin/evaluations/reports/responsible
 * Generates a performance report by responsible person
 * Requires admin role
 *
 * Query parameters:
 * - start_date: Filter by start date (ISO string, optional)
 * - end_date: Filter by end date (ISO string, optional)
 *
 * @returns ResponsiblePerformance array with:
 * - responsible_person: Name of the responsible person
 * - classrooms: List of classrooms under their responsibility
 * - total_evaluations: Number of evaluations completed
 * - average_score: Average score percentage
 * - trend: Trend direction (up/down/stable)
 * - last_evaluation_date: Date of most recent evaluation
 * - scores_by_category: Average scores by category
 * 
 * Also identifies low performers with average < 70%
 * 
 * Validates: Requirements 6.2, 6.5, 6.7
 * - 6.2: Generate report by responsible with name, spaces, average score, trend, number of evaluations
 * - 6.5: Support date range filter for metrics calculation
 * - 6.7: Identify responsible persons with low performance (<70%)
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

      // Get all classrooms with responsible persons
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id, name, location, responsible_person')
        .not('responsible_person', 'is', null)
        .order('responsible_person', { ascending: true })

      if (classroomsError) throw classroomsError

      if (!classrooms || classrooms.length === 0) {
        return NextResponse.json({
          data: [],
          total: 0,
          low_performers: [],
          filters: {
            start_date: startDate,
            end_date: endDate,
          },
          generated_at: new Date().toISOString(),
        } as ResponsibleReportResponse)
      }

      // Group classrooms by responsible person
      const classroomsByResponsible = classrooms.reduce((acc, classroom) => {
        const responsible = classroom.responsible_person as string
        if (!acc[responsible]) {
          acc[responsible] = []
        }
        acc[responsible].push({
          id: classroom.id,
          name: classroom.name,
          location: classroom.location,
        })
        return acc
      }, {} as Record<string, Array<{ id: number; name: string; location: string }>>)

      // Get all classroom IDs
      const classroomIds = classrooms.map((c) => c.id)

      // Build query for evaluation results
      let query = supabase
        .from('evaluation_results')
        .select(`
          id,
          completed_at,
          score_percentage,
          organization_score,
          organization_max,
          cleanliness_score,
          cleanliness_max,
          maintenance_score,
          maintenance_max,
          scheduled_evaluation:scheduled_evaluations!inner(
            classroom_id,
            classroom:classrooms!inner(
              id,
              name,
              responsible_person
            )
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

      // Process results by responsible person
      const resultsByResponsible: Record<string, Array<{
        score_percentage: number
        completed_at: string
        organization_score: number
        organization_max: number
        cleanliness_score: number
        cleanliness_max: number
        maintenance_score: number
        maintenance_max: number
      }>> = {}

      // Initialize all responsible persons (even those without evaluations)
      Object.keys(classroomsByResponsible).forEach((responsible) => {
        resultsByResponsible[responsible] = []
      })

      // Group results by responsible person
      if (results) {
        results.forEach((result) => {
          const scheduledEval = result.scheduled_evaluation as unknown as {
            classroom_id: number
            classroom: { id: number; name: string; responsible_person: string }
          }
          
          if (scheduledEval?.classroom?.responsible_person) {
            const responsible = scheduledEval.classroom.responsible_person
            if (!resultsByResponsible[responsible]) {
              resultsByResponsible[responsible] = []
            }
            resultsByResponsible[responsible].push({
              score_percentage: result.score_percentage,
              completed_at: result.completed_at,
              organization_score: result.organization_score,
              organization_max: result.organization_max,
              cleanliness_score: result.cleanliness_score,
              cleanliness_max: result.cleanliness_max,
              maintenance_score: result.maintenance_score,
              maintenance_max: result.maintenance_max,
            })
          }
        })
      }

      // Build performance data for each responsible person
      // Requirement 6.2: Include name, spaces, average score, trend, number of evaluations
      const performanceData: ResponsiblePerformance[] = Object.entries(classroomsByResponsible).map(
        ([responsible, responsibleClassrooms]) => {
          const evaluations = resultsByResponsible[responsible] || []
          const totalEvaluations = evaluations.length

          // Calculate average score
          const averageScore = totalEvaluations > 0
            ? Math.round(
                (evaluations.reduce((sum, e) => sum + e.score_percentage, 0) / totalEvaluations) * 100
              ) / 100
            : 0

          // Calculate trend based on score percentages (ordered by date descending)
          const scores = evaluations.map((e) => e.score_percentage)
          const trend = calculateTrend(scores)

          // Get last evaluation date
          const lastEvaluationDate = evaluations.length > 0 ? evaluations[0].completed_at : undefined

          // Calculate category averages
          const categoryTotals = evaluations.reduce(
            (acc, e) => {
              acc.organization.score += e.organization_score
              acc.organization.max += e.organization_max
              acc.cleanliness.score += e.cleanliness_score
              acc.cleanliness.max += e.cleanliness_max
              acc.maintenance.score += e.maintenance_score
              acc.maintenance.max += e.maintenance_max
              return acc
            },
            {
              organization: { score: 0, max: 0 },
              cleanliness: { score: 0, max: 0 },
              maintenance: { score: 0, max: 0 },
            }
          )

          const scoresByCategory = {
            organization:
              categoryTotals.organization.max > 0
                ? Math.round(
                    (categoryTotals.organization.score / categoryTotals.organization.max) * 10000
                  ) / 100
                : 0,
            cleanliness:
              categoryTotals.cleanliness.max > 0
                ? Math.round(
                    (categoryTotals.cleanliness.score / categoryTotals.cleanliness.max) * 10000
                  ) / 100
                : 0,
            maintenance:
              categoryTotals.maintenance.max > 0
                ? Math.round(
                    (categoryTotals.maintenance.score / categoryTotals.maintenance.max) * 10000
                  ) / 100
                : 0,
          }

          return {
            responsible_person: responsible,
            classrooms: responsibleClassrooms,
            total_evaluations: totalEvaluations,
            average_score: averageScore,
            trend,
            last_evaluation_date: lastEvaluationDate,
            scores_by_category: scoresByCategory,
          }
        }
      )

      // Sort by average score descending (best performers first)
      performanceData.sort((a, b) => b.average_score - a.average_score)

      // Identify low performers (average < 70%) - Requirement 6.7
      const lowPerformers = performanceData.filter(
        (p) => p.total_evaluations > 0 && p.average_score < 70
      )

      const response: ResponsibleReportResponse = {
        data: performanceData,
        total: performanceData.length,
        low_performers: lowPerformers,
        filters: {
          start_date: startDate,
          end_date: endDate,
        },
        generated_at: new Date().toISOString(),
      }

      return NextResponse.json(response)
    })
  } catch (error: unknown) {
    console.error('[Responsible Report API] GET error:', error)

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
