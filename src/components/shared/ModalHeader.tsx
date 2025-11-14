'use client'

import React from 'react'

interface ModalHeaderProps {
  title: string
  onClose: () => void
  showNavigation?: boolean
  currentIndex?: number
  totalItems?: number
  onNavigate?: (direction: 'prev' | 'next') => void
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showNavigation = false,
  currentIndex,
  totalItems,
  onNavigate,
}) => {
  const canNavigatePrev = showNavigation && currentIndex !== undefined && currentIndex > 0
  const canNavigateNext = showNavigation && currentIndex !== undefined && totalItems !== undefined && currentIndex < totalItems - 1

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
          {title}
        </h2>
        
        {showNavigation && currentIndex !== undefined && totalItems !== undefined && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('prev')}
              disabled={!canNavigatePrev}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous item"
              title="Previous (←)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark min-w-[60px] text-center">
              {currentIndex + 1} of {totalItems}
            </span>
            
            <button
              onClick={() => onNavigate?.('next')}
              disabled={!canNavigateNext}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next item"
              title="Next (→)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Close modal"
        title="Close (ESC)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
