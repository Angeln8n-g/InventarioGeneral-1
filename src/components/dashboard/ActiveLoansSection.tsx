'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { EmptyState } from './EmptyState'

interface Loan {
  id: number
  tool_name: string
  tool_code: string
  loan_date: string
  expected_return_date: string
  status: string
}

interface ActiveLoansSectionProps {
  loans: Loan[]
  onLoanClick?: (loanId: number) => void
  onReturnClick?: (loanId: number) => void
  onViewAllClick?: () => void
}

export function ActiveLoansSection({
  loans,
  onLoanClick,
  onReturnClick,
  onViewAllClick,
}: ActiveLoansSectionProps) {
  const getDaysRemaining = (returnDate: string) => {
    const today = new Date()
    const returnDay = new Date(returnDate)
    const diffTime = returnDay.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    if (daysRemaining <= 2) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-green-600 bg-green-50 dark:bg-green-900/20'
  }

  // No mostrar nada si no hay préstamos
  if (loans.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Préstamos Activos
        </h2>
        {loans.length > 0 && (
          <button
            onClick={onViewAllClick}
            className="text-claro-red hover:text-red-600 font-semibold text-sm transition-colors"
          >
            Ver todos →
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loans.slice(0, 3).map((loan, index) => {
            const daysRemaining = getDaysRemaining(loan.expected_return_date)
            const statusColor = getStatusColor(daysRemaining)

            return (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => onLoanClick?.(loan.id)}
              >
                <div className="flex items-center justify-between">
                  {/* Tool Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-claro-red/10 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-claro-red"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {loan.tool_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Code: {loan.tool_code}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                          {daysRemaining < 0
                            ? `Overdue by ${Math.abs(daysRemaining)} days`
                            : daysRemaining === 0
                              ? 'Due today'
                              : `${daysRemaining} days left`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onReturnClick?.(loan.id)
                    }}
                    className="ml-4 px-4 py-2 bg-claro-red text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm whitespace-nowrap"
                  >
                    Devolver
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
