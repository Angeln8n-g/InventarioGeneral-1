'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { FileText, Wrench, Package, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ReportsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()

  const reports = [
    {
      id: 'categories',
      name: t('admin.reports.categories'),
      description: t('admin.reports.categoriesDesc'),
      icon: <Package className="w-8 h-8" />,
      color: 'purple',
      path: '/admin/reports/categories',
      stats: [t('admin.reports.categories'), t('admin.tools.title') + ' & ' + t('consumables.title'), t('admin.reports.tools')],
    },
    {
      id: 'loans',
      name: t('admin.reports.loans'),
      description: t('admin.reports.loansDesc'),
      icon: <FileText className="w-8 h-8" />,
      color: 'blue',
      path: '/admin/reports/loans',
      stats: [t('admin.activeLoans'), t('admin.reports.loans'), t('admin.overdueLoans')],
    },
    {
      id: 'tools',
      name: t('admin.reports.tools'),
      description: t('admin.reports.toolsDesc'),
      icon: <Wrench className="w-8 h-8" />,
      color: 'green',
      path: '/admin/reports/tools',
      stats: [t('admin.tools.totalTools'), t('admin.reports.tools'), t('admin.tools.maintenance')],
    },
    {
      id: 'consumables',
      name: t('admin.reports.consumables'),
      description: t('admin.reports.consumablesDesc'),
      icon: <Package className="w-8 h-8" />,
      color: 'yellow',
      path: '/admin/reports/consumables',
      stats: [t('consumables.title'), t('consumables.lowStock'), t('admin.reports.consumables')],
    },
    {
      id: 'reservations',
      name: 'Reservas',
      description: 'Análisis completo del sistema de reservas de consumables',
      icon: <FileText className="w-8 h-8" />,
      color: 'orange',
      path: '/admin/reports/reservations',
      stats: ['Reservas Activas', 'Tasa de Cumplimiento', 'Materiales Reservados'],
    },
    {
      id: 'electronics',
      name: 'Electronic Devices',
      description: 'Comprehensive analysis of electronic devices inventory and utilization',
      icon: <Package className="w-8 h-8" />,
      color: 'indigo',
      path: '/admin/reports/electronics',
      stats: ['Total Devices', 'Utilization Rate', 'By Brand & Category'],
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
          hover: 'hover:border-purple-500 dark:hover:border-purple-500',
        }
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
          hover: 'hover:border-blue-500 dark:hover:border-blue-500',
        }
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
          hover: 'hover:border-green-500 dark:hover:border-green-500',
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
          hover: 'hover:border-yellow-500 dark:hover:border-yellow-500',
        }
      case 'orange':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
          hover: 'hover:border-orange-500 dark:hover:border-orange-500',
        }
      case 'indigo':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-900/20',
          icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
          hover: 'hover:border-indigo-500 dark:hover:border-indigo-500',
        }
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
          hover: 'hover:border-gray-500 dark:hover:border-gray-500',
        }
    }
  }

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title={t('admin.reports.title')}>
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">{t('admin.reports.loading')}</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <ProtectedRoute>
      <AppLayout title={t('admin.reports.title')}>
        <div className="px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('admin.reports.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.reports.subtitle')}
            </p>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const colors = getColorClasses(report.color)
              return (
                <div
                  key={report.id}
                  onClick={() => router.push(report.path)}
                  className={`${colors.bg} rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-700 ${colors.hover} p-6 cursor-pointer transition-all hover:shadow-md group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${colors.icon} p-3 rounded-lg`}>{report.icon}</div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {report.name}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {report.description}
                  </p>

                  <div className="space-y-1">
                    {report.stats.map((stat, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-2"></div>
                        {stat}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('admin.reports.about')}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('admin.reports.aboutDesc')}
            </p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
