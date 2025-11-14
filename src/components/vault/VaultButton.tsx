'use client'

import React from 'react'
import { useVault } from '@/contexts/VaultContext'

interface VaultButtonProps {
  onClick: () => void
}

export function VaultButton({ onClick }: VaultButtonProps) {
  const { getTotalItems } = useVault()
  const totalItems = getTotalItems()

  // Don't show button if vault is empty
  if (totalItems === 0) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-40 flex items-center justify-center group"
      aria-label={`Vault con ${totalItems} herramientas`}
    >
      {/* Vault Icon */}
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
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
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
        {totalItems} {totalItems === 1 ? 'herramienta' : 'herramientas'} para devolver
      </span>
    </button>
  )
}
