'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { ScanLine, CheckCircle2, Package, ClipboardList } from 'lucide-react'

interface QuickActionButtonsProps {
  activeLoansCount: number
}

export function QuickActionButtons({ activeLoansCount }: QuickActionButtonsProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const actions = [
    {
      id: 'scan-loan',
      label: t('dashboard.scanToLoan'),
      icon: <ScanLine className="w-12 h-12" />,
      onClick: () => router.push('/scanner?action=loan'),
      variant: 'primary' as const,
    },
    {
      id: 'scan-return',
      label: t('dashboard.scanToReturn'),
      icon: <CheckCircle2 className="w-12 h-12" />,
      onClick: () => router.push('/scanner?action=return'),
      variant: 'secondary' as const,
    },
    {
      id: 'request-supplies',
      label: t('dashboard.requestSupplies'),
      icon: <Package className="w-12 h-12" />,
      onClick: () => router.push('/consumables'),
      variant: 'secondary' as const,
    },
    {
      id: 'my-loans',
      label: t('dashboard.myLoans'),
      icon: <ClipboardList className="w-12 h-12" />,
      onClick: () => router.push('/my-loans'),
      variant: 'secondary' as const,
      badge: activeLoansCount > 0 ? activeLoansCount : undefined,
    },
  ]

  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`
              relative flex flex-col items-center justify-center p-6 rounded-2xl
              transition-all active:scale-95 group
              ${
                action.variant === 'primary'
                  ? 'claro-button-primary text-white shadow-lg'
                  : 'bg-card-light dark:bg-card-dark border-2 border-gray-200 dark:border-gray-700 claro-card-hover'
              }
            `}
          >
            {/* Badge */}
            {action.badge && (
              <span className="claro-badge-error absolute top-3 right-3 w-6 h-6 flex items-center justify-center">
                {action.badge > 9 ? '9+' : action.badge}
              </span>
            )}

            {/* Icon */}
            <div className={`mb-3 ${action.variant === 'primary' ? 'text-white' : 'text-claro-red'}`}>
              {action.icon}
            </div>

            {/* Label */}
            <span
              className={`text-sm font-semibold text-center ${
                action.variant === 'primary'
                  ? 'text-white'
                  : 'text-text-light dark:text-text-dark'
              }`}
            >
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
