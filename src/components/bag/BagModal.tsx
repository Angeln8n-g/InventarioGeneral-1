'use client'

import React from 'react'
import { useBag } from '@/contexts/BagContext'
import { X, Trash2 } from 'lucide-react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface BagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function BagModal({ isOpen, onClose, onConfirm }: BagModalProps) {
  const { items, removeItem, clearBag, getTotalItems } = useBag()

  const totalItems = getTotalItems()

  const handleClearBag = () => {
    if (confirm('¿Estás seguro de que quieres vaciar el bulto?')) {
      clearBag()
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
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
              Mi Bulto
            </h2>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded-full">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Tu bulto está vacío
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Escanea herramientas para agregarlas
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
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        )}
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                          {item.status}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
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
                <span>Confirmar Préstamo</span>
              </button>

              <button
                onClick={handleClearBag}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vaciar Bulto</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </TransitionDialog>
  )
}
