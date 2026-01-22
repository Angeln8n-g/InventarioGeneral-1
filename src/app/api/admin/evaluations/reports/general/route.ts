import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { ResponsiblePerformance, SpacePerformance, TrendDirection } from '@/types/evaluations'

/**
 * Global metrics for the general report
 */
interface GlobalMetrics {
  /** Total number of evaluations completed */
  total_evaluations: number
  /** Overall average score percentage */
  overall_average_score: number
  /** Total number of spaces evaluated */
  total_spaces_evaluated: number
  /** Total number of responsible persons */
  total_responsible_persons: number
  /** Number of evaluations by status */
  evaluations_by_status: {
    pending: number
    completed: number
    overdue: number
    cancelled: number
  }
  /** Average scores by category */
  average_by_category: {
    organization: number
    cleanliness: number
    maintenance: number
  }
  /** Score distribution */
  score_distribution: {
    excellent: number // >= 90%
    acceptable: number // 70-89%
    requires_attention: number // < 70%
  }
}

/**
 * Response type for general performance report
 */
interface GeneralReportResponse {
  /** Global metrics summary */
  global_metrics: GlobalMetrics
  /** Ranking of responsible persons by average score (descending) */
  responsible_ranking: ResponsiblePerformance[]
  /** Best performing spaces (top 5) */
  best_performing_spaces: SpacePerformance[]
  /** Worst performing spaces (bottom 5) */
  worst_performing_spaces: SpacePerformance[]
  /** Low performers (responsible persons with average < 70%) */
  low_performers: ResponsiblePerformance[]
  /** Applied filters */
  filters: {
    start_date: string | null
    end_date: string | null
  }
  /** Report generation timestamp */
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
 * GET /api/admin/evaluations/reports/general
 * Generates a general overview report with global metrics and rankings
 * Requires admin role
 *
 * Query parameters:
 * - start_date: Filter by start date (ISO string, optional)
 * - end_date: Filter by end date (ISO string, optional)
 *
 * @returns GeneralReportResponse with:
 * - global_metrics: Overall system metrics
 * - responsible_ranking: Ranking of responsible persons by average score
 * - best_performing_spaces: Top 5 spaces by average score
 * - worst_performing_spaces: Bottom 5 spaces by average score
 * - low_performers: Responsible persons with average < 70%
 * 
 * Validates: Requirements 6.4
 * - 6.4: Generate general report with ranking of responsible persons, best/worst performing spaces, and global metrics
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
        .order('name', { ascending: true })

      if (classroomsError) throw classroomsError

      // Get scheduled evaluations for status counts
      let scheduledQuery = supabase
        .from('scheduled_evaluations')
        .select('id, status, scheduled_date')

      if (startDate) {
        scheduledQuery = scheduledQuery.gte('scheduled_date', startDate)
      }
      if (endDate) {
        scheduledQuery = scheduledQuery.lte('scheduled_date', endDate)
      }

      const { data: scheduledEvaluations, error: scheduledError } = await scheduledQuery

      if (scheduledError) throw scheduledError

      // Count evaluations by status
      const evaluationsByStatus = {
        pending: 0,
        completed: 0,
        overdue: 0,
        cancelled: 0,
      }

      const now = new Date()
      scheduledEvaluations?.forEach((evaluation) => {
        let status = evaluation.status as keyof typeof evaluationsByStatus
        // Check if pending evaluation is overdue
        if (status === 'pending' && new Date(evaluation.scheduled_date) < now) {
          status = 'overdue'
        }
        if (evaluationsByStatus[status] !== undefined) {
          evaluationsByStatus[status]++
        }
      })

      // Build query for evaluation results
      let resultsQuery = supabase
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
              location,
              responsible_person
            )
          )
        `)
        .eq('is_draft', false)
        .order('completed_at', { ascending: false })

      // Apply date filters if provided
      if (startDate) {
        resultsQuery = resultsQuery.gte('completed_at', startDate)
      }
      if (endDate) {
        resultsQuery = resultsQuery.lte('completed_at', endDate)
      }

      const { data: results, error: resultsError } = await resultsQuery

      if (resultsError) throw resultsError

      // Initialize data structures
      const classroomIds = classrooms?.map((c) => c.id) || []
      const classroomsWithResponsible = classrooms?.filter((c) => c.responsible_person) || []
      
      // Group classrooms by responsible person
      const classroomsByResponsible = classroomsWithResponsible.reduce((acc, classroom) => {
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

      // Initialize results by responsible and by classroom
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

      const resultsByClassroom: Record<number, Array<{
        score_percentage: number
        completed_at: string
      }>> = {}

      // Initialize all responsible persons and classrooms
      Object.keys(classroomsByResponsible).forEach((responsible) => {
        resultsByResponsible[responsible] = []
      })
      classroomIds.forEach((id) => {
        resultsByClassroom[id] = []
      })

      // Global metrics accumulators
      let totalScoreSum = 0
      let totalEvaluationsCount = 0
      const spacesEvaluated = new Set<number>()
      const categoryTotals = {
        organization: { score: 0, max: 0 },
        cleanliness: { score: 0, max: 0 },
        maintenance: { score: 0, max: 0 },
      }
      const scoreDistribution = {
        excellent: 0,
        acceptable: 0,
        requires_attention: 0,
      }

      // Process results
      if (results) {
        results.forEach((result) => {
          const scheduledEval = result.scheduled_evaluation as unknown as {
            classroom_id: number
            classroom: { id: number; name: string; location: string; responsible_person: string | null }
          }

          if (scheduledEval?.classroom) {
            const classroomId = scheduledEval.classroom_id
            const responsible = scheduledEval.classroom.responsible_person

            // Track for global metrics
            totalScoreSum += result.score_percentage
            totalEvaluationsCount++
            spacesEvaluated.add(classroomId)

            // Accumulate category scores
            categoryTotals.organization.score += result.organization_score
            categoryTotals.organization.max += result.organization_max
            categoryTotals.cleanliness.score += result.cleanliness_score
            categoryTotals.cleanliness.max += result.cleanliness_max
            categoryTotals.maintenance.score += result.maintenance_score
            categoryTotals.maintenance.max += result.maintenance_max

            // Score distribution
            if (result.score_percentage >= 90) {
              scoreDistribution.excellent++
            } else if (result.score_percentage >= 70) {
              scoreDistribution.acceptable++
            } else {
              scoreDistribution.requires_attention++
            }

            // Group by classroom
            if (!resultsByClassroom[classroomId]) {
              resultsByClassroom[classroomId] = []
            }
            resultsByClassroom[classroomId].push({
              score_percentage: result.score_percentage,
              completed_at: result.completed_at,
            })

            // Group by responsible
            if (responsible) {
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
          }
        })
      }

      // Calculate global metrics
      const globalMetrics: GlobalMetrics = {
        total_evaluations: totalEvaluationsCount,
        overall_average_score: totalEvaluationsCount > 0
          ? Math.round((totalScoreSum / totalEvaluationsCount) * 100) / 100
          : 0,
        total_spaces_evaluated: spacesEvaluated.size,
        total_responsible_persons: Object.keys(classroomsByResponsible).length,
        evaluations_by_status: evaluationsByStatus,
        average_by_category: {
          organization: categoryTotals.organization.max > 0
            ? Math.round((categoryTotals.organization.score / categoryTotals.organization.max) * 10000) / 100
            : 0,
          cleanliness: categoryTotals.cleanliness.max > 0
            ? Math.round((categoryTotals.cleanliness.score / categoryTotals.cleanliness.max) * 10000) / 100
            : 0,
          maintenance: categoryTotals.maintenance.max > 0
            ? Math.round((categoryTotals.maintenance.score / categoryTotals.maintenance.max) * 10000) / 100
            : 0,
        },
        score_distribution: scoreDistribution,
      }

      // Build responsible ranking
      const responsibleRanking: ResponsiblePerformance[] = Object.entries(classroomsByResponsible).map(
        ([responsible, responsibleClassrooms]) => {
          const evaluations = resultsByResponsible[responsible] || []
          const totalEvaluations = evaluations.length

          // Calculate average score
          const averageScore = totalEvaluations > 0
            ? Math.round(
                (evaluations.reduce((sum, e) => sum + e.score_percentage, 0) / totalEvaluations) * 100
              ) / 100
            : 0

          // Calculate trend
          const scores = evaluations.map((e) => e.score_percentage)
          const trend = calculateTrend(scores)

          // Get last evaluation date
          const lastEvaluationDate = evaluations.length > 0 ? evaluations[0].completed_at : undefined

          // Calculate category averages
          const respCategoryTotals = evaluations.reduce(
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
              respCategoryTotals.organization.max > 0
                ? Math.round(
                    (respCategoryTotals.organization.score / respCategoryTotals.organization.max) * 10000
                  ) / 100
                : 0,
            cleanliness:
              respCategoryTotals.cleanliness.max > 0
                ? Math.round(
                    (respCategoryTotals.cleanliness.score / respCategoryTotals.cleanliness.max) * 10000
                  ) / 100
                : 0,
            maintenance:
              respCategoryTotals.maintenance.max > 0
                ? Math.round(
                    (respCategoryTotals.maintenance.score / respCategoryTotals.maintenance.max) * 10000
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

      // Sort by average score descending
      responsibleRanking.sort((a, b) => b.average_score - a.average_score)

      // Identify low performers (average < 70%)
      const lowPerformers = responsibleRanking.filter(
        (p) => p.total_evaluations > 0 && p.average_score < 70
      )

      // Build space performance data
      const spacePerformanceData: SpacePerformance[] = (classrooms || []).map((classroom) => {
        const evaluations = resultsByClassroom[classroom.id] || []
        const totalEvaluations = evaluations.length

        // Get last score
        const lastScore = totalEvaluations > 0 ? evaluations[0].score_percentage : 0

        // Calculate average score
        const averageScore = totalEvaluations > 0
          ? Math.round(
              (evaluations.reduce((sum, e) => sum + e.score_percentage, 0) / totalEvaluations) * 100
            ) / 100
          : 0

        // Calculate trend
        const scores = evaluations.map((e) => e.score_percentage)
        const trend = calculateTrend(scores)

        // Build history
        const history = evaluations
          .map((e) => ({
            date: e.completed_at,
            score: e.score_percentage,
          }))
          .reverse()

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

      // Sort by average score for best/worst
      const sortedSpaces = [...spacePerformanceData]
        .filter((s) => s.total_evaluations > 0)
        .sort((a, b) => b.average_score - a.average_score)

      // Get top 5 best performing spaces
      const bestPerformingSpaces = sortedSpaces.slice(0, 5)

      // Get bottom 5 worst performing spaces
      const worstPerformingSpaces = sortedSpaces.slice(-5).reverse()

      const response: GeneralReportResponse = {
        global_metrics: globalMetrics,
        responsible_ranking: responsibleRanking,
        best_performing_spaces: bestPerformingSpaces,
        worst_performing_spaces: worstPerformingSpaces,
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
    console.error('[General Report API] GET error:', error)

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
