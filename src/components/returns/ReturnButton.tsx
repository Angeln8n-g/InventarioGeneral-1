'use client'

import React from 'react'
import { useReturnCart } from '@/contexts/ReturnCartContext'

interface ReturnButtonProps {
  onClick: () => void
}

export function ReturnButton({ onClick }: ReturnButtonProps) {
  const { totalItems, totalQuantity } = useReturnCart()

  if (totalItems === 0) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 bg-claro-red hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 flex items-center justify-center group"
      aria-label="Ver carrito de devolución"
    >
      <div className="relative">
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-claro-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </div>
      
      <span className="ml-2 font-medium hidden group-hover:inline-block">
        {totalQuantity} items
      </span>
    </button>
  )
}
