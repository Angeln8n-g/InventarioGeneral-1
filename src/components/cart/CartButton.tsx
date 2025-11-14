'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface CartButtonProps {
  onClick: () => void
}

export function CartButton({ onClick }: CartButtonProps) {
  const { items, getTotalItems } = useCart()
  const totalItems = getTotalItems()

  if (items.length === 0) return null

  return (
    <button
      onClick={onClick}
      className="bg-red-600 hover:bg-red-900 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-110 group relative"
      aria-label="Ver carrito"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {items.length} {items.length === 1 ? 'item' : 'items'} en el carrito
      </div>
    </button>
  )
}
