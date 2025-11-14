'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { FileText, User, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface LoanWithInfo {
  id: number
  user_id: number
  tool_instance_id: number
  loan_date: string
  due_date: string
  return_date: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  days_active: number
  days_until_due: number
  is_due_soon: boolean
  user: {
    id: number
    username: string
    email: string
    full_name: string | null
  }
  tool_instance: {
    id: number
    qr_code: string
    status: string
    item_type: {
      id: number
      name: string
      description: string | null
      category: string | null
    }
  }
}

export default function ActiveLoansPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const token = useSelector((state: RootState) => state.auth.token)
  const { t } = useLanguage()

  const [loans, setLoans] = useState<LoanWithInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'due_soon'>('all')

  const fetchLoans = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/loans?status=active', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || t('common.error'))
      }

      const data = await response.json()
      setLoans(data.data || [])
    } catch (err) {
      console.error('Error fetching loans:', err)
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchLoans()
    }
  }, [isAuthenticated, isAdmin, fetchLoans])

  const filteredLoans = filter === 'due_soon' 
    ? loans.filter(loan => loan.is_due_soon)
    : loans

  const getDueDateColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'text-red-600 dark:text-red-400'
    if (daysUntilDue <= 3) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title={t('admin.loans.title')}>
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
      <AppLayout title={t('admin.loans.title')}>
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('admin.loans.title')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('admin.loans.allLoans')}
              </p>
            </div>
            <Button onClick={fetchLoans} variant="secondary" size="sm">
              {t('returns.refresh')}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mr-4">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('myLoans.active')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{loans.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 mr-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('myLoans.overdue')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loans.filter(l => l.is_due_soon).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 mr-4">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.totalUsers')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(loans.map(l => l.user_id)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.filter')}:</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  {t('admin.loans.allStatus')} ({loans.length})
                </Button>
                <Button
                  onClick={() => setFilter('due_soon')}
                  variant={filter === 'due_soon' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  {t('myLoans.overdue')} ({loans.filter(l => l.is_due_soon).length})
                </Button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">{t('admin.loans.loadingLoans')}</p>
            </div>
          )}

          {/* Loans Table */}
          {!isLoading && filteredLoans.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('admin.loans.user')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('admin.loans.tool')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('common.description')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('admin.loans.loanDate')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('admin.loans.dueDate')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('myLoans.active')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('common.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{loan.id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {loan.user.username}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {loan.user.full_name || loan.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {loan.tool_instance.item_type.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            QR: {loan.tool_instance.qr_code.substring(0, 12)}...
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {loan.tool_instance.item_type.description || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                {t('admin.tools.notes')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {new Date(loan.loan_date).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className={`flex items-center text-sm font-medium ${getDueDateColor(loan.days_until_due)}`}>
                            <Clock className="w-4 h-4 mr-2" />
                            {new Date(loan.due_date).toLocaleDateString('es-ES')}
                          </div>
                          <div className={`text-xs ${getDueDateColor(loan.days_until_due)}`}>
                            {loan.days_until_due >= 0 
                              ? `${loan.days_until_due} ${t('loan.due')}`
                              : `${Math.abs(loan.days_until_due)} ${t('loan.overdue')}`
                            }
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {loan.days_active} {t('loan.due')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {loan.is_due_soon ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {t('myLoans.overdue')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t('myLoans.active')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredLoans.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('admin.loans.noLoansFound')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'due_soon' 
                  ? t('myLoans.noActiveLoans')
                  : t('admin.loans.noLoansFound')
                }
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
