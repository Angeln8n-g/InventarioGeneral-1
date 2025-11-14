'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon,
  title = 'No Active Loans',
  description = "You don't have any tools currently on loan.",
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6"
      >
        {icon || (
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-600"
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
        )}
      </motion.div>

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-gray-900 dark:text-white mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-500 dark:text-gray-400 text-center max-w-md"
      >
        {description}
      </motion.p>

      {/* Action */}
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="mt-6 px-6 py-3 bg-claro-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}
