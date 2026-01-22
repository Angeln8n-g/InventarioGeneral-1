'use client'

import React from 'react'
import { X, ClipboardCheck } from 'lucide-react'
import { QuestionnaireForm } from './QuestionnaireForm'

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
  if (!isOpen || !evaluationId) return null

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExecuteEvaluationModal
