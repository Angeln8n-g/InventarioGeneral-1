'use client'

import React, { memo } from 'react'
import { ScannedItem } from '@/utils/scannerStorage'
import { Button } from '@/components/ui/Button'

interface BatchConfirmationProps {
  items: ScannedItem[]
  action: 'loan' | 'return' | 'consume'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
  progress?: { total: number; completed: number; failed: number }
}

const BatchConfirmationComponent: React.FC<BatchConfirmationProps> = ({
  items,
  action,
  onConfirm,
  onCancel,
  isProcessing,
  progress,
}) => {
  const actionText = {
    loan: 'Borrow',
    return: 'Return',
    consume: 'Consume',
  }

  const actionTextPlural = {
    loan: 'loans',
    return: 'returns',
    consume: 'consumptions',
  }

  const progressPercentage = progress
    ? Math.round(((progress.completed + progress.failed) / progress.total) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-scale-in">
        {!isProcessing ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-claro-red flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
                  Confirm {actionText[action]}
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="mb-6 max-h-60 overflow-y-auto space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-background-light dark:bg-background-dark rounded"
                >
                  <span className="text-xs font-bold text-claro-red">
                    {index + 1}.
                  </span>
                  <span className="text-sm text-text-light dark:text-text-dark flex-1 truncate">
                    {item.item_type.name}
                  </span>
                  {action === 'consume' && item.quantity && (
                    <span className="claro-badge-active">
                      {item.quantity}x
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
                className="flex-1"
              >
                Confirm {actionText[action]}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-claro-red flex items-center justify-center animate-pulse shadow-lg">
                <svg
                  className="w-8 h-8 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">
                Processing {actionTextPlural[action]}...
              </h3>
              {progress && (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {progress.completed + progress.failed} of {progress.total} items
                </p>
              )}
            </div>

            {progress && (
              <div className="mb-4">
                <div className="w-full bg-background-light dark:bg-background-dark rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-claro-red transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  <span>Progress: {progressPercentage}%</span>
                  {progress.failed > 0 && (
                    <span className="text-claro-red">
                      {progress.failed} failed
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

BatchConfirmationComponent.displayName = 'BatchConfirmation'

export const BatchConfirmation = memo(BatchConfirmationComponent)
