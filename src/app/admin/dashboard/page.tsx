'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useViewTransition } from '@/hooks/useViewTransition'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useGetDashboardStatsQuery } from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  onClick?: () => void
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-accent',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-accent',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-accent',
    red: 'bg-red-100 dark:bg-red-900/50 text-red-accent',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-primary',
  }

  return (
    <div
    className={`bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 flex items-center ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
    >
      <div className={`p-3 rounded-lg mr-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { startTransition } = useViewTransition({ speed: 'normal', direction: 'lateral' })
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(undefined, {
    skip: !isAuthenticated || !isAdmin,
    pollingInterval: 60000, // Refresh every minute
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
  })

  const stats = statsData?.data || {
    totalTools: 0,
    availableTools: 0,
    loanedTools: 0,
    overdueLoans: 0,
    totalUsers: 0,
    activeLoans: 0,
    consumableTypes: 0,
    totalConsumables: 0,
    lowStockItems: 0,
    totalElectronics: 0,
  }

  const isLoading = authLoading || statsLoading

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title={t('admin.dashboard')}>
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">{t('common.loading')}</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null // useRequireAdmin will handle redirect
  }

  return (
    <ProtectedRoute>
      <AppLayout title={t('admin.dashboard')}>
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold"></h1>
            <div className="flex space-x-2 flex-wrap gap-2">
              <Button
                onClick={() => startTransition(() => router.push('/admin/statistics'))}
                size="sm"
              >
                📊 Estadísticas
              </Button>
              <Button
                onClick={() => startTransition(() => router.push('/admin/reports'))}
                size="sm"
              >
                {t('admin.generateReport')}
              </Button>
              <Button
                onClick={() => startTransition(() => router.push('/admin/tools'))}
                variant="secondary"
                size="sm"
              >
                {t('admin.manageToolsBtn')}
              </Button>
              <Button
                onClick={() => startTransition(() => router.push('/admin/electronics'))}
                variant="secondary"
                size="sm"
              >
                {t('admin.manageElectronics')}
              </Button>
              <Button
                onClick={() => startTransition(() => router.push('/admin/users'))}
                variant="secondary"
                size="sm"
              >
                {t('admin.manageUsers')}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title={t('admin.manageTools')}
              value={stats.totalTools}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
              onClick={() => router.push('/admin/tools')}
            />

            <StatsCard
              title={t('admin.availableTools')}
              value={stats.availableTools}
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatsCard
              title={t('admin.activeLoans')}
              value={stats.activeLoans}
              color="yellow"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              onClick={() => startTransition(() => router.push('/admin/loans'))}
            />

            <StatsCard
              title={t('admin.generateReport')}
              value={t('admin.generateReport')}
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              onClick={() => router.push('/admin/reports')}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title={t('admin.totalUsers')}
              value={stats.totalUsers}
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
              onClick={() => startTransition(() => router.push('/admin/users'))}
            />


            <StatsCard
              title={t('admin.consumableInventory')}
              value={stats.totalConsumables}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              onClick={() => router.push('/admin/consumables')}
            />

            <StatsCard
              title={t('admin.totalElectronics')}
              value={stats.totalElectronics}
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              onClick={() => router.push('/admin/electronics')}
            />

            <StatsCard
              title={t('admin.lowStockItems')}
              value={stats.lowStockItems}
              color="red"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              }
              onClick={() => startTransition(() => router.push('/admin/consumables?filter=low_stock'))}
            />

            <StatsCard
              title={t('admin.overdueLoans')}
              value={stats.overdueLoans}
              color="red"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              onClick={() => startTransition(() => router.push('/admin/loans?filter=overdue'))}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('admin.quickActions')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('admin.quickAccessDesc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => startTransition(() => router.push('/admin/tools'))}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('admin.manageTools')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{t('admin.manageToolsDesc')}</p>
              </button>

              <button
                onClick={() => startTransition(() => router.push('/admin/users'))}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/60 transition-colors">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('admin.manageUsers')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{t('admin.manageUsersDesc')}</p>
              </button>

              <button
                onClick={() => startTransition(() => router.push('/admin/consumables'))}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/60 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('admin.consumableInventory')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{t('admin.manageMaterialsDesc')}</p>
              </button>

              <button
                onClick={() => startTransition(() => router.push('/admin/electronics'))}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition-colors">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('Admin Electronics')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{t('admin.manageElectronicsDesc')}</p>
              </button>

              <button
                onClick={() => startTransition(() => router.push('/admin/reports'))}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition-colors">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('admin.generateReport')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{t('admin.reportsDesc')}</p>
              </button>
            </div>
          </div>

          {/* Advanced Configuration */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">⚙️ {t('admin.advancedConfig')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('admin.advancedConfigDesc')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => startTransition(() => router.push('/admin/item-types/new'))}
                className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{t('admin.manageItemTypes')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('admin.manageItemTypesDesc')}
                  </p>
                </div>
              </button>

              <button
                onClick={() => startTransition(() => router.push('/admin/reports/purchases'))}
                className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{t('admin.invoiceReports')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('admin.invoiceReportsDesc')}
                  </p>
                </div>
              </button>

              <button
                onClick={() => startTransition(() => router.push('/admin/audit'))}
                className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{t('admin.auditLogs')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('admin.auditLogsDesc')}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">{t('admin.systemInfo')}</h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('admin.databaseStatus')}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{t('admin.databaseConnected')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('admin.dataRefresh')}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{t('admin.autoUpdates')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('admin.realTimeStats')}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{t('admin.liveData')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('admin.lastUpdated')}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}