import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { ResponsiblePerformance, SpacePerformance, TrendDirection } from '@/types/evaluations'

// ============================================================================
// Types
// ============================================================================

type ReportType = 'responsible' | 'space' | 'general'
type ExportFormat = 'pdf' | 'excel'

interface GlobalMetrics {
  total_evaluations: number
  overall_average_score: number
  total_spaces_evaluated: number
  total_responsible_persons: number
  evaluations_by_status: {
    pending: number
    completed: number
    overdue: number
    cancelled: number
  }
  average_by_category: {
    organization: number
    cleanliness: number
    maintenance: number
  }
  score_distribution: {
    excellent: number
    acceptable: number
    requires_attention: number
  }
}

interface ReportFilters {
  start_date: string | null
  end_date: string | null
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates trend direction based on evaluation scores
 */
function calculateTrend(scores: number[]): TrendDirection {
  if (scores.length < 2) return 'stable'
  
  const recentCount = Math.min(3, Math.floor(scores.length / 2))
  const recentScores = scores.slice(0, recentCount)
  const previousScores = scores.slice(recentCount, recentCount * 2)
  
  if (previousScores.length === 0) return 'stable'
  
  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
  const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length
  
  const threshold = 5
  const difference = recentAvg - previousAvg
  
  if (difference > threshold) return 'up'
  if (difference < -threshold) return 'down'
  return 'stable'
}

/**
 * Formats date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Generates timestamp for filename
 */
function generateTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

/**
 * Gets trend label in Spanish
 */
function getTrendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'up': return '↑ Mejorando'
    case 'down': return '↓ Empeorando'
    default: return '→ Estable'
  }
}

/**
 * Gets score classification label
 */
function getScoreClassification(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 70) return 'Aceptable'
  return 'Requiere Atención'
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

async function fetchResponsibleReportData(startDate: string | null, endDate: string | null) {
  // Get all classrooms with responsible persons
  const { data: classrooms, error: classroomsError } = await supabase
    .from('classrooms')
    .select('id, name, location, responsible_person')
    .not('responsible_person', 'is', null)
    .order('responsible_person', { ascending: true })

  if (classroomsError) throw classroomsError
  if (!classrooms || classrooms.length === 0) return { data: [], lowPerformers: [] }

  // Group classrooms by responsible person
  const classroomsByResponsible = classrooms.reduce((acc, classroom) => {
    const responsible = classroom.responsible_person as string
    if (!acc[responsible]) acc[responsible] = []
    acc[responsible].push({ id: classroom.id, name: classroom.name, location: classroom.location })
    return acc
  }, {} as Record<string, Array<{ id: number; name: string; location: string }>>)

  // Build query for evaluation results
  let query = supabase
    .from('evaluation_results')
    .select(`
      id, completed_at, score_percentage,
      organization_score, organization_max,
      cleanliness_score, cleanliness_max,
      maintenance_score, maintenance_max,
      scheduled_evaluation:scheduled_evaluations!inner(
        classroom_id,
        classroom:classrooms!inner(id, name, responsible_person)
      )
    `)
    .eq('is_draft', false)
    .order('completed_at', { ascending: false })

  if (startDate) query = query.gte('completed_at', startDate)
  if (endDate) query = query.lte('completed_at', endDate)

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

  Object.keys(classroomsByResponsible).forEach((responsible) => {
    resultsByResponsible[responsible] = []
  })

  if (results) {
    results.forEach((result) => {
      const scheduledEval = result.scheduled_evaluation as unknown as {
        classroom_id: number
        classroom: { id: number; name: string; responsible_person: string }
      }
      
      if (scheduledEval?.classroom?.responsible_person) {
        const responsible = scheduledEval.classroom.responsible_person
        if (!resultsByResponsible[responsible]) resultsByResponsible[responsible] = []
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

  // Build performance data
  const performanceData: ResponsiblePerformance[] = Object.entries(classroomsByResponsible).map(
    ([responsible, responsibleClassrooms]) => {
      const evaluations = resultsByResponsible[responsible] || []
      const totalEvaluations = evaluations.length
      const averageScore = totalEvaluations > 0
        ? Math.round((evaluations.reduce((sum, e) => sum + e.score_percentage, 0) / totalEvaluations) * 100) / 100
        : 0
      const scores = evaluations.map((e) => e.score_percentage)
      const trend = calculateTrend(scores)
      const lastEvaluationDate = evaluations.length > 0 ? evaluations[0].completed_at : undefined

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
        { organization: { score: 0, max: 0 }, cleanliness: { score: 0, max: 0 }, maintenance: { score: 0, max: 0 } }
      )

      return {
        responsible_person: responsible,
        classrooms: responsibleClassrooms,
        total_evaluations: totalEvaluations,
        average_score: averageScore,
        trend,
        last_evaluation_date: lastEvaluationDate,
        scores_by_category: {
          organization: categoryTotals.organization.max > 0
            ? Math.round((categoryTotals.organization.score / categoryTotals.organization.max) * 10000) / 100 : 0,
          cleanliness: categoryTotals.cleanliness.max > 0
            ? Math.round((categoryTotals.cleanliness.score / categoryTotals.cleanliness.max) * 10000) / 100 : 0,
          maintenance: categoryTotals.maintenance.max > 0
            ? Math.round((categoryTotals.maintenance.score / categoryTotals.maintenance.max) * 10000) / 100 : 0,
        },
      }
    }
  )

  performanceData.sort((a, b) => b.average_score - a.average_score)
  const lowPerformers = performanceData.filter((p) => p.total_evaluations > 0 && p.average_score < 70)

  return { data: performanceData, lowPerformers }
}

async function fetchSpaceReportData(startDate: string | null, endDate: string | null) {
  const { data: classrooms, error: classroomsError } = await supabase
    .from('classrooms')
    .select('id, name, location, responsible_person')
    .order('name', { ascending: true })

  if (classroomsError) throw classroomsError
  if (!classrooms || classrooms.length === 0) return { data: [] }

  const classroomIds = classrooms.map((c) => c.id)

  let query = supabase
    .from('evaluation_results')
    .select(`id, completed_at, score_percentage, scheduled_evaluation:scheduled_evaluations!inner(classroom_id)`)
    .eq('is_draft', false)
    .order('completed_at', { ascending: false })

  if (startDate) query = query.gte('completed_at', startDate)
  if (endDate) query = query.lte('completed_at', endDate)

  const { data: results, error: resultsError } = await query
  if (resultsError) throw resultsError

  const resultsByClassroom: Record<number, Array<{ score_percentage: number; completed_at: string }>> = {}
  classroomIds.forEach((id) => { resultsByClassroom[id] = [] })

  if (results) {
    results.forEach((result) => {
      const scheduledEval = result.scheduled_evaluation as unknown as { classroom_id: number }
      if (scheduledEval?.classroom_id) {
        if (!resultsByClassroom[scheduledEval.classroom_id]) resultsByClassroom[scheduledEval.classroom_id] = []
        resultsByClassroom[scheduledEval.classroom_id].push({
          score_percentage: result.score_percentage,
          completed_at: result.completed_at,
        })
      }
    })
  }

  const performanceData: SpacePerformance[] = classrooms.map((classroom) => {
    const evaluations = resultsByClassroom[classroom.id] || []
    const totalEvaluations = evaluations.length
    const lastScore = totalEvaluations > 0 ? evaluations[0].score_percentage : 0
    const averageScore = totalEvaluations > 0
      ? Math.round((evaluations.reduce((sum, e) => sum + e.score_percentage, 0) / totalEvaluations) * 100) / 100 : 0
    const scores = evaluations.map((e) => e.score_percentage)
    const trend = calculateTrend(scores)
    const history = evaluations.map((e) => ({ date: e.completed_at, score: e.score_percentage })).reverse()

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

  performanceData.sort((a, b) => b.average_score - a.average_score)
  return { data: performanceData }
}

// Interface for detailed responses
interface DetailedResponse {
  space_name: string
  space_location: string
  evaluation_date: string
  evaluator_name: string
  category: string
  question_text: string
  response: string
  observation: string
  score_percentage: number
}

async function fetchDetailedResponses(startDate: string | null, endDate: string | null): Promise<DetailedResponse[]> {
  // Fetch evaluation results with responses and questions
  let query = supabase
    .from('evaluation_results')
    .select(`
      id, completed_at, score_percentage,
      evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
      scheduled_evaluation:scheduled_evaluations!inner(
        classroom:classrooms!inner(id, name, location)
      ),
      responses:evaluation_responses(
        id, response, observation,
        question:template_questions(id, question_text, category)
      )
    `)
    .eq('is_draft', false)
    .order('completed_at', { ascending: false })

  if (startDate) query = query.gte('completed_at', startDate)
  if (endDate) query = query.lte('completed_at', endDate)

  const { data: results, error } = await query
  if (error) throw error

  const detailedResponses: DetailedResponse[] = []

  results?.forEach((result) => {
    const scheduledEval = result.scheduled_evaluation as unknown as {
      classroom: { id: number; name: string; location: string }
    }
    const evaluator = result.evaluator as unknown as { id: number; username: string; full_name: string | null }
    const responses = result.responses as unknown as Array<{
      id: number
      response: 'yes' | 'no' | 'not_applicable'
      observation: string | null
      question: { id: number; question_text: string; category: string }
    }>

    if (!scheduledEval?.classroom || !responses) return

    responses.forEach((resp) => {
      if (!resp.question) return

      const categoryLabels: Record<string, string> = {
        organization: 'Organización',
        cleanliness: 'Limpieza',
        maintenance: 'Mantenimiento',
      }

      const responseLabels: Record<string, string> = {
        yes: 'Sí',
        no: 'No',
        not_applicable: 'N/A',
      }

      detailedResponses.push({
        space_name: scheduledEval.classroom.name,
        space_location: scheduledEval.classroom.location,
        evaluation_date: result.completed_at,
        evaluator_name: evaluator?.full_name || evaluator?.username || 'Desconocido',
        category: categoryLabels[resp.question.category] || resp.question.category,
        question_text: resp.question.question_text,
        response: responseLabels[resp.response] || resp.response,
        observation: resp.observation || '',
        score_percentage: result.score_percentage,
      })
    })
  })

  return detailedResponses
}

async function fetchGeneralReportData(startDate: string | null, endDate: string | null) {
  const responsibleData = await fetchResponsibleReportData(startDate, endDate)
  const spaceData = await fetchSpaceReportData(startDate, endDate)
  const detailedResponses = await fetchDetailedResponses(startDate, endDate)

  // Get scheduled evaluations for status counts
  let scheduledQuery = supabase.from('scheduled_evaluations').select('id, status, scheduled_date')
  if (startDate) scheduledQuery = scheduledQuery.gte('scheduled_date', startDate)
  if (endDate) scheduledQuery = scheduledQuery.lte('scheduled_date', endDate)

  const { data: scheduledEvaluations, error: scheduledError } = await scheduledQuery
  if (scheduledError) throw scheduledError

  const evaluationsByStatus = { pending: 0, completed: 0, overdue: 0, cancelled: 0 }
  const now = new Date()
  scheduledEvaluations?.forEach((evaluation) => {
    let status = evaluation.status as keyof typeof evaluationsByStatus
    if (status === 'pending' && new Date(evaluation.scheduled_date) < now) status = 'overdue'
    if (evaluationsByStatus[status] !== undefined) evaluationsByStatus[status]++
  })

  // Fetch evaluator performance data
  let evaluatorQuery = supabase
    .from('evaluation_results')
    .select(`
      id, evaluator_id, score_percentage, completed_at, approval_status,
      evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name)
    `)
    .eq('is_draft', false)
  
  if (startDate) evaluatorQuery = evaluatorQuery.gte('completed_at', startDate)
  if (endDate) evaluatorQuery = evaluatorQuery.lte('completed_at', endDate)
  
  const { data: evaluatorResults, error: evaluatorError } = await evaluatorQuery
  if (evaluatorError) throw evaluatorError

  // Process evaluator data
  const evaluatorMap = new Map<number, {
    id: number
    username: string
    full_name: string | null
    total_evaluations: number
    average_score: number
    scores: number[]
    approved: number
    rejected: number
    pending: number
  }>()

  evaluatorResults?.forEach((result) => {
    const evaluator = result.evaluator as unknown as { id: number; username: string; full_name: string | null }
    if (!evaluator) return

    if (!evaluatorMap.has(evaluator.id)) {
      evaluatorMap.set(evaluator.id, {
        id: evaluator.id,
        username: evaluator.username,
        full_name: evaluator.full_name,
        total_evaluations: 0,
        average_score: 0,
        scores: [],
        approved: 0,
        rejected: 0,
        pending: 0,
      })
    }

    const data = evaluatorMap.get(evaluator.id)!
    data.total_evaluations++
    data.scores.push(result.score_percentage)
    
    if (result.approval_status === 'approved') data.approved++
    else if (result.approval_status === 'rejected') data.rejected++
    else data.pending++
  })

  // Calculate averages for evaluators
  const evaluatorPerformance = Array.from(evaluatorMap.values()).map((e) => ({
    ...e,
    average_score: e.scores.length > 0 
      ? Math.round((e.scores.reduce((a, b) => a + b, 0) / e.scores.length) * 100) / 100 
      : 0,
  })).sort((a, b) => b.total_evaluations - a.total_evaluations)

  // Fetch approval metrics
  let approvalQuery = supabase
    .from('evaluation_results')
    .select(`
      id, approval_status, approved_at, approval_comments,
      approver:users!evaluation_results_approved_by_fkey(id, username, full_name)
    `)
    .eq('is_draft', false)
    .not('approval_status', 'eq', 'pending')
  
  if (startDate) approvalQuery = approvalQuery.gte('completed_at', startDate)
  if (endDate) approvalQuery = approvalQuery.lte('completed_at', endDate)
  
  const { data: approvalResults, error: approvalError } = await approvalQuery
  if (approvalError) throw approvalError

  // Process approver data
  const approverMap = new Map<number, {
    id: number
    username: string
    full_name: string | null
    total_reviewed: number
    approved: number
    rejected: number
  }>()

  approvalResults?.forEach((result) => {
    const approver = result.approver as unknown as { id: number; username: string; full_name: string | null }
    if (!approver) return

    if (!approverMap.has(approver.id)) {
      approverMap.set(approver.id, {
        id: approver.id,
        username: approver.username,
        full_name: approver.full_name,
        total_reviewed: 0,
        approved: 0,
        rejected: 0,
      })
    }

    const data = approverMap.get(approver.id)!
    data.total_reviewed++
    if (result.approval_status === 'approved') data.approved++
    else if (result.approval_status === 'rejected') data.rejected++
  })

  const approverPerformance = Array.from(approverMap.values())
    .sort((a, b) => b.total_reviewed - a.total_reviewed)

  // Calculate global metrics from responsible data
  let totalEvaluations = 0
  let totalScoreSum = 0
  const spacesEvaluated = new Set<number>()
  const scoreDistribution = { excellent: 0, acceptable: 0, requires_attention: 0 }

  responsibleData.data.forEach((responsible) => {
    totalEvaluations += responsible.total_evaluations
    totalScoreSum += responsible.average_score * responsible.total_evaluations
    responsible.classrooms.forEach((c) => spacesEvaluated.add(c.id))
  })

  // Calculate score distribution from space data
  spaceData.data.forEach((space) => {
    if (space.total_evaluations > 0) {
      if (space.average_score >= 90) scoreDistribution.excellent++
      else if (space.average_score >= 70) scoreDistribution.acceptable++
      else scoreDistribution.requires_attention++
    }
  })

  const globalMetrics: GlobalMetrics = {
    total_evaluations: totalEvaluations,
    overall_average_score: totalEvaluations > 0 ? Math.round((totalScoreSum / totalEvaluations) * 100) / 100 : 0,
    total_spaces_evaluated: spacesEvaluated.size,
    total_responsible_persons: responsibleData.data.length,
    evaluations_by_status: evaluationsByStatus,
    average_by_category: {
      organization: 0,
      cleanliness: 0,
      maintenance: 0,
    },
    score_distribution: scoreDistribution,
  }

  // Calculate category averages
  let orgTotal = 0, cleanTotal = 0, maintTotal = 0, count = 0
  responsibleData.data.forEach((r) => {
    if (r.total_evaluations > 0) {
      orgTotal += r.scores_by_category.organization
      cleanTotal += r.scores_by_category.cleanliness
      maintTotal += r.scores_by_category.maintenance
      count++
    }
  })
  if (count > 0) {
    globalMetrics.average_by_category = {
      organization: Math.round((orgTotal / count) * 100) / 100,
      cleanliness: Math.round((cleanTotal / count) * 100) / 100,
      maintenance: Math.round((maintTotal / count) * 100) / 100,
    }
  }

  const sortedSpaces = [...spaceData.data].filter((s) => s.total_evaluations > 0).sort((a, b) => b.average_score - a.average_score)

  return {
    globalMetrics,
    responsibleRanking: responsibleData.data,
    bestPerformingSpaces: sortedSpaces.slice(0, 5),
    worstPerformingSpaces: sortedSpaces.slice(-5).reverse(),
    lowPerformers: responsibleData.lowPerformers,
    evaluatorPerformance,
    approverPerformance,
    allSpaces: spaceData.data,
    detailedResponses,
  }
}


// ============================================================================
// PDF Generation Functions
// ============================================================================

function generateResponsibleReportPDF(
  data: ResponsiblePerformance[],
  lowPerformers: ResponsiblePerformance[],
  filters: ReportFilters
): Blob {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('Reporte de Evaluaciones por Responsable', 14, 20)
  
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)
  
  if (filters.start_date || filters.end_date) {
    const startStr = filters.start_date ? formatDate(filters.start_date) : 'Inicio'
    const endStr = filters.end_date ? formatDate(filters.end_date) : 'Actual'
    doc.text(`Período: ${startStr} - ${endStr}`, 14, 34)
  }
  
  // Summary metrics
  doc.setFontSize(14)
  doc.text('Resumen', 14, 45)
  
  doc.setFontSize(10)
  doc.text(`Total de Responsables: ${data.length}`, 14, 52)
  doc.text(`Responsables con Bajo Desempeño (<70%): ${lowPerformers.length}`, 14, 58)
  
  // Low performers warning
  if (lowPerformers.length > 0) {
    doc.setTextColor(220, 38, 38) // Red
    doc.text(`⚠ Atención: ${lowPerformers.map(p => p.responsible_person).join(', ')}`, 14, 66)
    doc.setTextColor(0, 0, 0) // Reset to black
  }
  
  // Main table
  const tableData = data.map((item, index) => [
    `#${index + 1}`,
    item.responsible_person,
    item.classrooms.length.toString(),
    item.total_evaluations > 0 ? `${item.average_score.toFixed(1)}%` : 'N/A',
    getTrendLabel(item.trend),
    item.total_evaluations.toString(),
    item.last_evaluation_date ? formatDate(item.last_evaluation_date) : '-',
  ])
  
  autoTable(doc, {
    startY: lowPerformers.length > 0 ? 75 : 68,
    head: [['#', 'Responsable', 'Espacios', 'Promedio', 'Tendencia', 'Evaluaciones', 'Última Eval.']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 38, 38] }, // Claro red
    didParseCell: (data) => {
      // Highlight low performers
      if (data.section === 'body' && data.column.index === 3) {
        const scoreText = data.cell.raw as string
        if (scoreText !== 'N/A') {
          const score = parseFloat(scoreText)
          if (score < 70) {
            data.cell.styles.textColor = [220, 38, 38]
            data.cell.styles.fontStyle = 'bold'
          } else if (score >= 90) {
            data.cell.styles.textColor = [22, 163, 74]
          }
        }
      }
    },
  })
  
  // Category scores on new page if there's data
  if (data.some(d => d.total_evaluations > 0)) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Puntuaciones por Categoría', 14, 20)
    
    const categoryData = data
      .filter(d => d.total_evaluations > 0)
      .map((item, index) => [
        `#${index + 1}`,
        item.responsible_person,
        `${item.scores_by_category.organization.toFixed(1)}%`,
        `${item.scores_by_category.cleanliness.toFixed(1)}%`,
        `${item.scores_by_category.maintenance.toFixed(1)}%`,
      ])
    
    autoTable(doc, {
      startY: 27,
      head: [['#', 'Responsable', 'Organización', 'Limpieza', 'Mantenimiento']],
      body: categoryData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
    })
  }
  
  return doc.output('blob')
}

function generateSpaceReportPDF(
  data: SpacePerformance[],
  filters: ReportFilters
): Blob {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('Reporte de Evaluaciones por Espacio', 14, 20)
  
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)
  
  if (filters.start_date || filters.end_date) {
    const startStr = filters.start_date ? formatDate(filters.start_date) : 'Inicio'
    const endStr = filters.end_date ? formatDate(filters.end_date) : 'Actual'
    doc.text(`Período: ${startStr} - ${endStr}`, 14, 34)
  }
  
  // Summary
  doc.setFontSize(14)
  doc.text('Resumen', 14, 45)
  
  const spacesWithEvals = data.filter(d => d.total_evaluations > 0)
  const avgScore = spacesWithEvals.length > 0
    ? spacesWithEvals.reduce((sum, d) => sum + d.average_score, 0) / spacesWithEvals.length
    : 0
  
  doc.setFontSize(10)
  doc.text(`Total de Espacios: ${data.length}`, 14, 52)
  doc.text(`Espacios Evaluados: ${spacesWithEvals.length}`, 14, 58)
  doc.text(`Promedio General: ${avgScore.toFixed(1)}%`, 14, 64)
  
  // Main table
  const tableData = data.map((item, index) => [
    `#${index + 1}`,
    item.classroom_name,
    item.location,
    item.responsible_person || '-',
    item.total_evaluations > 0 ? `${item.last_score.toFixed(1)}%` : 'N/A',
    item.total_evaluations > 0 ? `${item.average_score.toFixed(1)}%` : 'N/A',
    getTrendLabel(item.trend),
    item.total_evaluations.toString(),
  ])
  
  autoTable(doc, {
    startY: 72,
    head: [['#', 'Espacio', 'Ubicación', 'Responsable', 'Última', 'Promedio', 'Tendencia', 'Evals.']],
    body: tableData,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [220, 38, 38] },
    columnStyles: {
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
        const scoreText = data.cell.raw as string
        if (scoreText !== 'N/A') {
          const score = parseFloat(scoreText)
          if (score < 70) {
            data.cell.styles.textColor = [220, 38, 38]
          } else if (score >= 90) {
            data.cell.styles.textColor = [22, 163, 74]
          }
        }
      }
    },
  })
  
  return doc.output('blob')
}

function generateGeneralReportPDF(
  globalMetrics: GlobalMetrics,
  responsibleRanking: ResponsiblePerformance[],
  bestPerformingSpaces: SpacePerformance[],
  worstPerformingSpaces: SpacePerformance[],
  lowPerformers: ResponsiblePerformance[],
  filters: ReportFilters
): Blob {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('Reporte General de Evaluaciones', 14, 20)
  
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)
  
  if (filters.start_date || filters.end_date) {
    const startStr = filters.start_date ? formatDate(filters.start_date) : 'Inicio'
    const endStr = filters.end_date ? formatDate(filters.end_date) : 'Actual'
    doc.text(`Período: ${startStr} - ${endStr}`, 14, 34)
  }
  
  // Global Metrics
  doc.setFontSize(14)
  doc.text('Métricas Globales', 14, 45)
  
  doc.setFontSize(10)
  let y = 52
  doc.text(`Total de Evaluaciones: ${globalMetrics.total_evaluations}`, 14, y)
  doc.text(`Promedio General: ${globalMetrics.overall_average_score.toFixed(1)}%`, 14, y + 6)
  doc.text(`Espacios Evaluados: ${globalMetrics.total_spaces_evaluated}`, 14, y + 12)
  doc.text(`Total de Responsables: ${globalMetrics.total_responsible_persons}`, 14, y + 18)
  
  // Status distribution
  doc.text(`Evaluaciones Pendientes: ${globalMetrics.evaluations_by_status.pending}`, 110, y)
  doc.text(`Evaluaciones Completadas: ${globalMetrics.evaluations_by_status.completed}`, 110, y + 6)
  doc.text(`Evaluaciones Vencidas: ${globalMetrics.evaluations_by_status.overdue}`, 110, y + 12)
  doc.text(`Evaluaciones Canceladas: ${globalMetrics.evaluations_by_status.cancelled}`, 110, y + 18)
  
  // Score Distribution
  doc.setFontSize(14)
  doc.text('Distribución de Puntuaciones', 14, y + 32)
  
  doc.setFontSize(10)
  doc.setTextColor(22, 163, 74)
  doc.text(`Excelente (≥90%): ${globalMetrics.score_distribution.excellent}`, 14, y + 40)
  doc.setTextColor(202, 138, 4)
  doc.text(`Aceptable (70-89%): ${globalMetrics.score_distribution.acceptable}`, 70, y + 40)
  doc.setTextColor(220, 38, 38)
  doc.text(`Requiere Atención (<70%): ${globalMetrics.score_distribution.requires_attention}`, 130, y + 40)
  doc.setTextColor(0, 0, 0)
  
  // Category Averages
  doc.setFontSize(14)
  doc.text('Promedio por Categoría', 14, y + 52)
  
  doc.setFontSize(10)
  doc.text(`Organización: ${globalMetrics.average_by_category.organization.toFixed(1)}%`, 14, y + 60)
  doc.text(`Limpieza: ${globalMetrics.average_by_category.cleanliness.toFixed(1)}%`, 70, y + 60)
  doc.text(`Mantenimiento: ${globalMetrics.average_by_category.maintenance.toFixed(1)}%`, 130, y + 60)
  
  // Low Performers Warning
  if (lowPerformers.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text(`⚠ Responsables con Bajo Desempeño (${lowPerformers.length}):`, 14, y + 75)
    doc.setFontSize(9)
    const lowPerformerText = lowPerformers.map(p => `${p.responsible_person} (${p.average_score.toFixed(1)}%)`).join(', ')
    const splitText = doc.splitTextToSize(lowPerformerText, 180)
    doc.text(splitText, 14, y + 82)
    doc.setTextColor(0, 0, 0)
  }
  
  // Best Performing Spaces
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Mejores Espacios', 14, 20)
  
  if (bestPerformingSpaces.length > 0) {
    const bestData = bestPerformingSpaces.map((space, index) => [
      `#${index + 1}`,
      space.classroom_name,
      space.responsible_person || '-',
      `${space.average_score.toFixed(1)}%`,
      getTrendLabel(space.trend),
    ])
    
    autoTable(doc, {
      startY: 27,
      head: [['#', 'Espacio', 'Responsable', 'Promedio', 'Tendencia']],
      body: bestData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
    })
  }
  
  // Worst Performing Spaces
  const worstStartY = (doc as any).lastAutoTable?.finalY + 15 || 80
  doc.setFontSize(14)
  doc.text('Espacios que Requieren Atención', 14, worstStartY)
  
  if (worstPerformingSpaces.length > 0) {
    const worstData = worstPerformingSpaces.map((space, index) => [
      `#${index + 1}`,
      space.classroom_name,
      space.responsible_person || '-',
      `${space.average_score.toFixed(1)}%`,
      getTrendLabel(space.trend),
    ])
    
    autoTable(doc, {
      startY: worstStartY + 7,
      head: [['#', 'Espacio', 'Responsable', 'Promedio', 'Tendencia']],
      body: worstData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38] },
    })
  }
  
  // Responsible Ranking
  const rankingStartY = (doc as any).lastAutoTable?.finalY + 15 || 150
  
  if (rankingStartY > 200) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Ranking de Responsables', 14, 20)
    
    const rankingData = responsibleRanking.slice(0, 10).map((item, index) => [
      `#${index + 1}`,
      item.responsible_person,
      `${item.average_score.toFixed(1)}%`,
      getTrendLabel(item.trend),
      item.total_evaluations.toString(),
    ])
    
    autoTable(doc, {
      startY: 27,
      head: [['#', 'Responsable', 'Promedio', 'Tendencia', 'Evaluaciones']],
      body: rankingData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38] },
    })
  } else {
    doc.setFontSize(14)
    doc.text('Ranking de Responsables (Top 10)', 14, rankingStartY)
    
    const rankingData = responsibleRanking.slice(0, 10).map((item, index) => [
      `#${index + 1}`,
      item.responsible_person,
      `${item.average_score.toFixed(1)}%`,
      getTrendLabel(item.trend),
      item.total_evaluations.toString(),
    ])
    
    autoTable(doc, {
      startY: rankingStartY + 7,
      head: [['#', 'Responsable', 'Promedio', 'Tendencia', 'Evaluaciones']],
      body: rankingData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38] },
    })
  }
  
  return doc.output('blob')
}


// ============================================================================
// Excel Generation Functions
// ============================================================================

function generateResponsibleReportExcel(
  data: ResponsiblePerformance[],
  lowPerformers: ResponsiblePerformance[],
  filters: ReportFilters
): Blob {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = [
    ['Reporte de Evaluaciones por Responsable'],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [],
    ['Métricas'],
    ['Total de Responsables', data.length],
    ['Responsables con Bajo Desempeño (<70%)', lowPerformers.length],
  ]
  
  if (filters.start_date || filters.end_date) {
    const startStr = filters.start_date ? formatDate(filters.start_date) : 'Inicio'
    const endStr = filters.end_date ? formatDate(filters.end_date) : 'Actual'
    summaryData.splice(2, 0, ['Período:', `${startStr} - ${endStr}`])
  }
  
  if (lowPerformers.length > 0) {
    summaryData.push([])
    summaryData.push(['Responsables con Bajo Desempeño:'])
    lowPerformers.forEach(p => {
      summaryData.push([p.responsible_person, `${p.average_score.toFixed(1)}%`])
    })
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  
  // Detailed data sheet
  const detailedData = data.map((item, index) => ({
    'Ranking': index + 1,
    'Responsable': item.responsible_person,
    'Espacios a Cargo': item.classrooms.length,
    'Lista de Espacios': item.classrooms.map(c => c.name).join(', '),
    'Promedio (%)': item.total_evaluations > 0 ? item.average_score : 'N/A',
    'Clasificación': item.total_evaluations > 0 ? getScoreClassification(item.average_score) : 'Sin Evaluaciones',
    'Tendencia': getTrendLabel(item.trend),
    'Total Evaluaciones': item.total_evaluations,
    'Última Evaluación': item.last_evaluation_date ? formatDate(item.last_evaluation_date) : '-',
    'Organización (%)': item.total_evaluations > 0 ? item.scores_by_category.organization : 'N/A',
    'Limpieza (%)': item.total_evaluations > 0 ? item.scores_by_category.cleanliness : 'N/A',
    'Mantenimiento (%)': item.total_evaluations > 0 ? item.scores_by_category.maintenance : 'N/A',
  }))
  
  const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detalle por Responsable')
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function generateSpaceReportExcel(
  data: SpacePerformance[],
  filters: ReportFilters
): Blob {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const spacesWithEvals = data.filter(d => d.total_evaluations > 0)
  const avgScore = spacesWithEvals.length > 0
    ? spacesWithEvals.reduce((sum, d) => sum + d.average_score, 0) / spacesWithEvals.length
    : 0
  
  const summaryData = [
    ['Reporte de Evaluaciones por Espacio'],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [],
    ['Métricas'],
    ['Total de Espacios', data.length],
    ['Espacios Evaluados', spacesWithEvals.length],
    ['Promedio General (%)', avgScore.toFixed(1)],
  ]
  
  if (filters.start_date || filters.end_date) {
    const startStr = filters.start_date ? formatDate(filters.start_date) : 'Inicio'
    const endStr = filters.end_date ? formatDate(filters.end_date) : 'Actual'
    summaryData.splice(2, 0, ['Período:', `${startStr} - ${endStr}`])
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  
  // Detailed data sheet
  const detailedData = data.map((item, index) => ({
    'Ranking': index + 1,
    'Espacio': item.classroom_name,
    'Ubicación': item.location,
    'Responsable': item.responsible_person || '-',
    'Última Puntuación (%)': item.total_evaluations > 0 ? item.last_score : 'N/A',
    'Promedio (%)': item.total_evaluations > 0 ? item.average_score : 'N/A',
    'Clasificación': item.total_evaluations > 0 ? getScoreClassification(item.average_score) : 'Sin Evaluaciones',
    'Tendencia': getTrendLabel(item.trend),
    'Total Evaluaciones': item.total_evaluations,
  }))
  
  const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detalle por Espacio')
  
  // History sheet for spaces with evaluations
  const historyData: Array<{
    'Espacio': string
    'Fecha': string
    'Puntuación (%)': number
  }> = []
  
  data.forEach(space => {
    space.history.forEach(h => {
      historyData.push({
        'Espacio': space.classroom_name,
        'Fecha': formatDate(h.date),
        'Puntuación (%)': h.score,
      })
    })
  })
  
  if (historyData.length > 0) {
    const historySheet = XLSX.utils.json_to_sheet(historyData)
    XLSX.utils.book_append_sheet(workbook, historySheet, 'Historial')
  }
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

interface EvaluatorPerformance {
  id: number
  username: string
  full_name: string | null
  total_evaluations: number
  average_score: number
  approved: number
  rejected: number
  pending: number
}

interface ApproverPerformance {
  id: number
  username: string
  full_name: string | null
  total_reviewed: number
  approved: number
  rejected: number
}

function generateGeneralReportExcel(
  globalMetrics: GlobalMetrics,
  responsibleRanking: ResponsiblePerformance[],
  bestPerformingSpaces: SpacePerformance[],
  worstPerformingSpaces: SpacePerformance[],
  lowPerformers: ResponsiblePerformance[],
  filters: ReportFilters,
  evaluatorPerformance?: EvaluatorPerformance[],
  approverPerformance?: ApproverPerformance[],
  allSpaces?: SpacePerformance[],
  detailedResponses?: DetailedResponse[]
): Blob {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = [
    ['Reporte General de Evaluaciones'],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [],
    ['Métricas Globales'],
    ['Total de Evaluaciones', globalMetrics.total_evaluations],
    ['Promedio General (%)', globalMetrics.overall_average_score],
    ['Espacios Evaluados', globalMetrics.total_spaces_evaluated],
    ['Total de Responsables', globalMetrics.total_responsible_persons],
    [],
    ['Estado de Evaluaciones'],
    ['Pendientes', globalMetrics.evaluations_by_status.pending],
    ['Completadas', globalMetrics.evaluations_by_status.completed],
    ['Vencidas', globalMetrics.evaluations_by_status.overdue],
    ['Canceladas', globalMetrics.evaluations_by_status.cancelled],
    [],
    ['Distribución de Puntuaciones'],
    ['Excelente (≥90%)', globalMetrics.score_distribution.excellent],
    ['Aceptable (70-89%)', globalMetrics.score_distribution.acceptable],
    ['Requiere Atención (<70%)', globalMetrics.score_distribution.requires_attention],
    [],
    ['Promedio por Categoría'],
    ['Organización (%)', globalMetrics.average_by_category.organization],
    ['Limpieza (%)', globalMetrics.average_by_category.cleanliness],
    ['Mantenimiento (%)', globalMetrics.average_by_category.maintenance],
  ]
  
  if (filters.start_date || filters.end_date) {
    const startStr = filters.start_date ? formatDate(filters.start_date) : 'Inicio'
    const endStr = filters.end_date ? formatDate(filters.end_date) : 'Actual'
    summaryData.splice(2, 0, ['Período:', `${startStr} - ${endStr}`])
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  
  // Responsible Ranking sheet
  const rankingData = responsibleRanking.map((item, index) => ({
    'Ranking': index + 1,
    'Responsable': item.responsible_person,
    'Promedio (%)': item.average_score,
    'Clasificación': item.total_evaluations > 0 ? getScoreClassification(item.average_score) : 'Sin Evaluaciones',
    'Tendencia': getTrendLabel(item.trend),
    'Total Evaluaciones': item.total_evaluations,
    'Espacios a Cargo': item.classrooms.length,
    'Bajo Desempeño': item.total_evaluations > 0 && item.average_score < 70 ? 'Sí' : 'No',
  }))
  
  const rankingSheet = XLSX.utils.json_to_sheet(rankingData)
  XLSX.utils.book_append_sheet(workbook, rankingSheet, 'Ranking Responsables')
  
  // Best Performing Spaces sheet
  const bestData = bestPerformingSpaces.map((space, index) => ({
    'Ranking': index + 1,
    'Espacio': space.classroom_name,
    'Ubicación': space.location,
    'Responsable': space.responsible_person || '-',
    'Promedio (%)': space.average_score,
    'Tendencia': getTrendLabel(space.trend),
    'Total Evaluaciones': space.total_evaluations,
  }))
  
  const bestSheet = XLSX.utils.json_to_sheet(bestData)
  XLSX.utils.book_append_sheet(workbook, bestSheet, 'Mejores Espacios')
  
  // Worst Performing Spaces sheet
  const worstData = worstPerformingSpaces.map((space, index) => ({
    'Ranking': index + 1,
    'Espacio': space.classroom_name,
    'Ubicación': space.location,
    'Responsable': space.responsible_person || '-',
    'Promedio (%)': space.average_score,
    'Tendencia': getTrendLabel(space.trend),
    'Total Evaluaciones': space.total_evaluations,
  }))
  
  const worstSheet = XLSX.utils.json_to_sheet(worstData)
  XLSX.utils.book_append_sheet(workbook, worstSheet, 'Espacios Requieren Atención')
  
  // Low Performers sheet
  if (lowPerformers.length > 0) {
    const lowPerformersData = lowPerformers.map((item, index) => ({
      'Ranking': index + 1,
      'Responsable': item.responsible_person,
      'Promedio (%)': item.average_score,
      'Espacios a Cargo': item.classrooms.length,
      'Lista de Espacios': item.classrooms.map(c => c.name).join(', '),
      'Total Evaluaciones': item.total_evaluations,
      'Última Evaluación': item.last_evaluation_date ? formatDate(item.last_evaluation_date) : '-',
    }))
    
    const lowPerformersSheet = XLSX.utils.json_to_sheet(lowPerformersData)
    XLSX.utils.book_append_sheet(workbook, lowPerformersSheet, 'Bajo Desempeño')
  }

  // Evaluators Performance sheet
  if (evaluatorPerformance && evaluatorPerformance.length > 0) {
    const evaluatorData = evaluatorPerformance.map((item, index) => ({
      'Ranking': index + 1,
      'Evaluador': item.full_name || item.username,
      'Usuario': item.username,
      'Total Evaluaciones': item.total_evaluations,
      'Promedio (%)': item.average_score,
      'Clasificación': item.total_evaluations > 0 ? getScoreClassification(item.average_score) : 'Sin Evaluaciones',
      'Aprobadas': item.approved,
      'Rechazadas': item.rejected,
      'Pendientes': item.pending,
      'Tasa Aprobación (%)': item.total_evaluations > 0 
        ? Math.round((item.approved / item.total_evaluations) * 100) 
        : 0,
    }))
    
    const evaluatorSheet = XLSX.utils.json_to_sheet(evaluatorData)
    XLSX.utils.book_append_sheet(workbook, evaluatorSheet, 'Evaluadores')
  }

  // Approvers Performance sheet
  if (approverPerformance && approverPerformance.length > 0) {
    const approverData = approverPerformance.map((item, index) => ({
      'Ranking': index + 1,
      'Aprobador': item.full_name || item.username,
      'Usuario': item.username,
      'Total Revisadas': item.total_reviewed,
      'Aprobadas': item.approved,
      'Rechazadas': item.rejected,
      'Tasa Aprobación (%)': item.total_reviewed > 0 
        ? Math.round((item.approved / item.total_reviewed) * 100) 
        : 0,
      'Tasa Rechazo (%)': item.total_reviewed > 0 
        ? Math.round((item.rejected / item.total_reviewed) * 100) 
        : 0,
    }))
    
    const approverSheet = XLSX.utils.json_to_sheet(approverData)
    XLSX.utils.book_append_sheet(workbook, approverSheet, 'Aprobadores')
  }

  // All Spaces (Aulas Evaluadas) sheet
  if (allSpaces && allSpaces.length > 0) {
    const allSpacesData = allSpaces.map((space, index) => ({
      'Ranking': index + 1,
      'Espacio': space.classroom_name,
      'Ubicación': space.location,
      'Responsable': space.responsible_person || '-',
      'Última Puntuación (%)': space.total_evaluations > 0 ? space.last_score : 'N/A',
      'Promedio (%)': space.total_evaluations > 0 ? space.average_score : 'N/A',
      'Clasificación': space.total_evaluations > 0 ? getScoreClassification(space.average_score) : 'Sin Evaluaciones',
      'Tendencia': getTrendLabel(space.trend),
      'Total Evaluaciones': space.total_evaluations,
    }))
    
    const allSpacesSheet = XLSX.utils.json_to_sheet(allSpacesData)
    XLSX.utils.book_append_sheet(workbook, allSpacesSheet, 'Aulas Evaluadas')
  }

  // Detailed Responses sheet (Questions and Answers)
  if (detailedResponses && detailedResponses.length > 0) {
    const responsesData = detailedResponses.map((item) => ({
      'Espacio': item.space_name,
      'Ubicación': item.space_location,
      'Fecha Evaluación': formatDate(item.evaluation_date),
      'Evaluador': item.evaluator_name,
      'Puntuación (%)': item.score_percentage,
      'Categoría': item.category,
      'Pregunta': item.question_text,
      'Respuesta': item.response,
      'Observación': item.observation,
    }))
    
    const responsesSheet = XLSX.utils.json_to_sheet(responsesData)
    
    // Set column widths for better readability
    responsesSheet['!cols'] = [
      { wch: 20 },  // Espacio
      { wch: 15 },  // Ubicación
      { wch: 15 },  // Fecha
      { wch: 20 },  // Evaluador
      { wch: 12 },  // Puntuación
      { wch: 15 },  // Categoría
      { wch: 50 },  // Pregunta
      { wch: 10 },  // Respuesta
      { wch: 40 },  // Observación
    ]
    
    XLSX.utils.book_append_sheet(workbook, responsesSheet, 'Detalle Respuestas')
  }
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * POST /api/admin/evaluations/reports/export
 * Exports evaluation reports to PDF or Excel format
 * Requires admin role
 *
 * Query parameters:
 * - format: Export format ('pdf' or 'excel')
 * - report_type: Type of report ('responsible', 'space', or 'general')
 * - start_date: Filter by start date (ISO string, optional)
 * - end_date: Filter by end date (ISO string, optional)
 *
 * @returns Binary file (PDF or Excel) with the report data
 * 
 * Validates: Requirements 6.6
 * - 6.6: Export reports to PDF or Excel format with data and charts
 */
export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      // Parse query parameters
      const { searchParams } = new URL(request.url)
      const format = searchParams.get('format') as ExportFormat
      const reportType = searchParams.get('report_type') as ReportType
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

      // Validate required parameters
      if (!format || !['pdf', 'excel'].includes(format)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Formato de exportación inválido. Use "pdf" o "excel".',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (!reportType || !['responsible', 'space', 'general'].includes(reportType)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Tipo de reporte inválido. Use "responsible", "space" o "general".',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

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

      const filters: ReportFilters = {
        start_date: startDate,
        end_date: endDate,
      }

      let blob: Blob
      let filename: string
      const timestamp = generateTimestamp()

      // Generate report based on type and format
      switch (reportType) {
        case 'responsible': {
          const { data, lowPerformers } = await fetchResponsibleReportData(startDate, endDate)
          
          if (format === 'pdf') {
            blob = generateResponsibleReportPDF(data, lowPerformers, filters)
            filename = `reporte-responsables-${timestamp}.pdf`
          } else {
            blob = generateResponsibleReportExcel(data, lowPerformers, filters)
            filename = `reporte-responsables-${timestamp}.xlsx`
          }
          break
        }

        case 'space': {
          const { data } = await fetchSpaceReportData(startDate, endDate)
          
          if (format === 'pdf') {
            blob = generateSpaceReportPDF(data, filters)
            filename = `reporte-espacios-${timestamp}.pdf`
          } else {
            blob = generateSpaceReportExcel(data, filters)
            filename = `reporte-espacios-${timestamp}.xlsx`
          }
          break
        }

        case 'general': {
          const {
            globalMetrics,
            responsibleRanking,
            bestPerformingSpaces,
            worstPerformingSpaces,
            lowPerformers,
            evaluatorPerformance,
            approverPerformance,
            allSpaces,
            detailedResponses,
          } = await fetchGeneralReportData(startDate, endDate)
          
          if (format === 'pdf') {
            blob = generateGeneralReportPDF(
              globalMetrics,
              responsibleRanking,
              bestPerformingSpaces,
              worstPerformingSpaces,
              lowPerformers,
              filters
            )
            filename = `reporte-general-${timestamp}.pdf`
          } else {
            blob = generateGeneralReportExcel(
              globalMetrics,
              responsibleRanking,
              bestPerformingSpaces,
              worstPerformingSpaces,
              lowPerformers,
              filters,
              evaluatorPerformance,
              approverPerformance,
              allSpaces,
              detailedResponses
            )
            filename = `reporte-general-${timestamp}.xlsx`
          }
          break
        }

        default:
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Tipo de reporte no soportado',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
      }

      // Return the file as a response
      const arrayBuffer = await blob.arrayBuffer()
      const contentType = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': arrayBuffer.byteLength.toString(),
        },
      })
    })
  } catch (error: unknown) {
    console.error('[Export Report API] POST error:', error)

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
          code: 'EXPORT_FAILED',
          message: 'Error al exportar el reporte. Intente nuevamente.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
