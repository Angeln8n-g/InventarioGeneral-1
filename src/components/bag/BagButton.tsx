'use client'

import React from 'react'
import { useBag } from '@/contexts/BagContext'

interface BagButtonProps {
  onClick: () => void
}

export function BagButton({ onClick }: BagButtonProps) {
  const { getTotalItems } = useBag()
  const totalItems = getTotalItems()

  // Don't show button if bag is empty
  if (totalItems === 0) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-40 flex items-center justify-center group"
      aria-label={`Bulto con ${totalItems} herramientas`}
    >
      {/* Bag Icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {/* Badge with count */}
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          {totalItems}
        </span>
      )}

      {/* Tooltip */}
      <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {totalItems} {totalItems === 1 ? 'herramienta' : 'herramientas'} en bulto
      </span>
    </button>
  )
}
