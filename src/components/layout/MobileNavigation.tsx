import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useLanguage } from '@/contexts/LanguageContext'
import { useViewTransition } from '@/hooks/useViewTransition'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  requireAdmin?: boolean
}

export const MobileNavigation: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  const { t } = useLanguage()
  
  // View transitions for lateral navigation
  const { startTransition } = useViewTransition({
    speed: 'normal',
    direction: 'lateral',
    enableHaptics: true,
  })

  const navItems: NavItem[] = [
    {
      name: t('nav.dashboard'),
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    // Scanner tab removed - functionality now in Dashboard
    {
      name: t('nav.myLoans'),
      href: '/my-loans',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: t('nav.consumables'),
      href: '/consumables',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: t('nav.admin'),
      href: '/admin/dashboard',
      requireAdmin: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  const filteredNavItems = navItems.filter(item => {
    if (item.requireAdmin && !isAdmin) return false
    return true
  })

  const handleNavigation = async (href: string) => {
    // Don't navigate if already on the page
    if (pathname === href || (href === '/admin/dashboard' && pathname.startsWith('/admin'))) {
      return
    }
    
    await startTransition(() => {
      router.push(href)
    }, href)
  }

  return (
    <footer className="bg-card-light dark:bg-card-dark shadow-lg flex justify-around items-center fixed bottom-0 w-full z-50 border-t border-gray-200 dark:border-gray-700 h-16">
      {filteredNavItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href === '/admin/dashboard' && pathname.startsWith('/admin'))

        return (
          <button
            key={item.name}
            onClick={() => handleNavigation(item.href)}
            className={`relative flex flex-col items-center justify-center flex-1 py-2 transition-colors ${isActive
              ? 'text-claro-red'
              : 'text-text-secondary-light dark:text-text-secondary-dark'
              }`}
            aria-label={item.name}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon */}
            <div className="mb-1">{item.icon}</div>

            {/* Label */}
            <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
              {item.name}
            </span>

            {/* Active Indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-claro-red rounded-t-full"></div>
            )}
          </button>
        )
      })}
    </footer>
  )
}

export default MobileNavigation