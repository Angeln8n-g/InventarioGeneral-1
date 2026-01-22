'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import {
  FileText,
  Calendar,
  User,
  Building2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  MinusCircle
} from 'lucide-react'
import { ScoreDisplay } from './ScoreDisplay'
import type {
  QuestionCategory,
  ResponseType,
  CategoryScores
} from '@/types/evaluations'

/**
 * Evaluation detail data from the API
 */
interface EvaluationDetailData {
  id: number
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
  evaluator: {
    id: number
    username: string
  }
  scheduled_evaluation: {
    id: number
    scheduled_date: string
    classroom: {
      id: number
      name: string
      location: string
      responsible_person?: string
    }
    template: {
      id: number
      name: string
      space_type: string
    }
  }
  responses: Array<{
    id: number
    question_id: number
    response: ResponseType
    observation?: string
    question: {
      id: number
      question_text: string
      category: QuestionCategory
      is_required: boolean
      display_order: number
    }
  }>
}

/**
 * Props for the EvaluationDetailModal component
 */
export interface EvaluationDetailModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** JWT token for API authentication */
  token: string | null
  /** ID of the evaluation result to display */
  evaluationId: number | null
}

// Category labels in Spanish
const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<QuestionCategory, string> = {
  organization: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  cleanliness: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  maintenance: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
}

// Response type configuration
const RESPONSE_CONFIG: Record<ResponseType, { label: string; icon: React.ElementType; className: string }> = {
  yes: {
    label: 'Sí',
    icon: CheckCircle,
    className: 'text-green-600 dark:text-green-400'
  },
  no: {
    label: 'No',
    icon: XCircle,
    className: 'text-red-600 dark:text-red-400'
  },
  not_applicable: {
    label: 'No aplica',
    icon: MinusCircle,
    className: 'text-gray-500 dark:text-gray-400'
  }
}

/**
 * Formats a date string to a localized format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * EvaluationDetailModal Component
 * 
 * Modal that displays the complete detail of an evaluation including:
 * - Evaluation header (classroom name, date, evaluator)
 * - Overall score with ScoreDisplay component
 * - Category breakdown
 * - List of all questions with their responses
 * - Observations for "No" responses
 * 
 * Validates: Requirements 5.3 - Show complete detail with all responses and observations
 */
export function EvaluationDetailModal({
  isOpen,
  onClose,
  token,
  evaluationId
}: EvaluationDetailModalProps) {
  // Data state
  const [evaluation, setEvaluation] = useState<EvaluationDetailData | null>(null)
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches evaluation detail from the API
   */
  const fetchEvaluationDetail = useCallback(async () => {
    if (!token || !evaluationId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/evaluations/${evaluationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Error al cargar el detalle de la evaluación')
      }

      const data = await res.json()
      setEvaluation(data.data)
    } catch (err) {
      console.error('Error fetching evaluation detail:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el detalle de la evaluación')
    } finally {
      setIsLoading(false)
    }
  }, [token, evaluationId])

  // Fetch evaluation detail when modal opens
  useEffect(() => {
    if (isOpen && evaluationId) {
      fetchEvaluationDetail()
    } else {
      // Reset state when modal closes
      setEvaluation(null)
      setError(null)
    }
  }, [isOpen, evaluationId, fetchEvaluationDetail])

  /**
   * Groups responses by category for organized display
   */
  const getResponsesByCategory = (): Record<QuestionCategory, EvaluationDetailData['responses']> => {
    if (!evaluation) {
      return {
        organization: [],
        cleanliness: [],
        maintenance: []
      }
    }

    const grouped: Record<QuestionCategory, EvaluationDetailData['responses']> = {
      organization: [],
      cleanliness: [],
      maintenance: []
    }

    // Sort responses by display_order and group by category
    const sortedResponses = [...evaluation.responses].sort(
      (a, b) => a.question.display_order - b.question.display_order
    )

    for (const response of sortedResponses) {
      grouped[response.question.category].push(response)
    }

    return grouped
  }

  /**
   * Builds category scores for ScoreDisplay component
   */
  const getCategoryScores = (): CategoryScores | undefined => {
    if (!evaluation) return undefined

    return {
      organization: {
        score: evaluation.organization_score,
        max: evaluation.organization_max
      },
      cleanliness: {
        score: evaluation.cleanliness_score,
        max: evaluation.cleanliness_max
      },
      maintenance: {
        score: evaluation.maintenance_score,
        max: evaluation.maintenance_max
      }
    }
  }

  /**
   * Renders the loading state
   */
  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando detalle...</span>
    </div>
  )

  /**
   * Renders the error state
   */
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-red-600 dark:text-red-400 mb-4 text-center">{error}</p>
      <button
        onClick={fetchEvaluationDetail}
        className="flex items-center gap-2 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  )

  /**
   * Renders the evaluation header with classroom info, date, and evaluator
   */
  const renderHeader = () => {
    if (!evaluation) return null

    const { scheduled_evaluation, evaluator, completed_at, is_draft } = evaluation
    const { classroom, template } = scheduled_evaluation

    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Classroom info */}
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {classroom.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {classroom.location}
              </p>
              {classroom.responsible_person && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Responsable: {classroom.responsible_person}
                </p>
              )}
            </div>
          </div>

          {/* Date and evaluator */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formatDate(completed_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {evaluator.username}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {template.name}
              </span>
            </div>
          </div>
        </div>

        {/* Draft indicator */}
        {is_draft && (
          <div className="mt-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Esta evaluación está guardada como borrador y no ha sido completada.
            </p>
          </div>
        )}
      </div>
    )
  }

  /**
   * Renders the overall score section with category breakdown
   */
  const renderScoreSection = () => {
    if (!evaluation) return null

    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Puntuación General
        </h3>
        <ScoreDisplay
          totalScore={evaluation.total_score}
          maxScore={evaluation.max_possible_score}
          categoryScores={getCategoryScores()}
          showCategories
          size="lg"
        />
      </div>
    )
  }

  /**
   * Renders a single response item
   */
  const renderResponseItem = (
    response: EvaluationDetailData['responses'][0],
    index: number
  ) => {
    const { question, response: responseValue, observation } = response
    const responseConfig = RESPONSE_CONFIG[responseValue]
    const ResponseIcon = responseConfig.icon

    return (
      <div
        key={response.id}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start gap-3">
          {/* Question number */}
          <span className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
            {index + 1}
          </span>

          {/* Question and response */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
              {question.question_text}
              {question.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </p>

            {/* Response indicator */}
            <div className="flex items-center gap-2">
              <ResponseIcon className={`w-4 h-4 ${responseConfig.className}`} />
              <span className={`text-sm font-medium ${responseConfig.className}`}>
                {responseConfig.label}
              </span>
            </div>

            {/* Observation for "No" responses */}
            {responseValue === 'no' && observation && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <MessageSquare className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                    Observación:
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {observation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /**
   * Renders the responses list grouped by category
   */
  const renderResponsesList = () => {
    if (!evaluation) return null

    const responsesByCategory = getResponsesByCategory()
    const categories: QuestionCategory[] = ['organization', 'cleanliness', 'maintenance']

    return (
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Respuestas del Cuestionario
        </h3>

        {categories.map(category => {
          const categoryResponses = responsesByCategory[category]
          if (categoryResponses.length === 0) return null

          return (
            <div key={category}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${CATEGORY_COLORS[category]}`}>
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({categoryResponses.length} preguntas)
                </span>
              </div>

              {/* Category responses */}
              <div className="space-y-3">
                {categoryResponses.map((response, index) =>
                  renderResponseItem(response, index)
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /**
   * Renders the main content
   */
  const renderContent = () => {
    if (isLoading) return renderLoading()
    if (error) return renderError()
    if (!evaluation) return null

    return (
      <div>
        {renderHeader()}
        {renderScoreSection()}
        {renderResponsesList()}
      </div>
    )
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Evaluación"
      size="lg"
    >
      {renderContent()}
    </Dialog>
  )
}

export default EvaluationDetailModal
