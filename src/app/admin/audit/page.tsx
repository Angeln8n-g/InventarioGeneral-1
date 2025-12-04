'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

interface AuditLogEntry {
  id: number
  user?: { username: string; email: string }
  action: string
  entity_type: string
  entity_id: number
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

interface AuditFilters {
  user_id?: string
  entity_type?: string
  action?: string
  start_date?: string
  end_date?: string
}

const AuditLogItem: React.FC<{ log: AuditLogEntry }> = ({ log }) => {
  const [showDetails, setShowDetails] = useState(false)
  const { t } = useLanguage()

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600 bg-green-100'
    if (action.includes('update') || action.includes('adjust')) return 'text-blue-600 bg-blue-100'
    if (action.includes('delete')) return 'text-red-600 bg-red-100'
    if (action.includes('login') || action.includes('logout')) return 'text-purple-600 bg-purple-100'
    return 'text-gray-600 bg-gray-100'
  }

  const formatEntityType = (entityType: string) => {
    return entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
              {log.action}
            </span>
            <span className="text-sm text-gray-500">
              {formatEntityType(log.entity_type)} #{log.entity_id}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">
              {log.user?.username || 'System'}
            </span>
            {log.user?.email && (
              <span className="text-gray-500 ml-1">({log.user.email})</span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {new Date(log.created_at).toLocaleString()}
            {log.ip_address && (
              <span className="ml-2">IP: {log.ip_address}</span>
            )}
          </div>
        </div>
        
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="secondary"
          size="sm"
        >
          {showDetails ? t('common.close') : t('common.details')}
        </Button>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.old_values && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('common.previous')}</h4>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.old_values, null, 2)}
                </pre>
              </div>
            )}
            
            {log.new_values && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('common.details')}</h4>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          {log.user_agent && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-900 mb-1">{t('admin.audit.userAgent')}</h4>
              <p className="text-xs text-gray-600 break-all">{log.user_agent}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminAuditPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading } = useRequireAdmin()
  const { t } = useLanguage()
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [filters, setFilters] = useState<AuditFilters>({})
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)

  const entityTypes = [
    'user', 'item_type', 'tool_instance', 'loan', 
    'consumable_stock', 'consumable_request', 'notification'
  ]

  const actions = [
    'login', 'logout', 'create', 'update', 'delete',
    'loan_create', 'loan_return', 'stock_adjustment', 'tool_lookup'
  ]

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true)
    
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/audit/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('common.error') }))
        toastError(errorData.error || t('common.error'))
        setAuditLogs([])
        setSummary(null)
        return
      }

      const data = await response.json()
      setAuditLogs(data.data || [])
      setSummary(data.summary || null)
    } catch (error: unknown) {
      console.error('Audit logs fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : t('common.error')
      toastError(`${t('common.error')}: ${errorMessage}`)
      setAuditLogs([])
      setSummary(null)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('export', 'true')

      const response = await fetch(`/api/audit/logs/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('common.error') }))
        toastError(errorData.error || t('common.error'))
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toastSuccess(t('common.success'))
    } catch (error: unknown) {
      console.error('Export error:', error)
      const errorMessage = error instanceof Error ? error.message : t('common.error')
      toastError(`${t('common.error')}: ${errorMessage}`)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title={t('admin.audit.title')}>
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
    return null
  }

  return (
    <ProtectedRoute>
      <AppLayout title={t('admin.audit.title')}>
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.audit.title')}</h1>
            <div className="flex space-x-2">
              <Button onClick={exportLogs} variant="secondary" size="sm">
                Export CSV
              </Button>
              <Button onClick={() => router.push('/admin/dashboard')} variant="secondary" size="sm">
                {t('admin.tools.backToDashboard')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.filter')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {t('admin.audit.user')}
                </label>
                <input
                  type="number"
                  placeholder={t('admin.audit.user')}
                  value={filters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {t('common.category')}
                </label>
                <select
                  value={filters.entity_type || ''}
                  onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">{t('admin.tools.allCategories')}</option>
                  {entityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {t('admin.audit.action')}
                </label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">{t('admin.audit.allActions')}</option>
                  {actions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {t('reports.startDate')}
                </label>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {t('reports.endDate')}
                </label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <Button onClick={fetchAuditLogs} disabled={isLoadingLogs}>
                {isLoadingLogs ? t('common.loading') : t('common.filter')}
              </Button>
              <Button onClick={clearFilters} variant="secondary">
                {t('admin.tools.clearFilters')}
              </Button>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{t('myLoans.total')}</h4>
                <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{t('common.actions')}</h4>
                <div className="space-y-1">
                  {Object.entries(summary.by_action || {}).slice(0, 3).map(([action, count]) => (
                    <div key={action} className="flex justify-between text-sm">
                      <span className="text-gray-600">{action}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{t('common.category')}</h4>
                <div className="space-y-1">
                  {Object.entries(summary.by_entity_type || {}).slice(0, 3).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-600">{type}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs */}
          <div className="space-y-4">
            {isLoadingLogs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">{t('admin.audit.loadingLogs')}</p>
              </div>
            ) : auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <AuditLogItem key={log.id} log={log} />
              ))
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.audit.noLogsFound')}</h3>
                <p className="text-gray-500 mb-4">
                  {Object.keys(filters).some(key => filters[key as keyof AuditFilters])
                    ? t('admin.audit.noLogsFound')
                    : t('common.loading')
                  }
                </p>
                {Object.keys(filters).some(key => filters[key as keyof AuditFilters]) && (
                  <Button onClick={clearFilters} variant="secondary">
                    {t('admin.tools.clearFilters')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}