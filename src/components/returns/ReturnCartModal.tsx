'use client'

import React, { useState } from 'react'
import { useReturnCart } from '@/contexts/ReturnCartContext'
import { Button } from '@/components/ui/Button'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface ReturnCartModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ReturnCartModal({ isOpen, onClose, onConfirm }: ReturnCartModalProps) {
  const { items, removeItem, updateQuantity, clearCart, totalQuantity } = useReturnCart()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error confirming return:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuantityChange = (id: number, newQuantity: string) => {
    const num = parseInt(newQuantity, 10)
    if (!isNaN(num) && num > 0) {
      updateQuantity(id, num)
    }
  }

  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="scale"
      speed="normal"
      enableHaptics={true}
      className="!max-w-2xl !max-h-[95vh] sm:!max-h-[90vh] flex flex-col !rounded-2xl"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="bg-claro-red/10 dark:bg-claro-red/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-claro-red"
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
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-text-light dark:text-text-dark truncate">
                Carrito de Devolución
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                {items.length} tipo(s) • {totalQuantity} unidades
              </p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {items.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-3 sm:mb-4"
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
              <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
                No hay items en el carrito de devolución
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.consumption_date}`}
                  className="bg-background-light dark:bg-background-dark rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-light dark:text-text-dark text-sm sm:text-base mb-1 truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        <span>Fecha: {item.consumption_date}</span>
                        <span>Máx: {item.max_returnable} {item.unit_of_measure || 'units'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-claro-red hover:text-red-700 transition-colors ml-2 flex-shrink-0"
                      aria-label="Eliminar del carrito"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <span className="text-base sm:text-lg font-bold">−</span>
                    </button>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      min={1}
                      max={item.max_returnable}
                      className="w-16 sm:w-20 text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg px-1 sm:px-2 py-1 text-xs sm:text-sm font-semibold bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark"
                    />

                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.max_returnable}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <span className="text-base sm:text-lg font-bold">+</span>
                    </button>

                    <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                      {item.unit_of_measure || 'units'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-sm sm:text-lg font-semibold text-text-light dark:text-text-dark">
              Total a devolver:
            </span>
            <span className="text-xl sm:text-2xl font-bold text-claro-red">
              {totalQuantity} unidades
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                  clearCart()
                }
              }}
              disabled={items.length === 0 || isProcessing}
              className="flex-1 text-xs sm:text-sm"
            >
              Vaciar Carrito
            </Button>

            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={items.length === 0 || isProcessing}
              className="flex-1 text-xs sm:text-sm"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                `Confirmar (${items.length})`
              )}
            </Button>
          </div>
        </div>
      </div>
    </TransitionDialog>
  )
}
