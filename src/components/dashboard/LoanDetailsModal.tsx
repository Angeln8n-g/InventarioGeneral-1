import React, { useState, useEffect } from 'react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'
import { Button } from '@/components/ui/Button'

interface LoanDetails {
  id: number
  tool_instance: {
    id: number
    item_type: {
      name: string
      description?: string
      category?: string
    }
    serial_number?: string
    qr_code: string
  }
  user: {
    full_name: string
    username: string
  }
  status: string
  created_at: string
  due_date: string
  returned_at?: string
  notes?: string
}

interface LoanDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  loanId: number | null
  loans: LoanDetails[]
  onNavigate?: (id: number) => void
  onReturn?: (loanId: number) => void
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  isOpen,
  onClose,
  loanId,
  loans,
  onNavigate,
  onReturn,
}) => {
  const loan = loans.find(l => l.id === loanId) || null
  const currentIndex = loans.findIndex(l => l.id === loanId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < loans.length - 1

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowLeft' && hasPrevious && onNavigate) {
        onNavigate(loans[currentIndex - 1].id)
      } else if (e.key === 'ArrowRight' && hasNext && onNavigate) {
        onNavigate(loans[currentIndex + 1].id)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasPrevious, hasNext, currentIndex, loans, onNavigate])

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-claro-red' }
    if (daysRemaining <= 2) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-claro-warning' }
    return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-claro-green' }
  }

  if (!loan) return null

  const daysRemaining = getDaysRemaining(loan.due_date)
  const statusColor = getStatusColor(daysRemaining)

  return (
    <TransitionDialog 
      open={isOpen} 
      onClose={onClose} 
      animationType="fade" 
      speed="fast"
      title={loan.tool_instance.item_type.name}
      className="!max-w-2xl"
    >
      {loan ? (
        <div className="space-y-6">
          {/* Navigation arrows */}
          {(hasPrevious || hasNext) && (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => hasPrevious && onNavigate && onNavigate(loans[currentIndex - 1].id)}
                disabled={!hasPrevious}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Previous loan (←)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {currentIndex + 1} of {loans.length}
              </span>
              <button
                onClick={() => hasNext && onNavigate && onNavigate(loans[currentIndex + 1].id)}
                disabled={!hasNext}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Next loan (→)"
              >
                <span>Next</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Loan Status</h3>

                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${statusColor.bg}`}>
                    <p className={`text-sm font-medium ${statusColor.text}`}>
                      {daysRemaining < 0
                        ? `⚠️ Overdue by ${Math.abs(daysRemaining)} days`
                        : daysRemaining === 0
                          ? '⏰ Due today'
                          : `✓ ${daysRemaining} days remaining`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Loan Date
                      </label>
                      <p className="mt-1">{new Date(loan.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Due Date
                      </label>
                      <p className="mt-1">{new Date(loan.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Return Button */}
                {loan.status === 'active' && onReturn && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => onReturn(loan.id)}
                      className="w-full"
                      size="sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Return Tool
                    </Button>
                  </div>
                )}
              </div>

              {/* Tool Details */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Tool Details</h3>
                <div className="space-y-4">
                  {loan.tool_instance.item_type.description && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Description
                      </label>
                      <p className="mt-1">{loan.tool_instance.item_type.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {loan.tool_instance.item_type.category && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                          Category
                        </label>
                        <p className="mt-1">{loan.tool_instance.item_type.category}</p>
                      </div>
                    )}

                    {loan.tool_instance.serial_number && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                          Serial Number
                        </label>
                        <p className="mt-1 font-mono text-sm">{loan.tool_instance.serial_number}</p>
                      </div>
                    )}
                  </div>

                  {loan.notes && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Notes
                      </label>
                      <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm">{loan.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Tool Info</h3>

                <div className="space-y-4">
                  {/* Tool Icon */}
                  <div className="w-full aspect-square bg-claro-red/10 rounded-lg flex items-center justify-center">
                    <svg className="w-20 h-20 text-claro-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      QR Code
                    </label>
                    <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-mono break-all">{loan.tool_instance.qr_code}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-accent rounded-lg">
                    <p className="text-xs text-blue-accent">
                      💡 Scan this QR code to return the tool quickly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </TransitionDialog>
  )
}
