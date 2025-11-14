'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

interface ActionButton {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

interface StatusMessage {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface ModalFooterProps {
  primaryAction?: ActionButton
  secondaryAction?: ActionButton
  statusMessage?: StatusMessage
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  primaryAction,
  secondaryAction,
  statusMessage,
}) => {
  const getStatusIcon = (type: StatusMessage['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getStatusClasses = (type: StatusMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    }
  }

  if (!primaryAction && !secondaryAction && !statusMessage) {
    return null
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border mb-4 ${getStatusClasses(statusMessage.type)}`}
          role="alert"
        >
          {getStatusIcon(statusMessage.type)}
          <span className="text-sm font-medium">{statusMessage.message}</span>
        </div>
      )}
      
      {(primaryAction || secondaryAction) && (
        <div className="flex gap-3 justify-end">
          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          )}
          
          {primaryAction && (
            <Button
              variant="primary"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || primaryAction.loading}
            >
              {primaryAction.loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </div>
              ) : (
                primaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
