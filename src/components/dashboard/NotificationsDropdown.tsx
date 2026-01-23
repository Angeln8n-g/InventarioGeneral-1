'use client'

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Bell, CheckCircle, AlertCircle, Info, X, Settings, Trash2 } from 'lucide-react'

interface Notification {
  id: number
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  notificationType?: string // Original notification type from DB
}

interface NotificationsDropdownProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: number) => void
  onMarkAllAsRead: () => void
  onDelete?: (id: number) => void
  onOpenPreferences?: () => void
}

export function NotificationsDropdown({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onOpenPreferences,
}: NotificationsDropdownProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Memoize filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'unread' && n.read) return false
      if (typeFilter !== 'all' && n.type !== typeFilter) return false
      return true
    })
  }, [notifications, filter, typeFilter])

  // Memoize unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  // Memoize icon getter
  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-claro-green" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-claro-warning" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-claro-red" />
      default:
        return <Info className="w-5 h-5 text-claro-blue" />
    }
  }, [])

  // Memoize timestamp formatter
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('notifications.justNow')
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }, [t])

  // Handle notification click with navigation
  const handleNotificationClick = useCallback((notification: Notification) => {
    onMarkAsRead(notification.id)
    
    // Navigate based on notification type
    const notifType = notification.notificationType || notification.title.toLowerCase()
    
    // Evaluation-related notifications
    if (notifType.includes('evaluation_assigned') || 
        notifType.includes('evaluación asignada') ||
        notifType.includes('asignada')) {
      onClose()
      router.push('/admin/classrooms/evaluations')
    } else if (notifType.includes('evaluation_pending_approval') || 
               notifType.includes('evaluation_approved') ||
               notifType.includes('evaluation_rejected') ||
               notifType.includes('aprobación') ||
               notifType.includes('aprobada') ||
               notifType.includes('rechazada')) {
      onClose()
      router.push('/admin/classrooms/evaluations?tab=aprobaciones')
    } else if (notifType.includes('evaluation_completed_for_space') ||
               notifType.includes('evaluación completada') ||
               notifType.includes('evaluation_feedback')) {
      // Navigate to my spaces evaluations page for responsible persons
      onClose()
      router.push('/my-spaces/evaluations')
    }
    // Add more navigation rules as needed
  }, [onMarkAsRead, onClose, router])

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card-light dark:bg-card-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in z-50"
    >
      {/* Header */}
      <div className="sticky top-0 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-claro-red" />
            <h3 className="font-semibold text-text-light dark:text-text-dark">
              {t('dashboard.notifications')}
            </h3>
            {unreadCount > 0 && (
              <span className="claro-badge-active">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {onOpenPreferences && (
              <button
                onClick={onOpenPreferences}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label={t('notifications.preferences')}
                title={t('notifications.preferences')}
              >
                <Settings className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'all'
                ? 'bg-claro-red text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {t('notifications.all')}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'unread'
                ? 'bg-claro-red text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {t('notifications.unread')} ({unreadCount})
          </button>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark border-none focus:ring-2 focus:ring-claro-red"
          >
            <option value="all">{t('notifications.allTypes')}</option>
            <option value="info">{t('notifications.info')}</option>
            <option value="success">{t('notifications.success')}</option>
            <option value="warning">{t('notifications.warning')}</option>
            <option value="error">{t('notifications.error')}</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark opacity-50 mx-auto mb-3" />
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {filter === 'unread' ? t('notifications.noUnread') : t('notifications.noNotifications')}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group ${!notification.read ? 'bg-red-50 dark:bg-red-900/10' : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <p className={`text-sm font-medium ${!notification.read
                          ? 'text-claro-red'
                          : 'text-text-light dark:text-text-dark'
                        }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-2 flex-shrink-0">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-claro-red rounded-full flex-shrink-0 animate-pulse"></div>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(notification.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                        aria-label={t('notifications.delete')}
                        title={t('notifications.delete')}
                      >
                        <Trash2 className="w-3 h-3 text-claro-red" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="sticky bottom-0 bg-card-light dark:bg-card-dark border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <button
            onClick={onMarkAllAsRead}
            className="w-full text-sm text-claro-red hover:underline font-medium"
          >
            {t('notifications.markAllAsRead')}
          </button>
        </div>
      )}
    </div>
  )
}
