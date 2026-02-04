'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useLanguage } from '@/contexts/LanguageContext'
import { useViewTransition } from '@/hooks/useViewTransition'
import { SwipeContainer } from '@/components/ui/SwipeContainer'

/**
 * Get display label for a role name
 * Supports dynamic roles from the database
 */
function getRoleDisplayLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    user: 'Usuario',
    analyst: 'Analista',
    supervisor: 'Supervisor',
    manager: 'Gerente',
  }
  // Return the label if found, otherwise capitalize the role name
  return roleLabels[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1)
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { userRole, isLoading: permissionsLoading } = usePermissions()
  const { language, setLanguage, t } = useLanguage()
  
  // View transitions for navigation
  const { startTransition } = useViewTransition({
    speed: 'normal',
    direction: 'auto',
    enableHaptics: true,
  })

  // Use dynamic role from permissions context, fallback to user.role
  const displayRole = userRole || user?.role || 'user'

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang)
  }

  return (
    <ProtectedRoute>
      <SwipeContainer enabled={true}>
        <AppLayout title={t('profile.title')}>
        <div className="px-4 py-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">{t('profile.title')}</h1>
          </div>

          {/* User Info Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-claro-red rounded-full flex items-center justify-center shadow-md">
                <span className="text-2xl font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">{user?.email}</h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {permissionsLoading ? '...' : getRoleDisplayLabel(displayRole)}
                </p>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">{t('profile.settings')}</h3>
            
            {/* Language Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-3">
                  {t('profile.language')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      language === 'en'
                        ? 'border-claro-red bg-red-50 dark:bg-red-900/20 text-text-light dark:text-text-dark'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-text-light dark:text-text-dark'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">🇺🇸</span>
                      <span className="font-medium">{t('profile.english')}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleLanguageChange('es')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      language === 'es'
                        ? 'border-claro-red bg-red-50 dark:bg-red-900/20 text-text-light dark:text-text-dark'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-text-light dark:text-text-dark'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">🇪🇸</span>
                      <span className="font-medium">{t('profile.spanish')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/profile/change-password')}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {t('profile.changePassword')}
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('profile.logout')}
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard')}
              variant="secondary"
              className="w-full"
            >
              {t('common.back')}
            </Button>
          </div>
        </div>
      </AppLayout>
      </SwipeContainer>
    </ProtectedRoute>
  )
}
