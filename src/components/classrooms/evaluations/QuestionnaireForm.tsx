'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Save,
  Send,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react'
import {
  calculateScore,
  classifyScore,
  getClassificationLabel,
  getClassificationColor,
  calculateCategoryPercentage
} from '@/utils/evaluation-scoring'
import type {
  ResponseType,
  QuestionCategory
} from '@/types/evaluations'

/**
 * Assignment error data when evaluation is assigned to another user
 */
export interface AssignmentError {
  assignedTo: {
    id: number
    name: string
  }
  message: string
}

/**
 * Props for the QuestionnaireForm component
 */
export interface QuestionnaireFormProps {
  /** ID of the scheduled evaluation */
  evaluationId: number
  /** JWT token for API authentication */
  token: string | null
  /** Callback when evaluation is successfully submitted */
  onSuccess?: () => void
  /** Callback when user cancels */
  onCancel?: () => void
  /** Callback when evaluation is assigned to another user */
  onAssignmentError?: (error: AssignmentError) => void
}

/**
 * Question data from the API
 */
interface QuestionData {
  id: number
  question_text: string
  category: QuestionCategory
  is_required: boolean
  display_order: number
  existing_response?: {
    response: ResponseType
    observation?: string
  }
}

/**
 * Questionnaire data from the API
 */
interface QuestionnaireData {
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
  questions: QuestionData[]
  draft?: {
    id: number
    is_draft: boolean
    total_score: number
    max_possible_score: number
    score_percentage: number
  }
}

/**
 * Response state for a single question
 */
interface ResponseState {
  response: ResponseType | null
  observation: string
}

// Category labels in Spanish
const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<QuestionCategory, { bg: string; text: string; border: string }> = {
  organization: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
  },
  cleanliness: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800'
  },
  maintenance: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800'
  }
}

// Score classification colors
const CLASSIFICATION_COLORS = {
  requires_attention: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    progress: 'bg-red-500'
  },
  acceptable: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    progress: 'bg-yellow-500'
  },
  excellent: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    progress: 'bg-green-500'
  }
}

/**
 * QuestionnaireForm Component
 * 
 * Form for executing an evaluation with questionnaire.
 * 
 * Features:
 * - Fetches questionnaire data from API on mount
 * - Displays questions grouped by category (organization, cleanliness, maintenance)
 * - Radio buttons for response options: Sí, No, No aplica
 * - Observation field visible when "No" is selected
 * - Progress bar showing percentage of questions answered
 * - Real-time score preview
 * - Save draft button
 * - Validation of required questions on submit
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.8
 */
export function QuestionnaireForm({
  evaluationId,
  token,
  onSuccess,
  onCancel,
  onAssignmentError
}: QuestionnaireFormProps) {
  // Data state
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null)
  const [responses, setResponses] = useState<Record<number, ResponseState>>({})
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<'draft' | 'submit' | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<QuestionCategory, boolean>>({
    organization: true,
    cleanliness: true,
    maintenance: true
  })
  const [validationErrors, setValidationErrors] = useState<number[]>([])

  /**
   * Fetches questionnaire data from the API
   * Validates: Requirement 3.1 - Show questionnaire with all template questions
   */
  const fetchQuestionnaire = useCallback(async () => {
    if (!token) {
      setError('No hay sesión activa')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/admin/evaluations/${evaluationId}/questionnaire`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        
        // Check if this is an assignment error (403 with specific code)
        if (res.status === 403 && data.error?.code === 'EVALUATION_ASSIGNED_TO_OTHER') {
          if (onAssignmentError) {
            onAssignmentError({
              assignedTo: data.error.assigned_to,
              message: data.error.message
            })
            return
          }
        }
        
        throw new Error(data.error?.message || 'Error al cargar el cuestionario')
      }

      const json = await res.json()
      const data: QuestionnaireData = json.data
      setQuestionnaireData(data)

      // Initialize responses from existing draft or empty
      const initialResponses: Record<number, ResponseState> = {}
      for (const question of data.questions) {
        if (question.existing_response) {
          initialResponses[question.id] = {
            response: question.existing_response.response,
            observation: question.existing_response.observation || ''
          }
        } else {
          initialResponses[question.id] = {
            response: null,
            observation: ''
          }
        }
      }
      setResponses(initialResponses)
    } catch (err) {
      console.error('Error fetching questionnaire:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el cuestionario')
    } finally {
      setIsLoading(false)
    }
  }, [evaluationId, token])

  // Fetch questionnaire on mount
  useEffect(() => {
    fetchQuestionnaire()
  }, [fetchQuestionnaire])

  /**
   * Updates a response for a question
   * Validates: Requirement 3.2 - Allow selecting Sí, No, or No aplica
   */
  const handleResponseChange = useCallback((questionId: number, response: ResponseType) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        response,
        // Clear observation if not "no"
        observation: response === 'no' ? prev[questionId]?.observation || '' : ''
      }
    }))
    // Clear validation error for this question
    setValidationErrors(prev => prev.filter(id => id !== questionId))
  }, [])

  /**
   * Updates the observation for a question
   * Validates: Requirement 3.3 - Observation field for "No" responses
   */
  const handleObservationChange = useCallback((questionId: number, observation: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        observation
      }
    }))
  }, [])

  /**
   * Toggles category expansion
   */
  const toggleCategory = useCallback((category: QuestionCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }, [])

  /**
   * Calculates progress percentage
   * Validates: Requirement 7.4 - Progress bar showing answered questions
   */
  const progress = useMemo(() => {
    if (!questionnaireData) return { answered: 0, total: 0, percentage: 0 }
    
    const total = questionnaireData.questions.length
    const answered = Object.values(responses).filter(r => r.response !== null).length
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0
    
    return { answered, total, percentage }
  }, [questionnaireData, responses])

  /**
   * Calculates real-time score preview
   * Validates: Requirement 3.5 - Calculate score automatically
   */
  const scorePreview = useMemo(() => {
    if (!questionnaireData) return null

    const responsesWithCategory = questionnaireData.questions
      .filter(q => responses[q.id]?.response !== null)
      .map(q => ({
        response: responses[q.id].response as ResponseType,
        category: q.category
      }))

    if (responsesWithCategory.length === 0) return null

    const result = calculateScore(responsesWithCategory)
    const classification = classifyScore(result.percentage)

    return {
      ...result,
      classification,
      label: getClassificationLabel(classification),
      color: getClassificationColor(classification)
    }
  }, [questionnaireData, responses])

  /**
   * Groups questions by category
   */
  const questionsByCategory = useMemo((): Record<QuestionCategory, QuestionData[]> => {
    if (!questionnaireData) {
      return {
        organization: [],
        cleanliness: [],
        maintenance: []
      }
    }

    return questionnaireData.questions.reduce((acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = []
      }
      acc[question.category].push(question)
      return acc
    }, {
      organization: [],
      cleanliness: [],
      maintenance: []
    } as Record<QuestionCategory, QuestionData[]>)
  }, [questionnaireData])

  /**
   * Validates required questions
   * Validates: Requirement 3.4 - Validate required questions before submit
   */
  const validateResponses = useCallback((): boolean => {
    if (!questionnaireData) return false

    const missingRequired = questionnaireData.questions
      .filter(q => q.is_required && responses[q.id]?.response === null)
      .map(q => q.id)

    setValidationErrors(missingRequired)
    return missingRequired.length === 0
  }, [questionnaireData, responses])

  /**
   * Prepares responses for API submission
   */
  const prepareResponsesForSubmit = useCallback(() => {
    if (!questionnaireData) return []

    return questionnaireData.questions
      .filter(q => responses[q.id]?.response !== null)
      .map(q => ({
        question_id: q.id,
        response: responses[q.id].response as ResponseType,
        observation: responses[q.id].response === 'no' ? responses[q.id].observation : undefined
      }))
  }, [questionnaireData, responses])

  /**
   * Saves responses as draft
   * Validates: Requirement 3.8 - Save partial progress as draft
   */
  const handleSaveDraft = async () => {
    if (!token) {
      setError('No hay sesión activa')
      return
    }

    setIsSavingDraft(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/evaluations/${evaluationId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: prepareResponsesForSubmit(),
          is_draft: true
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Error al guardar el borrador')
      }

      setSuccess('draft')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving draft:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar el borrador')
    } finally {
      setIsSavingDraft(false)
    }
  }

  /**
   * Submits the evaluation
   * Validates: Requirements 3.4, 3.5, 3.6, 3.7
   */
  const handleSubmit = async () => {
    if (!token) {
      setError('No hay sesión activa')
      return
    }

    // Validate required questions
    if (!validateResponses()) {
      setError('Por favor responda todas las preguntas obligatorias')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/evaluations/${evaluationId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: prepareResponsesForSubmit(),
          is_draft: false
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Error al enviar la evaluación')
      }

      setSuccess('submit')
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err) {
      console.error('Error submitting evaluation:', err)
      setError(err instanceof Error ? err.message : 'Error al enviar la evaluación')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-claro-red animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Cargando cuestionario...</p>
      </div>
    )
  }

  // Error state (no data)
  if (!questionnaireData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-700 dark:text-gray-300 mb-2">Error al cargar el cuestionario</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Volver
        </button>
      </div>
    )
  }

  // Success state (submitted)
  if (success === 'submit') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          ¡Evaluación Enviada!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          La evaluación ha sido registrada exitosamente
        </p>
        {scorePreview && (
          <div className={`mt-4 px-4 py-2 rounded-lg ${CLASSIFICATION_COLORS[scorePreview.classification].bg}`}>
            <p className={`text-lg font-bold ${CLASSIFICATION_COLORS[scorePreview.classification].text}`}>
              {scorePreview.percentage.toFixed(1)}% - {scorePreview.label}
            </p>
          </div>
        )}
      </div>
    )
  }

  const categories: QuestionCategory[] = ['organization', 'cleanliness', 'maintenance']

  return (
    <div className="space-y-6">
      {/* Header with evaluation info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {questionnaireData.evaluation.classroom_name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {questionnaireData.evaluation.classroom_location}
        </p>
        {questionnaireData.evaluation.responsible_person && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Responsable: {questionnaireData.evaluation.responsible_person}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Plantilla: {questionnaireData.template.name}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {progress.answered} de {progress.total} preguntas ({progress.percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-claro-red h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Real-time score preview */}
      {scorePreview && (
        <div className={`rounded-lg p-4 border ${CLASSIFICATION_COLORS[scorePreview.classification].border} ${CLASSIFICATION_COLORS[scorePreview.classification].bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Puntuación Actual
              </p>
              <p className={`text-2xl font-bold ${CLASSIFICATION_COLORS[scorePreview.classification].text}`}>
                {scorePreview.percentage.toFixed(1)}%
              </p>
              <p className={`text-sm ${CLASSIFICATION_COLORS[scorePreview.classification].text}`}>
                {scorePreview.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Por categoría:</p>
              {categories.map(cat => {
                const catScore = scorePreview.categoryScores[cat]
                if (catScore.max === 0) return null
                const catPercentage = calculateCategoryPercentage(catScore)
                return (
                  <p key={cat} className="text-xs text-gray-600 dark:text-gray-400">
                    {CATEGORY_LABELS[cat]}: {catPercentage.toFixed(0)}%
                  </p>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Draft saved success message */}
      {success === 'draft' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">Borrador guardado exitosamente</p>
        </div>
      )}

      {/* Questions grouped by category */}
      <div className="space-y-4">
        {categories.map(category => {
          const categoryQuestions = questionsByCategory[category] || []
          if (categoryQuestions.length === 0) return null

          const isExpanded = expandedCategories[category]
          const answeredInCategory = categoryQuestions.filter(q => responses[q.id]?.response !== null).length
          const colors = CATEGORY_COLORS[category]

          return (
            <div key={category} className={`rounded-lg border ${colors.border} overflow-hidden`}>
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center justify-between p-4 ${colors.bg} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${colors.text}`}>
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className={`text-sm ${colors.text} opacity-75`}>
                    ({answeredInCategory}/{categoryQuestions.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`w-5 h-5 ${colors.text}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                )}
              </button>

              {/* Questions list */}
              {isExpanded && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryQuestions.map((question, index) => (
                    <QuestionItem
                      key={question.id}
                      question={question}
                      index={index}
                      response={responses[question.id]}
                      hasError={validationErrors.includes(question.id)}
                      disabled={isSubmitting || isSavingDraft}
                      onResponseChange={handleResponseChange}
                      onObservationChange={handleObservationChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {questionnaireData.questions.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay preguntas en este cuestionario
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isSavingDraft}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting || isSavingDraft || progress.answered === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSavingDraft ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar borrador
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isSavingDraft}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-claro-red rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-claro-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar evaluación
            </>
          )}
        </button>
      </div>
    </div>
  )
}


/**
 * QuestionItem Component
 * 
 * Individual question with response options and observation field.
 * 
 * Features:
 * - Radio buttons for Sí, No, No aplica
 * - Observation field visible only when "No" is selected
 * - Visual indication for required questions
 * - Error state for validation
 * 
 * Validates: Requirements 3.2, 3.3
 */
interface QuestionItemProps {
  question: QuestionData
  index: number
  response: ResponseState
  hasError: boolean
  disabled: boolean
  onResponseChange: (questionId: number, response: ResponseType) => void
  onObservationChange: (questionId: number, observation: string) => void
}

function QuestionItem({
  question,
  index,
  response,
  hasError,
  disabled,
  onResponseChange,
  onObservationChange
}: QuestionItemProps) {
  const responseOptions: { value: ResponseType; label: string }[] = [
    { value: 'yes', label: 'Sí' },
    { value: 'no', label: 'No' },
    { value: 'not_applicable', label: 'No aplica' }
  ]

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 ${hasError ? 'ring-2 ring-red-500 ring-inset' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Question number */}
        <span className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
          {index + 1}
        </span>

        <div className="flex-1 space-y-3">
          {/* Question text */}
          <p className="text-sm text-gray-900 dark:text-white">
            {question.question_text}
            {question.is_required && (
              <span className="text-red-500 ml-1" title="Pregunta obligatoria">*</span>
            )}
          </p>

          {/* Response options */}
          <div className="flex flex-wrap gap-4">
            {responseOptions.map(option => (
              <label
                key={option.value}
                className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.value}
                  checked={response?.response === option.value}
                  onChange={() => onResponseChange(question.id, option.value)}
                  disabled={disabled}
                  className="w-4 h-4 text-claro-red border-gray-300 dark:border-gray-600 focus:ring-claro-red disabled:opacity-50"
                />
                <span className={`text-sm ${
                  response?.response === option.value
                    ? 'text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          {/* Observation field - visible only when "No" is selected */}
          {response?.response === 'no' && (
            <div className="mt-3 pl-0 sm:pl-6">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <MessageSquare className="w-4 h-4" />
                Observación (opcional)
              </label>
              <textarea
                value={response.observation}
                onChange={(e) => onObservationChange(question.id, e.target.value)}
                disabled={disabled}
                placeholder="Agregue una observación o evidencia..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-claro-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>
          )}

          {/* Validation error */}
          {hasError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Esta pregunta es obligatoria
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireForm
