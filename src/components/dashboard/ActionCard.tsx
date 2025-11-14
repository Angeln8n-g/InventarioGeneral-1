'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color?: 'blue' | 'red' | 'green' | 'gray'
  badge?: string | number
  highlight?: boolean
  onClick?: () => void
  disabled?: boolean
}

const colorClasses = {
  blue: {
    icon: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
    badge: 'bg-blue-500 text-white',
  },
  red: {
    icon: 'text-claro-red',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    hoverBorder: 'hover:border-claro-red',
    badge: 'bg-claro-red text-white',
  },
  green: {
    icon: 'text-green-500',
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    hoverBorder: 'hover:border-green-400 dark:hover:border-green-600',
    badge: 'bg-green-500 text-white',
  },
  gray: {
    icon: 'text-gray-500 dark:text-gray-400',
    iconBg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    hoverBorder: 'hover:border-gray-400 dark:hover:border-gray-500',
    badge: 'bg-gray-500 text-white',
  },
}

export function ActionCard({
  icon,
  title,
  description,
  color = 'gray',
  badge,
  highlight = false,
  onClick,
  disabled = false,
}: ActionCardProps) {
  const colors = colorClasses[color]

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full p-6 rounded-2xl border-2 
        bg-white dark:bg-gray-800
        transition-all duration-300
        ${colors.border} ${colors.hoverBorder}
        ${highlight ? 'ring-2 ring-offset-2 ring-' + color + '-500' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}
        group
      `}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className="flex flex-col items-center text-center space-y-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={`
            w-20 h-20 rounded-2xl flex items-center justify-center
            ${colors.iconBg}
            transition-all duration-300
            group-hover:shadow-lg
          `}
        >
          <div className={`w-12 h-12 ${colors.icon} transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </div>
        </motion.div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {/* Hover indicator */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl
        ${colors.iconBg}
        transform scale-x-0 group-hover:scale-x-100
        transition-transform duration-300
      `} />
    </motion.button>
  )
}
