import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation
} from '@/services/api'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotificationSound } from '@/hooks/useNotificationSound'
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { useViewTransition } from '@/hooks/useViewTransition'

interface HeaderProps {
  title?: string
  showNotifications?: boolean
  showUserMenu?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Inventory System',
  showNotifications = true,
  showUserMenu = true
}) => {
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth)
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [notificationPage, setNotificationPage] = useState(1)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const notificationsRef = React.useRef<HTMLDivElement>(null)
  
  // View transitions for navigation
  const { startTransition } = useViewTransition({
    speed: 'fast',
    direction: 'auto',
    enableHaptics: true,
  })

  const { data: notificationsData, error: notificationsError } = useGetNotificationsQuery(
    { page: notificationPage, limit: 20 },
    {
      skip: !user,
      pollingInterval: 30000, // Poll every 30 seconds
      skipPollingIfUnfocused: true, // Stop polling when tab is not focused
      refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
    }
  )

  // Log notification errors for debugging (only in development)
  useEffect(() => {
    if (notificationsError && process.env.NODE_ENV === 'development') {
      console.warn('Notifications temporarily unavailable:', notificationsError)
    }
  }, [notificationsError])

  const [markAsRead] = useMarkNotificationAsReadMutation()
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()
  const { checkForNewNotifications } = useNotificationSound()

  const notifications = notificationsData?.data || []
  const unreadCount = notificationsData?.unread_count || 0

  // Check for new notifications and play sound
  useEffect(() => {
    if (unreadCount !== undefined) {
      checkForNewNotifications(unreadCount)
    }
  }, [unreadCount, checkForNewNotifications])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false)
      }
    }

    if (showMenu || showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMenu, showNotificationsDropdown])

  const handleLogout = () => {
    logout()
    setShowMenu(false)
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id).unwrap()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id).unwrap()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleOpenPreferences = () => {
    setShowNotificationsDropdown(false)
    setShowPreferences(true)
  }

  return (
    <header className="bg-claro-red dark:bg-gray-900 shadow-md p-4 flex justify-between items-center fixed top-0 w-full z-50 h-16">
      <div className="flex justify-between items-center w-full">
        {/* Logo/Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white dark:text-white">
            {title}
          </h1>
        </div>

        {/* Right side actions */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {showNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-2 rounded-full hover:bg-red-700 dark:hover:bg-gray-800 transition-all"
                >
                  <svg className="w-6 h-6 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white dark:bg-claro-red text-claro-red dark:text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationsDropdown
                  isOpen={showNotificationsDropdown}
                  onClose={() => setShowNotificationsDropdown(false)}
                  notifications={notifications.map(n => ({
                    id: n.id,
                    type: (n.type as 'info' | 'warning' | 'success' | 'error') || 'info',
                    title: n.title,
                    message: n.message,
                    timestamp: n.created_at,
                    read: n.is_read,
                    notificationType: n.type, // Pass original type for navigation
                  }))}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDelete={handleDelete}
                  onOpenPreferences={handleOpenPreferences}
                />
              </div>
            )}

            {/* Preferences Modal */}
            {showPreferences && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <NotificationPreferences onClose={() => setShowPreferences(false)} />
                </div>
              </div>
            )}

            {/* User Menu */}
            {showUserMenu && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 bg-white dark:bg-gray-700 text-claro-red dark:text-white rounded-full flex items-center justify-center font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-md"
                >
                  {user.username.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card-light dark:bg-card-dark rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-text-light dark:text-text-dark">{user.username}</p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{user.email}</p>
                      <p className="text-xs text-claro-red capitalize font-medium">{user.role}</p>
                    </div>

                    <button
                      onClick={async () => {
                        setShowMenu(false)
                        await startTransition(() => {
                          router.push('/profile')
                        }, '/profile')
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      Profile & Settings
                    </button>

                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <span>Dark Mode</span>
                      <div className="relative inline-flex items-center">
                        {theme === 'dark' ? (
                          <svg className="w-5 h-5 text-claro-warning" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-claro-warning" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-claro-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
