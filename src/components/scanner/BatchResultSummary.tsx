'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

interface BatchResultSummaryProps {
  isOpen: boolean
  action: 'loan' | 'return' | 'consume'
  successCount: number
  failedCount: number
  errors?: Array<{ itemId: string | number; error: string }>
  onClose: () => void
  onRetry?: () => void
}

export const BatchResultSummary: React.FC<BatchResultSummaryProps> = ({
  isOpen,
  action,
  successCount,
  failedCount,
  errors = [],
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null

  const actionText = {
    loan: 'borrowed',
    return: 'returned',
    consume: 'consumed',
  }

  const isFullSuccess = failedCount === 0
  const isPartialSuccess = successCount > 0 && failedCount > 0
  const isFullFailure = successCount === 0 && failedCount > 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isFullSuccess ? 'bg-green-100 dark:bg-green-900/30' :
            isPartialSuccess ? 'bg-yellow-100 dark:bg-yellow-900/30' :
            'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isFullSuccess ? (
              <svg className="w-8 h-8 text-claro-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isPartialSuccess ? (
              <svg className="w-8 h-8 text-claro-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-claro-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-text-light dark:text-claro-red mb-2">
            {isFullSuccess ? 'Success!' :
             isPartialSuccess ? 'Partially Completed' :
             'Failed'}
          </h3>
          
          <p className="text-sm text-text-muted dark:text-gray-400">
            {isFullSuccess && `Successfully ${actionText[action]} ${successCount} item${successCount !== 1 ? 's' : ''}`}
            {isPartialSuccess && `${successCount} succeeded, ${failedCount} failed`}
            {isFullFailure && `Failed to process ${failedCount} item${failedCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Success Summary */}
        {successCount > 0 && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {successCount} item{successCount !== 1 ? 's' : ''} processed successfully
              </span>
            </div>
          </div>
        )}

        {/* Error List */}
        {failedCount > 0 && errors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-text-light dark:text-gray-300 mb-2">
              Failed Items:
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {errors.map((error, index) => (
                <div 
                  key={index}
                  className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs"
                >
                  <p className="font-medium text-claro-red">
                    Item ID: {error.itemId}
                  </p>
                  <p className="text-red-600 dark:text-red-400 mt-1">
                    {error.error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onRetry && failedCount > 0 && (
            <Button 
              variant="secondary" 
              onClick={onRetry} 
              className="flex-1"
            >
              Retry Failed
            </Button>
          )}
          <Button 
            variant="primary" 
            onClick={onClose} 
            className="flex-1"
          >
            {isFullSuccess ? 'Done' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  )
}
