'use client'

import React from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { UnifiedDashboardContainer } from '@/components/unified-dashboard'
import { useLanguage } from '@/contexts/LanguageContext'

export default function UnifiedReportsPage() {
  const { t } = useLanguage()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Dashboard Unificado">
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
      <AppLayout title="Dashboard Unificado de Reportes">
        <UnifiedDashboardContainer initialSection="overview" />
      </AppLayout>
    </ProtectedRoute>
  )
}
