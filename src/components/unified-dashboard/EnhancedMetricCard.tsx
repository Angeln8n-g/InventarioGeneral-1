'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { EnhancedMetricCardProps } from '@/types/unified-dashboard'

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
  orange: {
    icon: 'text-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    trend: 'text-orange-600 dark:text-orange-400',
  },
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  )
}

function TrendIndicator({ value, direction, label }: { value: number; direction: 'up' | 'down' | 'neutral'; label?: string }) {
  const trendColor = direction === 'up' 
    ? 'text-green-600 dark:text-green-400' 
    : direction === 'down' 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-gray-500 dark:text-gray-400'

  return (
    <div className={`flex items-center gap-1 ${trendColor}`}>
      {direction === 'up' && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )}
      {direction === 'down' && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {direction === 'neutral' && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      )}
      <span className="text-sm font-medium">
        {value > 0 ? '+' : ''}{value}%
      </span>
      {label && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          {label}
        </span>
      )}
    </div>
  )
}

export function EnhancedMetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color, 
  onClick, 
  loading = false 
}: EnhancedMetricCardProps) {
  const colors = colorClasses[color]

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
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <div className="mt-2">
                <TrendIndicator 
                  value={trend.value} 
                  direction={trend.direction} 
                  label={trend.label} 
                />
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
      )}

      {/* Click indicator */}
      {onClick && !loading && (
        <div className="absolute bottom-2 right-2">
          <svg 
            className="w-4 h-4 text-gray-400 dark:text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </motion.div>
  )
}
