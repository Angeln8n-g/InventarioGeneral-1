'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'

interface User {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export default function ManageUsersPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = async () => {
    setIsLoadingData(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers()
    }
  }, [isAuthenticated, isAdmin])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-900/50 text-primary'
      case 'user':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-accent'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }
  }

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesSearch = searchQuery === '' || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesRole && matchesSearch
  })

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regularUsers: users.filter(u => u.role === 'user').length,
  }

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title={t('admin.users.title')}>
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
      <AppLayout title={t('admin.users.title')}>
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t('admin.users.title')}</h1>
            <div className="flex space-x-2">
              <Button onClick={() => router.push('/admin/users/new')} size="sm">
                {t('admin.users.addNew')}
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
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('admin.users.totalUsers')}</div>
                  <div className="text-3xl font-bold text-blue-accent">{stats.total}</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('admin.users.admins')}</div>
                  <div className="text-3xl font-bold text-primary">{stats.admins}</div>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('admin.users.regularUsers')}</div>
                  <div className="text-3xl font-bold text-blue-accent">{stats.regularUsers}</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('admin.users.search')}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.users.searchPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('admin.users.filterByRole')}
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="all">{t('admin.users.allRoles')}</option>
                  <option value="admin">{t('admin.users.admin')}</option>
                  <option value="user">{t('admin.users.user')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {isLoadingData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">{t('admin.users.loadingUsers')}</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{user.username}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{t('admin.users.joined')} {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <Button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        size="sm"
                        variant="primary"
                      >
                        {t('admin.users.viewProfile')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">{t('admin.users.noUsersFound')}</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  {searchQuery || filterRole !== 'all' 
                    ? t('admin.users.noUsersMatch')
                    : t('admin.users.noUsersYet')}
                </p>
                {(searchQuery || filterRole !== 'all') && (
                  <Button 
                    onClick={() => {
                      setSearchQuery('')
                      setFilterRole('all')
                    }} 
                    variant="secondary"
                  >
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
