'use client'

import React, { useState } from 'react'
import { X, Calendar, FileText, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LoanConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (dueDate: string, notes?: string) => void
  toolCount: number
  hasActiveLoan: boolean
  isLoading?: boolean
}

export function LoanConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  toolCount,
  hasActiveLoan,
  isLoading = false,
}: LoanConfirmationModalProps) {
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // Get maximum date (30 days from now)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const handleConfirm = () => {
    if (!dueDate) {
      alert('Por favor selecciona una fecha de devolución')
      return
    }

    onConfirm(dueDate, notes || undefined)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
              Confirmar Préstamo
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Tool Count */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Herramientas a prestar:</span>{' '}
                <span className="font-bold">{toolCount}</span>
              </p>
            </div>

            {/* Active Loan Warning */}
            {hasActiveLoan && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start space-x-2">
                <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900 dark:text-yellow-100">
                  <p className="font-semibold mb-1">Tienes un préstamo activo</p>
                  <p className="text-xs">
                    Las herramientas se agregarán a tu préstamo existente
                  </p>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-text-light dark:text-text-dark mb-2">
                <Calendar className="w-4 h-4" />
                <span>Fecha de devolución *</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={minDate}
                max={maxDateStr}
                className="w-full px-4 py-2 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-gray-600 rounded-lg text-text-light dark:text-text-dark focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Máximo 07 días desde hoy
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-text-light dark:text-text-dark mb-2">
                <FileText className="w-4 h-4" />
                <span>Notas (opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Para proyecto de instalación en edificio X"
                rows={3}
                className="w-full px-4 py-2 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-gray-600 rounded-lg text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {notes.length}/500 caracteres
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={handleConfirm}
              disabled={!dueDate || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Confirmar Préstamo</span>
                </>
              )}
            </button>

            <Button variant="secondary" onClick={onClose} className="w-full" disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
