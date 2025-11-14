'use client'

import React, { memo } from 'react'

interface MultiModeToggleProps {
  isMultiMode: boolean
  onToggle: () => void
  disabled?: boolean
  itemCount?: number
}

const MultiModeToggleComponent: React.FC<MultiModeToggleProps> = ({
  isMultiMode,
  onToggle,
  disabled = false,
  itemCount = 0,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-light dark:text-text-dark">
            Multi-Scan Mode
          </span>
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {isMultiMode ? 'Scan multiple items' : 'Scan one item at a time'}
          </span>
        </div>
        {isMultiMode && itemCount > 0 && (
          <span className="claro-badge-active animate-pulse">
            {itemCount}
          </span>
        )}
      </div>
      
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-claro-red focus:ring-offset-2 ${
          isMultiMode
            ? 'bg-claro-red shadow-md'
            : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label="Toggle multi-scan mode"
        role="switch"
        aria-checked={isMultiMode}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
            isMultiMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

MultiModeToggleComponent.displayName = 'MultiModeToggle'

export const MultiModeToggle = memo(MultiModeToggleComponent)
