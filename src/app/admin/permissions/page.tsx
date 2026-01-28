'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import RolesTab from '@/components/admin/permissions/RolesTab'
import UsersTab from '@/components/admin/permissions/UsersTab'
import SectionsTab from '@/components/admin/permissions/SectionsTab'

/**
 * Tab types for the permissions management interface
 * @see Requirements 5.1 - Tabs for Roles, Users, and Sections
 */
type PermissionTab = 'roles' | 'users' | 'sections'

/**
 * Interface for tracking pending changes across all tabs
 * @see Requirements 5.4 - Pending changes indicator
 */
interface PendingChanges {
  roles: boolean
  users: boolean
  sections: boolean
}

/**
 * Main Permissions Administration Page
 * 
 * Implements Requirements:
 * - 5.1: Tab navigation for Roles, Users, and Sections
 * - 5.4: Pending changes indicator when there are unsaved modifications
 * 
 * @returns The permissions management page component
 */
export default function PermissionsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  
  // Current active tab
  const [activeTab, setActiveTab] = useState<PermissionTab>('roles')
  
  // Track pending changes across all tabs
  // @see Requirements 5.4 - Show indicator when there are unsaved modifications
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    roles: false,
    users: false,
    sections: false
  })
  
  // Loading state for tab content
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  /**
   * Check if there are any pending changes across all tabs
   * @see Requirements 5.4
   */
  const hasPendingChanges = useCallback(() => {
    return pendingChanges.roles || pendingChanges.users || pendingChanges.sections
  }, [pendingChanges])

  /**
   * Handle tab change with pending changes warning
   * @see Requirements 5.5 - Confirmation before discarding changes
   */
  const handleTabChange = useCallback((newTab: PermissionTab) => {
    if (pendingChanges[activeTab]) {
      const confirmChange = window.confirm(
        'Tienes cambios sin guardar. ¿Deseas cambiar de pestaña y perder los cambios?'
      )
      if (!confirmChange) {
        return
      }
      // Clear pending changes for the current tab
      setPendingChanges(prev => ({ ...prev, [activeTab]: false }))
    }
    setActiveTab(newTab)
  }, [activeTab, pendingChanges])

  /**
   * Handle page navigation with pending changes warning
   * @see Requirements 5.5 - Confirmation before discarding changes
   */
  const handleNavigateAway = useCallback(() => {
    if (hasPendingChanges()) {
      const confirmLeave = window.confirm(
        'Tienes cambios sin guardar. ¿Deseas salir y perder los cambios?'
      )
      if (!confirmLeave) {
        return
      }
    }
    router.push('/admin/dashboard')
  }, [hasPendingChanges, router])

  /**
   * Update pending changes state for a specific tab
   * This will be passed to child components
   */
  const updatePendingChanges = useCallback((tab: PermissionTab, hasChanges: boolean) => {
    setPendingChanges(prev => ({ ...prev, [tab]: hasChanges }))
  }, [])

  /**
   * Warn user before leaving page with unsaved changes
   * @see Requirements 5.5
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasPendingChanges])

  /**
   * Tab configuration with labels and icons
   */
  const tabs: { id: PermissionTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'roles',
      label: 'Roles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'sections',
      label: 'Secciones',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    }
  ]

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <AppLayout title="Gestión de Permisos">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                {t('common.loading')}
              </p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <ProtectedRoute requireAdmin>
      <AppLayout title="Gestión de Permisos">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">
                Gestión de Permisos
              </h1>
              
              {/* Pending Changes Indicator - Requirements 5.4 */}
              {hasPendingChanges() && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium animate-pulse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Cambios pendientes</span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleNavigateAway} 
              variant="secondary" 
              size="sm"
            >
              {t('admin.tools.backToDashboard')}
            </Button>
          </div>

          {/* Tab Navigation - Requirements 5.1 */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px" aria-label="Tabs">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id
                  const hasChanges = pendingChanges[tab.id]
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        relative flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                        ${isActive 
                          ? 'border-primary text-primary' 
                          : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      
                      {/* Tab-specific pending changes indicator */}
                      {hasChanges && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {isLoadingContent ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                    Cargando...
                  </p>
                </div>
              ) : (
                <>
                  {/* Roles Tab Content */}
                  {activeTab === 'roles' && (
                    <RolesTab 
                      onPendingChanges={(hasChanges) => updatePendingChanges('roles', hasChanges)}
                    />
                  )}

                  {/* Users Tab Content */}
                  {activeTab === 'users' && (
                    <UsersTab 
                      onPendingChanges={(hasChanges) => updatePendingChanges('users', hasChanges)}
                    />
                  )}

                  {/* Sections Tab Content */}
                  {activeTab === 'sections' && (
                    <SectionsTab 
                      onPendingChanges={(hasChanges) => updatePendingChanges('sections', hasChanges)}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Acerca de la Gestión de Permisos
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Desde esta sección puedes gestionar los roles del sistema, asignar permisos específicos a usuarios 
                  y controlar el acceso a las diferentes secciones de la aplicación. Los cambios se guardan 
                  automáticamente y quedan registrados en el historial de auditoría.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
