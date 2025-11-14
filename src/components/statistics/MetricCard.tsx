'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { MetricCardProps } from '@/types/statistics'

const colorClasses = {
  blue: {
    icon: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    icon: 'text-green-500',
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    trend: 'text-green-600 dark:text-green-400',
  },
  yellow: {
    icon: 'text-yellow-500',
    iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    trend: 'text-yellow-600 dark:text-yellow-400',
  },
  red: {
    icon: 'text-red-500',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    trend: 'text-red-600 dark:text-red-400',
  },
  purple: {
    icon: 'text-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    trend: 'text-purple-600 dark:text-purple-400',
  },
}

export function MetricCard({ title, value, icon, trend, color, onClick }: MetricCardProps) {
  const colors = colorClasses[color]

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.direction === 'up') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    }
    if (trend.direction === 'down') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  }

  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        relative p-6 rounded-2xl border-2 
        bg-white dark:bg-gray-800
        transition-all duration-300
        ${colors.border}
        ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${colors.trend}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${colors.iconBg}
        `}>
          <div className={`w-6 h-6 ${colors.icon}`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
