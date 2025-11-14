'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { ToolDetailsModal, ToolCard } from '@/components/tools'
import { BulkImportTools } from '@/components/admin/BulkImportTools'

interface ToolInstance {
  id: number
  item_type: {
    id: number
    name: string
    description?: string
    category?: string
  }
  qr_code: string
  serial_number?: string
  status: 'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged'
  condition_notes?: string
  created_at: string
}

function ManageToolsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const [tools, setTools] = useState<ToolInstance[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTools = async () => {
    setIsLoadingData(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }

      const response = await fetch(`/api/admin/tools?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTools(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchTools()
    }
  }, [isAuthenticated, isAdmin, filterStatus])

  // Handle URL query parameter for deep linking
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam) {
      const id = parseInt(viewParam, 10)
      if (!isNaN(id)) {
        setSelectedToolId(id)
        setIsModalOpen(true)
      }
    }
  }, [searchParams])

  const handleViewDetails = (toolId: number) => {
    setSelectedToolId(toolId)
    setIsModalOpen(true)
    // Update URL for deep linking
    const url = new URL(window.location.href)
    url.searchParams.set('view', toolId.toString())
    window.history.pushState({}, '', url.toString())
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedToolId(null)
    // Remove query parameter from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    window.history.pushState({}, '', url.toString())
  }

  const handleNavigateTool = (id: number) => {
    setSelectedToolId(id)
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('view', id.toString())
    window.history.pushState({}, '', url.toString())
  }

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Get unique categories from tools
  const categories = Array.from(new Set(tools.map(tool => tool.item_type.category).filter(Boolean))) as string[]

  const filteredTools = tools.filter(tool => {
    const matchesSearch = searchQuery === '' ||
      tool.item_type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.qr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.serial_number && tool.serial_number.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = filterCategory === 'all' || tool.item_type.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const stats = {
    total: tools.length,
    available: tools.filter(t => t.status === 'available').length,
    loaned: tools.filter(t => t.status === 'loaned').length,
    maintenance: tools.filter(t => t.status === 'out-of-service').length,
  }

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title={t('admin.tools.title')}>
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
    <ProtectedRoute>
      <AppLayout title={t('admin.tools.title')}>
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">{t('admin.tools.title')}</h1>
            <div className="flex space-x-2">
              <BulkImportTools onImportComplete={fetchTools} />
              <Button onClick={() => router.push('/admin/tools/new')} size="sm">
                {t('admin.tools.addNew')}
              </Button>
              <Button onClick={() => router.push('/admin/dashboard')} variant="secondary" size="sm">
                {t('admin.tools.backToDashboard')}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('admin.tools.totalTools')}</div>
                  <div className="text-3xl font-bold text-claro-blue">{stats.total}</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-claro-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('admin.tools.available')}</div>
                  <div className="text-3xl font-bold text-claro-green">{stats.available}</div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-claro-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('admin.tools.loaned')}</div>
                  <div className="text-3xl font-bold text-claro-warning">{stats.loaned}</div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-claro-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('admin.tools.maintenance')}</div>
                  <div className="text-3xl font-bold text-claro-red">{stats.maintenance}</div>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-claro-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('admin.tools.search')}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.tools.searchPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-claro-red focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('admin.tools.filterByStatus')}
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent transition-all"
                >
                  <option value="all">{t('admin.tools.allStatus')}</option>
                  <option value="available">{t('admin.tools.statusAvailable')}</option>
                  <option value="loaned">{t('admin.tools.statusLoaned')}</option>
                  <option value="out-of-service">{t('admin.tools.statusOutOfService')}</option>
                  <option value="lost">{t('admin.tools.statusLost')}</option>
                  <option value="damaged">{t('admin.tools.statusDamaged')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('admin.tools.filterByCategory')}
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent transition-all"
                >
                  <option value="all">{t('admin.tools.allCategories')}</option>
                  {categories.length > 0 ? (
                    categories.sort().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))
                  ) : (
                    <option disabled>{t('admin.tools.noCategoriesAvailable')}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterStatus !== 'all' || filterCategory !== 'all' || searchQuery) && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('admin.tools.activeFilters')}</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-claro-red/10 text-claro-red rounded-full text-sm">
                    {t('admin.tools.search')}: &quot;{searchQuery}&quot;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:bg-claro-red/20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-claro-red/10 text-claro-red rounded-full text-sm">
                    {t('common.status')}: {getStatusLabel(filterStatus)}
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="hover:bg-claro-red/20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filterCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-claro-red/10 text-claro-red rounded-full text-sm">
                    {t('common.category')}: {filterCategory}
                    <button
                      onClick={() => setFilterCategory('all')}
                      className="hover:bg-claro-red/20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                    setFilterCategory('all')
                  }}
                  className="text-sm text-claro-red hover:underline"
                >
                  {t('admin.tools.clearAll')}
                </button>
              </div>
            )}
          </div>

          {/* Tools Grid */}
          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {t('admin.tools.loadingTools')}
              </p>
            </div>
          ) : filteredTools.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onViewDetails={() => handleViewDetails(tool.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="text-lg font-medium mb-2 text-text-light dark:text-text-dark">{t('admin.tools.noToolsFound')}</h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                {searchQuery || filterCategory !== 'all' ? t('admin.tools.noToolsMatch') : t('admin.tools.noToolsYet')}
              </p>
              {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                    setFilterCategory('all')
                  }}
                  variant="secondary"
                >
                  {t('admin.tools.clearFilters')}
                </Button>
              )}
            </div>
          )}

          {/* Tool Details Modal */}
          <ToolDetailsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            toolId={selectedToolId}
            allToolIds={filteredTools.map(tool => tool.id)}
            onNavigate={handleNavigateTool}
            onToolUpdated={fetchTools}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

export default function ManageToolsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <AppLayout title="Manage Tools">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    }>
      <ManageToolsContent />
    </Suspense>
  )
}
