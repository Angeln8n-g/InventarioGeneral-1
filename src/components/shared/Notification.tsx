'use client'

import React, { useEffect } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationProps {
  type: NotificationType
  message: string
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay, onClose])

  const getIcon = () => {
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

  const getClasses = () => {
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

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${getClasses()} animate-slide-in`}
      role="alert"
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * Toast notification container for global notifications
 */
interface ToastContainerProps {
  notifications: Array<{
    id: string
    type: NotificationType
    message: string
  }>
  onClose: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onClose }) => {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => onClose(notification.id)}
        />
      ))}
    </div>
  )
}
