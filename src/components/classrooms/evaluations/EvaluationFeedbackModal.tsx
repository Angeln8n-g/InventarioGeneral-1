'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  ClipboardCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Send,
  MessageSquare,
  User,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react'

export interface EvaluationFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  evaluationResultId: number
  token: string | null
  onSuccess?: () => void
}

interface EvaluationData {
  result: {
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
    approval_status: string
    approval_comments?: string
  }
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
  evaluator: {
    id: number
    name: string
  }
  responses: Array<{
    id: number
    response: 'yes' | 'no' | 'not_applicable'
    observation?: string
    question: {
      id: number
      text: string
      category: string
      is_required: boolean
    }
  }>
  feedback: {
    agrees_with_result: boolean
    feedback_comments?: string
    created_at: string
  } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento',
}

const RESPONSE_LABELS: Record<string, { label: string; color: string }> = {
  yes: { label: 'Sí', color: 'text-green-600 dark:text-green-400' },
  no: { label: 'No', color: 'text-red-600 dark:text-red-400' },
  not_applicable: { label: 'N/A', color: 'text-gray-500 dark:text-gray-400' },
}

export function EvaluationFeedbackModal({
  isOpen,
  onClose,
  evaluationResultId,
  token,
  onSuccess
}: EvaluationFeedbackModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EvaluationData | null>(null)
  const [agreesWithResult, setAgreesWithResult] = useState<boolean | null>(null)
  const [feedbackComments, setFeedbackComments] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    organization: false,
    cleanliness: false,
    maintenance: false,
  })

  // Fetch evaluation data
  const fetchData = useCallback(async () => {
    if (!token || !evaluationResultId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/evaluations/${evaluationResultId}/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'Error al cargar la evaluación')
      }

      const { data: evalData } = await res.json()
      setData(evalData)

      // Pre-fill feedback if exists
      if (evalData.feedback) {
        setAgreesWithResult(evalData.feedback.agrees_with_result)
        setFeedbackComments(evalData.feedback.feedback_comments || '')
      }
    } catch (err) {
      console.error('Error fetching evaluation:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar la evaluación')
    } finally {
      setIsLoading(false)
    }
  }, [token, evaluationResultId])

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  // Submit feedback
  const handleSubmit = async () => {
    if (agreesWithResult === null) {
      setError('Por favor indica si estás de acuerdo con el resultado')
      return
    }

    if (!token) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/evaluations/${evaluationResultId}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agrees_with_result: agreesWithResult,
          feedback_comments: feedbackComments.trim() || undefined
        })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'Error al enviar la retroalimentación')
      }

      setShowSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError(err instanceof Error ? err.message : 'Error al enviar la retroalimentación')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get classification
  const getClassification = (percentage: number) => {
    if (percentage < 70) return { label: 'Requiere Atención', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
    if (percentage < 90) return { label: 'Aceptable', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
    return { label: 'Excelente', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' }
  }

  // Group responses by category
  const responsesByCategory = data?.responses.reduce((acc, r) => {
    const cat = r.question.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {} as Record<string, typeof data.responses>) || {}

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-claro-red/10 rounded-lg">
                <ClipboardCheck className="w-5 h-5 text-claro-red" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resultado de Evaluación
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-claro-red animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Cargando evaluación...</p>
              </div>
            ) : error && !data ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-2">Error al cargar</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : showSuccess ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Retroalimentación Enviada!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Gracias por tu respuesta. El evaluador será notificado.
                </p>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Classroom info */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {data.classroom.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {data.classroom.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      {data.template.name}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      Evaluador: {data.evaluator.name}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(data.result.completed_at)}
                    </div>
                  </div>
                </div>

                {/* Score summary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Puntuación</h4>
                  
                  {/* Total score */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Puntuación Total</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getClassification(data.result.score_percentage).color}`}>
                        {data.result.score_percentage.toFixed(1)}%
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassification(data.result.score_percentage).bg} ${getClassification(data.result.score_percentage).color}`}>
                        {getClassification(data.result.score_percentage).label}
                      </span>
                    </div>
                  </div>

                  {/* Category scores */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Organización</span>
                      <span className="font-medium">
                        {data.result.organization_score}/{data.result.organization_max}
                        {data.result.organization_max > 0 && (
                          <span className="text-gray-500 ml-1">
                            ({((data.result.organization_score / data.result.organization_max) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Limpieza</span>
                      <span className="font-medium">
                        {data.result.cleanliness_score}/{data.result.cleanliness_max}
                        {data.result.cleanliness_max > 0 && (
                          <span className="text-gray-500 ml-1">
                            ({((data.result.cleanliness_score / data.result.cleanliness_max) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Mantenimiento</span>
                      <span className="font-medium">
                        {data.result.maintenance_score}/{data.result.maintenance_max}
                        {data.result.maintenance_max > 0 && (
                          <span className="text-gray-500 ml-1">
                            ({((data.result.maintenance_score / data.result.maintenance_max) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Responses by category */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Detalle de Respuestas</h4>
                  
                  {Object.entries(responsesByCategory).map(([category, responses]) => (
                    <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {CATEGORY_LABELS[category] || category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {responses.length} preguntas
                        </span>
                      </button>
                      
                      {expandedCategories[category] && (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {responses.map((r, idx) => (
                            <div key={r.id} className="p-3 bg-white dark:bg-gray-900">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                  {idx + 1}. {r.question.text}
                                </p>
                                <span className={`text-sm font-medium ${RESPONSE_LABELS[r.response]?.color || ''}`}>
                                  {RESPONSE_LABELS[r.response]?.label || r.response}
                                </span>
                              </div>
                              {r.observation && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <span className="font-medium">Observación:</span> {r.observation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Feedback section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-claro-red" />
                    Tu Retroalimentación
                  </h4>

                  {data.feedback && !isSubmitting ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {data.feedback.agrees_with_result ? (
                          <ThumbsUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ThumbsDown className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {data.feedback.agrees_with_result ? 'De acuerdo' : 'En desacuerdo'}
                        </span>
                      </div>
                      {data.feedback.feedback_comments && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {data.feedback.feedback_comments}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Enviado: {formatDate(data.feedback.created_at)}
                      </p>
                    </div>
                  ) : null}

                  {/* Feedback form */}
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ¿Estás de acuerdo con el resultado de la evaluación?
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setAgreesWithResult(true)}
                          disabled={isSubmitting}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                            agreesWithResult === true
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                          }`}
                        >
                          <ThumbsUp className="w-5 h-5" />
                          De acuerdo
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgreesWithResult(false)}
                          disabled={isSubmitting}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                            agreesWithResult === false
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                          }`}
                        >
                          <ThumbsDown className="w-5 h-5" />
                          En desacuerdo
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comentarios (opcional)
                      </label>
                      <textarea
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Escribe tus comentarios o sugerencias..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-claro-red focus:border-transparent disabled:opacity-50 resize-none"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {data && !showSuccess && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cerrar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || agreesWithResult === null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-claro-red rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {data.feedback ? 'Actualizar Respuesta' : 'Enviar Respuesta'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EvaluationFeedbackModal
