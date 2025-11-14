'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useViewTransition } from '@/hooks/useViewTransition'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
}

interface BottomNavProps {
  items?: NavItem[]
}

const defaultItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    id: 'scanner',
    label: 'Scanner',
    path: '/tools/scan',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
        />
      </svg>
    ),
  },
  {
    id: 'loans',
    label: 'My Loans',
    path: '/loans',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    id: 'consumables',
    label: 'Consumables',
    path: '/consumables',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
]

export function BottomNav({ items = defaultItems }: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // View transitions for lateral navigation
  const { startTransition } = useViewTransition({
    speed: 'normal',
    direction: 'lateral',
    enableHaptics: true,
  })

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50"
    >
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {items.map((item) => {
            const active = isActive(item.path)
            return (
              <motion.button
                key={item.id}
                onClick={async () => {
                  if (!active) {
                    await startTransition(() => {
                      router.push(item.path)
                    }, item.path)
                  }
                }}
                whileTap={{ scale: 0.9 }}
                className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-claro-red rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div
                  className={`
                  transition-colors duration-200
                  ${active ? 'text-claro-red' : 'text-gray-400 dark:text-gray-600'}
                `}
                >
                  {item.icon}
                </div>

                {/* Label */}
                <span
                  className={`
                  text-xs mt-1 font-medium transition-colors duration-200
                  ${active ? 'text-claro-red' : 'text-gray-500 dark:text-gray-400'}
                `}
                >
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 bg-claro-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
