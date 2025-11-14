'use client'

import React, { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'

interface LoanCardProps {
  loan: {
    id: number
    tool_instance: {
      serial_number?: string
      item_type: {
        name: string
        description?: string
      }
    }
    due_date: string
    status: string
  }
}

export function LoanCard({ loan }: LoanCardProps) {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if loan is overdue
  const dueDate = new Date(loan.due_date)
  const today = new Date()
  const isOverdue = dueDate < today && loan.status === 'active'

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Calculate days until due
  const getDaysUntilDue = () => {
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDue = getDaysUntilDue()

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-gray-200 dark:border-gray-700 claro-card-hover transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-text-light dark:text-text-dark truncate">
            {loan.tool_instance.item_type.name}
          </h3>
          {loan.tool_instance.serial_number && (
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {t('loan.serial')}: {loan.tool_instance.serial_number}
            </p>
          )}
        </div>

        {/* Status Badge */}
        {isOverdue && (
          <span className="claro-badge-error ml-2 flex-shrink-0">
            {t('loan.overdue')}
          </span>
        )}
      </div>

      {/* Due Date */}
      <div className="flex items-center space-x-2 mb-3">
        <Calendar
          className={`w-4 h-4 ${isOverdue
              ? 'text-claro-red'
              : 'text-text-secondary-light dark:text-claro-red'
            }`}
        />
        <span
          className={`text-sm ${isOverdue
              ? 'text-claro-red font-semibold'
              : 'text-text-secondary-light dark:text-text-secondary-dark'
            }`}
        >
          {t('loan.due')}: {formatDate(dueDate)}
          {!isOverdue && daysUntilDue <= 3 && daysUntilDue > 0 && (
            <span className="ml-2 text-claro-warning font-medium">
              ({daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'})
            </span>
          )}
        </span>
      </div>

      {/* Description (Expandable) */}
      {loan.tool_instance.item_type.description && (
        <div className="mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-claro-red hover:underline flex items-center"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                {t('common.showLess')}
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                {t('common.showMore')}
              </>
            )}
          </button>
          {isExpanded && (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
              {loan.tool_instance.item_type.description}
            </p>
          )}
        </div>
      )}


    </div>
  )
}
