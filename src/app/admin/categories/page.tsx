'use client'

import React from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import CategoryManagement from '@/components/admin/CategoryManagement'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CategoriesPage() {
  const { t } = useLanguage()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()

  if (authLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <AppLayout title={t('admin.categories.title') || 'Categorías'}>
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">{t('common.loading')}</p>
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
    <ProtectedRoute requireAdmin>
      <AppLayout title={t('admin.categories.title') || 'Categorías'}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CategoryManagement />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
