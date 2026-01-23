'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  Eye,
  MessageSquare,
  Building2,
  User,
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { ScoreDisplay } from './ScoreDisplay'
import type { ApprovalStatus, QuestionCategory } from '@/types/evaluations'

/**
 * Evaluation pending approval data
 */
interface PendingEvaluation {
  id: number
  scheduled_evaluation_id: number
  evaluator_id: number
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
  approval_status: ApprovalStatus
  evaluator: {
    id: number
    username: string
    full_name?: string
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
}

/**
 * Response with question details
 */
interface ResponseWithQuestion {
  id: number
  response: 'yes' | 'no' | 'not_applicable'
  observation?: string
  question: {
    id: number
    question_text: string
    category: QuestionCategory
    is_required: boolean
  }
}

/**
 * Props for the PendingApprovals component
 */
export interface PendingApprovalsProps {
  /** JWT token for API authentication */
  token: string | null
  /** Whether to show only evaluations where current user is the approver */
  myApprovalsOnly?: boolean
  /** Callback when an approval action is completed */
  onApprovalComplete?: () => void
}

// Category labels in Spanish
const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

// Response labels in Spanish
const RESPONSE_LABELS: Record<string, string> = {
  yes: 'Sí',
  no: 'No',
  not_applicable: 'No aplica'
}

/**
 * PendingApprovals Component
 * 
 * Displays a list of evaluations pending approval and allows
 * administrators to approve or reject them.
 */
export function PendingApprovals({
  token,
  myApprovalsOnly = false,
  onApprovalComplete
}: PendingApprovalsProps) {
  const [evaluations, setEvaluations] = useState<PendingEvaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Detail modal state
  const [selectedEvaluation, setSelectedEvaluation] = useState<PendingEvaluation | null>(null)
  const [evaluationResponses, setEvaluationResponses] = useState<ResponseWithQuestion[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  
  // Approval modal state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [approvalDecision, setApprovalDecision] = useState<'approved' | 'rejected' | null>(null)
  const [approvalComments, setApprovalComments] = useState('')
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false)
  
  // Approver assignment error state
  const [approverError, setApproverError] = useState<{ name: string; id: number } | null>(null)

  /**
   * Fetches pending evaluations from the API
   */
  const fetchPendingEvaluations = useCallback(async () => {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const url = myApprovalsOnly 
        ? '/api/admin/evaluations/pending-approval?my_approvals=true'
        : '/api/admin/evaluations/pending-approval'
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setEvaluations(data.data || [])
      } else {
        const data = await res.json()
        setError(data.error?.message || 'Error al cargar evaluaciones pendientes')
      }
    } catch (err) {
      console.error('Error fetching pending evaluations:', err)
      setError('Error al cargar evaluaciones pendientes')
    } finally {
      setIsLoading(false)
    }
  }, [token, myApprovalsOnly])

  useEffect(() => {
    fetchPendingEvaluations()
  }, [fetchPendingEvaluations])

  /**
   * Fetches evaluation details including responses
   */
  const fetchEvaluationDetails = async (evaluationId: number) => {
    if (!token) return
    
    setIsLoadingDetails(true)
    
    try {
      const res = await fetch(`/api/admin/evaluations/${evaluationId}/approve`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setEvaluationResponses(data.data?.responses || [])
      } else {
        console.error('Error fetching evaluation details')
      }
    } catch (err) {
      console.error('Error fetching evaluation details:', err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  /**
   * Opens the detail view for an evaluation
   */
  const handleViewDetails = (evaluation: PendingEvaluation) => {
    setSelectedEvaluation(evaluation)
    fetchEvaluationDetails(evaluation.id)
  }

  /**
   * Opens the approval modal
   */
  const handleOpenApprovalModal = (decision: 'approved' | 'rejected') => {
    setApprovalDecision(decision)
    setApprovalComments('')
    setIsApprovalModalOpen(true)
  }

  /**
   * Submits the approval decision
   */
  const handleSubmitApproval = async () => {
    if (!token || !selectedEvaluation || !approvalDecision) return
    
    setIsSubmittingApproval(true)
    
    try {
      const res = await fetch(`/api/admin/evaluations/${selectedEvaluation.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: approvalDecision,
          comments: approvalComments || undefined
        })
      })
      
      if (res.ok) {
        // Close modals and refresh list
        setIsApprovalModalOpen(false)
        setSelectedEvaluation(null)
        fetchPendingEvaluations()
        onApprovalComplete?.()
      } else {
        const data = await res.json()
        
        // Check if this is an approver assignment error
        if (res.status === 403 && data.error?.code === 'APPROVAL_ASSIGNED_TO_OTHER') {
          setIsApprovalModalOpen(false)
          setApproverError(data.error.assigned_to)
        } else {
          setError(data.error?.message || 'Error al procesar la aprobación')
        }
      }
    } catch (err) {
      console.error('Error submitting approval:', err)
      setError('Error al procesar la aprobación')
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  /**
   * Closes the detail view
   */
  const handleCloseDetails = () => {
    setSelectedEvaluation(null)
    setEvaluationResponses([])
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-claro-red animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Cargando evaluaciones pendientes...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-700 dark:text-gray-300 mb-2">Error</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchPendingEvaluations}
          className="px-4 py-2 text-sm font-medium text-white bg-claro-red rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Empty state
  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No hay evaluaciones pendientes
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          {myApprovalsOnly 
            ? 'No tienes evaluaciones asignadas para aprobar en este momento.'
            : 'Todas las evaluaciones han sido revisadas.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Evaluaciones Pendientes de Aprobación ({evaluations.length})
        </h3>
      </div>

      {/* Evaluations list */}
      <div className="grid gap-4">
        {evaluations.map((evaluation) => (
          <div
            key={evaluation.id}
            className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Evaluation info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {evaluation.scheduled_evaluation.classroom.name}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    - {evaluation.scheduled_evaluation.classroom.location}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Evaluador: {evaluation.evaluator.full_name || evaluation.evaluator.username}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(evaluation.completed_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(evaluation.completed_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="flex items-center gap-4">
                <ScoreDisplay
                  totalScore={evaluation.total_score}
                  maxScore={evaluation.max_possible_score}
                  size="md"
                />
                
                {/* Actions */}
                <button
                  onClick={() => handleViewDetails(evaluation)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Eye className="w-4 h-4" />
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedEvaluation && (
        <Dialog
          isOpen={!!selectedEvaluation}
          onClose={handleCloseDetails}
          title="Revisar Evaluación"
          size="lg"
        >
          <div className="space-y-6">
            {/* Evaluation header */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {selectedEvaluation.scheduled_evaluation.classroom.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedEvaluation.scheduled_evaluation.classroom.location}
              </p>
              {selectedEvaluation.scheduled_evaluation.classroom.responsible_person && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Responsable: {selectedEvaluation.scheduled_evaluation.classroom.responsible_person}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span>Evaluador: {selectedEvaluation.evaluator.full_name || selectedEvaluation.evaluator.username}</span>
                <span>•</span>
                <span>
                  {new Date(selectedEvaluation.completed_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <ScoreDisplay 
                  totalScore={selectedEvaluation.total_score}
                  maxScore={selectedEvaluation.max_possible_score}
                  size="lg" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {selectedEvaluation.organization_max > 0 
                    ? Math.round((selectedEvaluation.organization_score / selectedEvaluation.organization_max) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Organización</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {selectedEvaluation.cleanliness_max > 0 
                    ? Math.round((selectedEvaluation.cleanliness_score / selectedEvaluation.cleanliness_max) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Limpieza</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {selectedEvaluation.maintenance_max > 0 
                    ? Math.round((selectedEvaluation.maintenance_score / selectedEvaluation.maintenance_max) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mantenimiento</p>
              </div>
            </div>

            {/* Responses */}
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Respuestas</h5>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-claro-red animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {evaluationResponses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-3 rounded-lg border ${
                        response.response === 'yes'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : response.response === 'no'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {response.question.question_text}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {CATEGORY_LABELS[response.question.category]}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${
                          response.response === 'yes'
                            ? 'text-green-600 dark:text-green-400'
                            : response.response === 'no'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {RESPONSE_LABELS[response.response]}
                        </span>
                      </div>
                      {response.observation && (
                        <div className="mt-2 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <p>{response.observation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleOpenApprovalModal('rejected')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </button>
              <button
                onClick={() => handleOpenApprovalModal('approved')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Approval confirmation modal */}
      <Dialog
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title={approvalDecision === 'approved' ? 'Aprobar Evaluación' : 'Rechazar Evaluación'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {approvalDecision === 'approved'
              ? '¿Está seguro de que desea aprobar esta evaluación?'
              : '¿Está seguro de que desea rechazar esta evaluación?'}
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comentarios {approvalDecision === 'rejected' ? '(recomendado)' : '(opcional)'}
            </label>
            <textarea
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={approvalDecision === 'rejected' 
                ? 'Explique el motivo del rechazo...'
                : 'Agregue comentarios adicionales...'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-claro-red focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsApprovalModalOpen(false)}
              disabled={isSubmittingApproval}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitApproval}
              disabled={isSubmittingApproval}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                approvalDecision === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmittingApproval ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : approvalDecision === 'approved' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Aprobación
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Confirmar Rechazo
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Approver assignment error modal */}
      <Dialog
        isOpen={!!approverError}
        onClose={() => {
          setApproverError(null)
          setSelectedEvaluation(null)
        }}
        title="Aprobación Asignada"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Esta evaluación está asignada para aprobación a otro administrador. Solo el aprobador asignado puede aprobar o rechazar esta evaluación.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 w-full">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Aprobador asignado:
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {approverError?.name}
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setApproverError(null)
                setSelectedEvaluation(null)
              }}
              className="px-6 py-2 text-sm font-medium text-white bg-claro-red rounded-lg hover:bg-red-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default PendingApprovals
