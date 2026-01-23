'use client'

/* ExecuteEvaluationModal - Modal para ejecutar evaluaciones programadas */
import React, { useState } from 'react'
import { X, ClipboardCheck, AlertTriangle, UserCheck } from 'lucide-react'
import { QuestionnaireForm, AssignmentError } from './QuestionnaireForm'

/**
 * Props for the ExecuteEvaluationModal component
 */
export interface ExecuteEvaluationModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** JWT token for API authentication */
  token: string | null
  /** ID of the scheduled evaluation to execute */
  evaluationId: number | null
  /** Callback when evaluation is successfully submitted */
  onSuccess?: () => void
}

/**
 * ExecuteEvaluationModal Component
 * 
 * Modal wrapper for the QuestionnaireForm component.
 * Allows users to execute a scheduled evaluation by filling out the questionnaire.
 * 
 * Features:
 * - Full-screen modal on mobile, centered modal on desktop
 * - Contains QuestionnaireForm for answering questions
 * - Handles success callback to refresh calendar
 * - Shows assignment error popup when evaluation is assigned to another user
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.8
 */
export function ExecuteEvaluationModal({
  isOpen,
  onClose,
  token,
  evaluationId,
  onSuccess
}: ExecuteEvaluationModalProps) {
  const [assignmentError, setAssignmentError] = useState<AssignmentError | null>(null)

  if (!isOpen || !evaluationId) return null

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleAssignmentError = (error: AssignmentError) => {
    setAssignmentError(error)
  }

  const handleCloseAssignmentError = () => {
    setAssignmentError(null)
    onClose()
  }

  // Show assignment error popup
  if (assignmentError) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleCloseAssignmentError}
          aria-hidden="true"
        />

        {/* Modal container */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl transform transition-all"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-error-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 
                  id="assignment-error-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Evaluación Asignada
                </h2>
              </div>
              <button
                onClick={handleCloseAssignmentError}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                  <UserCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {assignmentError.message}
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 w-full">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Evaluador asignado:
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {assignmentError.assignedTo.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCloseAssignmentError}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-claro-red rounded-lg hover:bg-red-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="execute-evaluation-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-claro-red/10 rounded-lg">
                <ClipboardCheck className="w-5 h-5 text-claro-red" />
              </div>
              <h2 
                id="execute-evaluation-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Ejecutar Evaluación
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

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <QuestionnaireForm
              evaluationId={evaluationId}
              token={token}
              onSuccess={handleSuccess}
              onCancel={onClose}
              onAssignmentError={handleAssignmentError}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExecuteEvaluationModal
