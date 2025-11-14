'use client'

import React from 'react'
import { useVault } from '@/contexts/VaultContext'
import { X, Trash2 } from 'lucide-react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface VaultModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function VaultModal({ isOpen, onClose, onConfirm }: VaultModalProps) {
  const { items, removeItem, clearVault, getTotalItems } = useVault()

  const totalItems = getTotalItems()

  const handleClearVault = () => {
    if (confirm('¿Estás seguro de que quieres vaciar el bulto?')) {
      clearVault()
    }
  }

  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="scale"
      speed="normal"
      enableHaptics={true}
      className="!max-w-md !h-[90vh] flex flex-col !rounded-2xl"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
              Mi bulto
            </h2>
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold px-2 py-1 rounded-full">
              {totalItems}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Tu bulto está vacío
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Escanea herramientas para devolverlas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.tool_id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-light dark:text-text-dark mb-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.serial_number && (
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            #{item.serial_number}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        )}
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                          Prestada
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.tool_id)}
                      className="ml-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 flex-shrink-0">
            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  Total de herramientas:
                </span>
                <span className="font-bold text-text-light dark:text-text-dark">
                  {totalItems}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={onConfirm}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Confirmar Devolución</span>
              </button>

              <button
                onClick={handleClearVault}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vaciar bulto</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </TransitionDialog>
  )
}
