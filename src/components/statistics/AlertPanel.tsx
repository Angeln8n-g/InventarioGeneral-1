'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { AlertPanelProps } from '@/types/statistics'

const severityStyles = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    text: 'text-red-900 dark:text-red-100',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-100',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    text: 'text-blue-900 dark:text-blue-100',
  },
}

export function AlertPanel({ alerts, onAlertClick }: AlertPanelProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Alertas del Sistema
        </h2>
        <span className="ml-auto px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const styles = severityStyles[alert.severity]
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onAlertClick(alert)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer
                transition-all duration-200
                hover:shadow-md hover:-translate-y-1
                ${styles.bg} ${styles.border}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  {alert.severity === 'critical' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alert.severity === 'warning' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alert.severity === 'info' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${styles.text}`}>
                    {alert.title}
                  </h3>
                  <p className={`text-sm mt-1 ${styles.text} opacity-80`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(alert.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
                <svg className={`w-5 h-5 flex-shrink-0 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
