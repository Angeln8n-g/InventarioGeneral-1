'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface DashboardHeaderProps {
  userName: string
  notificationCount?: number
  onNotificationClick?: () => void
  onProfileClick?: () => void
}

export function DashboardHeader({
  userName,
  notificationCount = 0,
  onNotificationClick,
  onProfileClick,
}: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-claro-red text-white px-6 py-4 rounded-b-3xl shadow-lg"
    >
      <div className="flex items-center justify-between">
        {/* Greeting */}
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold"
          >
            Hello, {userName}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-red-100 mt-1"
          >
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </motion.p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNotificationClick}
            className="relative p-2 rounded-full hover:bg-red-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-yellow-400 text-claro-red text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </motion.span>
            )}
          </motion.button>

          {/* Profile */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-white text-claro-red font-bold flex items-center justify-center hover:shadow-lg transition-shadow"
          >
            {userName.charAt(0).toUpperCase()}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
